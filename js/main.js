// Local file queue
var queue = [];

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

	var extension = getExtension(fileName);
	if (images.indexOf(extension) > -1) {
		queueImageGif(fileName, fileData, extension);
	} else if (videos.indexOf(extension) > -1) {
		print("Videos are not supported");
	} else {
		print("Unsupported file types");
	}

	if (queue.length > 0)
		$('#result > p').hide();
	else
		$('#result > p').show();
}

function queueImageGif(fileName, fileData, extension) {
	var blob = new Blob([fileData]);
	var src = window.URL.createObjectURL(blob);
	var img = document.createElement('img');
	img.onload = function() {
		var w = this.width,
			h = this.height;

		worker.postMessage({
			type: "queue",
			name: fileName,
			data: fileData,
			width: w,
			height: h,
			size: w + 'x' + h,
			extension: extension
		});

		var newSize = calculateAspectRatioFit(w, h, 250, 250);
		img.style.width = newSize.width + "px";
		img.style.height = newSize.height + "px";
	};
	img.src = src;
	$('#result').append(img);

	$(img).darkTooltip({
		animation:'fadeIn',
		gravity:'west',
		confirm:true,
		theme:'dark'
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
	a.textContent = 'Click here to download ' + fileName + "!";

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
			case "ready":
				isWorkerLoaded = true;
				print("Background Worker Loaded");
				stopRunning();
				break;
			case "stdout":
				print(message.data);
				break;
			case "done":
				var buffers = message.data;
				buffers.forEach(function(file) {
					if (file.name && file.data) {
						$('#output').append(getDownloadLink(file.name, file.data));
						$('#output').append('<br/>');
					}
				});
				
				stopRunning();
				break;
			default:
				print('Unhandled response');
				print(message);
				break;
		}
	};

	$(document).on('click', '.btn-cmd', function(e) {
		runCommand($(this).attr("data-command"));
		e.preventDefault();
	});


	var filereaderOpts = {
		readAsDefault: "ArrayBuffer",
		readAsMap: { },
		on: {
			load: function (e, file) {
				var arrayBuffer = e.target.result;
				var data = new Uint8Array(arrayBuffer);

				console.log(e);
				console.log(file);
				queueFile(file.name, data);
			}
		}
	};
	FileReaderJS.setSync(true);
	FileReaderJS.setupDrop(document.body, filereaderOpts);
	FileReaderJS.setupClipboard(document.body, filereaderOpts);
});