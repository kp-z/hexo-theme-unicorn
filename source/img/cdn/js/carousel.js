var slideIndex = 1;
showSlides(slideIndex)

function plusSlides() {
    showSlides(slideIndex += 1);
}

// Thumbnail image controls
function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    var i;
    var slides = document.getElementsByClassName("carousel-box");
    var dots = document.getElementsByClassName("carousel-dot");
    if (n > slides.length) {
        slideIndex = 1
    }
    if (n < 1) {
        slideIndex = slides.length
    }
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex - 1].style.display = "block";
    dots[slideIndex - 1].className += " active";
}

////////////////////////////////////////////////////////////////////////////////   

/* R-263：本脚本在首页两种 3D 模式下都会被加载（Sketchfab 回退模式 / model-viewer 模式）。
   model-viewer 模式（theme.model_viewer.enable = true）里没有 #sketchfab-model，也没有
   Sketchfab 全局对象，旧实现在文件顶层直接给 #sketchfab-model 设高度并 new Sketchfab()，
   会抛 TypeError / ReferenceError 并中断整个文件 ⇒ 下面 #site-name / #show-index-info 的点击
   切换（隐藏轮播 / 显示索引信息）永不绑定。现在 3D 初始化先做存在性判定、UI 交互与 3D 解耦；
   又因 #site-name 等元素在本 <script> 标签之后才出现，绑定统一等 DOMContentLoaded 之后再执行。 */
var togglesBound = false;

function bindIndexToggles() {
    if (togglesBound) {
        return;
    }
    var showIndexInfo = document.getElementById('show-index-info');
    var siteName = document.getElementById("site-name");
    var pinedPages = document.getElementById("pined-pages");
    var carousel = document.getElementById("carousel");
    if (!showIndexInfo || !siteName || !pinedPages || !carousel) {
        return;
    }
    togglesBound = true;

    siteName.addEventListener('click', function () {
        siteName.style.display = "none";
        pinedPages.style.display = "none";
        carousel.style.display = "none";
        showIndexInfo.style.display = "block";
    });

    showIndexInfo.addEventListener('click', function () {
        siteName.style.display = "block";
        pinedPages.style.display = "block";
        carousel.style.display = "block";
        showIndexInfo.style.display = "none";
    });
}

function onDomReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

var iframe = document.getElementById('sketchfab-model');
var h = window.innerHeight * 1.2;
if (iframe) {
    iframe.style.height = h + 'px';
}
// console.log(h);

var uid = '25e0e77ab56140be9fa6cb65cb4de96f';
// var uid = '93174ca7b0bb4f2d8ddf00021854f2cb';
var client = null;

// By default, the latest version of the viewer API will be used.
var client = (typeof Sketchfab === 'function') ? new Sketchfab(iframe) : null;

if (!client) {
    // model-viewer 模式 / Sketchfab viewer 脚本不可用：没有 viewer 可初始化，只保留纯 UI 交互（R-263）。
    client = { init: function () {} };
    onDomReady(bindIndexToggles);
}

// Alternatively, you can request a specific version.
// var client = new Sketchfab( '1.10.1', iframe );

client.init(uid, {
    // transparent: 1,
    preload: 1,
    // autostart: 0,
    annotation_tooltip_visible: 0,
    success: function onSuccess(api) {
        // #site-name
        // console.log('Success');
        api.load();
        document.getElementById('carousel').addEventListener('click', function () {
            // window.console.log(slideIndex);
            if (slideIndex == 2) {
                api.setCameraLookAt([-69.34712355741655, 2.2439526969192185, 7.88222197159061], [0.04293225738905686, -1.658814372918229, 10.535251036030234]);
            } else if (slideIndex == 3) {
                api.setCameraLookAt([10.42710558402664, 218.77945883525692, 60.6031613490485], [-0.2812965427458305, -2.5744075927023267, 11.870230319595267]);
            } else if (slideIndex == 1) {
                api.setCameraLookAt([-37.20336656745149, -38.62964075194737, 0.6871622589092077], [-1.7741291165991424, -4.108950727105709, 10.800401312387038]);
            } else {
                api.setCameraLookAt([-0.07100943658257979, -2.838193770610532, 273.2725839414465], [-0.14979741551783443, 1.2632613866959885, 12.139146858457272])
            }
        });
        onDomReady(bindIndexToggles);

        api.start();

        api.addEventListener('viewerready', function () {
            // API is ready to use
            // Insert your code here
            // api.setUserInteraction(false, function(err) {
            //     if (!err) {
            //         window.console.log('User interaction disabled');
            //     }
            // });
            // console.log('Viewer is ready');
            document.getElementById('sketchfab_loading_cover').classList.add("sketchfab_loaded");
            api.setFov(10, function (err, angle) {
                if (!err) {
                    // window.console.log('FOV set to', angle); // 45
                }
            });
            // api.setBackground({transparent: true}, function() {
            //     window.console.log('Background changed');
            // });


            api.getCameraLookAt(function (err, camera) {
                // window.console.log(camera.position); // [x, y, z]
                // window.console.log(camera.target); // [x, y, z]
            });
            api.setCameraLookAt([50, -50, 2], [0, -2.5, 11], function (err) {
                if (!err) {
                    // window.console.log('Camera moved');
                }
            });
            // let $apiFrame = document.getElementById('sketchfab-model');
            // $apiFrame.classList.remove('hidden'); // Remove hidden class
        });
        // api.addEventListener('camerastop', function() {
        //     window.console.log('Camera stopped');
        //     api.getCameraLookAt(function (err, camera) {
        //         window.console.log(camera.position); // [x, y, z]
        //         window.console.log(camera.target); // [x, y, z]
        //     });
        // });
        
        // api.addEventListener('modelLoadProgress', function (factor) {
        //     window.console.log('modelLoadProgress: ' + factor);
        //     // document.getElementById('model-fake-mask').classList.add("loaded");
        // });


    },
    error: function onError(callback) {
        console.log(this.error);
    }
});