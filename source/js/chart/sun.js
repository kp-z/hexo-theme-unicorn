
var chartDom = document.getElementById('sun');
var myChart = echarts.init(chartDom);
var option;
var data = [{ 
        name: '智能系统',
        value: 8,
        children: [{
            name: '控制理论',
            link: 'https://www.notion.so/wikiwhale/5e88a922627a47fc81e3ccbd86b6938c',
            value: 1,
            visualMap: false,
            itemStyle:{
                color: '#b5ea7b'
            },
        }
            ,{
            name: '认知机器人',
            link: 'https://www.notion.so/wikiwhale/0f6916c4ee024d9abac1c7b70fdb46f8',
            value: 2,
            visualMap: false,
            itemStyle:{
                color: '#b5ea7b'
            },
            children: [{
                name: 'SLAM',
                value: 1,
                visualMap: false,
                itemStyle:{
                    color: '#c6ef9a'
                },
            }]
        }, {
            name: '机器学习',
            link: 'https://www.notion.so/wikiwhale/0f7791b2c3344be6b4532a22e1b9358b',
            value: 3,
            visualMap: false,
            itemStyle:{
                color: '#b5ea7b'
            },
            children: [{
                name: '强化学习',
                link: 'https://www.notion.so/wikiwhale/0f7791b2c3344be6b4532a22e1b9358b',
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
        name: '工程能力',
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
                    name: 'Seaborn',
                    value: 0.5,
                    visualMap: false,
                    itemStyle:{
                        color: '#f4e1a7'
                    },
                    
                },
                {
                    name: 'Numpy',
                    value: 0.8,
                    visualMap: false,
                    itemStyle:{
                        color: '#f4e1a7'
                    },
                    
                },
                {
                    name: 'Pytorch',
                    value: 0.8,
                    visualMap: false,
                    itemStyle:{
                        color: '#f4e1a7'
                    },
                },
            ]
        },  {
            name: 'ROS',
            value: 1,
            visualMap: false,
            itemStyle:{
                color: '#f8e07f'
            },
        },{
            name: 'C++',
            value: 2,
            visualMap: false,
            itemStyle:{
                color: '#f8e07f'
            },
            
            children:[
                {
                name: 'Qt',
                value: 1,
                visualMap: false,
                itemStyle:{
                color: '#f8e07f'}
                
                },
            ]
        },{
            name: 'Web',
            value: 3,
            visualMap: false,
            itemStyle:{
                color: '#f8e07f'
            },
            children:[
                {
                    name: 'Vue',
                    value: 1,
                    visualMap: false,
                    itemStyle:{
                        color: '#f4e1a7'
                    },
                },
                {
                    name: 'Echart',
                    value: .5,
                    visualMap: false,
                    itemStyle:{
                        color: '#f4e1a7'
                    },
                },
                {
                    name: 'Mapbox',
                    value: .5,
                    visualMap: false,
                    itemStyle:{
                        color: '#f4e1a7'
                    },
                },
            ]
        }]
}, {
    name: '其他能力',
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
                name: 'Figma',
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