/// <reference path="WorkerFactory.d.ts" />
"use strict"

import {Task} from "./WorkerTask";
//import {WorkerFactory, TaskWorker} from "./WorkerFactory";
import {TaskWorker} from "./WorkerFactory";
import {Deferred} from "./Deferred";
import {WorkerTaskABHPP} from "./WorkerTaskABHPP";
import {WorkerTaskAB} from "./WorkerTaskAB";

// TODO remove
import {Chess} from "chess.js";

// TODO This is a hack, it depends on transpiling to es5/commonjs
declare var require: any;

class ProcessingTask {
	id: number;
	deferred: Deferred<any>;
	task: Task;
    workerId: number;
	static getFor(task: Task): ProcessingTask {
		let pt = new ProcessingTask();
		pt.id = task.id;
		pt.deferred = new Deferred<any>();
		pt.task = task;
		return pt;
	}
}

interface PtMap {
	[key: number]: ProcessingTask;
}

function workerLog(worker: number, msg: string){
	console.log("[" + worker + "] " + msg);
}

class ForegroundTaskWorker implements TaskWorker {
	id: number;
	state: number;
	msgCb: (event: any) => void;
	errCb: (event: any) => void;
	// exec: SimulatorTaskExecutor;
	sim: Chess;
	constructor(){	
		this.sim = new Chess();
		// this.exec = new SimulatorTaskExecutor();
	}
	postMessage(taskDef: any): void {
		setTimeout(() => {
			console.log("Processing message:");
			console.log(taskDef);

			// TODO do this using a module reesporting all tasks
			let task: Task = null;
			switch (taskDef.processor) {
				case "WorkerTaskABHPP":
					task = new WorkerTaskABHPP(taskDef.data);
					break;
				case "WorkerTaskAB":
					task = new WorkerTaskAB(taskDef.params);
					 break;
			}

			if(task == null){
				this.errCb("No such task: " + taskDef.processor);
			} else {
				this.msgCb({
					data: { 
						id: taskDef.id, 
						data: task.process(this.sim)
					}
				});
			}
		}, 1);
	}
	addEventListener(ev: string, cb: (event: any) => void){
		if (ev == "message")
			this.msgCb = cb;
		if (ev == "error")
			this.errCb = cb;
	}

    terminate(): void {
        // TODO not implemented
    }
}



export class TaskWorkerPool {
	id: number;
	pool: TaskWorker[];
	foreground: boolean;

	runningTasks: PtMap;
	queue: ProcessingTask[];
	acceptTasks: boolean;
	taskCounter: number;

	constructor(threads: number, foreground = false){
		this.pool = [];
		this.queue = [];
		this.runningTasks = {};
		this.acceptTasks = true;
		this.foreground = foreground;
		this.taskCounter = 0;
		if(foreground){

			let __this = this;
			let taskWorker = new ForegroundTaskWorker();
			let idx = 0;
			taskWorker.id = idx;
			taskWorker.state = 0;
			taskWorker.addEventListener("message", (event) => {
				__this.resultReceived(idx, event.data);
				taskWorker.state = 0;
				__this.processQueue(idx);
			});
			taskWorker.addEventListener("error", (error) => {
				__this.errorReceived(idx, error);
				taskWorker.state = 0;
				__this.processQueue(idx);
			});
			this.pool.push(taskWorker);

		}else{
			let __this = this;

			// Import constructor. This only works because we happen to transpile to es5/commonjs.
			let TWC = require("worker-loader?name=taskworker.js!./TaskWorker");
			for (var i = 0; i < threads; i++){
				this.pool.push(this.createWorker(i));
			}
		}


		console.log("test");

	}

	private createWorker(idx: number): TaskWorker {
		let TWC = require("worker-loader?name=taskworker.js!./TaskWorker");
		//let taskWorker = WorkerFactory.create2();
		let taskWorker: TaskWorker = new TWC();

		taskWorker.id = idx;
		taskWorker.state = 0;
		taskWorker.addEventListener("message", (event) => {
			this.resultReceived(idx, event.data);
			taskWorker.state = 0;
			this.processQueue(idx);
		});
		taskWorker.addEventListener("error", (error) => {
			this.errorReceived(idx, error);
			taskWorker.state = 0;
			this.processQueue(idx);
		});
		return taskWorker;
	}

	private getTaskCounter(): number {
		this.taskCounter++;
		return this.taskCounter;
	}

	private getWorker(hint?: number): TaskWorker {
		if (typeof(hint) != "undefined" && this.pool[hint].state == 0) {
			return this.pool[hint];
		}else{
			for (let w of this.pool) {
				if (w.state == 0) {
					return w;
				}
			}
		}
		return null;
	}

	private processQueue(hint?: number) {
		if(this.queue.length > 0){
			let worker = this.getWorker(hint);
			if(worker != null){
				this.dispatchTask(this.queue.shift(), worker);
			}
		}
	}

	disable() {
		this.queue.length = 0;

        // Terminate working threads and create new one
		for(let i=0; i<this.pool.length; i++){
			let worker = this.pool[i];
			if(worker.state != 0){
				console.log("Terminating thread "+ i);
				//worker.terminate();
				//this.pool[i] = this.createWorker(i);
			}
		}

		this.runningTasks = {};
		this.acceptTasks = false;
	}

	enable(){
		this.acceptTasks = true;
	}

	// Compare to pt map and remove
	resultReceived(threadId: number, result: any) {
		workerLog(threadId, "Finished task: " + result.id);
		let pt = this.runningTasks[result.id];
		if(pt != null){
			pt.deferred.resolve(result);
			delete this.runningTasks[result.id];
		}
	}

	// Compare to pt map and remove
	errorReceived(threadId: number, error: any) {
		console.error(error);
	}


	enqueueTask(task: Task): Promise<any> {
		if(!this.acceptTasks){
			throw new Error("Pool is not accepting tasks");
		}
		task.id = this.getTaskCounter();
		let pt = ProcessingTask.getFor(task);
		this.queue.push(pt);
		// console.log("Queue size is: " + this.queue.length);
		this.processQueue();
		return pt.deferred.getPromise();
	}

	private dispatchTask(pt: ProcessingTask, worker: TaskWorker): void {
		workerLog(worker.id, "Executing task: " + pt.id);
        pt.workerId = worker.id;
		worker.postMessage(pt.task);
		worker.state = 1;
		this.runningTasks[pt.id] = pt;
	}


}



