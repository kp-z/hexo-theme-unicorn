/**
 * R-216（round-043）：并列 date 的稳定 tiebreak —— 与 R-198（round-042，projects 页）口径完全一致。
 *
 * 背景：hexo（warehouse）的 Collection.sort('date') 对**并列项**不保证顺序 —— 顺序取决于 DB 装载
 * 顺序，同日期文章会随构建摇奖（round-041/042 实测：同一主题两次干净构建 outputs 存在 21–52 个
 * 文件的内容差异，全是同日期文章的 prev/next、recent 列表、tags/categories 聚合顺序）。
 * 故所有「取全部文章」的遍历统一走本模块：date 排序 + 并列时按 abbrlink/slug/path → path → title
 * 字典序，结果与输入顺序无关（同一数据集任意排列输入 ⇒ 输出完全相同）。
 *
 * 纯函数模块：不依赖 hexo 全局，可被 node 直接 require（测试见 tools/qa/tests/inject-assets.test.mjs
 * 第 ㉓ 组）；模板 helper 见 scripts/helpers/stable_posts.js。
 */

'use strict'

/**
 * 排序主键取值。key === 'updated' ⇒ 用 doc.updated，其余（含缺省 undefined）⇒ doc.date
 * —— 与主题原有的 `site.posts.sort('date'|'updated', -1)` 语义对齐（R-221 round-044）。
 */
function primaryTime (doc, key) {
  const field = (key === 'updated') ? 'updated' : 'date'
  const v = doc && doc[field]
  return v ? new Date(v).valueOf() : 0
}

/**
 * 比较两篇文章。dir === 1 时主键升序，否则降序（与 hexo sort 的 order 语义一致：-1 降序）。
 * key 为主键字段：'updated' ⇒ updated，其余 ⇒ date（缺省 date，保持 R-216 既有行为逐字节不变）。
 * 并列时一律用字典序键，保证与输入顺序无关的确定性。
 */
function comparePosts (a, b, dir, key) {
  const da = primaryTime(a, key)
  const db = primaryTime(b, key)
  if (da !== db) return dir === 1 ? da - db : db - da
  const ka = String((a && (a.abbrlink || a.slug || a.path)) || '')
  const kb = String((b && (b.abbrlink || b.slug || b.path)) || '')
  if (ka !== kb) return ka < kb ? -1 : 1
  const pa = String((a && a.path) || '')
  const pb = String((b && b.path) || '')
  if (pa !== pb) return pa < pb ? -1 : 1
  const ta = String((a && a.title) || '')
  const tb = String((b && b.title) || '')
  if (ta === tb) return 0
  return ta < tb ? -1 : 1
}

/**
 * 稳定排序，返回**普通数组**（不是 warehouse Collection —— 调用方必须用 Array 方法：
 * .forEach / .slice / .filter；round-042 血泪：对数组调 hexo 的 .each() 会抛 TypeError
 * 并产出 0 字节页面）。
 * @param {object|Array} posts hexo Collection（有 toArray()）或数组
 * @param {number|string} order 1 / 'asc' 升序；其余（含 -1、undefined）降序
 * @param {string} [key] 排序主键：'updated' ⇒ updated；缺省 / 其它 ⇒ date（R-221 round-044 新增，
 *        两参调用行为与 R-216 完全一致，既有 6 处调用点不受影响）
 */
function stableSortPosts (posts, order, key) {
  const dir = (order === 1 || order === 'asc' || order === '1') ? 1 : -1
  let arr
  if (posts && typeof posts.toArray === 'function') arr = posts.toArray()
  else if (Array.isArray(posts)) arr = posts.slice()
  else arr = []
  arr = arr.slice()
  arr.sort(function (a, b) { return comparePosts(a, b, dir, key) })
  return arr
}

/**
 * R-222（round-044）：确定性 tag / term 排序 —— 与 stable_posts 同族（纯函数，不依赖 hexo 全局）。
 *
 * 背景（Lead round-044 独立复测 + dev3 实测）：hexo 8.1.2 的 Post.tags getter 是
 * Tag.find({_id: {$in: ids}})（deps/node_modules/hexo/dist/models/post.js:55-61），返回的 Query
 * 顺序随 Tag 集合（db）扫描顺序 ⇒ **同一份主题代码的两棵独立构建树，同一页面的 tag 序列也可能不同**
 * （tester 5 棵基线树实测 projects/index.html 出现 2 种 <a class="tag"> 序列：
 * b4d1780fe7ed7a39 vs a4e959fc2fa76807）。故所有 tag 列表渲染统一走本模块：按 name 升序 +
 * path 字典序 tiebreak，结果与输入顺序无关。
 *
 * 排序键：name（undefined / null / 非字符串一律按空串处理）→ path 字典序。
 */
function compareByName (a, b) {
  const na = (a && a.name !== undefined && a.name !== null) ? String(a.name) : ''
  const nb = (b && b.name !== undefined && b.name !== null) ? String(b.name) : ''
  if (na !== nb) return na < nb ? -1 : 1
  const pa = (a && a.path !== undefined && a.path !== null) ? String(a.path) : ''
  const pb = (b && b.path !== undefined && b.path !== null) ? String(b.path) : ''
  if (pa === pb) return 0
  return pa < pb ? -1 : 1
}

/**
 * 稳定排序 tag / term 列表，返回**普通数组**（不是 warehouse Query/Collection）。
 * 接受：hexo Query（有 toArray()）、带 .data 数组的 Query（模板里 article.tags.data 的形态）、
 * 普通数组；其余（undefined / null / 数字 / 字符串）一律返回空数组。
 * 调用方必须用数组方法（.forEach / .slice / .map / pug 的 each ... in），**不能**调 Query 的 .each()。
 * @param {object|Array} terms hexo Query（.toArray() 或 .data）或数组
 * @returns {Array} 去引用后的普通数组（升序）
 */
function stableTerms (terms) {
  let arr
  if (terms && typeof terms.toArray === 'function') arr = terms.toArray()
  else if (terms && Array.isArray(terms.data)) arr = terms.data.slice()
  else if (Array.isArray(terms)) arr = terms.slice()
  else arr = []
  arr = arr.slice()
  arr.sort(compareByName)
  return arr
}

module.exports = {
  comparePosts: comparePosts,
  primaryTime: primaryTime,
  stableSortPosts: stableSortPosts,
  compareByName: compareByName,
  stableTerms: stableTerms
}
