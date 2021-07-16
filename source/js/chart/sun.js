
var chartDom = document.getElementById('sun');
var myChart = echarts.init(chartDom);
var option;
var data = [{ 
        name: '智能系统',
        value: 8,
        children: [{
            name: 'Robotic',
            value: 3,
            visualMap: false,
            itemStyle:{
                color: '#b5ea7b'
            },
            children: [{
                name: 'SLAM',
                value: 2,
                visualMap: false,
                itemStyle:{
                    color: '#c6ef9a'
                },
            }]
        }, {
            name: ' Mechine learning',
            value: 3,
            visualMap: false,
            itemStyle:{
                color: '#b5ea7b'
            },
            children: [{
                name: 'Reinforcement learning',
                value: 1,
                visualMap: false,
                itemStyle:{
                    color: '#c6ef9a'
                },
            }]
        }, {
            name: 'LoT',
            value: 2,
            visualMap: false,
            itemStyle:{
                color: '#b5ea7b'
            },
        }]
    }, {
        name: 'Engineering Capabilities',
        value: 9,
        children: [{
            name: 'Python',
            value: 3,
            visualMap: false,
            itemStyle:{
                color: '#f8e07f'
            },
            children:[
                {
                    name: 'numpy | scipy | matploit',
                    value: 1.5,
                    visualMap: false,
                    itemStyle:{
                        color: '#f4e1a7'
                    },
                },
                {
                    name: 'pytorch',
                    value: 1.5,
                    visualMap: false,
                    itemStyle:{
                        color: '#f4e1a7'
                    },
                },
            ]
        }, {
            name: 'C++',
            value: 2,
            visualMap: false,
            itemStyle:{
                color: '#f8e07f'
            },
        },{
            name: 'Javascript | CSS | H5',
            value: 3,
            visualMap: false,
            itemStyle:{
                color: '#f8e07f'
            },
            children:[
                {
                    name: 'vue | Mini-APP | stylus | pug',
                    value: 2,
                    visualMap: false,
                    itemStyle:{
                        color: '#f4e1a7'
                    },
                },
                {
                    name: 'echarts|three.js',
                    value: .5,
                    visualMap: false,
                    itemStyle:{
                        color: '#f4e1a7'
                    },
                },
            ]
        }]
}, {
    name: 'Digital Media',
    children: [{
        name: 'Graphic Design',
        visualMap: false,
        value: .8,
        itemStyle:{
            color: '#ffb7c2'
        }
     },{
            name: 'UI/UX',
            value: 0.5,
            visualMap: false,
            itemStyle:{
                color: '#ffb7c2'
            },
            children: [{
                name: 'Figma | PS ',
                value: 0.5,
                visualMap: false,
                itemStyle:{
                    color: '#ffb7c2'
                },
            }]
        },{
            name: '3D modeling',
            value: 0.8,
            visualMap: false,
            itemStyle:{
                color: '#ffb7c2'
            },
            children: [{
                name: 'Blender',
                value: 0.8,
                visualMap: false,
                itemStyle:{
                    color: '#ffb7c2'
                },
            }]
    },]
    
}];




option = {
    legend: {
        show: true
    },
    visualMap: {
        type: 'piecewise',
        min: 0,
        max: 25,
        left: 'right',
        top: 20,
        textGap: -70,
        itemWidth: 80,
        itemHeight: 20,
        itemGap: 8,
        pieces: [
            {value: 8, label: '理论能力', color: '#97e245'}, 
            {value: 9, label: '工程能力', color: '#f4d142'}, 
            {value: 2.1, label: '其他能力', color: '#ff8fa0'}, 
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
        radius: [40, '90%'],
        center: ['35%', '50%'],
        itemStyle: {
            borderRadius: 4,
            borderWidth: 0,
            shadowColor: 'rgba(0,0,0,.2)',
            shadowBlur: 14,
        },
        
    }
};
option && myChart.setOption(option);