//Header, import
var express = require('express');
var fs = require("fs");
var raspi = require("raspi-io");
var five = require("johnny-five");
var app = express();
var file = './data.json';


//-------------------------- Global variables --------------------------
// RGB transfer function
function toRGB(R,G,B){
	return "#"+(R).toString(16)+(G).toString(16)+(B).toString(16);
}
// Sensor Data Constructor
function SensorData() {
  // always initialize all instance properties
  this.timeStamp = 0;
  this.celsius = 0; 
  this.pressure = 0;
  this.meters = 0;
  this.RGB = 0;
}

var sensorData = new SensorData();

//---------------------------- MPL3115A2 ------------------------------
var board = new five.Board({
    io: new raspi()
});

board.on("ready", function() {
    var multi = new five.Multi({
        controller: "MPL3115A2",
        // Get elevation in metres from http://www.whatismyelevation.com
        elevation: 92
    });
    console.log("Server ready to begin processing...");

    multi.on("change", function() {
    	var date = new Date();
		sensorData.timeStamp = date.getTime();
    	sensorData.celsius = this.thermometer.celsius;
    	sensorData.pressure = this.barometer.pressure;
    	sensorData.meters = this.altimeter.meters;
	 	console.log("Therometer:celsius: ", this.thermometer.celsius);
        console.log("Barometer:pressure = ", this.barometer.pressure);
        console.log("Altimeter = ", this.altimeter.meters);
        console.log("Time = ", sensorData.timeStamp);
    });
});


//-------------------------- File system --------------------------

// Add object to file
function appendObject(obj){
	
	var obj_data = getHistoryDataObjects();
	obj_data.push(obj);// add items to array in nodejs
	var mod_data = JSON.stringify(obj_data)// Json object to string
	fs.writeFileSync(file, JSON.stringify(obj_data)); // Write to file
}

function getHistoryDataObjects(){
	var raw_data;
	//Read data from file: ./data.json
	try {
		raw_data = fs.readFileSync(file);
	} catch (err) {
		//If file doesn't exist, create a new one with '[]'
		console.log('data.json does not exist');
	  	fs.writeFile(file, '[]', function (err) {
	        if (err) throw err;
	        console.log('data.json has been created');
    	});
	}
	
	//parse json string to object
	try {
    	var obj_data = JSON.parse(raw_data);
	} catch (e) {
		//No data exist in file, create '[]' now
	  	console.log('No data existed in file data.json, creating now...');
	    var obj_data = [];
	}

	return obj_data;
}

//Start loop
setInterval(function() { 
	appendObject(sensorData);
}, 1000);


//-------------------------- URL requests --------------------------
// Get request
// 1. return the current value for the sensor: 
// http://example.com/current
app.get('/current', function (req, res) {
	console.log("Reqest current data from: " + req.ip);
	res.json(sensorData);
});

// 2. return a specific number of N updates stored in history where N is specified by the client: 
// http://example.com/history?num=N
app.get('/history',function(req,res){
	console.log("Request latest history data : " + req.query.num + " entries");
	var history = getHistoryDataObjects();
	var result = {};

	if (req.query.num <= history.length){
		
		result.queryStatus = 'success';
		result.history = history.slice(history.length - req.query.num);
	}
	else{
		result.queryStatus = 'No so many enties';
	}

	var rs_data = JSON.stringify(result);
	console.log(rs_data);
	res.send(rs_data);
});

// 3. return a specific number of updates stored in history by a start and end time range as specified by the client: 
// http://example.com/time?start=4&end=sdfa3
app.get('/time',function(req,res){
	
	var result = {};

	//Examine url valid or not
	if ((typeof req.query.start != 'undefined') || (typeof req.query.end != 'undefined')) 
	{	
		var date = new Date();
		var ts = date.getTime();

		//Valid if start is less than end, and if end is less than now
		if((req.query.start <= req.query.end) && (req.query.end < ts)){
			var history = getHistoryDataObjects();
			result.history = [];
			for (var i = 0; i < history.length; i++) {
				if ( (history[i].timeStamp >= req.query.start) && (history[i].timeStamp <= req.query.end)){
					result.history.push(history[i]);
				}
			}
			result.queryStatus = 'success';
		}else{
			result.queryStatus = 'Query start time or end time not valid: could be one of those reasons: 1. start time is bigger than end time; 2. end time is bigger then time when this request received';
		}
	}else{
		result.queryStatus = 'Query parameters invalid: Do you miss start time or end time?';
	}

	var rs_data = JSON.stringify(result);
	console.log(rs_data);
	res.send(rs_data);
});

//-------------------------- Start listening --------------------------
// Listen to 3000 port
app.listen(3000, function () {
  console.log('App listening on port 3000!');
});