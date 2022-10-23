import React, {Component, useRef, useState} from 'react';
import uploadFileIcon from '../../public/baseline-cloud_upload-24px.svg'
import './Dropzone.css';
import axios from 'axios';
import {fileTypeFromBuffer} from 'file-type';
import {readChunk} from 'read-chunk';

const Dropzone = (props: any) => {
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [fileState, setFileState] = useState<string>("");
    const [highlight, setHighlight] = useState(false)
    const [success, setSuccess] = useState(false);
    const [url, setUrl] = useState("");

    const fileListToArray = (list: any) => {
        const array = [];
        for (let i = 0; i < list.length; i++) {
            array.push(list.item(i));
        }
        return array;
    }

    function renameFile(originalFile: File, newName: string) {
        return new File([originalFile], newName, {
            type: originalFile.type,
            lastModified: originalFile.lastModified,
        });
    }

    const onFilesAdded = async (evt: any) => {
        console.log("File Added: ", evt)
        console.log("File: ", evt.target.files[0].name)
        debugger;
        let file = evt.target.files[0]
        console.log("File added: ", file)
        setFileState(file)
        const buffer = await readChunk(file, {length: 4100});

        let fileInfo = await fileTypeFromBuffer(buffer);
        let fileMimeType = fileInfo?.mime;
//=> {ext: 'png', mime: 'image/png'}
        let fileParts = file.name.split('.')
        // let fileType = fileParts[fileParts.length - 1];
        // let fileType: string = "video/mp4";
        // let fileType = "text";
        // fileParts.pop();
        let fileName: string = fileParts.join(".");
        if (props.disabled) return;
        console.log(fileName)
        console.log(fileMimeType)
        console.log("request being made for signed url")
        console.log("File Type at this point: ", fileMimeType)
        let data = {
            fileName: fileName,
            fileType: fileMimeType
        }
        axios.post("http://localhost:8080/api/v1/v/get-signed-url", data)
            .then(async (response: any) => {
                console.log("success with signed url post")
                console.log("2: File Type at this point: ", response)
                debugger;
                let returnData = response.data;
                console.log("Returned Data to filename: ", returnData)
                let newFileName = returnData.fileName;
                let newFileType = returnData.fileType;
                let renamedFile = renameFile(file, newFileName)
                // evt.target.files[0].name = newFileName
                let url = returnData.url;
                setUrl(url)
                console.log("Received a signed request " + url);

                // Put the fileType in the headers for the upload
                const options = {
                    headers: {
                        'Content-Type': newFileType
                    }
                };
                console.log("Sending file to url directly")
                debugger;
                axios.put(url, renamedFile, options)
                    .then(result => {
                        console.log("Response from s3", result)
                        setSuccess(true);
                    })
                    .catch(error => {
                        alert("ERROR " + JSON.stringify(error));
                        console.log("Error: ", error)
                    })
                    .catch(error => {
                        alert(JSON.stringify({error}));
                        console.log(JSON.stringify({error}));
                    })
            })
    }

    const openFileDialog = () => {
        if (props.disabled) return;
        videoInputRef.current?.click();
    }

    return (
        <div onClick={openFileDialog} style={{cursor: props.disabled ? "default" : "pointer"}}
             className={"h-full w-full"}>
            <div
                className={"h-full w-full border-dashed border-radius rounded-lg bg-gray-300 border-4 flex items-center justify-center text-center content-center flex-col text-xs lg:text-2xl"}
                id={`Dropzone ${highlight ? "Highlight" : ""}`}>
                <img
                    alt="upload"
                    className="h-24 w-24 opacity-30"
                    src={uploadFileIcon}
                />
                <div>
                    <input id="VideoInput" type="file" className={""} ref={videoInputRef}
                           onClick={openFileDialog}
                           onChange={onFilesAdded}
                           accept={"video/*"}/>
                </div>
                {}
                <span>Upload Files</span>
            </div>
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
