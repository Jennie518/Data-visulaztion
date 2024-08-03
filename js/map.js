
class CountryData {
  /**
   *
   * @param type refers to the geoJSON type- countries are considered features
   * @param properties contains the value mappings for the data
   * @param geometry contains array of coordinates to draw the country paths
   * @param region the country region
   */
  constructor(type, id, properties, geometry, total_cases_per_million) {
      this.type = type;
      this.id = id;
      this.properties = properties;
      this.geometry = geometry;
      this.total_cases_per_million = total_cases_per_million;
  }
}

/** Class representing the map view. */
class MapVis {
  /**
   * Creates a Map Visuzation
   * @param globalApplicationState The shared global application state (has the data and the line chart instance in it)
   */
  constructor(globalApplicationState) {
    this.globalApplicationState = globalApplicationState;

    console.log("in construct", globalApplicationState.mapData);
    
    // Set up the map projection
    const projection = d3.geoWinkel3()
      .scale(150) // This set the size of the map
      .translate([400, 250]); // This moves the map to the center of the SVG

    let svg = d3.select("#map");
    // This converts the projected lat/lon coordinates into an SVG path string
    let pathGeojson = d3.geoPath().projection(projection);

    let geojson = topojson.feature(globalApplicationState.mapData, 
        globalApplicationState.mapData.objects.countries);

    let covidDataArray = globalApplicationState.covidData;

    let covidDataMap = new Map();
    let idx = 0;
    while (idx < covidDataArray.length) {
      let tcpm = parseFloat(covidDataArray[idx].total_cases_per_million);
      let id = covidDataArray[idx].iso_code;
      if (covidDataMap.has(id)) {
        let prev = covidDataMap.get(id);
        if (tcpm > prev || isNaN(prev)) {
          covidDataMap.set(id, tcpm);
        }
      } else {
        covidDataMap.set(id, tcpm);
      }
      idx += 1;
    }

    let max_total_cases_per_million = 0;
    let min_total_cases_per_million = 0;
    for (const [key, value] of covidDataMap) {
      if (value > max_total_cases_per_million) {
        max_total_cases_per_million = value;
      }
      if (value < min_total_cases_per_million) {
        min_total_cases_per_million = value;
      }
    }

    console.log("covidDataArray size:", covidDataMap.size);
    let cnt = 0;

    let countryData = geojson.features.map(country => {
      let total_cases_per_million = 0.0;
      if (country.id == "LBY") {
        console.log("lby", country);
      }
      if (covidDataMap.has(country.id)) {
          total_cases_per_million = covidDataMap.get(country.id);
          if (isNaN(total_cases_per_million)) {
            total_cases_per_million = 0.0;
          }
          //console.log('found total_cases_per_million:', total_cases_per_million);
          return new CountryData(country.type, country.id, country.properties, 
                country.geometry, total_cases_per_million);
      } else {
          //console.log('not found country:', country);
          return new CountryData(country.type, country.id, country.properties,
                country.geometry, total_cases_per_million);
      }
    });

   // console.log("countryData len:", CountryData.length, "cnt:", cnt);

    console.log(`max_total_cases_per_million ${max_total_cases_per_million}:`);
    console.log(`min_total_cases_per_million ${min_total_cases_per_million}:`);
    // Define a color scale, for example using d3.scaleQuantize
    let colorScale = d3.scaleLinear()
      .domain([0, max_total_cases_per_million])
      .range(['#E0F7E0', '#006400']); // Adjust the color range as needed

    svg.selectAll("path")
      .data(countryData)
      .enter()
      .append("path")
      .attr("d", pathGeojson)
      .classed("countries", true)
      .classed("boundary", true)
      .attr("id", d => d.id)
      .attr("fill", d => {
        const cases = d.total_cases_per_million;
        //console.log("case:", d.total_cases_per_million);
        return colorScale(cases);
      })
      .attr("stroke", "black") // Add a black stroke
      .attr("stroke-width", 0.1); // You can adjust the stroke width as needed

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
    // Create the legend rect with the linear gradient
    svg.append("rect")
        .attr("x", 10)
        .attr("y", height - 70)
        .attr("width", 150)
        .attr("height", 20)
        .style("fill", "url(#legend-gradient)");

    // Create text elements for legend labels
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
