var videos = [
    {   
        title: '[原创]四月份的野餐',
        link: 'https://www.bilibili.com/video/BV1oV411p727?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=60317759&bvid=BV1oV411p727&cid=363694258&page=1&danmaku=0",

    },
    {   
        title: '[转载]没有理想的人不伤心',
        link: 'https://www.bilibili.com/video/BV1Pt41177M1?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=60317759&bvid=BV1Pt41177M1&cid=105010917&page=1&danmaku=0",

    },
    {   
        title: '[转载]漫长的岁月无谓地流逝',
        link: 'https://www.bilibili.com/video/BV1sJ411r7XK?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=79168191&bvid=BV1sJ411r7XK&cid=135482988&page=1&danmaku=0",

    },
    {   
        title: '[转载]总有一天你会出现在我身边',
        link: 'https://www.bilibili.com/video/BV1qV411x7Me?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=418408290&bvid=BV1qV411x7Me&cid=349576088&page=1",

    },
    {   
        title: '[转载]无论你奔涌在哪个浪潮，总有故事属于我们',
        link: 'https://www.bilibili.com/video/BV11i4y1x76b?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=540543297&bvid=BV11i4y1x76b&cid=187860197&page=1",

    },
    {   
        title: '[原创]宿舍门口的田野',
        link: 'https://www.bilibili.com/video/BV15z4y1o79X?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=584997520&bvid=BV15z4y1o79X&cid=246419764&page=1",

    },
    {   
        title: '[转载]他们死在了祖国胜利的前夜',
        link: 'https://www.bilibili.com/video/BV1mJ411g733?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=68180250&bvid=BV1mJ411g733&cid=118175938&page=1&danmaku=0",

    },
    {   
        title: '[转载]王嘉尔，安静',
        link: 'https://www.bilibili.com/video/BV1fb411q7QF?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=45113443&bvid=BV1fb411q7QF&cid=79002921&page=1&danmaku=0",

    },
    {   
        title: '[转载]一吻便颠倒众生',
        link: 'https://www.bilibili.com/video/BV13J411671G?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=79489795&bvid=BV13J411671G&cid=136032291&page=1&danmaku=0",

    },
    {   
        title: '[转载]一吻便偷一个心',
        link: 'https://www.bilibili.com/video/BV1FJ411V7gy?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=82766716&bvid=BV1FJ411V7gy&cid=147308234&page=1&danmaku=0",

    },
    {   
        title: '[转载]一吻便杀一个人',
        link: 'https://www.bilibili.com/video/BV1jJ41177zp?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=81994769&bvid=BV1jJ41177zp&cid=156847877&page=1&danmaku=0",

    },
    {   
        title: '电影级游戏CG混剪 ',
        link: 'https://www.bilibili.com/video/BV1f7411a7mz?share_source=copy_web',
        src:"//player.bilibili.com/player.html?aid=84776357&bvid=BV1f7411a7mz&cid=144981978&page=1&danmaku=0",
    },
    ];
var currentFmVideo = 0
$('#next-fm-video').click(function(){
    showFmVideo(currentFmVideo+1)
})
$('#pre-fm-video').click(function(){
    showFmVideo(currentFmVideo-1)
})
$('#random-fm-video').click(function(){
    var n = Math.round(Math.random()*videos.length);
    showFmVideo(n);
    currentFmVideo = n;
})

function showFmVideo(n){
    if(n >= videos.length){
        n = 0;
    };
    if(n < 0){
        n = videos.length - 1;
    }
    currentFmVideo = n;
    $("#fm-video-player").attr("src",videos[n].src);
    $("#fm-video-link").attr("href",videos[n].link);
    $("#fm-video-title").html(videos[n].title);
    
}