// import/export stuff

async function importTetrio() {
	try {
		temp = await navigator.clipboard.readText();
	} catch (error) {
		temp = prompt('tetrio map');
	}
	convert = {
		'#': 'G',
		z: 'Z',
		s: 'S',
		l: 'L',
		j: 'J',
		t: 'T',
		i: 'I',
		o: 'O',
	};
	temp2 = temp.split('?');
	if (temp2[0].length != 400) {
		console.log('bad input');
		return;
	} // bad input
	if (temp2.length > 2) holdP = temp2[2];
	if (temp2.length > 1) {
		temp3 = temp2[1].split('');
		for (i = 0; i < temp3.length; i++) {
			temp3[i] = convert[temp3[i]];
		}
		queue = temp3;
	}
	//board
	for (i = 0; i < 400; i++) {
		temp4 = temp2[0][i];
		if (temp4 == '_') board[Math.floor(i / 10)][i % 10] = { t: 0, c: '' };
		else board[Math.floor(i / 10)][i % 10] = { t: 1, c: convert[temp4] };
	}
	console.log('hi');

	xPOS = spawn[0];
	yPOS = spawn[1];
	rot = 0;
	clearActive();
	updateGhost();
	setShape();
	updateHistory();
}

function exportTetrio() {
	convert = {
		X: '#',
		Z: 'z',
		S: 's',
		L: 'l',
		J: 'j',
		T: 't',
		I: 'i',
		O: 'o',
	};
	result = '';
	for (row = 0; row < board.length; row++) {
		for (col = 0; col < board[0].length; col++) {
			if (board[row][col].t == 1) {
				result += convert[board[row][col].c];
			} else result += '_';
		}
	}
	result += '?' + convert[piece];
	for (i = 0; i < queue.length; i++) {
		if (queue[i] != '|') result += convert[queue[i]];
	}
	if (holdP) result += '?' + convert[holdP];

	console.log(result);
	try {
		navigator.clipboard.writeText(result);
	} catch (error) {
		window.alert(result);
	}
}

async function exportFumen() {
	fumen = encode(board);
	console.log(fumen);
	await navigator.clipboard.writeText(fumen);
	window.open('https://swng.github.io/fumen/?' + fumen, '_blank');
}

async function exportFullFumen() {
	fumen = fullEncode(hist);
	console.log(fumen);
	await navigator.clipboard.writeText(fumen);
	window.open('https://swng.github.io/fumen/?' + fumen, '_blank');
}

document.addEventListener('paste', (event) => {
    var items = (event.clipboardData || event.originalEvent.clipboardData).items;
    for (index in items) {
        var item = items[index];
        if (item.kind === 'file') {
            var blob = item.getAsFile();
            importImage(blob);
        }
    }
});

async function importImage(blob) {
    // Create an abstract canvas and get context
    var mycanvas = document.createElement('canvas');
    var ctx = mycanvas.getContext('2d');

    // Create an image
    var img = new Image();

    // Once the image loads, render the img on the canvas
    img.onload = function () {
        console.log(this.width, this.height);
        scale = this.width / 10.0;
        x = 10;
        y = Math.min(Math.round(this.height / scale), 22);
        console.log(x, y);
        mycanvas.width = this.width;
        mycanvas.height = this.height;

        // Draw the image
        ctx.drawImage(img, 0, 0, this.width, this.height);
        var data = Object.values(ctx.getImageData(0, 0, this.width, this.height).data);
        var nDat = [];
        for (row = 0; row < y; row++) {
            for (col = 0; col < 10; col++) {
                // get median value of pixels that should correspond to [row col] mino

                minoPixelsR = [];
                minoPixelsG = [];
                minoPixelsB = [];

                for (pixelRow = Math.floor(row * scale); pixelRow < row * scale + scale; pixelRow++) {
                    for (pixelCol = Math.floor(col * scale); pixelCol < col * scale + scale; pixelCol++) {
                        index = (pixelRow * this.width + pixelCol) * 4;
                        minoPixelsR.push(data[index]);
                        minoPixelsG.push(data[index + 1]);
                        minoPixelsB.push(data[index + 2]);
                    }
                }

                medianR = median(minoPixelsR);
                medianG = median(minoPixelsG);
                medianB = median(minoPixelsB);
                var hsv = rgb2hsv(medianR, medianG, medianB);
                console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
                nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
            }
        }
        /* // old alg from just scaling it down to x by y pixels
        for (let i = 0; i < data.length / 4; i++) {
            //nDat.push(data[i*4] + data[(i*4)+1] + data[(i*4)+2] < 382?1:0)
            var hsv = rgb2hsv(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
            console.log(hsv, nearestColor(hsv[0], hsv[1], hsv[2])); // debugging purposes
            nDat.push(nearestColor(hsv[0], hsv[1], hsv[2]));
        }*/

        tempBoard = new Array(40 - y).fill(new Array(10).fill({ t: 0, c: '' })); // empty top [40-y] rows
        for (rowIndex = 0; rowIndex < y; rowIndex++) {
            let row = [];
            for (colIndex = 0; colIndex < 10; colIndex++) {
                index = rowIndex * 10 + colIndex;
                temp = nDat[index];
                if (temp == '.') row.push({ t: 0, c: '' });
                else row.push({ t: 1, c: temp });
            }
            tempBoard.push(row);
        }

        board = JSON.parse(JSON.stringify(tempBoard));

        xPOS = spawn[0];
        yPOS = spawn[1];
        rot = 0;
        clearActive();
        updateGhost();
        setShape();
        updateHistory();
    };

    var URLObj = window.URL || window.webkitURL;
    img.src = URLObj.createObjectURL(blob);
}

async function importImageButton() {
	try {
		const clipboardItems = await navigator.clipboard.read();
		for (const clipboardItem of clipboardItems) {
			for (const type of clipboardItem.types) {
				const blob = await clipboardItem.getType(type);
				//console.log(URL.createObjectURL(blob));

                importImage(blob);
			}
		}
	} catch (err) {
        console.log(err.message, "\nTry Ctrl V instead.");
	}
}

function rgb2hsv(r, g, b) {
	let v = Math.max(r, g, b),
		c = v - Math.min(r, g, b);
	let h = c && (v == r ? (g - b) / c : v == g ? 2 + (b - r) / c : 4 + (r - g) / c);
	return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

function nearestColor(h, s, v) {
	if (inRange(s, 0, 1) && (inRange(v, 133, 135) || inRange(v, 63, 88))) return 'X'; // attempted manual override specifically for four.lol idk
	if (inRange(h, 220, 225) && inRange(s, 0, 0.2) && v == 65) return '.';

	if (s <= 0.2 && v / 2.55 >= 55) return 'X';
	if (v / 2.55 <= 55) return '.';

	if (inRange(h, 0, 16) || inRange(h, 325, 360)) return 'Z';
	else if (inRange(h, 16, 39)) return 'L';
	else if (inRange(h, 39, 70)) return 'O';
	else if (inRange(h, 70, 149)) return 'S';
	else if (inRange(h, 149, 200)) return 'I';
	else if (inRange(h, 200, 266)) return 'J';
	else if (inRange(h, 266, 325)) return 'T';
	return '.';
}

function inRange(x, min, max) {
	return x >= min && x <= max;
}

function median(values) {
	// if this is too computationally expensive maybe switch to mean
	if (values.length === 0) throw new Error('No inputs');

	values.sort(function (a, b) {
		return a - b;
	});

	var half = Math.floor(values.length / 2);

	if (values.length % 2) return values[half];

	return (values[half - 1] + values[half]) / 2.0;
}

async function importFumen() {
	try {
		fumen = await navigator.clipboard.readText();
	} catch (error) {
		fumen = prompt('fumen encoding');
	}
	result = decode(fumen);
	board = JSON.parse(JSON.stringify(result));

	xPOS = spawn[0];
	yPOS = spawn[1];
	rot = 0;
	clearActive();
	updateGhost();
	setShape();
	updateHistory();
}

async function importFullFumen() {
	try {
		fumen = await navigator.clipboard.readText();
	} catch (error) {
		fumen = prompt('fumen encoding');
	}
	result = fullDecode(fumen, hist[histPos]); // let's import boards but just keep current queue/hold/piece in each frame
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
}

async function sfinder() {
	fumen = encode(board);
	console.log(fumen);
	let export_queue = holdP + piece + queue.join("").replaceAll("|","");
	window.open(`https://sfinder.sixwi.de/?fumen=${fumen}&command=path&game=jstris&clearLines=4&queue=${export_queue}`, '_blank');
}
