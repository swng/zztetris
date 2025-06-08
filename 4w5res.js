const aa = { t: 1, c: 'X' };
var aRow = function () {
	return [aa, aa, aa, a, a, a, a, aa, aa, aa];
};


function restart() {
	if (true) {
		if (queue[6] == '|' && holdP == '') {
			// if they reset after resetting, just restart hist
			hist = [
				{
					board: JSON.stringify(board),
					queue: JSON.stringify(queue),
					hold: holdP,
					piece: piece,
				},
			];
			histPos = 0;
		}
	}
	board = [];
	for (let i = 0; i < boardSize[1]; i++) {
		board.push(aRow());
    }
    init = res_5[Math.floor(Math.random() * res_5.length)];
    for (row = 0; row < 4; row++) {
        for (col = 0; col < 4; col++) {
            if (init[row][col] == 1) {
                board[36 + row][col + 3] = aa;
            }
        }
    }


	queue = [];
	rot = 0;
	piece = '';
	holdP = '';
	held = false;
	xPOS = spawn[0];
	yPOS = spawn[1];
	xGHO = spawn[0];
    yGHO = spawn[1];

    combo = -1;
    b2b = -1;
	newPiece();
}

function updateQueue() {
	temp = false;
	ctxN.clearRect(0, 0, 90, 360);
	ctxH.clearRect(0, 0, 90, 60);
	for (let i = 0; i < 7; i++) {
		if (queue[i] == '|') {
			ctxN.beginPath();
			ctxN.moveTo(0, i * 60);
			ctxN.lineTo(90, i * 60);
			ctxN.stroke();
			temp = true;
		} else {
			j = i;
			if (temp) j--;
			ctxN.drawImage(imgs[queue[i]], 0, j * 60);
		}
	}
	if (holdP) ctxH.drawImage(imgs[holdP], 0, 0);
}

function shuffleQueue() {
	// locate bag separator
	index = 0;
	while (index < queue.length && queue[index] != '|') index++;

	tempQueue = queue.slice(0, index).concat(piece).shuffle().concat('|');
	// the queue before the bag separator (the current bag), plus active piece; shuffle it; add bag separator to end
	piece = tempQueue.shift();
	queue = tempQueue;

	while (queue.length < 10) {
		var shuf = names.shuffle();
		shuf.map((p) => queue.push(p));
		queue.push('|');
	}
	xPOS = spawn[0];
	yPOS = spawn[1];
	rot = 0;
	clearActive();
	checkTopOut();
	updateQueue();
	updateGhost();
	setShape();
	updateHistory();
}

function shuffleQueuePlusHold() {
	if (!holdP) {
		shuffleQueue();
		return;
	}

	index = 0;
	while (index < queue.length && queue[index] != '|') index++;

	tempQueue = queue.slice(0, index).concat(piece, holdP).shuffle().concat('|');
	holdP = tempQueue.shift();
	piece = tempQueue.shift();
	queue = tempQueue;

	while (queue.length < 10) {
		var shuf = names.shuffle();
		shuf.map((p) => queue.push(p));
		queue.push('|');
	}
	xPOS = spawn[0];
	yPOS = spawn[1];
	rot = 0;
	clearActive();
	checkTopOut();
	updateQueue();
	updateGhost();
	setShape();
	updateHistory();
}

function updateKickTable() {
	kicks = kicksets[document.getElementById('kickset').value];
}

function game() {
	callback(undefined, true);
}
