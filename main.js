// Import Spectrum Web Components 
import "https://jspm.dev/npm:@spectrum-web-components/theme@0.40/sp-theme.js";
import "https://jspm.dev/npm:@spectrum-web-components/theme@0.40/src/themes.js";
import "https://jspm.dev/npm:@spectrum-web-components/slider@0.40/sp-slider.js";
import "https://jspm.dev/npm:@spectrum-web-components/slider@0.40/sp-slider-handle.js";


const svg = d3.select("svg");
const svgWidth = Number(svg.attr("width"));
const svgHeight = Number(svg.attr("height"));


// The prepared SVG elements for the chart axis and bars, feel free to modify the code
// to best suit your needs
const padding = { top: 24, right: 16, bottom: 24, left: 228 };
const axisGroup = svg.append("g").attr("class", "axis-group");
const barGroup = svg.append("g").attr("class", "bar-group").attr("transform", "translate(0, 24)");

/**
 * Create or update the chart with the given parameters.
 * 
 * @param {Array<Object.<string, string | number>>} data The data to use for the chart, the "Calories" fields are already converted to numbers
 * @param {"Tall" | "Grande" | "Venti" | "Short"} size One of the options in "Size" column
 * @param {"2% Milk" | "Nonfat Milk" | "Soy Milk" | "Whole Milk" | "n/a"} milkType One of the options in "Milk type" column
 * @param {[number, number]} caloriesRange A range of two numbers, the first being the minimum and the second being the maximum
 */
function updateChart(
    data,
    size,
    milkType,
    caloriesRange,
) {
    if (!caloriesRange || caloriesRange.length !== 2) {
        throw new Error("caloriesRange must be an array of two numbers");
    }

    // TODO: - Activity 3: Paste your code from previous activities and modify it
    console.log(data, size, milkType, caloriesRange);
    const filteredBeverageData = data
        .filter(d => d.Size === size && d["Milk type"] === milkType)
        .filter(d => d.Calories >= caloriesRange[0] && d.Calories <= caloriesRange[1])
        .sort((a, b) => b.Calories - a.Calories); 

    // Define the x-scale for the calorie values
    const calorieScale = d3.scaleLinear()
        .domain([0, 550])
        .range([0, svgWidth - padding.left - padding.right]);

    // Define the y-scale for the beverage categories
    const beverageScale = d3.scaleBand()
        .domain(filteredBeverageData.map(entry => entry.Beverage))
        .range([0, svgHeight - padding.top - padding.bottom])
        .padding(0.1);

    // Update bar elements
    const bars = barGroup.selectAll(".bar")
        .data(filteredBeverageData, entry => entry.Beverage);

    // Remove any bars that are no longer needed
    bars.exit().remove();

    // Enter selection for new bars
    const newBars = bars.enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", padding.left)
        .attr("y", entry => beverageScale(entry.Beverage))
        .attr("height", beverageScale.bandwidth())
        .attr("width", entry => calorieScale(entry.Calories));

    // Merge and transition for updated bars
    newBars.merge(bars)
        .transition()
        .duration(500)
        .attr("width", entry => calorieScale(entry.Calories))
        .attr("y", entry => beverageScale(entry.Beverage))
        .attr("height", beverageScale.bandwidth());

    // Update labels for each bar
    const labels = barGroup.selectAll(".label")
        .data(filteredBeverageData, entry => entry.Beverage);

    // Remove any labels that are no longer needed
    labels.exit().remove();

    // Enter selection for new labels
    const newLabels = labels.enter()
        .append("text")
        .attr("class", "label")
        .attr("x", padding.left + 220)
        .attr("y", entry => beverageScale(entry.Beverage) + beverageScale.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .html(entry => decorateBeverageName(entry.Beverage))
        .attr("transform", `translate(220, 0)`);

    // Merge and transition for updated labels
    newLabels.merge(labels)
        .transition()
        .duration(500)
        .attr("y", entry => beverageScale(entry.Beverage) + beverageScale.bandwidth() / 2);

    // Remove any existing x-axis at the bottom
    axisGroup.selectAll(".x-axis-bottom").remove();
    const bottomXAxis = d3.axisBottom(calorieScale)
        .ticks(10)
        .tickSize(-beverageScale.range()[1])
        .tickPadding(10);

    // Append and customize bottom x-axis
    axisGroup.append("g")
        .attr("class", "x-axis-bottom")
        .attr("transform", `translate(${padding.left}, ${svgHeight - padding.bottom})`)
        .call(bottomXAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line"))
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "2,2");

    // Remove any existing x-axis at the top
    axisGroup.selectAll(".x-axis-top").remove();
    const topXAxis = d3.axisTop(calorieScale)
        .ticks(10)
        .tickPadding(10);

    // Append and customize top x-axis
    axisGroup.append("g")
        .attr("class", "x-axis-top")
        .attr("transform", `translate(${padding.left}, ${padding.top})`)
        .call(topXAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line"))
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "2,2");

    // Remove existing y-axis (without labels)
    axisGroup.selectAll(".y-axis").remove();
    axisGroup.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${padding.left}, ${padding.top})`)
        .call(d3.axisLeft(beverageScale).tickFormat(() => ""));


}


/**
 * Use regex to match the beverage name in the format of "Beverage Name (Some Annotation)"
 * and split them into two lines to display in SVG
 * 
 * @param {string} beverageName the beverage name in the format of "Beverage Name (Some Annotation)" or "Beverage Name"
 * @returns {string} a snippet of SVG text element with two spans for the extracted beverage name and annotation
 */
function decorateBeverageName(beverageName) {
    const matches = /^([\w\W]+)\s+\(([\w\W]+)\)$/.exec(beverageName);
    if (matches) {
        return `<tspan x="4px" dy="-0.25em">${matches[1]}</tspan>
                <tspan x="0" dy="1.0em" class="annotation">${matches[2]}</tspan>`;
    }
    return `<tspan x="0">${beverageName}</tspan>`;
}


/**
 * Load the data and initialize the controls
 */
async function loadDataAndInitializeControls() {
    const data = await d3.csv("starbucks_drinks.csv", d => ({ ...d, "Calories": Number(d["Calories"]) }));

    // Find the unique values for Size and Milk type
    const sizeOptions = [...new Set(data.map(d => d["Size"]))];
    const milkTypeOptions = [...new Set(data.map(d => d["Milk type"]))].sort();

    let selectedSize = sizeOptions[0];
    let selectedMilkType = milkTypeOptions[0];
    let caloriesRange = [0, 510];

    // Initialize the size and milk type radio buttons
    const sizeFieldsetElement = document.querySelector("#size-fieldset");
    sizeFieldsetElement.innerHTML = sizeOptions.map(d => `
        <input type="radio" value="${d}" name="size" id="${d}" ${d === selectedSize ? "checked" : ""}>
        <label for="${d}">${d}</label>
    `).join("");
    updateChart(data, selectedSize, selectedMilkType, caloriesRange);

    // Add onchange event listeners to the radio buttons
    sizeFieldsetElement.addEventListener("change", () => {

        // The only selected child will look like <input id="..." name="size" value="..." checked>
        // So we can use the :checked to find the selected radio button
        selectedSize = sizeFieldsetElement.querySelector("input:checked").value;

        // TODO: - Paste your code from previous activities here
        //         Remember to add the caloriesRange parameter when calling the updateChart function
        console.log(selectedSize);
        sizeFieldsetElement.addEventListener("change", () => {
            selectedSize = sizeFieldsetElement.querySelector("input:checked").value;
            updateChart(data, selectedSize, selectedMilkType, caloriesRange);
        });

    });

    // Initialize the milk type radio buttons
    const milkFieldSetElement = document.querySelector("#milk-fieldset");
    milkFieldSetElement.innerHTML = milkTypeOptions.map(d => `
        <input type="radio" value="${d}" name="milk" id="${d}" ${d === selectedMilkType ? "checked" : ""}>
        <label for="${d}">${d}</label>
    `).join("");

    // TODO: - Paste your code from previous activities here
    //         Remember to add the caloriesRange parameter when calling the updateChart function
    milkFieldSetElement.addEventListener("change", () => {
        selectedMilkType = milkFieldSetElement.querySelector("input:checked").value;
        updateChart(data, selectedSize, selectedMilkType, caloriesRange);
    });



    // TODO - Activity 3: Add event listener for sp-slider
        const sliderHandleMin = document.querySelector("#slider-handle-min");
        const sliderHandleMax = document.querySelector("#slider-handle-max");
        const caloriesRangeElement = document.querySelector("span#range-result");
        caloriesRangeElement.innerHTML = `${caloriesRange[0]} - ${caloriesRange[1]}`;
    
        sliderHandleMin.addEventListener("input", () => {
            caloriesRange[0] = Number(sliderHandleMin.value);
            updateChart(data, selectedSize, selectedMilkType, caloriesRange);
            caloriesRangeElement.innerHTML = `${caloriesRange[0]} - ${caloriesRange[1]}`;
        });
        sliderHandleMax.addEventListener("input", () => {
            caloriesRange[1] = Number(sliderHandleMax.value);
            updateChart(data, selectedSize, selectedMilkType, caloriesRange);
            caloriesRangeElement.innerHTML = `${caloriesRange[0]} - ${caloriesRange[1]}`;
        });



    updateChart(data, selectedSize, selectedMilkType, caloriesRange);
}


await loadDataAndInitializeControls();
