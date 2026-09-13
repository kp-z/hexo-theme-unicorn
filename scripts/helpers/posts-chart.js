const cheerio = require('cheerio')
const moment = require('moment')

hexo.extend.filter.register('after_render:html', function (locals) {
  const $ = cheerio.load(locals)
  const post = $('#posts-chart')
  const tag = $('#tags-chart')
  const category = $('#categories-chart')
  const year = $('#year-chart')
  let htmlEncode = false

  if (post.length > 0 || tag.length > 0 || category.length > 0 || year.length > 0) {
    if (post.length > 0 && $('#postsChart').length === 0) {
      if (post.attr('data-encode') === 'true') htmlEncode = true
      post.after(postsChart())
    }
    if (tag.length > 0 && $('#tagsChart').length === 0) {
      if (tag.attr('data-encode') === 'true') htmlEncode = true
      tag.after(tagsChart(tag.attr('data-length')))
    }
    if (category.length > 0 && $('#categoriesChart').length === 0) {
      if (category.attr('data-encode') === 'true') htmlEncode = true
      category.after(categoriesChart())
    }
    if (year.length > 0 && $('#yearChart').length === 0) {
      if (year.attr('data-encode') === 'true') htmlEncode = true
      year.after(yearChart())
    }

    if (htmlEncode) {
      return $.root().html().replace(/&amp;#/g, '&#')
    } else {
      return $.root().html()
    }
  } else {
    return locals
  }
}, 15)

// 图表配色统一从 CSS 变量取值，使亮/暗模式都能读清（原先硬编码 #a4b0be 灰在亮色下对比不足）。
// --font-color：亮色 #4C4948 / 暗色 #fff；--toc-link-color：亮色 #666261 / 暗色 rgba(255,255,255,.6)
const CHART_COLOR_SNIPPET = `
    var __cs = getComputedStyle(document.documentElement);
    var chartText = (__cs.getPropertyValue('--font-color') || '').trim() || '#4c4948';
    var chartSub = (__cs.getPropertyValue('--toc-link-color') || '').trim() || '#666261';
    var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
`

// 图表配色对齐「关于我」页的图表语言（source/js/json/sun.js、fitness.js）：
// 手挑的柔和粉彩，同色系内父级深、子级浅一档；并配圆角 + 柔和投影做出悬浮感。
const CHART_PASTEL = ['#74b9ff', '#97e245', '#ff8fa0', '#f4d142', '#83ccd2', '#b5ea7b']

function postsChart () {
  // 起点取最早一篇文章所在月，而非硬编码 moment('2021-01')：
  // 原写法会把 2018-09 ~ 2020-12 的 29 篇文章静默排除在时间图之外（本站最早一篇是 2018-09）。
  const allDates = hexo.locals.get('posts').toArray().map(p => p.date).sort((a, b) => a - b)
  const startDate = allDates.length ? moment(allDates[0]).startOf('month') : moment().startOf('month')
  const endDate = moment()

  const monthMap = new Map()
  const dayTime = 3600 * 24 * 1000
  for (let time = startDate; time <= endDate; time += dayTime) {
    const month = moment(time).format('YYYY-MM')
    if (!monthMap.has(month)) {
      monthMap.set(month, 0)
    }
  }
  hexo.locals.get('posts').forEach(function (post) {
    const month = post.date.format('YYYY-MM')
    if (monthMap.has(month)) {
      monthMap.set(month, monthMap.get(month) + 1)
    }
  })
  const monthArr = JSON.stringify([...monthMap.keys()])
  const monthValueArr = JSON.stringify([...monthMap.values()])

  return `
  <script id="postsChart">
    ${CHART_COLOR_SNIPPET}
    var postsChart = echarts.init(document.getElementById('posts-chart'), isDark ? 'dark' : 'light');
    var postsOption = {
      backgroundColor: 'transparent',
      textStyle: {
        color: chartSub
      },
      grid: { left: 8, right: 16, top: 30, bottom: 6, containLabel: true },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        name: '日期',
        type: 'category',
        axisTick: {
          show: false
        },
        axisLabel: {
          color: chartSub
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: chartSub
          }
        },
        data: ${monthArr}
      },
      yAxis: {
        name: '文章数',
        type: 'value',
        splitLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: chartSub
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: chartSub
          }
        }
      },
      series: [{
        name: '文章数',
        type: 'line',
        smooth: true,
        showSymbol: false,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: {
          width: 2,
          color: 'rgba(116, 185, 255, 1)'
        },
        itemStyle: {
          color: 'rgba(116, 185, 255, 1)'
        },
        areaStyle: {
          opacity: 1,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: 'rgba(116, 185, 255, .45)'
          }, {
            offset: 1,
            color: 'rgba(116, 185, 255, .04)'
          }])
        },
        data: ${monthValueArr},
        markLine: {
          data: [{
            name: '平均值',
            type: 'average'
          }]
        }
      }]
    };
    postsChart.setOption(postsOption);
    window.addEventListener("resize", () => { 
      postsChart.resize();
    });
    </script>`
}

function tagsChart (len) {
  const root = hexo.config.root || '/'
  const fullPath = p => (!p ? '' : (p.charAt(0) === '/' ? p : root + p))
  const tagArr = []
  hexo.locals.get('tags').map(function (tag) {
    tagArr.push({ name: tag.name, value: tag.length, path: fullPath(tag.path) })
  })
  tagArr.sort((a, b) => { return b.value - a.value })

  // 原先固定循环 10 次且忽略 data-length，标签不足 10 个时还会取到 undefined 而报错。
  const topN = Math.min(parseInt(len, 10) || 10, tagArr.length)
  const picked = tagArr.slice(0, topN)
  // 横向条形图：中文标签名横排才读得清（竖向柱状图的标签会挤成一团）。
  // reverse() 让文章数最多的标签显示在最上方（yAxis category 是自下而上排的）。
  const tagNameArrJson = JSON.stringify(picked.map(t => t.name).reverse())
  // 系列数据用对象形式，附带 path，供点击跳转使用
  const tagSeriesJson = JSON.stringify(picked.map(t => ({ value: t.value, path: t.path })).reverse())

  return `
  <script id="tagsChart">
    ${CHART_COLOR_SNIPPET}
    var tagsChart = echarts.init(document.getElementById('tags-chart'), isDark ? 'dark' : 'light');
    var tagsOption = {
      backgroundColor: 'transparent',
      textStyle: { color: chartSub },
      grid: { left: 8, right: 30, top: 10, bottom: 6, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}：{c} 篇' },
      xAxis: {
        type: 'value',
        axisLabel: { color: chartSub },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      },
      yAxis: {
        type: 'category',
        data: ${tagNameArrJson},
        axisLabel: { color: chartSub },
        axisLine: { lineStyle: { color: chartSub } },
        axisTick: { show: false }
      },
      series: [{
        name: '文章篇数',
        type: 'bar',
        data: ${tagSeriesJson},
        barMaxWidth: 14,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{
            offset: 0,
            color: 'rgba(116, 185, 255, .55)'
          }, {
            offset: 1,
            color: 'rgba(116, 185, 255, 1)'
          }])
        },
        label: { show: true, position: 'right', color: chartSub, fontSize: 10 }
      }]
    };
    tagsChart.setOption(tagsOption);
    // 本页已去掉标签云，图表即导航：点击柱子跳到该标签页
    tagsChart.on('click', function (p) {
      if (p && p.data && p.data.path) window.location.href = p.data.path;
    });
    window.addEventListener("resize", () => {
      tagsChart.resize();
    });
    </script>`
}

function categoriesChart () {
  const cats = hexo.locals.get('categories').toArray()
  // 原实现是饼图，且用 if(name != '技术' && ... ) 硬编码排除了三个一级分类，
  // 导致图上只有叶子分类、且「认知机器」因分属 技术/ 与 项目/ 而出现两块同名扇区。
  // 现改为旭日图：一级分类为主色（内环），二级用同色系深浅（外环），层级与归属一目了然。
  // 本页已去掉分类列表，因此节点带上 path 并支持点击跳转，图表本身就是导航。
  const root = hexo.config.root || '/'
  const fullPath = p => (!p ? '' : (p.charAt(0) === '/' ? p : root + p))
  const tops = cats.filter(c => !c.parent).sort((a, b) => b.length - a.length)
  const palette = CHART_PASTEL
  const toRgb = hex => [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16))
  const mix = (hex, ratio, towardsWhite) => {
    const src = toRgb(hex)
    const dst = towardsWhite ? [255, 255, 255] : [0, 0, 0]
    return '#' + src
      .map((v, i) => Math.round(v + (dst[i] - v) * ratio))
      .map(v => v.toString(16).padStart(2, '0'))
      .join('')
  }
  const tree = tops.map((top, i) => {
    const base = palette[i % palette.length]
    const children = cats
      .filter(c => c.parent === top._id)
      .sort((a, b) => b.length - a.length)
    const nodes = children.map((child, j) => ({
      name: child.name,
      value: child.length,
      path: fullPath(child.path),
      itemStyle: { color: mix(base, 0.1 + j * 0.09, true) }
    }))
    // 直接挂在一级分类下、没有再分二级的文章（例如只写 categories: [生活]）
    const rest = top.length - children.reduce((sum, c) => sum + c.length, 0)
    if (rest > 0) {
      nodes.push({ name: '未细分', value: rest, path: fullPath(top.path), itemStyle: { color: mix(base, 0.25, false) } })
    }
    return { name: top.name, value: top.length, path: fullPath(top.path), itemStyle: { color: base }, children: nodes }
  })

  // 改成「环形饼图 + 外部引导线标签」（参考用户给的样式）：
  // 名字放在环外并用引导线指向扇区，配 {名称：值（百分比）} 格式，
  // 这样任何数量的分类都写得下，也不必把字压在色块上。
  // 颜色按序号取柔和彩虹（HSL 均分色相），与参考图一致且能让相邻扇区互相区分。
  const leaves = []
  tree.forEach(top => {
    top.children.forEach(c => leaves.push({ name: c.name, value: c.value, path: c.path, parent: top.name }))
  })
  leaves.sort((a, b) => b.value - a.value)
  const leafCount = leaves.length
  leaves.forEach((leaf, i) => {
    leaf.itemStyle = { color: `hsl(${Math.round((i * 330) / Math.max(1, leafCount - 1))}, 64%, 68%)` }
  })
  const treeJson = JSON.stringify(leaves)

  return `
  <script id="categoriesChart">
    ${CHART_COLOR_SNIPPET}
    var categoriesChart = echarts.init(document.getElementById('categories-chart'), isDark ? 'dark' : 'light');
    var categoriesOption = {
      backgroundColor: 'transparent',
      textStyle: { color: chartSub },
      tooltip: {
        trigger: 'item',
        formatter: function (p) {
          return p.data.parent + ' / ' + p.name + '：' + p.value + ' 篇（' + p.percent + '%）';
        }
      },
      series: [{
        name: '文章篇数',
        type: 'pie',
        roseType: 'area',
        // 卡片是整行宽度，饼图直径受高度限制；半径给足并加长引导线，
        // 让圆环更大、标签铺开到卡片两侧，避免中间一小团、四周大片留白
        radius: ['30%', '88%'],
        center: ['50%', '50%'],
        nodeClick: false,
        data: ${treeJson},
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}：{c}（{d}%）',
          color: chartText,
          fontSize: 11
        },
        labelLine: {
          show: true,
          length: 16,
          length2: 46,
          lineStyle: { color: chartSub }
        },
        // 圆角切片 + 柔和投影，做出悬浮感（取值同 profile 的旭日图）
        itemStyle: {
          borderRadius: 4,
          borderWidth: 0,
          shadowColor: 'rgba(0, 0, 0, .2)',
          shadowBlur: 14
        },
        emphasis: { scale: true, scaleSize: 6 }
      }]
    };
    categoriesChart.setOption(categoriesOption);
    // 本页已无分类列表，图表即导航：点击扇区跳到对应分类页
    categoriesChart.on('click', function (p) {
      if (p && p.data && p.data.path) window.location.href = p.data.path;
    });
    window.addEventListener("resize", () => {
      categoriesChart.resize();
    });
    </script>`
}

function yearChart () {
  const posts = hexo.locals.get('posts').toArray()
  const cats = hexo.locals.get('categories').toArray()
  const tops = cats.filter(c => !c.parent).sort((a, b) => b.length - a.length).map(c => c.name)
  const palette = CHART_PASTEL

  const years = [...new Set(posts.map(p => p.date.format('YYYY')))].sort()
  const groups = tops.concat(['未分类'])
  const bucket = {}
  groups.forEach(g => {
    bucket[g] = {}
    years.forEach(y => { bucket[g][y] = 0 })
  })
  posts.forEach(p => {
    const y = p.date.format('YYYY')
    const raw = p.categories
    const cs = raw && raw.toArray ? raw.toArray() : (raw || [])
    const top = cs.filter(c => !c.parent)[0]
    const name = top ? top.name : '未分类'
    if (!bucket[name]) {
      bucket[name] = {}
      years.forEach(yy => { bucket[name][yy] = 0 })
    }
    bucket[name][y] = (bucket[name][y] || 0) + 1
  })

  const used = groups.filter(g => years.some(y => bucket[g] && bucket[g][y] > 0))
  const series = used.map((g, i) => ({
    name: g,
    type: 'line',
    smooth: true,
    showSymbol: true,
    symbolSize: 6,
    lineStyle: { width: 2 },
    itemStyle: { color: g === '未分类' ? '#a0a0a0' : palette[i % palette.length] },
    data: years.map(y => (bucket[g] && bucket[g][y]) || 0)
  }))

  return `
  <script id="yearChart">
    ${CHART_COLOR_SNIPPET}
    var yearChart = echarts.init(document.getElementById('year-chart'), isDark ? 'dark' : 'light');
    var yearOption = {
      backgroundColor: 'transparent',
      textStyle: { color: chartSub },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, itemWidth: 10, itemHeight: 10, textStyle: { color: chartSub } },
      grid: { left: 8, right: 12, top: 38, bottom: 6, containLabel: true },
      xAxis: {
        type: 'category',
        data: ${JSON.stringify(years)},
        axisLabel: { color: chartSub },
        axisLine: { lineStyle: { color: chartSub } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: chartSub },
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: ${JSON.stringify(series)}
    };
    yearChart.setOption(yearOption);
    window.addEventListener("resize", () => {
      yearChart.resize();
    });
    </script>`
}