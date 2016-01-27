"use strict"

var create = function(){

	var Prot = require("worker!./jsworker.js");
	var worker = new Prot();
	return worker;

}

var create2 = function(){

	var Prot = require("worker!./taskjsworker.js");
	var worker = new Prot();
	return worker;

}

module.exports = {
	WorkerFactory: {
		create,
		create2
	}
}

