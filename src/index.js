// automaticly reloads the page
require('./assets/styles/index.scss');

import * as d3 from 'd3';

var width = 930,
    height = 800;

var svg = d3.select("body")
    .append("svg")
    .attr("height", height)
    .attr("width", width)
    .append("g")
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"); // Place the <g> element in the middle

// Scales the numbers 1 and 9 to 10 and 50 and everything in between.
var circleSize = d3.scaleLinear().domain([1, 9]).range([8, 36]);

var simulation = d3.forceSimulation()
	.force("r", d3.forceRadial(700)) // This force makes sure every circle is in a radius of approximately 100px
    .force("collide", d3.forceCollide(function(d) {
        return circleSize(d.schendingen) + 2; // Ensures the circles don't go on top of each other, this force depends on the value and is different for each circlee
    }).strength(2));

d3.tsv("data/data.tsv", function(error, data) {
    var circles = svg.selectAll(".bubble")
        .data(data)
        .enter().append("circle")
        .attr("class", "bubble")
        .attr("r", function(d) {
            return circleSize(d.schendingen);
        })
		.on("click", function() {

		})
		.attr("visibility", "hidden")
        .attr("fill", function(d) {
            if (d.status == "Normaal") {
                return "#ff694f";
            } else if (d.status == "Aangepast") {
                return "#ff9c06";
            } else if (d.status == "Verwijderd") {
                return "#ffcc34";
            } else if (d.status == "Inactief") {
                return "#e2e2e2";
            }
        });

	d3.select("body").on("click", function() {
        console.log("hoi");
		circles
			.attr("visibility", "visible");
		simulation
			.force("x", d3.forceX(0).strength(0.01)) // Puts all the circles in the horizontal center
			.force("y", d3.forceY(0).strength(0.01)) // Puts all the circles in the vertical center
			.force("r", null) //This force makes sure every circle is in a radius of approximately 100px
			.alphaTarget(1)
			.restart();
    });

    // Run a simulation on every circle (node)
    simulation.nodes(data)
        .on('tick', movingIn); // Run movingIn on every "tick" of the clock

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
