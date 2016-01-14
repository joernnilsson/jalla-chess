"use strict"

var create = function(){

	var Prot = require("worker!./jsworker.js");
	var worker = new Prot();
	return worker;

}

module.exports = {
	WorkerFactory: {
		create
	}
}

