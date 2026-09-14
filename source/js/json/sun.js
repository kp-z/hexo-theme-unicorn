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
// 样式说明：除 data 与 visualMap.pieces 的文案外，其余 option 与本地化前的 COS 版本逐字一致
// （半径 / 圆心 / 圆角 / 投影 / 隐藏标签 / 图例位置与尺寸）。visualMap 只作装饰性图例
// （silent: true），因此每个节点都带 visualMap: false + 显式 itemStyle.color；
// pieces 的 value 仅作占位，三者必须互不相同（原写法用数值匹配分组，新数据里两个分组篇数相同）。
var chartDom = document.getElementById('sun');
var myChart = echarts.init(chartDom);
var option;
var data = [{
        name: '认知机器',
        value: 3,
        visualMap: false,
        itemStyle:{
            color: '#97e245'
        },
        link: '/blog-cn/categories/项目/认知机器/',
        target: '_self',
        children: [{
            name: '此图(Graph)分类非彼图(Image)分类',
            value: 1,
            visualMap: false,
            itemStyle:{
                color: '#b5ea7b'
            },
            link: '/blog-cn/posts/16005/',
            target: '_self',
        }, {
            name: '手臂机器人:机器人检测物体与运动规划',
            value: 1,
            visualMap: false,
            itemStyle:{
                color: '#b5ea7b'
            },
            link: '/blog-cn/posts/12591/',
            target: '_self',
        }, {
            name: '认知机器人：感知物体位置和形态',
            value: 1,
            visualMap: false,
            itemStyle:{
                color: '#b5ea7b'
            },
            link: '/blog-cn/posts/27207/',
            target: '_self',
        }]
    }, {
        name: '应用开发',
        value: 2,
        visualMap: false,
        itemStyle:{
            color: '#f4d142'
        },
        link: '/blog-cn/categories/项目/应用开发/',
        target: '_self',
        children: [{
            name: '蜜蜂速查-速查表收集站',
            value: 1,
            visualMap: false,
            itemStyle:{
                color: '#f8e07f'
            },
            link: '/blog-cn/posts/61713/',
            target: '_self',
        }, {
            name: '微信小程序-找地儿住-官方文档',
            value: 1,
            visualMap: false,
            itemStyle:{
                color: '#f8e07f'
            },
            link: '/blog-cn/posts/771/',
            target: '_self',
        }]
}, {
    name: '其他项目',
    value: 3,
    visualMap: false,
    itemStyle:{
        color: '#ff8fa0'
    },
    link: '/blog-cn/categories/项目/其他项目/',
    target: '_self',
    children: [{
        name: '黑鲸智能系统知识库',
        value: 1,
        visualMap: false,
        itemStyle:{
            color: '#ffb7c2'
        },
        link: '/blog-cn/posts/30954/',
        target: '_self',
    }, {
        name: ' zkpeace.com',
        value: 1,
        visualMap: false,
        itemStyle:{
            color: '#ffb7c2'
        },
        link: '/blog-cn/posts/16907/',
        target: '_self',
    }, {
        name: '岛屿--个人网站博客搜集页',
        value: 1,
        visualMap: false,
        itemStyle:{
            color: '#ffb7c2'
        },
        link: '/blog-cn/posts/24491/',
        target: '_self',
    }]
}];
option = {
    legend: {
        show: false
    },
    visualMap: {
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
        pieces: [
            {value: 1, label: '认知机器', color: '#97e245'}, 
            {value: 2, label: '应用开发', color: '#f4d142'}, 
            {value: 3, label: '其他项目', color: '#ff8fa0'}, 
        ],
        silent: true,
        textStyle:{
            color: '#fff'
        }
    },
    tooltip:{
        formatter: function (params) {
            return params.marker + params.name;
        },
    },
    series: {
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
        
    }
};
option && myChart.setOption(option);
