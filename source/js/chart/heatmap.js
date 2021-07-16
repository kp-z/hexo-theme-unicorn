var chartDom = document.getElementById('heatmap');
var myChart = echarts.init(chartDom);
var option;
function getVirtulData(year) {
    year = year || '2021';
    var date = +echarts.number.parseDate(year + '-01-01');
    var end = +echarts.number.parseDate(year + '-12-31');
    var dayTime = 3600 * 24 * 1000;
    var data = [];
    for (var time = date; time <= end; time += dayTime) {
        data.push([
            echarts.format.formatTime('yyyy-MM-dd', time),
            Math.floor(Math.random() * 10000)
        ]);
    }
    return data;
}

option = {
    visualMap: {
        show: false,
        min: 0,
        max: 10000,
        color: ['#d7d8da','#8ace57','#02b340','#296939','#2d5131']
    },
    calendar: {
        top:15,
        left:15,
        range: '2021',
        cellSize: ['auto', 12],

        dayLabel: {
            fontSize: 6,
            nameMap: ['一', '', '三', '', '五', '','日'],
            margin: '8'
        },
        monthLabel:{
            fontSize:6, 
            nameMap: ['一月', '', '', '', '五月', '','','八月','','','','十二'], 
        },
        yearLabel:{
            show: false,
            position: 'bottom',
        },
        splitLine: {
            show: false
        },
        itemStyle: {
            borderRadius: 10,
            borderColor: 'rgba(0,0,0, 0)',
            borderWidth: 3,
            borderType: 'solid',   
            color:'rgba(255,255,255,0.4)',

                     
        }
    },
    series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: getVirtulData(2021)
    }
};
option && myChart.setOption(option);