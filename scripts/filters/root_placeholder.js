/**
 * theme root placeholder（R-157 S1b）
 *
 * 构建期把 __ROOT__ 展开为 this.config.root（hexo 保证 root 以 / 结尾；root=/ 时即 /）。
 * 覆盖三条渲染链：
 *   - after_render:css  —— source/css/** 经 stylus 编译后的 CSS 文本（stylus 里 {} 是插值，故用 __ROOT__ 而非 {{...}}）；
 *   - after_render:html —— _config.yml inject.assets 等原样注入的 HTML 片段、以及模板写出的 __ROOT__ 残留；
 *   - after_post_render —— 文章正文渲染后的 HTML（data.content）；R-158 S2 #7 起 markdown 正文也可写 __ROOT__，
 *     经此展开后 html 页面、atom.xml、rss2.xml、search.xml 四条输出一致。
 * 站点换 root 只需改站点 _config.yml 的 url/root，主题侧无需再动。
 */

'use strict'

const TOKEN = '__ROOT__'

function expandRoot (data, root) {
  if (typeof data !== 'string' || data.indexOf(TOKEN) === -1) return data
  const r = (typeof root === 'string' && root.length > 0) ? root : '/'
  return data.split(TOKEN).join(r)
}

hexo.extend.filter.register('after_render:css', function (data) {
  return expandRoot(data, this.config.root)
})

hexo.extend.filter.register('after_render:html', function (data) {
  return expandRoot(data, this.config.root)
})

hexo.extend.filter.register('after_post_render', function (data) {
  if (data && typeof data.content === 'string') {
    data.content = expandRoot(data.content, this.config.root)
  }
  return data
})
