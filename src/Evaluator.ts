
import {Chess, Move88} from "chess.js";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

export class EvaluatorOptions{
	material = true
	castlingRights = true
	kingCenterInOpening = true
	doublePawns = true
	knightPositions = true
	rooksInOpenFiles = true
}

export class Gain{
	components: Array<[string, number]> = []
	push(name: string, value: number){
		this.components.push([name, value]);
	}
	get(name:string){
		return this.components.find(x => x[0] == name)[1];
	}
	sum(){
		return this.components.reduce((acc, val) => {
			acc[1] += val[1];
			return acc;
		}, ["val", 0])[1];
	}
	print(color: string = "?"){
		console.log(color+":");
		this.components.forEach(([key, val]) =>{
			console.log("\t" + key+ ": "+val)
		})
	}
}

export interface Gains {
	w: Gain
	b: Gain
}

export abstract class Evaluator {

	options: EvaluatorOptions
	constructor(options?: EvaluatorOptions){
		this.options = options ? options : new EvaluatorOptions();
	}

	// Given a simulator object, return the score
	abstract evaluate(sim: Chess, moves?: Move88[]): number;

	abstract gains(sim: Chess, moves?: Move88[]): Gains;
}
