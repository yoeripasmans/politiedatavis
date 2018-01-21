/* __________ AUTOMATIC RELOAD __________ */

require('./assets/styles/index.scss');
import * as d3 from 'd3';

/* __________ VARIABLES __________ */

var height = 800;
var colorNormal = "#ff694f";
var colorEdited = "#ff9c06";
var colorRemoved = "#ffcc34";
var colorInactive = "#e2e2e2";
var responsiveCheck;
var circleClickedCheck = false;
var circleSize = d3.scaleLinear().domain([0, 8]).range([8, 36]); //Scales between two number ranges
var circleTimelineDeviation = 12;
var circleTimelinePosition = d3.scaleLinear().domain([0, 150, 450, 750, 1050, 1350, 1650, 1950, 2250, 2550, 2850, 3150, 3450, 3750, 4050, 4350, 4650, 4950, 5100]).range([0, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, 0]); //Scales between multiple number ranges

d3.select(window).on('resize', onResize);

var svg = d3.select(".svg-container")
	.append("svg")
	.attr("height", height)
	.attr("width", window.innerWidth)
	.append("g");

var simulation = d3.forceSimulation()
	.force("r", d3.forceRadial(10).strength(0.005)) //This force makes sure every circle is in a radius
	.force("collide", d3.forceCollide(function(d) {
		return circleSize(d.totaleSchendingen) + 2; //Ensures the circles don't go on top of each other, this force is different for each circle
	}));

// Prep the tooltip bits, initial display is hidden
//Append tool-tip to conainter
var tooltip = d3.select(".svg-container")
	.append("div")
	.attr("class", "tool-tip");

onResize();

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

	data.forEach(function(d) { //Adds a 'totaleSchendingen' property to the video object
		d.totaleSchendingen = 0;
		d.totaleEvents = 0;

		for (var i = 0; i < d.fragmenten.length; i++) {
			d.status = d.fragmenten[i].status;
			d.titel = d.fragmenten[i].titel;
			d.totaleSchendingen += Number(d.fragmenten[i].totaleSchendingen);
			d.totaleEvents += Number(d.fragmenten[i].totaleEvents);
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
		.attr("cursor", function(d) {
			if (d.status == "Normaal" || d.status == "Aangepast" || d.status == "Verwijderd") {
				return "pointer";
			} else if (d.status == "Inactief") {
				return "default";
			}
		})
		.on("mouseover", function(d) {
			tooltip.style("visibility", "visible");
			tooltip.text(d.titel);
		})
		.on("mousemove", function(d) {
			return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
		})
		.on("mouseout", function(d) {
			tooltip.style("visibility", "hidden");
		})
		.on("click", function(d) {
			circleClickEvent(this, d);
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

	function circleClickEvent(_this, d) {

		circleClickedCheck = true;

		if (window.innerWidth < 500 && circleClickedCheck == true) {
			responsiveCheck = 5;
		} else {
			responsiveCheck = 2;
		}

		var circleIndex = d.index; //Index of clicked circle
		var circleTotaleEvents = d.totaleEvents; //Save the totaleSchendingen to another varible for later use

		if (d.status !== "Inactief" && d.status !== "Verwijderd") {

			//Trigger the scroll function so the circle moves back and forth
			document.querySelector('body').onscroll = function() {
				scroll(_this);
			};

			tooltip.style("visibility", "hidden");

			d3.selectAll(".bubble")
				.on('click', null)
				.on('mouseover', null)
				.on('mouseout', null)
				.on('mousemove', null)
				.attr("cursor", "default")
				.transition()
				.duration(300)
				.attr("fill", "transparent");

			//Change the size of the clicked circle
			d3.select(_this)
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
				.transition()
				.duration(1000)
				.ease(d3.easeCubicOut)
				.attr("r", function(d) {
					return circleSize(0);
				});

			//Place the clicked circle in the middle and hide the rest
			simulation
				.force("r", d3.forceRadial(function(d) {
					if (d.index == circleIndex) {
						return 0;
					} else {
						return 400;
					}
				}))
				.alpha(0.4)
				.alphaDecay(0.01) //Makes sure the alpha doesn't decay too quickly so the clicked circle gets to the middle
				.restart();

			createVideoTitle(_this, d);

			//Insert timeline
			d3.select(".svg-container").insert('div', 'svg')
				.data(data)
				.attr('class', 'line')
				.transition()
				.delay(850)
				.duration(1000)
				.style("height", function(d) {
					return (circleTotaleEvents * 300) + 300 + "px";
				});

			createEvent(circleTotaleEvents, d);

			//Insert backbutton
			d3.select(".svg-container").insert('button', 'svg')
				.text('Terug')
				.attr('class', 'back-button')
				.on('click', function(d) {

					circleClickedCheck = false;

					responsiveCheck = 2;

					//Removes the function on scroll
					document.querySelector('body').onscroll = function() {};

					d3.selectAll(".bubble")
						.on("click", function(d) {
							circleClickEvent(this, d);
						})
						.on("mouseover", function(d) {
							tooltip.style("visibility", "visible");
							tooltip.text(d.titel);
						})
						.on("mousemove", function(d) {
							return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
						})
						.on("mouseout", function(d) {
							tooltip.style("visibility", "hidden");
						})
						.attr("cursor", function(d) {
							if (d.status == "Normaal" || d.status == "Aangepast" || d.status == "Verwijderd") {
								return "pointer";
							} else if (d.status == "Inactief") {
								return "default";
							}
						})
						.transition()
						.duration(1000)
						.ease(d3.easeCubicOut)
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
						.attr("r", function(d) {
							return circleSize(d.totaleSchendingen);
						});

					d3.select(".line").remove(); //Remove timeline
					d3.select(".back-button").remove(); //Remove backbutton
					d3.select(".header").remove(); // remove header

					simulation
						.force("r", d3.forceRadial(function(d) {
							return 0;
						}))
						.alpha(0.25)
						.alphaDecay(0.015) //Makes sure the alpha doesn't decay too quickly so the clicked circle gets to the middle
						.restart();

					d3.select("g")
						.transition()
						.duration(1000)
						.ease(d3.easeCubicOut)
						.attr("transform", "translate(" + window.innerWidth / responsiveCheck + "," + height / 2 + ")"); //Place the <g> element in the middle

				});

			//Position the timeline accordingly
			d3.select("g")
				.transition()
				.duration(1000)
				.attr("transform", "translate(" + window.innerWidth / responsiveCheck + "," + height / 2 + ")"); //Place the <g> element in the middle

			if (responsiveCheck == 5) {
				d3.select(".svg-container")
					.style("width", "40%");
			}

		} else {
			shakeAnimation(_this);
		}
	} // End circleClickEvent

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

	function scroll(_this, d) {

		if (window.pageYOffset >= 0 && window.pageYOffset <= 5100) {
			var circleWiggle;
			circleWiggle = (window.innerWidth / responsiveCheck) + circleTimelinePosition(window.pageYOffset);
			d3.select("g")
				.attr("transform", "translate(" + circleWiggle + "," + height / 2 + ")"); //Wiggle the g element back and forth
		}

		d3.select(_this)
			.transition()
			.duration(200)
			.ease(d3.easeCubicOut)
			.attr("r", function() {
				if (window.pageYOffset < 300) {
					return circleSize(0);
				} else if (window.pageYOffset >= 300 && window.pageYOffset < 600) {
					return circleSize(1);
				} else if (window.pageYOffset >= 600 && window.pageYOffset < 900) {
					return circleSize(2);
				} else if (window.pageYOffset >= 900 && window.pageYOffset < 1200) {
					return circleSize(3);
				} else if (window.pageYOffset >= 1200 && window.pageYOffset < 1500) {
					return circleSize(4);
				} else if (window.pageYOffset >= 1500 && window.pageYOffset < 1800) {
					return circleSize(5);
				} else if (window.pageYOffset >= 1800 && window.pageYOffset < 2100) {
					return circleSize(6);
				} else if (window.pageYOffset >= 2100 && window.pageYOffset < 2400) {
					return circleSize(7);
				} else if (window.pageYOffset >= 2400) {
					return circleSize(8);
				}
			});

		var popup = document.querySelectorAll('.popup');

		console.log(window.pageYOffset);

		if (window.pageYOffset > 10) {
			document.querySelector('.popup--explanation').classList.add("popup--hidden");
		} else {
			document.querySelector('.popup--explanation').classList.remove("popup--hidden");
		}

		if (window.pageYOffset >= 300 && popup.length > 0) {
			popup[0].classList.remove("popup--hidden");
		} else if (window.pageYOffset < 300 && popup.length > 0) {
			popup[0].classList.add("popup--hidden");
		}

		if (window.pageYOffset >= 600 && popup.length > 1) {
			popup[1].classList.remove("popup--hidden");
		} else if (window.pageYOffset > 300 && window.pageYOffset < 600 && popup.length > 1) {
			popup[1].classList.add("popup--hidden");
		} else if (window.pageYOffset >= 290 && popup.length == 0) {
			document.querySelector('.popup--end').classList.remove("popup--hidden");
		} else if (window.pageYOffset < 290 && popup.length == 0) {
			document.querySelector('.popup--end').classList.remove("popup--hidden");
		}

		if (window.pageYOffset >= 900 && popup.length > 2) {
			popup[2].classList.remove("popup--hidden");
		} else if (window.pageYOffset > 600 && window.pageYOffset < 900 && popup.length > 2) {
			popup[2].classList.add("popup--hidden");
		} else if (window.pageYOffset >= 590 && popup.length == 1) {
			document.querySelector('.popup--end').classList.remove("popup--hidden");
		} else if (window.pageYOffset < 590 && popup.length == 1) {
			document.querySelector('.popup--end').classList.add("popup--hidden");
		}

		if (window.pageYOffset >= 1200 && popup.length > 3) {
			popup[3].classList.remove("popup--hidden");
		} else if (window.pageYOffset > 900 && window.pageYOffset < 1200 && popup.length > 3) {
			popup[3].classList.add("popup--hidden");
		} else if (window.pageYOffset >= 890 && popup.length == 2) {
			document.querySelector('.popup--end').classList.remove("popup--hidden");
		} else if (window.pageYOffset < 890 && popup.length == 2) {
			document.querySelector('.popup--end').classList.add("popup--hidden");
		}

		if (window.pageYOffset >= 1500 && popup.length > 4) {
			popup[4].classList.remove("popup--hidden");
		} else if (window.pageYOffset > 1200 && window.pageYOffset < 1500 && popup.length > 4) {
			popup[4].classList.add("popup--hidden");
			document.querySelector('.popup--end').classList.add("popup--hidden");
		} else if (window.pageYOffset >= 1190 && popup.length == 3) {
			document.querySelector('.popup--end').classList.remove("popup--hidden");
		} else if (window.pageYOffset < 1190 && popup.length == 3) {
			document.querySelector('.popup--end').classList.add("popup--hidden");
		}

		if (window.pageYOffset >= 1800 && popup.length > 5) {
			popup[4].classList.remove("popup--hidden");
		} else if (window.pageYOffset > 1500 && window.pageYOffset < 1800 && popup.length > 5) {
			popup[4].classList.add("popup--hidden");
		} else if (window.pageYOffset >= 1490 && popup.length == 4) {
			document.querySelector('.popup--end').classList.remove("popup--hidden");
		} else if (window.pageYOffset < 1490 && popup.length == 4) {
			document.querySelector('.popup--end').classList.add("popup--hidden");
		}

		if (window.pageYOffset >= 2100 && popup.length > 6) {
			popup[4].classList.remove("popup--hidden");
		} else if (window.pageYOffset > 1800 && window.pageYOffset < 2100 && popup.length > 6) {
			popup[4].classList.add("popup--hidden");
		} else if (window.pageYOffset >= 1790 && popup.length == 5) {
			document.querySelector('.popup--end').classList.remove("popup--hidden");
		} else if (window.pageYOffset < 1790 && popup.length == 5) {
			document.querySelector('.popup--end').classList.add("popup--hidden");
		}

		if (window.pageYOffset >= 2400 && popup.length > 7) {
			popup[4].classList.remove("popup--hidden");
		} else if (window.pageYOffset > 2100 && window.pageYOffset < 2400 && popup.length > 7) {
			popup[4].classList.add("popup--hidden");
		} else if (window.pageYOffset >= 2090 && popup.length == 6) {
			document.querySelector('.popup--end').classList.remove("popup--hidden");
		} else if (window.pageYOffset < 2090 && popup.length == 6) {
			document.querySelector('.popup--end').classList.add("popup--hidden");
		}

		if (window.pageYOffset >= 2700 && popup.length > 8) {
			popup[4].classList.remove("popup--hidden");
		} else if (window.pageYOffset > 2400 && window.pageYOffset < 2700 && popup.length > 8) {
			popup[4].classList.add("popup--hidden");
		} else if (window.pageYOffset >= 2390 && popup.length == 7) {
			document.querySelector('.popup--end').classList.remove("popup--hidden");
		} else if (window.pageYOffset < 2390 && popup.length == 7) {
			document.querySelector('.popup--end').classList.add("popup--hidden");
		}

		if (window.pageYOffset >= 3000 && popup.length > 9) {
			popup[4].classList.remove("popup--hidden");
		} else if (window.pageYOffset > 2700 && window.pageYOffset < 3000 && popup.length > 9) {
			popup[4].classList.add("popup--hidden");
		} else if (window.pageYOffset >= 2690 && popup.length == 8) {
			document.querySelector('.popup--end').classList.remove("popup--hidden");
		} else if (window.pageYOffset < 2690 && popup.length == 8) {
			document.querySelector('.popup--end').classList.add("popup--hidden");
		}

	}

	function createVideoTitle(_this, d) {

		var headerDiv = document.createElement("div");
		headerDiv.classList.add("header");

		var videoTitle = document.createElement("h1");
		var videoTitleTextNode = document.createTextNode(d.titel);
		videoTitle.classList.add("header__title");
		videoTitle.appendChild(videoTitleTextNode);

		var titlePar = document.createElement("p");
		var titleParTextNode = document.createTextNode("Video titel:");
		titlePar.classList.add("header__title-p");
		titlePar.appendChild(titleParTextNode);

		var vloggerName = document.createElement("p");
		var vloggerTextNode = document.createTextNode(d.fragmenten[0].account);

		if (d.fragmenten[0].account == 'Politievlogger Jan-Willem') {
			vloggerName.classList.add("header__vlogger", "header__vlogger--janwillem");
		} else {
			vloggerName.classList.add("header__vlogger", "header__vlogger--tess");
		}

		vloggerName.appendChild(vloggerTextNode);
		headerDiv.appendChild(titlePar);
		headerDiv.appendChild(videoTitle);
		headerDiv.appendChild(vloggerName);

		var selectSvg = document.querySelector(".svg-container");

		document.body.insertBefore(headerDiv, selectSvg);
	}

	// create div elements on the timeline at the event points
	function createEvent(circleTotaleEvents, d) {

		var selectedFragment = 0;
		var selectedSchending = 0;

		var eventContainerExplanation = document.createElement("div"); //Create a container for the events
		eventContainerExplanation.classList.add("event-container--explanation");

		var circleExplanation = document.createElement("div"); //Create a div for the events
		circleExplanation.classList.add("circle", "circle--hidden", "circle--explanation");

		var popupExplanation = document.createElement("div"); //Create a container for the events description
		popupExplanation.classList.add("popup--explanation");

		var descriptionExplanation = document.createElement("p");
		descriptionExplanation.innerHTML = "Scroll door de tijdlijn om het verloop van de video te bekijken.";
		descriptionExplanation.classList.add("popup__description--explanation");

		//All the appends
		document.querySelector(".line").appendChild(eventContainerExplanation);
		eventContainerExplanation.appendChild(circleExplanation);
		eventContainerExplanation.appendChild(popupExplanation);
		popupExplanation.appendChild(descriptionExplanation);

		for (var i = 0; i < circleTotaleEvents; i++) {

			//An array to loop through all the 'schendingen'
			var categorieIndex = [d.fragmenten[selectedFragment].eersteSchendingCategorie, d.fragmenten[selectedFragment].tweedeSchendingCategorie, d.fragmenten[selectedFragment].derdeSchendingCategorie, d.fragmenten[selectedFragment].vierdeSchendingCategorie, d.fragmenten[selectedFragment].vijfdeSchendingCategorie, d.fragmenten[selectedFragment].zesdeSchendingCategorie];

			var beschrijvingIndex = [d.fragmenten[selectedFragment].eersteSchendingBeschrijving, d.fragmenten[selectedFragment].tweedeSchendingBeschrijving, d.fragmenten[selectedFragment].derdeSchendingBeschrijving, d.fragmenten[selectedFragment].vierdeSchendingBeschrijving, d.fragmenten[selectedFragment].vijfdeSchendingBeschrijving, d.fragmenten[selectedFragment].zesdeSchendingBeschrijving];

			var tijdIndex = [d.fragmenten[selectedFragment].eersteSchendingTijd, d.fragmenten[selectedFragment].tweedeSchendingTijd, d.fragmenten[selectedFragment].derdeSchendingTijd, d.fragmenten[selectedFragment].vierdeSchendingTijd, d.fragmenten[selectedFragment].vijfdeSchendingTijd, d.fragmenten[selectedFragment].zesdeSchendingTijd];

			var screenshotIndex = [d.fragmenten[selectedFragment].eersteSchendingScreenshot, d.fragmenten[selectedFragment].tweedeSchendingScreenshot, d.fragmenten[selectedFragment].derdeSchendingScreenshot, d.fragmenten[selectedFragment].vierdeSchendingScreenshot, d.fragmenten[selectedFragment].vijfdeSchendingScreenshot, d.fragmenten[selectedFragment].zesdeSchendingScreenshot];

			var eventContainer = document.createElement("div"); //Create a container for the events

			var popup = document.createElement("div"); //Create a container for the events description

			var circle = document.createElement("div"); //Create a div for the events
			eventContainer.classList.add("event-container");
			popup.classList.add("popup", "popup--hidden");
			eventContainer.appendChild(circle);
			eventContainer.appendChild(popup);


			circle.classList.add("circle", "circle--hidden", "circle--" + categorieIndex[selectedSchending]);
			eventContainer.setAttribute("beschrijving", beschrijvingIndex[selectedSchending]);
			eventContainer.setAttribute("tijd", tijdIndex[selectedSchending]);
			eventContainer.setAttribute("screenshot", screenshotIndex[selectedSchending]);

			selectedSchending++;

			if (categorieIndex[selectedSchending] == undefined) {
				selectedFragment++;
				selectedSchending = 0;
			}

			eventContainer.style.cssText = "top: " + ((i * 300 + 300) + (window.innerHeight / 2 - 20)) + "px; left:" + (window.innerWidth / responsiveCheck - 20) + "px;"; //Style the eventDiv
			document.querySelector(".line").appendChild(eventContainer); //Add the eventDiv's to .line
		} //End loop

		var eventContainerEnd = document.createElement("div"); //Create a container for the events
		eventContainerEnd.classList.add("event-container--end");

		var circleEnd = document.createElement("div"); //Create a div for the events
		circleEnd.classList.add("circle", "circle--hidden", "circle--end");

		var popupEnd = document.createElement("div"); //Create a container for the events description
		popupEnd.classList.add("popup--end", "popup--hidden");

		var EndDescription = document.createElement("p");
		EndDescription.innerHTML = "The end.";
		EndDescription.classList.add("popup__description--end");

		eventContainerEnd.style.top = (circleTotaleEvents * 300 + 300) + (window.innerHeight / 2 - 20) + 'px';

		//All the appends
		document.querySelector(".line").appendChild(eventContainerEnd);
		eventContainerEnd.appendChild(circleEnd);
		eventContainerEnd.appendChild(popupEnd);
		popupEnd.appendChild(EndDescription);

		//Adds descriptions for all events
		var eventsContainers = document.querySelectorAll(".event-container");
		var popups = document.querySelectorAll(".popup");
		var descriptions = document.querySelectorAll(".popup");
		for (i = 0; i < circleTotaleEvents; i++) {
			//Create a div for the events'
			var description = document.createElement("p");
			eventsContainers[i].appendChild(descriptions[i]);
			descriptions[i].appendChild(description);
			description.innerHTML = description.parentNode.parentNode.getAttribute("beschrijving");
			description.classList.add("popup__description");

			//Adds image button
			if(eventsContainers[i].getAttribute("screenshot") !== "undefined"){
			var imgButton = document.createElement("button");
			popups[i].appendChild(imgButton);
			imgButton.textContent = "Afbeelding bekijken";
			imgButton.classList.add("popup__image-button");
			imgButton.addEventListener('click', showImg);
			}
		}

		function showImg(){
			console.log('yo');
		}

		//Animate the event circles in
		setTimeout(function() {
			var events = document.querySelectorAll(".circle");
			for (i = 0; i < events.length; i++) {
				events[i].classList.toggle("circle--hidden");
			}
		}, 1000);

	} //End createEvent function

});

function onResize() {

	if (window.innerWidth < 500 && circleClickedCheck == true) {
		responsiveCheck = 5;
	} else {
		responsiveCheck = 2;
	}

	if (responsiveCheck == 5) {
		d3.select(".svg-container")
			.style("width", "40%");
	} else {
		d3.select(".svg-container")
			.style("width", "100%");
	}

	d3.select("svg")
		.attr("width", window.innerWidth);

	d3.select("g")
		.attr("transform", "translate(" + window.innerWidth / responsiveCheck + "," + height / 2 + ")"); //Place the <g> element in the middle

	var events = document.querySelectorAll(".event-container");
	if (events.length > 0) {
		document.querySelector(".event-container--end").style.top = (events.length * 300 + 300) + (window.innerHeight / 2 - 20) + 'px';

	}

	for (var i = 0; i < events.length; i++) {
		events[i].style.cssText = "top: " + ((i * 300 + 300) + (window.innerHeight / 2 - 20)) + "px; left:" + (window.innerWidth / responsiveCheck - 20) + "px;";
	}
}
