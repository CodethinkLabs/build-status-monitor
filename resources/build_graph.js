var conn;

var app = angular.module('buildStatusMonitor', []);

app.directive('buildGraph', ["graphService", function (){
	function link(scope, element, attr){

		node_width = 180;
		node_height = 40;

		node_x_pad = 80;
		node_y_pad = 25;

		canvas_pad = 30;

		columns = [];

		nodes = [];
		links = [];

		links_list = [];

		find_node_in_columns = function(id) {
			for (var i = 0; i < columns.length; i++)
				for (var j = 0; j < columns[i].length; j++)
				if (columns[i][j].id == id)
					return columns[i][j];
			return null;
		}

		get_node_column_number = function (id) {
			for (var i = 0; i < columns.length; i++)
				for (var j = 0; j < columns[i].length; j++)
				if (columns[i][j].id == id)
					return i;
			return null;
		}

		get_node_row_number = function (id) {
			for (var i = 0; i < columns.length; i++)
				for (var j = 0; j < columns[i].length; j++)
				if (columns[i][j].id == id)
					return j;
			return null;
		}

		node_x = function (d) {
			d.x = (get_node_column_number(d.id)
					* (node_width + node_x_pad)
					+ canvas_pad);
			return d.x;
		}

		node_y = function (d) {
			d.y = (get_node_row_number(d.id)
					* (node_height + node_y_pad))
					+ canvas_pad;
			return d.y;
		}

		d3.json("/columns/", function (data) {
			columns = data;
			console.log(columns);
		});

		d3.json("/links/", function (data) {
			links = data;
			console.log(links);

			for (var i = 0; i < links.length; i++) {
				// Append object references to link list.
				// Flip source and target as they are backwards in the json.
				console.log(links[i]);
				links_list[links_list.length] = {
					source: find_node_in_columns(links[i].target),
					target: find_node_in_columns(links[i].source)
				};
			}

			console.log(links_list);

			var canvas = d3.select(element[0]).append("svg")
			.attr("width", "1000")
			.attr("height", "1000");

		var tree = d3.layout.tree()
			.size([1000, 1000]);

		var column = canvas.selectAll(".column")
			.data(columns)
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
				return "translate(" + node_x(d)
				+ "," + node_y(d) + ")"
			});

		node.append("rect")
			.attr("height", node_height)
			.attr("width", node_width)
			.attr("rx", 5)
			.attr("ry", 5);

		node.append("text")
			.text(function (d) { return d.name; })
			.attr("transform", function(d){
			return "translate(6, 20)";
			})

		var diagonal = d3.svg.diagonal()
			.source(function (d) {
				return {x: (d.source.y + (node_height / 2)),
						y: d.source.x};
			})
			.target(function (d) {
				return {x: (d.target.y + (node_height / 2)),
						y: (d.target.x + node_width)};
			})
			.projection(function (d) {
				return [d.y, d.x];
			});

		column.select(".link")
			.data(links_list)
			.enter()
			.append("path")
			.attr("class", "edge no-builds")
			.attr("d", diagonal);
		})

		console.log(columns);
	}
	return {
        link: link,
		restrict: 'E'
	};
}]);

app.service('graphService', function() {
	this.getGraph = function() {
		return "test";
	}

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