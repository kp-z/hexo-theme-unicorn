var chartDom = document.getElementById('gantt');
var myChart = echarts.init(chartDom);
var option;

var data = [];
var dataCount = 10;
var startTime = +new Date();
var nowTime = +new Date();
var categories = ['工作', '学历', '位置'];

var oneYear = 31557600000;
var oneMonth = 2629800000;
var baseTime = 0;
var Time2013 = oneYear*43;
var Time2017 = Time2013 + oneYear*4;
var Time2018 = Time2013 + oneYear*5;
var data1 = [{
            name: '青岛大学,学士学位',
            value: [
                1,
                Date.parse('2013-09-01'),
                Date.parse('2017-09-01'),
                oneYear
            ],
            itemStyle: {
                normal: {
                    color: '#ff6b81',

                }
            }
        },{
            name: 'Uni Bonn,硕士学位',
            value: [
                1,
                Time2018+oneMonth*4,
                Time2018+oneYear*3,
                Date.parse('2018-04-15'),
                Date.parse('2021-10-01'),
            ],
            itemStyle: {
                normal: {
                    color: '#ff6b81',
  
                }
            }
        },{
            name: '青大创新实验室,Group leader',
            value: [
                0,
                Date.parse('2014-09-01'),
                Date.parse('2016-09-01'),
            ],
            itemStyle: {
                normal: {
                    color: '#1e90ff',

                }
            }
        },{
            name: '丸坐奶茶店,煮茶师',
            value: [
                0,
                Date.parse('2020-02-01'),
                Date.parse('2020-06-01'),
            ],
            itemStyle: {
                normal: {
                    color: '#1e90ff',

                }
            }
        },{
            name: '华为科技,测试工程师(实习)',
            value: [
                0,
                Date.parse('2020-06-15'),
                Date.parse('2021-05-31'),
            ],
            itemStyle: {
                normal: {
                    color: '#1e90ff',

                }
            }
        },{
            name: '青岛,中国',
            value: [
                2,
                Date.parse('2013-09-01'),
                Date.parse('2017-01-01'),
                oneYear*3
            ],
            itemStyle: {
                normal: {
                    color: '#f1c40f',

                }
            }
        },{
            name: '波恩,德国',
            value: [
                2,
                Date.parse('2018-04-15'),
                Date.parse('2021-10-01'),
                oneYear*3
            ],
            itemStyle: {
                normal: {
                    color: '#f1c40f',

                }
            }
        },{
            name: '惠与科技,培训生',
            value: [
                0,
                Date.parse('2017-08-01'),
                Date.parse('2018-04-01'),
            ],
            itemStyle: {
                normal: {
                    color: '#1e90ff',

                }
            }
        },
        {
            name: '西井科技,无人驾驶算法工程师',
            value: [
                0,
                Date.parse('2022-01-04'),
                new Date(),
            ],
            itemStyle: {
                normal: {
                    color: '#1e90ff',

                }
            }
        },
        {
            name: '上海,中国',
            value: [
                2,
                Date.parse('2021-11-10'),
                new Date(),
            ],
            itemStyle: {
                normal: {
                    color: '#f1c40f',

                }
            }
        },
        {
            name: '自动驾驶汽车 专项课程,多伦多大学（coursera）',
            value: [
                1,
                Date.parse('2021-10-10'),
                new Date(),
            ],
            itemStyle: {
                normal: {
                    color: '#ff6b81',
                }
            }
        },];
        

function renderItem(params, api) {
    var categoryIndex = api.value(0);
    var start = api.coord([api.value(1), categoryIndex]);
    var end = api.coord([api.value(2), categoryIndex]);
    var height = api.size([0, 1])[1] * 0.6;

    var rectShape = echarts.graphic.clipRectByRect({
        x: start[0],
        y: start[1] - height / 2,
        width: end[0] - start[0],
        height: height,
    }, {
        x: params.coordSys.x,
        y: params.coordSys.y,
        width: params.coordSys.width,
        height: params.coordSys.height,
    });

    return rectShape && {
        type: 'rect',
        transition: ['shape'],
        shape: {
            x: start[0],
            y: start[1] - height / 2,
            width: end[0] - start[0],
            height: height,
            r: 4
        },
        style: api.style()
    };
}


option = {
    tooltip: {
        formatter: function (params) {
            // return params.marker + params.name + ': ' + params.value[3] + ' ms';
            return params.marker + params.name;
        }
    },
    dataZoom: [{
        type: 'inside',
        filterMode: 'weakFilter',
        showDataShadow: false,
    }, {
        type: 'inside',
        filterMode: 'weakFilter'
    }],
    grid: {
        height: '60%',
        top: 25,
        left:20,
        width:'93%'

    },
    xAxis: {
        type:'time',
        min: Time2013+oneMonth*9,
        max: nowTime,
        axisLabel:{
            fontSize: 8,
            color: '#a4b0be',
        }
  
    },
    yAxis: {
        data: categories,
        axisTick :{
            show: false
        },
        axisLine: {
            show: false
        },
        axisLabel:{
            rotate: 90,
            fontSize: 8,
            color: '#a4b0be',
        }
    },
    series: [{
        type: 'custom',
        renderItem: renderItem,
        itemStyle: {
            borderRadius : 80,
            opacity: 0.8,
            shadowColor: 'rgba(0,0,0,.2)',
            shadowBlur: 5,
            shadowOffsetX: 4,
            shadowOffsetY: 4,
        },
        encode: {
            x: [1, 2],
            y: 0
        },
        data: data1
    }]
};

option && myChart.setOption(option);
