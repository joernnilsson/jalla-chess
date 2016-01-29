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
	principalVariation: Move88[],
    tree?: Node88
}

export interface EventResponseABHPP {
	data: ResponseABHPP
}



/*
TODO:
* Merge b and w logic
* Try not to do sim.generate_moves() on evaluate
- Dont do generate_moves if children is already populated (What about pruned lines?)
* Return principle variation
- collect equal scores and choose randomly
- reuse tree from last iteration

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

    leaves: number;

	public process(sim: Chess): ResponseABHPP {


		let start = new Date().getTime();
		self["p_generate_moves"] = 0;
		self["p_attacked"] = 0;
		self["p_generate_fen"] = 0;
		self["p_move_to_san"] = 0;
		self["p_evaluate"] = 0;
        this.leaves = 0;


		sim.load(this.params.node.fen);
		//this.params.hint = [];
		let score = this.alphaBeta(sim, this.params.node, this.params.depth, -1e9, 1e9, this.fenToTurn(this.params.node.fen) == "w", this.params.hint);
		let pv = this.buildPrincipalVariation(this.params.node);
		sim.load(this.params.node.fen);
		let san = sim.move_to_san(this.params.node.bestMove.move.moveTo);
		console.log("W"+ this.params.depth + ":Finished search at depth: " + this.params.depth);
		 console.log("W"+ this.params.depth + ":Computation time: " + (((new Date().getTime()) - start) / 1000.0));
		 console.log("W"+ this.params.depth + ":generate_moves(): " + self["p_generate_moves"]);
		 console.log("W"+ this.params.depth + ":generate_fen(): " + self["p_generate_fen"]);
		 console.log("W"+ this.params.depth + ":move_to_san(): " + self["p_move_to_san"]);
		 console.log("W"+ this.params.depth + ":evaluate(): " + self["p_evaluate"]);
		 console.log("W"+ this.params.depth + ":attacked(): " + self["p_attacked"]);
        console.log("W"+ this.params.depth + ":leaf nodes: " + this.leaves);
		return {
			san: san,
			score: score,
			principalVariation: pv
            //tree: this.params.node
		}

	}

	fenToTurn(fen: string): string {
		return fen.split(" ")[1];
	}

	alphaBeta(sim: Chess, node: Node88, depth: number, alpha: number, beta: number, maximizingPlayer: boolean, pv: Move88[]): number {

		if (depth == 0) {
            this.leaves++;
            let ms = sim.generate_moves();
            node.children = ms.map(m => new Node88("", m, null));
			let out = evaluator(sim, ms).numeric;
			return out;
		}

		let turn = sim.turn();


        let moves: Move88[];
        let childrenPrecompiled = true;

        if(!node.children){
            moves = sim.generate_moves({ legal: false });
            node.children = [];
            childrenPrecompiled = false;
        }

        // Consider last iteration's principal variation first
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


        let len = childrenPrecompiled ? node.children.length : moves.length;
        let cutoff = false;
        for (let i = 0; i < len; i++){

            // Select child
            let child: Node88;
            if(childrenPrecompiled){
                child = node.children[i];
            } else {
                child = new Node88("", moves[i], null);
            }
            let move = child.moveTo;

            sim.make_move(move);

            if(!childrenPrecompiled){
                // Filter illegal moves
                if (sim.king_attacked(turn)) {
                    sim.undo_move();
                    continue;
                } else {
                    node.children.push(child);
                }
            }

            // Got valid child, got valid move

            if(!cutoff){

                // Go deeper
                let childScore = this.alphaBeta(sim, child, depth - 1, alpha, beta, !maximizingPlayer, pv);
                child.score = childScore;

                // Update alpha/beta
                if(maximizingPlayer){
                    if (childScore > alpha) {
                        alpha = childScore;
                        node.bestMove = { move: child, score: new NumericScore(childScore) };
                    }
                } else {
                    if (childScore < beta) {
                        beta = childScore;
                        node.bestMove = { move: child, score: new NumericScore(childScore) };
                    }
                }

            }

            // Restore simulator
            sim.undo_move();

            // Should we cut off?
            if (!cutoff && beta <= alpha) {
                cutoff = true;

                if(childrenPrecompiled)
                    break;

                // Comment out to keep a full tree
                break;

                // console.log("A: Cutting off at move: " + this.line(child) + ", depth:" + depth + " v: " + v);
                //break; /* cut off */
            }

        }

        // Found no legal moves, game over
        if (node.children.length == 0) {
            let out = evaluator(sim, []).numeric;
            return out;
        }

        return maximizingPlayer ? alpha : beta;



        //let stop = false;
        //for (let move of moves) {
        //
        //    // Simulator state block start
        //    sim.make_move(move);
        //
        //    // Filter illegal moves
        //    if (sim.king_attacked(turn)) {
        //        sim.undo_move();
        //        continue;
        //    }
        //
        //    let child = new Node88("", move, null);
        //
        //    if(!stop){
        //
        //        // Go deeper
        //        let childScore = this.alphaBeta(sim, child, depth - 1, alpha, beta, !maximizingPlayer, pv);
        //        child.score = childScore;
        //
        //        // Update alpha/beta
        //        if(maximizingPlayer){
        //            if (childScore > alpha) {
        //                alpha = childScore;
        //                node.bestMove = { move: child, score: new NumericScore(childScore) };
        //            }
        //        } else {
        //            if (childScore < beta) {
        //                beta = childScore;
        //                node.bestMove = { move: child, score: new NumericScore(childScore) };
        //            }
        //        }
        //
        //    }
        //
        //    // Restore simulator
        //    sim.undo_move();
        //
        //    // Simulator state block end
        //
        //
        //    // Store child
        //    node.children.push(child);
        //
        //    // Should we cut off?
        //    if (!stop && beta <= alpha) {
        //        stop = true;
        //        // console.log("A: Cutting off at move: " + this.line(child) + ", depth:" + depth + " v: " + v);
        //        //break; /* cut off */
        //    }
        //}
        //
        //// Found no legal moves, game over
        //if (node.children.length == 0) {
        //    let out = evaluator(sim, []).numeric;
        //    return out;
        //}
        //
        //return maximizingPlayer ? alpha : beta;
        //
        //







	}










}