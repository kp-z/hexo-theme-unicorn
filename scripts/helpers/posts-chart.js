const cheerio = require('cheerio')
const moment = require('moment')

hexo.extend.filter.register('after_render:html', function (locals) {
  const $ = cheerio.load(locals)
  const post = $('#posts-chart')
  const tag = $('#tags-chart')
  const category = $('#categories-chart')
  let htmlEncode = false

  if (post.length > 0 || tag.length > 0 || category.length > 0) {
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

    if (htmlEncode) {
      return $.root().html().replace(/&amp;#/g, '&#')
    } else {
      return $.root().html()
    }
  } else {
    return locals
  }
}, 15)

function postsChart () {
  const startDate = moment('2021-01')
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
    var color = '#a4b0be'
    var postsChart = echarts.init(document.getElementById('posts-chart'), 'light');
    var postsOption = {
      textStyle: {
        color: color
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        name: '日期',
        type: 'category',
        axisTick: {
          show: false
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: color
          }
        },
        data: ${monthArr}
      },
      yAxis: {
        name: '文章篇数',
        type: 'value',
        splitLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: color
          }
        }
      },
      series: [{
        name: '文章篇数',
        type: 'line',
        smooth: true,
        lineStyle: {
            width: 0
        },
        showSymbol: false,
        itemStyle: {
          opacity: 1,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: 'rgba(128, 255, 165)'
          },
          {
            offset: 1,
            color: 'rgba(1, 191, 236)'
          }])
        },
        areaStyle: {
          opacity: 1,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: 'rgba(128, 255, 165)'
          }, {
            offset: 1,
            color: 'rgba(1, 191, 236)'
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
  const tagArr = []
  hexo.locals.get('tags').map(function (tag) {
    tagArr.push({ name: tag.name, value: tag.length })
  })
  tagArr.sort((a, b) => { return b.value - a.value })

  let dataLength = Math.min(tagArr.length, len) || tagArr.length
  const tagNameArr = []
  const tagCountArr = []
  for (let i = 0; i < 10; i++) {
    tagNameArr.push(tagArr[i].name)
    tagCountArr.push(tagArr[i].value)
  }
  const tagNameArrJson = JSON.stringify(tagNameArr)
  const tagCountArrJson = JSON.stringify(tagCountArr)

  return `
  <script id="tagsChart">
    var color = 'rgba(128, 255, 165)'
    var tagsChart = echarts.init(document.getElementById('tags-chart'), 'light');
    var tagsOption = {
      textStyle: {
        color: color
      },
      // title: {
      //   text: 'Top ${dataLength} 标签统计图',
      //   x: 'center',
      //   textStyle: {
      //     color: color
      //   }
      // },
      tooltip: {},
      xAxis: {
        name: '标签',
        type: 'category',
        axisTick: {
          show: false
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: color
          }
        },
        data: ${tagNameArrJson}
      },
      yAxis: {
        name: '文章篇数',
        type: 'value',
        splitLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: color
          }
        }
      },
      series: [{
        name: '文章篇数',
        type: 'bar',
        data: ${tagCountArrJson},
        itemStyle: {
          opacity: 1,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
            offset: 0,
            color: 'rgba(128, 255, 165)'
          },
          {
            offset: 1,
            color: 'rgba(1, 191, 236)'
          }])
        },
        emphasis: {
          itemStyle: {
            opacity: 1,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
              offset: 0,
              color: 'rgba(128, 255, 195)'
            },
            {
              offset: 1,
              color: 'rgba(1, 211, 255)'
            }])
          }
        },
        markLine: {
          data: [{
            name: '平均值',
            type: 'average'
          }]
        }
      }]
    };
    tagsChart.setOption(tagsOption);
    window.addEventListener("resize", () => { 
      tagsChart.resize();
    });
    </script>`
}

function categoriesChart () {
  const categoryArr = []
  hexo.locals.get('categories').map(function (category) {
    if(category.name != '技术'&& category.name != '生活'&& category.name != '项目')
      {categoryArr.push({ name: category.name, value: category.length })}
  })
  categoryArr.sort((a, b) => { return b.value - a.value });
  const categoryArrJson = JSON.stringify(categoryArr)

  return `
  <script id="categoriesChart">
    var color = 'rgba(128, 255, 165)'
    var categoriesChart = echarts.init(document.getElementById('categories-chart'), 'light');
    var categoriesOption = {
      textStyle: {
        color: color,
      },
      series: [{
        name: '文章篇数',
        type: 'pie',
        radius: [20, 150],
        center: ['50%', '50%'],
        roseType: 'area',
        label: {color: '#a4b0be',formatter: "{b} : {c} ({d}%)"},
        data: ${categoryArrJson},
        itemStyle: {
          emphasis: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(255, 255, 255, 0.5)',
          },
          borderRadius: 4,
        }
      }]
    };
    categoriesChart.setOption(categoriesOption);
    window.addEventListener("resize", () => { 
      categoriesChart.resize();
    });
    </script>`
}