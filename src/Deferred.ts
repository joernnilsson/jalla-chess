"use strict"


import {Promise} from 'es6-promise';

export class Deferred<T> {
	private _resolve: (str: T) => void;
	private _reject: (str: string) => void;
	private promise: Promise<T>;

	public getPromise(): Promise<T> {
		return this.promise;
	}

	public resolve(str: T): void {
		this._resolve(str);
	}
	public reject(str: string): void {
		this.reject(str);
	}

	constructor() {
		let that = this;
		this.promise = new Promise(
			(resolve: (str: T) => void, reject: (str: string) => void) => {
				that._resolve = resolve;
				that._reject = reject;
			}
		);

	}
}