/// <reference path="WorkerFactory.d.ts" />
"use strict"

import {WorkerTask, WorkerResult} from "./WorkerTask";
import {WorkerFactory, TaskWorker} from "./WorkerFactory";
import {SimulatorTaskExecutor} from "./TaskExecutor";
import {Node} from "./GameTree";
// import {Promise} from 'es6-promise';
import {Deferred} from "./Deferred";



// TODO I think this is a hack
// declare var require: any;

class ProcessingTask {
	id: number;
	deferred: Deferred<Node>;
	task: WorkerTask
	static getFor(task: WorkerTask): ProcessingTask{
		let pt = new ProcessingTask();
		pt.id = task.id;
		pt.deferred = new Deferred<Node>();
		pt.task = task;
		return pt;
	}
}

interface PtMap {
	[key: number]: ProcessingTask;
}

function workerLog(worker: number, msg: string){
	// console.log("[" + worker + "] " + msg);
}

class ForegroundTaskWorker implements TaskWorker {
	id: number;
	state: number;
	msgCb: (event: any) => void;
	errCb: (event: any) => void;
	exec: SimulatorTaskExecutor;
	constructor(){	
		this.exec = new SimulatorTaskExecutor();
	}
	postMessage(task: WorkerTask): void {
		setTimeout(() => {
			var node = Node.create(task.fen, null, null, null);
			node = this.exec.evaluateChildrenSync(node);
			this.msgCb({ data: new WorkerResult(task.id, node) });
		}, 1);
	}
	addEventListener(ev: string, cb: (event: any) => void){
		if (ev == "message")
			this.msgCb = cb;
		if (ev == "error")
			this.errCb = cb;
	}
	terminate():void{
		console.log("Cannot terminate main thread");
	}
}

function foreground(task: WorkerTask){

}

export class WorkerPool {
	id: number;
	pool: TaskWorker[];
	foreground: boolean;

	runningTasks: PtMap;
	queue: ProcessingTask[];
	acceptTasks: boolean;

	constructor(threads: number, foreground = false){
		this.pool = [];
		this.queue = [];
		this.runningTasks = {};
		this.acceptTasks = true;
		this.foreground = foreground;
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
			for (var i = 0; i < threads; i++){
				// Block scope hack. Should switch to es6 asap.
				((idx: number) => {
					let taskWorker = WorkerFactory.create();
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
						__this.pool.push(taskWorker);
				})(i);

			}
		}


		console.log("test");

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
		this.runningTasks = {};
		this.acceptTasks = false;
	}

	enable(){
		this.acceptTasks = true;
	}

	// Compare to pt map and remove
	// TODO Convert to an actual node
	resultReceived(threadId: number, result: WorkerResult) {
		workerLog(threadId, "Finished task: " + result.id);
		let pt = this.runningTasks[result.id];
		if(pt != null){
			pt.deferred.resolve(result.node);
			delete this.runningTasks[result.id];
		}
	}

	// Compare to pt map and remove
	errorReceived(threadId: number, error: any) {
		console.error(error);
	}


	enqueueTask(task: WorkerTask): Promise<Node> {
		if(!this.acceptTasks){
			// return Promise.reject(new Error("Pool is not accepting tasks"));
			throw new Error("Pool is not accepting tasks");
		}
		let pt = ProcessingTask.getFor(task);
		this.queue.push(pt);
		// console.log("Queue size is: " + this.queue.length);
		this.processQueue();
		return pt.deferred.getPromise();
	}

	private dispatchTask(pt: ProcessingTask, worker: TaskWorker): void {
		workerLog(worker.id, "Executing task: " + pt.id);
		worker.postMessage(pt.task);
		worker.state = 1;
		this.runningTasks[pt.id] = pt;
	}


}



