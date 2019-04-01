

export interface Move88{
	color: string;
	flags: number;
	from: number;
	to: number;
	piece: string;
	captured: string;
}

export default class Chess{

	in_checkmate(): boolean;
	in_draw(): boolean;



	move(move: Move): any;
	move(move: string): any;
	fen(): any;
	load(fen: string);
	load_pgn(pgn: string, options?: any);
	moves(): string[];
	turn(): string;

	// Extended hp version
	validate_fen(fen: string): any;
	generate_moves(opts?: any): Move88[];
	make_move(move: Move88): void;
	make_pretty(move: Move88): string;
	move_to_san(move: Move88): string;
	undo_move(): void;
	get_board(): any[];
	get_88(square: number): any;
	algebraic(square: number): string;
	attacked(color: string, square): boolean;
	king_attacked(color: string): boolean;

	underlaying():any;
	rank(s: number): number;
	file(s: number): number;

}

interface Move {
	from: any;
	to: any;
	promotion: string;
}

