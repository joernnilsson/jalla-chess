
import {Task} from "../src/WorkerTask";
import {Node88} from "../src/GameTree";
import {default as Chess, Move88} from "chess.js";
import {evaluator} from "../src/MaterialEvaluator";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "../src/score";

import * as tsUnit from "tsunit.external/tsUnit"
import {MaterialEvaluatorTest} from "./MaterialEvaluatorTest";

//import * as readline from "readline";


// Instantiate tsUnit and pass in modules that contain tests
var test = new tsUnit.Test(MaterialEvaluatorTest);

// Run the tests
var result = test.run();

console.log(result);

// Show the test results (TAP output)
console.log(result.getTapResults());

// Show the test results (Your own custom version)
console.log('Errors: ' + result.errors.length);

// Pause the console (the human version... not needed for automation)
//var rl = readline.createInterface({
//    input: process.stdin,
//    output: process.stdout
//});
//
//rl.question("Press any key to continue...", () => {
//    rl.close();
//});