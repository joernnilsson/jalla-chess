"use strict";

// TODO Switch to an ansyncrounous model
import {Evaluator} from "./Evaluator";

export abstract class Engine <T extends Evaluator> {

	abstract getBestMove(fen: string): Promise<string>;

}
