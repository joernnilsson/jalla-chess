

export interface move88{
	color: string;
	flags: number;
	from: number;
	piece: string;
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
	generate_moves(): move88[];
	make_move(move: move88);

}

interface Move {
	from: any;
	to: any;
	promotion: string;
}

