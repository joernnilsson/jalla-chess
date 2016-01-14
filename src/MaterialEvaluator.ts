"use strict"


import Chess from "chess.js";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

export function evaluator(sim: Chess): Score {

	let turn = sim.turn();
	let fen = sim.fen();

	if (sim.in_draw()) {
		return new DrawScore();
	} else if (sim.in_checkmate()) {
		return new WonScore(turn == "w" ? "b" : "w");
		// return new WonScore(turn);
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

	for (let p of fen) {
		if (p == " ") break;
		let value = val(p);
		if (p.toUpperCase() == p) pw += value;
		else pb += value;
	}

	return new NumericScore(pw - pb);
};

// export = evaluate;
