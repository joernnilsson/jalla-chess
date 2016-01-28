
import * as tsUnit from "tsunit.external/tsUnit";

import {Task} from "../src/WorkerTask";
import {Node88} from "../src/GameTree";
import {default as Chess, Move88} from "chess.js";
import {evaluator} from "../src/MaterialEvaluator";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "../src/score";

export class MaterialEvaluatorTest extends tsUnit.TestClass {


    queenMissing_minus12() {

        //let sim = new Chess();
        //sim.load("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq -");
        //let score = evaluator(sim);
        //console.log("missing queen: " + score);

    }


}
