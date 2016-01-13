"use strict"

import {Node} from "./GameTree";

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


