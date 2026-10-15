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
 */

'use strict'

// 模板实际取用的槽位（layout/includes/head.pug:81、layout/includes/additional-js.pug:52、
// layout/pages/profile.pug:129-131、layout/pages/archive.pug:35-37）
const KNOWN_SLOTS = ['head', 'bottom', 'charts']

// 条目允许的键（其余键一律报错，避免 pages → page 这类笔误被静默忽略并退化为全站注入）
const ALLOWED_KEYS = ['name', 'slot', 'html', 'src', 'href', 'rel', 'pages', 'enabled']

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

function matchPages (pages, ids) {
  if (!Array.isArray(pages) || pages.length === 0) return true
  return pages.some(function (p) { return ids.indexOf(String(p)) !== -1 })
}

function renderAsset (item) {
  if (typeof item.html === 'string') return item.html
  if (typeof item.src === 'string') {
    return '<script type="text/javascript" src="' + item.src + '"></script>'
  }
  if (typeof item.href === 'string') {
    return '<link href="' + item.href + '" rel="' + (item.rel || 'stylesheet') + '">'
  }
  return ''
}

// 按槽位选条目：slot 命中 + enabled 未显式关闭 + pages 白名单命中
// 返回 [{ index, item }]，index 供告警与观测定位（inject.assets[i]）
function selectAssets (assets, slot, ids) {
  const out = []
  if (!Array.isArray(assets) || !slot) return out
  assets.forEach(function (item, index) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return
    if (item.slot !== slot) return
    if (item.enabled === false) return
    if (!matchPages(item.pages, ids)) return
    out.push({ index: index, item: item })
  })
  return out
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
    return {
      index: src.index,
      name: src.name,
      slot: src.slot,
      pages: Array.isArray(src.pages) ? src.pages : [],
      hits: Array.isArray(src.hits) ? src.hits : []
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

module.exports = {
  KNOWN_SLOTS: KNOWN_SLOTS,
  ALLOWED_KEYS: ALLOWED_KEYS,
  pageIds: pageIds,
  matchPages: matchPages,
  renderAsset: renderAsset,
  selectAssets: selectAssets,
  validateItem: validateItem,
  validateAssets: validateAssets,
  neverMatchedEntries: neverMatchedEntries,
  redundantEntries: redundantEntries
}
