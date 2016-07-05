var app = angular.module("buildStatusMonitor", []);

app.directive("buildGraph", function () {
	function link(scope, element, attr) {
		var canvas = d3.select(element[0]).append("svg")
			.attr("width", "1000")
			.attr("height", "1000");

		scope.$watch("graph", function(d) {
			if (!d || !d.columns || !d.links_list)
				return;

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
				.attr("height", scope.node_height)
				.attr("width", scope.node_width)
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
						x: (d.source.y + (scope.node_height / 2)),
						y: (d.source.x)
					};
				})
				.target(function (d) {
					return {
						x: (d.target.y + (scope.node_height / 2)),
						y: (d.target.x + scope.node_width)
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
		$scope.graph = graphService.graph;
		graphService.init();

		$scope.node_height = graphService.node_height;
		$scope.node_width = graphService.node_width;

		if (window["WebSocket"]) {
			var conn = new WebSocket("ws://localhost:8080/ws");
			conn.onclose = function(evt) {
				console.log("Connection closed")
			}
			conn.onmessage = function(evt) {
				try {
					message = JSON.parse(evt.data);
				} catch(e) {
					console.log(e);
					return;
				}

				var node = graphService.find_node_in_graph(message.id);
				if (node == null) {
					console.log ("Could not find node with ID: " + message.id);
					return;
				}

				node.class = message.status;
				$scope.$apply();
			}
		}
		else {
			console.log("Your browser does not support WebSockets.")
		}
	};

	return {
		restrict: 'E',
		scope: '=',
		link: link,
		controller: controller,
	};
});

app.service('graphService', function($http) {
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

	var obj = {};

	obj.node_width = 180;
	obj.node_height = 40;

	obj.node_x_pad = 80;
	obj.node_y_pad = 25;

	obj.canvas_pad = 30;

	obj.graph = {};
	obj.initialised = false;

	obj.find_node_in_graph = function (id) {
		if (!id || id == null || !obj.initialised)
			return null;

		for (var i = 0; i < obj.graph.columns.length; i++)
			for (var j = 0; j < obj.graph.columns[i].length; j++)
				if (obj.graph.columns[i][j].id == id)
					return obj.graph.columns[i][j];

		return null;
	}

	obj.init = function() {
		if (obj.initialised) {
			console.log("Graph is already initialised");
			return;
		}

		$http.get('/columns/').success(function(data){
			columns = data;
			for (var x = 0; x < columns.length; x++) {
				for (var y = 0; y < columns[x].length; y++) {
					columns[x][y].x = x *
						(obj.node_width + obj.node_x_pad) + obj.canvas_pad;
					columns[x][y].y = y *
						(obj.node_height + obj.node_y_pad) + obj.canvas_pad;
				}
			}
			obj.graph.columns = columns;

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
				obj.graph.link = links;
				obj.graph.links_list = links_list;
			}).error(function(err){
				throw err;
			});
		}).error(function(err){
			throw err;
		});	

		obj.initialised = true;
	}

	return obj;
 });
