/**
 * Butterfly
 * @example
 *  page_description()
 *  cloudTags(source, minfontsize, maxfontsize, limit)
 */

'use strict'

const { stripHTML, escapeHTML, prettyUrls } = require('hexo-util')
const crypto = require('crypto')
const cloudTagsCore = require('../lib/cloud_tags_core')

hexo.extend.helper.register('page_description', function () {
  const { config, page } = this
  let description = page.description || page.content || page.title || config.description

  if (description) {
    description = escapeHTML(stripHTML(description).substring(0, 150)
      .trim()
    ).replace(/\n/g, ' ')
    return description
  }
})

// R-223（round-046）：薄包装 —— 口径/排序/颜色全部在 scripts/lib/cloud_tags_core.js（纯函数，可 node 直接测）。
// helper 名与 options 兼容不变；颜色语义复原调用点声明（tags.pug:5 的 start_color/end_color），删净随机颜色。
hexo.extend.helper.register('cloudTags', function (options = {}) {
  const env = this
  return cloudTagsCore.buildCloud(options.source, {
    minfontsize: options.minfontsize,
    maxfontsize: options.maxfontsize,
    unit: options.unit,
    limit: options.limit,
    color: options.color,
    start_color: options.start_color,
    end_color: options.end_color,
    urlFor: function (path) { return env.url_for(path) }
  })
})

hexo.extend.helper.register('urlNoIndex', function (url = null) {
  return prettyUrls(url || this.url, { trailing_index: false, trailing_html: false })
})

hexo.extend.helper.register('md5', function (path) {
  return crypto.createHash('md5').update(decodeURI(this.url_for(path))).digest('hex')
})
