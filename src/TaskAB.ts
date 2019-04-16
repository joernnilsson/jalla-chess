
import {Task} from "./WorkerTask";
import {Node88} from "./GameTree";
import {Chess, Move88} from "chess.js";
import {evaluator} from "./MaterialEvaluator";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";
import {Deferred} from "./Deferred";

//declare var global:any;

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
    maxd: number;
    sim: Chess;
    resultCallback: (a: AbMasterResult) => void;

	constructor(root: Node88, sim: Chess, maxd: number, callback?: (a: AbMasterResult) => void) {
		this.root = root;
        this.maxd = maxd;
        this.resultCallback = callback;
        this.sim = sim;
	}

    /*
	public buildPrincipalVariation(node:Node88):Move88[] {
		let pv:Move88[] = [];
        let it = node;
        console.log("A:");
		while (it.bestMove) {
            console.log("> "+it.score)
			pv.push(it.bestMove.move.moveTo);
			it = it.bestMove.move;
		}
		return pv;
    }
    */

    public buildPrincipalVariation(node:Node88):Move88[] {

        console.log("B:");
        let pvdig = (node: Node88) => {
            if(node.children){
                //console.log("> "+node.score)
                return [node.children[0].moveTo, ...pvdig(node.children[0])];
            }
            return [];
        };
        return pvdig(node);
	}

	leaves:number;
	dropped:number;
	kept:number;

	public iterativeDeepening(): AbMasterResult{

		let start = new Date().getTime();
		let deferred = new Deferred<string>();

		let d = 1;
		let pv = [];
        let san = "..";
        let score: number;

        var g_profile = typeof(self) != "undefined" ? self : typeof(window) != "undefined" ? window : {};

		for (; d <= this.maxd; d++){

            g_profile["p_generate_moves"] = 0;
            g_profile["p_attacked"] = 0;
            g_profile["p_generate_fen"] = 0;
            g_profile["p_move_to_san"] = 0;
            g_profile["p_evaluate"] = 0;
            this.leaves = 0;
            this.dropped = 0;
            this.kept = 0;

			this.sim.load(this.root.fen);

			score = this.alphaBeta(this.sim, this.root, d, -1e9, 1e9, this.fenToTurn(this.root.fen) == "w");
			pv = this.buildPrincipalVariation(this.root);

			this.sim.load(this.root.fen);
			san = this.sim.move_to_san(this.root.children[0].moveTo);
			console.log("W" + d + ":Finished search at depth: " + d);
			console.log("W" + d + ":Computation time: " + (((new Date().getTime()) - start) / 1000.0));
			console.log("W" + d + ":generate_moves(): " + g_profile["p_generate_moves"]);
			console.log("W" + d + ":generate_fen(): " + g_profile["p_generate_fen"]);
			console.log("W" + d + ":move_to_san(): " + g_profile["p_move_to_san"]);
			console.log("W" + d + ":evaluate(): " + g_profile["p_evaluate"]);
			console.log("W" + d + ":attacked(): " + g_profile["p_attacked"]);
			console.log("W" + d + ":leaf nodes: " + this.leaves);
			console.log("W" + d + ":dropped nodes: " + this.dropped);
			console.log("W" + d + ":kept nodes: " + this.kept);


            let localsim = new Chess(this.root.fen);
            localsim.load(this.root.fen);
			console.log("W" + d + ":pv: "+this.buildPrincipalVariation(this.root).map((m) => {
                let san = localsim.move_to_san(m);
                localsim.make_move(m);
                return san;
            }).join(" "));

            // Post message about the result
            if(this.resultCallback)
                this.resultCallback({
                    san: san,
                    score: score,
                    principalVariation: pv,
                    depth: d,
                    tree: null//this.root
                    //tree: this.params.node
                });

		}
        
        return {
            san: san,
            score: score,
            principalVariation: pv,
            depth: d,
            tree: null//this.root
            //tree: this.params.node
        };


	}



	fenToTurn(fen:string):string {
		return fen.split(" ")[1];
	}

	alphaBeta(sim:Chess, node:Node88, depth:number, alpha:number, beta:number, maximizingPlayer:boolean):number {
		
		let DEBUG = false;

		let ts = [];
		let trace = (k, v) => {
			ts.push("\t"+k+": "+v);
		}

		if(DEBUG) trace("detph", depth);
		if(DEBUG) trace("alpha", alpha);
		if(DEBUG) trace("beta", beta);
		if(DEBUG) trace("maximizingPlayer", maximizingPlayer);


        // Initialize score
        node.score = maximizingPlayer ? alpha : beta;

		if (depth == 0) {
			this.leaves++;
			let ms = sim.generate_moves();
			node.children = ms.map(m => new Node88("", m, null));
            let out = evaluator(sim, ms).numeric;
            node.score = out;
			return out;
		}

		let turn = sim.turn();

		let moves:Move88[];
        let illegalMovesFiltered = true;

		if (!node.children) {
            //let illegalMovesFiltered = false;
			moves = sim.generate_moves({legal: true});
			node.children = moves.map(m => new Node88("", m, null));
		}

		let cutoff = false;
        let idx = 0;
		let bestIdx = 0;
		if(DEBUG) trace("Children, pre loop", node.children.map(n => n.score + " " + n.valid).join("\n\t\t"));
		for (let i = 0; i < node.children.length; i++) {

			// Select child
            let child = node.children[i];
			let move = child.moveTo;

            if(cutoff){
                // Won't consider
                child.score = maximizingPlayer ? -1e6 : 1e6;
                continue;
            }

			sim.make_move(move);

			if(DEBUG) trace("__________________move", move);

			// Got valid child, got valid move
			// w == maxizming(true)
			// alpha: det beste white kan oppnå
			// beta: det beste black kan oppnå

			// cutoff: beta < alpha

			if (!cutoff) {

				// Go deeper
				let childScore = this.alphaBeta(sim, child, depth - 1, alpha, beta, !maximizingPlayer);
				child.score = childScore;
				child.valid = true;

				if(DEBUG) trace("childScore", childScore);
				// Update alpha/beta
				if (maximizingPlayer) {
					if (childScore > alpha) {

						if(DEBUG) trace("***", "update-a");
						alpha = childScore;
                        //node.bestMove = {move: child, score: new NumericScore(childScore)};
                        bestIdx = idx;
					}
				} else {
					if (childScore < beta) {
						if(DEBUG) trace("***", "update-b");
						beta = childScore;
						//node.bestMove = {move: child, score: new NumericScore(childScore)};
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


				//this.dropped += len - i;

				// Comment out to keep a full tree
				//break;

				// console.log("A: Cutting off at move: " + this.line(child) + ", depth:" + depth + " v: " + v);
				//break; /* cut off */
			}
			//this.kept++;

		}

        // Update score
        node.score = maximizingPlayer ? alpha : beta;


        
		// Sort moves
		let nodecmp = (a: Node88, b: Node88, rising: boolean) => {

			return !rising ? a.score-b.score : b.score-a.score;
		}

		if(DEBUG) trace("Children, pre sort", node.children.map(n => n.score).join("\n\t\t"));
		node.children.sort((a,b) => nodecmp(a,b, maximizingPlayer));

        /*
		if(DEBUG && node.bestMove){
			if(Math.abs(node.children[0].score - node.bestMove.move.score) > 0.01){
				console.log("error sorting idx: "+ bestIdx +", cutoff: "+ cutoff +", maximizingplayer: "+maximizingPlayer + ", bestmove: "+node.bestMove.move.score);
			

				if(DEBUG) trace("Children, post sort", node.children.map(n => n.score).join("\n\t\t"));

				console.log("Trace: \n" + ts.join("\n"));
				//for (let c of node.children){
				//	console.log("Child: " + c.score);
				//}

			}
			
			//console.log("best sort: " + (node.children[0] == node.bestMove.move));
		}
        */
        

		// Found no legal moves, game over
		if (node.children.length == 0) {
			let out = evaluator(sim, []).numeric;
			return out;
		} else {

            // Order principal variation first
            //let best = node.children.splice(bestIdx, 1);
            //node.children.unshift(best[0]);
        }

		return node.score;


	}

}