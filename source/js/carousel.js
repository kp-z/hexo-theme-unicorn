var slideIndex = 1;
showSlides(slideIndex)
var h = window.innerHeight * 1.2;
document.getElementById('sketchfab-model').style.height = h + 'px';
console.log(h);

function plusSlides(n) {
    showSlides(slideIndex += n);
  }

// Thumbnail image controls
function currentSlide(n) {
    showSlides(slideIndex = n);
  }
function showSlides(n) {
    var i;
    var slides = document.getElementsByClassName("carousel-box");
    var dots = document.getElementsByClassName("carousel-dot");
    if (n > slides.length) {slideIndex = 1}
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }
    for (i = 0; i < dots.length; i++) {
        dots[i].className = dots[i].className.replace(" active", "");
    }
    slides[slideIndex-1].style.display = "block";
    dots[slideIndex-1].className += " active";
} 

var iframe = document.getElementById( 'sketchfab-model' );
    var uid = '25e0e77ab56140be9fa6cb65cb4de96f';

    // By default, the latest version of the viewer API will be used.
    var client = new Sketchfab( iframe );

    // Alternatively, you can request a specific version.
    // var client = new Sketchfab( '1.10.1', iframe );

    client.init( uid, {
        success: function onSuccess( api ){
            api.start();
            api.addEventListener( 'viewerready', function() {
            
                // API is ready to use
                // Insert your code here
                console.log( 'Viewer is ready' );
                api.setFov(10, function(err, angle) {
                  if (!err) {
                      window.console.log('FOV set to', angle); // 45
                  }
                });
              
                api.getCameraLookAt(function(err, camera) {
                  window.console.log(camera.position); // [x, y, z]
                  window.console.log(camera.target); // [x, y, z]
                });
                api.setCameraLookAt([50, -50, 2], [0, -2.5, 11], function(err) {
                  if (!err) {
                      window.console.log('Camera moved');
                  }
                });
            } );
            
        },
        error: function onError() {
            console.log( 'Viewer error' );
        }
    } );