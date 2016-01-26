"use strict"


import {default as Chess, Move88} from "chess.js";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

/*
Optimization ideas:
- Dont test for draw or win, may be implicit when moves.length = 0.

*/

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

	// Count material
	let pw = 0;
	let pb = 0;


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

	let board = sim.get_board();
    for (var i = 0; i <= 119; i++) {
		if (board[i] == null) {
			continue;
		} else {
			var color = board[i].color;
			var piece = board[i].type;
			let value = val(board[i].type);
			if (color == "w") pw += value;
			else pb += value;
		}

		if ((i + 1) & 0x88) {
			// Should this be 7?
			i += 8;
		}
    }

	// for (let p of fen) {
	// 	if (p == " ") break;
	// 	let value = val(p);
	// 	if (p.toUpperCase() == p) pw += value;
	// 	else pb += value;
	// }

	return new NumericScore(pw - pb/*);// */ + ((Math.random() - 0.5) / 1000.0));
};

// export = evaluate;
