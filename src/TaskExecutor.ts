"use strict"




import Chess from "chess.js";
import {Node} from "./GameTree";
import {evaluator} from "./MaterialEvaluator";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

// Intended to run as a web worker
export class SimulatorTaskExecutor {

	private simulator: Chess;

	constructor() {
		this.simulator = new Chess();
	}

	// Aquire the simulator
	private sim(fen: string) {
		let sims = this.simulator;
		sims.load(fen);
		return sims;
	}

	// TODO add logic to detect if simulator is already at the correct position
	// TODO use undo() to reset position
	evaluateChildren(node: Node): Promise<Node[]> {

		let sim = this.sim(node.fen);
		let moves = sim.moves();

		let list: Promise<Node>[] = [];
		let executor = this;
		for (var m of moves){
			var move = m;
			list.push(new Promise<Node>(
				(resolve: (str: Node) => void, reject: (str: string) => void) => {
					let sim = this.sim(node.fen);
					sim.move(move);
					let score = evaluator(sim);
					let c = Node.create(sim.fen(), move, score, node);
					resolve(c);
				}
			));
		}

		return Promise.all(list);
	}



	/*
		Optimizations:
			- Switch move def from SAN to object
			- Switch move def to "ugly"
			- move() gjøre en unødvendig moves()
			- Modify chess.js to expose generate_moves() and modify move()
			- Pruning

		Evaluator:
			- Tell angrep på brikker
			- Kontroll i sentrum
			- Kontroll på diagonaler
			- Rokaderettigheter
			- Eksponert konge
			- "Attack map" (rundt konge?)

	*/
	evaluateChildrenSync(node: Node): Node {

		let sim = this.sim(node.fen);
		let moves = sim.moves();
		let turn = sim.turn();

		node.children = [];
		let bestNodes: Node[] = [];

		if(moves.length == 0){
			// Game over
			sim.load(node.fen);
			let score = evaluator(sim);
			node.score = score;

		} else {

			for (let m of moves){
				sim.load(node.fen);
				sim.move(m);
				let score = evaluator(sim);
				let c = Node.create(sim.fen(), m, score, node);

				node.children.push(c);

				if (bestNodes.length == 0) {
					bestNodes.push(c);
				} else if (Node.compareBest(c, bestNodes[0]) == 0) {
					bestNodes.push(c);
				} else if ((turn == 'w' && Node.compareBest(c, bestNodes[0]) > 0)
					|| (turn == 'b' && Node.compareBest(bestNodes[0], c) > 0)) {
					bestNodes = [];
					bestNodes.push(c);
				}
				
				//console.log(m + " " + c.score.getComparableScore());

			}

			let m = bestNodes[Math.floor(Math.random() * bestNodes.length)];
			node.bestMove = { move: m, score: m.score};
		}

		return node;
	}


}

