/**
 * Butterfly
 * Related Posts
 * According the tag
 *
 * R-223（round-19 S13）：选篇逻辑抽到 scripts/lib/related_posts_core.js（纯 core + 全序 tie-break），
 * 本文件只做 HTML 渲染，helper 注册名 related_posts 与渲染字节保持与改动前一致。
 */

'use strict'

const { selectRelated } = require('../lib/related_posts_core')

hexo.extend.helper.register('related_posts', function (currentPost, allPosts) {
  const hexoConfig = hexo.config
  const config = hexo.theme.config

  const limitNum = config.related_post.limit || 6
  const dateType = config.related_post.date_type || 'created'
  const headlineLang = this._p('post.recommend')

  const relatedPosts = selectRelated(currentPost, allPosts, { limit: limitNum })
  if (relatedPosts.length === 0) return ''

  let result = ''
  result += '<div class="relatedPosts">'
  result +=
    '<div class="headline"><i class="fas fa-thumbs-up fa-fw"></i><span>' +
    ' ' +
    headlineLang +
    '</span></div>'
  result += '<div class="relatedPosts-list">'

  for (let i = 0; i < relatedPosts.length; i++) {
    const cover =
      relatedPosts[i].cover === false
        ? relatedPosts[i].randomcover
        : relatedPosts[i].cover
    result +=
      '<div><a href="' +
      hexoConfig.root +
      relatedPosts[i].path +
      '" title="' +
      relatedPosts[i].title +
      '">'
    result +=
      '<img class="cover" src="' +
      this.url_for(cover) +
      '" alt="cover">'
    if (dateType === 'created') {
      result +=
        '<div class="content is-center"><div class="date"><i class="far fa-calendar-alt fa-fw"></i>' +
        ' ' +
        this.date(relatedPosts[i].created, hexoConfig.date_format) +
        '</div>'
    } else {
      result +=
        '<div class="content is-center"><div class="date"><i class="fas fa-history fa-fw"></i>' +
        ' ' +
        this.date(relatedPosts[i].updated, hexoConfig.date_format) +
        '</div>'
    }
    result +=
      '<div class="title">' + relatedPosts[i].title + '</div>'
    result += '</div></a></div>'
  }

  result += '</div></div>'
  return result
})
