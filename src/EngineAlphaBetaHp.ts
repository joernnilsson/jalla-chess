"use strict";

import {default as Chess, Move88} from "chess.js";

import {Deferred} from "./Deferred";
import {WorkerTask, WorkerResult} from "./WorkerTask";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

import {SimulatorTaskExecutor} from "./TaskExecutor";
import {evaluator} from "./MaterialEvaluator";
import {Node88} from "./GameTree";
import {TaskWorkerPool} from "./TaskWorkerPool";
import {WorkerTaskAB} from "./WorkerTaskAB";

import {Engine} from "./engine";
import {Evaluator} from "./Evaluator";

import {visualize} from "./Node88Visualizer";

/*
TODO
- put in bg worker
- clean up max/min-loops
- make abortable
- main thread should be master and cooridnate a shared transposition table
- implement lazy smp (iterative deepening startin on different depths)
- keep principle variation when iterating

*/

export class EngineAlphaBetaHp<T extends Evaluator> extends Engine<T> {

	simulator: Chess;
	pool: TaskWorkerPool;
	evaluator: T;

	constructor() {
		super();
		this.simulator = new Chess();
		this.pool = new TaskWorkerPool(1, false);
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

	getBestMove(fen: string, timeToThink: number): Promise<string> {
		let start = new Date().getTime();
		let deferred = new Deferred<string>();


		// Profiling
		window["p_generate_moves"] = 0;
		window["p_attacked"] = 0;
		window["p_generate_fen"] = 0;
		window["p_move_to_san"] = 0;
		window["p_evaluate"] = 0;





		let root = new Node88(fen, null, null);

		// TODO depth = 1 may not finish :(

		let d = 1;
		let maxd = 4;
		let bestScore = 0;
		let bestMove: string = "..";
		let abort = false;
		this.pool.enable();


		let printStats = () => {
			let engineStats = `Positions evaluated: ${window["p_evaluate"]}, deepest line: ${d}`;
			// console.log(engineStats);
			$("#engine-stats").text(engineStats);
		}

		let statsTimerFn = () => {
			printStats();
			statsTimer = setTimeout(statsTimerFn, 100);
		};
		let statsTimer: any = setTimeout(statsTimerFn, 100);



		let fcalc = (depth: number): Promise<any> => {
			let task = new WorkerTaskAB({ node: root, alpha: -1e9, beta: 1e9, depth: depth, maximizing: this.fenToTurn(fen) == "w" });
			let resp: Promise<any> = this.pool.enqueueTask(task);
			resp.then((m: any) => {
				console.log("Finished search at depth " + depth + ", best move: " + m.data);
				d = depth;
				bestMove = m.data;
				if(!abort && depth < maxd){
					fcalc(depth + 1);
				} else {
					// Temp
					// abort = true;
					// this.pool.disable();
					// deferred.resolve(bestMove);
					// let lstr = "Line: ";
					// let n = root;
					// while(n.bestMove){
					// 	lstr += n.bestMove.move.san + " ";
					// 	n = n.bestMove.move;
					// }
					// console.log(lstr);
					// console.log("Computation time: " + (((new Date().getTime()) - start) / 1000.0));
					// console.log("generate_moves(): " + window["p_generate_moves"]);
					// console.log("generate_fen(): " + window["p_generate_fen"]);
					// console.log("move_to_san(): " + window["p_move_to_san"]);
					// console.log("evaluate(): " + window["p_evaluate"]);
					// console.log("attacked(): " + window["p_attacked"]);

					// clearTimeout(statsTimer);
					// printStats();
					// visualize(root);
				}
			})
			return resp;
		}

		let pmove: Promise<any> = fcalc(1);

		let timeout = setTimeout(() => {

			abort = true;
			this.pool.disable();
			deferred.resolve(bestMove);
			console.log("Computation time: " + (((new Date().getTime()) - start) / 1000.0));

			clearTimeout(statsTimer);
			printStats();

		}, timeToThink);
			

		// console.log("Best score: " + bestScore);

		// deferred.resolve(this.sim(fen).move_to_san(node.bestMove.move.moveTo));

		return deferred.getPromise();
	}

	getBestMoves(fen: string, timeToThink: number): Promise<string> {
		let start = new Date().getTime();
		let deferred = new Deferred<string>();

		let node = new Node88(fen, null, null);
		// let bestScore = this.alphaBeta(node, 2, -1e9, 1e9, this.fenToTurn(fen) == "w");
		

		let d = 1;
		let maxd = 5;
		let bestScore = 0;
		while(d <= maxd){
			console.log("Searching depth: " + d);
			bestScore = this.alphaBeta(node, d, -1e9, 1e9, this.fenToTurn(fen) == "w");
			d++;
		}
		console.log("Best score: " + bestScore);

		console.log("Computation time: " + (((new Date().getTime()) - start) / 1000.0));	
		deferred.resolve(this.sim(fen).move_to_san(node.bestMove.move.moveTo));

		return deferred.getPromise();
	}

	// disabled
	alphaBeta(node: Node88, depth: number, alpha: number, beta: number, maximizingPlayer: boolean): number {
		
		let sim = this.sim(node.fen);
		let moves = sim.generate_moves({ legal: false });
		let turn = sim.turn();

		if (depth == 0 || moves.length == 0) {
			return evaluator(this.sim(node.fen)).numeric;
		}

		// Create child nodes if necessary (only at depth = 1)
		if (!node.children) {
			node.children = moves.map((m: Move88): Node88 => {
				sim.make_move(m);
				let c = new Node88(sim.fen(), m, node);
				sim.undo_move();
				// Debug
				c.san = sim.move_to_san(m);
				return c;
			});
		}



		// TODO collect equal scores and choose randomly
		if (maximizingPlayer) {
			// v: best so far
			let v = -1e9;
			let idx = 0;
			let bestIdx = -1
			for (let child of node.children) {
				let childScore = this.alphaBeta(child, depth - 1, alpha, beta, false);
				// v = Math.max(v, childScore);
				if (childScore > v) {
					v = childScore;
					node.bestMove = { move: child, score: new NumericScore(childScore) };
					bestIdx = idx;
				}
				alpha = Math.max(alpha, v);
				if (beta <= alpha) {
					// console.log("A: Cutting off at move: " + this.line(child) + ", depth:" + depth + " v: " + v);
					break; /* cut off */
				}
				idx++;
			}
			// Order list with pricipal first
			if(bestIdx >= 0){
				let n = node.children.splice(bestIdx, 1);
				node.children.unshift(n[0]);
			}

			// Did not cut off
			return v;
		} else {
			let v = 1e9;
			let idx = 0;
			let bestIdx = -1
			for (let child of node.children) {
				// v = Math.min(v, this.alphaBeta(child, depth - 1, alpha, beta, true));
				let childScore = this.alphaBeta(child, depth - 1, alpha, beta, true);
				if (childScore < v) {
					v = childScore;
					node.bestMove = { move: child, score: new NumericScore(childScore) };
					bestIdx = idx;
				}
				beta = Math.min(beta, v);
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
			return v;
		}

	}





}