import {Chess, Move88} from "chess.js";
import {Node88} from "./GameTree";
import * as d3 from "d3";


export function visualize(node: Node88){

	var nodesEvaluated = 0;
	let buildTree = (n: Node88): any => {
		nodesEvaluated++;
		let v = {
			// name: node.bestMove ? node.bestMove.move.moveTo + " (" + node.bestMove.score.numeric + ")" : "na",
			name: (n.san ? n.san : "na") + " (" + (typeof n.score != "undefined" ? n.score : "") + "/" + (typeof n.bestMove != "undefined" ? n.bestMove.score.numeric : "") + ")",
			// name: (n.san ? n.san : "na"),
			children: []
		};
		if (n.children) {
			for (let c of n.children) {
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
		height = 10000 - margin.top - margin.bottom;

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
