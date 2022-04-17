

// var fdataUser = {
  // jsonurl: 'https://blog-1253324855.cos.ap-shanghai.myqcloud.com/json/link.json',  //【推荐】json 匹配模式
  // apiurl: 'https://hexo-circle-of-friends-kappa-six.vercel.app/',  //自部署api
  //initnumber: 20,  //首次加载文章数
  //stepnumber: 10,  //更多加载文章数
  //article_sort: 'created', //文章排序 updated or created
  // error_img: 'https://sdn.geekzu.org/avatar/57d8260dfb55501c37dde588e7c3852c'
// }

var links = document.getElementById('more-links');
var rlinks = document.getElementById('random-links');

function getRandom() {
    rlinks.innerHTML = '';
    for(var i = 0; i < 3; i++){
        num = Math.floor(Math.random() * friendsData.length);
        var imgUrl = friendsData[num].Avatar;
        var fname = friendsData[num].Name;
        var url = friendsData[num].Link;
        var descr = friendsData[num].Description;
        var url = friendsData[num].Link;
        var tags = '#tech';
    
        var link = document.createElement('div');
        link.setAttribute('class', 'random-link');
        var img = document.createElement('img');
        img.setAttribute('src', imgUrl);
        var nameTag = document.createElement('a');
        nameTag.setAttribute('href', url); 
        nameTag.setAttribute('target', "_blank");
        nameTag.setAttribute('class', 'name');
    
        nameTag.innerText = fname;
        var descrTag = document.createElement('a');
        descrTag.setAttribute('class', 'descr');
        descrTag.innerText = descr;
        link.appendChild(img);
        link.appendChild(nameTag);
        link.appendChild(descrTag);
        rlinks.appendChild(link);
      }
}
getRandom();


for(var i = 0; i < 18; i++){

    num = Math.floor(Math.random() * friendsData.length);
    var imgUrl = friendsData[num].Avatar;
    var fname = friendsData[num].Name;
    var descr = friendsData[num].Description;
    var url = friendsData[num].Link;
    var tags = '#tech';


    var link = document.createElement('div');
    link.setAttribute('class', 'more-link');
    

    var info = document.createElement('div');
    info.setAttribute('class', 'info');

    var nameTags = document.createElement('div');
    nameTags.setAttribute('class', 'nameTags');

    var img = document.createElement('img');
    img.setAttribute('src', imgUrl);
    img.setAttribute('class', 'avatar');
    info.appendChild(img);

    var nameTag = document.createElement('a');
    nameTag.setAttribute('class', 'name'); 
    nameTag.setAttribute('href', url); 
    nameTag.setAttribute('target', "_blank");
    nameTag.innerText = fname;
    nameTags.appendChild(nameTag);
    var tagsTag = document.createElement('a');
    tagsTag.setAttribute('class', 'tags');
    tagsTag.innerText = tags;
    nameTags.appendChild(tagsTag);

    info.appendChild(nameTags);

    var descrTag = document.createElement('div');
    descrTag.setAttribute('class', 'descr');

    var descrTagA = document.createElement('a');
    descrTag.innerText = descr;
    descrTag.appendChild(descrTagA);

    link.appendChild(info);
    link.appendChild(descrTag);
      

    links.appendChild(link);
}

$('img').on("error", function() {
    $(this).attr('src', 'https://blog.zhheo.com/img/avatar.png');  // 替换为默认图片
  });