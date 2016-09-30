API:

1. Get the current sensor value:
	http://example.com:3000/current

2. Return a specific number of N updates stored in history where N is specified by the client:
	http://example.com:3000/history?num=N
	
3. return a specific number of updates stored in history by a start and end time range as specified by the client:
	http://example.com:3000/time?start=4&end=sdfa3