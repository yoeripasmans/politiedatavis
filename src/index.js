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
var isRunning = false;
var legendaCheck = false;
var legendaClickedCheck = false;
var circleSize = d3.scaleLinear().domain([0, 12]).range([8, 36]); //Scales between two number ranges
var circleTimelineDeviation = 12;
var circleTimelinePosition = d3.scaleLinear().domain([0, 150, 450, 750, 1050, 1350, 1650, 1950, 2250, 2550, 2850, 3150, 3450, 3750, 4050, 4350, 4650, 4950, 5100]).range([0, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, circleTimelineDeviation, -circleTimelineDeviation, 0]); //Scales between multiple number ranges

d3.select(window).on('resize', onResize);

var svg = d3.select("body").append("div").attr('class', 'svg-container')
	.append("svg")
	.attr("height", height)
	.attr("width", window.innerWidth)
	.append("g");

var simulation = d3.forceSimulation()
	.force("r", d3.forceRadial(10)) //This force makes sure every circle is in a radius
	.force("collide", d3.forceCollide(function(d) {
		if (window.innerWidth < 500) {
			if (d.status == "Inactief") {
				return circleSize(-2) + 2;
			} else {
				return circleSize(d.totaleSchendingen) + 2;
			}
		} else {
			return circleSize(d.totaleSchendingen) + 2;
		}
	}))
	.alpha(0.02)
	.alphaDecay(0.01);

// Prep the tooltip bits, initial display is hidden
//Append tool-tip to conainter
var tooltip = d3.select(".svg-container")
	.append("div")
	.attr("class", "tool-tip");

var pixelGrowth = {
	"plaats": 1,
	"straat": 2,
	"huis": 3,
	"verdachte": 3,
	"slachtoffer": 3,
	"beide": 6,
	"overig": 2
};

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
		.attr("class", function(d) {
			if (d.status == "Inactief") {
				return "bubble bubble--inactive";
			} else {
				return "bubble";
			}
		})
		.attr("r", function(d) {
			if (window.innerWidth < 500) {
				if (d.status == "Inactief") {
					return circleSize(-2);
				} else {
					return circleSize(d.totaleSchendingen);
				}
			} else {
				return circleSize(d.totaleSchendingen);
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
		})
		.attr("cursor", function(d) {
			if (d.status == "Normaal" || d.status == "Aangepast" || d.status == "Verwijderd") {
				return "pointer";
			} else if (d.status == "Inactief") {
				return "default";
			}
		})
		.on("click", function(d) {
			circleClickEvent(this, d);
		});

	//Run a simulation on every circle (node)
	simulation.nodes(data)
		.on('tick', movingIn) //Run movingIn on every "tick" of the clock
		.on('end', function() {});

	createIntro();
	createOverviewHeader();
    createOverviewLegend();
	onResize();

	/* __________ FUNCTIONS __________ */

	function createOverviewHeader () {
		var overviewHeaderDiv = document.createElement("div");
		overviewHeaderDiv.classList.add("overview-header");

		var overviewH1 = document.createElement("h1");
		overviewH1.classList.add("overview-header__title");
		var h1text = document.createTextNode("Privacyschendingen");
		overviewH1.appendChild(h1text);

		var overviewPar1 = document.createElement("p");
		overviewPar1.classList.add("overview-header__p-1");
		var parText1 = document.createTextNode("In de datavisualisatie is te zien in welke video’s de politievloggers teveel privacygevoelige informatie vrijgeven.");
		overviewPar1.appendChild(parText1);

		overviewHeaderDiv.appendChild(overviewH1);
		overviewHeaderDiv.appendChild(overviewPar1);

		var selectSvg = document.querySelector(".svg-container");
		document.body.insertBefore(overviewHeaderDiv, selectSvg);
	}

	function createOverviewLegend () {

        var legendItems = ["Orginele video's", "Aangepaste video's", "Verwijderde video's", "Video's zonder privacyschendingen", "Weinig privacyschendingen", "Veel privacyschendingen"];

        var overviewLegendDiv = document.createElement("div");
        overviewLegendDiv.classList.add("legend");

        var legendTitle = document.createElement("h2");
        legendTitle.classList.add("legend__title");
        legendTitle.textContent = "Legenda";
        overviewLegendDiv.appendChild(legendTitle);

        var legendItemsDiv = document.createElement("div");
        legendItemsDiv.classList.add("legend__items-container");
        overviewLegendDiv.appendChild(legendItemsDiv);

        for (var i = 0; i < 6; i++) {

			var legendItemsWrap1,
				legendItemsWrap2,
				legendItemsWrap3;

			if (i == 0) {
				legendItemsWrap1 = document.createElement("div");
				legendItemsWrap1.classList.add("legend__items-wrap");
				legendItemsDiv.appendChild(legendItemsWrap1);
			}

			if (i == 0 || i == 1) {
				var legendItem1 = document.createElement("p");
				legendItem1.classList.add("legend__item", "legend__item-" + i);
				legendItem1.textContent = legendItems[i];
				legendItemsDiv.appendChild(legendItem1);
				legendItemsWrap1.appendChild(legendItem1);
			}

			if (i == 2) {
				legendItemsWrap2 = document.createElement("div");
				legendItemsWrap2.classList.add("legend__items-wrap");
				legendItemsDiv.appendChild(legendItemsWrap2);
			}

			if (i == 2 || i == 3) {
				var legendItem2 = document.createElement("p");
				legendItem2.classList.add("legend__item", "legend__item-" + i);
				legendItem2.textContent = legendItems[i];
				legendItemsDiv.appendChild(legendItem2);
				legendItemsWrap2.appendChild(legendItem2);
			}

			if (i == 4) {
				legendItemsWrap3 = document.createElement("div");
				legendItemsWrap3.classList.add("legend__items-wrap");
				legendItemsDiv.appendChild(legendItemsWrap3);
			}

			if (i == 4 || i == 5) {
				var legendItem3 = document.createElement("p");
				legendItem3.classList.add("legend__item", "legend__item-" + i);
				legendItem3.textContent = legendItems[i];
				legendItemsDiv.appendChild(legendItem3);
				legendItemsWrap3.appendChild(legendItem3);
			}

		}

        var selectSvg = document.querySelector(".svg-container");
        document.body.insertBefore(overviewLegendDiv, selectSvg);

		overviewLegendState();
    }

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
		legendaCheck = false;

		if (window.innerWidth < 500 && circleClickedCheck == true) {
			responsiveCheck = 5;
		} else {
			responsiveCheck = 2;
		}

		document.querySelector('.open-button').classList.add("open-button--hidden");

		var circleIndex = d.index; //Index of clicked circle
		var circleTotaleEvents = d.totaleEvents; //Save the totaleEvents to another varible for later use

		if (d.status == "Normaal" || d.status == "Aangepast" || d.status == "Verwijderd") {

			tooltip.style("display", "none");
			d3.select(".overview-header").remove(); // remove overview header
            d3.select(".legend").remove(); // remove legend
			d3.select(".legend-button").remove(); // remove legend

			d3.selectAll(".bubble")
				.on('click', function() {

				})
				.on('mouseover', function() {

				})
				.on('mouseout', function() {

				})
				.on('mousemove', function() {

				})
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
				.style("margin", function(d) {
					return window.innerHeight / 2 + "px" + " auto";
				})
				.transition()
				.delay(850)
				.duration(1000)
				.style("height", function(d) {
					return (circleTotaleEvents * 300) + 300 + "px";
				});

			createEvent(circleTotaleEvents, d);

			var schendingenTotaal = [];
			for (var i = 0; i <= d.totaleEvents; i++) {
				if (i == 0) {
					schendingenTotaal[i] = 0;
				} else if (i > 0) {
					var categorie = document.querySelector(".event-" + (i - 1)).getAttribute("categorie");
					schendingenTotaal[i] = schendingenTotaal[i - 1] + pixelGrowth[categorie];
				}
			}

			//Trigger the scroll function so the circle moves back and forth
			document.querySelector('body').onscroll = function() {
				scroll(_this, d, schendingenTotaal);
			};

			//Insert backbutton
			d3.select(".svg-container").insert('button', 'svg')
				.attr('class', 'back-button')
				.on('click', function(d) {

					circleClickedCheck = false;
					responsiveCheck = 2;

					createOverviewHeader(); //creates header on overview page
                    createOverviewLegend(); // creates legend on overview page

					document.querySelector('.open-button').classList.remove("open-button--hidden");

					//Removes the function on scroll
					document.querySelector('body').onscroll = function() {};

					if (window.innerWidth < 500) {
						d3.selectAll(".bubble")
							.on('mouseover', function() {

							})
							.on('mouseout', function() {

							})
							.on('mousemove', function() {

							});
					} else {
						d3.selectAll(".bubble")
							.on("mouseover", function(d) {
								if (d.status !== "Inactief") {
									tooltip.style("display", "inline-block");
									tooltip.text(d.titel);
								}
							})
							.on("mousemove", function(d) {
								if (d.status !== "Inactief") {
									return tooltip.style("top", (d3.event.pageY - 20) + "px").style("left", (d3.event.pageX + 20) + "px");
								}
							})
							.on("mouseout", function(d) {
								if (d.status !== "Inactief") {
									tooltip.style("display", "none");
								}
							});
					}

					d3.selectAll(".bubble")
						.on("click", function(d) {
							circleClickEvent(this, d);
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
							if (window.innerWidth < 500) {
								if (d.status == "Inactief") {
									return circleSize(-2);
								} else {
									return circleSize(d.totaleSchendingen);
								}
							} else {
								return circleSize(d.totaleSchendingen);
							}
						});

					d3.select(".line").remove(); //Remove timeline
					d3.select(".back-button").remove(); //Remove backbutton
					d3.select(".header").remove(); // remove header

					simulation
						.force("r", d3.forceRadial(function(d) {
							return 0;
						}).strength(0.005))
						.force("collide", d3.forceCollide(function(d) {
							if (window.innerWidth < 500) {
								if (d.status == "Inactief") {
									return circleSize(-2) + 2;
								} else {
									return circleSize(d.totaleSchendingen) + 2;
								}
							} else {
								return circleSize(d.totaleSchendingen) + 2;
							}
						}))
						.alpha(0.15)
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


		if (isRunning == false) {
			return animationLoop(_this);
		}

		function animationLoop(_this) {

			//Shake animation
			var horizontalPosition = Number(_this.getAttribute("cx")),
				shakeDuration = 80,
				shakeDeviation = 4,
				shakeEasing = d3.easeCubicOut;

			isRunning = true;

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

			setTimeout(runningFalse, 500);

			function runningFalse() {
				isRunning = false;
			}
		}
	}

	function scroll(_this, d, schendingenTotaal) {

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
				}
				for (var i = 0; i < d.totaleEvents; i++) {
					if (window.pageYOffset >= i * 300 && window.pageYOffset < i * 300 + 300) {
						return circleSize(schendingenTotaal[i]);
					}
				}
				if (window.pageYOffset >= d.totaleEvents * 300) {
					return circleSize(schendingenTotaal[d.totaleEvents]);
				}
			});

		var popup = document.querySelectorAll('.popup');

		if (window.pageYOffset > 10) {
			document.querySelector('.popup--explanation').classList.add("popup--hidden");
		} else {
			document.querySelector('.popup--explanation').classList.remove("popup--hidden");
		}

		for (var i = 1; i <= popup.length; i++) {

			if (window.pageYOffset >= i * 300) {
				popup[i - 1].classList.remove("popup--hidden");
			} else if (window.pageYOffset < i * 300) {
				popup[i - 1].classList.add("popup--hidden");
			}
		}

		if (window.pageYOffset >= popup.length * 300 + 290) {
			document.querySelector('.popup--end').classList.remove("popup--hidden");
		} else if (window.pageYOffset < popup.length * 300 + 290) {
			document.querySelector('.popup--end').classList.add("popup--hidden");
		}
	}
});

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
	popupExplanation.classList.add("popup--explanation", "popup--hidden");

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
		eventContainer.classList.add("event-container", "event-" + i);
		popup.classList.add("popup", "popup--hidden");
		eventContainer.appendChild(circle);
		eventContainer.appendChild(popup);


		circle.classList.add("circle", "circle--hidden", "circle--" + categorieIndex[selectedSchending]);
		eventContainer.setAttribute("categorie", categorieIndex[selectedSchending]);
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
	EndDescription.innerHTML = "Einde van de video.";
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

	for (i = 0; i < circleTotaleEvents; i++) {
		//create a p for the time
		var time = document.createElement("p");
		time.classList.add("popup__time");

		var timeText = document.createTextNode(popups[i].parentNode.getAttribute("tijd"));
		time.appendChild(timeText);

		popups[i].appendChild(time);

		//Create a <p> for the description
		var description = document.createElement("p");
		eventsContainers[i].appendChild(popups[i]);
		popups[i].appendChild(description);
		description.innerHTML = description.parentNode.parentNode.getAttribute("beschrijving");
		description.classList.add("popup__description");

		//Adds image button
		if (eventsContainers[i].getAttribute("screenshot") !== "undefined") {
			var imgButton = document.createElement("button");
			popups[i].appendChild(imgButton);
			imgButton.textContent = "Afbeelding bekijken";
			imgButton.classList.add("popup__image-button");
			imgButton.addEventListener("click", function() {
				createImg(this);
			});
		}

	}

	function createImg(_this) {
		var img = document.createElement("div");
		var closeButton = document.createElement("button");
		document.querySelector('body').appendChild(closeButton);
		document.querySelector('body').appendChild(img);
		closeButton.classList.add("close-button");
		closeButton.innerHTML = "Afbeelding sluiten";
		closeButton.addEventListener('click', function() {
			document.querySelector('body').removeChild(closeButton);
			document.querySelector('body').removeChild(img);
		});
		img.classList.add("popup__image");
		img.style.backgroundImage = "url('assets/images/frames/" + _this.parentNode.parentNode.getAttribute("screenshot") + ".jpg')";
	}

	//Animate the event circles in
	setTimeout(function() {
		var events = document.querySelectorAll(".circle");
		for (i = 0; i < events.length; i++) {
			events[i].classList.toggle("circle--hidden");
		}
		document.querySelector(".popup--explanation").classList.remove("popup--hidden");
	}, 1000);

} //End createEvent function

function createIntro() {
	var currentSlideID = 0;
	var animatePos = 0;


	var images = ["uitleg_3", "uitleg_2", "uitleg_1"];
	var text = ["Elke cirkel straat voor één video. Je kunt op de gekleurde cirkels klikken om de tijdlijn van een video te bekijken voor meer informatie.", "Als je door de tijdlijn heen scrollt krijg je de verschillende privacyschendingen te zien. Hierdoor zal de cirkel ook groeien.", "Vervolgens kan je een screenshot bekijken om te zien hoe de schending plaatsvond. Uiteraard zijn deze dit keer wel onherkenbaar gemaakt."];

	var slidesLength = images.length;
	var sliderWidth = slidesLength * containerWidth;

	var introContainer = document.createElement("div");
	document.querySelector('body').appendChild(introContainer);
	introContainer.classList.add("intro-container", "intro-container--hidden");

	var introBox = document.createElement("div");
	introContainer.appendChild(introBox);
	introBox.classList.add("box");

	var introBoxHeader = document.createElement("header");
	introBox.appendChild(introBoxHeader);
	introBoxHeader.classList.add("box-header");

	var introBoxHeaderTitle = document.createElement("h1");
	introBoxHeader.appendChild(introBoxHeaderTitle);
	introBoxHeaderTitle.textContent = "Uitleg";
	introBoxHeaderTitle.classList.add("box-header__title");

	var introBoxContainer = document.createElement("div");
	introBox.appendChild(introBoxContainer);
	introBoxContainer.classList.add("box-container");

	var sliderControlsContainer = document.createElement("div");
	introBox.appendChild(sliderControlsContainer);
	sliderControlsContainer.classList.add("slider-controls");

	var prevButton = document.createElement("button");
	sliderControlsContainer.appendChild(prevButton);
	prevButton.textContent = "Vorige";
	prevButton.classList.add("slider-controls__prev-button");
	prevButton.addEventListener('click', animatePrev);

	var nextButton = document.createElement("button");
	sliderControlsContainer.appendChild(nextButton);
	nextButton.textContent = "Volgende stap";
	nextButton.classList.add("slider-controls__next-button");
	nextButton.addEventListener('click', animateNext);

	var openButton = document.createElement("button");
	document.querySelector('body').appendChild(openButton);
	openButton.classList.add("open-button");
	openButton.addEventListener('click', openSlider);

	var closeButton = document.createElement("button");
	document.querySelector('.box-header').appendChild(closeButton);
	closeButton.classList.add("box-header__close-button", "back-button");
	closeButton.addEventListener('click', closeSlider);

	var containerWidth = document.querySelector('.box').offsetWidth;

	//Makes three slides
	for (var i = 0; i < slidesLength; i++) {

		var contentContainer = document.createElement("div");
		introBoxContainer.appendChild(contentContainer);
		contentContainer.classList.add("box-content");

		var introImg = document.createElement("div");
		contentContainer.appendChild(introImg);
		introImg.classList.add("box-content__img");
		introImg.style.backgroundImage = "url('assets/images/uitleg/" + images[i] + ".gif')";

		var introDesc = document.createElement("p");
		contentContainer.appendChild(introDesc);
		introDesc.classList.add("box-content__desc");
		introDesc.textContent = text[i];
	}

	function openSlider(e) {
		e.stopPropagation();
		e.preventDefault();
		introContainer.classList.add("intro-container--open");
		introContainer.classList.remove("intro-container--hidden");
		currentSlideID = 0;
		animatePos = containerWidth * currentSlideID;
		containerWidth = document.querySelector('.box').offsetWidth;
		sliderNavIcons();
		initPos();
	}

	function closeSlider() {
		document.querySelector('.intro-container').classList.add("intro-container--hidden");
		document.querySelector('.intro-container').classList.remove("intro-container--open");
		sliderNavIcons();
		initPos();
	}

	function setSliderWidth() {
		sliderWidth = slidesLength * containerWidth;
		animatePos = containerWidth * currentSlideID;
		introBoxContainer.style.width = 300 + '%';
		introBoxContainer.style.transform = 'translateX(-' + animatePos + 'px)';
	}

	function animateNext() {
		if (currentSlideID < (slidesLength - 1)) {
			currentSlideID++;
			animatePos = containerWidth * currentSlideID;
			introBoxContainer.style.transform = 'translateX(-' + animatePos + 'px)';
			sliderNavIcons();
		} else {
			closeSlider();
		}

	}

	function animatePrev() {
		if (currentSlideID > 0) {
			currentSlideID--;
			animatePos = containerWidth * currentSlideID;
			introBoxContainer.style.transform = 'translateX(-' + animatePos + 'px)';
			sliderNavIcons();
		}
	}

	function sliderNavIcons() {
		if (currentSlideID === 0) {
			prevButton.style.display = 'none';
		} else {
			prevButton.style.display = 'inline';
		}

		if (currentSlideID >= (slidesLength - 1)) {
			nextButton.textContent = "Naar visualisatie";

		} else {
			nextButton.textContent = "Volgende stap";
		}

	}

	function initPos() {
		animatePos = containerWidth * currentSlideID;
		introBoxContainer.style.transform = 'translateX(-' + animatePos + 'px)';
	}

	setSliderWidth();

}

function onResize() {

	if (window.innerWidth < 500) {

		d3.selectAll(".bubble")
			.on('mouseover', function() {

			})
			.on('mouseout', function() {

			})
			.on('mousemove', function() {

			});
	} else if (window.innerWidth >= 500 && circleClickedCheck == false) {

		d3.selectAll(".bubble")
			.on("mouseover", function(d) {
				if (d.status !== "Inactief") {
					tooltip.style("display", "inline-block");
					tooltip.text(d.titel);
				}
			})
			.on("mousemove", function(d) {
				if (d.status !== "Inactief") {
					return tooltip.style("top", (d3.event.pageY - 20) + "px").style("left", (d3.event.pageX + 20) + "px");
				}
			})
			.on("mouseout", function(d) {
				if (d.status !== "Inactief") {
					tooltip.style("display", "none");
				}
			});
	}

	d3.selectAll(".bubble--inactive")
		.attr("r", function(d) {
			if (window.innerWidth < 500) {
				if (d.status == "Inactief") {
					return circleSize(-2);
				}
			} else {
				if (d.status == "Inactief") {
					return circleSize(d.totaleSchendingen);
				}
			}
		});

	simulation
		.force("collide", d3.forceCollide(function(d) {
			if (window.innerWidth < 500) {
				if (d.status == "Inactief") {
					return circleSize(-2) + 2;
				} else {
					return circleSize(d.totaleSchendingen) + 2;
				}
			} else {
				return circleSize(d.totaleSchendingen) + 2;
			}
		}))
		.alpha(0.02)
		.alphaDecay(0.015) //Makes sure the alpha doesn't decay too quickly so the clicked circle gets to the middle
		.restart();

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

	if (circleClickedCheck == true) {
		d3.select(".line")
			.style("margin", function(d) {
				return window.innerHeight / 2 + "px" + " auto";
			});
	}

	overviewLegendState();

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

function closeLegend() {
	//Show button
	document.querySelector(".legend-button").classList.remove("legend-button--hidden");

	//Hide legend
	document.querySelector(".legend").classList.add("legend--hidden");

	//remove overlay
	document.querySelector(".overlay").remove();

	// remove close button
	document.querySelector(".legend-close-button").remove();

	legendaClickedCheck = false;
}

function overviewLegendState() {

	if (window.innerWidth < 650 && circleClickedCheck == false && legendaCheck == false) {

		document.querySelector(".legend").classList.add("legend--overlay", "legend--hidden");

		var legendButton = document.createElement("button");
		legendButton.classList.add("legend-button");
		legendButton.textContent = "Legenda";
		document.querySelector("body").appendChild(legendButton);

		d3.select(".legend-button")
			.on("click", function() {

				legendaClickedCheck = true;
				//Hide button
				document.querySelector(".legend-button").classList.add("legend-button--hidden");

				//Show legend
				document.querySelector(".legend").classList.remove("legend--hidden");

				//Add overlay
				var overlayLegend = document.createElement("div");
				overlayLegend.classList.add("overlay");
				document.querySelector("body").appendChild(overlayLegend);

				//Add close button
				var closeButton = document.createElement("button");
				document.querySelector('.legend').appendChild(closeButton);
				closeButton.classList.add("legend-close-button");
				closeButton.addEventListener('click', closeLegend);
			});

		legendaCheck = true;

	} else if (window.innerWidth >= 650 && legendaCheck == true){

		document.querySelector(".legend").classList.remove("legend--overlay", "legend--hidden");
		document.querySelector(".legend-button").remove();

		if (legendaClickedCheck == true) {
			// //remove overlay
			document.querySelector(".overlay").remove();
			//
			// // remove close button
			document.querySelector(".legend-close-button").remove();

			legendaClickedCheck = false;
		}

		legendaCheck = false;
	}
}
