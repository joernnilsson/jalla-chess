import { expect } from 'chai';

import {Chess} from "chess.js";
import {EvaluatorOptions} from "../src/Evaluator";
import {MaterialEvaluator, Criteria, } from "../src/MaterialEvaluator";

function getSim(fen: string){
  let sim = new Chess();
  let valid = sim.validate_fen(fen);
  if(!valid)
    throw new Error("invalid fen: "+fen);
  sim.load(fen);
  return sim;
}

let EPS = 0.0001;

describe('evaluator', function() {
  it('should detect missing white queen', function() {

    let sim = getSim("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);
    expect(gains.w.get("material")).equals(30);
    
  });
  
  it('should detect missing black queen', function() {

    let sim = getSim("rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);
    expect(gains.b.get("material")).equals(30);
    
  });

  it('shoud reward rooks in open files', function() {

    let sim = getSim("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPP1/RNBQKBNR w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);
    expect(gains.w.get("rooksInOpenFiles")).greaterThan(0.05);
    
  });

  it('shoud reward knights in center during opening', function() {

    let sim = getSim("rnbqkbnr/pppppppp/8/8/4N3/8/PPPPPPPP/RNBQKB1R w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);
    expect(gains.w.get("knightPositions")).greaterThan(0.15);
    
  });

  it('shoud not reward knights in center during endgame', function() {

    let sim = getSim("4k3/3pp3/8/8/4N3/8/3PP3/4K3 w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);
    expect(gains.w.get("knightPositions")).lessThan(0.05);
    
  });
  
  it('shoud give penalty for double pawns', function() {

    let sim = getSim("rnbqkbnr/pppppppp/8/8/8/3P4/PPPP1PPP/RNBQKBNR w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);
    expect(gains.w.get("doublePawns")).lessThan(-0.1);
    
  });
  
  it('shoud give penalty for having king in center in opening', function() {

    let sim = getSim("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);
    expect(gains.w.get(Criteria.kingCenterInOpening)).lessThan(-0.15);
    
  });

  it('shoud not give penalty for having king in center in endgame', function() {

    let sim = getSim("4k3/3pp3/8/8/4N3/8/3PP3/4K3 w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);
    expect(gains.w.get(Criteria.kingCenterInOpening)).equal(0);
    
  });

  it('shoud give penalty for losing castling rights', function() {

    let sim = getSim("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w kq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);
    expect(gains.w.get(Criteria.castlingRights)).lessThan(-0.05);
    
  });

  it('shoud castle', function() {

    let simBefore = getSim("rnbqk2r/pppppppp/4b3/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    let simAfter = getSim("rnbq1rk1/pppppppp/4b3/8/8/8/PPPPPPPP/RNBQKBNR w KQ - 0 1");
    let evaluator = new MaterialEvaluator();
    let gainsBefore = evaluator.gains(simBefore);
    let gainsAfter = evaluator.gains(simAfter);

    //gainsBefore.b.print();
    //gainsAfter.b.print();

    expect(gainsBefore.b.sum()).lessThan(gainsAfter.b.sum() - 0.001)
    
  });

  it('shoud castle instead of moving king', function() {

    let simKf = getSim("rnbq1k1r/pppppppp/4b3/8/8/P7/1PPPPPPP/RNBQKBNR w KQ - 1 2");
    let simOO = getSim("rnbq1rk1/pppppppp/4b3/8/8/P7/1PPPPPPP/RNBQKBNR w KQ - 1 2");
    let evaluator = new MaterialEvaluator();
    let gainsKf = evaluator.gains(simKf);
    let gainsOO = evaluator.gains(simOO);

    expect(gainsKf.b.sum()).lessThan(gainsOO.b.sum() - 0.001)
    
  });
  
  it('shoud give penalty for having knight on an edge', function() {

    let sim = getSim("rnbqkbnr/pppppppp/8/8/8/7N/PPPPPPPP/RNBQKB1R w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);
    expect(gains.w.get(Criteria.knightOnEdge)).lessThan(-0.04);
    
  });

  it('shoud not reward no attacks in center', function() {

    let sim = getSim("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);

    expect(gains.w.get(Criteria.centerAttacks)).to.be.closeTo(0, EPS);
    
  });

  it('shoud reward pawn attack in center', function() {

    let sim = getSim("rnbqkbnr/pppppppp/8/8/8/3P4/PPP1PPPP/RNBQKBNR w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);

    expect(gains.w.get(Criteria.centerAttacks)).to.be.closeTo(1*evaluator.parameters.centerAttackGain, EPS);
    
  });
  
  it('shoud reward 2 pawn attacks in center', function() {

    let sim = getSim("rnbqkbnr/pppppppp/8/8/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);

    expect(gains.w.get(Criteria.centerAttacks)).to.be.closeTo(2*evaluator.parameters.centerAttackGain, EPS);
    
  });

  it('shoud reward bishop attack in center', function() {

    let sim = getSim("rnbqkbnr/pppppppp/8/8/8/5B2/PPPPPPPP/RNBQK1NR w KQkq - 0 1");
    let evaluator = new MaterialEvaluator();
    let gains = evaluator.gains(sim);

    expect(gains.w.get(Criteria.centerAttacks)).to.be.closeTo(2*evaluator.parameters.centerAttackGain, EPS);
    
  });

});
