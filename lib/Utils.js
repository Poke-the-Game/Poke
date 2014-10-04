var get_point_orientation = function(p1, p2, p3) {
	/*
	 * 0 -> colinear
	 * > 0 -> counter-clockwise
	 * < 0 -> clockwise
	 * (maybe) TODO: cw/ccw switched?
	 */
	return (p2.y-p1.y)*(p3.x-p2.x)-(p3.y-p2.y)*(p2.x-p1.x);
}

var line_intersection = function(l1, l2) {
	var p1 = l1.start;
	var q1 = l1.end;
	var p2 = l2.start;
	var q2 = l2.end;

	var o1 = get_point_orientation(p1, q1, p2);
	var o2 = get_point_orientation(p1, q1, q2);
	var o3 = get_point_orientation(p2, q2, p1);
	var o4 = get_point_orientation(p2, q2, q1);

	if(
		o1 * o2 <= 0 &&
		o3 * o4 <= 0
	) {
		return true;
	}

	return false;
}


module.exports.line_intersection = line_intersection;