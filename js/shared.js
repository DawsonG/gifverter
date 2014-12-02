// File Types
var images = ["gif", "jpg", "jpeg", "png"];
var videos = ["mp4", "webm", "mkv", "ogg", "ogv"];

// Command Mappings
// No longer used, but a good reference
var commands = [{
	name: "help",
	text: "Help",
	cmd : "-help"
}, {
	name: "codecs",
	text: "Codecs",
	cmd : "-codecs"
}, {
	name: "gif2mp4",
	text: "Gif to mp4",
	cmd : "-i $input -y -strict experimental -acodec acc -ac 2 -ab 160k -vcodec libx264 -s $size -pix_fmt yuv420p -preset slow -profile:v baseline -level 30 -maxrate 10000000 -bufsize 10000000 -b:v 1200k -f mp4 -threads 0 $output.mp4",
	valid: ["gif"]
}, {
	name: "gif2webm",
	text: "Gif to webm",
	cmd : "-t 3 -i $input -vf showinfo -strict -2 -c:v libvpx-vp9 $output.webm",
	valid: ["gif"]
}, {
	name: "vfi",
	text: "Vertical Flip Image",
	cmd : "-i $input -vf vflip $output",
	valid: images
}, {
	name: "hfi",
	text: "Horizontal Flip Image",
	cmd : "-i $input -vf hflip $output",
	valid: images
}];

/**
 * ------------- Common Objects -------------- 
 */
function Queue() {
	this.files = [];
	this.preQueueFile = null;
	this.postQueueFile = null;
}

Queue.prototype.add = function(fileName, fileData) {
	if (isFunction(this.preQueueFile))
		this.preQueueFile();

	var qf = new QueuedFile(fileName, fileData);
	qf.key = this.files.length;
	this.files.push(qf);

	if (isFunction(this.postQueueFile))
		this.postQueueFile();
	return qf;
};

Queue.prototype.addQueuedFile = function(qf) {
	if (isFunction(this.preQueueFile))
		this.preQueueFile();

	qf.key = this.files.length;
	this.files.push(qf);

	if (isFunction(this.postQueueFile))
		this.postQueueFile();
	return qf;
};

Queue.prototype.changeCommand = function(key, command) {
	this.files[key].command = command;
};

Queue.prototype.remove = function(key) {
	if (isFunction(this.preQueueFile))
		this.preQueueFile();
	
	this.files.splice(key, 1);

	if (isFunction(this.postQueueFile))
		this.postQueueFile();
}

function QueuedFile(fileName, fileData) {
	this.key = -1;
	this.fileName = fileName;
	this.fileData = fileData;
	this.extension = getExtension(fileName);
	this.width = -1;
	this.height = -1;
	this.size = "";

	this.added = false;

	this.command = null;
}


/**
 * ------------ Utility functions ------------
 */
function getExtension(fileName) {
	return fileName.split('.').pop();
}

function isFunction(functionToCheck) {
	var getType = {};
	return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}

function findCommand(fieldValue) {
	return findCommandByField("name", fieldValue);
}

function findCommandByField(fieldName, fieldValue) {
	for(var i = 0; i < commands.length; i++) {
		var item = commands[i];
		if (item[fieldName] == fieldValue)
			return item;
	}

	return null;
}

if (typeof String.prototype.startsWith != 'function') {
	String.prototype.startsWith = function (str){
		return this.lastIndexOf(str, 0) === 0;
	};
}

/**
* Conserve aspect ratio of the orignal region. Useful when shrinking/enlarging
* images to fit into a certain area.
*
* @param {Number} srcWidth Source area width
* @param {Number} srcHeight Source area height
* @param {Number} maxWidth Fittable area maximum available width
* @param {Number} maxHeight Fittable area maximum available height
* @return {Object} { width, heigth }
*/
function calculateAspectRatioFit(srcWidth, srcHeight, maxWidth, maxHeight) {
    var ratio = [maxWidth / srcWidth, maxHeight / srcHeight ];
    ratio = Math.min(ratio[0], ratio[1]);

    return { width:srcWidth*ratio, height:srcHeight*ratio };
}