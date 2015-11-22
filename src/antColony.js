var antColony = (function(ps) {
    'use strict';

    // colony
	var it = 0;
	var initPheromone;
	var pheromone;
	var distances;
	var best;
	var time;

    // rendering
    var W = 1600;
    var H = 900;
    var nodeTex = [];
    var nodes = [];
    var queue = [];
    var container = new PIXI.Container();
	var pheromoneSpriteGroup = new PIXI.Container();
	var pheromoneSpritePoll = [];
	var pheromoneTex = [];
    var back = PIXI.Sprite.fromImage('img/1x1.png');
    var trail = new PIXI.Graphics();
    var itText;
    var bestText;
    var nodesText;


	// Add the texture for the pheromones
	for (var i = 1; i <= 3; i++) {
		pheromoneTex.push(PIXI.Texture.fromImage("img/Pheromone_" + i + ".png"));
	}

	function _initPheromoneSprites() {
		pheromoneSpritePoll.forEach(function (sprite) {
			sprite.alpha = 0;
		});
	}

	function _addPheromones(n) {
		for (var p = 0; p < n; p++) {
			var pheromone = new PIXI.extras.MovieClip(pheromoneTex);
			pheromone.animationSpeed = 0.05 + Math.random() * 0.05;
			pheromone.play();
			pheromone.anchor.x = 0.5;
			pheromone.anchor.y = 0.5;
			pheromone.scale.x = 0.25;
			pheromone.scale.y = 0.25;
			pheromone.rotation = Math.random() * 2 * Math.PI;
			// Start the pheromone out of bounds
			pheromone.position.x = -1000;
			pheromone.position.y = -1000;
			pheromoneSpritePoll.push(pheromone);

			// Add the sprite to the container so it is rendered
			pheromoneSpriteGroup.addChild(pheromone);
		}
	}

    function _initGraphics() {
        container.width = 1600;
        container.height = 900;
        container.position.x = 0;
        container.position.y = 0;

        for (var i = 1; i <= 3; i++) {
            nodeTex.push(PIXI.Texture.fromImage("img/Node_" + i + ".png"));
        }

        // background
        back.interactive = true;
		back.position.x = 0;
		back.position.y = 0;
		back.width = 1600;
		back.height = 900;
        back.on('click', function (event) {
            queue.push({
                x: event.data.global.x,
                y: event.data.global.y
            });
        });
        container.addChild(back);

        // trail
        trail.clear();
        container.addChild(trail);

        // text
        itText = new PIXI.Text("Iterations: 0", { font: "35px Karla", fill: "white", align: "left" });
        itText.position.x = 20;
        itText.position.y = 20;
        container.addChild(itText);

        bestText = new PIXI.Text("Best: ?", { font: "35px Karla", fill: "green", align: "left" });
        bestText.position.x = 20;
        bestText.position.y = 60;
        container.addChild(bestText);

        nodesText = new PIXI.Text("Nodes: " + nodes.length, { font: "35px Karla", fill: "white", align: "left" });
        nodesText.position.x = 20;
        nodesText.position.y = 140;
        container.addChild(nodesText);

		// add the pheromone sprite group
		container.addChild(pheromoneSpriteGroup);
        // add the ant
        container.addChild(ant.getSprite());

    }


	// Hard-coded set of default nodes
	// Better looking than random nodes
    function _initColony() {
		_addNode(500, 150);
		_addNode(1000, 250);
		_addNode(1200, 500);
		_addNode(200, 600);
    }

    function _addNode(x, y) {
        var node = new PIXI.extras.MovieClip(nodeTex);
        node.play();
        node.animationSpeed = 0.1;
        node.anchor.x = 0.5;
        node.anchor.y = 0.5;
        node.position.x = x;
        node.position.y = y;
        node.scale.x = 0.20;
        node.scale.y = 0.20;
        node.interactive = true;
        node.mousedown = node.touchstart = function(data) {
            data.data.originalEvent.preventDefault();
            this.data = data;
            this.alpha = 0.9;
            this.dragging = true;
        };
        node.mouseup = node.mouseupoutside = node.touchend = node.touchendoutside = function(data) {
            this.alpha = 1;
            this.dragging = false;
            this.data = null;
            _init(); // restart simulation
        };
        node.mousemove = node.touchmove = function(data) {
            if (this.dragging) {
                var newPosition = data.data.getLocalPosition(this.parent);
                this.position.x = newPosition.x;
                this.position.y = newPosition.y;
            }
        };
        node.buttonMode = true;
        nodes.push(node);
        container.addChild(node);
    }

    function _dist(a, b) {
        return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
    }

    function _cost(perm) {
        return perm.reduce(function (prev, curr, i) {
            return prev + distances[perm[(i+1)%perm.length]][curr];
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
                prob.heuristic = Math.pow(1 / (distances[lastCity][i] || 1e-6), ps.heuristic);
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
        candidate.indices.forEach(function (x, i) {
            var y = candidate.indices[(i+1)%candidate.indices.length];
            var value = ((1-ps.decay)*pheromone[x][y]) + (ps.decay*(1/candidate.cost));
            pheromone[x][y] = pheromone[y][x] = value;
        });
    }

    function _localUpdatePheromone(candidate) {
        candidate.indices.forEach(function (x, i) {
            var y = candidate.indices[(i + 1) % candidate.indices.length];
            var value = ((1 - ps.localPheromone) * pheromone[x][y]) + (ps.localPheromone * initPheromone);
            pheromone[x][y] = pheromone[y][x] = value;
        });
    }

    function _init() {
        _preComputeDistances();
        it = 0;
        time = Date.now();

        var initPerm = _randomPermutation();
        best = {
            'indices': initPerm,
            'cost': _cost(initPerm),
            'path': _indicesToNodes(initPerm)
        };

        initPheromone = 1.0 / (nodes.length * best.cost);
        _initPheromoneMatrix();
		_initPheromoneSprites();

    }

    function _preComputeDistances() {
        distances = [];
        for (var i = 0; i < nodes.length; i++) {
            distances.push([]);
            for (var j = 0; j < nodes.length; j++) {
                distances[i].push(_dist(nodes[i], nodes[j]));
            }
        }
    }

    function _indicesToNodes(indices) {
        return indices.map(function (id) { return nodes[id]; });
    }

    function _drawLinks() {
		var pheromoneCounter = 0;
        for (var i = 0; i < pheromone.length; i++) {
            for (var j = i + 1; j < pheromone[i].length; j++) {
                if (i !== j) {
					var start = nodes[i].position;
					var end = nodes[j].position;
					var alpha = util.clamp(pheromone[i][j] * 12000, 0, 1);
					var steps = Math.round(util.lerp(60, 24, alpha));
					var points = util.pointsOnLine(start, end, steps);
					if (alpha < 0.05) {
						continue;
					}
					if (pheromoneCounter + points.length >= pheromoneSpritePoll.length) {
						_addPheromones(points.length);
					}
					for (var p = 0; p < points.length; p++) {
						var phero = pheromoneSpritePoll[pheromoneCounter];
						phero.alpha = alpha;
						phero.position.x = points[p][0];
						phero.position.y = points[p][1];
						pheromoneCounter++;
					}
                }
            }
        }

		// Hide pheromones that are not used
		for (var k = pheromoneCounter; k < pheromoneSpritePoll.length; k++) {
			pheromoneSpritePoll[pheromoneCounter].alpha = 0;
		}
    }

    function _drawBest() {
        trail.clear();
        trail.lineStyle(10, 0x0C7EE8, 0.4);
        trail.moveTo(best.path[0].position.x, best.path[0].position.y);
        best.path.forEach(function (point, i) {
            var j = (i+1)%best.path.length;
            trail.lineTo(best.path[j].position.x, best.path[j].position.y);
        });
    }

	function _step() {
		for (var i = 0; i < ps.nbAnts; i++) {
			var candidate = {};
			candidate.indices = _stepwiseConst(ps.heuristic);
			candidate.cost = _cost(candidate.indices);
			// Use it === 1 to invalidate the first random choice
			if (candidate.cost < best.cost || it === 1) {
				best = candidate;
				best.path = _indicesToNodes(best.indices);
				best.it = it;
				ant.followPath(best.path);
				_drawLinks();
				_drawBest();
			}
			_localUpdatePheromone(candidate);
		}

		_globalUpdatePheromone(best);
		itText.text = 'Iteration #' + it++;
		bestText.text = "Best: " + Math.round(best.cost) + "\nfound at #" + best.it;
		nodesText.text = "Nodes: " + nodes.length;
		time = Date.now();
	}

    return {
        container: container,
        addNode: _addNode,

        init: function (width, height) {
            W = width;
            H = height;
            _initGraphics();
            _initColony();
            _init();
        },

        reset: function () {
            _init();
        },

        togglePheromones: function () {
            pheromoneSpriteGroup.visible = ps.showPheromones;
        },

        togglePath: function () {
            trail.visible = ps.showPath;
        },

        render: function () {
            var dt = (Date.now() - time) / 1000;

            var toInit = queue.length > 0;
            while (queue.length > 0) {
                var pending = queue.shift();
                _addNode(pending.x, pending.y);
            }

            if (toInit) _init();

			if (dt * ps.simulationSpeed >= 1) {
				_step(dt);
			}
        }
    };

}(params));
