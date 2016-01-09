
declare module "chess.js" {

	class Chess{

		in_checkmate(): boolean;
		in_draw(): boolean;



		move(move: Move): any;
		move(move: string): any;
		fen(): any;
		load(fen: string);
		moves(): string[];
		turn(): string;

	}

	interface Move {
		from: any;
		to: any;
		promotion: string;
	}

	export = Chess;

}

