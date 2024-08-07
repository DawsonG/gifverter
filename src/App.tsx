import { useState, useRef, DragEvent, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

import './App.css';
import Logo from './components/Logo';
import { IFile } from './components/IFile';
import FfmpegCommandBar from './components/FfmpegCommandBar';
import { Command, TYPE_TO_EXTENSION_MAP } from './components/FfmpegCommands';
import ProgressBar from './components/ProgressBar';

const BASE_URL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';

const fileAsUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
        resolve(reader.result as string);
    };

    reader.onerror = () => {
        console.error("There was an issue reading the file.");
        reject();
    };

    reader.readAsDataURL(file);
    return reader;
});


function App() {
    const [loaded, setLoaded] = useState<boolean>(false);
    const [files, setFiles] = useState<IFile[]>([]);

    // Keep track of the commands being run
    const ffmpegRef = useRef(new FFmpeg()); 
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const messageRef = useRef<HTMLParagraphElement | null>(null);

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const droppedFiles = event.dataTransfer.files;
        if (droppedFiles.length > 0) {
            const newFiles = Array.from(droppedFiles);
            const iFiles = newFiles.map((file: File, index: number) => ({
                id: files.length + index.toString(),
                file,
                isRunning: false,
                progress: 0,
                output: ''
            }));
            setFiles((prevFiles) => [...prevFiles, ...iFiles]);
        }
    };

    const load = async () => {
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on("log", ({ message }) => {
            if (messageRef.current) messageRef.current.innerHTML = message;
        });
        // toBlobURL is used to bypass CORS issue, urls with the same
        // domain can be used directly.
        await ffmpeg.load({
            coreURL: await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(
                `${BASE_URL}/ffmpeg-core.wasm`,
                'application/wasm'
            ),
            workerURL: await toBlobURL(
                `${BASE_URL}/ffmpeg-core.worker.js`,
                'text/javascript'
            ),
        });
        setLoaded(true);
    };

    const executeCommand = async (file: IFile, command: Command) => {
        const ffmpeg = ffmpegRef.current;

        const outputName = `output.${TYPE_TO_EXTENSION_MAP.get(command.outputFormat)}`;
        const cmdArr = ['-i', file.file.name].concat(command.cmd.split(' '), outputName);
        updateIFile(file.id, { isRunning: true, cmd: command });

        console.info('----------------------------------------');
        console.info(`Starting processing of ${file.file.name}`);
        console.info('Processing file to blob');
        const fileBlob = await fileAsUrl(file.file);
        
        console.info(`Running ffmpeg with`, cmdArr);
        await ffmpeg.writeFile(file.file.name, await fetchFile(fileBlob));
        ffmpeg.on('log', ({ type, message }) => {
            console.info('ffmpeg -', type, message);
        });
        ffmpeg.on('progress', ({ progress, time }) => {
            console.info(`Progress - ${progress} ${time}`);
            updateIFile(file.id, { progress });
        });
        await ffmpeg.exec(cmdArr);
        const fileData = await ffmpeg.readFile(outputName);
        
        const data = new Uint8Array(fileData as ArrayBuffer);
        updateIFile(file.id, {
            isRunning: false,
            output: window.URL.createObjectURL(new Blob([data.buffer], { type: command.outputFormat }))
        });
        console.info('----------------------------------------');

        if (videoRef.current) {
          videoRef.current.src = URL.createObjectURL(
              new Blob([data.buffer], { type: command.outputFormat })
          );
      }
    };

    useEffect(() => {
        load();
    });

    const updateIFile = (id: string, updateFile: Partial<IFile>) => {
        setFiles((files: IFile[]) => {
            const updatedFiles = files.map((file: IFile) => {
                if (file.id === id) {
                    return {
                        ...file,
                        ...updateFile
                    };
                }
    
                return file;
            });

            return updatedFiles;
        });
    }

    return (
        <div className="container">
            <Logo />

            {!loaded && (
              <div className='loader' />
            )}

            {loaded && (
              <>
                <div
                    className="uploadArea"
                    onDrop={handleDrop}
                    onDragOver={(event) => event.preventDefault()}
                >
                    Drag files to edit here
                </div>

                {files && files.map((file: IFile, i: number) => (
                  <div key={i}>
                    <p>{file.file.name}</p>

                    {file.output && (
                        <a href={file.output} download>Download</a>
                    )}
                    
                    {file.isRunning ? (
                        <ProgressBar progress={file.progress} />
                    ) : (
                        <FfmpegCommandBar file={file} handleClick={executeCommand} />
                    )}
                    
                    
                  </div>
                ))}

                <p ref={messageRef} />
              </>
            )}

            <video ref={videoRef} autoPlay={true} />
        </div>
    );
}

export default App;
