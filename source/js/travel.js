mapboxgl.accessToken = 'pk.eyJ1Ijoia3BlYWNlIiwiYSI6ImNrcjQ2enpiYzB5NGwycHB0OHhmcWt1Y20ifQ.c9-b-wVH4pBnoiLJR36rQQ';
var map = new mapboxgl.Map({
        container: 'map', // container ID
        center: [7.0996739,50.7388084], // starting position [lng, lat]
        zoom: 3.5 // starting zoom
});
// Dark mode 
if (document.documentElement.getAttribute('data-theme') === 'light') {
        map.setStyle('mapbox://styles/kpeace/ckr5966zt0smn17mi6zu269ri');
} else {
        map.setStyle('mapbox://styles/kpeace/ckr5cj2d41ass17qf7e90mq4y');
}
//
var chapters = {
        '荷兰比利时之行': {
                bearing: 10,
                center: [ 4.4060909,51.2192812],
                zoom: 8,
                pitch: 0
        },
        '慕尼黑之行': {
                // duration: 6000,
                center: [ 11.566670,48.133330],
                bearing: 0,
                zoom: 10,
                speed: 2,
                pitch: 60
        },
        '柏林汉堡之行': {
                bearing: -20,
                center: [11.562792,53.066675],
                zoom: 6.5,
                pitch: 0
        },
        '成都重庆之行': {
                bearing: 180,
                center: [105.248761,30.119784],
                zoom: 6,
                pitch: 0
        },
        '意大利之行': {
                bearing: 0,
                center: [14.071232,39.751057],
                zoom: 6,
                pitch: 30
        },
        '东欧之行': {
                bearing: 60,
                center: [15.373059,48.208330],
                zoom: 6,
                pitch: 20
        },
        '巴黎之行': {
                bearing: 0,
                center: [2.351830,48.856580],
                zoom: 10,
                pitch: 0
        },
        '荷兰三城之行': {
                bearing: 0,
                center: [4.659874,52.166732],
                zoom: 9,
                pitch: 40
        }
};
// On every scroll event, check which element is on screen

// if(document.URL ==  'http://localhost:4000/blog-cn/home/'){

// }
window.onscroll = function() {
        var chapterNames = Object.keys(chapters);
        for (var i = 0; i < chapterNames.length; i++) {
                var chapterName = chapterNames[i];
                if (isElementOnScreen(chapterName)) {
                        setActiveChapter(chapterName);
                        break;
                        }
                }
        };
var activeChapterName = '荷兰比利时之行';
function setActiveChapter(chapterName) {
        if (chapterName === activeChapterName) return;
        map.flyTo(chapters[chapterName]);
        document.getElementById(chapterName).setAttribute('class', 'active');
        document.getElementById(activeChapterName).setAttribute('class', '');
        activeChapterName = chapterName;
}
function isElementOnScreen(id) {
        var element = document.getElementById(id);
        var bounds = element.getBoundingClientRect();
        var width = window.innerHeight;
        return  bounds.bottom > width * 0.8;
}
