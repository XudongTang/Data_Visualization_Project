let width = 1500;
let height = 1200;
let margins = {top: 50, bottom: 50, left: 50, right: 50}

function main(data) {
	parse(data[1]);
	draw_map(data[0])
}

function parse(data){
	const res = []
	var res2 = []
	cur_country = data[0].Country
	for(let i = 0; i < data.length; i++){
		data[i].Year = (new Date(data[i].Year + '-01-03')).getFullYear()
		if(data[i].Country === cur_country){
			res2.splice(0, 0, data[i])
		}else{
			res.push(res2)
			res2 = [data[i]]
			cur_country = data[i].Country
		}
	}
	res.push(res2)
	console.log(res)
}

function make_scales(data){
    return{
        x: d3.scaleTime()
        .domain(d3.extent(data[0].map(d => d.date)))
        .range([margins.left, width - margins.right]),
        y: d3.scaleLinear()
        .domain([0, 70000])
        .range([height - margins.bottom, margins.top])
    }
}


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
