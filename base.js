const print = console.log;
const LS = localStorage; // client side data storage

function ctrlsPopup() { // opens a popup window with keybinds

	const p = window.open('controls.html', 'popup', 'width=1200,height=800');
	var reloading = false;

	setInterval(() => {
		// event onbeforeunload wont work and idk why so i gotta use this
		if (p.closed && !reloading) {
			location.reload();
			reloading = true;
		}
	}, 100);

}

function aboutPopup() {
	window.alert(`START BY ADJUSTING KEYBINDS AND SETTINGS
zztetris
a tetris client with a name that starts with zz so you can type zz and have it autocomplete
forked from aznguy's schoolteto, a number of features added
inspired by fio's four-tris
---
Import/Export works through your clipboard. Doesn't work on Firefox.
Undo/redo is a thing. It keeps track of your board state history.
*Full* fumen import/export sets your board state history as the fumen pages and vice versa.
Drawing on the board is a thing.`);
}

// Array.prototype.getRand = function () {
// 	return this[Math.floor(Math.random() * this.length)];
// };
// Array.prototype.shuffle = function () {
//     let i = this.length, j, temp;
//     if (i == 0) return this;
//     while ( --i ) {
//         j = Math.floor( Math.random() * ( i + 1 ) );
//         temp = this[i];
//         this[i] = this[j];
//         this[j] = temp;
//     }
//     return this;
// };


//! Use Object.defineProperty instead of directly modifying Array.prototype
//! https://stackoverflow.com/a/35518127

Object.defineProperty(Array.prototype, 'getRand', { // returns random element from array

	//? this function is unused, delete? - g3ner1c

    value: function() {
		return this[Math.floor(Math.random() * (this.length + 1))];
	}

});

Object.defineProperty(Array.prototype, 'shuffle', {

	value: function() { // shuffles array

		let i = this.length, j, temp;

		if (i == 0) return this; // array length 0

		while (--i) {
			j = Math.floor(Math.random() * (i + 1));
			temp = this[i];
			this[i] = this[j];
			this[j] = temp;
		}
		return this;
	}
});

var ctrl = { // default controls

	//? should probably add handling settings in here - g3ner1c

	ArrowLeft: 'L',
	ArrowRight: 'R',
	ArrowDown: 'SD',
	Space: 'HD',
	ShiftLeft: 'HL',
	KeyX: 'CW',
	KeyZ: 'CCW',
	KeyC: 'R180',
	KeyR: 'RE',
	KeyT: 'UNDO',
	KeyY: 'REDO',

};

const flags = {
	HD: 1,
	R: 2,
	L: 4,
	SD: 8,
	HL: 16,
	CW: 32,
	CCW: 64,
	R180: 128,
	UNDO: 256,
	REDO: 512,
	RE: 1024,
};

const color = { // piece colors
	Z: '#F00',
	L: '#F80',
	O: '#FF0',
	S: '#0F0',
	I: '#0BF',
	J: '#05F',
	T: '#C3F',
	A: '#2A2A2A',
	X: '#999999',
};

const reversed = { // mirrored pieces
	Z: 'S',
	L: 'J',
	O: 'O',
	S: 'Z',
	I: 'I',
	J: 'L',
	T: 'T',
	A: 'A',
	X: 'X',
	'|': '|',
};

var imgs = { // piece images
	grid: './assets/pieceSprite/grid.png',
	Z: './assets/pieceSprite/z.png',
	L: './assets/pieceSprite/l.png',
	O: './assets/pieceSprite/o.png',
	S: './assets/pieceSprite/s.png',
	I: './assets/pieceSprite/i.png',
	J: './assets/pieceSprite/j.png',
	T: './assets/pieceSprite/t.png',
};

// default settings
var cellSize = 20; // pixels
var boardSize = [10, 40];
var hiddenRows = 20; // starts from the top

var DAS = 160;
var ARR = 30;
var SDR = 15;
var audiolevel = 100;

//* client side config storage

//? Sketchy settings processing probably could be simplified
//? Should probably add handling settings in here in the future - g3ner1c

if (LS.config && LS.version == '2023-05-02a') {

	// Load saved config from LocalStorage

	const CTRLS = JSON.parse(LS.config);

	let codes = Object.values(ctrl); // Action codes

	ctrl = {};
	for (let i = 0; i < 11; i++) {
		ctrl[CTRLS[i]] = codes[i];
	}
	DAS = parseInt(CTRLS[11]);
	ARR = parseInt(CTRLS[12]);
	SDR = parseInt(CTRLS[13]);
	cellSize = parseInt(CTRLS[14]);
    audiolevel = parseInt(CTRLS[15]);
    console.log("Loaded Vars");

} else {

	// No config found or outdated version, make new
    console.log("No Config Found");
	let codes = Object.keys(ctrl); // Deafult keys
	codes.push('160', '30', '15', '20','100'); // Handling settings
	LS.config = JSON.stringify(codes);
	aboutPopup();

}

const notf = $('#notif');

const names = 'ZLOSIJT'.split(''); // piece names

const spawn = [Math.round(boardSize[0] / 2) - 2, hiddenRows - 3];
const a = { t: 0, c: '' }; // t:0 = nothing   t:1 = heap mino   t:2 = current mino   t:3 = ghost mino
//? ^^ ??? - g3ner1c

var aRow = function () {
    // var instead of const because aRow varies across modes
	return '.'
		.repeat(boardSize[0])
		.split('')
		.map(() => {
			return a;
		});
};
const rotDir = {
	CW: 1,
	CCW: 3,
	R180: 2,
};

var sfxCache = {};
var board = [];
var queue = [];
var piece = '';
var holdP = '';
var held = false;
var Ldn = (Rdn = false);
var rot = 0;
var oldcombo = 0;
var oldb2b = 0;
var dasID = 0;
var sdINT = (dasINT = null);
var xPOS = spawn[0];
var yPOS = spawn[1];
var xGHO = spawn[0];
var yGHO = spawn[1];
var lastAction = '';
var hist = [];
var histPos = 0;
var ctx = document.getElementById('b').getContext('2d');
var ctxH = document.getElementById('h').getContext('2d');
var ctxN = document.getElementById('n').getContext('2d');
var gridCvs = document.createElement('canvas');
gridCvs.height = cellSize;
gridCvs.width = cellSize;
var gridCtx = gridCvs.getContext('2d');
gridCtx.fillStyle = '#000000';
gridCtx.fillRect(0, 0, cellSize, cellSize);
gridCtx.strokeStyle = '#3A3A3A';
gridCtx.strokeRect(0, 0, cellSize, cellSize);
var pattern = ctx.createPattern(gridCvs, 'repeat');
for (let i = 0; i < boardSize[1]; i++) {
	board.push(aRow());
}
document.getElementById('b').height = (boardSize[1] - hiddenRows + 2) * cellSize;
document.getElementById('b').width = boardSize[0] * cellSize;

var keys = Object.keys(imgs);
keys.map((k, idx) => {
	var i = new Image();
	i.onload = () => {
		imgs[k] = i;
		if (idx + 1 == keys.length)
			setTimeout(() => {
				game();
			}, 250); // Load images first, then load game after
	};
	i.src = imgs[k];
});

// Keys
var keysDown;
var lastKeys;

// mouse stuff for drawing

mouseY = 0; // which cell on the board the mouse is over
mouseX = 0;
mouseDown = false;
drawMode = true;
movingCoordinates = false;

document.getElementById('b').onmousemove = function mousemove(e) {
	rect = document.getElementById('b').getBoundingClientRect();
	y = Math.floor((e.clientY - rect.top - 18) / cellSize);
	x = Math.floor((e.clientX - rect.left - 18) / cellSize);

	if (inRange(x, 0, 9) && inRange(y, 0, 21)) {
		movingCoordinates = y != mouseY || x != mouseX;

		mouseY = y;
		mouseX = x;

		if (mouseDown && movingCoordinates) {
			if (!drawMode) {
				board[boardSize[1] + mouseY - hiddenRows - 2][mouseX] = { t: 0, c: '' };
			} else {
				board[boardSize[1] + mouseY - hiddenRows - 2][mouseX] = { t: 1, c: paintbucketColor() };
			}
			updateGhost();
		}
	}
};

document.getElementById('b').onmousedown = function mousedown(e) {
	rect = document.getElementById('b').getBoundingClientRect();
	mouseY = Math.floor((e.clientY - rect.top - 18) / cellSize);
	mouseX = Math.floor((e.clientX - rect.left - 18) / cellSize);

	if (inRange(mouseX, 0, 9) && inRange(mouseY, 0, 21)) {
		if (!mouseDown) {
			movingCoordinates = false;
			drawMode = e.button != 0 || board[boardSize[1] + mouseY - hiddenRows - 2][mouseX]['t'] == 1;
			if (drawMode) {
				board[boardSize[1] + mouseY - hiddenRows - 2][mouseX] = { t: 0, c: '' };
			} else {
				board[boardSize[1] + mouseY - hiddenRows - 2][mouseX] = { t: 1, c: paintbucketColor() };
			}
			updateGhost();
		}
		mouseDown = true;
		drawMode = board[boardSize[1] + mouseY - hiddenRows - 2][mouseX]['t'] == 1;
	}
};

document.onmouseup = function mouseup() {
	mouseDown = false;

	if (drawMode) {
		// compare board with hist[histPos]['board'] and attempt to autocolor
		drawn = [];
		erased = [];
		oldBoard = JSON.parse(hist[histPos]['board']);
		board.map((r, i) => {
			r.map((c, ii) => {
				if (c.t == 1 && c.c != oldBoard[i][ii].c) drawn.push({ y: i, x: ii });
				if (c.t == 0 && 1 == oldBoard[i][ii].t) erased.push({ y: i, x: ii });
			});
		});
		if (drawn.length == 4 && document.getElementById('autocolor').checked) {
			// try to determine which tetramino was drawn
			// first entry should be the topleft one

			names.forEach((name) => {
				// jesus christ this is a large number of nested loops
				checkPiece = pieces[name];
				checkPiece.forEach((rot) => {
					for (y = 0; y <= 2; y++) {
						for (x = 0; x <= 2; x++) {
							matches = 0;
							for (row = 0; row < 4; row++) {
								for (col = 0; col < 4; col++) {
									if (rot[row][col] == 1) {
										checkY = row + drawn[0].y - y;
										checkX = col + drawn[0].x - x;
										drawn.forEach((coordinate) => {
											if (coordinate.x == checkX && coordinate.y == checkY) {
												matches++;
											}
										});
									}
								}
							}
							if (matches == 4) {
								// that's a match; color it
								drawn.forEach((coordinate) => {
									board[coordinate.y][coordinate.x].c = name;
								});
							}
						}
					}
				});
			});
		}
		if (drawn.length != 0 || erased.length != 0) updateHistory();
	}
};

function paintbucketColor() {
	for (i = 0; i < document.paintbucket.length; i++) {
		if (document.paintbucket[i].checked) {
			return document.paintbucket[i].id;
		}
	}
}

// queue
document.getElementById('n').addEventListener('click', (event) => {
	let QueueInput = prompt('Queue', piece + queue.join('')).toUpperCase();
	// ok there's probably a regex way to do this but...
	temp = [];
	for (i = 0; i < QueueInput.length; i++) {
		//sanitization
		if ('SZLJIOT'.includes(QueueInput[i])) temp.push(QueueInput[i]);
	}
	if (temp.length > 0) {
		temp.push('|'); // could probably insert one every 7 pieces but am too lazy
		queue = temp;
		newPiece();
	}
	updateHistory();
});

// hold
document.getElementById('h').addEventListener('click', (event) => {
	let HoldInput = prompt('Hold', holdP).toUpperCase();
	if (HoldInput.length == 0) {
		holdP = '';
		updateQueue();
		return;
	}
	HoldInput = HoldInput[0]; // make sure it's just 1 character
	//sanitization
	if ('SZLJIOT'.includes(HoldInput)) {
		holdP = HoldInput;
		updateQueue();
	}
});

// Mobile buttons
const ua = navigator.userAgent;
if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
	console.log('why do you even have a tablet');
	document.getElementById('tcc').style.display = 'inline-block';
} else if (
	/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)
) {
	console.log('mobile is bad and you should feel bad');
	document.getElementById('tcc').style.display = 'inline-block';
} // else document.getElementById("tcc").style.display = 'none';

function updateHistory() {
	histPos++;
	hist[histPos] = {
		board: JSON.stringify(board),
		queue: JSON.stringify(queue),
		hold: holdP,
		piece: piece,
	};
	if (histPos > 500) {
		// just in case hist is taking up too much memory
		hist.splice(0, 100);
		histPos -= 100;
	}
	while (histPos < hist.length - 1) {
		// remove future history if it exists
		hist.pop();
	}
}

function updateGhost() {
	// updateGhost() must ALWAYS be before setShape()
	xGHO = xPOS;
	yGHO = yPOS;
	while (canMove(pieces[piece][rot], xGHO, yGHO + 1)) {
		yGHO++;
	}
}

function canMove(p, x, y) {
	var free = 0;
	for (let row = 0; row < 4; row++) {
		for (let cell = 0; cell < 4; cell++) {
			if (p[row][cell] == 1) {
				if (board[y + row] && board[y + row][x + cell] && board[y + row][x + cell].t != 1) {
					free++;
				}
			}
		}
	}
	return free >= 4;
}

function checkTopOut() {
	p = pieces[piece][rot];
	for (r = 0; r < p.length; r++) {
		for (c = 0; c < p[0].length; c++) {
			if (p[r][c] != 0) {
				if (board[r + yPOS][c + xPOS].t == 1) {
					notify('TOP OUT');
				}
			}
		}
	}
}

function setShape(hd) {
	var p = pieces[piece][rot];
	p.map((r, i) => {
		r.map((c, ii) => {
			var rowG = board[i + yGHO];
			if (c == 1 && rowG && rowG[ii + xGHO]) rowG[ii + xGHO] = { t: 3, c: piece };
			var rowP = board[i + yPOS];
			if (c == 1 && rowP && rowP[ii + xPOS]) rowP[ii + xPOS] = { t: hd ? 1 : 2, c: piece };
		});
	});
	//render()
}

function clearActive() {
	board.map((r, i) => {
		r.map((c, ii) => {
			if (c.t == 2 || (c.t == 3 && board[i][ii])) {
				board[i][ii].t = 0;
				board[i][ii].c = '';
			}
		});
	});
}

function newPiece() {
	while (queue.length < 10) {
		var shuf = names.shuffle();
		shuf.map((p) => queue.push(p));
		queue.push('|');
	}
	xPOS = spawn[0];
	yPOS = spawn[1];
	rot = 0;
	if (queue[0] == '|') queue.shift();
	piece = queue.shift();
	checkTopOut();
	updateQueue();
	updateGhost();
	setShape();

	if (keysDown & flags.L) {
		lastKeys = keysDown;
	} else if (keysDown & flags.R) {
		lastKeys = keysDown;
	}
}

function notify(text) {
	const inANIM = 'animate__animated animate__bounceIn';
	const outANIM = 'animate__animated animate__fadeOutDown';
	notf.removeClass(inANIM);
	notf.removeClass(outANIM);
	notf.html(text);
	notf.addClass(inANIM);
	setTimeout(() => {
		notf.removeClass(inANIM);
		notf.addClass(outANIM);
	}, 1000);
}

function undo() {
	if (histPos > 0) {
		histPos--;
		board = JSON.parse(hist[histPos]['board']);
		queue = JSON.parse(hist[histPos]['queue']);
		holdP = hist[histPos]['hold'];
		piece = hist[histPos]['piece'];
        if (combo >= 1)
        {
            combo-=1;
        }
        else
        {
            combo=oldcombo;
        }
        if(b2b >= 1 && (tspin || cleared == 4))
        {   
            b2b-=1;
        }
        else
        {
            b2b = oldb2b;        
        }
		xPOS = spawn[0];
		yPOS = spawn[1];
		rot = 0;
		clearActive();
		updateGhost();
		setShape();
		updateQueue();
	}
}

function redo() {
	if (histPos < hist.length - 1) {
		board = JSON.parse(hist[histPos + 1]['board']);
		queue = JSON.parse(hist[histPos + 1]['queue']);
		holdP = hist[histPos + 1]['hold'];
		piece = hist[histPos + 1]['piece'];
		histPos++;

		xPOS = spawn[0];
		yPOS = spawn[1];
		rot = 0;
		clearActive();
		updateGhost();
		setShape();
		updateQueue();
	}
}

function callback(gravity=700, special_restart=false, cheese=false) {
	// pieces = SRSX.pieces;
	// kicks = SRSX.kicks;
	kicks = kicksets['SRS+'];
    lastCol = Math.floor(Math.random() * 10);

	keysDown = 0;
	lastKeys = 0;

	document.getElementById('tc-un').addEventListener('touchstart', function (e) {
		input = 'UNDO';
		keysDown |= flags[input];
		undo();
	});

	document.getElementById('tc-re').addEventListener('touchstart', function (e) {
		input = 'RE';
		keysDown |= flags[input];
		restart();
	});

	document.getElementById('tc-hd').addEventListener('touchstart', function (e) {
		input = 'HD';
		keysDown |= flags[input];
		hardDrop();
	});

	document.getElementById('tc-h').addEventListener('touchstart', function (e) {
		input = 'HL';
		keysDown |= flags[input];
		hold();
	});

	document.getElementById('tc-dr').addEventListener('touchstart', function (e) {
		input = 'R180';
		keysDown |= flags[input];
		rotate('R180');
	});

	document.getElementById('tc-cc').addEventListener('touchstart', function (e) {
		input = 'CCW';
		keysDown |= flags[input];
		rotate('CCW');
	});

	document.getElementById('tc-c').addEventListener('touchstart', function (e) {
		input = 'CW';
		keysDown |= flags[input];
		rotate('CW');
	});

	document.getElementById('tc-d').addEventListener('touchstart', function (e) {
		input = 'SD';
		keysDown |= flags[input];
		softDrop();
	});

	document.getElementById('tc-d').addEventListener('touchend', function (e) {
		input = 'SD';
		if (keysDown & flags[input]) keysDown ^= flags[input];
	});

	document.getElementById('tc-r').addEventListener('touchstart', function (e) {
		input = 'R';
		keysDown |= flags[input];
	});

	document.getElementById('tc-r').addEventListener('touchend', function (e) {
		input = 'R';
		if (keysDown & flags[input]) keysDown ^= flags[input];
		if (!(keysDown & flags.L) && !(keysDown & flags.R)) {
			dasID++;
		}
	});

	document.getElementById('tc-l').addEventListener('touchstart', function (e) {
		input = 'L';
		keysDown |= flags[input];
	});

	document.getElementById('tc-l').addEventListener('touchend', function (e) {
		input = 'L';
		if (keysDown & flags[input]) keysDown ^= flags[input];
		if (!(keysDown & flags.L) && !(keysDown & flags.R)) {
			dasID++;
		}
	});


	//* keyboard input
	document.addEventListener('keydown', e => {
		const input = ctrl[e.code];
		if (input) keysDown |= flags[input]; //* sets key in keysDown
		if (e.repeat) return; //* if held down, do nothing
		if (input) {
			switch (input) {  // handles non-movement keys
				case 'SD':
					softDrop();
					break;
				case 'HD':
					hardDrop();
					break;
				case 'HL':
					hold();
					break;
				case 'CW':
					rotate('CW');
					break;
				case 'CCW':
					rotate('CCW');
					break;
				case 'R180':
					rotate('R180');
					break;
				case 'RE':
					restart();
					break;
				case 'UNDO':
					undo();
					break;
				case 'REDO':
					redo();
					break;
			}
		}
	});

	document.addEventListener('keyup', function (e) {
		const input = ctrl[e.code];
		if (input) {
			if (keysDown & flags[input]) keysDown ^= flags[input];
			// remove key from keysDown
			if (!(keysDown & flags.L) && !(keysDown & flags.R)) {
				dasID++;
			}
		}
	});

	newPiece();
	hist = [
		{
			board: JSON.stringify(board),
			queue: JSON.stringify(queue),
			hold: holdP,
			piece: piece,
		},
	];
	histPos = 0;
	combo = -1;
    oldcombo = -1;
    oldb2b = 0;
	b2b = 0;

    if (special_restart) {
        restart();
    }

	fullQuery = window.location.search;
	if (fullQuery.length > 0 && fullQuery[0] == '?') {
		queries = fullQuery.slice(1).split('&');
		for (let query of queries) {
			if (query.length > 0) {
				if (query.slice(0, 6) == 'fumen=') {
					// waow lazy handling
					fumen = query.slice(6);
					try {
						result = fullDecode(fumen, hist[0]);
						hist = JSON.parse(JSON.stringify(result));
						histPos = 0;
						board = JSON.parse(hist[0]['board']);
						queue = JSON.parse(hist[0]['queue']);
						holdP = hist[0]['hold'];
						piece = hist[0]['piece'];
						xPOS = spawn[0];
						yPOS = spawn[1];
						rot = 0;
						clearActive();
						updateGhost();
						setShape();
						updateQueue();
					} catch (error) {
						console.log(error);
					}
				}
				if (query.slice(0, 4) == 'pos=') {
					pos = parseInt(query.slice(4));
					if (!isNaN(pos) && hist.length > pos) {
						histPos = pos;
                        board = JSON.parse(hist[pos]['board']);
                        queue = JSON.parse(hist[pos]['queue']);
						holdP = hist[pos]['hold'];
						piece = hist[pos]['piece'];
						POS = spawn[0];
						yPOS = spawn[1];
						rot = 0;
						clearActive();
						updateGhost();
						setShape();
					}
				}
			}
		}
	}

	setInterval(() => { //* gravity
		if (document.getElementById('grav').checked) move('SD');
	}, gravity);

	function playSnd(sfx, overlap) {
		if (sfxCache[sfx] && !overlap) return sfxCache[sfx].play();
		var s = new Audio(`assets/sfx/${sfx}.wav`);
		sfxCache[sfx] = s;
        s.volume = audiolevel/100;
		s.play();
	}


	function move(dir) {
		switch (dir) {
			case 'L':
				if (canMove(pieces[piece][rot], xPOS - 1, yPOS)) {
					xPOS--;
					updateGhost();
					playSnd('Move');
					lastAction = 'L';
				}
				break;
			case 'R':
				if (canMove(pieces[piece][rot], xPOS + 1, yPOS)) {
					xPOS++;
					updateGhost();
					playSnd('Move');
					lastAction = 'R';
				}
				break;
			case 'SD':
				if (canMove(pieces[piece][rot], xPOS, yPOS + 1)) {
					yPOS++;
					lastAction = 'SD';
				}
				break;
		}
		clearActive();
		setShape();
	}

	function rotate(dir) {
		var newRot = (rot + rotDir[dir]) % 4;

		for (const kick of kicks[`${piece == 'I' ? 'I' : 'N'}${rot}-${newRot}`]) {
			if (canMove(pieces[piece][newRot], xPOS + kick[0], yPOS - kick[1])) {
				// Y is inverted lol
				xPOS += kick[0];
				yPOS -= kick[1];
				rot = newRot;
				playSnd('Rotate', true);
				lastAction = 'ROT';
				break;
			}
		}

		clearActive();
		updateGhost();
		setShape();
	}

	function arr(dir) {
		let loop = setInterval(function () {
			if (shiftDir == dir && keysDown & flags[dir]) {
				move(dir);
			} else {
				clearInterval(loop);
			}
		}, ARR);
	}

	function das(dir, id) {
		move(dir);
		setTimeout(() => {
			if (dasID == id) { //* check if das is still valid
				arr(dir, id);
			}
		}, DAS);
	}

	function softDrop() {
		if (SDR) {
			let loop = setInterval(() => {
				if (keysDown & flags.SD) {
					move('SD');
				} else {
					clearInterval(loop);
				}
			}, SDR);
		} else {
			// SDR is 0ms = instant SD
			let loop = setInterval(() => {
				if (keysDown & flags.SD) {
					yPOS = yGHO;
					clearActive();
					setShape();
				} else {
					clearInterval(loop);
				}
			}, 0);
			if (yPOS != yGHO) lastAction = 'SD';
		}
	}

	var shiftDir; //* which direction key is on top

	function checkShift() {
		// moving left/right with DAS and whatever

		if (keysDown & flags.L && !(lastKeys & flags.L)) {
			// just pressed left
			das('L', dasID);
			shiftDir = 'L';
		} else if (!(keysDown & flags.R) && lastKeys & flags.R && keysDown & flags.L) {
			// just released right and holding left
			if (shiftDir != 'L') das('L', dasID);
			shiftDir = 'L';
		}
		if (keysDown & flags.R && !(lastKeys & flags.R)) {
			// just pressed right
			das('R', dasID);
			shiftDir = 'R';
		} else if (!(keysDown & flags.L) && lastKeys & flags.L && keysDown & flags.R) {
			// just released left and holding right
			if (shiftDir != 'R') das('R', dasID);
			shiftDir = 'R';
		} 
		
		if (lastKeys !== keysDown) {
			lastKeys = keysDown;
		}
	}

	function hardDrop() {
		if (yPOS != yGHO) lastAction = 'HD';
		yPOS = yGHO;
		held = false;
		playSnd('HardDrop', true);
		setShape(true);
		clearActive();
		
		cleared = checkLines();
		newPiece();

        if (cheese) {
            if (cleared == 0) {
                curCol = Math.floor(Math.random() * 10);
                while (garbageHeight() < 10) {
                    while (curCol == lastCol) {
                        curCol = Math.floor(Math.random() * 10);
                    }
                    garbage(curCol);
                    lastCol = curCol;
                }
            } else if (garbageHeight() < 3) {
                while (curCol == lastCol) {
                    curCol = Math.floor(Math.random() * 10);
                }
                garbage(curCol);
                lastCol = curCol;
		    }
        }

		updateHistory();
	}

	function hold() {
		//if(held) return;
		rot = 0;
		xPOS = spawn[0];
		yPOS = spawn[1];
		held = true;
		if (holdP) {
			holdP = [piece, (piece = holdP)][0];
		} else {
			holdP = piece;
			if (queue[0] == '|') queue.shift();
			piece = queue.shift();
		}
		playSnd('Hold');
		clearActive();
		checkTopOut();
		updateGhost();
		setShape();
		updateQueue();
		lastAction = 'HOLD';
	}

	function checkLines() {
		tspin = false;
		mini = false;
		pc = false;
		if (piece == 'T' && lastAction == 'ROT') {
			corners = [
				[yPOS + 1, xPOS],
				[yPOS + 1, xPOS + 2],
				[yPOS + 3, xPOS + 2],
				[yPOS + 3, xPOS],
			];
			facingCorners = [corners[rot], corners[(rot + 1) % 4]];

			filledCorners = 0;
			corners.forEach((corner) => {
				if (corner[0] >= 40 || corner[1] < 0 || corner[1] >= 10) filledCorners++;
				else if (board[corner[0]][corner[1]]['t'] == 1) filledCorners++;
			});
			tspin = filledCorners >= 3;

			if (tspin) {
				filledFacingCorners = 0;
				facingCorners.forEach((corner) => {
					if (corner[0] >= 40 || corner[1] < 0 || corner[1] >= 10) filledFacingCorners++;
					else if (board[corner[0]][corner[1]]['t'] == 1) filledFacingCorners++;
				});
				mini = filledFacingCorners < 2; // no I'm not adding the "TST Kick and Fin Kick" exceptions. STSDs and Fins deserve to be mini
			}
		}

		clearedIndexes = [];

		board = board.filter((r, i) => {
			temp = !r
				.map((c) => {
					return c.t == 1;
				})
				.every((v) => v);
			if (!temp) clearedIndexes.push(i);
			return temp;
		});
		var l = board.length;
		for (let i = 0; i < boardSize[1] - l; i++) {
			board.unshift(aRow());
		}
		var cleared = clearedIndexes.length;

		if (board[board.length - 1].filter((c) => c.t == 0).length == boardSize[0]) pc = true;

		if (cleared == 0) 
        {    
            if(combo >= 1)
            {
              oldcombo = combo;
            }
            if(b2b >= 1)
            {
                oldb2b = b2b;
            }
            combo = -1;
            console.log("nothing cleared");
        }
		else {
            combo += 1;
			oldcombo = combo;
		}

		if (cleared > 0) 
        {
			if (tspin || cleared == 4) 
            {
                b2b += 1;
                oldb2b = b2b;
            }
			else
            {
                console.log("no b2b");
                b2b = -1;
            }
		}

		text = '';
		if (combo > 0) text += combo.toString() + '_COMBO\n';
		if (b2b > 0 && (tspin || cleared == 4)) text += 'B2B ';
		if (mini) text += 'MINI ';
		if (tspin) text += 'T-SPIN ';
		if (cleared > 4) cleared = 4; // nani
		if (cleared > 0) text += ['NULL', 'SINGLE', 'DOUBLE', 'TRIPLE', 'QUAD'][cleared];
		if (pc) text += '\nPERFECT\nCLEAR!';
        if (b2b > 0 && (tspin || cleared == 4)) text += ' x' + b2b.toString();
		if (text != '') notify(text);
		if (tspin || cleared == 4) playSnd('ClearTetra', true);
		if (pc) playSnd('PerfectClear', 1);

        return cleared;

	}

	function drawCell(x, y, piece, type) {
		if (type == 3) {
			// Ghost
			ctx.strokeStyle = '#CCC';
			ctx.strokeRect((x - 1) * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
		} else if (type !== 0) {
			// Current and Heap
			ctx.fillStyle = color[piece];
			ctx.fillRect((x - 1) * cellSize + 1, y * cellSize + 1, cellSize - 2, cellSize - 2);
		}
	}

	function render() {
		checkShift();

		ctx.clearRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize);
		ctx.fillStyle = pattern;
		ctx.fillRect(0, 0, boardSize[0] * cellSize, boardSize[1] * cellSize);

		board.map((y, i) => {
			y.map((x, ii) => {
				if (x.t !== 0) {
					drawCell(ii + 1, i - hiddenRows + 2, x.c, x.t);
				} else if (i <= spawn[1] + 2) {
					// render the top 2 rows as grey
					drawCell(ii + 1, i - hiddenRows + 2, 'A', 1);
				}
			});
		});
		window.requestAnimationFrame(render);
	}
	/*
	setInterval(() => {
		render();
	}, 0);
    */
	window.requestAnimationFrame(render);
}
