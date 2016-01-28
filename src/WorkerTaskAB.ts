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
	maximizing: boolean,
	hint: Move88[]
}

export interface ResponseABHPP{
	san: string,
	score: number,
	principalVariation: Move88[]
}

export interface EventResponseABHPP {
	data: ResponseABHPP
}

/*
TODO:
- Merge b and w logic
* Try not to do sim.generate_moves() on evaluate
- Dont do generate_moves if children is already populated (What about pruned lines?)
- TODO Return principle variation

*/

export class WorkerTaskAB extends Task{
	params: AbParams;
	constructor(params: AbParams) {
		super();
		this.params = params;
	}

	public buildPrincipalVariation(node: Node88): Move88[]{
		let pv: Move88[] = [];
		let it = node;
		while(it.bestMove){
			pv.push(it.bestMove.move.moveTo);
			it = it.bestMove.move;
		}
		return pv;
	}

	public process(sim: Chess): ResponseABHPP {


		let start = new Date().getTime();
		self["p_generate_moves"] = 0;
		self["p_attacked"] = 0;
		self["p_generate_fen"] = 0;
		self["p_move_to_san"] = 0;
		self["p_evaluate"] = 0;
		
		sim.load(this.params.node.fen);
		//this.params.hint = [];
		let score = this.alphaBeta(sim, this.params.node, this.params.depth, -1e9, 1e9, this.fenToTurn(this.params.node.fen) == "w", this.params.hint);
		let pv = this.buildPrincipalVariation(this.params.node);
		sim.load(this.params.node.fen);
		let san = sim.move_to_san(this.params.node.bestMove.move.moveTo);
		console.log("Finished search at depth: " + this.params.depth);
		 console.log("Computation time: " + (((new Date().getTime()) - start) / 1000.0));
		 console.log("generate_moves(): " + self["p_generate_moves"]);
		 console.log("generate_fen(): " + self["p_generate_fen"]);
		 console.log("move_to_san(): " + self["p_move_to_san"]);
		 console.log("evaluate(): " + self["p_evaluate"]);
		 console.log("attacked(): " + self["p_attacked"]);
		return {
			san: san,
			score: score,
			principalVariation: pv
		}

	}

	fenToTurn(fen: string): string {
		return fen.split(" ")[1];
	}

	alphaBeta(sim: Chess, node: Node88, depth: number, alpha: number, beta: number, maximizingPlayer: boolean, pv: Move88[]): number {

		if (depth == 0) {
			let out = evaluator(sim, sim.generate_moves()).numeric;
			return out;
		}

		let moves: Move88[] = sim.generate_moves({ legal: false });
		let turn = sim.turn();
		node.children = [];

		//console.log("PVle: " + pv.length);
		if(pv.length > 0){
			// Try principle variation first
			let hint = pv.shift();
			let idx = moves.findIndex((m) => {
				return m.to == hint.to
					&& m.from == hint.from;
			});
			console.log("Moved pv up from idx " + idx);
			let n: Move88[] = moves.splice(idx, 1);
			moves.unshift(n[0]);

		}

		// TODO collect equal scores and choose randomly
		if (maximizingPlayer) {
			// v: best so far
			// let v = -1e9;
			let idx = 0;
			//let bestIdx = -1
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

				let childScore = this.alphaBeta(sim, child, depth - 1, alpha, beta, false, pv);
				child.score = childScore;
				// v = Math.max(v, childScore);
				if (childScore > alpha) {
					alpha = childScore;
					node.bestMove = { move: child, score: new NumericScore(childScore) };
					//bestIdx = idx;
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
			//if (bestIdx >= 0) {
			//	let n = node.children.splice(bestIdx, 1);
			//	node.children.unshift(n[0]);
			//}

			// Found no legal moves, game over
			if (node.children.length == 0) {
				let out = evaluator(sim, []).numeric;
				return out;
			}

			// Did not cut off
			return alpha;
		} else {
			// let v = 1e9;
			let idx = 0;
			//let bestIdx = -1
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
				let childScore = this.alphaBeta(sim, child, depth - 1, alpha, beta, true, pv);
				child.score = childScore;
				if (childScore < beta) {
					beta = childScore;
					node.bestMove = { move: child, score: new NumericScore(childScore) };
					//bestIdx = idx;
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
			//if (bestIdx >= 0) {
			//	let n = node.children.splice(bestIdx, 1);
			//	node.children.unshift(n[0]);
			//}

			// Found no legal moves, game over
			if (node.children.length == 0) {
				let out = evaluator(sim, []).numeric;
				return out;
			}

			return beta;
		}


	}
}