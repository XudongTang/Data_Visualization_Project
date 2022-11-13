let width = 1500;
let height = 1200;

function main(data) {
	parse(data[1]);
	draw_map(data[0])
}

function parse(data){
	const res = []
	var res2 = []
	cur_country = data[0].Country
	for(let i = 0; i < data.length; i++){
		if(data[i].Country === cur_country){
			res2.splice(0, 0, data[i])
		}else{
			res.push(res2)
			res2 = [data[i]]
			cur_country = data[i].Country
		}
	}
	res.push(res2)
}
/*
function select_country(data) {
	const selected_country = [];
	for (var i = 0; i < data[1].length; ++i) {
		const found = data[0].
	}
}
*/
function draw_map(data) {
        let proj = d3.geoMercator().fitExtent([[width/2, 0],[width, height]], data);
        let path = d3.geoPath().projection(proj);

        d3.select("#map")
                .selectAll("path")
                .data(data.features).enter()
                .append("path")
                .attrs({
                        d: path,
                        fill: "white",
                        "stroke-width": 1
                });
}

Promise.all([
    d3.json("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"),
	d3.csv("life_expectancy_data.csv")
]).then(main)
