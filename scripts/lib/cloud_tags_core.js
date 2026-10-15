/**
 * cloud_tags_core.js —— R-223（round-046 S13）：确定性 tag 云 core（CommonJS，纯函数，不依赖 hexo 全局）
 *
 * 背景：原 page.js 的 cloudTags 有三处不确定性 ——
 *   ① source.sort('length') 原地改共享 Query（只用于档位计算，污染调用方）；
 *   ② source.forEach 未排序（DB 原序）⇒ 序列抖动；
 *   ③ 用随机数生成 rgb 颜色 ⇒ 字节级永不稳定（实测 tags/index.html 74 个 anchor 颜色每次构建都变）。
 * 本轮裁定：颜色不做「tag 名派生」，而是**复原调用点已声明的语义** ——
 *   tags.pug:5 已传 color:true,start_color:'#999',end_color:'#99a9bf'，与 hexo 内建
 *   node_modules/hexo/dist/plugins/helper/tagcloud.js:57-64 同语义：
 *   startColor.mix(endColor, ratio).toString()。默认 #999 → #99a9bf（中点实测 #99a1ac）。
 *
 * 口径（与调用点/内建一致）：
 *   - tag.length 是**文章数**（现状语义，不是名字长度）；
 *   - orderTerms：length desc → name asc → path asc（稳定、不改入参）；
 *   - buildCloud：limit>0 在**排序后**截断；sizes = 截断后集合的去重 length 升序；
 *     ratio = sizes.indexOf(tag.length) / (sizes.length - 1)，len===1 时 ratio=0；
 *     font-size = parseFloat(size.toFixed(2)) + unit；
 *   - style 形状与内建一致：'font-size: …;' + (color ? ' color: …' : '')；
 *   - HTML：anchor 的 href=urlFor(path)、style=上述 style、文本=name，不加额外属性/换行。
 */

'use strict'

const { Color } = require('hexo-util')

const CLOUD_DEFAULT_START_COLOR = '#999'
const CLOUD_DEFAULT_END_COLOR = '#99a9bf'

/** 归一输入：Array / hexo Query(.toArray()) / 带 .data 的 Query ⇒ 新数组（不改入参） */
function toArray (terms) {
  if (Array.isArray(terms)) return terms.slice()
  if (terms && typeof terms.toArray === 'function') {
    const arr = terms.toArray()
    return Array.isArray(arr) ? arr.slice() : []
  }
  if (terms && Array.isArray(terms.data)) return terms.data.slice()
  return []
}

function num (v, dflt) {
  const n = Number(v)
  return Number.isFinite(n) ? n : dflt
}

/** 稳定排序：length desc → name asc → path asc（返回新数组，绝不原地排序） */
function orderTerms (terms) {
  const arr = toArray(terms)
  arr.sort(function (a, b) {
    const la = num(a && a.length, 0)
    const lb = num(b && b.length, 0)
    if (la !== lb) return lb - la
    const na = String((a && a.name) === undefined || (a && a.name) === null ? '' : a.name)
    const nb = String((b && b.name) === undefined || (b && b.name) === null ? '' : b.name)
    if (na !== nb) return na < nb ? -1 : 1
    const pa = String((a && a.path) === undefined || (a && a.path) === null ? '' : a.path)
    const pb = String((b && b.path) === undefined || (b && b.path) === null ? '' : b.path)
    if (pa !== pb) return pa < pb ? -1 : 1
    return 0
  })
  return arr
}

/**
 * 生成 tag 云 HTML（确定性）。
 * @param {*} terms tag 集合（Array / Query / Query.data）
 * @param {object} options { minfontsize, maxfontsize, unit='px', limit=0, color=false,
 *                           start_color, end_color, urlFor(path)->string }
 */
function buildCloud (terms, options) {
  const opts = options || {}
  const minfontsize = num(opts.minfontsize, 1)
  const maxfontsize = num(opts.maxfontsize, minfontsize)
  const unit = (typeof opts.unit === 'string' && opts.unit !== '') ? opts.unit : 'px'
  const limit = num(opts.limit, 0)
  const colorOn = opts.color === true || (opts.color !== undefined && opts.color !== null && opts.color !== false && opts.color !== 0 && opts.color !== '')
  const startColor = new Color(opts.start_color || CLOUD_DEFAULT_START_COLOR)
  const endColor = new Color(opts.end_color || CLOUD_DEFAULT_END_COLOR)
  const urlFor = (typeof opts.urlFor === 'function') ? opts.urlFor : function (p) { return p }

  let tags = orderTerms(terms)
  if (limit > 0) tags = tags.slice(0, limit)

  const sizes = []
  tags.forEach(function (tag) {
    const len = num(tag && tag.length, 0)
    if (sizes.indexOf(len) === -1) sizes.push(len)
  })
  sizes.sort(function (a, b) { return a - b })
  const denom = sizes.length - 1

  let result = ''
  tags.forEach(function (tag) {
    const len = num(tag && tag.length, 0)
    const ratio = denom > 0 ? (sizes.indexOf(len) / denom) : 0
    const size = minfontsize + ((maxfontsize - minfontsize) * ratio)
    let style = 'font-size: ' + parseFloat(size.toFixed(2)) + unit + ';'
    if (colorOn) style += ' color: ' + startColor.mix(endColor, ratio).toString()
    const name = (tag && tag.name !== undefined && tag.name !== null) ? String(tag.name) : ''
    const p = (tag && tag.path !== undefined && tag.path !== null) ? tag.path : ''
    result += '<a href="' + urlFor(p) + '" style="' + style + '">' + name + '</a>'
  })
  return result
}

module.exports = {
  CLOUD_DEFAULT_START_COLOR: CLOUD_DEFAULT_START_COLOR,
  CLOUD_DEFAULT_END_COLOR: CLOUD_DEFAULT_END_COLOR,
  orderTerms: orderTerms,
  buildCloud: buildCloud
}
