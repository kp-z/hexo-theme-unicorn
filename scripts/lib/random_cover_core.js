/**
 * Butterfly / R-223（round-19 S13）
 * random_cover 纯 core：把「按 key 稳定选封面」显式化，源码内不含任何随机数调用。
 *  key = 稳定的站点内标识（调用处传 data.path）；同 key ⇒ 同封面，跨构建可复现。
 */

'use strict'

const crypto = require('crypto')

function stableIndex (key, length) {
  const n = Number(length)
  if (!Number.isFinite(n) || n <= 0) return 0
  const hex = crypto.createHash('md5').update(String(key === undefined || key === null ? '' : key)).digest('hex').slice(0, 8)
  return parseInt(hex, 16) % Math.floor(n)
}

function selectCover (defaultCover, key, fallback) {
  if (!defaultCover) return fallback
  if (!Array.isArray(defaultCover)) return defaultCover
  if (defaultCover.length === 0) return fallback
  return defaultCover[stableIndex(key, defaultCover.length)]
}

module.exports = { stableIndex: stableIndex, selectCover: selectCover }
