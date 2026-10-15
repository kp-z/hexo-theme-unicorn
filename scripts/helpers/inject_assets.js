/**
 * R-162 S6（round-038）建立，R-200 / R-201（round-039）硬化：
 * 第三方注入统一 —— 声明式注入表读取器（hexo 运行时适配层）
 *
 * 数据源：主题 _config.yml 的 `inject.assets`（YAML 列表），字段见 scripts/lib/inject_assets_core.js。
 *
 * 模板用法（4 处）：
 *   layout/includes/head.pug             !=inject_assets('head')
 *   layout/includes/additional-js.pug    !=inject_assets('bottom')
 *   layout/pages/profile.pug             !=inject_assets('charts')
 *   layout/pages/archive.pug             !=inject_assets('charts')
 *
 * 语义与旧版 inject.head / inject.bottom / inject.echarts_* 逐字节等价：
 * head 槽顺序 = 表内顺序；charts 槽只命中 charts 模板所在页（categories / profile / services）。
 *
 * R-200（校验硬化）：纯逻辑在 scripts/lib/inject_assets_core.js。
 *   - before_generate：全表 validateAssets()，每条 error 落 logger.error，任一 error ⇒ process.exit(-1)
 *     （先例：scripts/events/init.js 的 fail-loud；杜绝 pages → page 之类笔误被静默忽略而退化为全站注入）。
 *   - 渲染期：对当前条目再做 validateItem()，失败 logger.error 后 throw —— 绝不静默输出空串。
 * R-201（覆盖审计）：汇总本次生成的 (条目 ⇒ 页面) 观测，
 *   - warning 点名「从未命中的白名单条目」与「被其它条目覆盖的冗余条目」。
 * R-202 / R-203（round-040）：enabled: false 的条目既不误报「槽位从未被渲染」，
 *   也在构建期被显式点名（含 name 与 enabled: false 事实，走 stderr）。
 *   - 时机：hexo 8.1.2 的 after_generate 早于文件写盘（页面在 console/generate.js
 *     的 writeFile() 里经 route.get() 惰性渲染），故 flush 同时挂 after_generate、
 *     hexo 'exit'、process 'exit' 三处；audit 非空才输出，输出后 clear，不重复告警。
 * R-211（round-041）：双层语义（core fail-closed / helper fail-loud）显式契约，行为零变更：
 *   - core 层（lib/inject_assets_core.js）对不可信 pages 返回 false ⇒ 不注入（绝不静默全站）；
 *   - helper 层（本文件）对非法 pages 一律 logger.error + 终止构建（before_generate 的 process.exit(-1)），
 *     绝不让形态写错的条目进入渲染期；两层互补，测试见 tools/qa/tests/inject-assets.test.mjs 第 ⑯ 组。
 * R-212（round-041）：渲染期兜底分支（failLoud）由 throw 改为 process.exit(-1) ——
 *   hexo 8.1.2 吞掉 route 渲染期异常（仅 throw ⇒ BUILD_RC=0 且 public 仍产出），
 *   兜底必须与 before_generate 同样是「真失败」；测试见同文件第 ⑰ 组。
 * R-213（round-042）：注入**落地**复核 —— 从「配置/渲染期」前移到「产物字节」。
 *   - 生成期记录每个 (条目, 页面) 实际输出的字节（observe 的 rendered / blocks），
 *     core.expectedInjections() 推导「该页该槽位应当出现哪些字节」。
 *   - **挂钩位置（round-042 阻断修复）**：权威复核在**写盘之后**的退出阶段（hexo 'exit' +
 *     process 'exit'）执行 —— 读 hexo.public_dir 下的页面文件，文件不存在（ENOENT）/ 读取异常 /
 *     文件内容为空 / 期望块为空 / 文件里找不到该块 ⇒ 每页 logger.error
 *     "注入缺失：<path> slot=<slot>" + 汇总一行后 process.exit(-1)。
 *   - **为什么不在 after_generate 复核**（hexo 8.1.2 时序，Lead round-042 亲查源码定位）：
 *     node_modules/hexo/dist/hexo/index.js:415-431 的 _generate() = before_generate →
 *     _routerRefresh(_runGenerators()) → after_generate；而写盘 writeFile()
 *     （node_modules/hexo/dist/plugins/console/generate.js:52）在 firstGenerate() 内、
 *     **即 after_generate 之后**；firstGenerate() 只在 public_dir ENOENT 时 mkdirs
 *     （generate.js:121-140），否则不清理旧产物。⇒ 若本轮生成**之前** public_dir 已存在
 *     （增量 / 复跑 / 常驻 server 场景），after_generate 时读到的是**上一次构建的陈旧产物**，
 *     拿它比对本次渲染字节会把「新增页面（文件还没写）/ 注入内容变更 / route 渲染失败」
 *     误判为缺失，并在写盘前 process.exit(-1) 中止构建（假阳性）。
 *     故：模块加载时记录 publicExistedAtLoad（= 本轮生成之前 public_dir 是否存在），
 *     after_generate 只在「加载时 public_dir 不存在」时调用复核（干净首跑，语义不变）；
 *     增量构建的复核由退出阶段在写盘后完成。
 *   - 增量构建的字节等价性（**实测结论：不等价**）：generate.js:74-80 的
 *     "skip generating if hash is unchanged" 比的是**本轮渲染流**的 SHA-1 与 db Cache 中
 *     public/<path> 的 hash —— 相同就不重写文件。但本仓 build.sh 在 hexo 之后还要跑 gulp
 *     （gulpfile.js:43-55 的 htmlclean + html-minifier-terser），它会把已落盘的
 *     `<script type="text/javascript" src="…">` 压缩成 `<script src="…">`。
 *     ⇒ 被跳过的文件盘上字节 ≠ 本轮渲染字节（实测：完整构建后新增一页再 hexo generate，
 *     83/224 页因 type 属性被删而误报缺失）。故 core.missingInjections 的比对会抹平这类
 *     压缩器等价改写（core.normalizeCompareBytes）；资产 URL / 标签本身仍须逐字存在。
 *   - 退出阶段的 cmd 门禁：只在真在生成产物的进程里复核（hexo server / 其它 console 的
 *     public_dir 可能是陈旧产物，且其观测来自被服务的请求 ⇒ 会误报），
 *     程序化调用（hexo.env.cmd === ''）仍复核。
 *   - **已知盲区（Lead round-042 登记为 round-043 残余）**：expectedInjections 只覆盖「本轮渲染中
 *     出现过观测」的页面；route 在 layout/helper 之前就渲染失败（例：hexo 打印
 *     ERROR Render HTML failed 但继续）⇒ 无观测 ⇒ 本机制不捕获，需 route 级检测
 *     （hexo.route.list() vs public_dir 实际文件集），不在 R-213 范围内。
 *     测试见 tools/qa/tests/inject-assets.test.mjs 第 ⑱ 组（18a–18m）与第 ⑲ 组（19a–19e，
 *     after_generate 陈旧产物假阳性回归）。
 */

'use strict'

const fs = require('fs')
const path = require('path')
const logger = (require('hexo-log').default || require('hexo-log').logger)()
const core = require('../lib/inject_assets_core')

const PREFIX = '[inject_assets] '

// R-213 复核保真：注入片段里的 __ROOT__ 占位符由主题 scripts/filters/root_placeholder.js
// 在 after_render:html 阶段展开为 this.config.root（规则：split/join，root 缺省 '/'）。
// 渲染期观测到的是**展开前**的原始字节（实测：font_subset_css 的 href=__ROOT__img/... ⇒
// 产物为 /blog-cn/img/...），直接与产物比对会把 224 个页面全部误判为「注入缺失」。
// 故此处用与过滤器完全相同的规则展开后再登记期望块。
const ROOT_TOKEN = '__ROOT__'

function expandRootToken (str) {
  if (typeof str !== 'string' || str.indexOf(ROOT_TOKEN) === -1) return str
  const cfg = (typeof hexo !== 'undefined' && hexo.config) || {}
  const root = (typeof cfg.root === 'string' && cfg.root.length > 0) ? cfg.root : '/'
  return str.split(ROOT_TOKEN).join(root)
}

// 生成期页面观测：条目 index → { index, name, slot, enabled, pages, hits: Map(pageKey → ids),
//                                     blocks: Map(pageKey → 该条在该页实际输出的字节) }
const audit = new Map()

function observe (index, item, page, ids, rendered) {
  let rec = audit.get(index)
  if (!rec) {
    rec = {
      index: index,
      name: item && item.name,
      slot: item && item.slot,
      enabled: item && item.enabled,
      pages: item && item.pages,
      hits: new Map(),
      blocks: new Map()
    }
    audit.set(index, rec)
  }
  const key = (page && typeof page.path === 'string' && page.path !== '') ? page.path : '(unknown)'
  if (!rec.hits.has(key)) rec.hits.set(key, ids)
  // R-213：同一页可能被渲染多次（route.get 惰性渲染无缓存），只保留首个非空字节，
  // 避免把期望块翻倍导致误判；真被抑制（全部为空）时保持 ''，由复核判为缺失。
  const bytes = (typeof rendered === 'string') ? rendered : ''
  if (!rec.blocks.has(key) || (rec.blocks.get(key) === '' && bytes !== '')) rec.blocks.set(key, bytes)
}

function failLoud (errors) {
  errors.forEach(function (e) { logger.error(PREFIX + e) })
  // R-212（round-041）：渲染期兜底分支必须**真的失败** —— hexo 8.1.2 会吞掉 route
  // 渲染期异常（tester M12 实测：before_generate 注册缺失时，仅 throw ⇒ BUILD_RC=0
  // 且 public 照常产出），故与 before_generate 的 process.exit(-1) 语义保持一致：
  // 记完 logger.error 后直接终止进程。hexo server --watch 下同样终止，与
  // before_generate 行为一致，属预期（宁可中断，也不静默产出缺注入的页面）。
  logger.error(PREFIX + '条目校验失败：拒绝静默输出（R-200），终止构建（R-212）')
  process.exit(-1)
}

hexo.extend.helper.register('inject_assets', function (slot) {
  const inject = (this.theme && this.theme.inject) || {}
  const assets = Array.isArray(inject.assets) ? inject.assets : []
  if (!slot || assets.length === 0) return ''
  const page = this.page
  const ids = core.pageIds(page)
  const out = []
  // R-205：候选集只取自 core.candidateAssets（槽位 + 停用语义的唯一实现），本文件不再重复过滤。
  // 观测范围 = 全部候选（含白名单未命中者），覆盖审计才能点名「从未生效」的条目。
  core.candidateAssets(assets, slot).forEach(function (hit) {
    const res = core.validateItem(hit.item, hit.index)
    if (res.errors.length) failLoud(res.errors)
    const matched = core.matchPages(hit.item.pages, ids)
    // R-213：同一份字节先记观测、再决定是否输出 —— 观测与产物都取自同一次 renderAsset()，
    // 因此「被抑制的输出」（观测非空、产物缺块）与「被抑制的注入」（观测为空）都能被发现。
    const rendered = core.renderAsset(hit.item)
    observe(hit.index, hit.item, page, matched ? ids : [], matched ? rendered : '')
    if (matched) out.push(rendered)
  })
  return out.join('')
})

// R-200：生成前全表校验（每条 error 落日志；任一 error 终止构建）
hexo.extend.filter.register('before_generate', function () {
  const themeConfig = hexo.theme.config || {}
  const inject = themeConfig.inject || {}
  const res = core.validateAssets(inject.assets)
  res.warnings.forEach(function (w) { logger.warn(PREFIX + w) })
  if (res.errors.length) {
    res.errors.forEach(function (e) { logger.error(PREFIX + e) })
    logger.error(PREFIX + 'inject.assets 校验失败：共 ' + res.errors.length + ' 条 error，终止构建（R-200）')
    process.exit(-1)
  }
})

// R-201：覆盖审计（从未命中 + 冗余白名单条目）
//
// 时序事实（hexo 8.1.2）：_generate() 先 execFilter('after_generate')，之后
// plugins/console/generate.js 才用 route.get(path) 惰性渲染并写盘 ⇒ 触发
// after_generate 时本进程可能尚未渲染任何页面（audit 为空，告警会漏报）。
// 因此 audit 非空才 flush，并在 after_generate / hexo 'exit' / process 'exit'
// 三处各挂一次；flush 后 clear，多次触发不会重复告警。
// 表内带白名单、但本次生成连槽位都没被渲染过的条目（例如 pages 写错、槽位未被模板调用）
function unrenderedEntries (observations) {
  const assets = themeAssets()
  if (assets.length === 0 || observations.length === 0) return []
  const seen = {}
  observations.forEach(function (o) { seen[String(o.index)] = true })
  const out = []
  assets.forEach(function (item, i) {
    if (seen[String(i)]) return
    if (!item || typeof item !== 'object') return
    if (item.enabled === false) return // R-202：停用 ≠ 从未命中，交给 disabledEntries() 点名
    if (!Array.isArray(item.pages) || item.pages.length === 0) return
    out.push('inject.assets[' + i + ']' + ((typeof item.name === 'string' && item.name !== '') ? ' "' + item.name + '"' : '') +
      '（slot: ' + item.slot + '）本次生成未被任何页面渲染该槽位 ⇒ 从未命中（检查槽位是否被模板调用）')
  })
  return out
}

// 主题表（含 enabled:false 条目）—— R-203 点名的数据源
function themeAssets () {
  const themeConfig = (typeof hexo !== 'undefined' && hexo.theme && hexo.theme.config) || {}
  const inject = themeConfig.inject || {}
  return Array.isArray(inject.assets) ? inject.assets : []
}

let disabledReported = false

// R-213：把 audit（Map）转成 core 侧观测结构（含 enabled 与每页实际字节）
function observationsOf () {
  const observations = []
  audit.forEach(function (rec) {
    observations.push({
      index: rec.index,
      name: rec.name,
      slot: rec.slot,
      enabled: rec.enabled,
      pages: rec.pages,
      hits: Array.from(rec.hits.entries()).map(function (pair) {
        return { pageKey: pair[0], ids: pair[1] }
      }),
      blocks: Array.from(rec.blocks.entries()).map(function (pair) {
        return { pageKey: pair[0], rendered: expandRootToken(pair[1]) }
      })
    })
  })
  return observations
}

// flush 会清空 audit，故复核用累计快照（同一条目同一页在 core.expectedInjections 里按下标去重）
let lastObservations = []

function snapshotObservations () {
  if (audit.size > 0) lastObservations = lastObservations.concat(observationsOf())
  return lastObservations
}

// R-213：产物复核。write(msg) 负责落盘（退出阶段用 fs.writeSync 同步写）。
// 只复核一次：失败路径会先经 hexo 'exit' 再经 process 'exit'（process.exit(-1) 之后仍会跑
// process 退出钩子），否则同一批缺失会被打印两遍。
let verifiedOnce = false

function verifyInjections (write) {
  if (verifiedOnce) return
  const publicDir = (typeof hexo !== 'undefined' && typeof hexo.public_dir === 'string') ? hexo.public_dir : ''
  if (publicDir === '') return
  let hasPublic = false
  try { hasPublic = fs.existsSync(publicDir) } catch (err) { hasPublic = false }
  // 退出阶段不额外加存在性门禁（写盘已由 firstGenerate() 完成）；这里只是兜底：
  // public_dir 缺失 ⇒ 无产物可比 ⇒ 跳过不崩（干净首跑、被清理过的树等）。
  if (!hasPublic) return
  const expected = core.expectedInjections(snapshotObservations())
  // 还没产生任何观测（after_generate 早于渲染）⇒ 不置位，留给退出阶段复核
  if (expected.length === 0) return
  verifiedOnce = true
  // 产物路径映射（实测坑）：观测用的 page.path 与 hexo 路由写盘路径并不总是同一个字符串 ——
  // 文章页 page.path = 'posts/<id>/'（目录形态），而 hexo 写的是 public/posts/<id>/index.html；
  // 直接 join 会命中目录（EISDIR）而误报整站缺失。故按「原样 → <path>/index.html」依次尝试。
  const missing = core.missingInjections(expected, function (rel) {
    const clean = rel.replace(/^\/+/, '')
    const candidates = [clean]
    if (/\/$/.test(clean)) candidates.push(clean + 'index.html')
    else if (!/\.[A-Za-z0-9]+$/.test(clean)) candidates.push(clean + '/index.html')
    for (let i = 0; i < candidates.length; i++) {
      try {
        return fs.readFileSync(path.join(publicDir, candidates[i]), 'utf8')
      } catch (err) { /* 继续尝试下一个候选；全部失败才按缺失处理 */ }
    }
    return null // ENOENT / EISDIR / 权限 / 读取异常一律按缺失处理（Lead round-042 要求 ①）
  })
  if (missing.length === 0) return
  missing.forEach(function (m) {
    write(PREFIX + '注入缺失：' + m.path + ' slot=' + m.slot)
  })
  const sample = missing.slice(0, 5).map(function (m) { return m.path + ' slot=' + m.slot }).join('；')
  write(PREFIX + '注入缺失汇总：共 ' + missing.length + ' 处（清单前 ' + Math.min(5, missing.length) + ' 条：' + sample + '），终止构建（R-213）')
  process.exit(-1)
}

// R-213：退出阶段只在「真在写产物的 console」里复核 —— hexo server / 其它 console 的
// public_dir 可能是上一次构建的陈旧产物，且其渲染观测来自被服务的请求 ⇒ 会误报。
// 程序化调用（hexo.env.cmd === ''）与 hexo generate / hexo g 仍复核。
function isGenerateConsole () {
  const env = (typeof hexo !== 'undefined' && hexo.env) || {}
  const cmd = (typeof env.cmd === 'string') ? env.cmd : ''
  if (cmd === '') return true
  return /^(g|generate)$/.test(cmd)
}

function flushAudit (write) {
  const messages = []
  // R-203：显式停用条目点名 —— 只在真有 enabled:false 条目时输出，且整个进程只输出一次（幂等，
  // 不污染干净构建的 0 输出纪律：无停用条目 ⇒ messages 不含停用点名）。
  if (!disabledReported) {
    disabledReported = true
    core.disabledEntries(themeAssets()).forEach(function (w) { messages.push(PREFIX + w) })
  }
  if (audit.size > 0) {
    const observations = snapshotObservations()
    core.neverMatchedEntries(observations).forEach(function (w) { messages.push(PREFIX + w) })
    core.redundantEntries(observations).forEach(function (w) { messages.push(PREFIX + w) })
    unrenderedEntries(observations).forEach(function (w) { messages.push(PREFIX + w) })
    audit.clear()
  }
  messages.forEach(write)
}

// R-213（round-042 阻断修复）：**本轮生成之前** public_dir 是否已存在。hexo 8.1.2 的写盘
// （console/generate.js 的 writeFile）发生在 after_generate 之后，且 firstGenerate() 不清理
// 已存在的 public_dir ⇒ 加载时已存在就意味着 after_generate 阶段读到的都是上一轮的陈旧产物，
// 不能用于比对本次渲染字节（否则增量构建会假阳性并中止在写盘前）。判据在模块加载时求值一次。
const publicExistedAtLoad = (function () {
  try {
    return typeof hexo !== 'undefined' && typeof hexo.public_dir === 'string' && hexo.public_dir !== '' && fs.existsSync(hexo.public_dir)
  } catch (err) {
    return false
  }
})()

hexo.extend.filter.register('after_generate', function () {
  flushAudit(function (msg) { logger.warn(msg) })
  // R-213：after_generate 早于写盘，只在「加载时 public_dir 不存在」的干净首跑里调用
  // （此时 public_dir 仍不存在，复核自然跳过、不崩）；增量构建留到退出阶段在写盘后复核。
  if (publicExistedAtLoad) return
  verifyInjections(function (msg) { logger.error(msg) })
})

// 兜底：退出阶段只能用同步写，保证告警/错误一定落到 stderr（与 hexo-log 的 WARN/ERROR 同流）。
function flushAtExit () {
  flushAudit(function (msg) {
    try {
      fs.writeSync(process.stderr.fd, 'WARN  ' + msg + '\n')
    } catch (e) { /* stderr 不可写时忽略，绝不影响退出码 */ }
  })
  if (!isGenerateConsole()) return
  // R-213：写盘发生在 after_generate 之后（console/generate.js 的 writeFile），
  // 故真正的落地复核在退出阶段；这里能读到刚写出的产物。注意增量构建中被跳过的文件
  // （generate.js:74-80 hash 相同 / generate.js:33-45 route 未修改）盘上字节 **不等于** 本轮
  // 渲染字节（build.sh 的 gulp 压缩改写过它们），故 core.missingInjections 会先做归一化比对。
  verifyInjections(function (msg) {
    try {
      fs.writeSync(process.stderr.fd, 'ERROR ' + msg + '\n')
    } catch (e) { /* stderr 不可写时忽略，进程仍以非 0 退出 */ }
  })
}

if (typeof hexo.on === 'function') hexo.on('exit', flushAtExit)
process.on('exit', flushAtExit)
