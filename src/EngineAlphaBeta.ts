"use strict";

import Chess from "chess.js";

import {Deferred} from "./Deferred";
import {WorkerTask, WorkerResult} from "./WorkerTask";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

import {SimulatorTaskExecutor} from "./TaskExecutor";
import {evaluator} from "./MaterialEvaluator";
import {Node} from "./GameTree";
import {WorkerPool} from "./WorkerPool";

import {Engine} from "./engine";
import {Evaluator} from "./Evaluator";

export class EngineAlphaBeta<T extends Evaluator> extends Engine<T> {

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

	// Generate line as string
	line(n: Node): string {

		if (n.bestMove) {
			return n.moveTo + " " + this.line(n.bestMove.move);
		} else {
			return n.moveTo;
		}
	}

	fenToTurn(fen: string): string {
		return fen.split(" ")[1];
	}

	getBestMove(fen: string, timeToThink: number): Promise<string> {
		let start = new Date().getTime();
		let deferred = new Deferred<string>();

		let node = Node.create(fen, null, null, null);
		let bestScore = this.alphaBeta(node, 2, -1e6, 1e6, this.fenToTurn(fen) == "w");
		console.log("Best score: " + bestScore);
		// console.log("Line: " + this.line(node.bestMove.move));

		console.log("Computation time: " + (((new Date().getTime()) - start) / 1000.0));
		deferred.resolve(node.bestMove.move.moveTo);

		return deferred.getPromise();
	}


	alphaBeta(node: Node, depth: number, alpha: number, beta: number, maximizingPlayer: boolean): number {
		
		let sim = this.sim(node.fen);
		let moves = sim.moves();
		let turn = sim.turn();

		if (depth == 0 || moves.length == 0) {
			return evaluator(this.sim(node.fen)).numeric;
		}

		// Create child nodes
		node.children = moves.map((m: string): Node => {
			sim.load(node.fen);
			sim.move(m);
			let c = Node.create(sim.fen(), m, null, node);
			return c;
		});

		// Generate line
		let line = (n: Node): string => {
			if (n.moveTo)
				return line(n.parent) + " " + n.moveTo;
			return "... ";
		}

		// collect equal scores and choose randomly
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
					console.log("A: Cutting off at move: " + line(child) + ", depth:" + depth + " v: " + v);
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
					console.log("B: Cutting off at move: " + line(child) + ", depth:" + depth + " v:" + v);
					break; /* cut off */
				}
			}
			return v;
		}

	}





}