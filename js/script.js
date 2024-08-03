// ******* DATA LOADING *******

async function loadData () {
  const covidData = await d3.csv('data/owid-covid.csv');
  const mapData = await d3.json('data/world.json');
  const groupData = await d3.json('data/grouped.json');
  console.log('Here is the imported groupData:', groupData);
  return { covidData, mapData };
}


// ******* STATE MANAGEMENT *******
// This should be all you need, but feel free to add to this if you need to 
// communicate across the visualizations
const globalApplicationState = {
  selectedLocations: [],
  covidData: null,
  mapData: null,
  worldMap: null,
  lineChart: null,
  // pieChart: null,
};

//******* APPLICATION MOUNTING *******
loadData().then((loadedData) => {
  console.log('Here is the imported data:', loadedData.covidData);
  console.log('Here is the imported world data:', loadedData.mapData);

  // Store the loaded data into the globalApplicationState
  globalApplicationState.covidData = loadedData.covidData;
  globalApplicationState.mapData = loadedData.mapData;
  

  // Creates the view objects with the global state passed in 
  const worldMap = new MapVis(globalApplicationState);
  const lineChart = new LineChart(globalApplicationState);
  // const pieChart = new PieChart(globalApplicationState);

  globalApplicationState.worldMap = worldMap;
  globalApplicationState.lineChart = lineChart;
  // globalApplicationState.pieChart = pieChart;

  //TODO add interactions for Clear Selected Countries button
    // This clears a selection by listening for a click
  document.addEventListener("click", function(e) {
      e.stopPropagation();
      let clickCountry = e.target.id;
      if (clickCountry == 'clear-button') {
        console.log('Clear all country');
        globalApplicationState.worldMap.clearSelectedCountries();
        globalApplicationState.lineChart.drawContinents();
        // globalApplicationState.pieChart.updateChart();
      } else {
        console.log('Click country', clickCountry);
        globalApplicationState.worldMap.updateSelectedCountries(clickCountry);
        globalApplicationState.lineChart.updateSelectedCountries(clickCountry);
        // globalApplicationState.pieChart.updateChart();
      }
  });
});
