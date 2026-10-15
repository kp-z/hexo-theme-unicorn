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
 */

'use strict'

const fs = require('fs')
const logger = (require('hexo-log').default || require('hexo-log').logger)()
const core = require('../lib/inject_assets_core')

const PREFIX = '[inject_assets] '

// 生成期页面观测：条目 index → { index, name, slot, pages, hits: Map(pageKey → ids) }
const audit = new Map()

function observe (index, item, page, ids) {
  let rec = audit.get(index)
  if (!rec) {
    rec = {
      index: index,
      name: item && item.name,
      slot: item && item.slot,
      pages: item && item.pages,
      hits: new Map()
    }
    audit.set(index, rec)
  }
  const key = (page && typeof page.path === 'string' && page.path !== '') ? page.path : '(unknown)'
  if (!rec.hits.has(key)) rec.hits.set(key, ids)
}

function failLoud (errors) {
  errors.forEach(function (e) { logger.error(PREFIX + e) })
  throw new Error(PREFIX + '条目校验失败：拒绝静默输出（R-200）')
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
    observe(hit.index, hit.item, page, matched ? ids : [])
    if (matched) out.push(core.renderAsset(hit.item))
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

function flushAudit (write) {
  const messages = []
  // R-203：显式停用条目点名 —— 只在真有 enabled:false 条目时输出，且整个进程只输出一次（幂等，
  // 不污染干净构建的 0 输出纪律：无停用条目 ⇒ messages 不含停用点名）。
  if (!disabledReported) {
    disabledReported = true
    core.disabledEntries(themeAssets()).forEach(function (w) { messages.push(PREFIX + w) })
  }
  if (audit.size > 0) {
    const observations = []
    audit.forEach(function (rec) {
      observations.push({
        index: rec.index,
        name: rec.name,
        slot: rec.slot,
        pages: rec.pages,
        hits: Array.from(rec.hits.entries()).map(function (pair) {
          return { pageKey: pair[0], ids: pair[1] }
        })
      })
    })
    core.neverMatchedEntries(observations).forEach(function (w) { messages.push(PREFIX + w) })
    core.redundantEntries(observations).forEach(function (w) { messages.push(PREFIX + w) })
    unrenderedEntries(observations).forEach(function (w) { messages.push(PREFIX + w) })
    audit.clear()
  }
  messages.forEach(write)
}

hexo.extend.filter.register('after_generate', function () {
  flushAudit(function (msg) { logger.warn(msg) })
})

// 兜底：退出阶段只能用同步写，保证告警一定落到 stderr（与 hexo-log 的 WARN 同流）。
function flushAtExit () {
  flushAudit(function (msg) {
    try {
      fs.writeSync(process.stderr.fd, 'WARN  ' + msg + '\n')
    } catch (e) { /* stdout 不可写时忽略，绝不影响退出码 */ }
  })
}

if (typeof hexo.on === 'function') hexo.on('exit', flushAtExit)
process.on('exit', flushAtExit)
