import React from 'react';
import Dropzone from "../Dropzone/Dropzone";

function UploadVideo() {

    function onFilesAdded() {
        console.log("Dropzone: Files Added")
    }


    return (
        <div className={"text-center bg-cyan-300 min-h-screen w-full flex flex-col items-center justify-center text-2xl"} id="DropzoneAppArea">
            <div className={"bg-white flex items-start justify-start drop-shadow box-border w-9/12 h-9/12"} id="DropzoneAppCard">
                <Dropzone/>
            </div>
        </div>
    )
}


export {UploadVideo};
