//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
//|||||||||||||||||  This is CR |||||||||||||||||||||||||||||||
//|||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||

var mainCR = generateMainCR();
mainCR.appendTo(docBody);

mainCR.enable = function() {
	mainCR.isRuling = true;
	mainCR.shim = generateShim(10003);
	mainCR.shim.appendTo(docBody);
	mainCR.setFill(CR_fill);
	docBody.addEventListener('mousedown', addRulerCanvas);
}

mainCR.disable = function() {
	mainCR.isRuling = false;

	mainCR.shim && mainCR.shim.destroy();
	mainCR.shim = null;
	mainCR.setFill('white');
	docBody.removeEventListener('mousedown', addRulerCanvas);

	if (mainCR.lastRuler) {    // purge last ruler
		mainCR.lastRuler.detach();
		mainCR.lastRuler = null;
	}
}

mainCR.on('click', function() {
	mainCR.isRuling = !mainCR.isRuling;

	if (mainCR.isRuling) {
		mainCR.enable();
	}
	else {
		mainCR.disable();
	}
});

//Ruler starts here
function addRulerCanvas(e) {
	var ox = checkSnap('x', e.pageX),
		oy = checkSnap('y', e.pageY);

	var svg  = new SVG('svg'),
		path = new SVG('path'),
		text = new SVG('text'),
		filter = generateFilter();

	if (mainCR.lastRuler) {    // purge last ruler
		mainCR.lastRuler.detach();
	}
	mainCR.lastRuler = svg;

	svg.attr({
		style : {
			'position': 'absolute',
			'min-height' : '100%',
			'min-width'  : '100%',
			'width'   : pageDimension().width,
			'height'  : pageDimension().height,
			'left'    : 0,
			'top'     : 0,
			'zIndex'  : 10003
		}
	});

	text.attr({
		'font-size': '20px',
		'fill' : 'black',
		//'filter' : 'url(#'+filter.id+')'
	});

	path.attr({
		'shape-rendering' : 'geometricPrecision',
		fill : ruler_color
	});

	svg.append(path).append(text).append(filter)
	   .appendTo(docBody);

	docBody.addEventListener('mousemove', moveRuler);
	docBody.addEventListener('mouseup', detachRuler);

	function moveRuler(e) {
		var x = checkSnap('x', e.pageX),
			y = checkSnap('y', e.pageY);

		if (e.shiftKey) {    // shift key is pressed
			if (Math.abs(x-ox) < Math.abs(y-oy))
				x = ox;
			else
				y = oy;
		}

		var dx = (x-ox) < 0 ? -1 : 1,
			dy = (y-oy) < 0 ? -1 : 1; 


		d = marker(ox,oy,dx,dy) +
			marker(x,y,(x==ox) ? dx : -dx, (y==oy) ? dy : -dy) +
			conn(ox,oy,x,y);
		path.attr('d', d);

		var relX = !(x - ox) ?  0 : x-ox+1,
			relY = !(y - oy) ?  0 : y-oy+1;
		text.setTextContent(
				Math.round(
					Math.sqrt( Math.pow(relX,2) + Math.pow(relY, 2) )*1000
				)/1000 + 'px'
			).attr('x', ox+relX/2)
			 .attr('y', oy+relY/2)
			 .attr('text-anchor', relX*relY == 0 ? 'middle' : 
								  dx*dy > 0 ?  'start' : 'end');
	}

	function detachRuler(e) {
		docBody.removeEventListener('mousemove', moveRuler);
		docBody.removeEventListener('mouseup', detachRuler);
	}
	

	var t = 25;
	function marker(x,y,dx,dy) {
		var str = '';
		dx > 0 && x++;
		dy > 0 && y++;

		// have to keep everything counter cw --- fill mode is lame
		if (dx*dy > 0)
			str += _('M',x,y) + _('h',dx*(t-1)) + _('v',-dy) +
				   _('h',-dx*t) + _('v',dy*t) + _('h',dx) + 'z';
		else
			str += _('M',x,y) + _('v',dy*(t-1)) + _('h', -dx) +
				   _('v',-dy*t) + _('h',dx*t) + _('v',dy) + 'z';

		return str;
	}

	function conn(ox,oy,x,y) {
		var str = '',
			dx = (x-ox) < 0 ? -1 : 1,
			dy = (y-oy) < 0 ? -1 : 1;

		if (dx > 0) {
			x++; ox++;
		}
		if (dy < 0) {
			y++; oy++;
		}

		// have to keep everything counter cw --- fill mode is lame
		if (dx*dy > 0)
			str += _('M',ox,oy) + _('l',-dx,dy) + _('l',x-ox,y-oy) + _('l',dx,-dy) + 'z';
		else
			str += _('M',ox,oy) + _('l',x-ox,y-oy) + _('l',-dx,dy) + _('l',ox-x,oy-y) + 'z';

		return str;
	}

	function checkSnap(type, v) {
		var array;
		if (type == 'x')
			array = VRx;
		else
			array = HRy;

		for (var i=0, l = array.length; i<l; i++) {
			var V = array[i];
			if ( V > (v-5) && V < (v+5) )
				return V;
			else if ( (v+5) < V)   //no point continuing on sorted Array
				break;
		}
		return v;
	}

	stopEvent(e);
};

function generateMarkers(color) {
	var defs = new SVG('defs'),
		marker_endID = 'mArrow_' + new Date().getTime()+ Math.round(Math.random()*10000);
		marker_startID = 'mArrow_' + new Date().getTime()+ Math.round(Math.random()*10000);

	defs.append({
		'$marker_end' : {
			viewBox     : "0 0 10 10",
			refX        : "10",
			refY        : "5",
			markerUnits : "strokeWidth",
			markerWidth : "10",
			markerHeight: "5",
			orient      : "auto",
			fill        : color,
			id          : marker_endID,
			'$path' : {
				d : 'M 0 0 L 10 5 L 0 10 z'
			}
		},
		'$marker_start' : {
			viewBox     : "0 0 10 10",
			refX        : "0",
			refY        : "5",
			markerUnits : "strokeWidth",
			markerWidth : "10",
			markerHeight: "5",
			orient      : "auto",
			fill        : color,
			id          : marker_startID,
			'$path' : {
				d : 'M 0 5 L 10 0 L 10 10 z'
			}
		}
	});

	defs.markerEndID = marker_endID;
	defs.markerStartID = marker_startID;
	return defs;
}

function generateFilter() {
	var defs = new SVG('defs'),
		id = new Date().getTime()+Math.round(Math.random()*10000);

	defs.append({
		'$filter' : {
			'id' : id,
			'width' : '100%',
			'height' : '100%',
			'$feOffset' : {
				'result' : 'offOut',
				'in' : 'SourceGraphic'
			},
			'$feColorMatrix' : {
				'result' :  'matrixOut',
				'in' : 'offOut',
				'type' : 'matrix',
				'value' : '.33 .33 .33 0 0 ' +
						  '.33 .33 .33 0 0 ' +
						  '.33 .33 .33 0 0 ' +
						  '.33 .33 .33 0 0'
			},
			'$feBlend' : {
				'in' : 'SourceGraphic',
				'in2' : 'matrixOut',
				'mode' : 'normal'
			}
		}
	});

	defs.id = id;
	return defs;
}

function generateMainCR() {
	var THICKNESS = 15;

	var svg = new SVG('svg');

	var background = new SVG('rect');
		background.attr({
			'x': 0,
			'y': 0,
			'width':  THICKNESS,
			'height': THICKNESS,
			'fill':   'white'
		});
	background.appendTo(svg);

	svg.attr({
		'width': THICKNESS,
		'height': THICKNESS,
		'preserveAspectRatio': 'none',
		'style': {
			'position': 'fixed',
			'top': 0,
			'left': 0,
			'zIndex' : 999999,
			'cursor': 'pointer'
		}
	}).append({
		'$rect_1' : {
			'x': THICKNESS -1,
			'y': 0,
			'height': THICKNESS,
			'width': 1,
			'fill': 'black'
		},
		'$rect_2' : {
			'y': THICKNESS -1,
			'x': 0,
			'width': THICKNESS,
			'height': 1,
			'fill': 'black'
		},
	});

	svg.setFill =  function (value) {
		background.attr('fill',value);
		return svg;
	}

	return svg;
}