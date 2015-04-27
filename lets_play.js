var WebPagetest = require('webpagetest'),
    os         = require('os'),
    url         = require('url'),
    request = require('request-json'),
    http        = require('http');

var wpt = new WebPagetest('pronto.insnw.net');
process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

console.log(process.argv[2]);
var fs = require('fs');
var blacklist = fs.readFileSync(process.argv[3]).toString().trim().split("\n");
var regex = new RegExp('('+blacklist.join("|")+')','ig')

var server = http.createServer(function (req, res) {

  var uri = url.parse(req.url, true);
  res.writeHead(200, {"Content-Type": "application/json"});
  console.log(uri.query.test_url);
  var test_url = uri.query.test_url;
  wpt.runTest(test_url, {
        label: "ProntoX-analyze",
  	firstViewOnly: true,
	location: 'us-east-1:Chrome',
	ignoreSSL:true,
	connectivity:'Native',
	runs: 1,
	priority: 0,
	disableOptimization: true,
	disableScreenshot: true,
	keepOriginalUserAgent: true,
	key: '33f6b472561edfcf6130b2a65b687104f9ed5d62'
	},function(err, init_res) {
		function checkStatus() {
		   wpt.getTestStatus(init_res.data.testId, function (err, resp_data) {
			if (!resp_data.data.completeTime) {
				// polling status (every second)
				setTimeout(checkStatus, 1500);
			} else {
				var client = request.createClient('http://pronto.insnw.net/');
				client.get("/export.php?run=1&cached=0&bodies=1&pretty=1&test="+init_res.data.testId, function(err, resp, body) {
					res.write(JSON.stringify(body));
				//	fv =body.domains.firstView;
				//	// foreach is synchronous
				//	fv.forEach(function(obj) {
				//	   if (uri.query.nobl) {
				//		res.write(obj.domain+"\n")
				//	   } else {
				//		if (obj.domain.search(regex) == -1)  res.write(obj.domain+"\n");
				//	   }
				//	});
					res.end();
				});
			}
			});
		}
		checkStatus();
	});
});
  server.listen(process.argv[2]);
