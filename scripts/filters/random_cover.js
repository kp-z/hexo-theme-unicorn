/**
 * Butterfly / R-223（round-19 S13）
 * ramdom cover（标题沿用历史拼写）——改由纯 core random_cover_core.selectCover 决定，
 * 按 data.path 稳定选择，源码中不含任何随机数调用；post_asset_folder / data.cover===false 分支行为不变。
 */

'use strict'

const { selectCover } = require('../lib/random_cover_core')

const FALLBACK_COVER = 'https://registry.npmmirror.com/butterfly-extsrc/1.0.3/files/img/default.jpg'

hexo.extend.filter.register('before_post_render', function (data) {
  const { config } = this
  if (config.post_asset_folder) {
    const imgTestReg = /\.(png|jpe?g|gif|svg|webp)(\?.*)?$/
    const topImg = data.top_img
    const cover = data.cover
    if (topImg && topImg.indexOf('/') === -1 && imgTestReg.test(topImg)) data.top_img = data.path + topImg
    if (cover && cover.indexOf('/') === -1) data.cover = data.path + cover
  }

  if (data.cover === false) {
    data.randomcover = randomCover(data.path)
    return data
  }

  data.cover = data.cover || randomCover(data.path)
  return data
})

function randomCover (key) {
  const theme = hexo.theme.config
  return selectCover(theme.cover && theme.cover.default_cover, key, theme.default_top_img || FALLBACK_COVER)
}
