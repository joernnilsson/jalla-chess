// / <reference path="../node_modules/typescript/lib/lib.webworker.d.ts" />
// / <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />
// / <reference path="../node_modules/typescript/lib/lib.core.es6.d.ts" />


import Chess from "chess.js";
import {WorkerTaskABHPP} from "./WorkerTaskABHPP";
import {WorkerTaskAB} from "./WorkerTaskAB";


// Cannot get lib.webworker.d.ts to play nice with ts loader. Adding missing declarations directly.
declare var onmessage: (ev: MessageEvent) => any;
declare function postMessage(data: any): void;
declare function addEventListener(type: "error", listener: (ev: ErrorEvent) => any, useCapture?: boolean): void;
declare function addEventListener(type: "message", listener: (ev: MessageEvent) => any, useCapture?: boolean): void;
declare function addEventListener(type: string, listener: EventListenerOrEventListenerObject, useCapture?: boolean): void;
declare var onerror: (ev: Event) => any;

var sim = new Chess();

// TODO do worker.process async, so we can receive abort messages

onmessage = function(event) {

	var taskDef = event.data;

	//console.log("Processing message:");
	//console.log(taskDef);

	// TODO do this using a module reesporting all tasks
	var task = null;
	switch (taskDef.processor) {
		case "WorkerTaskABHPP":
			task = new WorkerTaskABHPP(taskDef.data);
			break;
		case "WorkerTaskAB":
			task = new WorkerTaskAB(taskDef.params);
			break;
	}

	if(task == null){
		throw new Error("No such task: " + taskDef.processor);
	} else {
		let out = task.process(sim);
		console.log("Posting back " + taskDef.id +  " depth: " + taskDef.params.depth);
		postMessage( {
			id: taskDef.id,
			data: out
		});
	}
};


