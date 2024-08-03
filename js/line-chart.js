/** Class representing the line chart view. */
class LineChart {
  /**
   * Creates a LineChart
   * @param globalApplicationState The shared global application state (has the data and map instance in it)
   */
  constructor(globalApplicationState) {
    // Set some class-level variables
    this.globalApplicationState = globalApplicationState;

    let owidCovidData = globalApplicationState.covidData;
    // Filter data to get continents only
    const continentsData = owidCovidData.filter(d => d.iso_code.startsWith('OWID'));

    console.log("continentsData", continentsData);
    // Group data by continents and then by location
    this.groupedData = d3.group(continentsData, d => d.location);
    console.log("groupedData", this.groupedData);

    const countriesData = owidCovidData.filter(d => !d.iso_code.startsWith('OWID'));
    this.groupDataCountriesData = d3.group(countriesData, d => d.iso_code);
    console.log("countriesData", countriesData);
    console.log("groupDataCountriesData", this.groupDataCountriesData);

    const lineChartElement = document.getElementById("line-chart");
    const computedStyle = window.getComputedStyle(lineChartElement);
    const widthStr = computedStyle.getPropertyValue("width");
    const heightStr = computedStyle.getPropertyValue("height");

    // Removes "px" and converts to a number
    this.width = parseInt(widthStr, 10);
    this.height = parseInt(heightStr, 10);
    this.margin = { top: 20, right: 20, bottom: 50, left: 70 };

    this.width = this.width - this.margin.left - this.margin.right;
    this.height = this.height - this.margin.top - this.margin.bottom;
    console.log("Width:", this.width);
    console.log("Height:", this.height);
    this.selectedColor = [];
    this.maxColors = 20;
    // Define an array of colors
    this.colors = ['red', 'blue', 'green', 'orange', 'purple', 
      'pink', 'brown', 'cyan', 'magenta', 'lavender', 'teal', 'indigo', 
      'violet', 'salmon', 'olive', 'maroon', 'grey', 'navy', 'black', 'yellow'];

    // Bind the updateSelectedCountries method to this context
    this.updateSelectedCountries = this.updateSelectedCountries.bind(this);

    // Initialize with an empty graph
    this.clearAxisesAndLines();
  }

  // Choose a color ensuring no repetition
  chooseColorWithNoRepetition() {
    for (let i = 0; i < this.colors.length; i += 1) {
      if (!this.selectedColor.includes(i)) {
        this.selectedColor.push(i);
        return this.colors[i];
      }
    }
    console.log("all colors are selected");
    this.selectedColor.splice(0, this.maxColors);
    for (let i = 0; i < this.colors.length; i += 1) {
      if (!this.selectedColor.includes(i)) {
        this.selectedColor.push(i);
        return this.colors[i];
      }
    }
    return 0;
  }

  clearAllCorlor() {
    this.selectedColor.splice(0);
  }

  drawGraph(countryCode) {
    this.clearAxisesAndLines();

    let data = this.groupDataCountriesData.get(countryCode);
    if (!data) {
      console.log("No data for selected country:", countryCode);
      return;
    }

    // Process data for the selected country
    data.forEach(d => d.date = new Date(d.date));

    // Get date extent and max cases per million
    const dateExtent = d3.extent(data, d => d.date);
    const maxCasesPerMillion = d3.max(data, d => d.total_cases_per_million);

    // Create scales
    const xScale = d3.scaleTime().domain(dateExtent).range([0, this.width]);
    const yScale = d3.scaleLinear().domain([0, maxCasesPerMillion]).range([this.height, 0]);

    // Create x and y axes
    const svgXAxis = d3.select("#x-axis")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    svgXAxis.append("g")
      .attr("transform", `translate(0,${this.height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y")))
      .attr("class", "text");

    const svgYAxis = d3.select("#y-axis")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    svgYAxis.append("g").call(d3.axisLeft(yScale));

    // Create line generator
    const line = d3.line()
      .x(d => xScale(d.date))
      .y(d => yScale(d.total_cases_per_million));

    // Draw the line for the selected country
    const svgLines = d3.select("#lines")
      .append("svg")
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    const color = this.chooseColorWithNoRepetition();

    svgLines.append("path")
      .datum(data)
      .attr("class", "line line-chart-setting")
      .attr("d", line)
      .attr("stroke", color);

   
  }


  clearAxisesAndLines() {
    this.clearAllCorlor();
    d3.select("#x-axis").selectAll("*").remove();
    d3.select("#y-axis").selectAll("*").remove();
    d3.select("#lines").selectAll("*").remove();
    
  }

  updateSelectedCountries(clickedCountry) {
    this.clearAxisesAndLines();
    this.drawGraph(clickedCountry);
  }
}