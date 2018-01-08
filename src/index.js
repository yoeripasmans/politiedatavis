// automaticly reloads the page
require('./assets/styles/index.scss');

import * as d3 from 'd3';

var width = 1000,
    height = 800;

var check = 0;

var svg = d3.select("body")
    .append("svg")
    .attr("height", height)
    .attr("width", width)
    .append("g");
// .attr("transform", "translate(0,0)");

// Scales the numbers 1 and 35000 to 10 and 80 and everything in between.
var circleSize = d3.scaleSqrt().domain([1, 9]).range([10, 50]);

var yearsTogether = d3.forceX(width / 2).strength(0.05);

var simulation = d3.forceSimulation()
    .force("x", yearsTogether) // Puts all the circles in the horizontal center
    .force("y", d3.forceY(height / 2).strength(0.05)) // Puts all the circles in the vertical center
    .force("collide", d3.forceCollide(function(d) {
        return circleSize(d.Grootte) + 3; // Ensures the circles don't go on top of each other, this force depends on the value and is different for each circle
    }));

d3.tsv("data/data.tsv", function(error, data) {
    var circles = svg.selectAll(".bubble")
        .data(data)
        .enter().append("circle")
        .attr("class", "bubble")
        // .attr("r", 0)

        .attr("r", function(d) {
            return circleSize(d.Grootte);
        })
        .attr("fill", "red");

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
