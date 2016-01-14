

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

}

interface Move {
	from: any;
	to: any;
	promotion: string;
}

