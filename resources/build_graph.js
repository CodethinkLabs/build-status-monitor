var conn;

var app = angular.module('buildStatusMonitor', []);

app.directive('buildGraph', function () {
	function link(scope, element, attr) {
		var canvas = d3.select(element[0]).append("svg")
			.attr("width", "1000")
			.attr("height", "1000");

		scope.$watch('graph', function(d) {
			if (!d || !d.columns || !d.links_list) return;

			var column = canvas.selectAll(".column")
				.data(scope.graph.columns)
				.enter()
				.append("g")

			var node = column.selectAll(".node")
				.data( function(d) {
					return d;
				})
				.enter()
				.append("g")
				.attr("class", function(d) {
					return "node " + d.class;
				})
				.attr("transform", function (d, i) {
					return "translate(" + d.x
					+ "," + d.y + ")"
				});

			node.append("rect")
				.attr("height", 40)
				.attr("width", 180)
				.attr("rx", 5)
				.attr("ry", 5);

			node.append("text")
				.text(function (d) { return d.name; })
				.attr("transform", function(d) {
					return "translate(6, 20)";
				})

			var diagonal = d3.svg.diagonal()
				.source(function (d) {
					return {
						x: (d.source.y + (40 / 2)),
						y: (d.source.x)
					};
				})
				.target(function (d) {
					return {
						x: (d.target.y + (40 / 2)),
						y: (d.target.x + 180)
					};
				})
				.projection(function (d) {
					return [d.y, d.x];
				});

			column.select(".link")
				.data(scope.graph.links_list)
				.enter()
				.append("path")
				.attr("class", "edge no-builds")
				.attr("d", diagonal);
		}, true);
	};

	function controller($scope, $http, graphService) {
		$scope.graph = graphService.get_graph();
	};

	return {
		restrict: 'E',
		scope: '=',
		link: link,
		controller: controller,
	};
});

app.factory('graphService', function($http) {
	var node_width = 180;
	var node_height = 40;

	var node_x_pad = 80;
	var node_y_pad = 25;

	var canvas_pad = 30;

	var columns = [];
	var links_list = [];

	var find_node_in_columns = function(id) {
		for (var i = 0; i < columns.length; i++)
			for (var j = 0; j < columns[i].length; j++)
			if (columns[i][j].id == id)
				return columns[i][j];
		return null;
	};

	var get_node_column_number = function (id) {
		for (var i = 0; i < columns.length; i++)
			for (var j = 0; j < columns[i].length; j++)
			if (columns[i][j].id == id)
				return i;
		return null;
	};

	var get_node_row_number = function (id) {
		for (var i = 0; i < columns.length; i++)
			for (var j = 0; j < columns[i].length; j++)
			if (columns[i][j].id == id)
				return j;
		return null;
	};

	var factory = {};

	factory.get_graph = function() {
		var graph = {}; 

		$http.get('/columns/').success(function(data){
			columns = data;
			for (var x = 0; x < columns.length; x++) {
				for (var y = 0; y < columns[x].length; y++) {
					columns[x][y].x = x * (node_width + node_x_pad + canvas_pad);
					columns[x][y].y = y * (node_height + node_y_pad+ canvas_pad);
				}
			}
			graph.columns = columns;

			$http.get('/links/').success(function(data){
				links = data;
				links_list = [];
				for (var i = 0; i < data.length; i++) {
					// Append object references to link list.
					// Flip source and target as they are backwards in the json.
					links_list[links_list.length] = {
						source: find_node_in_columns(data[i].target),
						target: find_node_in_columns(data[i].source)
					};
				}
				graph.link = links;
				graph.links_list = links_list;
			}).error(function(err){
				throw err;
			});
		}).error(function(err){
			throw err;
		});	

		return graph
	}

	return factory;
 });

if (window["WebSocket"]) {
	conn = new WebSocket("ws://localhost:8080/ws");
	conn.onclose = function(evt) {
		console.log("Connection closed")
	}
	conn.onmessage = function(evt) {
		message = JSON.parse(evt.data);
		console.log(message.id);
		console.log(message.status);

		// TODO: use a map to speed up access to nodes.
		var node = find_node_in_columns(message.id);
		node.class = message.status;
		console.log("New Status: " + node.class);
		console.log(node);
	}
}
else {
	console.log("Your browser does not support WebSockets.")
}