/// <reference path="d3.d.ts" />
"use strict";

import Chess from "chess.js";
import * as d3 from "d3";
// import * as format from "string-format";

import {Deferred} from "./Deferred";
import {WorkerTask, WorkerResult} from "./WorkerTask";
import {Score, DrawScore, MateInScore, NumericScore, WonScore} from "./score";

import {SimulatorTaskExecutor} from "./TaskExecutor";
import {evaluator} from "./MaterialEvaluator";
import {Node} from "./GameTree";
import {WorkerPool} from "./WorkerPool";
import {Engine} from "./engine";
import {Evaluator} from "./Evaluator";



import * as jquery from "jquery";

declare var $: any;

interface Move {
	from: any;
	to: any;
	promotion: string;
}

class TreeNode {
	moveTo: string;
	fen: string;
	score: Score;
	bestMove: TreeNode;
	children: TreeNode[];

	getBestScore(): Score {
		if(this.bestMove != null){
			return this.bestMove.score;
		}else{
			return this.score;
		}
	}


	static createPrev(fen: string, prevMove: string, score: Score): TreeNode {
		let node = new TreeNode();
		node.moveTo = prevMove;
		node.fen = fen;
		node.score = score;
		return node;
	}

	static compare(a: TreeNode, b: TreeNode): number {
		return Score.compare(a.score, b.score);
	}

	static compareBest(a: TreeNode, b: TreeNode): number {
		return Score.compare(a.getBestScore(), b.getBestScore());
	}
}



export class MaterialEngine<T extends Evaluator> extends Engine<T> {

	tree: TreeNode;
	simulator: Chess;
	pool: WorkerPool;

	constructor(){
		super();
		this.simulator = new Chess();
		// this.pool = new WorkerPool(1, true);
		this.pool = new WorkerPool(8, false);
	}

	sim(fen: string){
		let sims = this.simulator;
		sims.load(fen);
		return sims;
	}


	recursiveEvaluate(node: TreeNode, depth: number): void{
		
		node.score = this.evaluate(node.fen);
		if(depth <= 1){
			return;
		}

		let sim = this.sim(node.fen);
		let turn = sim.turn();
		node.children = [];
		let bestNodes: TreeNode[] = [];


		for (let m of sim.moves()) {
			sim.load(node.fen);
			sim.move(m);
			let c = TreeNode.createPrev(sim.fen(), m, null);
			this.recursiveEvaluate(c, depth - 1);

			node.children.push(c);

			if (bestNodes.length == 0) {
				bestNodes.push(c);
			}else if(TreeNode.compareBest(c, bestNodes[0]) == 0){
				bestNodes.push(c);
			} else if((turn == 'w' && TreeNode.compareBest(c, bestNodes[0]) > 0)
				||   (turn == 'b' && TreeNode.compareBest(bestNodes[0], c) > 0)){
				bestNodes = [];
				bestNodes.push(c);
			}
			
			//console.log(m + " " + c.score.getComparableScore());

		}

		node.bestMove = bestNodes[Math.floor(Math.random() * bestNodes.length)];

	}

	// Quick fen to turn, without simulator
	fenToTurn(fen: string): string {
		return fen.split(" ")[1];
	}

	alphaBeta(node: Node, depth: number, alpha: number, beta: number, maximizingPlayer: boolean): number{
		if(depth == 0 /*|| game over */){
			return evaluator(this.sim(node.fen)).numeric;
		}

		// Create child nodes
		let sim = this.sim(node.fen);
		let moves = sim.moves();
		let turn = sim.turn();
		node.children = moves.map((m: string): Node => {
			sim.load(node.fen);
			sim.move(m);
			let c = Node.create(sim.fen(), m, null, node);
			return c;
		});

		// Generate line
		let line = (n: Node): string => {
			if (n.moveTo)
				return line(n.parent) + " " + n.moveTo;
			return "... ";
		}

		// collect equal scores and choose randomly
		if(maximizingPlayer){
			// v: best so far
			let v = -1e6;
			for (let child of node.children){
				let childScore = this.alphaBeta(child, depth - 1, alpha, beta, false);
				// v = Math.max(v, childScore);
				if(childScore > v){
					v = childScore;
					node.bestMove = { move: child, score: new NumericScore(childScore) };
				}
				alpha = Math.max(alpha, v);
				if(beta <= alpha){
					console.log("A: Cutting off at move: " + line(child) + ", depth:" + depth + " v: "+v);
					break; /* cut off */
				}
			}
			// Did not cut off
			return v;
		}else{
			let v = 1e6;
			for (let child of node.children) {
				// v = Math.min(v, this.alphaBeta(child, depth - 1, alpha, beta, true));
				let childScore = this.alphaBeta(child, depth - 1, alpha, beta, true);
				if (childScore < v) {
					v = childScore;
					node.bestMove = { move: child, score: new NumericScore(childScore) };
				}
				beta = Math.min(beta, v);
				if(beta <= alpha){
					console.log("B: Cutting off at move: " + line(child) + ", depth:" + depth + " v:"+v);
					break; /* cut off */
				}
			}
			return v;
		}

	}

		// Generate line
	line(n: Node): string {

		if(n.bestMove){
			return n.moveTo + " " + this.line(n.bestMove.move);
		}else{
			return n.moveTo;
		}
	}

	findBestMoveAlphaBeta(fen: string, timeToThink: number): Promise<string> {
		let deferred = new Deferred<string>();

		let node = Node.create(fen, null, null, null);
		let bestScore = this.alphaBeta(node, 4, -1e6, 1e6, true);
		console.log("Best score: "+bestScore);
		console.log("Line: " + this.line(node.bestMove.move));

		deferred.resolve(node.bestMove.move.moveTo);

		return deferred.getPromise();
	}

	getBestMove(fen: string): Promise<string> {
		return this.findBestMoveParallel(fen, 3000);
	}

	findBestMoveParallel(fen: string, timeToThink: number): Promise<string>{
		let engine = this;
		let deferred = new Deferred<string>();
		let keepRunning = true;

		// Reset thread pool
		engine.pool.disable();
		engine.pool.enable();


		let bestMove = (node: Node): Node => {
			let turn = engine.fenToTurn(node.fen);
			let bestNodes: Node[] = [];

			for (let c of node.children) {
				if (bestNodes.length == 0) {
					bestNodes.push(c);
				} else if (Node.compareBest(c, bestNodes[0]) == 0) {
					bestNodes.push(c);
				} else if ((turn == 'w' && Node.compareBest(c, bestNodes[0]) > 0)
					|| (turn == 'b' && Node.compareBest(bestNodes[0], c) > 0)) {
					bestNodes = [];
					bestNodes.push(c);
				}
			}

			return bestNodes[Math.floor(Math.random() * bestNodes.length)];
		};

		let climb = (node: Node): number => {
			let bestChild = bestMove(node);
			if (bestChild) {
				// Else game over
				node.bestMove = { move: bestChild, score: Node.getBestScore(bestChild) };
			}
			if (node.parent) {
				return climb(node.parent) + 1;
			} else {
				return 1;
			}
		}



		let maxDepth = 100;
		let nodesEvaluated = 0;
		let maxDepthEvaluated = 0;

		let printStats = () => {
			let engineStats = `Positions evaluated: ${nodesEvaluated}, deepest line: ${maxDepthEvaluated}`;
			// console.log(engineStats);
			$("#engine-stats").text(engineStats);
		}

		let statsTimerFn = () => {
			printStats();
			statsTimer = setTimeout(statsTimerFn, 100);
		};
		let statsTimer: any = setTimeout(statsTimerFn, 100);
	
		let onNodeEvaluated = (node: Node) => {

			// Set the parent reference correctly
			for (let c of node.children) {
				c.parent = node;
			}

			// TODO Debounce best child evaluations at root/high level

			// Find the best move. Walk up the tree and deliver the good news.
			let depth = climb(node);

			maxDepthEvaluated = Math.max(maxDepthEvaluated, depth);

			// Schedule next level
			if(depth <= maxDepth){
				nodesEvaluated += node.children.length;
				for(let c of node.children){
					((child: Node) => {
						this.pool.enqueueTask(new WorkerTask(child.fen))
							.then((createdNode: Node): Node => {
								// Copy to the original child Node object
								child.children = createdNode.children;
								return child;
							})
							.then(onNodeEvaluated).catch((e) => { console.error(e); });
					})(c);
					// var child = c;

				}
			} else {
				// console.log("Stopping at max depth");
			}

			// Chainable
			return node;
		};

		// Start evaluation!
		// This creates the root node, creates first level child nodes and analyses them
		this.pool.enqueueTask(new WorkerTask(fen))
			.then(n => { n.score = evaluator(this.sim(n.fen)); return n;})
			.then(onNodeEvaluated)
			.then((node: Node) => {
				setTimeout(() => {
					keepRunning = false;
					engine.pool.disable();
					// Time is up, return the best move
					// engine.visualize(node);
					printBestPath(node);
					clearTimeout(statsTimer);
					deferred.resolve(node.bestMove.move.moveTo);
				}, timeToThink);

			}).catch((e) => { console.error(e); });



		let printBestPath = (node: Node) => {
			printStats;
			let str = "Moves: (" + node.score.numeric + "/" + node.bestMove.score.numeric + ") ";
			let n = node.bestMove.move;
			while (n != null) {
				str += n.moveTo + "(" + n.score.numeric + "/" + (n.bestMove?n.bestMove.score.numeric:"") + ") ";
				n = n.bestMove? n.bestMove.move:null;
			}
			console.log(str);
		}



		return deferred.getPromise();
	}


	visualize(node: Node){

		var nodesEvaluated = 0;
		let buildTree = (n: Node): any => {
			nodesEvaluated++;
			let v = {
				// name: node.bestMove ? node.bestMove.move.moveTo + " (" + node.bestMove.score.numeric + ")" : "na",
				name: (n.moveTo ? n.moveTo : "na") + " (" + (n.score?n.score.numeric:"") + "/" + (n.bestMove ? n.bestMove.score.numeric : "") + ")",
				children: []
			};
			if (n.children){
				for(let c of n.children){
					v.children.push(buildTree(c));
				}
			}
			return v;
		}

		// var root = treeData[0];
		var root = buildTree(node);

		console.log("Nodes evaluated: " + nodesEvaluated);

		var margin = { top: 20, right: 120, bottom: 20, left: 120 },
			width = 2000 - margin.right - margin.left,
			height = 100000 - margin.top - margin.bottom;

		var i = 0;

		var tree = d3.layout.tree().size([height, width]);

		var diagonal = d3.svg.diagonal()
			.projection(function(d) { return [d.y, d.x]; });

		var svg = d3.select("body").append("svg")
			.attr("width", width + margin.right + margin.left)
			.attr("height", height + margin.top + margin.bottom)
			.append("g")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

		let update = function update(source) {

			// Compute the new tree layout.
			var nodes = tree.nodes(root).reverse(),
				links = tree.links(nodes);

			// Normalize for fixed-depth.
			nodes.forEach(function(d) { d.y = d.depth * 180; });

			// Declare the nodesâ€¦
			var node = svg.selectAll("g.node")
				.data(nodes, function(d: any) { return d.id || (d.id = ++i); });

			// Enter the nodes.
			var nodeEnter = node.enter().append("g")
				.attr("class", "node")
				.attr("transform", function(d) {
					return "translate(" + d.y + "," + d.x + ")";
				});

			nodeEnter.append("circle")
				.attr("r", 10)
				.style("fill", "#fff");

			nodeEnter.append("text")
				.attr("x", function(d) {
					return d.children || d._children ? -13 : 13;
				})
				.attr("dy", ".35em")
				.attr("text-anchor", function(d) {
					return d.children || d._children ? "end" : "start";
				})
				.text(function(d) { return d.name; })
				.style("fill-opacity", 1);

			// Declare the linksâ€¦
			var link = svg.selectAll("path.link")
				.data(links, function(d: any) { return d.target.id; });

			// Enter the links.
			link.enter().insert("path", "g")
				.attr("class", "link")
				.attr("d", diagonal);

		}

		update(root);
	}

	findBestMoveAsync(fen: string, timeToThink: number): Promise<string>{

		/*
			- Build tree with d = 1
			- Evaluate nodes
			- Propagate best moves to root when all are finished

			- Extend tree with d = 2
			- Evaluate new nodes
			- Propagate best moves to root when all are finished

		*/

		let run = true;
		// setTimeout(() => {
		// 	run = false;
		// }, timeToThink);

		let defer = new Deferred<string>();
		let root = Node.create(fen, null, null, null);

		let exec = new SimulatorTaskExecutor();

		let branches = [root];

		while(run){

			// let l: Promise<Node[]> = branches.map((val) => { return  });
			let l = exec.evaluateChildren(root);
			l.then((list)=>{
				console.log(list);
			});


			// l.forEach(val => {
			// 	console.log(val);
			// })

			break;
		}

		// this.evaluateChildrenAsync(root);

		// Resolve promse with best result so far


		return defer.getPromise();

	}






	findBestMoveRecursive(fen: string, depth: number): string {
		let node = TreeNode.createPrev(fen, null, null);
		this.recursiveEvaluate(node, depth);
		let str = "Moves: " + node.score.getComparableScore() + " ";
		let n = node.bestMove;
		while(n != null){
			str += n.moveTo + "(" + n.score.getComparableScore() + ") ";
			n = n.bestMove
		}
		console.log(str);
		console.log("Score: " + node.score.getComparableScore());
		return node.bestMove.moveTo;
	}

	evaluate(fen: string): Score {

		let sim = this.sim(fen);

		sim.load(fen);
		let turn = sim.turn();

		if (sim.in_draw()) {
			return new DrawScore();
		} else if(sim.in_checkmate()){
			return new WonScore(turn == "w" ? "b" : "w");
		}

		// Count material
		let pw = 0;
		let pb = 0;


		let val = (c) => {
			c = c.toLowerCase();
			switch(c){
				case 'p': return 1;
				case 'b': return 3;
				case 'n': return 3;
				case 'r': return 5;
				case 'q': return 9;
				case 'k': return 0; //?
			}
			return 0;
		};

		for(let p of fen){
			if (p == " ") break;
			let value = val(p);
			if (p.toUpperCase() == p) pw += value;
			else pb += value;
		}

		return new NumericScore(pw - pb);
	}

}
