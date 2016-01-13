/// <reference path="../node_modules/typescript/lib/lib.webworker.d.ts" />

self.onmessage = (event) => {
	console.log("A");
	postMessage("F");
};