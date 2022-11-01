import React, {Component, useRef, useState} from 'react';
import {FaUpload} from 'react-icons/fa'
import './Dropzone.css';
import axios from 'axios';
import {IFileUrlData} from "../../interfaces/IVideo";
import {PreviousUpload} from "tus-js-client";

const tus = require('tus-js-client');

const Dropzone = (props: any) => {
    const videoInputRef = useRef<HTMLInputElement>(null);
    // const [fileState, setFileState] = useState<File | null>(null);
    const [fileUrlData, setFileUrlData] = useState<IFileUrlData | null>(null)
    const [highlight, setHighlight] = useState(false)
    const [success, setSuccess] = useState(false);
    // const [url, setUrl] = useState("");
    let fileState: File | null = null;
    let renamedFile: File | null = null;
    let url: string = "";
    let options: any = null


    function renameFile(originalFile: File, newName: string) {
        return new File([originalFile], newName, {
            type: originalFile.type,
            lastModified: originalFile.lastModified,
        });
    }

    const onFilesAdded = async (evt: any) => {
        try {
            debugger;
            fileState = null
            renamedFile = null
            options = null
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
            axios.post("http://localhost:8080/api/v1/v/get-signed-url", data)
                .then(async (response: any) => {
                    console.log("success with signed url post")
                    console.log("2: File Type at this point: ", response)
                    debugger;
                    let returnData = response.data;
                    console.log("Returned Data to filename: ", returnData)
                    let newFileName = returnData.filePath;
                    let newFileType = returnData.fileType;
                    if (!fileState) {
                        console.log("fileState is null")
                        return
                    }
                    console.log("fileState name: ", fileState)
                    renamedFile = renameFile(fileState, newFileName)
                    // evt.target.files[0].name = newFileName
                    url = returnData.url;
                    console.log(url)
                    if (url === "") {
                        console.log("url is empty")
                        return
                    }

                    console.log("Received a signed request " + url);

                    // Put the fileType in the headers for the upload
                    options = {
                        'Content-Type': newFileType
                    };
                    // options = {
                    //     headers: {
                    //         'Content-Type': newFileType
                    //     }
                    // };
                    console.log("Sending file to url directly")
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
                })
        } catch (err) {
            console.log(err)
        }

    }

    function uploadButton() {
        // Get the selected file from the input element
        console.log("Upload clicked")
        if (!renamedFile || !url || !options) {
            return
        }
        debugger;
        console.log("URL right before tus", url)
        // Create a new tus upload
        // url = "https://tusd.tusdemo.net/files/"
        debugger;
        let upload = new tus.Upload(renamedFile, {
            // Chunk size for size of the requests to upload
            chunkSize: 5 * 1024 * 1024,
            // Endpoint is the upload creation URL from your tus server
            endpoint: url,
            headers: options,
            // Retry delays will enable tus-js-client to automatically retry on errors
            retryDelays: [0, 3000, 5000, 10000, 20000],
            // Attach additional meta data about the file for the server
            metadata: {
                filename: renamedFile.name,
                filetype: renamedFile.type
            },
            // // Callback for errors which cannot be fixed using retries
            onError: function (error: any) {
                console.log("Failed because: " + error)
            },
            // // Callback for reporting upload progress
            // onProgress: function (bytesUploaded: number, bytesTotal: number) {
            //     let percentage = (bytesUploaded / bytesTotal * 100).toFixed(2)
            //     console.log(bytesUploaded, bytesTotal, percentage + "%")
            // },
            // Callback for once the upload is completed
            onSuccess: function () {
                console.log("Download %s from %s", upload.file.name, upload.url)
            }
        })

        console.log("upload object: ", upload)

        // Check if there are any previous uploads to continue.
        // upload.findPreviousUploads().then(function (previousUploads: any) {
        //     // Found previous uploads so we select the first one.
        //     if (previousUploads.length) {
        //         upload.resumeFromPreviousUpload(previousUploads[0])
        //     }
        //
        //     // Start the upload
        //     try {
        //         upload.start()
        //     } catch (err) {
        //         console.log("WHy will this not work",err)
        //     }
        // })
        upload.start()
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
            <div className={"mx-auto mt-10 p-5"}>
                <button onClick={uploadButton}>Upload File</button>
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
