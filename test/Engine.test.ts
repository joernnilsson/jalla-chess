import { expect } from 'chai';

import {Chess} from "chess.js";
import {EvaluatorOptions} from "../src/Evaluator";
import {MaterialEvaluator, Criteria} from "../src/MaterialEvaluator";
import {TaskAB, AbMasterResult} from "../src/TaskAB";
import {Node88} from "../src/GameTree";

function getSim(fen?: string){
  let sim = new Chess();
  if(fen){
    let valid = sim.validate_fen(fen);
    if(!valid)
      throw new Error("invalid fen: "+fen);
    sim.load(fen);
  }
  return sim;
}

function resultCb(res: AbMasterResult){}

function getSanLine(root: Node88, pgn: string = ""): Array<string>{

    let sim = getSim(root.fen);
    let path = pgn.split(" ");
    if(path.length == 1 && !path[0].length)
        path = []; 

    // Assume sorted
    let dig = (d_sim, d_node, d_path) => {
        let pt = d_path.shift();
        if(!d_node.children)
            return []
        for(let c of d_node.children){
            if (!c.moveTo)
                return [];
            let san = d_sim.move_to_san(c.moveTo);
            if(!pt || san == pt){
                sim.make_move(c.moveTo);
                let out = dig(d_sim, c, d_path);
                sim.undo_move();
                return [san+"("+(c.score?c.score.toFixed(2):"_")+")", ...out];
            }
        }
    }
    
    return dig(sim, root, path).join(" ");

}

function getEval(root: Node88, pgn: string = ""): Array<string>{

    console.log("Eval: "+pgn);

    let sim = getSim(root.fen);
    let path = pgn.split(" ");
    if(path.length == 1 && !path[0].length)
        path = []; 

    for(let m of path){
        sim.move(m);
    }

    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);
    
    gains.w.print("w");
    gains.b.print("b");
    console.log(gains.w.sum() - gains.b.sum());
    
    return;

}

let EPS = 0.0001;

describe('engine', function() {
  it('shou__ld not sacrifice knight in corener case', function() {

    let fen = "8/p5K1/1p6/8/1nk4Q/6P1/8/8 b - - 1 54";
    let sim = getSim();
    let root = new Node88(fen, null, null);
    let task = new TaskAB(root, sim, 5, resultCb);

    task.iterativeDeepening();

    console.log(getSanLine(root, "Kd5"));
    console.log(getSanLine(root, "Kd5 Qxb4"))
    console.log(getSanLine(root, "Kd3"));
    console.log(getSanLine(root, "Kd3 Qxb4"));
    console.log(getSanLine(root, "Kc5"));

    getEval(root, "Kd5 Qxb4");
    getEval(root, "Kc5 Kf6");
  });
  

it('should not sacrifice knight in corener case', function() {

    let fen = "8/p5K1/1p6/8/1nk4Q/6P1/8/8 b - - 1 54";
    let sim = getSim();
    let root = new Node88(fen, null, null);
    let task = new TaskAB(root, sim, 5, resultCb);

    let score = task.alphaBeta(sim, root, 5, -1e9, 1e9, false);

    console.log(root);

    console.log("score: "+score);
    
});

  // Why did it move away from knight? "8/p5K1/1p6/8/1nk4Q/6P1/8/8 b - - 1 54"
  // 4k2r/6R1/1P2pp1p/8/K3p3/P3P3/5r1P/2R5 w k - 0 31" => b7, ser ikke matt

});
