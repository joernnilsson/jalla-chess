/// <reference path="xhr-promise-es6.d.ts" />

import XMLHttpRequestPromise from "xhr-promise-es6";
import {Deferred} from "./Deferred";

export interface DbMove{
	move: string;
	count: number;
}

export class ChessComClient {

	cookie: string;
	url: string;
	// defaultJarRequest: request.RequestAPI<request.TRequest, request.TOptions, request.RequiredUriUrl>;

	constructor(){
		this.url = "http://www.chess.com/explorer/";
	}

	private init(){
		}


	getMoves(fen: string): Promise<DbMove[]> {
		this.init();

		// let def = new Deferred<DbMove[]>();

		// var xhrPromise= new XMLHttpRequestPromise();
		// xhrPromise.send({
		// 	method: 'GET',
		// 	url: this.url
		// }).then((result: any) => {
		// 	console.log(result);
		// })

		// // Init
		// const defaultJarRequest = request.defaults({ jar: true });
		// defaultJarRequest.get(this.url);

		// defaultJarRequest.post(this.url, {}, (error: any, response: any, body: any) => {
		// 	console.log(body);
		// });

		// return def.getPromise();
		return null;
	}





}
