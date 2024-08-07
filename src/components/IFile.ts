import { Command } from "./FfmpegCommands";

export interface IFile {
    id: string;
    file: File; // The underlying browser file object
    isRunning: boolean; // is a command run
    cmd?: Command;
    progress: number; // 0.0 -> 1.0 of what percent ffmpeg has completed
    output: string;
}