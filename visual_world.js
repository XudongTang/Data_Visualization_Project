let width = 1200;
let height = 1800;
let margins = {top: 50, bottom: 50, left: 50, right: 50}

function main(data) {
	data[1] = parse(data[1]);
	data[0] = merge_country(data);
	draw_map(data[0]);
	scales = make_scales(data[1]);
	draw_line(data[1], scales)
}

function parse(data){
	const res = [];
	var res2 = [];
	cur_country = data[0].Country;
	for(let i = 0; i < data.length; i++){
		data[i].Year = (new Date(data[i].Year + '-01-03')).getFullYear();
		if(data[i].Country === cur_country){
			res2.splice(0, 0, data[i]);
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
	    fill: d3.scaleOrdinal()
	        .domain(["1. High income: OECD", "2. High income: nonOECD", "3. Upper middle income"
			, "4. Lower middle income", "5. Low income"])
		.range(["#47abd8", "#d2f2fc", "#fcc5c5", "#f07575", "#7d1919"])
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
			//FIXME placeholder
			fill: d => scale.fill(d.properties.income_grp),
                        "stroke-width": 1,
			stroke: 'black'
                });
}

Promise.all([
	d3.json("world_map.json"),
    	//d3.json("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"),
	d3.csv("life_expectancy_data.csv")
]).then(main)
