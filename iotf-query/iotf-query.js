module.exports = function(RED) {
	var https = require('https');
	
	function configNode(n) {
		RED.nodes.createNode(this, n);
		this.key = n.key;
		this.token = n.token;
		this.name = n.name;
		this.org = n.org;
	}

	RED.nodes.registerType("iotf-auth", configNode);
	
	function transform(n) {
		RED.nodes.createNode(this,n);
		var node = this;
		
		var iot_foundation_api_options = {
			  port: 443,
			  rejectUnauthorized: false
		};

		node.on('input', function(msg) {
			node.auth = RED.nodes.getNode( n.auth );
			var api_key = node.auth.key;
			var auth_token = node.auth.token;
			var org = node.auth.org;
			var evt_type = n.evttype;
			iot_foundation_api_options.auth = api_key + ':' + auth_token;
			
			var query = {};
			var url = '/api/v0001/historian';
			if(n.devtype != "all") {
				url = url + "/" + n.devtype;
				if(n.devid != "all") {
					url = url + "/" + n.devid;
				}
			}
			
			iot_foundation_api_options.hostname = org +'.internetofthings.ibmcloud.com';
			iot_foundation_api_options.path=url;
			
			var http_req = https.get(iot_foundation_api_options, function(http_res) {
			var data = [];
			//check for http success
			if (http_res.statusCode==200)
			{
			  http_res.on('data', function(chunk) {
				data.push(chunk);
			  });

			  http_res.on('end',function(){
				var result = JSON.parse(data.join(''));
				query.payload = [];
				if( typeof result != "undefined" ) {
					for( var x = 0; x < result.length; x++ ) {
						if(evt_type != "") {
							if(result[x].evt_type == evt_type) {
								query.payload.push(result[x]);
							}
						}
						else {
							query.payload = result;
						}
					}
					node.send(query);
				}
			  });
			}
			else
			{
			  console.log('Request for ' + iot_foundation_api_options.path + ' did not succeed and returned HTTP Status code ' + http_res.statusCode);
			}
		  });
		  http_req.end();
		  http_req.on('error', function(e) {
			console.log('Request for ' + iot_foundation_api_options.path + ' failed with : \n'+ e);
		  });
		});
		  
		
		RED.httpNode.get('/devices', function(req, res) {
			node.auth = RED.nodes.getNode( n.auth );
			var api_key = node.auth.key;
			var auth_token = node.auth.token;
			var org = node.auth.org;
			
			url = '/api/v0001/organizations/' + org + '/devices';
			iot_foundation_api_options.hostname = 'internetofthings.ibmcloud.com';
			iot_foundation_api_options.path=url;
			iot_foundation_api_options.auth = api_key + ':' + auth_token;
			
			var data = [];
			var http_req = https.get(iot_foundation_api_options, function(http_res) {
				if(http_res.statusCode == 200) {
					http_res.on('data', function(chunk) {
						data.push(chunk);
					});

					http_res.on('end',function(){
							if(data[0]) {
								var result = JSON.parse(data.join(''));
								res.send(result);
							}
						
					});
				}
				else {
					var result = null;
					res.send(result);
					console.log('Request for ' + iot_foundation_api_options.path + ' did not succeed and returned HTTP Status code ' + http_res.statusCode);
				}
				
			});
			http_req.end();
			http_req.on('error', function() {
				console.log('Request for ' + iot_foundation_api_options.path + ' failed with : \n'+ e);
				var result = null;
				res.send(result);
			});
		});
		
		RED.httpNode.get('/devices/:type', function(req, res) {
			node.auth = RED.nodes.getNode( n.auth );
			var api_key = node.auth.key;
			var auth_token = node.auth.token;
			var org = node.auth.org;
			
			url = '/api/v0001/organizations/' + org + '/devices/' + req.params.type;
			iot_foundation_api_options.hostname = 'internetofthings.ibmcloud.com';
			iot_foundation_api_options.path=url;
			iot_foundation_api_options.auth = api_key + ':' + auth_token;
			
			var data = [];
			
			var http_req = https.get(iot_foundation_api_options, function(http_res) {
				if(http_res.statusCode == 200) {
					http_res.on('data', function(chunk) {
						data.push(chunk);
					});

					http_res.on('end',function(){
						if(data[0]) {
							var result = JSON.parse(data.join(''));
							res.send(result);
						}
					});
				}
				else {
					var result = null;
					res.send(result);
					console.log('Request for ' + iot_foundation_api_options.path + ' did not succeed and returned HTTP Status code ' + http_res.statusCode);
				}
			});
			http_req.end();
			http_req.on('error', function() {
				console.log('Request for ' + iot_foundation_api_options.path + ' failed with : \n'+ e);
				var result = null;
				res.send(result);
			});
		});
	}
	RED.nodes.registerType("iotf-query", transform);
}
	
