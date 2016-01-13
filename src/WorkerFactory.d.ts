
import {WorkerTask, WorkerResult} from "./WorkerTask";

export interface TaskWorker {

	id: number;
	state: number;
	postMessage(message: WorkerTask): void;
	addEventListener(ev: string, cb: (event: any) => void);

}

export class WorkerFactory {
	static create(): TaskWorker;
}
