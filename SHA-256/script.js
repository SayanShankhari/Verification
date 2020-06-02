var H = [];
var W = [];

function sha256 (input) {
	var output = "";
	input = prepareInputBits (input);
	var n = Math.floor (input.length / 512);
	prepareData();

	for (i = 0; i < n; i++) { // (n * 512 bits) chunk
		hash (input.substr (i * 512, 512));
	}

	for (i = 0; i < H.length; i++) {
		output += H[i];
	}

	output = convertBase2To16 (output);

	return output;
}

function hash (input) { // 512 bits in
	var i;
	let sigma0 = "";
	let sigma1 = "";

	/*
	** 64 rounds = (16 + 48) rounds
	** for first 16 rounds, 512 bits = 16 * 32 bits = 16 words
	** for next 48 rounds, calculate round word, W[i]
	*/

	for (i = 0; i < 64; i++) {
		if (i < 16) {
			W[i] = input.substr(32 * i, 32);
		} else {
			sigma0 = bitsXor (bitsXor (rotateRight (W[i-15], 7), rotateRight (W[i-15], 18)), shiftRight (W[i-15], 3));
			sigma1 = bitsXor (bitsXor (rotateRight (W[i-2], 17), rotateRight (W[i-2], 19)), shiftRight (W[i-2], 10));
			W[i] = bitsAdd (W[i-16], W[i-7]);
			W[i] = bitsAdd (W[i], bitsAdd (sigma0, sigma1));
		}
	}

	let t0 = null;
	let t1 = null;

	for (var round = 0; round < 64; round++) {
		t0 = bitsAdd (H[7], bitsAdd (bitsAdd (Ep1(H[4]), Ch(H[4], H[5], H[6])), bitsAdd (_K[round], W[round])));
		t1 = bitsAdd (Ep0(H[0]), Maj(H[0], H[1], H[2]));

		H[7] = H[6];
		H[6] = H[5];
		H[5] = H[4];
		H[4] = bitsAdd (H[3], t0);
		H[3] = H[2];
		H[2] = H[1];
		H[1] = H[0];
		H[0] = bitsAdd (t0, t1);
	}
}

function prepareInputBits (input) {
	// binary-message + padding (1000...) + message-length (64 bits) => 0 (modulo 512)
	var output = "";
	var i, x;

	// converting character ASCII or UTF to hex-number (16 bits each) string
	for (i = 0; i < input.length; i++) {
		x = convertBase10To2 (input.charCodeAt(i));
		output += padLeftZeroes (x, (16 - x.length));
	}

	// getting 64 bit message length
	let msgLen = convertBase10To2 (output.length);
	msgLen = padLeftZeroes (msgLen, 64 - msgLen.length);

	x = output.length % 512; // getting extra bits length
	let nP = 0; // number of zeroes in pad

	if (x == 0) {
		// add new block
		nP = 512 - 65; // 65 = 64 + 1
	} else if (x > 447) {
		// add new block
		nP = (512 - x) + (512 - 65);
	} else {
		// use last block
		nP = 512 - x - 65;
	}

	output = output + "1" + padLeftZeroes ("", nP) + msgLen;
	console.log(output);

	return output;
}

function prepareData() {
	var i;

	// initialize hash value with base hash constants
	H = [];
	for (i = 0; i < 8; i++) {
		H.push(_H[i]);
	}

	// initialize word with 64 empty string
	W = [];
	for (i = 0; i < 64; i++) {
		W.push("");
	}
}

// *** basic hash functions ***
function Ch (E, F, G) {
	return bitsXor (bitsAnd (E, F), bitsAnd (bitsNot (E), G));
}

function Maj (A, B, C) {
	return bitsXor (bitsXor (bitsAnd (A, B), bitsAnd (B, C)), bitsAnd (C, A));
}

function Ep0 (A) {
	return bitsXor (bitsXor (rotateRight(A, 2), rotateRight(A, 13)), rotateRight(A, 22));
}

function Ep1 (E) {
	return bitsXor (bitsXor (rotateRight(E, 6), rotateRight(E, 11)), rotateRight(E, 25));
}

// *** basic binary functions ***
function padLeftZeroes (input, numberOfZeroes) {
	var initialZeroes = "";

	for (var i = 0; i < numberOfZeroes; i++) {
		initialZeroes += "0";
	}

	return (initialZeroes + input);
}

function convertBase10To2 (input) {
	var output = "";

	while (input != 0) {
		output = (input % 2) + output;
		input = Math.floor(input / 2);
	}

	return output;
}

function convertBase2To10 (base2s) {
	var  base10n = 0;

	for (var i = 0; i < base2s.length; i++) {
		base10n = 2 * base10n + ((base2s[i] == "1") ? 1 : 0);
	}

	return base10n;
}

function convertBase2To16 (input) {
	let listNibbles = ["0000", "0001", "0010", "0011", "0100", "0101", "0110", "0111", "1000", "1001", "1010", "1011", "1100", "1101", "1110", "1111"];
	let listDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
	let output = "";
	var x = (input.length % 4);

	if (x != 0) {
		input = padLeftZeroes(input, 4 - x);
	}

	for (var i = 0; i < input.length; i += 4) {
		for (var j = 0; j < 16; j++) {
			if (input.substr(i, 4) == listNibbles[j]) {
				break;
			}
		}

		output += listDigits[j];
	}

	return output;
}

function convertToNibbles (input) {
	var output = "";
	
	for (var i = 0; i < input.length; i += 4) {
		output += getNibble (input.substr(i, 4));
	}

	return output;
}

function getNibble (base2s) {
	var base16s = "";
	const list = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
	
	base16s = list[convertBase2To10 (base2s)];
	return base16s;
}

// *** basic bits functions ***
function shiftRight (input, numberOfBits) {
	var output = "";
	
	output = input.substring(0, numberOfBits);
	output = padLeftZeroes(output, input.length - numberOfBits);

	return output;
}

function rotateLeft (input, numberOfBits) {
	var output = "";
	output = input.substring(numberOfBits, input.length) + input.substring(0, numberOfBits);
	return output;
}

function rotateRight (input, numberOfBits) {
	var output = "";
	output = input.substring(input.length - numberOfBits, input.length) + input.substring(0, input.length - numberOfBits);
	return output;
}

// *** basic gate functions ***
function bitNot (x) {
	return (x == '0') ? '1' : '0';
}

function bitOr (x, y) {
	return (x == '1' || y == '1') ? '1' : '0';
}

function bitXor (x, y) {
	return (x == y) ? '0' : '1';
}

function bitAnd (x, y) {
	return (x == '0' || y == '0') ? '0' : '1';
}

// *** bunch gates functions ***
function bitsOr (a, b) {
	var c = "";

	if (a.length != b.length) {
		a = padLeftZeroes (a, b.length - a.length);
		b = padLeftZeroes (b, a.length - b.length);
	}

	for (var i = 0; i < a.length; i++) {
		c += bitOr (a[i], b[i]);
	}

	return c;
}

function bitsAnd (a, b) {
	var c = "";

	if (a.length != b.length) {
		a = padLeftZeroes(a, b.length - a.length);
		b = padLeftZeroes(b, a.length - b.length);
	}

	for (var i = 0; i < a.length; i++) {
		c += bitAnd (a[i], b[i]);
	}

	return c;
}

function bitsNot (a) {
	var b = "";

	for (var i = 0; i < a.length; i++) {
		b += bitNot (a[i]);
	}

	return b;
}

function bitsXor (a, b) {
	var c = "";

	if (a.length != b.length) {
		a = padLeftZeroes(a, b.length - a.length);
		b = padLeftZeroes(b, a.length - b.length);
	}

	for (var i = 0; i < a.length; i++) {
		c += bitXor (a[i], b[i]);
	}

	return c;
}

// basic arithmetic functions
function bitAdd (c_in, x, y) {
	let xor = bitXor (x, y);
	let c_out = bitOr (bitAnd (x, y), bitAnd (c_in, xor));
	let s = bitXor (c_in, xor);
	return (c_out + s);
}

function bitsAdd (a, b) {
	var i = 0;
	var s = "";
	var c = '0';
	let x = "";
	
	if (a.length != b.length) {
		a = padLeftZeroes (a, b.length - a.length);
		b = padLeftZeroes (b, a.length - b.length);
	}
	
	for (i = a.length - 1; i >= 0; i--) {
		x = bitAdd (c, a[i], b[i]);
		c = x[0];
		s = x[1] + s;
	}

	s = c + s;

	return trimNumber (s, a.length);
}

function trimNumber (input, bitsLength) {
	let x = input.length - bitsLength;
	return input.substr (x, bitsLength);
}