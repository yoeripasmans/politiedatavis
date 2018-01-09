// automaticly reloads the page
require('./assets/styles/index.scss');

import * as d3 from 'd3';

var width = 930,
	height = 800,
	colorNormal = "#ff694f",
	colorEdited = "#ff9c06",
	colorRemoved = "#ffcc34",
	colorInactive = "#e2e2e2";

var svg = d3.select("body")
	.append("svg")
	.attr("height", height)
	.attr("width", width)
	.append("g")
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"); // Place the <g> element in the middle

// Scales the numbers 1 and 9 to 10 and 50 and everything in between.
var circleSize = d3.scaleLinear().domain([1, 9]).range([8, 36]);

var simulation = d3.forceSimulation()
	.force("r", d3.forceRadial(10).strength(0.002)) // This force makes sure every circle is in a radius of approximately 100px
	.force("collide", d3.forceCollide(function(d) {
		return circleSize(d.schendingen) + 2; // Ensures the circles don't go on top of each other, this force depends on the value and is different for each circle
	}));

d3.tsv("data/data.tsv", function(error, data) {
	var circles = svg.selectAll(".bubble")
		.data(data)
		.enter().append("circle")
		.attr("class", "bubble")
		.attr("r", function(d) {
			return circleSize(d.schendingen);
		})
		.on("click", function(d) {
			//Index of clicked circle
			var circleIndex = d.index;

			if (d.status !== "Inactief" && d.status !== "Verwijderd") {
				//Change the size of the clicked circle
				d3.select(this)
					.transition()
					.duration(1000)
					.ease(d3.easeCubicOut)
					.attr("r", function(d) {
						return 10;
					});
				// Moves clicked circle to middle and moves all other circles away
				simulation
					.force("r", d3.forceRadial(function(d) {
						if (d.index == circleIndex) {
							return 0;
						} else {
							return 800;
						}
					}))
					.alpha(0.5)
					.restart();
			}
		})
		.attr("fill", function(d) {
			if (d.status == "Normaal") {
				return colorNormal;
			} else if (d.status == "Aangepast") {
				return colorEdited;
			} else if (d.status == "Verwijderd") {
				return colorRemoved;
			} else if (d.status == "Inactief") {
				return colorInactive;
			}
		});

	// Run a simulation on every circle (node)
	simulation.nodes(data)
		.on('tick', movingIn) // Run movingIn on every "tick" of the clock
		.on('end', function() {
		});

	function movingIn() {
		circles
			.attr("cx", function(d) {
				return d.x;
			})

			.attr("cy", function(d) {
				return d.y;
			});

	}

});
