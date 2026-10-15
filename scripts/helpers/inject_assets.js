/**
 * R-162 S6（round-038）：第三方注入统一 —— 声明式注入表读取器
 *
 * 数据源：主题 _config.yml 的 `inject.assets`（YAML 列表），每项字段：
 *   name     —— 可读标识（仅用于阅读/排障）
 *   slot     —— 'head' | 'bottom' | 'charts'（模板按槽位取用）
 *   html     —— 原样注入的 HTML 串（与 src / href 三选一）
 *   src      —— 生成 <script type="text/javascript" src="..."></script>
 *   href+rel —— 生成 <link href="..." rel="...">（rel 缺省 stylesheet）
 *   pages    —— 页面白名单，缺省 = 全站。页面身份 = page.path 去掉前导斜杠与
 *               /index.html 后的串，或 page.view / page.type 命中
 *   enabled  —— false 时跳过（缺省启用）
 *
 * 模板用法：
 *   layout/includes/head.pug             !=inject_assets('head')
 *   layout/includes/additional-js.pug    !=inject_assets('bottom')
 *   layout/pages/profile.pug             !=inject_assets('charts')
 *   layout/pages/archive.pug             !=inject_assets('charts')
 *
 * 语义与旧版 inject.head / inject.bottom / inject.echarts_* 逐字节等价：
 * head 槽顺序 = 表内顺序；charts 槽只命中 categories / profile / services 三页。
 */

'use strict'

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

hexo.extend.helper.register('inject_assets', function (slot) {
  const inject = (this.theme && this.theme.inject) || {}
  const assets = Array.isArray(inject.assets) ? inject.assets : []
  if (!slot || assets.length === 0) return ''
  const ids = pageIds(this.page)
  return assets.filter(function (item) {
    return item && item.slot === slot && item.enabled !== false && matchPages(item.pages, ids)
  }).map(renderAsset).join('')
})
