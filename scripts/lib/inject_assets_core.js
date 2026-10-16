/**
 * R-200 / R-201（round-039）：inject.assets 声明式注入表 —— 纯逻辑核心
 *
 * 本模块**不引用全局 hexo**，可被 `node -e "require('…/scripts/lib/inject_assets_core.js')"` 直接加载，
 * 因此校验 / 渲染 / 审计逻辑可脱离构建单测（见 tools/qa/tests/inject-assets.test.mjs）。
 * hexo 运行时由 scripts/helpers/inject_assets.js require 使用。
 *
 * pageIds / matchPages / renderAsset 迁出自 R-162 S6 的 scripts/helpers/inject_assets.js（逐字等价）。
 *
 * 数据源：主题 _config.yml 的 `inject.assets`（YAML 列表），每项字段：
 *   name     —— 可读标识（仅用于阅读/排障）
 *   slot     —— KNOWN_SLOTS 之一（模板按槽位取用）
 *   html     —— 原样注入的 HTML 串（与 src / href 三选一）
 *   src      —— 生成 <script type="text/javascript" src="..."></script>
 *   href+rel —— 生成 <link href="..." rel="...">（rel 缺省 stylesheet）
 *   pages    —— 页面白名单，缺省 = 全站。页面身份 = page.path 去掉前导斜杠与
 *               /index.html 后的串，或 page.view / page.type 命中
 *   enabled  —— false 时跳过（缺省启用）
 *
 * R-200：validateAssets() 把「未知键静默忽略 / 槽位拼错永不输出」变成生成期 fail-loud。
 * R-201：neverMatchedEntries() / redundantEntries() 基于生成期页面观测给出白名单「从未命中」与
 *        「被其它条目覆盖」告警（例：echarts.pages 单列 services 时，服务页已由 view: profile 覆盖）。
 *
 * R-211（round-041）：**两层语义显式契约**（行为零变更，仅把既有语义写成注释与测试）：
 *   - core 层（本模块，可被 `node -e "require(…)"` 纯直调）：对不可信输入一律 fail-closed ——
 *     pages 非数组（字符串 / 数字 / 对象）⇒ matchPages() 返回 false ⇒ 该条不注入（绝不静默退化为全站注入）；
 *     pages 缺省（undefined / null）或 [] ⇒ 返回 true（语义上就是「全站」，不算错误输入）。
 *   - helper 层（scripts/helpers/inject_assets.js）：before_generate 用 validateAssets() / validateItem() 校验，
 *     非法 pages（非数组、元素非字符串 / 空串）⇒ ERROR + 终止构建（process.exit(-1)），渲染期再 failLoud。
 *   - 互补关系：core 保证「即使没有前置校验也不会误注入」，helper 保证「配置写错就当场失败」。
 *     两层契约的测试见 tools/qa/tests/inject-assets.test.mjs 第 ⑯ 组（16a–16e）。
 *
 * R-213（round-042）：注入**落地**复核（从「配置/渲染期」前移到「产物字节」）：
 *   - expectedInjections(observations)：由生成期观测推导「应有注入」清单 [{path, slot, rendered}]，
 *     rendered = 该页该 slot 命中条目的实际注入字节按条目下标拼接（与 helper 一次输出的整块一致）。
 *   - missingInjections(expected, readFileFn)：readFileFn(path) 返回字符串或 null（读不到）；文件不存在
 *     （ENOENT）/ 读取异常 / 文件内容为空 / 期望块为空 / 文件里找不到该块字节 ⇒ 记缺失 [{path, slot}]。
 *   - **接线时序**：本模块只做纯函数推导；实际复核由 helper 在**写盘之后**的退出阶段执行。
 *     hexo 8.1.2 的 _generate()（hexo/dist/hexo/index.js:415-431）在 after_generate 就返回，
 *     写盘在 console/generate.js 的 firstGenerate() 内（:52）⇒ after_generate 时若 public_dir
 *     已存在，读到的是上一轮陈旧产物，用它比对本次渲染字节会产生假阳性并把构建中止在写盘前。
 *     测试见同文件第 ⑱ 组（18a–18m）与第 ⑲ 组（19a–19e）。
 *   - **已知盲区（Lead round-042 登记为 round-043 残余，本模块不扩范围）**：expectedInjections() 只覆盖
 *     「本轮渲染中出现过观测」的页面；若某 route 在 layout/helper 之前就渲染失败、或根本没产出观测
 *     （例：hexo 对 posts/<id>/index.html 打印 ERROR Render HTML failed 但构建继续），该页面不会进入
 *     expected ⇒ 本机制捕获不到。此类缺口需由 route 级检测覆盖（hexo 路由表与实际 public_dir
 *     文件集对比），不在 R-213 范围内。
 *
 * R-219（round-044）：**文档级**产物核对 —— 补 R-214 的第二类盲区（route 被静默丢弃 / 从未注册）。
 *   - R-214 只遍历路由表（hexo route.list()）：route 不在路由表里、盘上也没有产物时，R-213 没有观测、
 *     R-214 没有 route ⇒ 全链条静默（构建 RC=0 且打印「完成」）。
 *   - docOutputPath(docPath)：文档 path → 产物相对路径（规则见函数上方注释；本仓
 *     posts 52（trailingSlash）/ tags 74（trailingSlash）/ categories 20（trailingSlash）/
 *     pages 35（hasExt，含 skip_render 的 js/*.js、*.json）实测全覆盖）。
 *   - missingDocOutputs(entries, routeSet, statFn)：entries = [{path, kind}]；产物路径命中
 *     routeSet 的条目跳过（该 route 已由 R-214 核对，避免同一缺失报两遍）；**只判存在性与
 *     size > 0，不做内容比较**（增量 generate 时盘上字节可能来自上一轮：gulp 后处理 + hexo
 *     "Skip generating if hash is unchanged"，node_modules/hexo/dist/plugins/console/generate.js:74-80）。
 *   - **接线时序**：与 R-214 相同 —— 纯函数在本模块，实际核对由 helper 在写盘之后的退出阶段执行。
 *     测试见 tools/qa/tests/inject-assets.test.mjs 第 ㉔ 组（24a–24h）。
 */

'use strict'

// 模板实际取用的槽位（layout/includes/head.pug:81、layout/includes/additional-js.pug:52、
// layout/pages/profile.pug:129-131、layout/pages/archive.pug:35-37）
const KNOWN_SLOTS = ['head', 'bottom', 'charts']

// 条目允许的键（其余键一律报错，避免 pages → page 这类笔误被静默忽略并退化为全站注入）
// R-277：pjax 布尔字段（只对 src 形式有意义）⇒ 产物带 data-pjax，由主题 pjax.pug 重建执行。
const ALLOWED_KEYS = ['name', 'slot', 'html', 'src', 'href', 'rel', 'pages', 'enabled', 'pjax']

// 当前页面的身份集合：page.path 去掉前导斜杠与 /index.html 后的路径串 + page.view + page.type
function pageIds (page) {
  const ids = []
  if (!page) return ids
  const p = typeof page.path === 'string' ? page.path : ''
  ids.push(p.replace(/^\/+/, '').replace(/\/?index\.html$/, ''))
  if (page.view) ids.push(String(page.view))
  if (page.type) ids.push(String(page.type))
  return ids.filter(function (id) { return id !== '' })
}

// R-204（fail-closed）：pages 缺省（undefined/null）或空列表 = 全站；**非数组不再静默 true** ——
// 形态错误由 validateItem() 报 error，这里返回 false，杜绝「形态写错 ⇒ 悄悄全站注入」。
// core 可能被单独调用（无 helper 前置校验），故此实现必须自洽。
function matchPages (pages, ids) {
  if (pages === undefined || pages === null) return true
  if (!Array.isArray(pages)) return false
  if (pages.length === 0) return true
  return pages.some(function (p) { return ids.indexOf(String(p)) !== -1 })
}

function renderAsset (item) {
  if (typeof item.html === 'string') return item.html
  if (typeof item.src === 'string') {
    return '<script type="text/javascript" src="' + item.src + '"' +
      (item.pjax === true ? ' data-pjax' : '') + '></script>'
  }
  if (typeof item.href === 'string') {
    return '<link href="' + item.href + '" rel="' + (item.rel || 'stylesheet') + '">'
  }
  return ''
}

// R-205：候选条目 = slot 命中 且 enabled 未显式关闭（**唯一**的槽位/停用过滤实现，不含白名单判定）。
// 返回 [{ index, item }]，index 供告警与观测定位（inject.assets[i]）。
function candidateAssets (assets, slot) {
  const out = []
  if (!Array.isArray(assets) || !slot) return out
  assets.forEach(function (item, index) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return
    if (item.slot !== slot) return
    if (item.enabled === false) return
    out.push({ index: index, item: item })
  })
  return out
}

// 按槽位选条目：候选 ∩ pages 白名单命中（helper 的渲染集与审计候选集都由此派生，避免重复实现）
function selectAssets (assets, slot, ids) {
  return candidateAssets(assets, slot).filter(function (hit) {
    return matchPages(hit.item.pages, ids)
  })
}

function typeName (value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function itemLabel (item, index) {
  const nm = (item && typeof item.name === 'string' && item.name !== '') ? ' "' + item.name + '"' : ''
  return 'inject.assets[' + index + ']' + nm
}

// 单条校验：返回 { errors, warnings }（R-200）
function validateItem (item, index) {
  const errors = []
  const warnings = []
  const label = itemLabel(item, index)
  if (item === null || typeof item !== 'object' || Array.isArray(item)) {
    errors.push(label + ': 条目必须是 mapping（键值表），当前为 ' + typeName(item))
    return { errors: errors, warnings: warnings }
  }
  Object.keys(item).forEach(function (key) {
    if (ALLOWED_KEYS.indexOf(key) === -1) {
      errors.push(label + ': 未知键 "' + key + '"（允许：' + ALLOWED_KEYS.join(',') + '）')
    }
  })
  if (item.slot === undefined || item.slot === null || item.slot === '') {
    errors.push(label + ': 缺 slot（允许：' + KNOWN_SLOTS.join(',') + '）')
  } else if (typeof item.slot !== 'string') {
    errors.push(label + ': slot 必须是字符串，当前为 ' + typeName(item.slot))
  } else if (KNOWN_SLOTS.indexOf(item.slot) === -1) {
    errors.push(label + ': slot "' + item.slot + '" 未知（允许：' + KNOWN_SLOTS.join(',') + '）⇒ 该条永不输出')
  }
  const hasHtml = item.html !== undefined && item.html !== null
  const hasSrc = item.src !== undefined && item.src !== null
  const hasHref = item.href !== undefined && item.href !== null
  if ((hasHtml && (hasSrc || hasHref)) || (hasSrc && hasHref)) {
    errors.push(label + ': html / src / href 只能提供其一（当前 html=' + hasHtml + ', src=' + hasSrc + ', href=' + hasHref + '）')
  } else if (!hasHtml && !hasSrc && !hasHref) {
    errors.push(label + ': html / src / href 至少提供一个（否则该条不输出任何内容）')
  }
  if (hasHtml && typeof item.html !== 'string') {
    errors.push(label + ': html 必须是字符串，当前为 ' + typeName(item.html))
  }
  if (hasSrc && typeof item.src !== 'string') {
    errors.push(label + ': src 必须是字符串，当前为 ' + typeName(item.src))
  }
  if (hasHref && typeof item.href !== 'string') {
    errors.push(label + ': href 必须是字符串，当前为 ' + typeName(item.href))
  }
  if (item.rel !== undefined && item.rel !== null && typeof item.rel !== 'string') {
    errors.push(label + ': rel 必须是字符串，当前为 ' + typeName(item.rel))
  }
  if (item.pages !== undefined && item.pages !== null) {
    if (!Array.isArray(item.pages)) {
      errors.push(label + ': pages 必须是 YAML 序列（列表），当前为 ' + typeName(item.pages) + '；若为键名笔误（如 page:），该未知键会另行报错')
    } else {
      item.pages.forEach(function (p, j) {
        if (typeof p !== 'string' || p === '') {
          errors.push(label + ': pages[' + j + '] 必须是非空字符串，当前为 ' + typeName(p))
        }
      })
    }
  }
  if (item.enabled !== undefined && item.enabled !== null && typeof item.enabled !== 'boolean') {
    errors.push(label + ': enabled 必须是布尔值（true/false），当前为 ' + typeName(item.enabled))
  }
  if (item.pjax !== undefined && item.pjax !== null && typeof item.pjax !== 'boolean') {
    errors.push(label + ': pjax 必须是布尔值（true/false），当前为 ' + typeName(item.pjax))
  } else if (item.pjax === true && !hasSrc) {
    errors.push(label + ': pjax: true 只对 src 形式有意义（html 内联 / href 样式表无法由 pjax.pug 重建）')
  }
  if (item.name === undefined || item.name === null || item.name === '') {
    warnings.push(label + ': 建议补 name（告警与排障定位用）')
  }
  return { errors: errors, warnings: warnings }
}

// 全表校验：条目非列表 / 条目非 mapping → error；返回 { errors, warnings }
function validateAssets (assets) {
  const errors = []
  const warnings = []
  if (assets === undefined || assets === null) return { errors: errors, warnings: warnings }
  if (!Array.isArray(assets)) {
    errors.push('inject.assets: 必须是 YAML 序列（列表），当前为 ' + typeName(assets))
    return { errors: errors, warnings: warnings }
  }
  assets.forEach(function (item, i) {
    const res = validateItem(item, i)
    res.errors.forEach(function (e) { errors.push(e) })
    res.warnings.forEach(function (w) { warnings.push(w) })
  })
  return { errors: errors, warnings: warnings }
}

function normalizeObservations (observations) {
  return (Array.isArray(observations) ? observations : []).map(function (o) {
    const src = (o && typeof o === 'object') ? o : {}
    // R-213：额外保留 enabled（停用条目不算「应有注入」）与 blocks（该条在每个页面上实际输出的字节）
    return {
      index: src.index,
      name: src.name,
      slot: src.slot,
      enabled: src.enabled,
      pages: Array.isArray(src.pages) ? src.pages : [],
      hits: Array.isArray(src.hits) ? src.hits : [],
      blocks: Array.isArray(src.blocks) ? src.blocks.map(function (b) {
        const s = (b && typeof b === 'object') ? b : {}
        return {
          pageKey: (s.pageKey === undefined || s.pageKey === null) ? '' : String(s.pageKey),
          rendered: (typeof s.rendered === 'string') ? s.rendered : ''
        }
      }) : []
    }
  })
}

function entryLabel (o) {
  return 'inject.assets[' + o.index + ']' + ((typeof o.name === 'string' && o.name !== '') ? ' "' + o.name + '"' : '')
}

// 命中该白名单条目的页面集合（pageKey 去重）
function hitsFor (o, entry) {
  const keys = []
  o.hits.forEach(function (h) {
    if (!h || !Array.isArray(h.ids)) return
    if (h.ids.indexOf(entry) === -1) return
    const key = (h.pageKey === undefined || h.pageKey === null) ? '(unknown)' : String(h.pageKey)
    if (keys.indexOf(key) === -1) keys.push(key)
  })
  return keys
}

// 从未命中的白名单条目（有白名单但本次生成没有任何页面命中它）
function neverMatchedEntries (observations) {
  const out = []
  normalizeObservations(observations).forEach(function (o) {
    if (o.pages.length === 0) return
    o.pages.forEach(function (entry) {
      if (hitsFor(o, entry).length !== 0) return
      out.push(entryLabel(o) + ' pages 中的 "' + entry + '" 本次生成 0 页命中（该白名单条目从未生效：请删除，或明确它依赖的 page.view / page.type）')
    })
  })
  return out
}

// 冗余白名单条目：条目 p 冗余 ⟺ 命中 p 的页面集合非空且 ⊆ 命中另一条目 q（q≠p）的集合
function redundantEntries (observations) {
  const out = []
  normalizeObservations(observations).forEach(function (o) {
    if (o.pages.length < 2) return
    o.pages.forEach(function (entry) {
      const mine = hitsFor(o, entry)
      if (mine.length === 0) return
      const coveredBy = o.pages.filter(function (other) { return other !== entry })
        .filter(function (other) {
          const theirs = hitsFor(o, other)
          if (theirs.length === 0) return false
          return mine.every(function (k) { return theirs.indexOf(k) !== -1 })
        })
      if (coveredBy.length === 0) return
      const q = coveredBy[0]
      out.push(entryLabel(o) + ' pages 中的 "' + entry + '" 已被 "' + q + '" 覆盖（命中页集合 ⊆ "' + q + '" 的命中页集合：' + mine.join(', ') + '）⇒ 冗余，可删除')
    })
  })
  return out
}

// R-203：显式停用（enabled === false）的条目点名 —— 停用不等于「从未命中」，
// 但也不能完全沉默：构建期必须能看见「这条为什么不注入」。
function disabledEntries (assets) {
  const out = []
  if (!Array.isArray(assets)) return out
  assets.forEach(function (item, i) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return
    if (item.enabled !== false) return
    out.push(itemLabel(item, i) + '（slot: ' + item.slot + '）enabled: false ⇒ 该条已显式停用，本次生成不注入任何页面')
  })
  return out
}

// R-213：由生成期观测推导「应有注入」清单。
// 观测结构（helper observe()）：
//   { index, name, slot, enabled, pages:[白名单条目], hits:[{pageKey, ids:[该页身份]}], blocks:[{pageKey, rendered}] }
// 「应有注入」= 某条目在某页命中（hits.ids 非空，即该页身份落进白名单 / 该条无白名单=全站）
// 且该条未被 enabled:false 停用 ⇒ 该页该 slot 应当出现该条实际输出的字节。
// 同一 (path, slot) 的多个条目按 index 升序拼接（与 helper 一次输出的整块字节一致）。
// 盲区见文件头 R-213 段：只有「本轮渲染中出现过观测」的页面才会进入清单。
function expectedInjections (observations) {
  const buckets = {}   // key: path + '\u0000' + slot → [{ index, rendered }]
  const order = []
  normalizeObservations(observations).forEach(function (o) {
    if (o.enabled === false) return
    const slot = (typeof o.slot === 'string' && o.slot !== '') ? o.slot : ''
    if (slot === '') return
    const idx = (typeof o.index === 'number' && isFinite(o.index)) ? o.index : Number.MAX_SAFE_INTEGER
    o.hits.forEach(function (h) {
      if (!h || !Array.isArray(h.ids) || h.ids.length === 0) return
      const path = (h.pageKey === undefined || h.pageKey === null) ? '' : String(h.pageKey)
      if (path === '' || path === '(unknown)') return
      let rendered = ''
      o.blocks.some(function (blk) {
        if (blk.pageKey !== path) return false
        rendered = blk.rendered
        return true
      })
      const key = path + '\u0000' + slot
      if (!buckets[key]) { buckets[key] = []; order.push(key) }
      // 同一条目（index）在同一页只算一次：helper 的观测快照可能跨多次 flush 累积
      if (buckets[key].some(function (it) { return it.index === idx })) return
      buckets[key].push({ index: idx, rendered: rendered })
    })
  })
  return order.map(function (key) {
    const parts = key.split('\u0000')
    const items = buckets[key].slice().sort(function (x, y) { return x.index - y.index })
    return {
      path: parts[0],
      slot: parts[1],
      rendered: items.map(function (it) { return it.rendered }).join('')
    }
  })
}

// R-213：产物复核。readFileFn(path) 必须返回文件字符串或 null（读不到）。
// 缺失判定（Lead round-042 补充要求 ① —— 读不到一律算缺失，绝不跳过）：
//   file-missing —— 返回值非字符串（ENOENT / 读取异常 / 未提供读取器）
//   file-empty   —— 文件内容为空串
//   block-empty  —— 期望块本身为空（渲染被抑制，例：M13 让 renderAsset 返回 ''）
//   block-absent —— 文件里找不到期望的注入字节
// 返回去重后的 [{ path, slot }]（路径为空 / 非字符串的期望项跳过）。
//
// 为什么比对前要归一化（round-042 阻断修复实测得的第二个缺陷）：
//   站点流水线 build.sh 在 hexo 写盘之后还要跑 gulp（gulpfile.js:43-55）：htmlclean() +
//   html-minifier-terser（removeScriptTypeAttributes / removeStyleLinkTypeAttributes /
//   collapseWhitespace）。它把已落盘的 `<script type="text/javascript" src="…">` 改写成
//   `<script src="…">`；而 hexo 的增量写盘有 "Skip generating if hash is unchanged"
//   （hexo/dist/plugins/console/generate.js:74-80），hash 与 db Cache 相同就**不重写**该文件
//   ⇒ 盘上留着压缩后的字节。于是「跳过重写 ⇒ 盘上字节 == 本次渲染字节」这个前提在本仓
//   不成立（实测：完整构建后新增一页再 hexo generate，83/224 页会因 type 被删而误报缺失）。
//   归一化只抹平 html-minifier 会做的等价改写（script 的 type="text/javascript"、
//   style/link 的 type="text/css"、连续空白折叠），**资产 URL / 标签本身仍必须逐字存在**，
//   故「块真的没落盘」依旧会被判缺失（M13、清空文件、删文件等负例不变）。
function normalizeCompareBytes (str) {
  return String(str)
    .replace(/\s+type=(?:"text\/javascript"|'text\/javascript'|text\/javascript)(?=\s|>)/gi, '')
    .replace(/\s+type=(?:"text\/css"|'text\/css'|text\/css)(?=\s|>)/gi, '')
    // R-277：cheerio 重序列化会把裸属性写成 data-pjax=""（posts-chart.js 只对 categories 页重排），
    // 二者 DOM 语义等价 ⇒ 比对前统一成裸属性，避免把「写法差异」误判成注入缺失。
    .replace(/\s+data-pjax=(""|'')/g, ' data-pjax')
    // 注入块在产物里可能被换行/缩进隔开（期望串是各块直接拼接），故先抹平「标签之间」的空白，
    // 再折叠标签内空白 —— 块之间若夹着别的内容，仍不会被判为命中。
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim()
}

function missingInjections (expected, readFileFn) {
  const out = []
  const seen = {}
  const read = (typeof readFileFn === 'function') ? readFileFn : function () { return null }
  if (!Array.isArray(expected)) return out
  expected.forEach(function (e) {
    if (!e || typeof e !== 'object') return
    const filePath = (typeof e.path === 'string') ? e.path : ''
    const slot = (typeof e.slot === 'string') ? e.slot : ''
    if (filePath === '') return
    const want = (typeof e.rendered === 'string') ? e.rendered : ''
    let content = null
    try { content = read(filePath) } catch (err) { content = null }
    let bad = false
    if (typeof content !== 'string') bad = true              // 文件不存在（ENOENT）/ 读取异常
    else if (content === '') bad = true                      // 文件内容为空
    else if (want === '') bad = true                         // 期望块为空（渲染被抑制）
    // 先逐字比对；不中再用「压缩器等价改写」归一化比对（见上方说明），资产 URL 仍须逐字存在。
    else if (content.indexOf(want) === -1 &&
             normalizeCompareBytes(content).indexOf(normalizeCompareBytes(want)) === -1) bad = true
    if (!bad) return
    const key = filePath + '\u0000' + slot
    if (seen[key]) return
    seen[key] = true
    out.push({ path: filePath, slot: slot })
  })
  return out
}

// R-214（round-043）：route 级产物核对 —— 渲染在 layout / helper 之前就失败时，该 route
// **没有任何观测**（R-213 的 expectedInjections 只覆盖出现过观测的页面），只能拿路由表与实际
// 产物文件对账。纯函数：statFn(relPath) 返回 { size } 或 null（ENOENT / 读取异常）。
// 判据（Lead round-043 补充 + 实测）：ENOENT / 读取异常 / size === 0 ⇒ 缺失。
//   - size === 0 是必需判据：round-042 的 .each() 回归曾产出 0 字节 projects 页而 hexo 仍报
//     "INFO Generated: projects/index.html"；干净基线实测（Lead /tmp/t42 base1/base2/rootbase1）
//     各 225 个 .html、0 字节文件 0 个 ⇒ 该判据在干净构建零误报。
//   - 只看「存在且非空」，**不得**用「本轮渲染字节」做基准（build.sh 的 gulp 后处理 + hexo 的
//     "Skip generating if hash is unchanged"（generate.js:74-80）会让盘上字节 ≠ 渲染字节）。
//   - R-224（round-046）：**覆盖非 .html 路由产物**（此前 :419 只放行 .html，js/gantt.js /
//     js/json/github-calendar.json 这类 skip_render 静态资源成了 M27/M25c 组合盲区：截断成 0 字节
//     仍 rc=0）。目录形态 route 归一到 index.html；同一 path 只报一次；与 R-219 分工不变。
// R-224：**允许为空的派生 CSS 占位**（设计使然，不是缺失）—— 唯一豁免表，逐项写明理由。
//   css/var.css：由 source/css/var.styl 编译而来，而 var.styl 只含 stylus 变量定义（无任何规则）
//   ⇒ 产物恒为 0 字节。round-046 干净构建实测：全树唯一 0 字节文件就是它（.html 0 字节 0 个）。
//   该表之外的任何 route（含非 HTML）缺失 / 0 字节仍然 fail-loud。
const ROUTE_EMPTY_OK = { 'css/var.css': true }

function missingRouteOutputs (routes, statFn) {
  const out = []
  const seen = {}
  if (!Array.isArray(routes)) return out
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]
    if (typeof route !== 'string') continue
    let clean = route.replace(/^\/+/, '')
    if (clean === '') continue
    // R-224（round-046）：目录形态 route 归一到 <dir>index.html（与 R-219 docOutputPath 同口径）；
    // 不再按 .html 过滤 —— 非 HTML 的 skip_render 静态资源（js/gantt.js、js/json/github-calendar.json 等）
    // 同样是 route 表产物，缺失 / 0 字节必须 fail-loud（M27/M25c：截断成 0 字节仍 rc=0 的组合盲区）。
    // 同一 path 只报一次（seen），与 R-219 的分工不变：表内 route 由本函数负责，missingDocOutputs 见
    // routes.indexOf(rel) !== -1 即跳过，避免同一缺失报两遍。
    if (/\/$/.test(clean)) clean += 'index.html'
    if (seen[clean]) continue
    let stat = null
    try { stat = statFn(clean) } catch (err) { stat = null }
    const emptyByDesign = ROUTE_EMPTY_OK[clean] === true
    const bad = (!stat || typeof stat.size !== 'number' || stat.size === 0) && !emptyByDesign
    if (!bad) continue
    seen[clean] = true
    out.push({ route: clean })
  }
  out.sort(function (a, b) { return a.route < b.route ? -1 : (a.route > b.route ? 1 : 0) })
  return out
}

// R-219（round-044）：文档 path → 产物相对路径。
//   '' / 非字符串            ⇒ null（跳过，不当缺失处理）
//   以 '/' 结尾（目录形态）  ⇒ + 'index.html'（本仓 posts / tags / categories 全是此形态）
//   含扩展名 /.[^/]+$/      ⇒ 原样（本仓 pages 全是此形态：about/index.html、以及 skip_render
//                              的静态资源 js/gantt.js、js/json/github-calendar.json 等 —— 它们
//                              也被 hexo 当 page 收进 locals，靠本分支不误报）
//   其余（无扩展名、非目录） ⇒ + '/index.html'（本仓未出现，防御保留）
// 前导 '/' 统一剥掉，便于与路由表（hexo route.list()）的形态对齐。
function docOutputPath (docPath) {
  if (typeof docPath !== 'string') return null
  const clean = docPath.replace(/^\/+/, '')
  if (clean === '') return null
  if (/\/$/.test(clean)) return clean + 'index.html'
  if (/\.[^/]+$/.test(clean)) return clean
  return clean + '/index.html'
}

function routeLookupKeys (routeSet) {
  const keys = []
  const push = function (v) {
    if (typeof v !== 'string') return
    const c = v.replace(/^\/+/, '')
    if (c !== '') keys.push(c)
  }
  // 数组与 Set 都有 forEach；其余形态按「无路由信息」处理（调用方负责传对）
  if (routeSet && typeof routeSet.forEach === 'function') routeSet.forEach(push)
  return keys
}

// R-219：文档产物核对。判据见文件头 R-219 段：命中 routeSet ⇒ 跳过（R-214 负责）；
// statFn 抛异常 / 返回非对象 / size 非数字 / size === 0 ⇒ 缺失。返回按 path 去重 + 字典序的
// [{ path, kind }]，其中 path = docOutputPath() 归一化后的**产物相对路径**（便于直接点名）。
function missingDocOutputs (entries, routeSet, statFn) {
  const out = []
  const seen = {}
  if (!Array.isArray(entries)) return out
  const routes = routeLookupKeys(routeSet)
  const stat = (typeof statFn === 'function') ? statFn : function () { return null }
  entries.forEach(function (e) {
    if (!e || typeof e !== 'object') return
    const rel = docOutputPath(e.path)
    if (rel === null) return
    if (routes.indexOf(rel) !== -1) return // 该 route 已在 hexo 路由表里 ⇒ 交给 R-214 核对
    if (seen[rel]) return
    let st = null
    try { st = stat(rel) } catch (err) { st = null }
    const bad = !st || typeof st.size !== 'number' || st.size === 0
    if (!bad) return
    seen[rel] = true
    out.push({ path: rel, kind: (typeof e.kind === 'string') ? e.kind : '' })
  })
  out.sort(function (a, b) { return a.path < b.path ? -1 : (a.path > b.path ? 1 : 0) })
  return out
}

module.exports = {
  docOutputPath: docOutputPath,
  missingDocOutputs: missingDocOutputs,
  KNOWN_SLOTS: KNOWN_SLOTS,
  ALLOWED_KEYS: ALLOWED_KEYS,
  pageIds: pageIds,
  matchPages: matchPages,
  renderAsset: renderAsset,
  candidateAssets: candidateAssets,
  selectAssets: selectAssets,
  validateItem: validateItem,
  validateAssets: validateAssets,
  expectedInjections: expectedInjections,
  missingInjections: missingInjections,
  missingRouteOutputs: missingRouteOutputs,
  normalizeCompareBytes: normalizeCompareBytes,
  neverMatchedEntries: neverMatchedEntries,
  disabledEntries: disabledEntries,
  redundantEntries: redundantEntries
}
