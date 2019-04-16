

import {Task} from "./WorkerTask";
import {Node88} from "./GameTree";
import {Chess, Move88} from "chess.js";
import {evaluator} from "./MaterialEvaluator";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";
import {Deferred} from "./Deferred";
import {TaskAB, AbMasterResult} from "./TaskAB";


// Cannot get lib.webworker.d.ts to play nice with ts loader. Adding missing declarations directly.
declare var onmessage: (ev: MessageEvent) => any;
declare function postMessage(data: any): void;
declare function addEventListener(type: "error", listener: (ev: ErrorEvent) => any, useCapture?: boolean): void;
declare function addEventListener(type: "message", listener: (ev: MessageEvent) => any, useCapture?: boolean): void;
declare function addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
declare var onerror: (ev: Event) => any;

var sim = new Chess();
var task: TaskAB;

let resultCallback = (result: AbMasterResult) => {
	// Post message about the result
	postMessage(result);
}

onmessage = function(event) {

	switch(event.data.cmd){
		case 'start':
			task = new TaskAB(event.data.node, sim, 50, resultCallback);
			task.iterativeDeepening();
		break
	}

};


