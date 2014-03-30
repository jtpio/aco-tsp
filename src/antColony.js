var antColony = (function(ps) {
	'use strict';

	// colony
	var	initPheromone,
		pheromone,
		best,
		it,
		time;

	// rendering
	var	nodeTex = [],
		antTex = [],
		nodes = [],
		queue = [],
		container = new PIXI.DisplayObjectContainer(),
		back = new PIXI.DisplayObjectContainer(),
		trail = new PIXI.Graphics(),
		links = new PIXI.Graphics(),
		itText,
		bestText;

	function _initGraphics() {
		container.width = 1600;
		container.height = 900;
		container.position.x = 0;
		container.position.y = 0;

		for (var i = 1; i <= 3; i++) {
			nodeTex.push(PIXI.Texture.fromImage("img/Node_" + i + ".png"));
		}

		for (var i = 1; i <= 3; i++) {
			antTex.push(PIXI.Texture.fromImage("img/Ant_" + i + ".png"));
		}

		// background
		back.setInteractive(true);
		back.hitArea = new PIXI.Rectangle(
			container.position.x,
			container.position.y,
			container.width,
			container.height
		);
		back.click = function (event) {
			queue.push({
				x: event.global.x,
				y: event.global.y
			});
		};
		container.addChild(back);

		// pheromones
		links.clear();
		container.addChild(links);

		// text
		itText = new PIXI.Text("Iteration #0", { font: "35px Karla", fill: "white", align: "left" });
		itText.position.x = 20;
		itText.position.y = 20;
		container.addChild(itText);

		bestText = new PIXI.Text("Best: ?", { font: "35px Karla", fill: "white", align: "left" });
		bestText.position.x = 20;
		bestText.position.y = 60;
		container.addChild(bestText);

	}

	function _initColony() {
		for (var i = 0; i < 5; i++) {
			_addNode(~~(Math.random() * W), ~~(Math.random() * H));
	    }
	}

	function _addNode(x, y) {
		var node = new PIXI.MovieClip(nodeTex);
		node.play();
		node.animationSpeed = 0.1;
		node.anchor.x = 0.5;
		node.anchor.y = 0.5;
		node.position.x = x;
		node.position.y = y;
		node.scale.x = 0.2;
		node.scale.y = 0.2;
		node.setInteractive(true);
		node.mousedown = node.touchstart = function(data) {
			data.originalEvent.preventDefault();
			this.data = data;
			this.alpha = 0.9;
			this.dragging = true;
		};
		node.mouseup = node.mouseupoutside = node.touchend = node.touchendoutside = function(data) {
			this.alpha = 1
			this.dragging = false;
			this.data = null;
			_init(); // restart simulation
		};
		node.mousemove = node.touchmove = function(data) {
			if (this.dragging) {
				var newPosition = this.data.getLocalPosition(this.parent);
				this.position.x = newPosition.x;
				this.position.y = newPosition.y;
			}
		}
		node.buttonMode = true;
		nodes.push(node);
		container.addChild(node);
	}

	function _dist(a, b) {
		return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
	}

	function _cost(perm) {
		return perm.reduce(function (prev, curr, i) {
			return prev + _dist(nodes[perm[(i+1)%perm.length]], nodes[curr]);
		}, 0);
	}

	function _randomPermutation() {
		return _.shuffle(nodes).map(function (e, i) { return i; });
	}

	function _initPheromoneMatrix() {
		pheromone = [];
		for (var i = 0; i < nodes.length; i++) {
			pheromone.push([]);
			for (var j = 0; j < nodes.length; j++) {
				pheromone[i].push(initPheromone);
			}
		}
	}

	function _calculateChoices(lastCity, exclude) {
		return _.compact(nodes.map(function (node, i) {
			if (exclude.indexOf(i) === -1) {
				var prob = { city: i };
				prob.history = Math.pow(pheromone[lastCity][i], ps.history);
				prob.heuristic = Math.pow(1 / _dist(nodes[lastCity], node), ps.heuristic);
				prob.prob = prob.history * prob.heuristic;
				return prob;
			}
		}));
	}

	function _probSelect(choices) {
		var sum = choices.reduce(function (prev, curr) {
			return prev + curr.prob;
		}, 0);

		if (sum === 0) return choices[Math.floor(Math.random()*choices.length)].city;
		var v = Math.random();
		for (var i = 0; i < choices.length; i++) {
			v -= (choices[i].prob / sum);
			if (v <= 0) return choices[i].city;
		}
		return _.last(choices).city;
	}

	function _greedySelect(choices) {
		return _.max(choices, function (c) { return c.prob; }).city;
	}

	function _stepwiseConst(phero) {
		var perm = [Math.floor(Math.random() * nodes.length)];
		while (perm.length !== nodes.length) {
			var choices = _calculateChoices(_.last(perm), perm);
	        perm.push((Math.random() <= ps.greedy) ? _greedySelect(choices) : _probSelect(choices));
		}
		return perm;
	}

	function _globalUpdatePheromone(candidate) {
		candidate.vector.forEach(function (x, i) {
			var y = candidate.vector[(i+1)%candidate.vector.length];
			var value = ((1-ps.decay)*pheromone[x][y]) + (ps.decay*(1/candidate.cost));
			pheromone[x][y] = pheromone[y][x] = value;
		});
	}

	function _localUpdatePheromone(candidate) {
		candidate.vector.forEach(function (x, i) {
			var y = candidate.vector[(i+1)%candidate.vector.length];
			var value = ((1- ps.cLocalPheromone)*pheromone[x][y]) + (ps.cLocalPheromone*initPheromone);
			pheromone[x][y] = pheromone[y][x] = value;
		});
	}

	function _init() {
		var initPerm = _randomPermutation();
		best = {
			'vector': initPerm,
			'cost': _cost(initPerm)
		};
		initPheromone = 1.0 / (nodes.length * best.cost);
		_initPheromoneMatrix();
		it = 0;
		time = Date.now();
	}

	function _drawLinks() {
		links.clear();
		for (var i = 0, len = pheromone.length; i < len; i++) {
			for (var j = i + 1, len = pheromone[i].length; j < len; j++) {
				if (i !== j) {
					links.lineStyle(6, 0xffffff, pheromone[i][j] * 12000);
					links.moveTo(nodes[i].position.x, nodes[i].position.y);
					links.lineTo(nodes[j].position.x, nodes[j].position.y);
				}
			}
		}
	}

	function _drawBest() {
		trail.clear();
		links.lineStyle(10, 0x0C7EE8, 0.4);
		links.moveTo(nodes[best.vector[0]].position.x, nodes[best.vector[0]].position.y);
		best.vector.forEach(function (point, i) {
			var j = (i+1)%best.vector.length;
			links.lineTo(nodes[best.vector[j]].position.x, nodes[best.vector[j]].position.y);
		});
	}

	return {
		container: container,
		addNode: _addNode,

		init: function () {
			_initGraphics();
			_initColony();
			_init();
		},

		reset: function () {
			_init();
		},

		render: function () {
			var dt = (Date.now() - time) / 1000;

			var toInit = queue.length > 0;
			while (queue.length > 0) {
				var pending = queue.shift();
				_addNode(pending.x, pending.y);
			}

			if (toInit) _init();

			if (dt * ps.speed >= 1) {
				for (var i = 0; i < ps.nbAnts; i++) {
					var candidate = {};
					candidate.vector = _stepwiseConst(ps.heuristic);
					candidate.cost = _cost(candidate.vector);
					if (candidate.cost < best.cost) best = candidate;
					_localUpdatePheromone(candidate);
				}

				_globalUpdatePheromone(best);
				itText.setText("Iteration #" + it++);
				bestText.setText("Best: " + Math.round(best.cost));
				time = Date.now();
			}

			_drawLinks();
			_drawBest();

		}
	};

}(params));