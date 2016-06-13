var conn;

var app = angular.module('buildStatusMonitor', []);

app.directive('buildGraph', function () {
	return {
		replace: true,

		controller: function($scope) {
			$scope.node_width = 180;
			$scope.node_height = 40;

			$scope.node_x_pad = 80;
			$scope.node_y_pad = 25;

			$scope.canvas_pad = 30;

			$scope.columns = [];
			$scope.columns[0] = [];

			$scope.nodes = [];
			$scope.links = [];

			$scope.links_list = [];

			$scope.find_node_in_columns = function(id) {
				for (var i = 0; i < $scope.columns.length; i++)
					for (var j = 0; j < $scope.columns[i].length; j++)
					if ($scope.columns[i][j].id == id)
						return $scope.columns[i][j];
				return null;
			}

			$scope.remove_node_from_columns = function (id) {
				for (var i = 0; i < $scope.columns.length; i++)
					for (var j = 0; j < $scope.columns[i].length; j++)
					if ($scope.columns[i][j].id == id)
					{
						$scope.columns[i].splice(j, 1);
						return true;
					}
				return false;
			}

			$scope.get_node_column_number = function (id) {
				for (var i = 0; i < $scope.columns.length; i++)
					for (var j = 0; j < $scope.columns[i].length; j++)
					if ($scope.columns[i][j].id == id)
						return i;
				return null;
			}

			$scope.get_node_row_number = function (id) {
				for (var i = 0; i < $scope.columns.length; i++)
					for (var j = 0; j < $scope.columns[i].length; j++)
					if ($scope.columns[i][j].id == id)
						return j;
				return null;
			}

			$scope.node_x = function (d) {
				d.x = ($scope.get_node_column_number(d.id)
						* ($scope.node_width + $scope.node_x_pad)
						+ $scope.canvas_pad);
				return d.x;
			}

			$scope.node_y = function (d) {
				d.y = ($scope.get_node_row_number(d.id)
						* ($scope.node_height + $scope.node_y_pad))
						+ $scope.canvas_pad;
				return d.y;
			}

			d3.json("/resources/build-graph.json", function (data) {
				// TODO: Map nodes by ID for easier access, for now the sample data
				// index matches the element ID.
				console.log("Started json parsing");
				console.log(data.nodes);
				$scope.nodes = data.nodes;
				$scope.links = data.links;

				for (var i = 0; i < $scope.nodes.length; i++)
					$scope.columns[0][i] = $scope.nodes[i];

				for (var i = 0; i < $scope.links.length; i++) {
					var node_id = $scope.links[i].target;
					var col_num = $scope.get_node_column_number(node_id);
					var parent_col_num
						= $scope.get_node_column_number($scope.links[i].source);

					// Create more columns as needed.
					if ((parent_col_num + 1) >= $scope.columns.length)
						$scope.columns[$scope.columns.length] = [];

					$scope.remove_node_from_columns(node_id);
					var new_col = parent_col_num + 1;
					var col_len = $scope.columns[new_col].length;
					$scope.columns[new_col][col_len] = $scope.nodes[node_id];

					for (var j = 0; j < i; j++) {
						var node_id = $scope.links[j].target
						var col_num = $scope.get_node_column_number(node_id);
						var parent_col_num
							= $scope.get_node_column_number($scope.links[j].source);

						if ((parent_col_num + 1) >= $scope.columns.length)
							$scope.columns[$scope.columns.length] = [];

						$scope.remove_node_from_columns(node_id);
						var new_col = parent_col_num + 1;
						var col_len = $scope.columns[new_col].length;
						$scope.columns[new_col][col_len] = $scope.nodes[node_id];
					}

					// Append object references to link list.
					// Flip source and target as they are backwards in the json.
					$scope.links_list[$scope.links_list.length] = {
						source: $scope.nodes[ $scope.links[i].target ],
						target: $scope.nodes[ $scope.links[i].source ]
					};
				}
				console.log("Finished json parsing");
				console.log($scope.nodes);
			});

			console.log ("Graph load complete");
			console.log ($scope);
		},

		link: function (scope, element, attrs) {
			scope.$watch('nodes', function(newValue, oldValue) {
				if (newValue) {
					console.log(newValue);
					console.log(oldValue);
					console.log("Drawing Graph");

					var canvas = d3.select(element[0]).append("svg")
						.attr("width", "1000")
						.attr("height", "1000");

					var tree = d3.layout.tree()
						.size([1000, 1000]);

					var node = canvas.selectAll(".node").data(scope.nodes).enter()
						.append("g")
						.attr("class", function(d) {
							return "node " + d.class;
						})
						.attr("transform", function (d, i) {
							return "translate(" + scope.node_x(d)
							+ "," + scope.node_y(d) + ")"
						});

					node.append("rect")
						.attr("height", scope.node_height)
						.attr("width", scope.node_width)
						.attr("rx", 5)
						.attr("ry", 5);

					node.append("text")
						.text(function (d) { return d.name; })
						.attr("transform", function(d){
						return "translate(6, 20)";
						})

					var diagonal = d3.svg.diagonal()
						.source(function (d) {
							return {x: (d.source.y+ (scope.node_height / 2)),
									y: d.source.x};
						})
						.target(function (d) {
							return {x: (d.target.y + (scope.node_height / 2)),
									y: (d.target.x + scope.node_width)};
						})
						.projection(function (d) {
							return [d.y, d.x];
						});

					node.select(".link")
						.data(scope.links_list)
						.enter()
						.append("path")
						.attr("class", "edge no-builds")
						.attr("d", diagonal);
				}

			}, true);


		},
	};
});

if (window["WebSocket"]) {
	conn = new WebSocket("ws://localhost:8080/ws");
	conn.onclose = function(evt) {
		console.log("Connection closed")
	}
	conn.onmessage = function(evt) {
		console.log(evt.data);
	}
}
else {
	console.log("Your browser does not support WebSockets.")
}