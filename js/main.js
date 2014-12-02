// Local file queue
var queue = new Queue();

function checkDisplayElements() {
	if (queue.files.length > 0) {
		$('#result > p').hide();
		$('#btn-convert').show();
	} else {
		$('#result > p').show();
		$('#btn-convert').hide();
	}
}
queue.preQueueFile = checkDisplayElements;
queue.postQueueFile = checkDisplayElements;

// Global variables
var worker;
var running = false;
var isWorkerLoaded = false;

function isReady() {
	return !running && isWorkerLoaded;
}

function startRunning() {
	$("#image-loader").show();
	$("#result > p").hide();
	running = true;
}

function stopRunning() {
	$("#image-loader").hide();
	$("#result > p").show();
	running = false;
}

function print(text) {
	console.log(text);
}

function cleanName(name) {
	name = name || "sample-file";
	name = name.replace(/\s+/gi, '-'); // Replace white space with dash
	return name.replace(/[^a-zA-Z0-9\-\.]/gi, ''); // Strip any special charactere
}


function queueFile(fileName, fileData) {
	if (!isReady()) {
		print("Command already running.");
		return;
	}

	var qf = queue.add(fileName, fileData);
	if (images.indexOf(qf.extension) > -1) {
		queueImageGif(qf);
	} else if (videos.indexOf(qf.extension) > -1) {
		print("Videos are not supported");
	} else {
		print("Unsupported file type");
	}

	
}

function queueImageGif(queueFile) {
	var blob = new Blob([queueFile.fileData]);
	var src = window.URL.createObjectURL(blob);

	var a = document.createElement('a');
	a.href = "#";
	queueFile.command = findCommand("gif2webm");

	var img = document.createElement('img');
	var header = queueFile.fileName;
	img.onload = function() {
		var w = this.width,
			h = this.height;

		queueFile.width = w;
		queueFile.height = h;
		queueFile.size = w + 'x' + h;

		var newSize = calculateAspectRatioFit(w, h, 250, 250);
		img.style.zIndex = 10;
		img.style.width = newSize.width + "px";
		img.style.height = newSize.height + "px";
		img.id = "img" + queueFile.key;
		a.id = "a" + queueFile.key;
		a.appendChild(img);
		$("#result").append(a).append('<br/>');
		
		header += " " + w + "&times;" + h;
	};
	img.src = src;
	

	$(a).popover({
		html: true,
		title: function() {
			return header;
		},
		content: function() {
			var content = $("#animated-image-content").html();
			content = content.replace(/\{identifier\}/g, queueFile.key);
			if (queueFile.command) {
				if (queueFile.command.name == "gif2webm") {
					content = content.replace(/\{\{gif2webm\}\}/g, " checked");
				} else if (queueFile.command.name == "gif2mp4") {
					content = content.replace(/\{\{gif2mp4\}\}/g, " checked");
				}
			} else { // DEFAULT
				content = content.replace(/\{\{gif2webm\}\}/g, " checked");
			}
			content = content.replace(/\{\{(\w+)\}\}/gi, "");
			return content;
		}
	});
}

function runCommand(command, fileName, fileData) {
	if (!isReady()) {
		print("Command already running.");
		return;
	}

	startRunning();
	worker.postMessage({
		type: "command",
		command: command
	});
}

function getDownloadLink(fileName, fileData) {
	var a = document.createElement('a');
	a.download = fileName || 'output.mpeg';
	a.href = window.URL.createObjectURL(new Blob([fileData]));
	var span = document.createElement('span');
	span.class = 'glyphicon glyphicon-eject';
	a.appendChild(span);

	return a;
}

$(document).ready(function() {
	var spinner = new Spinner({
		lines: 10, // The number of lines to draw
		length: 35, // The length of each line
		width: 8, // The line thickness
		radius: 30, // The radius of the inner circle
		corners: 0.7, // Corner roundness (0..1)
		speed: 0.5, // Rounds per second
		top: '90px', // Top position relative to parent
	}).spin(document.getElementById('image-loader'));

	startRunning();
	print("LOADING... LOADING... LOADING...");
	print("Please wait as we load the background worker and ffmpeg.");

	worker = new Worker("js/worker.js");
	worker.onmessage = function(event) {
		var message = event.data;
		switch(message.type) {
			case "start": //Use loading icons
				print(message.command);
				$('#a' + message.key).append('<div class="progress"><div class="progress-bar progress-bar-success progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"><span class="sr-only"></span></div></div>');
				break;
			case "ready":
				isWorkerLoaded = true;
				print("Background Worker Loaded");
				stopRunning();
				break;
			case "stdout":
				print(message.data);
				break;
			case "result":
				$('#a' + message.key + ' > .progress').remove();
				var buffers = message.data;
				buffers.forEach(function(file) {
					$('#a' + message.key).append(getDownloadLink(file.name, file.data));
				});
				
				break;
			case "done":
				stopRunning();
				break;
			default:
				print('Unhandled response');
				print(message);
				break;
		}
	};

	$(document).on('click', '.btn-remove', function(e) {
		var key = $(this).attr('rel');

		queue.remove(key);
		$('.popover').popover('hide');
		$('#img' + key).parent('a').remove();

		e.preventDefault();
	});

	$(document).on('click', '#btn-convert', function(e) {
		//Start the queue!
		worker.postMessage({
			type: "run-queue",
			queue: queue.files
		});
		e.preventDefault();
	});

	// Save values as commands
	$(document).on('change', '.rad', function(e) {
		var command = findCommand($(this).val());
		queue.changeCommand($(this).attr('rel'), command);

		e.preventDefault();
	});

	var filereaderOpts = {
		readAsDefault: "ArrayBuffer",
		readAsMap: { },
		on: {
			load: function (e, file) {
				var arrayBuffer = e.target.result;
				var data = new Uint8Array(arrayBuffer);

				queueFile(file.name, data);
			}
		}
	};
	FileReaderJS.setSync(true);
	FileReaderJS.setupDrop(document.body, filereaderOpts);
	FileReaderJS.setupClipboard(document.body, filereaderOpts);
});