
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
var player = $("#bg-music")[0];
    // if(player.paused)
    if (player.paused) {
        /*如果已经暂停*/
        $("#background-music").html("<i class='fas fa-music'></i>")
    } else {
        $("#background-music").html("<i class='fas fa-volume-mute'></i>")
    }