let width = 1500;
let height = 1200;

function main(data) {
	console.log(data);
}

Promise.all([
    	d3.json("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"),
	d3.csv("life_expectancy_data.csv")
]).then(main)
