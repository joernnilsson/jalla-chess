import {AbMasterResult} from "./ABMasterWorker";
"use strict";

import {Chess, Move88} from 'chess.js';

import {Deferred} from "./Deferred";
import {WorkerTask, WorkerResult} from "./WorkerTask";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

import {SimulatorTaskExecutor} from "./TaskExecutor";
import {evaluator} from "./MaterialEvaluator";
import {Node88} from "./GameTree";
import {TaskWorkerPool} from "./TaskWorkerPool";
import {WorkerTaskAB, ResponseABHPP, EventResponseABHPP} from "./WorkerTaskAB";

import {Engine} from "./engine";
import {Evaluator} from "./Evaluator";

import {visualize} from "./Node88Visualizer";

// TODO This is a hack, it depends on transpiling to es5/commonjs
declare var require: any;

enum PieceColor {
	white = 1,
	black = 2
}

enum PieceType {
	pawn = 1,
	knight = 2,
	bishop = 3,
	rook = 4,
	queen = 5,
	king = 6

}

let NODE_SIZE: number = 6;

class NodeBuffer { 

	view: Int32Array;

	constructor(buffer: ArrayBuffer){
		this.view = new Int32Array(buffer);
	}

	getColorInt(color: string){
		return color == "w" ? PieceColor.white : PieceColor.black;
	}

	getTypeInt(type: string){
		switch(type){
			case "p":
				return PieceType.pawn;
			case "n":
				return PieceType.knight;
			case "b":
				return PieceType.bishop;
			case "r":
				return PieceType.rook;
			case "q":
				return PieceType.queen;
			case "k":
				return PieceType.king;
		}
	}

	setChild(idx: number, move: Move88){

		let base = idx * NODE_SIZE;

		this.view[base + 0] = this.getColorInt(move.color);
		this.view[base + 1] = move.flags;
		this.view[base + 2] = move.from;
		this.view[base + 3] = move.to;
		this.view[base + 4] = this.getTypeInt(move.piece);
		this.view[base + 5] = this.getTypeInt(move.captured);

	}

	print(){
		for (let i = 0; i<this.view.length; i++){
			let base = i * NODE_SIZE;
			console.log(this.view.slice(base, base + NODE_SIZE).join(", "));
		}
	}

}


export class EngineTransferrable<T extends Evaluator> extends Engine<T> {


	constructor() {
		super();
	}


    getBestMove(fen: string, timeToThink: number): Promise<string> {
        let start = new Date().getTime();
        let deferred = new Deferred<string>();

		let sim = new Chess();
		sim.load(fen);

		let moves = sim.generate_moves();
		console.log(moves);

		// Build root data strcture
		let bufferSize = 4 * moves.length * NODE_SIZE;
		let buffer = new ArrayBuffer(bufferSize);

		let root = new NodeBuffer(buffer);

		for (let i = 0; i<moves.length; i++){
			root.setChild(i, moves[i]);
		}

		root.print();

		/*
        let TWC = require("worker?name=ABMasterWorker.js!./ABMasterWorker");
        let worker: Worker = new TWC();

        worker.addEventListener("message", (event) => {
            console.log("Main: Got message");
            console.log(event.data);
        });
        worker.addEventListener("error", (error) => {
            console.error(error);
        });
		*/


        return deferred.getPromise();
    }


}