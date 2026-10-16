/**
 * page_flags.js — R-254b（goal round 21 / S15）：page_flags_core 的 helper 注册（薄包装）
 *
 * 仿 scripts/helpers/stable_posts.js 的守卫式注册；判定全在 scripts/lib/page_flags_core.js（可 node 直接测）。
 * 从 this 取 page/theme/is_*()/url_for/toc；toc(page.content) 用 per-page WeakMap 记忆化
 * （page_toc_enabled 消费点共 4 处 ⇒ TOC 解析次数回到 1 次/页）。
 */

'use strict'

const core = require('../lib/page_flags_core')

const tocMemo = new WeakMap()

function flags (ctx, extra) {
  const f = {
    page: ctx.page || {},
    theme: ctx.theme || {},
    isPost: !!(ctx.is_post && ctx.is_post()),
    isPage: !!(ctx.is_page && ctx.is_page()),
    isTag: !!(ctx.is_tag && ctx.is_tag()),
    isCategory: !!(ctx.is_category && ctx.is_category()),
    isHome: !!(ctx.is_home && ctx.is_home()),
    isArchive: !!(ctx.is_archive && ctx.is_archive()),
    urlFor: function (p) { return ctx.url_for ? ctx.url_for(p) : p }
  }
  if (extra) {
    Object.keys(extra).forEach(function (k) { f[k] = extra[k] })
  }
  return f
}

/** this.toc(page.content) 的 per-page 记忆化（WeakMap 键 = 当前 page 对象） */
function tocHtmlOf (ctx) {
  if (typeof ctx.toc !== 'function') return ''
  const page = ctx.page
  if (page && typeof page === 'object') {
    if (tocMemo.has(page)) return tocMemo.get(page)
    const html = ctx.toc(page.content)
    tocMemo.set(page, html)
    return html
  }
  return ctx.toc(page && page.content)
}

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('page_top_img', function () {
    return core.pageTopImg(flags(this))
  })
  hexo.extend.helper.register('page_header_bg', function () {
    return core.pageHeaderBg(flags(this))
  })
  hexo.extend.helper.register('page_toc_enabled', function () {
    const f = flags(this)
    f.tocHtml = tocHtmlOf(this)
    // R-258：空 ctx 健壮性 —— theme.toc / theme.aside 缺省时返回 falsy，不抛（core 保持不动）
    if (!f.theme.toc || !f.theme.aside) return false
    return core.tocEnabled(f)
  })
  hexo.extend.helper.register('page_comments_enabled', function () {
    return core.commentsEnabled(flags(this))
  })
  hexo.extend.helper.register('page_count_js_needed', function () {
    return core.countJsNeeded(flags(this))
  })
  hexo.extend.helper.register('page_subtitle_js_needed', function () {
    const f = flags(this)
    f.hasTopImg = core.pageTopImg(f) !== false
    return core.subtitleJsNeeded(f)
  })
}

module.exports = core
