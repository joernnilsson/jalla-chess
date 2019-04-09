
/*import * as tsUnit from "../node_modules/tsunit.external/tsUnit";

import {Task} from "../src/WorkerTask";
import {Node88} from "../src/GameTree";
import {default as Chess, Move88} from "chess.js";
import {evaluator} from "../src/MaterialEvaluator";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "../src/score";

export class MaterialEvaluatorTest extends tsUnit.TestClass {


    queenMissing() {

        let sim = new Chess();
        console.log(sim.fen());
        let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1";
        console.log(sim.validate_fen(fen));
        let load = sim.load(fen);
        console.log("Load restult: "+load);
        let score = evaluator(sim);
        console.log("Missing queen: " + score.numeric);


    }


}
*/