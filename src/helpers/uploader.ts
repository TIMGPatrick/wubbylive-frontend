import axios, {Axios} from "axios"

// initializing axios
// const api = axios.create({
//     baseURL: "http://localhost:3000",
// })

// original source: https://github.com/pilovm/multithreaded-uploader/blob/master/frontend/uploader.js
class Uploader {
    private headers: any;
    private chunkSize: number = 1024 * 1024 * 5;
    private threadsQuantity: number = 2;
    private file: any;
    private fileName: any;
    private aborted: boolean;
    private uploadedSize: number;
    private progressCache: any;
    private activeConnections: any;
    private parts: any[];
    private uploadedParts: any[];
    private fileId: null;
    private fileKey: null;
    private onProgressFn: any;
    private onErrorFn: any;
    private fileExt = "";
    private startTime: number;

    constructor(options: { chunkSize: number; threadsQuantity: any; file: any; fileName: any; }) {
        // this must be bigger than or equal to 5MB,
        // otherwise AWS will respond with:
        // "Your proposed upload is smaller than the minimum allowed size"
        this.chunkSize = options.chunkSize || 1024 * 1024 * 5
        // number of parallel uploads
        this.threadsQuantity = Math.min(options.threadsQuantity || 5, 15)
        this.file = options.file
        this.fileName = options.fileName
        this.aborted = false
        this.uploadedSize = 0
        this.progressCache = {}
        this.activeConnections = {}
        this.parts = []
        this.uploadedParts = []
        this.fileId = null
        this.fileKey = null
        this.onProgressFn = (): any => {
        }
        this.onErrorFn = () => {
        }
        this.startTime = 0;
        this.headers =
            {
                'Content-Type': "video/mp4"
            };
    }

    // starting the multipart upload request
    start() {
        this.initialize()
    }

    async initialize() {
        try {
            debugger;
            this.startTime = Date.now()
            // adding the the file extension (if present) to fileName
            console.log(this.fileName)
            let fileName = this.fileName
            // const ext = this.file.name.split(".").pop()
            // if (ext) {
            //     fileName += `.${ext}`
            // }
            const ext = this.fileExt

            // initializing the multipart request
            const videoInitializationUploadInput = {
                path: fileName,
            }
            const initializeResponse = await axios.post(
                "http://localhost:8080/api/v1/v/upload/initialiseMultipartUpload",
                videoInitializationUploadInput,
            )
            const AWSFileDataOutput = initializeResponse.data

            this.fileId = AWSFileDataOutput.fileId
            this.fileKey = AWSFileDataOutput.fileKey

            // retrieving the pre-signed URLs
            const numberOfparts = Math.ceil(this.file.size / this.chunkSize)

            const AWSMultipartFileDataInput = {
                fileId: this.fileId,
                fileKey: this.fileKey,
                parts: numberOfparts,
            }

            const urlsResponse = await axios.post(
                "http://localhost:8080/api/v1/v/upload/getMultipartPreSignedUrls",
                AWSMultipartFileDataInput
            )
            console.log("URL RESPONSE PARTS: ", urlsResponse.data.parts)
            const newParts = urlsResponse.data.parts
            this.parts.push(...newParts)
            await this.sendNext()
        } catch (error) {
            await this.complete(error)
        }
    }

    async sendNext() {
        debugger;
        const activeConnections = Object.keys(this.activeConnections).length

        if (activeConnections >= this.threadsQuantity) {
            return
        }

        if (!this.parts.length) {
            if (!activeConnections) {
                console.log("Complete from underneath active connections check")
                await this.complete()
            }

            return
        }

        let part = this.parts.pop()
        if (this.file && part) {
            const sentSize = (part.PartNumber - 1) * this.chunkSize
            const chunk = this.file.slice(sentSize, sentSize + this.chunkSize)
            try {
                const sendChunkStarted = () => {
                    console.log("sendChunkStarted reached")
                    this.sendNext()
                }

                await this.sendChunk(chunk, part, sendChunkStarted)

                await this.sendNext()
            } catch (error) {
                this.parts.push(part)
                console.log("This complete at error point:")
                await this.complete(error)
            }
        }
    }

    // terminating the multipart upload request on success or failure
    async complete(error: any = undefined) {
        debugger;
        if (error && !this.aborted) {
            this.onErrorFn(error)
            return
        }
        debugger;

        if (error) {
            this.onErrorFn(error)
            return
        }
        debugger;

        try {
            await this.sendCompleteRequest()
        } catch (error) {
            this.onErrorFn(error)
        }
    }

    // finalizing the multipart upload request on success by calling
    // the finalization API
    async sendCompleteRequest() {
        debugger;
        if (this.fileId && this.fileKey) {
            const videoFinalizationMultiPartInput = {
                fileId: this.fileId,
                fileKey: this.fileKey,
                parts: this.uploadedParts,
            }
            try {
                console.log("Fetching finalise multipartupload url")
                let result = await axios.post(
                    "http://localhost:8080/api/v1/v/upload/finaliseMultipartUpload",
                    videoFinalizationMultiPartInput,
                )
                console.log("completed uploading data: ", result.data.uploadcompletedata)
                console.log("Complete")
                console.log("Duration: ", this.startTime - Date.now())
                debugger;
                await axios.post(
                    result.data.uploadcompletedata,
                )
            } catch (error) {
                console.log("error in sending finalizeMultipartUpload: ", error)
            }


        }
    }

    async sendChunk(chunk: any, part: any, sendChunkStarted: () => void) {
        return new Promise<void>(async (resolve, reject) => {
            try {
                let status = await this.upload(chunk, part, sendChunkStarted)
                if (status !== 200) {
                    reject(new Error("Failed chunk upload"))
                    return
                }
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    }

    // calculating the current progress of the multipart upload request
    handleProgress(part: string | number, event: { type: string; loaded: any; }) {
        if (this.file) {
            if (event.type === "progress" || event.type === "error" || event.type === "abort") {
                this.progressCache[part] = event.loaded
            }

            if (event.type === "uploaded") {
                this.uploadedSize += this.progressCache[part] || 0
                delete this.progressCache[part]
            }


            const inProgress = Object.keys(this.progressCache)
                .map(Number)
                .reduce((memo, id) => (memo += this.progressCache[id]), 0)

            const sent = Math.min(this.uploadedSize + inProgress, this.file.size)

            const total = this.file.size

            const percentage = Math.round((sent / total) * 100)
            this.onProgressFn({
                sent: sent,
                total: total,
                percentage: percentage,
            })
        }
    }

    // uploading a part through its pre-signed URL
    upload(chunk: File, part: any, sendChunkStarted: any) {
        // uploading each part with its pre-signed URL
        return new Promise(async (resolve, reject) => {
            if (this.fileId && this.fileKey) {
                // - 1 because PartNumber is an index starting from 1 and not 0
                console.log("Active Connections Before: ", this.activeConnections)
                const xhr = (this.activeConnections[part.PartNumber - 1] = new XMLHttpRequest())
                console.log("Active Connections After: ", this.activeConnections)
                debugger;
                sendChunkStarted()

                const progressListener = this.handleProgress.bind(this, part.PartNumber - 1)

                xhr.upload.addEventListener("progress", progressListener)

                xhr.addEventListener("error", progressListener)
                xhr.addEventListener("abort", progressListener)
                xhr.addEventListener("loadend", progressListener)

                xhr.open("PUT", part.signedUrl)
                xhr.setRequestHeader('Content-Type', 'video/mp4')
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        console.log("xhr response headers:", xhr.getAllResponseHeaders())
                        // retrieving the ETag parameter from the HTTP headers
                        const ETag = xhr.getResponseHeader("ETag")

                        if (ETag) {
                            const uploadedPart = {
                                PartNumber: part.PartNumber,
                                // removing the " enclosing characters from
                                // the raw ETag
                                ETag: ETag.replaceAll('"', ""),
                            }

                            this.uploadedParts.push(uploadedPart)


                            resolve(xhr.status)
                            delete this.activeConnections[part.PartNumber - 1]
                        }
                    }
                }
                console.log("Xhr response text: ", xhr.responseText)

                xhr.onerror = (error) => {
                    reject(error)
                    delete this.activeConnections[part.PartNumber - 1]
                }

                xhr.onabort = () => {
                    reject(new Error("Upload canceled by user"))
                    delete this.activeConnections[part.PartNumber - 1]
                }

                xhr.send(chunk)
            }
        })
    }


    onProgress(onProgress: any) {
        this.onProgressFn = onProgress
        return this
    }

    onError(onError: any) {
        this.onErrorFn = onError
        return this
    }


//TODO: Add abort/cancel button immediately as need to be able to cancel uploads
// finalising uploads does not seem to be working, as it keeps the space
// for the file parts until that is called

    abort() {
        Object.keys(this.activeConnections)
            .map(Number)
            .forEach((id) => {
                this.activeConnections[id].abort()
            })

        this.aborted = true
    }
}

export {Uploader}
