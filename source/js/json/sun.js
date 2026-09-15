// 简介页（/profile/，/services/ 复用同一模板）SKILLS 卡片的旭日图 —— 现为「项目图」：
// 内环 = 博客「项目」一级分类下的三个二级分类，外环 = 各分类下的项目文章；
// 点击内环跳分类列表页，点击外环跳对应文章（target: '_self' 同页跳转，不加则 ECharts 默认开新标签页）。
//
// 维护说明（今后新增「项目」分类的文章时）：
//   1. 在对应分组（认知机器 / 应用开发 / 其他项目）的 children 里按日期新→旧插入一条；
//   2. name 用文章标题原文，value: 1；
//   3. link 用 '/blog-cn/posts/<abbrlink>/'（abbrlink 见文章 front-matter，或直接复制线上文章 URL）；
//   4. 一级分组的 value 改成该分组的文章篇数（只影响扇形角度）；
//   5. 新增二级分类时沿用原色板分配颜色（一级深、二级浅一档）。
// 旧的「技能」数据可在主题仓库历史提交 e9bf9b1 找回。
//
// 样式与自适应说明：
//   - 宽卡片（饼图不会被切）沿用原参数：半径 ['20%','90%']、圆心 ['35%','50%']、
//     图例 left:'right' top:20 itemWidth:80 textGap:-65，与本地化前的 COS 版本一致；
//   - 卡片变窄时原参数会让饼图左缘跑到画布外（实测 320px 卡片左侧被平切约 30px），
//     故此时改用「紧凑模式」：半径按可用宽度收敛、饼图左对齐留 4px 边距、图例缩为小药丸，
//     小屏既不裁切、也不与右侧图例/3D 树装饰打架；
//   - 窗口变窄或旋转屏幕时 canvas 尺寸会变，必须 resize()，否则 ECharts 保留旧尺寸把图表裁掉；
//   - tooltip 开 confine，避免长标题气泡溢出卡片。
//
// visualMap 只作装饰性图例（silent: true），因此每个节点都带 visualMap: false + 显式 itemStyle.color；
// pieces 的 value 仅作占位，三者必须互不相同（原写法用数值匹配分组，新数据里两个分组篇数相同）。
//
// 注意：整段包在 IIFE 里。profile.scripts 里的 radar.js / gantt.js 等也在全局声明 var myChart/var data，
// 若此处不隔离，resize 回调闭包会读到被后加载脚本覆盖掉的 myChart，导致本图永远不重排（并误改别的图表）。
(function () {
    'use strict';

    var chartDom = document.getElementById('sun');
    if (!chartDom) return;
    var myChart = echarts.init(chartDom);

    var data = [{
            name: '认知机器',
            value: 3,
            visualMap: false,
            itemStyle: {
                color: '#97e245'
            },
            link: '/blog-cn/categories/项目/认知机器/',
            target: '_self',
            children: [{
                name: '此图(Graph)分类非彼图(Image)分类',
                value: 1,
                visualMap: false,
                itemStyle: {
                    color: '#b5ea7b'
                },
                link: '/blog-cn/posts/16005/',
                target: '_self',
            }, {
                name: '手臂机器人:机器人检测物体与运动规划',
                value: 1,
                visualMap: false,
                itemStyle: {
                    color: '#b5ea7b'
                },
                link: '/blog-cn/posts/12591/',
                target: '_self',
            }, {
                name: '认知机器人：感知物体位置和形态',
                value: 1,
                visualMap: false,
                itemStyle: {
                    color: '#b5ea7b'
                },
                link: '/blog-cn/posts/27207/',
                target: '_self',
            }]
        }, {
            name: '应用开发',
            value: 2,
            visualMap: false,
            itemStyle: {
                color: '#f4d142'
            },
            link: '/blog-cn/categories/项目/应用开发/',
            target: '_self',
            children: [{
                name: '蜜蜂速查-速查表收集站',
                value: 1,
                visualMap: false,
                itemStyle: {
                    color: '#f8e07f'
                },
                link: '/blog-cn/posts/61713/',
                target: '_self',
            }, {
                name: '微信小程序-找地儿住-官方文档',
                value: 1,
                visualMap: false,
                itemStyle: {
                    color: '#f8e07f'
                },
                link: '/blog-cn/posts/771/',
                target: '_self',
            }]
    }, {
        name: '其他项目',
        value: 3,
        visualMap: false,
        itemStyle: {
            color: '#ff8fa0'
        },
        link: '/blog-cn/categories/项目/其他项目/',
        target: '_self',
        children: [{
            name: '黑鲸智能系统知识库',
            value: 1,
            visualMap: false,
            itemStyle: {
                color: '#ffb7c2'
            },
            link: '/blog-cn/posts/30954/',
            target: '_self',
        }, {
            name: ' zkpeace.com',
            value: 1,
            visualMap: false,
            itemStyle: {
                color: '#ffb7c2'
            },
            link: '/blog-cn/posts/16907/',
            target: '_self',
        }, {
            name: '岛屿--个人网站博客搜集页',
            value: 1,
            visualMap: false,
            itemStyle: {
                color: '#ffb7c2'
            },
            link: '/blog-cn/posts/24491/',
            target: '_self',
        }]
    }];

    var PIECES = [
        {value: 1, label: '认知机器', color: '#97e245'},
        {value: 2, label: '应用开发', color: '#f4d142'},
        {value: 3, label: '其他项目', color: '#ff8fa0'},
    ];

    // 原参数下饼图左缘 = 0.35*w - 0.45*min(w,h)，小于 -6px 时开始肉眼可见地被裁，
    // 此时切换紧凑模式（用容器实际像素算，避免百分比在不同宽高比下再次越界）。
    function usesCompact (w, h) {
        var pieRadius = 0.9 * Math.min(w, h) / 2;
        return (0.35 * w - pieRadius) < -6;
    }

    function buildOption (w, h) {
        var option = {
            legend: {
                show: false
            },
            tooltip: {
                // 长标题气泡不越出卡片（小屏尤其明显，原版会溢出后被页面裁掉）
                confine: true,
                formatter: function (params) {
                    return params.marker + params.name;
                },
            }
        };

        if (usesCompact(w, h)) {
            // 紧凑模式：饼图左对齐 + 半径收敛 + 小药丸图例，保证小屏完整可见
            var legendW = 56;
            var margin = 4;
            var pieRadius = Math.min(
                0.9 * h / 2,                                  // 不超出容器高度
                Math.max(40, (w - legendW - 12) / 2)          // 右侧给图例留位
            );
            option.visualMap = {
                type: 'piecewise',
                min: 0,
                max: 25,
                left: 'right',
                top: 12,
                hoverLink: true,
                textGap: -48,
                itemWidth: legendW,
                itemHeight: 16,
                itemGap: 6,
                pieces: PIECES,
                silent: true,
                textStyle: {
                    color: '#fff',
                    fontSize: 10
                }
            };
            option.series = {
                label: {
                    show: false
                },
                type: 'sunburst',
                data: data,
                // 内孔按原比例（20%/90%）换算，保持与宽卡片一致的环宽观感
                radius: [Math.round(pieRadius * 0.222), Math.round(pieRadius)],
                center: [margin + Math.round(pieRadius), Math.round(h / 2)],
                nodeClick: 'link',
                itemStyle: {
                    borderRadius: 4,
                    borderWidth: 0,
                    shadowColor: 'rgba(0,0,0,.2)',
                    shadowBlur: 14,
                }
            };
        } else {
            option.visualMap = {
                type: 'piecewise',
                min: 0,
                max: 25,
                left: 'right',
                top: 20,
                hoverLink: true,
                textGap: -65,
                itemWidth: 80,
                itemHeight: 20,
                itemGap: 8,
                pieces: PIECES,
                silent: true,
                textStyle: {
                    color: '#fff'
                }
            };
            option.series = {
                label: {
                    show: false
                },

                type: 'sunburst',
                data: data,
                radius: ['20%', '90%'],
                center: ['35%', '50%'],
                nodeClick: 'link',
                itemStyle: {
                    borderRadius: 4,
                    borderWidth: 0,
                    shadowColor: 'rgba(0,0,0,.2)',
                    shadowBlur: 14,
                },

            };
        }
        return option;
    }

    var lastCompact = null;
    function render () {
        var w = chartDom.clientWidth;
        var h = chartDom.clientHeight;
        if (!w || !h) return;
        var compact = usesCompact(w, h);
        // 两种模式的图例/圆心参数互不兼容（百分比 vs 像素），切换时先清空再整套设置
        if (compact !== lastCompact) {
            myChart.clear();
            lastCompact = compact;
        }
        myChart.setOption(buildOption(w, h));
    }

    // 尺寸变化：window.resize 有时在布局落定前触发（读到旧宽度），
    // 因此再挂一个 ResizeObserver —— 它在容器实际尺寸变化之后回调，读到的 clientWidth 一定是新值。
    // 不用 rAF 做延迟：标签页不可见时 rAF 会被节流甚至不执行。
    function handleResize () {
        myChart.resize();
        render();
    }

    render();
    window.addEventListener('resize', handleResize);
    // 容器自身尺寸变化（旋转屏幕、侧栏开合、pjax 切换页面）不一定伴随 window.resize
    if (window.ResizeObserver) {
        new ResizeObserver(handleResize).observe(chartDom);
    }
})();
