"use strict"


import {default as Chess, Move88} from "chess.js";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

/*
Optimization ideas:
- Dont test for draw or win, may be implicit when moves.length = 0.

Evaluation ideas:
- Knights in the center
* Double pawns
- Isolated pawns
- King zone attacks
- Rooks in open files
- Bishops in long diagonals
- Number of squares a piece can move to
- Rooks, bishops and queens pointing towards the king
- King protection
* King to the side during opening
- Castling rights
- Connected rooks

*/

var RANK_1 = 7;
var RANK_2 = 6;
var RANK_3 = 5;
var RANK_4 = 4;
var RANK_5 = 3;
var RANK_6 = 2;
var RANK_7 = 1;
var RANK_8 = 0;



// Should not modify sim
export function evaluator(sim: Chess, moves?: Move88[]): Score {
	if(typeof(window) != "undefined") window["p_evaluate"]++;
	let turn = sim.turn();
	moves = moves || sim.generate_moves();
	// let fen = sim.fen();

	if(moves.length == 0){
		// Game over
		if (sim.in_draw()) {
			return new DrawScore();
		} else if (sim.in_checkmate()) {
			return new WonScore(turn == "w" ? "b" : "w");
		}
	}


	let board = sim.get_board();

	// Count material
	let mw = 0;
	let mb = 0;


	let val = (c) => {
		c = c.toLowerCase();
		switch (c) {
			case 'p': return 1;
			case 'b': return 3;
			case 'n': return 3;
			case 'r': return 5;
			case 'q': return 9;
			case 'k': return 0; //?
		}
		return 0;
	};

    for (let i = 0; i <= 119; i++) {
		if (board[i] == null) {
			continue;
		} else {
			var color = board[i].color;
			var piece = board[i].type;
			let value = val(board[i].type);
			if (color == "w") mw += value;
			else mb += value;
		}

		if ((i + 1) & 0x88) {
			// Should this be 7?
			i += 8;
		}
    }

	let material = {
		w: mw,
		b: mb
	}

	// Shared properties
	let materialMax = 39;
	let endgameStartsAt = 26;

	// Evaluate king position
	// Use material number to determine if we're in opening, midgame, endgame
	let kingInCenterPenalty = 0.2;
	let kingPenalty = (file, m) => {
		if(file == 3 || file == 4){
			let x = (materialMax - m);
			return Math.max(0, kingInCenterPenalty - x * kingInCenterPenalty/(materialMax - endgameStartsAt));
		} else {
			return 0;
		}
	}

	let wKingPenalty = kingPenalty((sim.file(sim.underlaying().kings.w)), mw);
	let bKingPenalty = kingPenalty((sim.file(sim.underlaying().kings.b)), mb);

	// Double pawns
	let doublePawnPenalty = 0.2;
	let pawnMap = {
		w: [0,0,0,0,0,0,0,0],
		b: [0,0,0,0,0,0,0,0]
	};

	// Knight positions
	let knightInCenterGainFactor = 0.2;
	let knightInCenterGain = (m) => {
		let x = (materialMax - m);
		return Math.max(0, knightInCenterGainFactor - x * knightInCenterGainFactor/(materialMax - endgameStartsAt));
	}
	let knightInCenter = {
		w: 0,
		b: 0
	}

	// Loop over board
	for (let i = 0; i <= 119; i++) {
		if (board[i] == null) {
			continue;
		} else {

			var color = board[i].color;
			var piece = board[i].type;
			var file = sim.file(i);
			var rank = sim.rank(i);

			switch (piece) {
				case 'p':
					// Map double pawns
					pawnMap[color][file]++;
					break;

				case 'n':
					// Knights in the center
					if((rank == RANK_4 || rank == RANK_5) && (file > 1 && file < 6)){
						knightInCenter[color] += knightInCenterGain(material[color]);
					}
					break;


			}

			//
		}

		if ((i + 1) & 0x88) {
			// Should this be 7?
			i += 8;
		}
	}
	let wDoublePanPenalty = 0;
	let bDoublePanPenalty = 0;
	for(let i = 0; i<8; i++){
		wDoublePanPenalty += Math.max(0, pawnMap.w[i] - 1)*doublePawnPenalty;
		bDoublePanPenalty += Math.max(0, pawnMap.b[i] - 1)*doublePawnPenalty;
	}


	// Sum up scores
	let sw = mw - wKingPenalty - wDoublePanPenalty + knightInCenter.w;
	let sb = mb - bKingPenalty - bDoublePanPenalty + knightInCenter.b;

	return new NumericScore(sw - sb);// */ + ((Math.random() - 0.5) / 100000.0));
};

// export = evaluate;
