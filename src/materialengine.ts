"use strict";

import Engine = require("./engine");
import Chess = require("chess.js");

interface Move {
	from: any;
	to: any;
	promotion: string;
}

abstract class Score {
	abstract getComparableScore(): number;
	static compare(a: Score, b: Score): number {
		let as = a.getComparableScore();
		let bs = b.getComparableScore();
		return as - bs;
	}
}

class NumericScore extends Score {
	numeric: number;
	constructor(score: number) {
		super();
		this.numeric = score;
	}
	getComparableScore(){
		return this.numeric;
	}
}

class WonScore extends Score {
	side: string;
	constructor(side: string) {
		super();
		this.side = side;
	}
	getComparableScore() {
		return this.side == 'w' ? 1e6 : -1e6;
	}
}

class MateInScore extends Score {
	side: string;
	moves: number;
	constructor(side: string, moves: number){
		super();
		this.side = side;
		this.moves = moves;
	}
	getComparableScore() {
		let num = 1e3 + this.moves;
		return this.side == 'w' ? num : -num;
	}
}

class DrawScore extends Score {
	getComparableScore() {
		return 0.0;
	}
}


class TreeNode {
	moveTo: string;
	fen: string;
	score: Score;
	bestMove: TreeNode;
	children: TreeNode[];

	getBestScore(): Score {
		if(this.bestMove != null){
			return this.bestMove.score;
		}else{
			return this.score;
		}
	}


	static createPrev(fen: string, prevMove: string, score: Score): TreeNode {
		let node = new TreeNode();
		node.moveTo = prevMove;
		node.fen = fen;
		node.score = score;
		return node;
	}

	static compare(a: TreeNode, b: TreeNode): number {
		return Score.compare(a.score, b.score);
	}

	static compareBest(a: TreeNode, b: TreeNode): number {
		return Score.compare(a.getBestScore(), b.getBestScore());
	}
}


export class MaterialEngine {

	tree: TreeNode;
	// game: chess.SimpleGameClient;
	simulator: Chess;

	constructor(){
		this.simulator = new Chess();
	}

	sim(fen: string){
		let sim = this.simulator;
		sim.load(fen);
		return sim;
	}


	recursiveEvaluate(node: TreeNode, depth: number): void{
		
		node.score = this.evaluate(node.fen);
		if(depth <= 1){
			return;
		}

		let sim = this.sim(node.fen);
		let turn = sim.turn();
		node.children = [];
		let bestNodes: TreeNode[] = [];


		for (let m of sim.moves()) {
			sim.load(node.fen);
			sim.move(m);
			let c = TreeNode.createPrev(sim.fen(), m, null);
			this.recursiveEvaluate(c, depth - 1);

			node.children.push(c);

			if (bestNodes.length == 0) {
				bestNodes.push(c);
			}else if(TreeNode.compareBest(c, bestNodes[0]) == 0){
				bestNodes.push(c);
			} else if((turn == 'w' && TreeNode.compareBest(c, bestNodes[0]) > 0)
				||   (turn == 'b' && TreeNode.compareBest(bestNodes[0], c) > 0)){
				bestNodes = [];
				bestNodes.push(c);
			}
			
			//console.log(m + " " + c.score.getComparableScore());

		}

		node.bestMove = bestNodes[Math.floor(Math.random() * bestNodes.length)];

	}


	findBestMoveRecursive(fen: string, depth: number): string {
		let node = TreeNode.createPrev(fen, null, null);
		this.recursiveEvaluate(node, depth);
		let str = "Moves: " + node.score.getComparableScore() + " ";
		let n = node.bestMove;
		while(n != null){
			str += n.moveTo + "(" + n.score.getComparableScore() + ") ";
			n = n.bestMove
		}
		console.log(str);
		console.log("Score: " + node.score.getComparableScore());
		return node.bestMove.moveTo;
	}

	evaluate(fen: string): Score {

		let sim = this.sim(fen);

		sim.load(fen);
		let turn = sim.turn();

		if (sim.in_draw()) {
			return new DrawScore();
		} else if(sim.in_checkmate()){
			return new WonScore(turn == "w" ? "b" : "w");
		}

		// Count material
		let pw = 0;
		let pb = 0;


		let val = (c) => {
			c = c.toLowerCase();
			switch(c){
				case 'p': return 1;
				case 'b': return 3;
				case 'n': return 3;
				case 'r': return 5;
				case 'q': return 9;
				case 'k': return 0; //?
			}
			return 0;
		};

		for(let p of fen){
			if (p == " ") break;
			let value = val(p);
			if (p.toUpperCase() == p) pw += value;
			else pb += value;
		}

		return new NumericScore(pw - pb);
	}

}
