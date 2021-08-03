function bgMusic() {
    var player = $("#bg-music")[0];
    // if(player.paused)
    if (player.paused) {
        /*如果已经暂停*/
        player.play(); /*播放*/
        $("#background-music").html("<i class='fas fa-volume-mute'></i>")
    } else {
        player.pause(); /*暂停*/
        $("#background-music").html("<i class='fas fa-music'></i>")
    }

}
// var bgMusic = document.createElement("audio");
// document.body.appendChild(bgMusic);
// bgMusic.setAttribute("id","bg-music");
// bgMusic.setAttribute("class","no-destroy");
// bgMusic.setAttribute("src","https://img-1253324855.cos.ap-chengdu.myqcloud.com/music/CharlesTheFirst%20-%20Crunksauce%20Vol%20IV%20-%2001%20All%20Ways.mp3")

var player = $("#bg-music")[0];
    // if(player.paused)
    if (player.paused) {
        /*如果已经暂停*/
        $("#background-music").html("<i class='fas fa-music'></i>")
    } else {
        $("#background-music").html("<i class='fas fa-volume-mute'></i>")
    }

