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

export class EngineMinMaxParallel<T extends Evaluator> extends Engine<T> {


	simulator: Chess;
	pool: WorkerPool;

	constructor() {
		super();
		this.simulator = new Chess();
		// this.pool = new WorkerPool(1, true);
		this.pool = new WorkerPool(8, false);
	}

	sim(fen: string) {
		let sims = this.simulator;
		sims.load(fen);
		return sims;
	}

	// Quick fen to turn, without simulator
	fenToTurn(fen: string): string {
		return fen.split(" ")[1];
	}
	
	getBestMove(fen: string): Promise<string> {
		return this.findBestMoveParallel(fen, 3000);
	}

	/*
		Some sort of min-max algorithm. Homemade. Running in prallel.

	*/
	findBestMoveParallel(fen: string, timeToThink: number): Promise<string> {
		let engine = this;
		let deferred = new Deferred<string>();
		let keepRunning = true;

		// Reset thread pool
		engine.pool.disable();
		engine.pool.enable();


		let bestMove = (node: Node): Node => {
			let turn = engine.fenToTurn(node.fen);
			let bestNodes: Node[] = [];

			for (let c of node.children) {
				if (bestNodes.length == 0) {
					bestNodes.push(c);
				} else if (Node.compareBest(c, bestNodes[0]) == 0) {
					bestNodes.push(c);
				} else if ((turn == 'w' && Node.compareBest(c, bestNodes[0]) > 0)
					|| (turn == 'b' && Node.compareBest(bestNodes[0], c) > 0)) {
					bestNodes = [];
					bestNodes.push(c);
				}
			}

			return bestNodes[Math.floor(Math.random() * bestNodes.length)];
		};

		let climb = (node: Node): number => {
			let bestChild = bestMove(node);
			if (bestChild) {
				// Else game over
				node.bestMove = { move: bestChild, score: Node.getBestScore(bestChild) };
			}
			if (node.parent) {
				return climb(node.parent) + 1;
			} else {
				return 1;
			}
		}



		let maxDepth = 100;
		let nodesEvaluated = 0;
		let maxDepthEvaluated = 0;

		let printStats = () => {
			let engineStats = `Positions evaluated: ${nodesEvaluated}, deepest line: ${maxDepthEvaluated}`;
			// console.log(engineStats);
			$("#engine-stats").text(engineStats);
		}

		let statsTimerFn = () => {
			printStats();
			statsTimer = setTimeout(statsTimerFn, 100);
		};
		let statsTimer: any = setTimeout(statsTimerFn, 100);

		let onNodeEvaluated = (node: Node) => {

			// Set the parent reference correctly
			for (let c of node.children) {
				c.parent = node;
			}

			// TODO Debounce best child evaluations at root/high level

			// Find the best move. Walk up the tree and deliver the good news.
			let depth = climb(node);

			maxDepthEvaluated = Math.max(maxDepthEvaluated, depth);

			// Schedule next level
			if (depth <= maxDepth) {
				nodesEvaluated += node.children.length;
				for (let c of node.children) {
					((child: Node) => {
						this.pool.enqueueTask(new WorkerTask(child.fen))
							.then((createdNode: Node): Node => {
								// Copy to the original child Node object
								child.children = createdNode.children;
								return child;
							})
							.then(onNodeEvaluated).catch((e) => { console.error(e); });
					})(c);
					// var child = c;

				}
			} else {
				// console.log("Stopping at max depth");
			}

			// Chainable
			return node;
		};

		// Start evaluation!
		// This creates the root node, creates first level child nodes and analyses them
		this.pool.enqueueTask(new WorkerTask(fen))
			.then(n => { n.score = evaluator(this.sim(n.fen)); return n; })
			.then(onNodeEvaluated)
			.then((node: Node) => {
				setTimeout(() => {
					keepRunning = false;
					engine.pool.disable();
					// Time is up, return the best move
					// engine.visualize(node);
					printBestPath(node);
					clearTimeout(statsTimer);
					deferred.resolve(node.bestMove.move.moveTo);
				}, timeToThink);

			}).catch((e) => { console.error(e); });



		let printBestPath = (node: Node) => {
			printStats;
			let str = "Moves: (" + node.score.numeric + "/" + node.bestMove.score.numeric + ") ";
			let n = node.bestMove.move;
			while (n != null) {
				str += n.moveTo + "(" + n.score.numeric + "/" + (n.bestMove ? n.bestMove.score.numeric : "") + ") ";
				n = n.bestMove ? n.bestMove.move : null;
			}
			console.log(str);
		}



		return deferred.getPromise();
	}

}