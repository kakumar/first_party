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
  res.setHeader('Content-Type', 'textplain');
  res.writeHead(200);
  console.log(uri.query.test_url);
  console.log(uri.query.script);
  var input_data = uri.query.test_url;
  if(uri.query.script){
	input_data = uri.query.script;
  }
  wpt.runTest(input_data, {

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
				setTimeout(checkStatus, 1000);
			} else {
				var client = request.createClient('http://pronto.insnw.net/');
				client.get("/domains.php?test="+init_res.data.testId+'&f=json', function(err, resp, body) {
					fv =body.domains.firstView;
					// foreach is synchronous
					fv.forEach(function(obj) {
					   console.log("Domain "+ obj.domain);
					   if (uri.query.nobl) {
						console.log('nobl');
						res.write(obj.domain+"\n")
					   } else {
						if (obj.domain.search(regex) == -1) {
							console.log('Not Blacklisted');
							res.write(obj.domain+"\n");
						} else{
							console.log('Blacklisted');
						}
					   }
					});
					res.end();
				});
			}
			});
		}
		checkStatus();
	});
});
  server.listen(process.argv[2]);
