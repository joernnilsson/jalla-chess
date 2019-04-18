import {AbMasterResult} from "./TaskAB";
"use strict";

import {Chess, Move88} from "chess.js";

import {Deferred} from "./Deferred";
import {WorkerTask, WorkerResult} from "./WorkerTask";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

import {SimulatorTaskExecutor} from "./TaskExecutor";
import {evaluator} from "./MaterialEvaluator";
import {Node88} from "./GameTree";

import {Engine} from "./engine";
import {Evaluator} from "./Evaluator";

import {visualize} from "./Node88Visualizer";

// TODO This is a hack, it depends on transpiling to es5/commonjs
declare var require: any;


export class EngineAlphaBetaHp<T extends Evaluator> extends Engine<T> {

	simulator: Chess;
	//pool: TaskWorkerPool;
	evaluator: T;

	constructor() {
		super();
		this.simulator = new Chess();
		//his.pool = new TaskWorkerPool(1, true);
		// this.pool = new WorkerPool(8, false);
	}

	sim(fen: string) {
		let sims = this.simulator;
		sims.load(fen);
		return sims;
	}


	fenToTurn(fen: string): string {
		return fen.split(" ")[1];
	}
/*
	getBestMoveO(fen: string, timeToThink: number): Promise<string> {
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
		let bestVariation: Move88[] = [];
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





		let fcalc = (depth: number, hint: Move88[]): Promise<any> => {
			let task = new WorkerTaskAB({ node: root, alpha: -1e9, beta: 1e9, depth: depth, maximizing: this.fenToTurn(fen) == "w", hint: hint});
			let resp: Promise<any> = this.pool.enqueueTask(task);
			resp.then((m: EventResponseABHPP) => {
				console.log("Finished search at depth " + depth + ", best move: " + m.data.san);
				d = depth;
				bestMove = m.data.san;
				bestScore = m.data.score;
				let pv = m.data.principalVariation;
				bestVariation = pv;
				if(!abort && depth < maxd){

                    // Replace root
                    //root = m.data.tree;

                    console.log("starting search at d "+(depth + 1));
					fcalc(depth + 1, pv);
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

		let pmove: Promise<any> = fcalc(1, []);

		let timeout = setTimeout(() => {

			abort = true;
			this.pool.disable();
			deferred.resolve(bestMove);

			let sim = this.sim(root.fen);
			let line = bestVariation.map((m) => {
				let san = sim.move_to_san(m);
				sim.make_move(m);
				return san;
			}).join(" ");

			console.log("E: Computation time: " + (((new Date().getTime()) - start) / 1000.0));
			console.log("E: Principal variation: " +  line + " (" + bestScore + ")")
			console.log("E: BestMove: " +  bestMove)

			clearTimeout(statsTimer);
			printStats();

		}, timeToThink);
			

		// console.log("Best score: " + bestScore);

		// deferred.resolve(this.sim(fen).move_to_san(node.bestMove.move.moveTo));

		return deferred.getPromise();
	}

*/
    getBestMove(fen: string, timeToThink: number): Promise<string> {
        let start = new Date().getTime();
        let deferred = new Deferred<string>();

        $('#timeout').css({width: 395}).animate({width: 0}, timeToThink, 'linear');

        let bestResult: AbMasterResult;

        if(typeof(self["abmaster"]) != "undefined"){
            self["abmaster"].terminate();
        }
        let TWC = require("worker-loader?name=ABMasterWorker.js!./ABMasterWorker");
        let master: Worker = new TWC();

        master.addEventListener("message", (event) => {
            console.log("Got result");
            console.log(event.data);
            bestResult = event.data;
            let engineStats = `Deepest line: ${bestResult.depth}`;
            $("#engine-stats").text(engineStats);
        });
        master.addEventListener("error", (error) => {
            console.error(error);
        });

        // Start the master thread
        let root = new Node88(fen, null, null);
        master.postMessage({
            cmd: 'start',
            node: root
        });


        let timeout = setTimeout(() => {

            deferred.resolve(bestResult.san);

            master.terminate();
            // Keep a reference
            //self["abmaster"] = master;


            let sim = this.sim(root.fen);
            let lineArray = bestResult.principalVariation.map((m) => {
                let san = sim.move_to_san(m);
                sim.make_move(m);
                return san;
            });
			let line = lineArray.join(" ")

			sim.load(root.fen);
			let pvdig = (node: Node88) => {
				if(node.children){
					let san = sim.move_to_san(node.children[0].moveTo);
					console.log(">> "+san)
					sim.make_move(node.children[0].moveTo);
					return [san, ...pvdig(node.children[0])];
				}
				return [];
			};
			let arr = pvdig(root);
			let line2 = pvdig(arr).join(" ");

            console.log("E: Computation time: " + (((new Date().getTime()) - start) / 1000.0));
            console.log("E: Principal variation: " +  line + " (" + bestResult.score + ")");
            console.log("E: Principal variation: " +  line2 + " (" + root.score + ")");
            console.log("E: BestMove: " +  bestResult.score);

			// Print a specific line

			if(bestResult.tree)
				visualize(bestResult.tree, root.fen);

        }, timeToThink);

        return deferred.getPromise();
    }


}