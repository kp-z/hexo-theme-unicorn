/**
 * Butterfly / R-223（round-19 S13）
 * related_posts 纯 core：选篇语义与主题原 helper 完全一致，
 * 唯一新增是**全序 tie-break**（weight desc → path asc → title asc），消除对入参顺序的依赖。
 * 不原地修改入参（allPosts/currentPost 只读）。
 */

'use strict'

/* 统一取列表：Array / hexo _Query(.toArray()) / {data:[]} / 任何有 forEach 的类数组（不依赖 Array.isArray 准入）。 */
function toArray (value) {
  if (value === undefined || value === null) return []
  if (Array.isArray(value)) return value
  if (typeof value.toArray === 'function') {
    const arr = value.toArray()
    return Array.isArray(arr) ? arr : []
  }
  if (value.data && Array.isArray(value.data)) return value.data
  if (typeof value.forEach === 'function') {
    const out = []
    value.forEach(function (item) { out.push(item) })
    return out
  }
  const len = value.length
  if (typeof len === 'number' && len >= 0 && len < 100000) {
    const out = []
    for (let i = 0; i < len; i++) out.push(value[i])
    return out
  }
  return []
}

function byPath (arr, path) {
  for (let i = 0; i < arr.length; i++) if (arr[i].path === path) return i
  return -1
}

function isTagRelated (tagName, tags) {
  let result = false
  toArray(tags).forEach(function (tag) { if (tagName === tag.name) result = true })
  return result
}

/* 全序：weight desc → path asc → title asc（与 scripts/lib/stable_posts_core.js 同风格）。 */
/* 全序：weight desc → source asc → path asc（R-223 返工口径：sourceTie 与 base 可见差异最小且完全确定）。 */
function compareStr (x, y) { return x < y ? -1 : (x > y ? 1 : 0) }
function compareRelated (a, b) {
  if (b.weight !== a.weight) return b.weight - a.weight
  const as = String(a.source === undefined || a.source === null ? '' : a.source)
  const bs = String(b.source === undefined || b.source === null ? '' : b.source)
  if (as !== bs) return compareStr(as, bs)
  return compareStr(String(a.path === undefined ? '' : a.path), String(b.path === undefined ? '' : b.path))
}

function selectRelated (currentPost, allPosts, opts) {
  const options = opts || {}
  const posts = toArray(allPosts)
  const tags = toArray(currentPost && currentPost.tags)
  const relatedPosts = []
  tags.forEach(function (tag) {
    posts.forEach(function (post) {
      if (!post || !isTagRelated(tag.name, post.tags)) return
      const index = byPath(relatedPosts, post.path)
      if (index !== -1) {
        relatedPosts[index].weight += 1
      } else if (!currentPost || currentPost.path !== post.path) {
        relatedPosts.push({
          title: post.title,
          path: post.path,
          cover: post.cover,
          source: post.source,
          randomcover: post.randomcover,
          weight: 1,
          updated: post.updated,
          created: post.date
        })
      }
    })
  })
  if (relatedPosts.length === 0) return []
  relatedPosts.sort(compareRelated)
  const limitNum = options.limit || 6
  return relatedPosts.slice(0, Math.min(relatedPosts.length, limitNum))
}

module.exports = { selectRelated: selectRelated, compareRelated: compareRelated, toArray: toArray }
