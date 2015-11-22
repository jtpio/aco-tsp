$(document).ready(function() {

	var W = 1600;
	var H = 900;
	var ratio = W/H;
	var renderer = PIXI.autoDetectRenderer(W, H, null, false, true);
	var started = false;

    document.body.appendChild(renderer.view);
    renderer.view.style.width = (window.innerWidth - 20) + "px";
    renderer.view.style.height = (window.innerHeight - 20) + "px";
    renderer.view.style.display = "block";

    window.addEventListener('resize', function () {
        renderer.view.style.width = (window.innerWidth - 20) + "px";
        renderer.view.style.height = Math.min(window.innerHeight - 20, (window.innerWidth / ratio - 20)) + "px"; //0.9*window.innerHeight + "px";
    }, false);

    // stats
    var stats = new Stats();
    // document.body.appendChild(stats.domElement);
    // stats.domElement.style.position = 'absolute';
    // stats.domElement.style.top = '0px';

    // gui
    function initDatGui() {
        var gui = new dat.GUI();
        var controllers = [];
        controllers.push(gui.add(params, 'nbAnts', 1, 20).name('Number of Ants'));
        gui.add(params, 'simulationSpeed', 0.1, 100).name('Demo speed');
        controllers.push(gui.add(params, 'antSpeed', 1, 5).step(1).name('Ant speed'));
        gui.add(params, 'showPheromones').name('Pheromones').onChange(function (value) {
            antColony.togglePheromones();
        });
        gui.add(params, 'showPath').name('Path').onChange(function (value) {
            antColony.togglePath();
        });

        controllers.forEach(function (ctrl) {
            ctrl.onChange(function (value) {
                antColony.reset();
            });
        });
    }

    // fonts
    WebFontConfig = {
        google: {
            families: [ 'Karla' ]
        },

        active: function () {
            run();
        }
    };

    (function () { // local scope
        var wf = document.createElement('script');
        wf.src = ('https:' == document.location.protocol ? 'https' : 'http') +
        '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
        wf.type = 'text/javascript';
        wf.async = 'true';
        var s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(wf, s);
    }());

    function run() {
        ant.init(W, H);
        antColony.init(W, H);

        // first render
        renderer.render(antColony.container);
		initDatGui();

        function render() {
            var time = Date.now();
            stats.begin();
            TWEEN.update();
            antColony.render();
            renderer.render(antColony.container);
            stats.end();
            requestAnimationFrame(render);
        }

        $('#help').popup({
            transition: 'all 1.0s',
            autoopen: true,
            background: true,
            color: '#EAEAEA',
            // opacity: 0.9,
            closetransitionend: function () {
                if (!started) {
                    requestAnimationFrame(render);
                    started = true;
                }
            }
        });

        $('#intro_img').click(function () {
            $('#help').popup();
        });
    }

});
