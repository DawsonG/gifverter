importScripts('lib/ffmpeg-all-codecs.js');
importScripts('shared.js');

function print(text) {
	postMessage({
		'type' : 'stdout',
		'data' : text
	});
}

function parseArguments(qf) {
	var text = qf.command.cmd.replace(/\s+/g, ' ');
	var args = [];
	// Allow double quotes to not split args.
	text.split('"').forEach(function(t, i) {
		t = t.trim();
		if ((i % 2) === 1) {
			args.push(t);
		} else {
			args = args.concat(t.split(" "));
		}
	});

	for(var i = 0; i < args.length; i++) {
		if (args[i].startsWith("$output.")) {
			args[i] = args[i].replace('$output', qf.fileName.split('.')[0]);
			continue;
		}

		switch (args[i]) {
			case "$input":
				args[i] = qf.fileName;
				break;
			case "$size":
				args[i] = qf.size;
				break;
			case "$sizeAdjusted":
				//Some conversions require the result to be divisible by two
				//if 
				break;
			case "$output":
				args[i] = qf.fileName;
				break;
		}
	}
	return args;
}



onmessage = function(event) {
	var message = event.data;
	

	switch (message.type) {
		case "run-queue":
			var Module = {
				print: print,
				printErr: print,
				TOTAL_MEMORY: 268435456,
				files: [],
				arguments: ""
			}

			var time = new Date();
			for (var i = 0; i < message.queue.length; i++) {
				var qf = message.queue[i];

				Module.files = [{name: qf.fileName, data: qf.fileData}];
				Module.arguments = parseArguments(qf);

				postMessage({
					'type' : 'start',
					'key' : qf.key,
					'command' : Module.arguments.join(" ")
				});

				postMessage({
					'type' : 'stdout',
					'data' : 'Received command: ' +
						Module.arguments.join(" ") +
						((Module.TOTAL_MEMORY) ? ".  Processing with " + Module.TOTAL_MEMORY + " bits." : "")
				});

				try {
					var result = ffmpeg_run(Module);
					postMessage({
						'type' : 'stdout',
						'data' : 'Finished processing (took ' + new Date() - time + 'ms)'
					});
					postMessage({
						'type' : 'result',
						'data' : result,
						'key'  : qf.key
					});
				} catch (ex) {
					console.log(ex);
				}
				
			}
			var totalTime = new Date() - time;
			postMessage({
				'type' : 'done',
				'time' : totalTime
			});
			break;
	}
};

postMessage({
	'type' : 'ready'
});