/**
 * R-216（round-043）：模板 helper —— 并列 date 的稳定排序（DRY）。
 *
 * 用法（模板内）：stable_posts(site.posts, -1) → 普通数组（降序；1 为升序）。
 * R-221（round-044）：第三个参数为主键字段 —— stable_posts(site.posts, -1, 'updated') 按 updated
 * 排序（其余 / 缺省按 date）。两参调用的行为与 R-216 完全一致。
 * 逻辑全在 scripts/lib/stable_posts_core.js（纯函数，不依赖 hexo）；本文件只做 helper 注册。
 * round-042 教训：返回的是数组，模板里必须用 .forEach / .slice，**不能**用 hexo Collection 的
 * .each()（数组没有该方法，会抛 TypeError 并产出 0 字节页面）。
 */

'use strict'

const { stableSortPosts, stableTerms } = require('../lib/stable_posts_core')

if (typeof hexo !== 'undefined' && hexo.extend && hexo.extend.helper) {
  hexo.extend.helper.register('stable_posts', function (posts, order, key) {
    return stableSortPosts(posts, order, key)
  })
  // R-222（round-044）：tag / term 列表的确定性排序（name 升序 + path 字典序 tiebreak）。
  // 用法（模板内）：stable_terms(article.tags) -> **普通数组**（顺序与输入无关）；
  // round-042 教训：不要对返回的数组调 hexo Query 的 .each()；用 .forEach / .map 或 pug 的 each。
  hexo.extend.helper.register('stable_terms', function (terms) {
    return stableTerms(terms)
  })
}

module.exports = { stableSortPosts: stableSortPosts, stableTerms: stableTerms }
