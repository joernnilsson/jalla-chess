"use strict"

var create = function(){

	var Prot = require("worker?name=worker1-[hash].js!./jsworker.js");
	var worker = new Prot();
	return worker;

}

var create2 = function(){

	var Prot = require("worker?name=worker2-[hash].js!./taskjsworker.js");
	var worker = new Prot();
	return worker;

}

module.exports = {
	WorkerFactory: {
		create,
		create2
	}
}

