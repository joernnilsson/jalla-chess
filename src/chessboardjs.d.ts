declare module "chessboardjs" {

	// interface Config {
	// 	position: String;
	// 	orientation?: String;
	// 	showNotation?: boolean;
	// 	draggable?: boolean;
	// 	dropOffBoard?: String;
	// 	pieceTheme?: String;
	// 	snapbackSpeed?: number;
	// 	snapSpeed?: number;
 //  		sparePieces?: boolean;

	// }
	class ChessBoard {
		// constructor(selector: String, config: Config)

		constructor(selector: String)
		constructor(selector: String, config: any)

		move(moves: string): any
		position(pos: any): void;
	}

	export = ChessBoard;
}