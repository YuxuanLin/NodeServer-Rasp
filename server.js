//Header, import
var express = require('express');
var fs = require("fs");
var raspi = require("raspi-io");
var five = require("johnny-five");
var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://broker.hivemq.com')
var app = express();
var file = './data.json';
var i2c = require("i2c");//i2c for color sensor

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
	this.R = 0;
	this.G = 0;
	this.B = 0;
	this.C = 0;
}

var sensorData = new SensorData();

// TCS34725 Sensor 
var address = 0x29;// i2c bus address
var version = 0x44;// Sensor version
var rgbSensor = new i2c(address, {device: '/dev/i2c-1'});

// Variables to store colour values
var red;
var green;
var blue;
var clear;

//---------------------------- MPL3115A2 ------------------------------
//Create board for detecting sensor MPL3115
var board = new five.Board({
    io: new raspi()
});

//Main loop for detecting sensors
board.on("ready", function() {
    var multi = new five.Multi({
        controller: "MPL3115A2",
        // Get elevation in metres from http://www.whatismyelevation.com
        elevation: 92
    });
    console.log("Server ready to begin processing...");

	// Run setup if we can retreive correct sensor version for TCS34725 sensor
	rgbSensor.writeByte(0x80|0x12, function(err){});
	rgbSensor.readByte(function(err, res) {
	    if(res == version) {
	        setup();
		   	captureColours();//Fetch data from sensor and put them into sensorData
	    }
	});

	//fetch data on change of MPL
    multi.on("change", function() {
    	var date = new Date();
		sensorData.timeStamp = date.getTime();
    	sensorData.celsius = this.thermometer.celsius;
    	sensorData.pressure = this.barometer.pressure;
    	sensorData.meters = this.altimeter.meters;

    	captureColours();
	 	console.log("Therometer:celsius: ", this.thermometer.celsius);
        console.log("Barometer:pressure = ", this.barometer.pressure);
        console.log("Altimeter = ", this.altimeter.meters);
        console.log("Time = ", sensorData.timeStamp);
   
    });
});

//---------------------------- TCS34725 ------------------------------

// Set up for TCS34725
function setup() {
    // Enable register
    rgbSensor.writeByte(0x80|0x00, function(err){});

    // Power on and enable RGB sensor
    rgbSensor.writeByte(0x01|0x02, function(err){});
	
    // Read results from Register 14 where data values are stored
    // See TCS34725 Datasheet for breakdown
    rgbSensor.writeByte(0x80|0x14, function(err){});
}

// Fetch colors from color sensor
function captureColours() {
    // Read the information, output RGB as 16bit number
    rgbSensor.read(8, function(err, res) {
        // Colours are stored in two 8bit address registers, we need to combine them into a 16bit number, 0 and 1 are for clear registers
        // Read byte, 8bit, -->  16bit int
        sensorData.C = res[1] << 8 | res[0];
        sensorData.R = res[3] << 8 | res[2];
        sensorData.G = res[5] << 8 | res[4];
        sensorData.B = res[7] << 8 | res[6];

        // Print data to console
        console.log("Clear: " + sensorData.C);
        console.log("Red: " + sensorData.R);
        console.log("Green: " + sensorData.G);
        console.log("Blue: " + sensorData.B);
    });
}


//-------------------------- MQTT system --------------------------
// For Mqtt connection, set subject
client.on('connect', () => {  
  var data = JSON.stringify(sensorData);
  client.publish('FIT5140/sensors', data);
  console.log("-----------------Connect to mqtt------------------");
})

// Push data every one second
setInterval(function() { 
	var data = JSON.stringify(sensorData);
  	client.publish('FIT5140/sensors', data);
}, 1000);


//-------------------------- File system --------------------------

// Add object to file
function appendObject(obj){
	
	var obj_data = getHistoryDataObjects();
	obj_data.push(obj);// add items to array in nodejs
	var mod_data = JSON.stringify(obj_data)// Json object to string
	fs.writeFileSync(file, JSON.stringify(obj_data)); // Write to file
}

// Get history data from history file
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
		result.resultNumber = result.history.length;
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
			result.resultNumber = result.history.length;
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