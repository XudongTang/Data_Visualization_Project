let width = 900;
let height = 500;
let margins = {top: 50, bottom: 50, left: 50, right: 50}

function main(data) {
	data[1] = parse(data[1]);
	data = merge_country(data);
	map_init(data);
	button_continent(data);
	button_variable(data);
	button_year(data)
	scales = make_scales(data);
	add_axes(scales)

}

////////////////////////////////////////////////////////////////////////////////
//////////////////////// Data prepross function ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function parse(data){
	const res = [];
	var res2 = [];
	cur_country = data[0].Country;
	for(let i = 0; i < data.length; i++){
		//data[i].Year = (new Date(data[i].Year + '-01-03'));
		if(data[i].Country === cur_country){
			res2.push(data[i]);
		}else{
			res.push(res2);
			res2 = [data[i]];
			cur_country = data[i].Country;
		}
	}
	res.push(res2);
	return res;
}

function merge_country(data) {
	const all_country = [];

	for (var i = 0; i < data[1].length; ++i) {
		const found = data[0].features.find(d =>
			d.properties.adm0_a3 === data[1][i][0].ISO_code);
		if (found !== undefined) {
			found.properties.statistics = data[1][i]
			all_country.push(found);
		}
	}
	data[0].features = all_country;
	return data[0];
}

function scale_color() {
	const choice = d3.select("#select_variable").property("value");
	var scale;

	if (choice === "Life_expectancy") {
		scale = {
			fill: d3.scaleQuantize()
			.domain([38, 84])
			.range(d3.schemeRdYlBu[11])
		}
	} else if (choice === "Adult_mortality") {
		scale = {
			fill: d3.scaleQuantize()
			.domain([2, 200])
			.range(d3.schemeReds[9])
		}
	} else if (choice === "Birth_rate") {
		scale = {
			fill: d3.scaleQuantize()
			.domain([7, 54])
			.range(d3.schemeYlGn[9])
		}
	} else {
		scale =  {
			fill: d3.scaleQuantize()
			.domain([1.5, 100])
			.range(d3.schemeOranges[9])
		}
	}
	return scale;
}

////////////////////////////////////////////////////////////////////////////////
//////////////////////////// Line function /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

// Helpers

function get_countries(data, year, target, i) {
	var country = {Name: null, Data: []};
	country.Name = data.features[i].properties.statistics[0].Country;
	var tmp = [];
	for (let j = 0; j <= Number(year)-2000; j++) {
		var obj = {year: 0, data: 0};
		obj.year = data.features[i].properties.statistics[j].Year;
		obj.data = data.features[i].properties.statistics[j][target];
		tmp.push(obj);
	}
	country.Data = tmp;
	return country;
}

function line_select_country(data) {
	var selected_countries = [];
	var region_un = d3.select('#select_cont').property('value');
	var subregion = d3.select('#select_sub_cont').property('value')
	var year = d3.select("#forward_button").property('value');
	var target = d3.select("#select_variable").property("value");

	if(region_un === 'All'){
		for(let i = 0; i < data.features.length; i++){
			selected_countries.push(get_countries(data, year, target, i));
		}
	}else if(subregion === 'All'){
		for(let i = 0; i < data.features.length; i++){
			if(data.features[i].properties.region_un === region_un){
				selected_countries.push(get_countries(data, year, target, i));
			}
		}
	}else{
		for(let i = 0; i < data.features.length; i++){
			if(data.features[i].properties.region_un === region_un
				&& data.features[i].properties.subregion === subregion){
					selected_countries.push(get_countries(data, year, target, i));
			}
		}
	}
	return selected_countries;
}

function find_domain(selected_countries){
	res = []
	for(let i = 0; i < selected_countries.length; i++){
		for(let j = 0; j < selected_countries[i].Data.length; j++){
			res.push(selected_countries[i].Data[j].data)
		}
	}
	return [d3.quantile(res, 0), d3.quantile(res, 1)]
}

function make_scales(selected_countries){
	var values = find_domain(selected_countries)
	var years = [2000, Number(d3.select("#forward_button").property('value'))];
	return{
        	x: d3.scaleLinear()
        		.domain(years)
        		.range([margins.left, width - margins.right]),
        	y: d3.scaleLinear()
        		.domain(values)
        		.range([height - margins.bottom, margins.top])
    	}

}

// Draw
function update_line_on_click(data) {
	var selected_countries = line_select_country(data);
	console.log(selected_countries)
	scales = make_scales(selected_countries);
	update_line(selected_countries, scales);
	update_axes(scales);
}

function update_line(selected_countries, scales){
	color = scale_color();
	path_generator = d3.line()
    			.x(d => scales.x(d.year))
    			.y(d => scales.y(d.data));


    	d3.select('#series')
    		.selectAll('path')
    		.data(selected_countries)
		.join(
			enter => enter.append('path')
			.transition().duration(1000).attrs({
				d: function(d) {
					return path_generator(d.Data)
				},
				stroke: '#0c0c0c',
				'stroke-width': 2,
				fill: 'none'
			}),
			update => update.transition().duration(1000)
			.attr(
				"d", function(d) {
					return path_generator(d.Data)
				}
			),
			exit => exit.attr("stroke-opacity", 1).transition()
			.duration(500).attr("stroke-opacity", 0).remove()
		);

	d3.select('.plot')
		.selectAll('.dot')
		.data(selected_countries)
		.join(
			enter => enter.append('g')
			.attr("class", "dot")
			.selectAll("circle")
			.data(function(d) {
				return d.Data
			}).enter()
			.append("circle")
			.attrs({
				"r": 5,
				"cx": function(d, i) {
					return scales.x(d.year);
				},
				"cy": function(d, i) {
					return scales.y(d.data);
				},
				"fill": function (d, i) {
					return color.fill(d.data)
				},
				"stoke-width": 1,
				"stroke": "black"
			}),
			
			update => update.selectAll("circle")
			.data(function(d){
				return d.Data
			}).join(
				enter => enter.append("circle")
					.transition().duration(1000)
					.attrs({
						"r": 5,
						"cx": function(d, i) {
							return scales.x(d.year);
						},
						"cy": function(d, i) {
							return scales.y(d.data);
						},
						"fill": function (d, i) {
							return color.fill(d.data)
						},
						"stoke-width": 1,
						"stroke": "black"
					}),
				update => update.transition().duration(1000)
				.attrs({
					"cx": function(d, i) {
						return scales.x(d.year);
					},
					"cy": function(d, i) {
						return scales.y(d.data);
					},
					"fill": function (d, i) {
						return color.fill(d.data);
					}
				}),
				exit => exit.attrs({
					"fill-opacity": 1,
					"stroke-opacity": 1
				}).transition().duration(500).attrs({
					"fill-opacity": 0,
					"stroke-opacity": 0
				}).remove()
			),

			exit => exit.selectAll("circle")
			.data(function(d){
				return d.Data
			}).attrs({
				"fill-opacity": 1,
				"stroke-opacity": 1
			})
			.transition().duration(500)
			.attrs({
				"fill-opacity": 0,
				"stroke-opacity": 0
			}).remove()
		)
}

function add_axes(scales){
    	let x_axis = d3.axisBottom()
    			.scale(scales.x),
    			y_axis = d3.axisLeft()
    			.scale(scales.y);
			var year = d3.select("#forward_button").property('value');
			var tick = Number(year) + 1 - 2000;
			x_axis.ticks(tick);

    	d3.select('#axes')
    		.append('g')
    		.attrs({
        	id: 'x_axis',
        		transform: `translate(0, ${height - margins.bottom})`
    		})
    		.call(x_axis);

    	d3.select('#axes')
    		.append('g')
    		.attrs({
        		id: 'y_axis',
        	transform: `translate(${margins.left}, 0)`
    		})
    		.call(y_axis);
}

function update_axes(scales){
	let x_axis = d3.axisBottom()
    			.scale(scales.x),
    	y_axis = d3.axisLeft()
    			.scale(scales.y);

	var year = d3.select("#forward_button").property('value');
	var tick = Number(year) + 1 - 2000;
	x_axis.ticks(tick);

	d3.select('#x_axis').remove()
	d3.select('#y_axis').remove()

	d3.select('#axes')
    .append('g')
    .attrs({
      	id: 'x_axis',
        transform: `translate(0, ${height - margins.bottom})`
    })
    .call(x_axis);

  d3.select('#axes')
    .append('g')
    .attrs({
      	id: 'y_axis',
        transform: `translate(${margins.left}, 0)`
    })
    .call(y_axis);
}

////////////////////////////////////////////////////////////////////////////////
///////////////////////////// Map function /////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function update_map_color(data) {
	const choice = d3.select("#select_variable").property("value");
	const year = d3.select('#forward_button').property("value");
	var scale;

	scale = scale_color();

	d3.select("#map")
    .selectAll("path")
    .data(data.features, d => d.properties.adm0_a3)
		.transition().duration(600)
		.attrs({
			fill: d => scale.fill(d.properties.statistics[Number(year)-2000][choice])
		})
}

function update_map_position(selected) {
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

function map_init(data) {
	let proj = d3.geoMercator().fitExtent([[0, 0],[width, height]], data);
	let path = d3.geoPath().projection(proj);

	let scale = {
		fill: d3.scaleQuantize()
		.domain([38, 84])
		.range(d3.schemeRdBu[11])
	};

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

////////////////////////////////////////////////////////////////////////////////
///////////////////////////// Button function //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function button_year(data) {
	var forwardButton = d3.select("#forward_button")
			.attr("value", 2000)
			.on('click', function(event, d){
				const next_year = Number(d3.select(this).property("value")) + 1;
				if (next_year <= 2015) {
					change_year(next_year);
					update_map_color(data);
					update_line_on_click(data);
				}
			});
	var backwardButton = d3.select("#backward_button")
			.attr("value", 2000)
			.on('click', function(event, d){
				const next_year = Number(d3.select(this).property("value")) - 1;
				if (next_year >= 2000) {
					change_year(next_year);
					update_map_color(data);
					update_line_on_click(data);
				}
			});
}

function change_year(next_year) {
	d3.select('#forward_button').property("value", next_year);
	d3.select('#backward_button').property("value", next_year);
	d3.select('#year').text(next_year);
}

function button_variable(data) {
	var choice = ["Life_expectancy", "Adult_mortality",
							"Infant_death", "Birth_rate"];
	var select = d3.select("#select_variable")
			.on('change', function(event, d) {
				update_map_color(data);
				update_line_on_click(data);
			});
	var options = select.selectAll('option')
				.data(choice).enter()
				.append('option')
				.text(function(d) {
					return d;
				})
				.attr("value", function(d){
					return d;
				})
}

function button_continent(data) {
	var choice = ["All", "Asia", "Europe", "Africa", "Americas", "Oceania"];
	var select = d3.select('#select_cont')
			.on('change', function(event, d) {
				const selectedOption = d3.select(this).property("value");
				button_sub_continent(selectedOption, data);
				update_line_on_click(data);
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

function button_sub_continent(select, data) {
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
				data.features[i].properties.adm0_a3 === "TUV"||
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
	update_map_position(selected);
	d3.select('#select_sub_cont').property("value", "All");
	var sub_count = [];

	if (select === "Asia") {
		sub_count = ["All", "Southern Asia", "Western Asia", "South-Eastern Asia",
			"Eastern Asia", "Central Asia"];
	} else if (select === "Europe") {
		sub_count = ["All", "Southern Europe", "Western Europe", "Eastern Europe"
			, "Northern Europe"];
	} else if (select === "Africa") {
		sub_count = ["All", "Northern Africa", "Middle Africa", "Western Africa",
			"Southern Africa", "Eastern Africa"];
	} else if (select === "Americas") {
		sub_count = ["All", "Caribbean", "South America", "Central America"
			, "Northern America"];
	} else if (select === "Oceania") {
		sub_count = ["All", "Australia and New Zealand", "Melanesia", "Micronesia"];
	} else {
		sub_count = ["All"];
	}

	var select = d3.select('#select_sub_cont')
			.on('change', function(event, d) {
				const selectedOption = d3.select(this).property("value");
				update_sub_cont(selectedOption, data, selected);
				update_line_on_click(data);
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
				data.features[i].properties.adm0_a3 === "FJI"||
				data.features[i].properties.adm0_a3 === "KIR"||
				data.features[i].properties.adm0_a3 === "ESP"||
				data.features[i].properties.adm0_a3 === "PRT"||
				data.features[i].properties.adm0_a3 === "TUV"||
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
	update_map_position(selected);

}

Promise.all([
	d3.json("world_map.json", d3.autoType),
	d3.csv("life_expectancy_data.csv", d3.autoType)
]).then(main)
