//Automaticly reloads the page
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
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"); //Place the <g> element in the middle

//Scales the numbers of the data 1-9 to 8-36 and everything inbetween
var circleSize = d3.scaleLinear().domain([0, 5]).range([8, 36]);

var simulation = d3.forceSimulation()
	.force("r", d3.forceRadial(10).strength(0.002)) //This force makes sure every circle is in a radius
	.force("collide", d3.forceCollide(function(d) {
		return circleSize(d.totaleSchendingen) + 2; //Ensures the circles don't go on top of each other, this force is different for each circle
	}));

d3.tsv("data/data.tsv", function(error, data) {


	data = d3.nest()
		.key(function(d) {
			return d.videoID;
		})
		.entries(data);

    data.forEach(function(d) {
		d.totaleSchendingen = 0;

		for (var i = 0; i < d.values.length; i++) {
			d.titel = d.values[i].titel;
			d.totaleSchendingen += Number(d.values[i].totaleSchendingen);
		}
	});

	console.log(data);

	var circles = svg.selectAll(".bubble")
		.data(data)
		.enter().append("circle")
		.attr("class", "bubble")
		.attr("r", function(d) {
			return circleSize(d.totaleSchendingen);
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

				//Place the clicked circle in the middle and hide the rest
				simulation
					.force("r", d3.forceRadial(function(d) {
						if (d.index == circleIndex) {
							return 0;
						} else {
							return 800;
						}
					}))
					.alpha(0.5)
					.alphaDecay(0.01) //Makes sure the alpha doesn't decay too quickly so the clicked circle gets to the middle
					.restart();

				//Change the size of the clicked circle
				d3.select(this)
					.transition()
					.duration(1000)
					.ease(d3.easeCubicOut)
					.attr("r", function(d) {
						return 10;
					});

				//Insert timeline
				d3.select("svg").insert('rect', 'g')
					.attr('y', (height * 2))
					.transition()
					.duration(1000)
					.attr("width", 2)
					.attr("height", height)
					.attr('x', (width / 2))
					.attr('y', (height / 2));

			} else {
				//Shake animation
				var horizontalPosition = Number(this.getAttribute("cx")),
					shakeDuration = 80,
					shakeDeviation = 4,
					shakeEasing = d3.easeCubicOut;

				d3.select(this)
					.transition()
					.duration(shakeDuration)
					.ease(shakeEasing)
					.attr("cx", function(d) {
						return horizontalPosition + shakeDeviation;
					})
					.transition()
					.duration(shakeDuration)
					.ease(shakeEasing)
					.attr("cx", function(d) {
						return horizontalPosition - shakeDeviation;
					})
					.transition()
					.duration(shakeDuration)
					.ease(shakeEasing)
					.attr("cx", function(d) {
						return horizontalPosition + shakeDeviation;
					})
					.transition()
					.duration(shakeDuration)
					.ease(shakeEasing)
					.attr("cx", function(d) {
						return horizontalPosition - shakeDeviation;
					})
					.transition()
					.duration(shakeDuration)
					.ease(shakeEasing)
					.attr("cx", function(d) {
						return horizontalPosition + shakeDeviation;
					})
					.transition()
					.duration(shakeDuration)
					.ease(shakeEasing)
					.attr("cx", function(d) {
						return horizontalPosition;
					});
			}
		});

	//Run a simulation on every circle (node)
	simulation.nodes(data)
		.on('tick', movingIn) //Run movingIn on every "tick" of the clock
		.on('end', function() {});

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
