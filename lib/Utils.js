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
	o1 /= (o1!=0)?Math.abs(o1):42; // the answer
	var o2 = get_point_orientation(p1, q1, q2);
	o2 /= (o2!=0)?Math.abs(o2):23; // conspiracy
	var o3 = get_point_orientation(p2, q2, p1);
	o3 /= (o3!=0)?Math.abs(o3):13; // the bad luck
	var o4 = get_point_orientation(p2, q2, q1);
	o4 /= (o4!=0)?Math.abs(o4):7; // bond, yames bond

	if(
		o1 != o2 &&
		o3 != o4
	) {
		return true;
	}

	return false;
}

var point_in_rectangle = function(p, rect) {
	if(
		p.x > rect.x &&
		p.y > rect.y &&
		p.x < rect.x+rect.w &&
		p.y < rect.y+rect.h
	) {
		return true;
	}

	return false;
}

var rect_intersection = function(rect1, rect2) {
	var p1 = {x: rect1.x, y: rect1.y};
	var p2 = {x: rect1.x+rect1.w, y: rect1.y};
	var p3 = {x: rect1.x+rect1.w, y: rect1.y+rect1.h};
	var p4 = {x: rect1.x, y: rect1.y+rect1.h};
	var points = [p1, p2, p3, p4];

	// check complete overlap
	if(
		rect1.x == rect2.x &&
		rect1.y == rect2.y
	) {
		return true;
	}

	// check partial intersection
	for(var i in points) {
		var cur_point = points[i];

		if(point_in_rectangle(cur_point, rect2)) {
			return true;
		}
	}

	return false;
}

function escapeHtml(text) {
  return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
}


module.exports.line_intersection = line_intersection;
module.exports.rect_intersection = rect_intersection;
module.exports.escapeHtml = escapeHtml; 
