/**
 * Butterfly (unicorn)
 * rp / rp_html：站点根（config.root）路径前缀助手
 *
 * 站点配置里的「站内路径」一律写成根相对形式（如 /archives/），由本助手在渲染期补上当前
 * 部署根（Hexo 的 config.root）。这样站点换到任意子路径部署时链接自动
 * 跟随，主题模板与主题配置里不再出现站点根字面量。
 *
 * 规则（rp）：
 *   - 非字符串 / 空串 → 原样返回
 *   - 带 scheme 的绝对 URL（https://…、mailto:…）、协议相对（//…）、纯锚点与查询（#…、?…）→ 原样返回
 *     「跳出站点根」的站外地址请显式写成绝对 URL（如 https://zkpeace.com/wiki/）
 *   - 其余以 / 开头 → config.root + 去掉前导斜杠（不做百分号编码，中文路径保持字面量）
 *   - 不以 / 开头（相对路径）→ 原样返回
 *
 * @example
 *   rp('/archives/')          // 例：root=<root>/ → <root>/archives/（如 root=/blog-x/ → /blog-x/archives/）
 *   rp('https://a.example/')  // → https://a.example/
 *   rp_html('<a href="/x/">') // 富文本（subtitle 等）里的 href/src 同样补 root
 */

'use strict'

const SCHEME_OR_SPECIAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#|\?)/i

function normalizedRoot (root) {
  return (root || '/').replace(/\/+$/, '')
}

hexo.extend.helper.register('rp', function (path) {
  if (typeof path !== 'string' || path === '') return path
  if (SCHEME_OR_SPECIAL.test(path)) return path
  if (path.charAt(0) !== '/') return path
  return normalizedRoot(this.config.root) + '/' + path.replace(/^\/+/, '')
})

hexo.extend.helper.register('rp_html', function (html) {
  if (typeof html !== 'string' || html.indexOf('="/') === -1) return html
  const root = normalizedRoot(this.config.root)
  return html.replace(/(\s(?:href|src))="\/(?!\/)/gi, function (match, attr) {
    return attr + '="' + root + '/'
  })
})
