import React, {Component, useRef, useState} from 'react';
import {FaUpload} from 'react-icons/fa'
import './Dropzone.css';
import axios from 'axios';
import filetype, {filetypemime} from 'magic-bytes.js'
import {IFileUrlData} from "../../interfaces/IVideo";
import {Uploader} from "../../helpers/uploader"

const Dropzone = (props: any) => {
    const videoInputRef = useRef<HTMLInputElement>(null);
    // const [fileState, setFileState] = useState<File | null>(null);
    const [fileUrlData, setFileUrlData] = useState<IFileUrlData | null>(null)
    const [highlight, setHighlight] = useState(false)
    const [success, setSuccess] = useState(false);
    const [uploader, setUploader] = useState<Uploader | undefined>(undefined)
    // const [url, setUrl] = useState("");
    let fileState: File | null = null;
    let url: string = "";


    function renameFile(originalFile: File, newName: string) {
        return new File([originalFile], newName, {
            type: originalFile.type,
            lastModified: originalFile.lastModified,
        });
    }

    const onFilesAdded = async (evt: any) => {
        try {
            fileState = null
            url = ""
            console.log("File Added: ", evt)
            console.log("File: ", evt.target.files[0].name)
            fileState = evt.target.files[0]
            if (!fileState) {
                console.log("File 2: ", evt.target.files[0].name)
                return;
            }
            console.log("File 3: ", evt.target.files[0].name)
            console.log("File 5: ", evt.target.files[0].name)
            if (props.disabled) return;
            // Just detecting the file type from the actual file should be fine as the sources will all be trusted users.
            console.log("File Type at this point: ", fileState.type)

            //TODO: Check file type is accepted

            //TODO: Add db logic for uploading

            let description = "description"
            let tags = ["testtag", "testtag2"]

            let data: IFileUrlData = {
                fileName: fileState.name,
                fileType: fileState.type,
                userId: "0f7b977a-59b2-4c6f-b448-98a8be696065",
                description: description,
                tags: tags
            }
            console.log("hitting backend")
            let response = await axios.post("http://localhost:8080/api/v1/v/upload/get-signed-url", data)
            console.log("success with signed url post")
            console.log("2: File Type at this point: ", response)
            // debugger;
            let returnData = response.data;
            console.log("Returned Data to filename: ", returnData)
            let newFileName = returnData.filePath;
            let newFileType = returnData.fileType;
            if (!fileState) {
                console.log("fileState is null")
                return
            }
            let renamedFile = renameFile(fileState, newFileName)
            // evt.target.files[0].name = newFileName
            url = returnData.url;
            if (url === "") {
                console.log("url is empty")
                return
            }

            console.log("Received a signed request " + url);

            // Put the fileType in the headers for the upload
            const options = {
                headers: {
                    'Content-Type': newFileType
                }
            };
            console.log("Sending file to url directly")
            // debugger;
            let percentage = 0
            let videoUploaderOptions = {
                fileName: newFileName,
                file: renamedFile,
                chunkSize: 1024 * 1024 * 5,
                threadsQuantity: 5
            }
            console.log("Creating Uploader")
            const uploader = new Uploader(videoUploaderOptions)
            setUploader(uploader)
            debugger;

            uploader
                .onProgress(({percentage: newPercentage}: { percentage: any, newPercentage: any }) => {
                    // to avoid the same percentage to be logged twice
                    if (newPercentage !== percentage) {
                        percentage = newPercentage
                        console.log(`${percentage}%`)
                    }
                    if (newPercentage === 100) {
                        console.log('File completed uploading at 100%')
                        uploader.complete();
                    }
                })
                .onError((error: any) => {
                    console.error("Error displaying progress", error)
                })

            uploader.start()
            // axios.put(url, renamedFile, options)
            //     .then(result => {
            //         console.log("Response from s3", result)
            //         setSuccess(true);
            //     })
            //     .catch(error => {
            //         alert("ERROR " + JSON.stringify(error));
            //         console.log("Error: ", error)
            //     })
            //     .catch(error => {
            //         alert(JSON.stringify({error}));
            //         console.log(JSON.stringify({error}));
            //     })
        } catch
            (err) {
            console.log("Error In like upload bit:", err)
        }

    }

    const onCancel = () => {
        console.log("onCancel clicked")
        if (uploader) {
            uploader.abort()
            // setFile(undefined)
        }
    }

    const openFileDialog = () => {
        if (props.disabled) return;
        videoInputRef.current?.click();
    }

    return (
        <div>
            <div onClick={openFileDialog} style={{cursor: props.disabled ? "default" : "pointer"}}
                 className={"h-full w-full"}>
                <div
                    className={"h-full w-full border-dashed border-radius rounded-lg bg-gray-300 border-4 flex items-center justify-center text-center content-center flex-col text-xs lg:text-2xl"}
                    id={`Dropzone ${highlight ? "Highlight" : ""}`}>
                    <FaUpload className="h-24 w-24 opacity-30"/>
                    <div>
                        <input id="VideoInput" type="file" className={""} ref={videoInputRef}
                               onClick={openFileDialog}
                               onChange={onFilesAdded}
                               accept={"video/*"}/>
                    </div>
                    <span>Upload Files</span>
                </div>
            </div>
            <button onClick={onCancel}>Abort</button>
        </div>
    );
}


// const Success_message = () => (
//     <div style={{padding: 50}}>
//         <h3 style={{color: 'green'}}>SUCCESSFUL UPLOAD</h3>
//         <a href={url}>Access the file here</a>
//         <br/>
//     </div>
// )


export default Dropzone;
