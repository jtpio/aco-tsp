var W = 1600,
	H = 900,
	ratio = W/H;
	stage = new PIXI.Stage(0x000000),
	renderer = PIXI.autoDetectRenderer(W, H, null, false, true);

document.body.appendChild(renderer.view);
renderer.view.style.width = window.innerWidth + "px";
renderer.view.style.height = window.innerHeight + "px";
renderer.view.style.display = "block";

window.addEventListener('resize', function () {
    renderer.view.style.width = window.innerWidth + "px";
	renderer.view.style.height = (window.innerWidth / ratio) + "px"; // window.innerHeight + "px";
}, false);

// stats
var stats = new Stats();
document.body.appendChild(stats.domElement);
stats.domElement.style.position = 'absolute';
stats.domElement.style.top = '0px';

// gui
var gui = new dat.GUI();
var controllers = [];
controllers.push(gui.add(params, 'nbAnts', 1, 20));
controllers.push(gui.add(params, 'decay', 0, 1));
controllers.push(gui.add(params, 'heuristic', 0, 10));
controllers.push(gui.add(params, 'greedy', 0, 10));
controllers.push(gui.add(params, 'cLocalPheromone', 0, 1));
gui.add(params, 'simulationSpeed', 0.1, 100);
gui.add(params, 'antSpeed', 1, 5).step(1);

controllers.forEach(function (ctrl) {
	ctrl.onChange(function (value) {
		antColony.reset();
	});
});

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
	ant.init();
	antColony.init();
	stage.addChild(antColony.container);

	function render() {
		var time = Date.now();
		stats.begin();
		TWEEN.update();
		antColony.render();
		renderer.render(stage);
		stats.end();
		requestAnimFrame(render);
	}

	requestAnimFrame(render);
}
