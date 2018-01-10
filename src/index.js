/* __________ AUTOMATIC RELOAD __________ */

require('./assets/styles/index.scss');
import * as d3 from 'd3';

/* __________ VARIABLES __________ */

var width = 930;
var height = 800;
var colorNormal = "#ff694f";
var colorEdited = "#ff9c06";
var colorRemoved = "#ffcc34";
var colorInactive = "#e2e2e2";
var circleSize = d3.scaleLinear().domain([0, 8]).range([8, 36]); //Scales the numbers of the data 1-9 to 8-36 and everything inbetween

var svg = d3.select("body")
	.append("svg")
	.attr("height", height)
	.attr("width", width)
	.append("g")
	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")"); //Place the <g> element in the middle

var simulation = d3.forceSimulation()
	.force("r", d3.forceRadial(10).strength(0.005)) //This force makes sure every circle is in a radius
	.force("collide", d3.forceCollide(function(d) {
		return circleSize(d.totaleSchendingen) + 2; //Ensures the circles don't go on top of each other, this force is different for each circle
	}));

/* __________ LOADING DATA __________ */

d3.tsv("data/data.tsv", function(error, data) {

	data = d3.nest()
		.key(function(d) {
			return d.videoID; //Adds the dataset into objects in arrays
		})
		.entries(data)
		.map(function(d) {
			return {
				fragmenten: d.values //Change the name from 'values' to 'fragmenten'
			};
		});

	data.forEach(function(d) { //Adds a 'totaleSchedingen' property to the video object
		d.totaleSchendingen = 0;

		for (var i = 0; i < d.fragmenten.length; i++) {
			d.status = d.fragmenten[i].status;
			d.titel = d.fragmenten[i].titel;
			d.totaleSchendingen += Number(d.fragmenten[i].totaleSchendingen);
		}
	});

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
			bubbleClickEvent(this, d);
		});

	//Run a simulation on every circle (node)
	simulation.nodes(data)
		.on('tick', movingIn) //Run movingIn on every "tick" of the clock
		.on('end', function() {});

	/* __________ FUNCTIONS __________ */

	function movingIn() {
		circles
			.attr("cx", function(d) {
				return d.x;
			})

			.attr("cy", function(d) {
				return d.y;
			});
	}

	function bubbleClickEvent(_this, d){

		var circleIndex = d.index; //Index of clicked circle

		if (d.status !== "Inactief" && d.status !== "Verwijderd") {

			//Change the size of the clicked circle
			d3.select(_this)
				.on('click', null)
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

			//Insert timeline
			d3.select("body").insert('div', 'svg')
				.data(data)
				.attr('class', 'line')
				.transition()
				.delay(450)
				.duration(1000)
				.style("height", function(d) {
					return (d.totaleSchendingen * 300) + "px";
				});

			//Insert backbutton
			d3.select("body").insert('button', 'svg')
				.text('Terug')
				.attr('class', 'back-button')
				.on('click', function(d) {

					d3.selectAll(".bubble")
						.on("click", function(d) {
							bubbleClickEvent(this, d);
						})
						.transition()
						.duration(1000)
						.ease(d3.easeCubicOut)
						.attr("r", function(d) {
							return circleSize(d.totaleSchendingen);
						});

					d3.select(".line").remove(); //Remove timeline
					d3.select(".back-button").remove(); //Remove backbutton

					simulation
						.force("r", d3.forceRadial(function(d) {
							return 0;
						}))
						.alpha(0.25)
						.alphaDecay(0.015) //Makes sure the alpha doesn't decay too quickly so the clicked circle gets to the middle
						.restart();

				});

		} else {
			shakeAnimation(_this);
		}
	} // End bubbleClickEvent

	function shakeAnimation(_this) {

		//Shake animation
		var horizontalPosition = Number(_this.getAttribute("cx")),
			shakeDuration = 80,
			shakeDeviation = 4,
			shakeEasing = d3.easeCubicOut;

		d3.select(_this)
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
