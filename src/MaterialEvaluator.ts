"use strict"


import {Chess, Move88} from "chess.js";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";
import {Evaluator, EvaluatorOptions, Gain, Gains} from './Evaluator';

/*
Optimization ideas:
- Dont test for draw or win, may be implicit when moves.length = 0.

Evaluation ideas:
* Knights in the center during opening
* Knights not on the edge
* Double pawns
- Isolated pawns
- King zone attacks
* Rooks in open files
- Bishops in long diagonals
- Number of squares a piece can move to
- Rooks, bishops and queens pointing towards the king
- King protection
* King to the side during opening
- Active king in endgame
* Castling rights
- Connected rooks
- Passed pawns
- Pieces developed
- Pawn advancement
* Center attacks

*/

let RANK_1 = 7;
let RANK_2 = 6;
let RANK_3 = 5;
let RANK_4 = 4;
let RANK_5 = 3;
let RANK_6 = 2;
let RANK_7 = 1;
let RANK_8 = 0;

let FILE_A = 0;
let FILE_B = 1;
let FILE_C = 2;
let FILE_D = 3;
let FILE_E = 4;
let FILE_F = 5;
let FILE_G = 6;
let FILE_H = 7;

let colors = ['w', 'b'];
let files = [FILE_A, FILE_B, FILE_C, FILE_D, FILE_E, FILE_F, FILE_G, FILE_H];
let ranks = [RANK_1, RANK_2, RANK_3, RANK_4, RANK_5, RANK_6, RANK_7, RANK_8];

export let Criteria = {
	material: "material",
	kingCenterInOpening: "kingCenterInOpening",
	castlingRights: "castlingRights",
	doublePawns: "doublePawns",
	rooksInOpenFiles: "rooksInOpenFiles",
	knightPositions: "knightPositions",
	knightOnEdge: "knightOnEdge",
	centerAttacks: "centerAttacks"
	//passedPawn: "passedPawn",
	//isolatedPawn: "isolatedPawn"
}

export interface EvaluatorParameters {
	centerAttackGain?: number;
}

const ParametersDefaults: EvaluatorParameters = {
	centerAttackGain: 0.05
}

export class MaterialEvaluator extends Evaluator{

	parameters: EvaluatorParameters;

	constructor(parameters?: EvaluatorParameters){
		super();
		this.parameters = {...ParametersDefaults, ...parameters};
	}

	evaluate(sim: Chess, moves?: Move88[]): number{
		let gains = this.gains(sim, moves);

		let sw = gains.w.sum();
		let sb = gains.b.sum();

		return sw - sb;// */ + ((Math.random() - 0.5) / 100000.0));
	}

	gains(sim: Chess, moves?: Move88[]): Gains {
		if(typeof(self) != "undefined") self["p_evaluate"]++;

		let gains = {
			w: new Gain,
			b: new Gain
		}


		let turn = sim.turn();
		moves = moves || sim.generate_moves();
	
		if(moves.length == 0){
			// Game over
			if (sim.in_draw()) {
				return gains;
			} else if (sim.in_checkmate()) {
				gains[turn == "w" ? "b" : "w"].push("won",turn == 'w' ? 1e6 : -1e6);
				return gains;
			}
		}
	
	
		let board = sim.get_board();
	
		// Count material
		let mw = 0;
		let mb = 0;
	
	
		let val = (c) => {
			c = c.toLowerCase();
			switch (c) {
				case 'p': return 1;
				case 'b': return 3;
				case 'n': return 3;
				case 'r': return 5;
				case 'q': return 9;
				case 'k': return 0; //?
			}
			return 0;
		};
	
		for (let i = 0; i <= 119; i++) {
			if (board[i] == null) {
				continue;
			} else {
				var color = board[i].color;
				var piece = board[i].type;
				let value = val(board[i].type);
				if (color == "w") mw += value;
				else mb += value;
			}
	
			if ((i + 1) & 0x88) {
				// Should this be 7?
				i += 8;
			}
		}
	
		// Material gains
		if(this.options.material){
			gains.w.push(Criteria.material, mw);
			gains.b.push(Criteria.material, mb);
		}



		// Shared properties
		let materialMax = 39;
		let endgameStartsAt = 26;
		let material = {
			w: mw,
			b: mb
		}
		let ul = sim.underlaying();
		let centerSquares = [ul.SQUARES.d4, ul.SQUARES.d5, ul.SQUARES.e4, ul.SQUARES.e5];


		// Evaluate king position
		// Use material number to determine if we're in opening, midgame, endgame
		let kingInCenterPenalty = 0.2;
		let kingPenalty = (file, m) => {
			// TODO file == 5 can be removed when "possible moves for rook" is implemented (locking rook in vs castling)
			if(file == 3 || file == 4 || file == 5){
				let x = (materialMax - m);
				return Math.max(0, kingInCenterPenalty - x * kingInCenterPenalty/(materialMax - endgameStartsAt));
			} else {
				return 0;
			}
		}
	
		if(this.options.kingCenterInOpening){
			gains.w.push(Criteria.kingCenterInOpening, -kingPenalty((sim.file(sim.underlaying().kings.w)), mw));
			gains.b.push(Criteria.kingCenterInOpening, -kingPenalty((sim.file(sim.underlaying().kings.b)), mb));
		}




		// Castling rights
		// Penalty for losing castling rights, less than king in center
		let castlingpenalty = kingInCenterPenalty/2.0;

		if(this.options.castlingRights){
			gains.w.push(Criteria.castlingRights, -(sim.underlaying().castling.w == "" ? castlingpenalty : 0));
			gains.b.push(Criteria.castlingRights, -(sim.underlaying().castling.b == "" ? castlingpenalty : 0));
		}

		// Double pawns
		let doublePawnPenalty = 0.2;
		let pawnMap = {
			w: [0,0,0,0,0,0,0,0],
			b: [0,0,0,0,0,0,0,0]
		};

		// Knight positions
		let knightInCenterGainFactor = 0.2;
		let knightInCenterGain = (m) => {
			let x = (materialMax - m);
			return Math.max(0, knightInCenterGainFactor - x * knightInCenterGainFactor/(materialMax - endgameStartsAt));
		}
		let knightInCenter = {
			w: 0,
			b: 0
		}

		let knightOnEdgePenalty = 0.05
		let knightOnEdge = {
			w: 0,
			b: 0
		}
	
		let centerAttacks = {
			w: 0,
			b: 0
		}

		// Rooks in open files
		let rookMap = {
			w: [0,0,0,0,0,0,0,0],
			b: [0,0,0,0,0,0,0,0]
		};

		// Loop over board
		for (let i = 0; i <= 119; i++) {
			if (board[i] == null) {
				continue;
			} else {
	
				var color = board[i].color;
				var piece = board[i];
				var file = sim.file(i);
				var rank = sim.rank(i);
	
				switch (piece.type) {
					case 'p':
						// Map double pawns
						pawnMap[color][file]++;


						break;
	
					case 'n':
						// Knights in the center
						if((rank == RANK_4 || rank == RANK_5) && (file > 1 && file < 6)){
							knightInCenter[color] += knightInCenterGain(material[color]);
						}
						if(file == FILE_A || file == FILE_H){
							knightOnEdge[color] -= knightOnEdgePenalty;
						}
						break;
	
					case 'r':
						rookMap[color][rank]++;
						break;


						
					}

				// Is current piece attacking any interesting squares?
				for (let square of centerSquares){
					// Attacked copy code
					var difference = i - square;
					var index = difference + 119;
					if (ul.ATTACKS[index] & (1 << ul.SHIFTS[piece.type])) {
						if (piece.type === ul.PAWN) {
							if (difference > 0) {
								if (piece.color === ul.WHITE){
									centerAttacks[color] += this.parameters.centerAttackGain;
								}
							} else {
								if (piece.color === ul.BLACK){
									centerAttacks[color] += this.parameters.centerAttackGain;
								}
							}
							continue;
						}
		
						/* if the piece is a knight or a king */
						if (piece.type === 'n' || piece.type === 'k'){
							centerAttacks[color] += this.parameters.centerAttackGain;
							continue;
						}
		
						var offset = ul.RAYS[index];
						var j = i + offset;
		
						var blocked = false;
						while (j !== square) {
							if (board[j] != null) { blocked = true; break; }
							j += offset;
						}

						if (!blocked){
							centerAttacks[color] += this.parameters.centerAttackGain;
						}
					}
				
				}


			}
	


			if ((i + 1) & 0x88) {
				// Should this be 7?
				i += 8;
			}
		}
		let wDoublePanPenalty = 0;
		let bDoublePanPenalty = 0;
		for(let i = 0; i<8; i++){
			wDoublePanPenalty += Math.max(0, pawnMap.w[i] - 1)*doublePawnPenalty;
			bDoublePanPenalty += Math.max(0, pawnMap.b[i] - 1)*doublePawnPenalty;
		}

		if(this.options.doublePawns){
			gains.w.push(Criteria.doublePawns, -wDoublePanPenalty);
			gains.b.push(Criteria.doublePawns, -bDoublePanPenalty);
		}

		// Rooks in open files
		let rookInOpenFileGains = {
			w: 0,
			b: 0
		}
		let rookInOpenFileGain = 0.1;
		colors.forEach(c => files.forEach(f =>{
			if(pawnMap[c][f] == 0 && rookMap[c][f]){
				rookInOpenFileGains[c] += rookInOpenFileGain;
			}
		}));

		if(this.options.rooksInOpenFiles){
			colors.forEach(c => gains[c].push(Criteria.rooksInOpenFiles, rookInOpenFileGains[c]));
		}


		// Knight position in opening
		if(this.options.knightPositions){
			colors.forEach(c => gains[c].push(Criteria.knightPositions, knightInCenter[c]));
		}

		colors.forEach(c => gains[c].push(Criteria.knightOnEdge, knightOnEdge[c]));
		colors.forEach(c => gains[c].push(Criteria.centerAttacks, centerAttacks[c]));

		return gains;

	}

}

// Should not modify sim
export function evaluator(sim: Chess, moves?: Move88[]): Score {
	let e = new MaterialEvaluator();
	let num = e.evaluate(sim, moves);
	return new NumericScore(num);
};

