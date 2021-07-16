var chartDom = document.getElementById('radar');
var myChart = echarts.init(chartDom);
var option;


var indicator = [
    {
        text: '内向',
        max: 100,
    },
    // {
    //     text: '外向',
    //     max: 100
    // },
    // {
    //     text: '坚决',
    //     max: 100
    // },
    // {
    //     text: '谨慎',
    //     max: 100
    // },
    // {
    //     text: '直觉',
    //     max: 100
    // },
    // {
    //     text: '现实',
    //     max: 100
    // },
    {
        text: '逻辑',
        max: 100
    },
    {
        text: '感受',
        max: 100
    },
    {
        text: '计划',
        max: 100
    },
    {
        text: '展望',
        max: 100
    }
];
var dataArr = [
    // {
    //     name: "自我评价（100%）",
    //     value: [71, 29, 64, 36, 63, 37, 64, 36, 60, 40],
    //     lineStyle: {
    //         normal: {
    //             color: "rgba(2255,255,255,0)"
    //         }
    //     },
    //     areaStyle: {
    //         normal: { // 单项区域填充样式
    //             color: new echarts.graphic.LinearGradient(
    //                 0,
    //                 0,
    //                 0,
    //                 1,
    //                 [{
    //                         offset: 0,
    //                         color: '#7bed9f'
    //                     },
    //                     {
    //                         offset: 1,
    //                         color: '#27ae60'
    //                     }
    //                 ],
    //                 false
    //             ),
    //             opacity: 1, // 区域透明度
    //             // 设置扇形的阴影
    //             shadowBlur: 12,
    //             shadowColor: 'rgba(77,214,189,0.8)',
    //             shadowOffsetX: 12,
    //             shadowOffsetY: 12
    //         }
    //     }
    // },
    {
        name: "MBIT 测试（%）",
        // value: [71, 29, 64, 36, 63, 37, 64, 36, 60, 40],
        value: [71, 64, 36, 60, 40],

        lineStyle: {
            normal: {
                color: "rgba(2255,255,255,0)"
            }

        },

        areaStyle: {
            normal: { // 单项区域填充样式
                color: new echarts.graphic.LinearGradient(
                    1,
                    0,
                    0,
                    1,
                    [{
                            offset: 0,
                            color: '#eccc68'
                        },
                        {
                            offset: 1,
                            color: '#ff4757'
                        }
                    ],
                    false
                ),
                opacity: 1, // 区域透明度
                // 设置扇形的阴影
                shadowBlur: 12,
                shadowColor: 'rgba(137,201,255,0.50)',
                shadowOffsetX: 6,
                shadowOffsetY: 6
            }
        }
    }
];
option = {
    tooltip:{},
    color: ['#22CF96', '#ff4757'],
    // backgroundColor: "#fff",
    radar: {
        radius: '90%',
        name: {
            color: '#a4b0be',
            fontSize: 8,
            align: 'center',
            // lineHeight: 3
        },
        nameGap: -12,
        indicator: indicator,
        splitArea: { // 坐标轴在 grid 区域中的分隔区域，默认不显示。
            show: true
        },
        axisLine: { //指向外圈文本的分隔线样式
            show: false
        },
        splitLine: {
            lineStyle: {
                color: '#ddd', // 分隔线颜色
                width: 1, // 分隔线线宽
            }
        },
    },
    series: [{
        type: 'radar',
        symbolSize: 0,
        data: dataArr,
    }]
};
option && myChart.setOption(option);