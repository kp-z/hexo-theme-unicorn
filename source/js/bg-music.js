function bgMusic() {
    var player = $("#bg-music")[0];
    // if(player.paused)
    if (player.paused) {
        /*如果已经暂停*/
        player.play(); /*播放*/
        $("#background-music").before("<button id='background-music-random' type='button' onclick='bgMusic()' title=_p('rightside.music')><i class='fas fa-random'></i></button>")
        $("#background-music").html("<i class='fas fa-pause'></i>")
        $("#background-music").after("<button id='background-music-list' type='button' onclick='bgMusic()' title=_p('rightside.music')><i class='fas fa-list'></i></button>")
    } else {
        player.pause(); /*暂停*/
        $("#background-music-random").remove();
        $("#background-music-list").remove();
        $("#background-music").html("<i class='fas fa-music'></i>")
    }

}
// var bgMusic = document.createElement("audio");
// document.body.appendChild(bgMusic);
// bgMusic.setAttribute("id","bg-music");
// bgMusic.setAttribute("class","no-destroy");
// bgMusic.setAttribute("src","https://img-1253324855.cos.ap-chengdu.myqcloud.com/music/CharlesTheFirst%20-%20Crunksauce%20Vol%20IV%20-%2001%20All%20Ways.mp3")

// var player = $("#bg-music")[0];
//     // if(player.paused)
//     if (player.paused) {
//         /*如果已经暂停*/
//         $("#background-music").html("<i class='fas fa-music'></i>")
//     } else {
//         $("#background-music").before("<button id='background-music-next' type='button' onclick='bgMusic()' title=_p('rightside.music')><i class='fas fa-pause'></i></button>")
//         $("#background-music").html("<i class='fas fa-pause'></i>")
//     }

