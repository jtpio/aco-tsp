var W = 1600,
	H = 900,
	stage = new PIXI.Stage(0x000000),
	renderer = PIXI.autoDetectRenderer(W, H, null, false, true);

document.body.appendChild(renderer.view);
renderer.view.style.width = window.innerWidth + "px";
renderer.view.style.height = window.innerHeight + "px";
renderer.view.style.display = "block";

window.addEventListener('resize', function () {
    renderer.view.style.width = window.innerWidth + "px";
	renderer.view.style.height = window.innerHeight + "px";
}, false);

// gui
var gui = new dat.GUI();
var controllers = [];
controllers.push(gui.add(params, 'nbAnts', 1, 20));
controllers.push(gui.add(params, 'decay', 0, 1));
controllers.push(gui.add(params, 'heuristic', 0, 10));
controllers.push(gui.add(params, 'greedy', 0, 10));
controllers.push(gui.add(params, 'cLocalPheromone', 0, 1));

controllers.forEach(function (ctrl) {
	ctrl.onChange(function (value) {
		antColony.reset();
	});
});

// run
antColony.init();
stage.addChild(antColony.container);

function render() {
	antColony.render();
	renderer.render(stage);
	requestAnimFrame(render);
}

requestAnimFrame(render);
