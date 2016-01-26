"use strict"

// Haven't found a good way to compile ts workers through the ts loader

var score = require('./score');
// var api = require('./WorkerTask');

var Chess = require("chess.js");
var gametree =  require("./GameTree");
var evaluator = require("./MaterialEvaluator");
var executor = require("./TaskExecutor");
var api = require("./WorkerTask");
import {WorkerTaskABHPP} from "./WorkerTaskABHPP";
import {WorkerTaskAB} from "./WorkerTaskAB";

var sim = new Chess();
var window = [];

// TODO do worker.process async, so we can receive abort messages

self.onmessage = function(event) {

	var taskDef = event.data;

	console.log("Processing message:");
	console.log(taskDef);

	// TODO do this using a module reesporting all tasks
	var task = null;
	switch (taskDef.processor) {
		case "WorkerTaskABHPP":
			task = new WorkerTaskABHPP(taskDef.data);
			break;
		case "WorkerTaskAB":
			task = new WorkerTaskAB(taskDef.params);
			 break;
	}

	if(task == null){
		postError("No such task: " + taskDef.processor);
	} else {
		postMessage( { 
				id: taskDef.id, 
				data: task.process(sim)
			});
	}

};


