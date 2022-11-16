let width = 900;
let height = 900;
let margins = {top: 50, bottom: 50, left: 50, right: 50}

function main(data) {
	data[1] = parse(data[1]);
	data = merge_country(data);
	draw_map(data);
	select_cont(data);
	
	
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

function select_cont(data) {

	var choice = ["All", "Asia", "Europe", "Africa", "Americas", "Oceania"];
	
	var select = d3.select('#select_cont')
			.on('change', function(event, d) {
				const selectedOption = d3.select(this).property("value");
				update_cont(selectedOption, data);
			});
	var options = select.selectAll('option')
				.data(choice).enter()
				.append('option')
				.text(function(d) {
					return d;
				})
				.attr("value", function(d) {
					return d;
				});

}


function update_cont(select, data) {
	const selected = structuredClone(data);
	if (select !== "All") {
		const countries = [];
	
		for (var i = 0; i < data.features.length; ++i) {
			if (data.features[i].properties.adm0_a3 === "RUS" ||
				data.features[i].properties.adm0_a3 === "NZL" ||
				data.features[i].properties.subregion === "Polynesia"||
				data.features[i].properties.adm0_a3 === "FJI"||
				data.features[i].properties.adm0_a3 === "KIR"||
				data.features[i].properties.adm0_a3 === "ESP"||
				data.features[i].properties.adm0_a3 === "PRT"||
				data.features[i].properties.adm0_a3 === "FRA"||
				data.features[i].properties.adm0_a3 === "NLD"||
				data.features[i].properties.adm0_a3 === "NOR"||
				data.features[i].properties.adm0_a3 === "USA"
			) {
				continue;
			}
			if (data.features[i].properties.region_un === select) {
				countries.push(data.features[i]);
			}
		}
		selected.features = countries;
	}
	update_map(selected);	

	var sub_count = [];

	if (select === "Asia") {
		sub_count = ["All", "Southern Asia", "Western Asia", "South-Eastern Asia",
			"Eastern Asia", "Central Asia"];
	} else if (select === "Europe") {
		sub_count = ["All", "Southern Europe", "Western Europe", "Eastern Europe", "Northern Europe"];
	} else if (select === "Africa") {
		sub_count = ["All", "Northern Africa", "Middle Africa", "Western Africa", 
			"Southern Africa", "Eastern Africa"];
	} else if (select === "Americas") {
		sub_count = ["All", "Caribbean", "South America", "Central America", "Northern America"];
	} else if (select === "Oceania") {
		sub_count = ["All", "Australia and New Zealand", "Polynesia", "Melanesia", "Micronesia"];
	} else {
		sub_count = ["All"];
	}

	
	var select = d3.select('#select_sub_cont')
			.on('change', function(event, d) {
				const selectedOption = d3.select(this).property("value");
				update_sub_cont(selectedOption, data, selected);
			});

	var options = select.selectAll('option')
				.data(sub_count);
	options.exit().remove();
	options.enter().append('option')
		.merge(options)
		.text(function(d) {
			return d;
		})
		.attr("value", function(d) {
			return d;
		});
}


function update_sub_cont(select, data, prevSelect) {
	var selected = structuredClone(data);
	if (select !== "All") {
		const countries = [];
	
		for (var i = 0; i < data.features.length; ++i) {
			if (data.features[i].properties.adm0_a3 === "RUS" ||
				data.features[i].properties.adm0_a3 === "NZL"||	
				data.features[i].properties.adm0_a3 === "TUV"||
				data.features[i].properties.adm0_a3 === "FJI"||
				data.features[i].properties.adm0_a3 === "KIR"||
				data.features[i].properties.adm0_a3 === "ESP"||
				data.features[i].properties.adm0_a3 === "PRT"||
				data.features[i].properties.adm0_a3 === "FRA"||
				data.features[i].properties.adm0_a3 === "NLD"||
				data.features[i].properties.adm0_a3 === "NOR"||
				data.features[i].properties.adm0_a3 === "USA"
			) {
				continue;
			}
			if (data.features[i].properties.subregion === select) {
				countries.push(data.features[i]);
			}
		}
		selected.features = countries;
	} else {
		selected = prevSelect;
	}

	console.log(selected);
	update_map(selected);
	
}

function update_map(selected) {

        let newproj = d3.geoMercator().fitExtent([[0, 0],[width, height]], selected);
        let newpath = d3.geoPath().projection(newproj);
	d3.select("#map")
		.selectAll("path")
		.data(selected.features, d => d.properties.adm0_a3)
		.join(
		
			function (exit) {
				return exit.remove();
			},
			function (enter) {
				return enter.transition().duration(1000).attrs({
					d: newpath,
				})
			},
			function (update) {
				return update.transition().duration(1000).attrs({
					d: newpath,
				})
			}


		);
}



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
        let proj = d3.geoMercator().fitExtent([[0, 0],[width, height]], data);
        let path = d3.geoPath().projection(proj);

        d3.select("#map")
                .selectAll("path")
                .data(data.features).enter()
                .append("path")
                .attrs({
                        d: path,
			fill: d => scale.fill(d.properties.statistics[0]?.Life_expectancy),
            		"stroke-width": 1,
			"stroke": "black",
			name: d => d.properties.adm0_a3
                });
}

Promise.all([
	d3.json("world_map.json", d3.autoType),
    	//d3.json("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"),
	d3.csv("life_expectancy_data.csv", d3.autoType)
]).then(main)
