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
 * ------------ Utility functions ------------
*/
function getExtension(fileName) {
	return fileName.split('.').pop();
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