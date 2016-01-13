"use strict"

import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

interface BestMove{
	score: Score;
	move: Node;
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

