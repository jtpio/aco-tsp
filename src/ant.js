var ant = (function(ps) {
    'use strict';

    // rendering
    var W = 1600,
        H = 900,
        antTex = [],
        tweens = [],
        ant,
        vanish;

    function _initGraphics() {
        for (var i = 1; i <= 3; i++) {
            antTex.push(PIXI.Texture.fromImage("img/Ant_" + i + ".png"));
        }

        ant = new PIXI.MovieClip(antTex);
        ant.animationSpeed = 0.1;
        ant.play();
        ant.anchor.x = 0.5;
        ant.anchor.y = 0.5;
        ant.scale.x = 0.6;
        ant.scale.y = 0.6;
        ant.position.x = W / 2;
        ant.position.y = H / 2;

    }

    function _steerAngle(start, end) {
        var dx = end.x - start.x,
            dy = end.y - start.y;
        return Math.atan2(dy, dx) + Math.PI / 2;
    }

    return {

        init: function (width, height) {
            W = width;
            H = height;
            _initGraphics();
        },

        getSprite: function () {
            return ant;
        },

        followPath: function (path) {
            if (tweens[0]) tweens[0].stop();
            if (vanish) vanish.stop();

            var rot = {angle: ant.rotation};
            tweens = _.flatten(path.map(function (p, i) {
                return [
                    new TWEEN.Tween(rot)
                        .to({angle: _steerAngle(p, path[(i+1)%path.length].position)}, 100 / ps.antSpeed)
                        .easing(TWEEN.Easing.Quadratic.Out)
                        .onUpdate(function () {
                            ant.rotation = this.angle;
                        }),
                    new TWEEN.Tween(ant.position)
                        .to(path[(i+1)%path.length].position, 1000 / ps.antSpeed)
                        .easing(TWEEN.Easing.Cubic.Out)
                        .onUpdate(function () {
                            ant.position.x = this.x;
                            ant.position.y = this.y;
                        })
                ];
            }));

            vanish = new TWEEN.Tween({alpha: ant.alpha})
                .to({alpha: 0}, 500)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(function () {
                    ant.alpha = this.alpha;
                })
                .onComplete(function () {
                    ant.position.x = path[0].position.x;
                    ant.position.y = path[0].position.y;
                });

            var appear = new TWEEN.Tween({alpha: ant.alpha})
                .to({alpha: 1}, 500)
                .easing(TWEEN.Easing.Quadratic.Out)
                .onUpdate(function () {
                    ant.alpha = this.alpha;
                });

            vanish.chain(appear);
            appear.chain(tweens[0]);

            tweens.forEach(function (t, i) {
                t.chain(tweens[(i+1)%tweens.length]);
            });

            vanish.start();

        }

    };

})(params);