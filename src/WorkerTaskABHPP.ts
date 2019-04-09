import {Task} from "./WorkerTask";
import {Node88} from "./GameTree";
import {Chess, Move88} from "chess.js";
import {evaluator} from "./MaterialEvaluator";


export interface AbParams {
	node: Node88,
	alpha: number,
	beta: number,
	depth: number,
	maximizing: boolean
}

export interface ResponseABHPP{

}

export class WorkerTaskABHPP extends Task{
	params: AbParams;
	constructor(params: AbParams) {
		super();
		this.params = params;
	}
	public process(sim: Chess): any {

		sim.load(this.params.node.fen);
		let moves = sim.generate_moves(/* { legal: false } */);
		let turn = sim.turn();

		if (this.params.depth == 0 || moves.length == 0) {
			return evaluator(sim.load(this.params.node.fen)).numeric;
		}

		// Create child nodes
		this.params.node.children = moves.map((m: Move88): Node88 => {
			sim.make_move(m);
			let c = new Node88(sim.fen(), m, this.params.node);
			sim.undo_move();
			// Debug
			c.san = sim.move_to_san(m);
			return c;
		});



	}
}