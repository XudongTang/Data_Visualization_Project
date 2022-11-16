let width = 1200;
let height = 1800;
let margins = {top: 50, bottom: 50, left: 50, right: 50}

function main(data) {
	data[1] = parse(data[1]);
	data = merge_country(data);
	console.log(data);
	select_cont();
	draw_map(data);
	/*
	for (var i = 0; i < data.features.length; ++i) {
		console.log(data.features[i].properties.region_un);
	}
	*/
	//console.log(data)
	// scales = make_scales(data[1]);
	// draw_line(data[1], scales)
}

function parse(data){
	const res = [];
	var res2 = [];
	cur_country = data[0].Country;
	for(let i = 0; i < data.length; i++){
		data[i].Year = (new Date(data[i].Year + '-01-03')).getFullYear();
		if(data[i].Country === cur_country){
			var element = [];
			element.Year = data[i].Year;
			element.Country = data[i].Country;
			element.Status = data[i].Status;
			element.Life_expectancy = data[i]["Life expectancy "];
			element.Adult_mortality = data[i]["Adult Mortality"];
			element.Infant_death = data[i]["infant deaths"];
			res2.splice(0, 0, element);
		}else{
			res.push(res2);
			var element = [];
			element.Year = data[i].Year;
			element.Country = data[i].Country;
			element.Status = data[i].Status;
			element.Life_expectancy = data[i]["Life expectancy "];
			element.Adult_mortality = data[i]["Adult Mortality"];
			element.Infant_death = data[i]["infant deaths"];
			res2 = [element];
			cur_country = data[i].Country;
		}
	}
	res.push(res2);
	return res;
}



function merge_country(data) {
	const all_country = [];
	for (var i = 0; i < data[1].length; ++i) {
		const found = data[0].features.find(d => d.properties.name_long === data[1][i][0].Country
			|| d.properties.admin === data[1][i][0].Country
			|| d.properties.brk_name === data[1][i][0].Country
			|| d.properties.formal_en === data[1][i][0].Country
			|| d.properties.formal_en === data[1][i][0].Country
		);
		if (found !== undefined) {
			found.properties.statistics = data[1][i]
			all_country.push(found);
		}
	}
	data[0].features = all_country;
	return data[0];
}


function make_scales(data){
    return{
        x: d3.scaleTime()
        .domain(d3.extent(data[0].map(d => d.Year)))
        .range([margins.left, width - margins.right]),
        y: d3.scaleLinear()
        .domain([0, 20])
        .range([height/2 + margins.top, height - margins.bottom])
    }
}

function select_cont() {
	var choice = ["All", "Asia", "Europe", "Africa", "Americas", "Oceania"];
	var className = 'select_cont';
	var select = d3.select('body')
			.append ('select')
			.attr('class', className)
	//		.on('change', selection(className));
	var options = select.selectAll('option')
				.data(choice).enter()
				.append('option')
				.text(function(d) {
					return d;
				});
}
/*
function selection(name) {
	selectValue = d3.select(name).property("value");
	
}
*/

function draw_line(data, scales){
    path_generator = d3.line()
    .x(d => scales.x(d.Year))
    .y(d => scales.y(d.Alcohol));

    d3.select('#series')
    .selectAll('path')
    .data(data).enter()
    .append('path')
	.attrs({
		d: path_generator,
		stroke: '#a8a8a8',
		'stroke-width': 1,
		fill: 'none'
	})

}
let scale = {
	    fill: d3.scaleQuantize()
		.domain([45, 80])
		.range(d3.schemeBlues[9])
};

function draw_map(data) {
        let proj = d3.geoMercator().fitExtent([[0, 0],[width, height/2]], data);
        let path = d3.geoPath().projection(proj);

        d3.select("#map")
                .selectAll("path")
                .data(data.features).enter()
                .append("path")
                .attrs({
                        d: path,
			fill: d => scale.fill(d.properties.statistics[0]?.Life_expectancy),
            		"stroke-width": 1,
			stroke: 'black'
                });
}

Promise.all([
	d3.json("world_map.json", d3.autoType),
    	//d3.json("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"),
	d3.csv("life_expectancy_data.csv", d3.autoType)
]).then(main)
