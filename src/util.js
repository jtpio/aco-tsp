var util = (function (ps) {

	return {

		// Bresenham's line algorithm
		// Implementation inspired by Phaser's Line:
		// https://github.com/photonstorm/phaser/blob/v2.4.4/src/geom/Line.js
		pointsOnLine: function (start, end, stepRate, results) {

			if (stepRate === undefined) { stepRate = 1; }
			if (results === undefined) { results = []; }

			var x1 = Math.round(start.x);
			var y1 = Math.round(start.y);
			var x2 = Math.round(end.x);
			var y2 = Math.round(end.y);

			var dx = Math.abs(x2 - x1);
			var dy = Math.abs(y2 - y1);
			var sx = (x1 < x2) ? 1 : -1;
			var sy = (y1 < y2) ? 1 : -1;
			var err = dx - dy;

			results.push([x1, y1]);

			var i = 1;

			while (!((x1 == x2) && (y1 == y2))) {
				var e2 = err << 1;

				if (e2 > -dy) {
					err -= dy;
					x1 += sx;
				}

				if (e2 < dx) {
					err += dx;
					y1 += sy;
				}

				if (i % stepRate === 0) {
					results.push([x1, y1]);
				}

				i++;

			}

			return results;

		},

		clamp: function (v, min, max) {
			return Math.min(Math.max(v, min), max);
		},

		lerp: function (s, e, t) {
			return (1 - t) * s + t * e;

		}
	};

}());
