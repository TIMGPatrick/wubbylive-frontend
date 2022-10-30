import React, {Component, useRef, useState} from 'react';
import {FaUpload} from 'react-icons/fa'
import './Dropzone.css';
import axios from 'axios';
import filetype, {filetypemime} from 'magic-bytes.js'
import {IFileUrlData} from "../../interfaces/IVideo";

const Dropzone = (props: any) => {
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [fileState, setFileState] = useState<File | null>(null);
    const [fileUrlData, setFileUrlData] = useState<IFileUrlData | null>(null)
    const [highlight, setHighlight] = useState(false)
    const [success, setSuccess] = useState(false);
    const [url, setUrl] = useState("");


    function renameFile(originalFile: File, newName: string) {
        return new File([originalFile], newName, {
            type: originalFile.type,
            lastModified: originalFile.lastModified,
        });
    }

    const onFilesAdded = async (evt: any) => {
        try {
            console.log("File Added: ", evt)
            console.log("File: ", evt.target.files[0].name)
            let file = evt.target.files[0]
            if (!file) {
                console.log("File 2: ", evt.target.files[0].name)
                return;
            }
            setFileState(file)
            console.log("File 3: ", evt.target.files[0].name)
            if (!fileState) {
                console.log("File 4: ", evt.target.files[0].name)
                console.log("File in state hook: ", fileState)
                return
            }
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
                userId: "38a18140-40b9-4e67-81e2-fe9389b61318",
                description: description,
                tags: tags
            }
            console.log("hitting backend")
            axios.post("http://localhost:8080/api/v1/v/get-signed-url", data)
                .then(async (response: any) => {
                    console.log("success with signed url post")
                    console.log("2: File Type at this point: ", response)
                    debugger;
                    let returnData = response.data;
                    console.log("Returned Data to filename: ", returnData)
                    let newFileName = returnData.fileName;
                    let newFileType = returnData.fileType;
                    let renamedFile = renameFile(fileState, newFileName)
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
        } catch (err) {
            console.log(err)
        }

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
