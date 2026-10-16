/**
 * page_flags_core.js — R-254b（goal round 21 / S15）：跨文件隐式 var/flag 族的**单一真源**（纯 core）
 *
 * 病根（pug 3.0.4 实测）：extends 把 layout 链编译成同一个 IIFE，模板标识符是 IIFE 形参
 * （"x" in locals_for_with ? locals_for_with.x : typeof x !== 'undefined' ? x : undefined）
 * ⇒ 「- var showToc」与裸赋值「- needLoadCountJs = true」都是**同一 IIFE 局部**，跨 include/block
 *   共享；未赋值时读 undefined 不抛错 ⇒ 缺陷是「渲染顺序敏感 + 静默 undefined」。
 * 修法：把每个 flag 的判定收敛到本文件（纯函数，不 require hexo），模板在**消费点显式调用**
 * helper（scripts/helpers/page_flags.js），不再依赖渲染顺序。
 *
 * 语义逐字复刻冻结前的模板实现（R-254b 冻结口径），字面量来源：
 *   - pageTopImg      ← layout/includes/header/index.pug:1-31（七支链）
 *   - pageHeaderBg    ← layout/includes/header/index.pug:20-21（bg_img）
 *   - tocEnabled      ← layout/includes/head/config_site.pug:7-8（pageToc/showToc，**允许 undefined**）
 *   - commentsEnabled ← layout/post.pug:30 / layout/page.pug:19（commentsJsLoad 置位条件）
 *   - countJsNeeded   ← layout/includes/mixins/post-ui.pug:67-87（needLoadCountJs 置位条件）
 *   - subtitleJsNeeded← layout/includes/header/index.pug:35-42（loadSubJs 置位条件）
 */

'use strict'

const COUNT_JS_PROVIDERS = ['Disqus', 'Disqusjs', 'Valine', 'Waline', 'Twikoo', 'Facebook Comments']

/**
 * header/index.pug:1-31 的七支 top_img 链（返回 img 源/纯色字符串，或 false）。
 * 入参：{ page, theme, isPost, isPage, isTag, isCategory, isHome, isArchive }
 */
function pageTopImg (o) {
  const opts = o || {}
  const page = opts.page || {}
  const theme = opts.theme || {}
  if (theme.disable_top_img || page.top_img === false) return false
  if (opts.isPost) return page.top_img || page.cover || page.randomcover
  if (opts.isPage) return page.top_img || theme.default_top_img
  if (opts.isTag) {
    const per = theme.tag_per_img && theme.tag_per_img[page.tag]
    return per ? per : (theme.tag_img !== false ? theme.tag_img || theme.default_top_img : false)
  }
  if (opts.isCategory) {
    const per = theme.category_per_img && theme.category_per_img[page.category]
    return per ? per : (theme.category_img !== false ? theme.category_img || theme.default_top_img : false)
  }
  if (opts.isHome) return theme.index_img !== false ? theme.index_img || theme.default_top_img : false
  if (opts.isArchive) return theme.archive_img !== false ? theme.archive_img || theme.default_top_img : false
  return page.top_img || theme.default_top_img
}

/**
 * header/index.pug:20-21 的 bg_img（**无背景时返回 ''，不返回 undefined**）。
 * 入参：{ page, theme, isPost, ..., urlFor }；等价于 top_img 的 imgSource / '' 取值。
 */
function pageHeaderBg (o) {
  const opts = o || {}
  const theme = opts.theme || {}
  const urlFor = (opts && typeof opts.urlFor === 'function') ? opts.urlFor : function (p) { return p }
  // R-256（goal round 23 / S17）：**不再有任何 404 特例** —— 404 页与普通页同走标准分支
  // （pageTopImg 对 404 仍返回 false ⇒ 本函数返回 ''，隐藏 header 不输出 style 属性）。
  // 404 可见元素的背景由 layout/includes/404.pug 自己的局部 var（error_top_img / error_bg）负责。
  const topImg = pageTopImg(opts)
  if (!topImg || topImg === false) return ''
  return topImg.indexOf('/') !== -1 ? "background-image: url('" + urlFor(topImg) + "')" : 'background: ' + topImg
}

/**
 * config_site.pug:7-8 的 showToc（**保留 undefined 可能，不强制布尔**）。
 * 入参：{ page, theme, isPost, tocHtml }
 */
function tocEnabled (o) {
  const opts = o || {}
  const page = opts.page || {}
  const theme = opts.theme || {}
  const pageToc = (page.toc === true || page.toc === false) ? page.toc : theme.toc.enable
  return opts.isPost && theme.aside.enable && pageToc && (opts.tocHtml !== '' || page.encrypt == true)
}

/**
 * post.pug:30 / page.pug:19 的 commentsJsLoad 置位条件（真布尔化）。
 * 入参：{ page, theme, isPost, isPage }
 * **R-254b 实测补正（产物中性优先）**：旧 commentsJsLoad 是「共享 IIFE var」，**只有 post.pug 与
 * page.pug 的非 flat 分支**会走到置位语句；index / archives / page/N / tags / categories 等列表页从不
 * 置位，page.pug 的 flat 分支（page.type === 'flat'，如 source/friends/index.md）与 404 场景也不置位
 * ⇒ 旧行为在那些页面上是 false（无 #to_comment、无 comments/js.pug）。若只按 page+theme 判定，会让
 * 144 个列表页 + friends 页凭空多出评论锚点与 Twikoo 脚本（base 对拍实测 DIFF）⇒ 因此显式带上模板
 * 作用域（isPost || (isPage && page.type !== 'flat')，并排除 type='404'）。
 */
function commentsEnabled (o) {
  const opts = o || {}
  const page = opts.page || {}
  const theme = opts.theme || {}
  const onArticleSurface = !!(opts.isPost || (opts.isPage && page.type !== 'flat'))
  return !!(onArticleSurface && page.type !== '404' &&
    page.comments !== false && theme.comments && theme.comments.use)
}

/**
 * post-ui.pug:67-87 / post-ui-blog.pug:70-90 的 needLoadCountJs 置位条件。
 * 入参：{ theme, isHome, isCategory, isTag }
 */
function countJsNeeded (o) {
  const opts = o || {}
  const theme = opts.theme || {}
  const comments = theme.comments || {}
  const use = Array.isArray(comments.use) ? comments.use : []
  return !!(comments.card_post_count &&
    COUNT_JS_PROVIDERS.indexOf(use[0]) !== -1 &&
    (opts.isHome ||
      (opts.isCategory && theme.category_ui === 'index') ||
      (opts.isTag && theme.tag_ui === 'index')))
}

/**
 * header/index.pug:35-42 的 loadSubJs 置位条件（首页 + 有头图 + subtitle.enable）。
 * 入参：{ theme, isHome, hasTopImg }
 */
function subtitleJsNeeded (o) {
  const opts = o || {}
  const theme = opts.theme || {}
  const subtitle = theme.subtitle || {}
  return !!(subtitle.enable && opts.isHome && opts.hasTopImg)
}

module.exports = {
  COUNT_JS_PROVIDERS: COUNT_JS_PROVIDERS,
  pageTopImg: pageTopImg,
  pageHeaderBg: pageHeaderBg,
  tocEnabled: tocEnabled,
  commentsEnabled: commentsEnabled,
  countJsNeeded: countJsNeeded,
  subtitleJsNeeded: subtitleJsNeeded
}
