
// const getExtension = (fileName: string): string => fileName.split('.').pop() || '';

// const images = ["gif", "jpg", "jpeg", "png"];
// const isImage = (fileName: string): boolean => images.includes(getExtension(fileName));
// const videos = ["mp4", "webm", "mkv", "ogg", "ogv"];
// const isVideo = (fileName: string): boolean => videos.includes(getExtension(fileName));

export interface Command {
    text: string;
    checkValidity: (file: File) => boolean;
    cmd: string;
    outputFormat: string;
}

export const TYPE_TO_EXTENSION_MAP = new Map<string, string>(
    [
        ['image/gif', 'gif'],
        ['video/mp4', 'mp4'],
        ['video/webm', 'webm']
    ]
);

export const EXTENSION_TO_TYPE_MAP = new Map(
    Array.from(TYPE_TO_EXTENSION_MAP, entry => [entry[1], entry[0]])
);

const FfmpegCommands: Record<string, Command> = {
    webm2gif: {
        text: 'Convert to GIF',
        checkValidity: (file: File) => ['video/webm', 'video/mp4'].includes(file.type),
        cmd: '-pix_fmt rgb24',
        outputFormat: 'image/gif'
    },
    gif2mp4: {
        text: 'Convert to MP4',
        checkValidity: (file: File) => file.type === 'image/gif',
        cmd: '-movflags faststart -pix_fmt yuv420p',
        outputFormat: 'video/mp4'
    },
    gif2webm: {
        text: 'Convert to WEBM',
        checkValidity: (file: File) => file.type === 'image/gif',
        cmd: '-c vp9 -b:v 0 -crf 40',
        outputFormat: 'video/webm',
    }
};

export default FfmpegCommands;