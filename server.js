//Header, import
var express = require('express');
var fs = require("fs");
// var raspi = require("raspi-io");
// var five = require("johnny-five");
var app = express();
var file = './data.json';
// RGB transfer function
function toRGB(R,G,B){
	return "#"+(R).toString(16)+(G).toString(16)+(B).toString(16);
}

//-------------------------- Global variables --------------------------

var celsiusGB = 1;
var pressureGB = 2;
var metersGB = 3;
var RGB = toRGB(1,2,3);
var date = new Date();
var timeStamp = date.getTime();



//---------------------------- MPL3115A2 ------------------------------
// var board = new five.Board({
//     io: new raspi()
// });

// board.on("ready", function() {
//     var multi = new five.Multi({
//         controller: "MPL3115A2",
//         // Get elevation in metres from http://www.whatismyelevation.com
//         elevation: 92
//     });
//     console.log("Server ready to begin processing...");

//     multi.on("change", function() {
// 		timeStamp = date.getTime();
//     	celsiusGB = this.thermometer.celsius;
//     	pressureGB = this.barometer.pressure;
//     	metersGB = this.altimeter.meters;

//         // console.log("Therometer:celsius: ", this.thermometer.celsius);
//         // console.log("Barometer:pressure = ", this.barometer.pressure);
//         // console.log("Altimeter = ", this.altimeter.meters);
//     });
// });


//-------------------------- File system --------------------------

// Data structure:  timeStamp,celsiusGB,pressureGB,metersGB,RGB;
function writeToFile(){
	//Prepare data
	timeStamp = date.getTime();
	var rawdata =  {
		'Time': timeStamp,
		'Celsius': celsiusGB,
		'Pressure': pressureGB,
		'Meters': metersGB,
		'RGB': RGB
	};
	appendObject(rawdata);
}

// Add object to file
function appendObject(obj){
	var raw_data;

	try {
		//Read data from file: ./data.json
		raw_data = fs.readFileSync(file);
	} catch (err) {
		//If file doesn't exist, create a new one with '[]'
		console.log('data.json does not exist');
	  	fs.writeFile(file, '[]', function (err) {
	        if (err) throw err;
	        console.log('data.json has been created');
    	});
	}
	
	try {
    	var obj_data = JSON.parse(raw_data);//parse json string to object
	} catch (e) {
		//No data exist in file, create '[]' now
	  	console.log('No data existed in file data.json, creating now...');
	    var obj_data = [];
	}

	obj_data.push(obj);// add items to array in nodejs
	var mod_data = JSON.stringify(obj_data)// Json object to string
	fs.writeFileSync(file, JSON.stringify(obj_data)); // Write to file

}

//Start loop
setInterval(function() { 
	writeToFile();
	console.log("setInterval: It's been one second!"); 
}, 1000);


//-------------------------- URL requests --------------------------
// Get request
// 1. return the current value for the sensor: 
// http://example.com/current
app.get('/current', function (req, res) {
	
	console.log("current");
	res.json({current:'current'});
});

// 2. return a specific number of N updates stored in history where N is specified by the client: 
// http://example.com/history?num=N
app.get('/history',function(req,res){
	console.log("History: " + req.query.num);
	res.json({history:req.query.num});
});

// 3. return a specific number of updates stored in history by a start and end time range as specified by the client: 
// http://example.com/time?start=4&end=sdfa3
app.get('/time',function(req,res){
	if ((typeof req.query.start != 'undefined') || (typeof req.query.end != 'undefined')) 
	{	//Examine url valid or not
		console.log("start time: " + req.query.start);
		console.log("end time: " + req.query.end);
		res.json({ "start time": req.query.start });
	
	}else{
		res.json({ "bad request": "bad request" });
	}
});



//-------------------------- Start listening --------------------------
// Listen to 3000 port
app.listen(3000, function () {
  console.log('App listening on port 3000!');
});