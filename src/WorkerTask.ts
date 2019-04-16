"use strict"

import {Node} from "./GameTree";
import {Chess} from "chess.js";

var taskCount = 0;
var getCount = function(){
	taskCount += 1;
	return taskCount;
}

export class WorkerTask {
	id: number;
	fen: string;
	constructor(fen: string){
		this.id = getCount();
		this.fen = fen;
	}


}

export class WorkerResult {
	id: number;
	node: Node
	constructor(i, n){
		this.id = i,
		this.node = n;
	}
}

export interface TaskDef {
	id: number;
	processor: string;
	data: any;
}

export abstract class Task {
	id: number;
	processor: string;

	constructor(){
		this.processor = this.getClassName();
	}

	public abstract process(sim: Chess): any;

	public getClassName() {
		var funcNameRegex = /function (.{1,})\(/;
		var results = (funcNameRegex).exec(this["constructor"].toString());
		return (results && results.length > 1) ? results[1] : "";
	}
}

