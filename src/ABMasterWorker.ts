

import {Task} from "./WorkerTask";
import {Node88} from "./GameTree";
import {Chess, Move88} from "chess.js";
import {evaluator} from "./MaterialEvaluator";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";
import {Deferred} from "./Deferred";


// Cannot get lib.webworker.d.ts to play nice with ts loader. Adding missing declarations directly.
declare var onmessage: (ev: MessageEvent) => any;
declare function postMessage(data: any): void;
declare function addEventListener(type: "error", listener: (ev: ErrorEvent) => any, useCapture?: boolean): void;
declare function addEventListener(type: "message", listener: (ev: MessageEvent) => any, useCapture?: boolean): void;
declare function addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
declare var onerror: (ev: Event) => any;

var sim = new Chess();
var task: TaskAB;

onmessage = function(event) {


	switch(event.data.cmd){
		case 'start':
			task = new TaskAB(event.data.node);
			task.iterativeDeepening();
		break
	}



};

export interface AbMasterResult {
    san: string,
    score: number,
    principalVariation: Move88[],
	depth: number,
	tree: any
}

export interface AbParams {
	node: Node88,
	alpha: number,
	beta: number,
	depth: number,
	maximizing: boolean,
	hint: Move88[]
}


interface ResponseABHPP{
	san: string,
	score: number,
	principalVariation: Move88[],
	tree?: Node88
}

export class TaskAB {
    root: Node88;

	constructor(root: Node88) {
		this.root = root;
	}

	public buildPrincipalVariation(node:Node88):Move88[] {
		let pv:Move88[] = [];
		let it = node;
		while (it.bestMove) {
			pv.push(it.bestMove.move.moveTo);
			it = it.bestMove.move;
		}
		return pv;
	}

	leaves:number;
	dropped:number;
	kept:number;

	public iterativeDeepening (){

		let start = new Date().getTime();
		let deferred = new Deferred<string>();

		let d = 1;
		let maxd = 20;
		let hint = [];
		let san = "..";


		for (; d <= maxd; d++){

            self["p_generate_moves"] = 0;
            self["p_attacked"] = 0;
            self["p_generate_fen"] = 0;
            self["p_move_to_san"] = 0;
            self["p_evaluate"] = 0;
            this.leaves = 0;
            this.dropped = 0;
            this.kept = 0;

			sim.load(this.root.fen);

			let score = this.alphaBeta(sim, this.root, d, -1e9, 1e9, this.fenToTurn(this.root.fen) == "w", hint);
			hint = this.buildPrincipalVariation(this.root);

			sim.load(this.root.fen);
			san = sim.move_to_san(this.root.bestMove.move.moveTo);
			console.log("W" + d + ":Finished search at depth: " + d);
			console.log("W" + d + ":Computation time: " + (((new Date().getTime()) - start) / 1000.0));
			console.log("W" + d + ":generate_moves(): " + self["p_generate_moves"]);
			console.log("W" + d + ":generate_fen(): " + self["p_generate_fen"]);
			console.log("W" + d + ":move_to_san(): " + self["p_move_to_san"]);
			console.log("W" + d + ":evaluate(): " + self["p_evaluate"]);
			console.log("W" + d + ":attacked(): " + self["p_attacked"]);
			console.log("W" + d + ":leaf nodes: " + this.leaves);
			console.log("W" + d + ":dropped nodes: " + this.dropped);
			console.log("W" + d + ":kept nodes: " + this.kept);




			// Post message about the result
			postMessage({
				san: san,
				score: score,
				principalVariation: hint,
				depth: d,
				tree: null//this.root
				//tree: this.params.node
			});


		}



	}



	fenToTurn(fen:string):string {
		return fen.split(" ")[1];
	}

	alphaBeta(sim:Chess, node:Node88, depth:number, alpha:number, beta:number, maximizingPlayer:boolean, pv:Move88[]):number {

		
		let DEBUG = false;

		let ts = [];
		let trace = (k, v) => {
			ts.push("\t"+k+": "+v);
		}

		if(DEBUG) trace("detph", depth);
		if(DEBUG) trace("alpha", alpha);
		if(DEBUG) trace("beta", beta);
		if(DEBUG) trace("maximizingPlayer", maximizingPlayer);

		if (depth == 0) {
			this.leaves++;
			let ms = sim.generate_moves();
			node.children = ms.map(m => new Node88("", m, null));
			let out = evaluator(sim, ms).numeric;
			return out;
		}

		let turn = sim.turn();

		let moves:Move88[];
		let childrenPrecompiled = true;

		if (!node.children) {
			moves = sim.generate_moves({legal: false});
			node.children = [];
			childrenPrecompiled = false;
		}

		//// Consider last iteration's principal variation first
		//if(pv.length > 0){
		//	// Try principle variation first
		//	let hint = pv.shift();
		//	let idx = moves.findIndex((m) => {
		//		return m.to == hint.to
		//			&& m.from == hint.from;
		//	});
		//	console.log("Moved pv up from idx " + idx);
		//	let n: Move88[] = moves.splice(idx, 1);
		//	moves.unshift(n[0]);
        //
		//}


		let len = childrenPrecompiled ? node.children.length : moves.length;
		let cutoff = false;
        let idx = 0;
		let bestIdx = 0;
		if(DEBUG) trace("Children, pre loop", node.children.map(n => n.score + " " + n.valid).join("\n\t\t"));
		for (let i = 0; i < len; i++) {

			// Select child
			let child:Node88;
			if (childrenPrecompiled) {
				child = node.children[i];
			} else {
				child = new Node88("", moves[i], null);
			}
			let move = child.moveTo;

			sim.make_move(move);

			if(DEBUG) trace("__________________move", move);

			if (!childrenPrecompiled) {
				// Filter illegal moves
				if (sim.king_attacked(turn)) {
					sim.undo_move();
					continue;
				} else {
					node.children.push(child);
				}
			}

			// Got valid child, got valid move
			// w == maxizming(true)
			// alpha: det beste white kan oppnå
			// beta: det beste black kan oppnå

			// cutoff: beta < alpha

			if (!cutoff) {

				// Go deeper
				let childScore = this.alphaBeta(sim, child, depth - 1, alpha, beta, !maximizingPlayer, pv);
				child.score = childScore;
				child.valid = true;

				if(DEBUG) trace("childScore", childScore);
				// Update alpha/beta
				if (maximizingPlayer) {
					if (childScore > alpha) {

						if(DEBUG) trace("***", "update-a");
						alpha = childScore;
						node.bestMove = {move: child, score: new NumericScore(childScore)};
                        bestIdx = idx;
					}
				} else {
					if (childScore < beta) {
						if(DEBUG) trace("***", "update-b");
						beta = childScore;
						node.bestMove = {move: child, score: new NumericScore(childScore)};
                        bestIdx = idx;
					}
				}

			}

            idx++;

			// Restore simulator
			sim.undo_move();

			// Should we cut off?
			if (!cutoff && beta <= alpha) {
				cutoff = true;

				if(DEBUG) trace("cutoff", cutoff);

				if (childrenPrecompiled){
					// Invalidate rest of the children
					for (let j = i+1; j < len; j++) {
						node.children[j].valid = false;
					}
					break;
				}

				this.dropped += len - i;




				// Comment out to keep a full tree
				break;

				// console.log("A: Cutting off at move: " + this.line(child) + ", depth:" + depth + " v: " + v);
				//break; /* cut off */
			}
			this.kept++;

		}

		// Sort moves
		let nodecmp = (a, b, rising) => {
			//console.log(a.score + " vs " + b.score);

			if(a.valid && !b.valid)
				return 1;
			else if(!a.valid && b.valid)
				return -1;

			if(a.score>b.score){
				return 1;
			} else if (b.score>a.score){
				return -1;
			} else {
				return 0;
			}
		}

		if(DEBUG) trace("Children, pre sort", node.children.map(n => n.score + " " + n.valid).join("\n\t\t"));
		node.children.sort((a,b) => nodecmp(a,b, maximizingPlayer));

		if(DEBUG && node.bestMove){
			if(Math.abs(node.children[0].score - node.bestMove.move.score) > 0.01){
				console.log("error sorting idx: "+ bestIdx +", cutoff: "+ cutoff +", maximizingplayer: "+maximizingPlayer + ", bestmove: "+node.bestMove.move.score);
			

				if(DEBUG) trace("Children, post sort", node.children.map(n => n.score + " " + n.valid).join("\n\t\t"));

				console.log("Trace: \n" + ts.join("\n"));
				/*for (let c of node.children){
					console.log("Child: " + c.score);
				}*/

			}
			
			//console.log("best sort: " + (node.children[0] == node.bestMove.move));
		}



		// Found no legal moves, game over
		if (node.children.length == 0) {
			let out = evaluator(sim, []).numeric;
			return out;
		} else {

            // Order principal variation first
            //let best = node.children.splice(bestIdx, 1);
            //node.children.unshift(best[0]);
        }

		return maximizingPlayer ? alpha : beta;


	}

}
