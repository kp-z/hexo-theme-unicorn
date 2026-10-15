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
 * 比较两篇文章。dir === 1 时 date 升序，否则降序（与 hexo sort 的 order 语义一致：-1 降序）。
 * 并列时一律用字典序键，保证与输入顺序无关的确定性。
 */
function comparePosts (a, b, dir) {
  const da = a && a.date ? new Date(a.date).valueOf() : 0
  const db = b && b.date ? new Date(b.date).valueOf() : 0
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
 */
function stableSortPosts (posts, order) {
  const dir = (order === 1 || order === 'asc' || order === '1') ? 1 : -1
  let arr
  if (posts && typeof posts.toArray === 'function') arr = posts.toArray()
  else if (Array.isArray(posts)) arr = posts.slice()
  else arr = []
  arr = arr.slice()
  arr.sort(function (a, b) { return comparePosts(a, b, dir) })
  return arr
}

module.exports = {
  comparePosts: comparePosts,
  stableSortPosts: stableSortPosts
}
