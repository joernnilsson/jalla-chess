"use strict"

import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";
import {default as Chess, Move88} from "chess.js";

interface BestMove88 {
	score: Score;
	move: Node88;
}

interface BestMove{
	score: Score;
	move: Node;
}

export class Node88 {
	moveTo: Move88;
	fen: string;
	bestMove: BestMove88;
	parent: Node88;
	children: Node88[];

	// debug
	valid: boolean;
	san: string;
	score: number;

	constructor(fen: string, moveTo: Move88, parent: Node88) {
		this.moveTo = moveTo;
		this.fen = fen;
		this.parent = parent;
	}
}

export class Node {
	moveTo: string;
	fen: string;
	score: Score;
	bestMove: BestMove;
	parent: Node;
	children: Node[];

	// Deprecated
	getBestScore(): Score {
		if(this.bestMove != null){
			return this.bestMove.score;
		}else{
			return this.score;
		}
	}

	static getBestScore(node: Node): Score {
		if (node.bestMove != null) {
			return node.bestMove.score;
		} else {
			return node.score;
		}
	}

	static create(fen: string, prevMove: string, score: Score, parent: Node): Node {
		let node = new Node();
		node.moveTo = prevMove;
		node.fen = fen;
		node.score = score;
		node.parent = parent;
		return node;
	}

	static compare(a: Node, b: Node): number {
		return Score.compare(a.score, b.score);
	}

	static compareBest(a: Node, b: Node): number {
		return Score.compare(Node.getBestScore(a), Node.getBestScore(b));
	}
}

