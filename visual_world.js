let width = 1500;
let height = 1200;

function main(data) {
	parse(data[1])
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
	console.log(res)
}

Promise.all([
    d3.json("https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson"),
	d3.csv("life_expectancy_data.csv")
]).then(main)
