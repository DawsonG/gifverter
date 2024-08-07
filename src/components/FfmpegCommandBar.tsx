import FfmpegCommands, { Command } from "./FfmpegCommands";
import { IFile } from "./IFile";

interface FfmpegCommandBarProps {
    file: IFile;
    handleClick: (file: IFile, command: Command) => void;
}

const FfmpegCommandBar = ({ file, handleClick }: FfmpegCommandBarProps): JSX.Element => {
    const commands = [];
    for (const key in FfmpegCommands) {
        const cmd = FfmpegCommands[key];
        if (cmd.checkValidity(file.file)) {
            commands.push(<button onClick={() => handleClick(file, cmd)}>{cmd.text}</button>);
        }    
    }

    return (
        <div className="buttonGroup">
            {commands && commands.map((command) => command)}
        </div>
    );
};

export default FfmpegCommandBar;