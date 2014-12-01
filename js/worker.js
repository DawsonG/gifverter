importScripts('lib/ffmpeg-all-codecs.js');
importScripts('shared.js');

var files = [];

function print(text) {
	postMessage({
		'type' : 'stdout',
		'data' : text
	});
}

function getExtension(name) {
	return name.split('.').pop();
}

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.lastIndexOf(str, 0) === 0;
	};
}

function parseArguments(text, index) {
	text = text.replace(/\s+/g, ' ');
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

	if (index < 0)
		return args; //no processing needed of $params

	for(var i = 0; i < args.length; i++) {
		if (args[i].startsWith("$output.")) {
			args[i] = args[i].replace('$output', files[index].name.split('.')[0]);
			continue;
		}

		switch (args[i]) {
			case "$input":
				args[i] = files[index].name;
				break;
			case "$size":
				args[i] = files[index].size;
				break;
			case "$output":
				args[i] = "output." + getExtension(files[index].name);
				break;
		}
	}

	return args;
}

function findCommandByField(fieldName, fieldValue) {
	for(var i = 0; i < commands.length; i++) {
		var item = commands[i];
		if (item[fieldName] == fieldValue)
			return item;
	}

	return null;
}

function findFieldByField(fieldName, fieldValue, getField) {
	for(var i = 0; i < commands.length; i++) {
		var item = commands[i];
		if (item[fieldName] == fieldValue)
			return item[getField];
	}

	return null;
}

onmessage = function(event) {
	var message = event.data;
	
	switch (message.type) {
		case "queue":
			files.push({
				name : message.name,
				data : message.data,
				size : message.size
			});

			postMessage({
				'type' : 'stdout',
				'data' : 'File ' + message.name + ' queued.'
			});
			break;
		case "dequeue":
			files.splice(message.index, 1);
			break;
		case "command":
			var Module = {
				print: print,
				printErr: print,
				TOTAL_MEMORY: 268435456
			}

			postMessage({
				'type' : 'start'
			});

			postMessage({
				'type' : "stdout",
				'data' : "Received command -- " + message.command + "! Processing with " + Module.TOTAL_MEMORY + " bits."
			});

			var time = new Date();
			var result = [];
			
			var command = findCommandByField('name', message.command);
			if (!command.valid || command.valid == null || command.valid == 'undefined') {
				Module.arguments = parseArguments(command.cmd, -1);

				var tmp = ffmpeg_run(Module);
				result.push(tmp);
			} else {
				for(var i = 0; i < files.length; i++) {
					Module.files = [files[i]];
					Module.arguments = parseArguments(command.cmd, i);

					var tmp = ffmpeg_run(Module);
					result.push(tmp[0]);
				}
			}
			
			var totalTime = new Date() - time;
			postMessage({
				'type' : 'stdout',
				'data' : 'Finished processing (took ' + totalTime + 'ms)'
			});

			postMessage({
				'type' : 'done',
				'data' : result,
				'time' : totalTime
			});
			break;
	}
};

postMessage({
	'type' : 'ready'
});