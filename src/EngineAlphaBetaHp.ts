"use strict";

import {default as Chess, Move88} from "chess.js";

import {Deferred} from "./Deferred";
import {WorkerTask, WorkerResult} from "./WorkerTask";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

import {SimulatorTaskExecutor} from "./TaskExecutor";
import {evaluator} from "./MaterialEvaluator";
import {Node88} from "./GameTree";
import {WorkerPool} from "./WorkerPool";

import {Engine} from "./engine";
import {Evaluator} from "./Evaluator";




export class EngineAlphaBetaHp<T extends Evaluator> extends Engine<T> {

	simulator: Chess;
	// pool: WorkerPool;
	evaluator: T;

	constructor() {
		super();
		this.simulator = new Chess();
		// this.pool = new WorkerPool(1, true);
		// this.pool = new WorkerPool(8, false);
	}

	sim(fen: string) {
		let sims = this.simulator;
		sims.load(fen);
		return sims;
	}

	// Generate line
	line(n: Node88): string {

		interface rfnr {
			sim: Chess,
			sans: string
		};

		let rfn = (a: Node88): rfnr => {
			if(a.parent){
				// Get simulator of parent position
				let pSim = rfn(a.parent);
				// Get san
				pSim.sans += " " + pSim.sim.move_to_san(a.moveTo);
				// Make move to a position
				pSim.sim.make_move(a.moveTo);
				// Return sim to caller
				return pSim;
			} else {
				return { sim: this.sim(a.fen), sans: "... " };
			}
		}
		let sim = rfn(n.parent);

		return sim.sans;
	}

	fenToTurn(fen: string): string {
		return fen.split(" ")[1];
	}

	getBestMove(fen: string): Promise<string> {
		let deferred = new Deferred<string>();

		let node = new Node88(fen, null, null);
		let bestScore = this.alphaBeta(node, 3, -1e6, 1e6, this.fenToTurn(fen) == "w");
		console.log("Best score: " + bestScore);
		// console.log("Line: " + this.line(node.bestMove.move));

		deferred.resolve(this.sim(fen).move_to_san(node.bestMove.move.moveTo));

		return deferred.getPromise();
	}


	alphaBeta(node: Node88, depth: number, alpha: number, beta: number, maximizingPlayer: boolean): number {
		
		let sim = this.sim(node.fen);
		let moves = sim.generate_moves(/* { legal: false } */);
		let turn = sim.turn();

		if (depth == 0 || moves.length == 0) {
			return evaluator(this.sim(node.fen)).numeric;
		}

		// Create child nodes
		node.children = moves.map((m: Move88): Node88 => {
			sim.make_move(m);
			let c = new Node88(sim.fen(), m, node);
			sim.undo_move();
			// Debug
			c.san = sim.move_to_san(m);
			return c;
		});



		// TODO collect equal scores and choose randomly
		if (maximizingPlayer) {
			// v: best so far
			let v = -1e6;
			for (let child of node.children) {
				let childScore = this.alphaBeta(child, depth - 1, alpha, beta, false);
				// v = Math.max(v, childScore);
				if (childScore > v) {
					v = childScore;
					node.bestMove = { move: child, score: new NumericScore(childScore) };
				}
				alpha = Math.max(alpha, v);
				if (beta <= alpha) {
					console.log("A: Cutting off at move: " + this.line(child) + ", depth:" + depth + " v: " + v);
					break; /* cut off */
				}
			}
			// Did not cut off
			return v;
		} else {
			let v = 1e6;
			for (let child of node.children) {
				// v = Math.min(v, this.alphaBeta(child, depth - 1, alpha, beta, true));
				let childScore = this.alphaBeta(child, depth - 1, alpha, beta, true);
				if (childScore < v) {
					v = childScore;
					node.bestMove = { move: child, score: new NumericScore(childScore) };
				}
				beta = Math.min(beta, v);
				if (beta <= alpha) {
					console.log("B: Cutting off at move: " + this.line(child) + ", depth:" + depth + " v:" + v);
					break; /* cut off */
				}
			}
			return v;
		}

	}





}