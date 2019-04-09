
import {Chess} from "chess.js";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

export abstract class Evaluator {

	// Given a simulator object, return the score
	abstract evaluate(sim: Chess): Score;
}
