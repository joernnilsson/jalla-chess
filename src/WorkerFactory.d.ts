
// import {WorkerTask, WorkerResult} from "./WorkerTask";

export interface TaskWorker {

	id: number;
	state: number;
	postMessage(message: any): void;
	addEventListener(ev: string, cb: (event: any) => void);

}

export class WorkerFactory {
	static create(): TaskWorker;
	static create2(): TaskWorker;
}


