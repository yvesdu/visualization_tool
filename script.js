// DOM elements
const departmentFilter = document.getElementById("departmentFilter");
const regionFilter = document.getElementById("regionFilter");
const genderFilter = document.getElementById("genderFilter");

// Load the data from data.json
let dataset = [];

// Fetch data from data.json
fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    dataset = data;
    initializeFilters();
    updateVisualizations();
  })
  .catch((error) => {
    console.error("Error fetching data:", error);
    alert("Error loading data. Please try again later.");
  });

// Initialize filters after data is loaded
function initializeFilters() {
  populateFilters();
  // Event listeners for filters
  departmentFilter.addEventListener("change", updateVisualizations);
  regionFilter.addEventListener("change", updateVisualizations);
  genderFilter.addEventListener("change", updateVisualizations);
}

function populateFilters() {
  // Clear existing options
  clearSelectOptions(departmentFilter);
  clearSelectOptions(regionFilter);
  clearSelectOptions(genderFilter);

  // Add 'All' option
  // addSelectOption(departmentFilter, "All");
  // addSelectOption(regionFilter, "All");
  // addSelectOption(genderFilter, "All");

  // Get unique values from dataset
  const departments = [...new Set(dataset.map((d) => d.Department))];
  const regions = [...new Set(dataset.map((d) => d.Region))];
  const genders = [...new Set(dataset.map((d) => d.Gender))];

  // Populate department filter
  departments.forEach((dept) => addSelectOption(departmentFilter, dept));

  // Populate region filter
  regions.forEach((region) => addSelectOption(regionFilter, region));

  // Populate gender filter
  genders.forEach((gender) => addSelectOption(genderFilter, gender));
}

function clearSelectOptions(selectElement) {
  while (selectElement.options.length > 1) {
    selectElement.remove(1);
  }
}

function addSelectOption(selectElement, value) {
  const option = document.createElement("option");
  option.value = value;
  option.text = value;
  selectElement.add(option);
}

// Apply filters to the dataset
function applyFilters(data) {
  let filteredData = data;
  const selectedDept = departmentFilter.value;
  const selectedRegion = regionFilter.value;
  const selectedGender = genderFilter.value;

  if (selectedDept !== "All") {
    filteredData = filteredData.filter((d) => d.Department === selectedDept);
  }
  if (selectedRegion !== "All") {
    filteredData = filteredData.filter((d) => d.Region === selectedRegion);
  }
  if (selectedGender !== "All") {
    filteredData = filteredData.filter((d) => d.Gender === selectedGender);
  }
  return filteredData;
}

// Update all visualizations
function updateVisualizations() {
  const filteredData = applyFilters(dataset);
  drawBarChart(filteredData);
  drawLineChart(filteredData);
  drawPieChart(filteredData);
  drawStackedBarChart(filteredData);
}

// Bar Chart - Average Rank Level by Race
function drawBarChart(data) {
  const container = document.getElementById("barChartContainer");

  // Remove any existing SVG element
  d3.select(container).select("svg").remove();

  // Set fixed dimensions
  const width = 450;
  const height = 350;
  const margin = { top: 50, right: 20, bottom: 100, left: 70 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  // Create a new SVG element
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const chartArea = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const races = [...new Set(data.map((d) => d.Race))];
  const rankLevels = {
    Junior: 1,
    Mid: 2,
    Senior: 3,
    Manager: 4,
    Director: 5,
    VP: 6,
  };

  const raceData = d3.rollup(
    data,
    (v) => ({
      avgRank: d3.mean(v, (d) => rankLevels[d.Rank]),
      count: v.length,
    }),
    (d) => d.Race
  );

  const dataArray = Array.from(raceData, ([Race, values]) => ({
    Race,
    ...values,
  }));

  // Create scales
  const xScale = d3
    .scaleBand()
    .domain(dataArray.map((d) => d.Race))
    .range([0, chartWidth])
    .padding(0.4);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(dataArray, (d) => d.avgRank) + 1])
    .range([chartHeight, 0]);

  // Create axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).ticks(6);

  // Append axes
  chartArea
    .append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  chartArea.append("g").call(yAxis);

  // Add axis labels
  chartArea
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", chartHeight + margin.bottom - 70)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Race");

  chartArea
    .append("text")
    .attr("x", -chartHeight / 2)
    .attr("y", -margin.left + 20)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Average Rank Level");

  // Create tooltip
  const tooltip = d3.select("#barChartTooltip");

  // Define color scale
  const colorScale = d3.scaleOrdinal().domain(races).range(d3.schemeSet2);

  // Draw bars
  chartArea
    .selectAll(".bar")
    .data(dataArray)
    .enter()
    .append("rect")
    .attr("class", "bar focusable")
    .attr("x", (d) => xScale(d.Race))
    .attr("y", (d) => yScale(d.avgRank))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => chartHeight - yScale(d.avgRank))
    .attr("fill", (d) => colorScale(d.Race))
    .attr("tabindex", 0)
    .on("mouseover focus", function (event, d) {
      d3.select(this).style("fill", "orange");
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          `<strong>Race:</strong> ${d.Race}<br>
                          <strong>Avg Rank Level:</strong> ${d.avgRank.toFixed(
                            2
                          )}<br>
                          <strong>Employees:</strong> ${d.count}`
        )
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout blur", function (d) {
      d3.select(this).style("fill", colorScale(d.Race));
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Add title
  chartArea
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("class", "title")
    .text("Average Rank Level by Race");
}

// Line Chart - Promotion Rate Over Tenure
function drawLineChart(data) {
  const container = document.getElementById("lineChartContainer");
  d3.select(container).select("svg").remove();

  // Set fixed dimensions
  const width = 500;
  const height = 400;
  const margin = { top: 50, right: 100, bottom: 50, left: 70 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const chartArea = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const races = [...new Set(data.map((d) => d.Race))];

  // Group data by race and years of tenure
  const raceTenureData = d3.rollups(
    data,
    (v) => v.length,
    (d) => d.Race,
    (d) => d.YearsOfTenure
  );

  const maxTenure = d3.max(data, (d) => d.YearsOfTenure);

  // Create scales
  const xScale = d3.scaleLinear().domain([0, maxTenure]).range([0, chartWidth]);

  const yScale = d3
    .scaleLinear()
    .domain([0, d3.max(raceTenureData, (race) => d3.max(race[1], (d) => d[1]))])
    .range([chartHeight, 0]);

  // Create axes
  const xAxis = d3.axisBottom(xScale).ticks(6);
  const yAxis = d3.axisLeft(yScale).ticks(6);

  // Append axes
  chartArea
    .append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(xAxis);

  chartArea.append("g").call(yAxis);

  // Add axis labels
  chartArea
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", chartHeight + margin.bottom - 10)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Years of Tenure");

  chartArea
    .append("text")
    .attr("x", -chartHeight / 2)
    .attr("y", -margin.left + 20)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Number of Employees");

  // Define color scale
  const colorScale = d3.scaleOrdinal().domain(races).range(d3.schemeSet2);

  // Line generator
  const line = d3
    .line()
    .x((d) => xScale(d[0]))
    .y((d) => yScale(d[1]));

  // Tooltip
  const tooltip = d3.select("#lineChartTooltip");

  // Draw lines
  raceTenureData.forEach((raceGroup) => {
    const raceName = raceGroup[0];
    let tenureData = raceGroup[1];
    tenureData = tenureData.sort((a, b) => a[0] - b[0]); // Sort by tenure

    chartArea
      .append("path")
      .datum(tenureData)
      .attr("fill", "none")
      .attr("stroke", colorScale(raceName))
      .attr("stroke-width", 2)
      .attr("d", line)
      .on("mouseover", function (event) {
        d3.select(this).style("stroke-width", 4);
        tooltip.transition().duration(200).style("opacity", 0.9);
        tooltip
          .html(`<strong>Race:</strong> ${raceName}`)
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).style("stroke-width", 2);
        tooltip.transition().duration(500).style("opacity", 0);
      });
  });

  // Add title
  chartArea
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("class", "title")
    .text("Promotion Rate Over Tenure by Race");

  // Add legend
  const legend = chartArea
    .append("g")
    .attr("transform", `translate(${chartWidth + 20}, 0)`);

  races.forEach((race, index) => {
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", index * 20)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", colorScale(race));

    legend
      .append("text")
      .attr("x", 25)
      .attr("y", index * 20 + 13)
      .text(race);
  });
}

// Pie Chart - Employee Distribution by Race
function drawPieChart(data) {
  const container = document.getElementById("pieChartContainer");
  d3.select(container).select("svg").remove();
  const legendContainer = document.getElementById("pieChartLegend");
  legendContainer.innerHTML = "";

  // Set fixed dimensions
  const width = 500;
  const height = 400;
  const radius = Math.min(width, height) / 2 - 50;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  // Prepare data
  const raceDeptData = d3.rollup(
    data,
    (v) => v.length,
    (d) => d.Race
  );

  const dataArray = Array.from(raceDeptData, ([Race, count]) => ({
    Race,
    count,
  }));
  const races = dataArray.map((d) => d.Race);

  // Set up the pie generator
  const pie = d3
    .pie()
    .value((d) => d.count)
    .sort(null);

  const arcs = pie(dataArray);

  // Define color scale
  const colorScale = d3.scaleOrdinal().domain(races).range(d3.schemeSet2);

  // Define arc generator
  const arc = d3.arc().innerRadius(0).outerRadius(radius);

  // Tooltip
  const tooltip = d3.select("#pieChartTooltip");

  // Draw slices
  svg
    .selectAll("path")
    .data(arcs)
    .enter()
    .append("path")
    .attr("d", arc)
    .attr("fill", (d) => colorScale(d.data.Race))
    .attr("stroke", "#fff")
    .attr("stroke-width", "2px")
    .on("mouseover", function (event, d) {
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          `<strong>Race:</strong> ${d.data.Race}<br>
                          <strong>Employees:</strong> ${d.data.count}`
        )
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Add title
  svg
    .append("text")
    .attr("x", 0)
    .attr("y", -radius - 20)
    .attr("text-anchor", "middle")
    .attr("class", "title")
    .text("Employee Distribution by Race");

  // Add legend
  races.forEach((race, index) => {
    const color = colorScale(race);
    const legendItem = document.createElement("div");
    legendItem.innerHTML = `<span style="display:inline-block;width:18px;height:18px;background-color:${color};margin-right:5px;"></span>${race}`;
    legendContainer.appendChild(legendItem);
  });
}

// Stacked Bar Chart - Rank Distribution by Race
function drawStackedBarChart(data) {
  const container = document.getElementById("stackedBarChartContainer");
  d3.select(container).select("svg").remove();

  // Set fixed dimensions
  const width = 500;
  const height = 400;
  const margin = { top: 50, right: 100, bottom: 100, left: 70 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const chartArea = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const races = [...new Set(data.map((d) => d.Race))];
  const ranks = ["Junior", "Mid", "Senior", "Manager", "Director", "VP"];

  // Prepare data
  const raceRankData = d3.rollup(
    data,
    (v) => {
      return ranks.reduce((acc, rank) => {
        acc[rank] = v.filter((d) => d.Rank === rank).length;
        return acc;
      }, {});
    },
    (d) => d.Race
  );

  const dataArray = Array.from(raceRankData, ([Race, values]) => ({
    Race,
    ...values,
  }));

  // Create scales
  const xScale = d3
    .scaleBand()
    .domain(dataArray.map((d) => d.Race))
    .range([0, chartWidth])
    .padding(0.4);

  const yScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(dataArray, (d) => {
        return ranks.reduce((sum, key) => sum + d[key], 0);
      }),
    ])
    .range([chartHeight, 0]);

  // Define color scale
  const colorScale = d3.scaleOrdinal().domain(ranks).range(d3.schemeSet3);

  // Stack generator
  const stackGenerator = d3.stack().keys(ranks);

  const layers = stackGenerator(dataArray);

  // Create axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).ticks(6);

  // Append axes
  chartArea
    .append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-40)")
    .style("text-anchor", "end");

  chartArea.append("g").call(yAxis);

  // Add axis labels
  chartArea
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", chartHeight + margin.bottom - 70)
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Race");

  chartArea
    .append("text")
    .attr("x", -chartHeight / 2)
    .attr("y", -margin.left + 20)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .attr("class", "axis-label")
    .text("Number of Employees");

  // Tooltip
  const tooltip = d3.select("#stackedBarChartTooltip");

  // Draw stacked bars
  chartArea
    .selectAll(".layer")
    .data(layers)
    .enter()
    .append("g")
    .attr("class", "layer")
    .attr("fill", (d) => colorScale(d.key))
    .selectAll("rect")
    .data((d) => d)
    .enter()
    .append("rect")
    .attr("x", (d) => xScale(d.data.Race))
    .attr("y", (d) => yScale(d[1]))
    .attr("height", (d) => yScale(d[0]) - yScale(d[1]))
    .attr("width", xScale.bandwidth())
    .on("mouseover", function (event, d) {
      const rank = this.parentNode.__data__.key;
      tooltip.transition().duration(200).style("opacity", 0.9);
      tooltip
        .html(
          `<strong>Race:</strong> ${d.data.Race}<br>
                          <strong>Rank:</strong> ${rank}<br>
                          <strong>Employees:</strong> ${d.data[rank]}`
        )
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mousemove", function (event) {
      tooltip
        .style("left", event.pageX + 15 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", function () {
      tooltip.transition().duration(500).style("opacity", 0);
    });

  // Add title
  chartArea
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("class", "title")
    .text("Rank Distribution by Race");

  // Add legend
  const legend = chartArea
    .append("g")
    .attr("transform", `translate(${chartWidth + 20}, 0)`);

  ranks.forEach((rank, index) => {
    legend
      .append("rect")
      .attr("x", 0)
      .attr("y", index * 20)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", colorScale(rank));

    legend
      .append("text")
      .attr("x", 25)
      .attr("y", index * 20 + 13)
      .text(rank);
  });
}
