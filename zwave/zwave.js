module.exports = function(RED) {
	function read(n) {
		RED.nodes.createNode(this, n);
		var node = this;
		var OpenZWave = require('/home/informix/node-red/node_modules/openzwave/lib/openzwave.js');
		var zwaveNodes = [];
		var msg = {};
		msg.payload = {};

		var zwave = new OpenZWave( n.device, {
			saveconfig: true,
			driverattempts: 3,
			pollinterval: 10000,
			suppressrefresh: true,
		});
		
		zwave.on('driver ready', function(homeid) {
			console.log('scanning homeid=0x%s...', homeid.toString(16));
		});
		
		zwave.on('driver failed', function() {
			console.log('failed to start driver');
			zwave.disconnect();
		});


		zwave.on('node added', function(nodeid) {
			console.log('Node added');
			zwaveNodes[nodeid] = {
				manufacturer: '',
				manufacturerid: '',
				product: '',
				producttype: '',
				productid: '',
				type: '',
				name: '',
				loc: '',
				classes: {},
				ready: false,
			};
		});

		zwave.on('notification', function(nodeid, notif) {
			console.log("notification: " + nodeid + ", notification: " + notif);
		});

		zwave.on('value added', function(nodeid, comclass, value) {
			if (!zwaveNodes[nodeid]['classes'][comclass])
				zwaveNodes[nodeid]['classes'][comclass] = {};
			zwaveNodes[nodeid]['classes'][comclass][value.index] = value;
		});


		zwave.on('value changed', function(nodeid, comclass, value) {
			if (zwaveNodes[nodeid]['ready']) {
				var data = {};
				/*data.label = value['label'];
				data.value = value['value'];
				data.units = value['units']*/
				msg.payload.data = value;
				msg.payload.id = nodeid + "." + value['label'];
				msg.payload.command = comclass;
			}
			zwaveNodes[nodeid]['classes'][comclass][value.index] = value;
			if(msg.payload.id) {
				node.send(msg);
			}
			
		});

		zwave.on('value removed', function(nodeid, comclass, index) {
			if (zwaveNodes[nodeid]['classes'][comclass] &&
				zwaveNodes[nodeid]['classes'][comclass][index])
					delete zwaveNodes[nodeid]['classes'][comclass][index];
		});

		zwave.on('node ready', function(nodeid, nodeinfo) {
			zwaveNodes[nodeid]['manufacturer'] = nodeinfo.manufacturer;
			zwaveNodes[nodeid]['manufacturerid'] = nodeinfo.manufacturerid;
			zwaveNodes[nodeid]['product'] = nodeinfo.product;
			zwaveNodes[nodeid]['producttype'] = nodeinfo.producttype;
			zwaveNodes[nodeid]['productid'] = nodeinfo.productid;
			zwaveNodes[nodeid]['type'] = nodeinfo.type;
			zwaveNodes[nodeid]['name'] = nodeinfo.name;
			zwaveNodes[nodeid]['loc'] = nodeinfo.loc;
			zwaveNodes[nodeid]['ready'] = true;
			console.log('node%d: %s, %s', nodeid,
				nodeinfo.manufacturer ? nodeinfo.manufacturer
					: 'id=' + nodeinfo.manufacturerid,
				nodeinfo.product ? nodeinfo.product
					: 'product=' + nodeinfo.productid +
					', type=' + nodeinfo.producttype);
			console.log('node%d: name="%s", type="%s", location="%s"', nodeid,
				nodeinfo.name,
				nodeinfo.type,
				nodeinfo.loc);
			for (comclass in zwaveNodes[nodeid]['classes']) {
				switch (comclass) {
				case 0x25: // COMMAND_CLASS_SWITCH_BINARY
				case 0x26: // COMMAND_CLASS_SWITCH_MULTILEVEL
					zwave.enablePoll(nodeid, comclass);
					break;
				}
				var values = zwaveNodes[nodeid]['classes'][comclass];
				console.log('node%d: class %d', nodeid, comclass);
				for (idx in values)
					console.log('node%d: %s=%s', nodeid, values[idx]['label'], values[idx]['value']);
			}
		});

		
		zwave.on('notification', function(nodeid, notif) {
			switch (notif) {
			case 0:
				console.log('node%d: message complete', nodeid);
				break;
			case 1:
				console.log('node%d: timeout', nodeid);
				break;
			case 2:
				break;
			case 3:
				console.log('node%d: node awake', nodeid);
				break;
			case 4:
				console.log('node%d: node sleep', nodeid);
				break;
			case 5:
				console.log('node%d: node dead', nodeid);
				break;
			case 6:
				console.log('node%d: node alive', nodeid);
				break;
			}
		});
	
		zwave.on('scan complete', function() {
			console.log('scan complete, hit ^C to finish.');
		});

		zwave.connect();

		process.on('SIGINT', function() {
			console.log('disconnecting...');
			zwave.disconnect();
			process.exit();
		});
		
		node.on('input', function(msg) {
			if(msg.payload.id && msg.payload.command) {
				if( msg.payload.command == "off" ) {
					zwave.switchOff(msg.payload.id);
				}
				else if( msg.payload.command == "on" ) {
					zwave.switchOn(msg.nodeid);
				}	
			}
		});

		node.close = function() {
			console.log('closing');
			zwave.disconnect();
		};
	
	}

	RED.nodes.registerType('zwave', read);
}
