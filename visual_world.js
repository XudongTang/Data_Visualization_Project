let width = 900;
let height = 500;
let margins = {top: 50, bottom: 50, left: 50, right: 50}

function main(data) {
	data[1] = parse(data[1]);
	data = merge_country(data);
	map_init(data);
	button_plot(data)
	button_continent(data);
	button_variable(data);
	button_year(data)
	scales = make_scales(data);
	add_axes(scales)
	update_line_on_click(data)

}

////////////////////////////////////////////////////////////////////////////////
//////////////////////// Data prepross function ////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function parse(data){
	const res = [];
	var res2 = [];
	cur_country = data[0].Country;
	for(let i = 0; i < data.length; i++){
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

function get_continents(data, year, target){
	var continent = {}
	for(let j = 0; j <= Number(year) - 2000; j++){
		tmp = {}
		for(let i = 0; i < data.features.length; i++){
			if(data.features[i].properties.region_un in tmp){
				tmp[data.features[i].properties.region_un].push(data.features[i].properties.statistics[j][target])
			}else{
				tmp[data.features[i].properties.region_un] = [data.features[i].properties.statistics[j][target]]
			}
		}
		keys = Object.keys(tmp)
		for(let k = 0; k < keys.length; k++){
			key = keys[k]
			array = tmp[key]
			if(key in continent){
				continent[key].push(array.reduce((a, b) => a + b) / array.length)
			}else{
				continent[key] = [array.reduce((a, b) => a + b) / array.length]
			}
		}
	}
	result = []
	keys = Object.keys(continent)
	for(let k = 0; k < keys.length; k++){
		key = keys[k]
		tmp = {'Name': key, 'Data': []}
		for(let j = 0; j <= Number(year) - 2000; j++){
			tmp.Data.push({'year': j+2000, 'data': continent[key][j]})
		}
		result.push(tmp)
	}
	return result
}

function get_subcontinents(data, year, target, region_un){
	subcontinent = {}
	for(let j = 0; j <= Number(year) - 2000; j++){
		tmp = {}
		for(i = 0; i < data.features.length; i++){
			if(data.features[i].properties.region_un === region_un){
				if(data.features[i].properties.subregion in tmp){
					tmp[data.features[i].properties.subregion].push(data.features[i].properties.statistics[j][target])
				}else{
					tmp[data.features[i].properties.subregion] = [data.features[i].properties.statistics[j][target]]
				}
			}
		}
		keys = Object.keys(tmp)
		for(let k = 0; k < keys.length; k++){
			key = keys[k]
			array = tmp[key]
			if(key in subcontinent){
				subcontinent[key].push(array.reduce((a, b) => a + b) / array.length)
			}else{
				subcontinent[key] = [array.reduce((a, b) => a + b) / array.length]
			}
		}
	}
	result = []
	keys = Object.keys(subcontinent)
	for(let k = 0; k < keys.length; k++){
		key = keys[k]
		tmp = {'Name': key, 'Data': []}
		for(let j = 0; j <= Number(year) - 2000; j++){
			tmp.Data.push({'year': j+2000, 'data': subcontinent[key][j]})
		}
		result.push(tmp)
	}
	return result
}

function line_select_country(data) {
	var selected_countries = [];
	var region_un = d3.select('#select_cont').property('value');
	var subregion = d3.select('#select_sub_cont').property('value')
	var year = d3.select("#forward_button").property('value');
	var target = d3.select("#select_variable").property("value");

	if(region_un === 'All'){
		selected_countries = get_continents(data, year, target)
	}else if(subregion === 'All'){
		selected_countries = get_subcontinents(data, year, target, region_un)
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
	var years = d3.range(2000, Number(d3.select("#forward_button").property('value')) + 1);
	return{
        	x: d3.scalePoint()
        		.domain(years)
        		.range([margins.left + 150, width-15]),
        	y: d3.scaleLinear()
        		.domain(values)
        		.range([height - margins.bottom, margins.top])
    	}

}

function scale_heatmap(selected_countries) {
	var name = [];
	var year = [];
	for (var i = 0; i < selected_countries.length; ++i) {
		name.push(selected_countries[i].Name);
	}
	for (var i = 0; i < selected_countries[0].Data.length; ++i) {
		year.push(selected_countries[0].Data[i].year);
	}
	return {
		xScale: d3.scaleBand()
						.domain(year)
						.range([margins.left + 150, width-15])
						.padding(0.1),
		yScale: d3.scaleBand()
						.domain(name)
						.range([height - margins.bottom, margins.top])
						.padding(0.05)
	}
}

// Draw
function update_heatmap_on_click(data) {
	var selected_countries = line_select_country(data);
	//console.log(selected_countries)
	scales = scale_heatmap(selected_countries)
	update_heatmap_axis(scales)
	update_heatmap(selected_countries, scales)
}

function heatmap_process(selected_countries) {
	var flatData = [];
	for (var i = 0; i < selected_countries.length; ++i) {
		for (var j = 0; j < selected_countries[i].Data.length; ++j) {
			var new_obj = {Name:null, year:null, data:null};
			new_obj.Name = selected_countries[i].Name;
			new_obj.year = selected_countries[i].Data[j].year;
			new_obj.data = selected_countries[i].Data[j].data;
			flatData.push(new_obj)
		}
	}
	return flatData;
}

function update_heatmap(selected_countries, scales) {
	var color = scale_color();
	var flatData = heatmap_process(selected_countries);

	d3.select("#heatmap")
		.selectAll('rect')
		.data(flatData).join(
			enter => enter.append('rect')
			.transition().duration(1000)
			.attrs({
				"x": d => scales.xScale(d.year),
				"y": d => scales.yScale(d.Name),
				"rx": 3,
				"ry": 3,
				"width": scales.xScale.bandwidth(),
				"height": scales.yScale.bandwidth(),
				"fill": d => color.fill(d.data),
				"stroke": "black",
				"stroke-width": 1,
				"stroke-opacity": 0.5,
				"fill-opacity": 0.7
			}),
			update => update
				.transition().duration(1000)
				.attrs({
				"x": d => scales.xScale(d.year),
				"y": d => scales.yScale(d.Name),
				"width": scales.xScale.bandwidth(),
				"height": scales.yScale.bandwidth(),
				"fill": d => color.fill(d.data)
			}),
			exit => exit.attrs({
				"stroke-opacity": 0.5,
				"fill-opacity": 0.7
			})
			.transition().duration(1000)
			.attrs({
				"stroke-opacity": 0,
				"fill-opacity": 0
			})
			.remove()
		)
		.on("mouseover", (_, d) => mouseover_heatmap(d))
		.on("mouseout", (_, d) => mouseout(d))
}

function add_heatmap_axis(scales) {
	d3.select('#axes')
		.append('g')
		.style('font-size', 15)
		.attr('transform', 'translate(0,' + (height-20) + ')')
		.attr('id', 'x_axis')
		.call(d3.axisBottom(scales.xScale).tickSize(0))
		.select('.domain')
		.remove()

	d3.select('#axes')
		.append('g')
		.style('font-size', 15)
		.attr('transform', 'translate('+ 150 + ',0)')
		.attr('id', 'y_axis')
		.call(d3.axisLeft(scales.yScale).tickSize(0))
		.select('.domain')
		.remove()
}

function update_heatmap_axis(scales) {
	d3.select('#x_axis')
		//.transition().duration(100)
		.call(d3.axisBottom(scales.xScale).tickSize(0))
		.select('.domain')
		.remove();
	d3.select('#y_axis')
		//.transition().duration(100)
		.call(d3.axisLeft(scales.yScale).tickSize(0))
		.select('.domain')
		.remove()
}

function update_line_on_click(data) {
	var selected_countries = line_select_country(data);
	scales = make_scales(selected_countries);
	update_line(selected_countries, scales);
	update_axes(scales);
}

function update_line(selected_countries, scales){
	line_color = d3.scaleOrdinal()
	.domain(selected_countries.map(d => d.Name))
	.range(d3.schemeDark2)
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
						stroke: d => line_color(d.Name),
						'stroke-width': 5,
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
			)
			.on("mouseover", (_, d) => mouseover_line(d))
			.on("mouseout", (_, d) => mouseout(d))

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
				"r": 7,
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
						"r": 7,
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
	d3.select('.plot').selectAll('#legend').remove()
	var legend = d3.select('.plot').selectAll('#legend')
	.data(selected_countries.map(d => d.Name))
	.enter().append('g')
	.attr('id', 'legend')
	.attr('transform', function(d, i){return 'translate(0, ' + i*20 + ')'})


	legend.append('rect')
	.attr('x', 0)
	.attr('y', 50)
	.attr('width', 15)
	.attr('height', 6)
	.style('fill', function(d){return line_color(d)})

	legend.append('text')
	.attrs({
		'x': 18,
		'y': 50,
		'dy': '.4em'
	})
	.text(function(d){return d})

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
				.attr("opacity", 0)
				.transition().duration(200)
				.attr("opacity", 1)
    		.attrs({
        	id: 'x_axis',
        		transform: `translate(0, ${height - margins.bottom})`
    		})
    		.call(x_axis);

    	d3.select('#axes')
    		.append('g')
    		.attrs({
        		id: 'y_axis',
        		transform: `translate(${margins.left + 150}, 0)`
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

	d3.select('#x_axis')
		.transition().duration(1000)
		.call(x_axis);

	d3.select('#y_axis')
		.transition().duration(1000)
		.call(y_axis)
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
				"stroke-opacity": 0.3,
				"fill-opacity": 0.7,
				name: d => d.properties.adm0_a3
			})
		.on("mouseover", (_, d) => mouseover_map(d))
		.on("mouseout", (_, d) => mouseout(d))

	d3.select("#name")
    .append("text")
    .attr("transform", "translate(0, 40	)")
    .text(" ")
}

////////////////////////////////////////////////////////////////////////////////
////////////////////////////// hover function //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function mouseover_line(d) {
	var region_un = d3.select('#select_cont').property('value');
	var subregion = d3.select('#select_sub_cont').property('value')

	d3.select("#series")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": e => e.Name === d.Name ? 12:5
		});

	if (region_un === "All") {
		d3.select("#map")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": e => e.properties.region_un === d.Name ? 2:1,
			"stroke-opacity":  e => e.properties.region_un === d.Name ? 1:0.3,
			"fill-opacity": e => e.properties.region_un === d.Name ? 1:0.7
		});
	} else if (subregion === "All") {
		d3.select("#map")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": e => e.properties.subregion === d.Name ? 2:1,
			"stroke-opacity":  e => e.properties.subregion === d.Name ? 1:0.3,
			"fill-opacity": e => e.properties.subregion === d.Name ? 1:0.7
		});
	} else {
		d3.select("#map")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": e => e.properties.statistics[0].Country === d.Name ? 2:1,
			"stroke-opacity":  e => e.properties.statistics[0].Country === d.Name ? 1:0.3,
			"fill-opacity": e => e.properties.statistics[0].Country === d.Name ? 1:0.7
		});
	}

	d3.select("#name")
		.select("text")
		.text(d.Name)

	d3.select(".plot")
		.selectAll("#legend")
		.selectAll("rect")
		.transition().duration(200)
		.attrs({
			"height": e => e === d.Name ? 12:6
		})

	d3.select(".plot")
		.selectAll("#legend")
		.selectAll("text")
		.transition().duration(200)
		.attrs({
			"fill": e => e === d.Name ? "red":"black",
			"font-weight": e => e === d.Name ? 900:100
		})
}

function mouseover_map(d) {
	var region_un = d3.select('#select_cont').property('value');
	var subregion = d3.select('#select_sub_cont').property('value')
	d3.select("#map")
	.selectAll("path")
	.transition().duration(200)
	.attrs({
		"stroke-width": e => e.properties.statistics[0].Country === d.properties.statistics[0].Country ? 2:1,
		"stroke-opacity":  e => e.properties.statistics[0].Country === d.properties.statistics[0].Country ? 1:0.3,
		"fill-opacity": e => e.properties.statistics[0].Country === d.properties.statistics[0].Country ? 1:0.7
	});

	d3.select("#name")
		.select("text")
		.text(d.properties.statistics[0].Country)

	if (region_un === "All") {

		d3.select("#series")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": e => e.Name === d.properties.region_un ? 12:5
		});

		d3.select(".plot")
			.selectAll("#legend")
			.selectAll("rect")
			.transition().duration(200)
			.attrs({
				"height": e => e === d.properties.region_un ? 12:6
			})

		d3.select(".plot")
			.selectAll("#legend")
			.selectAll("text")
			.transition().duration(200)
			.attrs({
				"fill": e => e === d.properties.region_un ? "red":"black",
				"font-weight": e => e === d.properties.region_un ? 900:100
			})

		d3.select("#heatmap")
			.selectAll("rect")
			.transition().duration(200)
			.attrs({
				"stroke-width": e => e.Name == d.properties.region_un ? 2:1,
				"stroke-opacity": e => e.Name == d.properties.region_un ? 1:0.5,
				"fill-opacity": e => e.Name == d.properties.region_un ? 1:0.7
			})

	} else if (subregion === "All") {

		d3.select("#series")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": e => e.Name === d.properties.subregion ? 12:5
		});

		d3.select(".plot")
			.selectAll("#legend")
			.selectAll("rect")
			.transition().duration(200)
			.attrs({
				"height": e => e === d.properties.subregion ? 12:6
			})

		d3.select(".plot")
			.selectAll("#legend")
			.selectAll("text")
			.transition().duration(200)
			.attrs({
				"fill": e => e === d.properties.subregion ? "red":"black",
				"font-weight": e => e === d.properties.subregion ? 900:100
			})

		d3.select("#heatmap")
			.selectAll("rect")
			.transition().duration(200)
			.attrs({
				"stroke-width": e => e.Name == d.properties.subregion ? 2:1,
				"stroke-opacity": e => e.Name == d.properties.subregion ? 1:0.5,
				"fill-opacity": e => e.Name == d.properties.subregion ? 1:0.7
			})

	} else {
		d3.select("#series")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": e => e.Name === d.properties.statistics[0].Country ? 12:5
		});

		d3.select(".plot")
			.selectAll("#legend")
			.selectAll("rect")
			.transition().duration(200)
			.attrs({
				"height": e => e === d.properties.statistics[0].Country ? 12:6
			})

		d3.select(".plot")
			.selectAll("#legend")
			.selectAll("text")
			.transition().duration(200)
			.attrs({
				"fill": e => e === d.properties.statistics[0].Country ? "red":"black",
				"font-weight": e => e === d.properties.statistics[0].Country ? 900:100
			})

		d3.select("#heatmap")
			.selectAll("rect")
			.transition().duration(200)
			.attrs({
				"stroke-width": e => e.Name == d.properties.statistics[0].Country ? 2:1,
				"stroke-opacity": e => e.Name == d.properties.statistics[0].Country ? 1:0.5,
				"fill-opacity": e => e.Name == d.properties.statistics[0].Country ? 1:0.7
			})
	}
}

function mouseover_heatmap(d) {
	var region_un = d3.select('#select_cont').property('value');
	var subregion = d3.select('#select_sub_cont').property('value')

	d3.select("#heatmap")
		.selectAll("rect")
		.transition().duration(200)
		.attrs({
			"stroke-width": e => e.Name == d.Name ? 3:1,
			"stroke-opacity": e => e.Name == d.Name ? 1:0.5,
			"fill-opacity": e => e.Name == d.Name ? 1:0.7
		})

	if (region_un === "All") {
		d3.select("#map")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": e => e.properties.region_un === d.Name ? 2:1,
			"stroke-opacity":  e => e.properties.region_un === d.Name ? 1:0.3,
			"fill-opacity": e => e.properties.region_un === d.Name ? 1:0.7
		});
	} else if (subregion === "All") {
		d3.select("#map")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": e => e.properties.subregion === d.Name ? 2:1,
			"stroke-opacity":  e => e.properties.subregion === d.Name ? 1:0.3,
			"fill-opacity": e => e.properties.subregion === d.Name ? 1:0.7
		});
	} else {
		d3.select("#map")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": e => e.properties.statistics[0].Country === d.Name ? 2:1,
			"stroke-opacity":  e => e.properties.statistics[0].Country === d.Name ? 1:0.3,
			"fill-opacity": e => e.properties.statistics[0].Country === d.Name ? 1:0.7
		});
	}

	d3.select("#name")
		.select("text")
		.text(d.Name)
}

function mouseout(d) {
	d3.select("#series")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": 5
		})

	d3.select("#heatmap")
		.selectAll("rect")
		.transition().duration(200)
		.attrs({
			"stroke-width": 1,
			"stroke-opacity": 0.5,
			"fill-opacity": 0.7
		})


	d3.select("#map")
		.selectAll("path")
		.transition().duration(200)
		.attrs({
			"stroke-width": 1,
			"stroke": "black",
			"stroke-opacity": 0.3,
			"fill-opacity": 0.7
		})

	d3.select("#name")
		.select("text")
		.text(" ")

	d3.select(".plot")
		.selectAll("#legend")
		.selectAll("rect")
		.transition().duration(200)
		.attrs({
			"height": 6
		})

	d3.select(".plot")
		.selectAll("#legend")
		.selectAll("text")
		.transition().duration(200)
		.attrs({
			"fill": "black",
			"font-weight": 100
		})

}

////////////////////////////////////////////////////////////////////////////////
///////////////////////////// Button function //////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

function button_year(data) {
	var forwardButton = d3.select("#forward_button")
			.attr("value", 2001)
			.on('click', function(event, d){
				const next_year = Number(d3.select(this).property("value")) + 1;
				if (next_year <= 2015) {
					change_year(next_year);
					update_map_color(data);
					const plot = d3.select("#select_plot").property("value");
					if (plot === "Line plot") {
						update_line_on_click(data);
					} else {
						update_heatmap_on_click(data);
					}

				}
			});
	var backwardButton = d3.select("#backward_button")
			.attr("value", 2001)
			.on('click', function(event, d){
				const next_year = Number(d3.select(this).property("value")) - 1;
				if (next_year >= 2001) {
					change_year(next_year);
					update_map_color(data);
					const plot = d3.select("#select_plot").property("value");
					if (plot === "Line plot") {
						update_line_on_click(data);
					} else {
						update_heatmap_on_click(data);
					}
				}
			});
	d3.select("#year").append("text").text("2001")
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
				const plot = d3.select("#select_plot").property("value");
				if (plot === "Line plot") {
					update_line_on_click(data);
				} else {
					update_heatmap_on_click(data);
				}
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

function button_plot(data) {
	var choice = ["Line plot", "Heatmap"];
	var select = d3.select("#select_plot")
			.on('change', function(event, d){
				const plot = d3.select(this).property("value");
				var selected_countries = line_select_country(data);
				if (plot === "Line plot") {
					d3.select(".plot").select("#axes")
						.selectAll("*")
						.remove()

					d3.select(".plot").select("#heatmap")
						.selectAll("rect")
						.attrs({
							"stroke-opacity": 0.5,
							"fill-opacity": 0.7
						})
						.transition().duration(500)
						.attrs({
							"stroke-opacity": 0,
							"fill-opacity": 0
						})
						.remove()

					scales = make_scales(selected_countries);
					add_axes(scales)
					update_line_on_click(data);
				} else {
					d3.select(".plot").selectAll(".dot")
						.attr("opacity", 1)
						.transition().duration(500)
						.attr("opacity", 0).remove()
					d3.select(".plot").select("#series")
						.selectAll("path")
						.attr("opacity", 1)
						.transition().duration(500)
						.attr("opacity", 0).remove()
					d3.select(".plot").select("#axes")
						.selectAll("*")
						.remove()
					d3.select(".plot").selectAll("#legend")
						.attr("opacity", 1)
						.transition().duration(500)
						.attr("opacity", 0).remove()
					scales = scale_heatmap(selected_countries);
					add_heatmap_axis(scales)
					update_heatmap_on_click(data);
				}
			});

	var options = select.selectAll('option')
				.data(choice).enter()
				.append('option')
				.text(function(d) {
					return d;
				})
				.attr("value",function(d){
					return d;
				})
}

function button_continent(data) {
	var choice = ["All", "Asia", "Europe", "Africa", "Americas", "Oceania"];
	var select = d3.select('#select_cont')
			.on('change', function(event, d) {
				const selectedOption = d3.select(this).property("value");
				button_sub_continent(selectedOption, data);
				const plot = d3.select("#select_plot").property("value");
				if (plot === "Line plot") {
					update_line_on_click(data);
				} else {
					update_heatmap_on_click(data);
				}
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
				const plot = d3.select("#select_plot").property("value");
				if (plot === "Line plot") {
					update_line_on_click(data);
				} else {
					update_heatmap_on_click(data);
				}
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
