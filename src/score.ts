"use strict";


export abstract class Score {
	constructor(){
		this.numeric = this.getComparableScore();
	}
	numeric: number;
	abstract getComparableScore(): number;
	static compare(a: Score, b: Score): number {
		// let as = a.getComparableScore();
		// let bs = b.getComparableScore();
		let as = a.numeric;
		let bs = b.numeric;
		return as - bs;
	}
}

export class NumericScore extends Score {
	constructor(score: number) {
		this.numeric = score;
		super();
	}
	getComparableScore() {
		return this.numeric;
	}
}

export class WonScore extends Score {
	side: string;
	constructor(side: string) {
		this.side = side;
		super();
	}
	getComparableScore() {
		return this.side == 'w' ? 1e6 : -1e6;
	}
}

export class MateInScore extends Score {
	side: string;
	moves: number;
	constructor(side: string, moves: number) {
		this.side = side;
		this.moves = moves;
		super();
	}
	getComparableScore() {
		let num = 1e3 + this.moves;
		return this.side == 'w' ? num : -num;
	}
}

export class DrawScore extends Score {
	getComparableScore() {
		return 0.0;
	}
}