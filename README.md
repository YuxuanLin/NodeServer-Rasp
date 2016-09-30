API:

1. Get the current sensor value:
	http://example.com:3000/current

	Example:
		GET http://example.com:3000/current
	
	Result:
		
		{
		  "timeStamp": 1475230695018,
		  "celsius": 22,
		  "pressure": 99.5073,
		  "meters": 91.8,
		  "RGB": 0
		}

2. Return a specific number of N updates stored in history where N is specified by the client:
	http://example.com:3000/history?num=N

	Example:
		GET http://49.127.101.85:3000/history?num=3
	
	Result:
		
		{
			"queryStatus":"success",
			"history":[
				{
					"timeStamp":1475233271988,
					"celsius":22,
					"pressure":99.5186,
					"meters":91.1,
					"RGB":0
				},
				{
					"timeStamp":1475233273932,
					"celsius":22,
					"pressure":99.5171,
					"meters":91.2,
					"RGB":0
				},
				{
					"timeStamp":1475233273932,
					"celsius":22,
					"pressure":99.5171,
					"meters":91.2,
					"RGB":0
				}
			]
		}

3. return a specific number of updates stored in history by a start and end time range as specified by the client:
	http://example.com:3000/time?start=4&end=sdfa3

	Example:
		GET http://49.127.101.85:3000/time?start=1475233380967&end=1475233388786
	
	Result:
		
		{
			"history":[
				{
					"timeStamp":1475233382950,
					"celsius":22,
					"pressure":99.5124,
					"meters":91.2,
					"RGB":0
				},
				{
					"timeStamp":1475233382950,
					"celsius":22,
					"pressure":99.5124,
					"meters":91.2
					,"RGB":0
				},
				{
					"timeStamp":1475233384954,
					"celsius":22,
					"pressure":99.5149,
					"meters":91.2,
					"RGB":0
				},
				{
					"timeStamp":1475233386865,
					"celsius":22,
					"pressure":99.5129,
					"meters":91.2,
					"RGB":0
				},
				{
					"timeStamp":1475233386865,
					"celsius":22,
					"pressure":99.5129,
					"meters":91.2,
					"RGB":0
				}
			],
			"queryStatus":"success"
		}

4. MQTT function
	
	Subscribe topic "FIT5140/sensors" to get pushed real time data.