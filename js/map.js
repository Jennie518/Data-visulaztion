class CountryData {
  /***
   * @param type geoJSON type- countries are features
   * @param properties contains the value mappings for the data
  * @param geometry contains array of coordinates to draw the country paths
  * @param region the country region
   * @param name the country name for tooltip
   */
  constructor(type, id, properties, geometry, total_cases_per_million, name) {
    this.type = type;
    this.id = id;
    this.properties = properties;
    this.geometry = geometry;
    this.total_cases_per_million = total_cases_per_million;
    this.name = name;
  }
}


// map view
class MapVis {
  constructor(globalApplicationState) {
    this.globalApplicationState = globalApplicationState;

    console.log("Constructing...", globalApplicationState.mapData);

    // Set up the map projection
    const projection = d3.geoWinkel3()
      .scale(150)
      .translate([400, 250]);

    let svg = d3.select("#map");
    const tooltip = d3.select("#tooltip");
    let pathGeojson = d3.geoPath().projection(projection);

    let geojson = topojson.feature(globalApplicationState.mapData, globalApplicationState.mapData.objects.countries);

    let covidDataArray = globalApplicationState.covidData;

    let covidDataMap = new Map();
    covidDataArray.forEach(item => {
      let tcpm = parseFloat(item.total_cases_per_million);
      if (!isNaN(tcpm)) {
        covidDataMap.set(item.iso_code, Math.max(tcpm, covidDataMap.get(item.iso_code) || 0));
      }
    });

    let max_total_cases_per_million = d3.max([...covidDataMap.values()]);

    let countryData = geojson.features.map(country => {
      let total_cases_per_million = covidDataMap.get(country.id) || 0.0;
      let countryName = covidDataArray.find(item => item.iso_code === country.id)?.location || "Unknown";
      return new CountryData(country.type, country.id, country.properties, country.geometry, total_cases_per_million, countryName);
    });

    let colorScale = d3.scaleLinear()
      .domain([0, max_total_cases_per_million])
      .range(['#E0F7E0', '#006400']);

      // Display the country name when mouse hovers over
    function mouseover(event, d) {
      tooltip.style("visibility", "visible")
        .text(d.name); 
    }

    function mousemove(event) {
      tooltip.style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    }

    function mouseout() {
      tooltip.style("visibility", "hidden");
    }

    svg.selectAll("path")
      .data(countryData)
      .enter()
      .append("path")
      .attr("d", pathGeojson)
      .classed("countries", true)
      .classed("boundary", true)
      .attr("id", d => d.id)
      .attr("fill", d => colorScale(d.total_cases_per_million))
      .attr("stroke", "black")
      .attr("stroke-width", 0.1)
      .on("mouseover", mouseover)
      .on("mousemove", mousemove)
      .on("mouseout", mouseout);

    //formation of outlines and boundaries using outline
    let mapGraticule = d3.geoGraticule();

    svg.append("path")
      .datum(mapGraticule)
      .attr("class", "graticule")
      .attr("d", pathGeojson);

    svg.append("path")
      .datum(mapGraticule.outline)
      .classed("strokeGraticule", true)
      .attr("d", pathGeojson);

    // legend
    // Define linear gradient with color stops based on the color scale
    const legendGradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "legend-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");

    // Define color stops for the gradient based on the color scale
    legendGradient.append("stop")
      .attr("offset", "0%")
      .style("stop-color", colorScale(0))
      .style("stop-opacity", 1);

    legendGradient.append("stop")
      .attr("offset", "100%")
      .style("stop-color", colorScale(max_total_cases_per_million))
      .style("stop-opacity", 1);

    let height = 550;
    // legend rect with the linear gradient
    svg.append("rect")
      .attr("x", 10)
      .attr("y", height - 70)
      .attr("width", 150)
      .attr("height", 20)
      .style("fill", "url(#legend-gradient)");

    // text elements for legend labels
    svg.append("text")
      .attr("x", 10)
      .attr("y", height - 75)
      .text("0")

    svg.append("text")
      .attr("x", 100)
      .attr("y", height - 75)
      .text(`${Math.ceil(max_total_cases_per_million)}`);
  }

  updateSelectedCountries(country) {
    if (country == '') {
      return;
    }

    // Clear previous selections
    this.clearSelectedCountries();

    // Add the new selection
    this.globalApplicationState.selectedLocations.push(country);
    console.log("select:", country);
    d3.select("#" + country)
      .classed("selected", true);
  }

  clearSelectedCountries() {
    for (let i = 0; i < this.globalApplicationState.selectedLocations.length; i += 1) {
      d3.select("#" + this.globalApplicationState.selectedLocations[i])
        .classed("selected", false);
    }
    this.globalApplicationState.selectedLocations.splice(0);
  }
}
