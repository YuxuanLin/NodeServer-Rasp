var i2c = require("i2c");

// TCS34725 Sensor
var address = 0x29;
var version = 0x44;
var rgbSensor = new i2c(address, {device: '/dev/i2c-1'});

// Variables to store colour values
var red;
var green;
var blue;

// Run setup if we can retreive correct sensor version for TCS34725 sensor
rgbSensor.writeByte(0x80|0x12, function(err){});
rgbSensor.readByte(function(err, res) {
    if(res == version) {
        setup();

    	// Attempt to capture colours and print to console
    	// Note: You may get 0 as a value for a first-time run for a synchronous operation
    	//       as the colour sensor has not had enough time to record values. This shouldn't
        //       be an issue if you have a HTTP endpoint which must be invoked.
	   captureColours();
    }
});


function setup() {
    // Enable register
    rgbSensor.writeByte(0x80|0x00, function(err){});

    // Power on and enable RGB sensor
    rgbSensor.writeByte(0x01|0x02, function(err){});
	
    // Read results from Register 14 where data values are stored
    // See TCS34725 Datasheet for breakdown
    rgbSensor.writeByte(0x80|0x14, function(err){});
}

function captureColours() {
    // Read the information, output RGB as 16bit number
    rgbSensor.read(8, function(err, res) {
        // Colours are stored in two 8bit address registers, we need to combine them into a 16bit number
        red = res[3] << 8 | res[2];
        green = res[5] << 8 | res[4];
        blue = res[7] << 8 | res[6];

        // Print data to console
        console.log("Red: " + red);
        console.log("Green: " + green);
        console.log("Blue: " + blue);
    });
}