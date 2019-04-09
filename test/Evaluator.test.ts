import { expect } from 'chai';

//import {Task} from "../src/WorkerTask";
//import {Node88} from "../src/GameTree";
import {Chess} from "chess.js";
import {evaluator} from "../src/MaterialEvaluator";
//import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "../src/score";


describe('evaluator', function() {
  it('missing queen', function() {

    let sim = new Chess();
    console.log(sim.fen());
    let fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1";
    console.log(sim.validate_fen(fen));
    let load = sim.load(fen);
    console.log("Load restult: "+load);
    
    let score = evaluator(sim);
    console.log("Missing queen: " + score.numeric);

    expect(score.numeric).lessThan(-8);
    
  }); 
});
