import React, {Component, useRef, useState} from 'react';
import uploadFileIcon from '../../public/baseline-cloud_upload-24px.svg'
import './Dropzone.css';
import axios from 'axios';

const Dropzone = (props: any) => {
    const videoInputRef = useRef<HTMLInputElement>(null);
    const [highlight, setHighlight] = useState(false)
    const [success, setSuccess] = useState(false);
    const [url, setUrl] = useState("");

    function fileListToArray(list:any) {
        const array = [];
        for (let i = 0; i < list.length; i++) {
            array.push(list.item(i));
        }
        return array;
    }

    const onDragOver = (evt:any) => {
        evt.preventDefault();

        if (props.disabled) return;

        setHighlight(true );
    }

    const onDragLeave = () => {
        setHighlight(false );
    }

    const onDrop = (event:any) => {
        event.preventDefault();

        if (props.disabled) return;

        const files = event.dataTransfer.files;
        if (props.onFilesAdded) {
            const array = fileListToArray(files);
            props.onFilesAdded(array);
        }
        setHighlight(false);
    }


    function onFilesAdded(evt:any) {
        if (props.disabled) return;
        const files = evt.target.files;
        if (props.onFilesAdded) {
            const array = fileListToArray(files);
            props.onFilesAdded(array);
        }
    }

    function openFileDialog() {
        if (props.disabled) return;
        videoInputRef.current?.click();
    }

    return (
        <div onClick={openFileDialog} style={{cursor: props.disabled ? "default" : "pointer"}} className={"h-full w-full"}>
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
                           onDragOver={onDragOver}
                           onDragLeave={onDragLeave}
                           onDrop={onDrop}
                           onChange={onFilesAdded}/>
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
