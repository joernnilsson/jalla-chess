import {Task} from "./WorkerTask";
import {Node88} from "./GameTree";
import {default as Chess, Move88} from "chess.js";
import {evaluator} from "./MaterialEvaluator";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";


export interface AbParams {
	node: Node88,
	alpha: number,
	beta: number,
	depth: number,
	maximizing: boolean
}

export interface ResponseABHPP{

}

/*
TODO:
- Merge b and w logic
- Try not to do sim.generate_moves() on evaluate
- Dont do generate_moves if children is already populated (What about pruned lines?)

*/

export class WorkerTaskAB extends Task{
	params: AbParams;
	constructor(params: AbParams) {
		super();
		this.params = params;
	}


	public process(sim: Chess): any {

		sim.load(this.params.node.fen);
		let score = this.alphaBeta(sim, this.params.node, this.params.depth, -1e9, 1e9, this.fenToTurn(this.params.node.fen) == "w");
		sim.load(this.params.node.fen);
		return sim.move_to_san(this.params.node.bestMove.move.moveTo);

	}

	fenToTurn(fen: string): string {
		return fen.split(" ")[1];
	}

	alphaBeta(sim: Chess, node: Node88, depth: number, alpha: number, beta: number, maximizingPlayer: boolean): number {

		if (depth == 0) {
			return evaluator(sim, sim.generate_moves()).numeric;
		}

		let moves = sim.generate_moves({ legal: false });
		let turn = sim.turn();
		node.children = [];

		// TODO collect equal scores and choose randomly
		if (maximizingPlayer) {
			// v: best so far
			// let v = -1e9;
			let idx = 0;
			let bestIdx = -1
			for (let move of moves) {

				// let san = sim.move_to_san(move);

				sim.make_move(move);


				// Filter illegal moves
				if (sim.king_attacked(turn)) {
					sim.undo_move();
					continue;
				}


				let child = new Node88("", move, node);
				// child.san = san;

				let childScore = this.alphaBeta(sim, child, depth - 1, alpha, beta, false);
				child.score = childScore;
				// v = Math.max(v, childScore);
				if (childScore > alpha) {
					alpha = childScore;
					node.bestMove = { move: child, score: new NumericScore(childScore) };
					bestIdx = idx;
				}

				// Restore
				sim.undo_move();

				// Store child
				node.children.push(child);

				if (beta <= alpha) {
					// console.log("A: Cutting off at move: " + this.line(child) + ", depth:" + depth + " v: " + v);
					break; /* cut off */
				}
				idx++;
			}
			// Order list with pricipal first
			if (bestIdx >= 0) {
				let n = node.children.splice(bestIdx, 1);
				node.children.unshift(n[0]);
			}

			// Found no legal moves, game over
			if (node.children.length == 0) {
				return evaluator(sim, []).numeric;
			}

			// Did not cut off
			return alpha;
		} else {
			// let v = 1e9;
			let idx = 0;
			let bestIdx = -1
			for (let move of moves) {

				// let san = sim.move_to_san(move);

				sim.make_move(move);

				// Filter illegal moves
				if (sim.king_attacked(turn)){
					sim.undo_move();
					continue;
				}


				let child = new Node88("", move, node);
				// child.san = san;
				// let out = "move " + move.piece + ": " + sim.algebraic(move.from) + " -> " + sim.algebraic(move.to);
				// console.log(out);
				// console.log("wtf");

				// v = Math.min(v, this.alphaBeta(child, depth - 1, alpha, beta, true));
				let childScore = this.alphaBeta(sim, child, depth - 1, alpha, beta, true);
				child.score = childScore;
				if (childScore < beta) {
					beta = childScore;
					node.bestMove = { move: child, score: new NumericScore(childScore) };
					bestIdx = idx;
				}
				// beta = Math.min(beta, v);

				// Restore
				sim.undo_move();

				// Store child
				node.children.push(child);

				if (beta <= alpha) {
					// console.log("B: Cutting off at move: " + this.line(child) + ", depth:" + depth + " v:" + v);
					break; /* cut off */
				}
				idx++;
			}
			// Order list with pricipal first
			if (bestIdx >= 0) {
				let n = node.children.splice(bestIdx, 1);
				node.children.unshift(n[0]);
			}

			// Found no legal moves, game over
			if (node.children.length == 0) {
				return evaluator(sim, []).numeric;
			}

			return beta;
		}


	}
}