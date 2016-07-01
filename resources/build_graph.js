var conn;

var app = angular.module('buildStatusMonitor', []);


app.directive('buildGraph', function () {
	function link(scope, element, attr) {
		console.log(scope);

		var canvas = d3.select(element[0]).append("svg")
			.attr("width", "1000")
			.attr("height", "1000");

		var tree = d3.layout.tree()
			.size([1000, 1000]);

		scope.$watch('columns', function(d) {
			if (!d) return;

			var column = canvas.selectAll(".column")
				.data(scope.columns)
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
				.data(scope.links_list)
				.enter()
				.append("path")
				.attr("class", "edge no-builds")
				.attr("d", diagonal);

			console.log("update");
		}, true);
	};

	function controller($scope, $http) {
		$scope.node_width = 180;
		$scope.node_height = 40;

		var node_x_pad = 80;
		var node_y_pad = 25;

		var canvas_pad = 30;

		var columns = [];
		var links_list = [];

		find_node_in_columns = function(id) {
			for (var i = 0; i < columns.length; i++)
				for (var j = 0; j < columns[i].length; j++)
				if (columns[i][j].id == id)
					return columns[i][j];
			return null;
		};

		get_node_column_number = function (id) {
			for (var i = 0; i < columns.length; i++)
				for (var j = 0; j < columns[i].length; j++)
				if (columns[i][j].id == id)
					return i;
			return null;
		};

		get_node_row_number = function (id) {
			for (var i = 0; i < columns.length; i++)
				for (var j = 0; j < columns[i].length; j++)
				if (columns[i][j].id == id)
					return j;
			return null;
		};

		$scope.node_x = function (d) {
			d.x = (get_node_column_number(d.id)
					* ($scope.node_width + node_x_pad)
					+ canvas_pad);
			return d.x;
		};

		$scope.node_y = function (d) {
			d.y = (get_node_row_number(d.id)
					* ($scope.node_height + node_y_pad))
					+ canvas_pad;
			return d.y;
		};

		$http.get('/links/').success(function(data){
			$scope.links = data;
			$scope.links_list = [];
			for (var i = 0; i < data.length; i++) {
				// Append object references to link list.
				// Flip source and target as they are backwards in the json.
				$scope.links_list[$scope.links_list.length] = {
					source: find_node_in_columns(data[i].target),
					target: find_node_in_columns(data[i].source)
				};
			}
		}).error(function(err){
			throw err;
		});

		$http.get('/columns/').success(function(data){
			$scope.columns = data;
		}).error(function(err){
			throw err;
		});	

		console.log($scope);
	};	

	return {
		restrict: 'E',
		scope: '=',
		link: link,
		controller: controller,
	};
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