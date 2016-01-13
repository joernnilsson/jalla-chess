"use strict"

// Haven't found a good way to compile ts workers through the ts loader

var score = require('./score');
// var api = require('./WorkerTask');

var Chess = require("chess.js");
var gametree =  require("./GameTree");
var evaluator = require("./MaterialEvaluator");
var executor = require("./TaskExecutor");
var api = require("./WorkerTask");

var exec = new executor.SimulatorTaskExecutor();

self.onmessage = function(event) {
	// console.log(event.data);
	var node  = gametree.Node.create(event.data.fen, null, null);
	node = exec.evaluateChildrenSync(node);

	postMessage(new api.WorkerResult(event.data.id, node));
};


