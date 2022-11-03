import axios from "axios"

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
    private activeConnections: {};
    private parts: any[];
    private uploadedParts: any[];
    private fileId: null;
    private fileKey: null;
    private onProgressFn: any;
    private onErrorFn: any;
    private fileExt = "";

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
        // this.headers =
        //     {
        //         'Content-Type': "video/mp4"
        //     };
    }

    // starting the multipart upload request
    start() {
        this.initialize()
    }

    async initialize() {
        try {
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
                "http://localhost:8080/api/v1/v/upload/initializeMultipartUpload",
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

            this.sendNext()
        } catch (error) {
            await this.complete(error)
        }
    }

    sendNext() {
        const activeConnections = Object.keys(this.activeConnections).length

        if (activeConnections >= this.threadsQuantity) {
            return
        }

        if (!this.parts.length) {
            if (!activeConnections) {
                this.complete()
            }

            return
        }

        const part = this.parts.pop()
        if (this.file && part) {
            const sentSize = (part.PartNumber - 1) * this.chunkSize
            const chunk = this.file.slice(sentSize, sentSize + this.chunkSize)

            const sendChunkStarted = () => {
                this.sendNext()
            }

            this.sendChunk(chunk, part, sendChunkStarted)
                .then(() => {
                    this.sendNext()
                })
                .catch((error) => {
                    this.parts.push(part)

                    this.complete(error)
                })
        }
    }

    // terminating the multipart upload request on success or failure
    async complete(error: any = null) {
        if (error && !this.aborted) {
            this.onErrorFn(error)
            return
        }

        if (error) {
            this.onErrorFn(error)
            return
        }

        try {
            await this.sendCompleteRequest()
        } catch (error) {
            this.onErrorFn(error)
        }
    }

    // finalizing the multipart upload request on success by calling
    // the finalization API
    async sendCompleteRequest() {
        if (this.fileId && this.fileKey) {
            const videoFinalizationMultiPartInput = {
                fileId: this.fileId,
                fileKey: this.fileKey,
                parts: this.uploadedParts,
            }
            debugger;
            try {
                let result = await axios.post(
                    "http://localhost:8080/api/v1/v/upload/finalizeMultipartUpload",
                    videoFinalizationMultiPartInput,
                )
                console.log("send complete uploading data")
                await axios.post(
                    result.data.uploadcompletedata,
                )
            } catch (error) {
                console.log("error in sending finalizeMultipartUpload: ", error)
            }


        }
    }

    sendChunk(chunk: any, part: any, sendChunkStarted: () => void) {
        return new Promise<void>((resolve, reject) => {
            this.upload(chunk, part, sendChunkStarted)
                .then((status) => {
                    if (status !== 200) {
                        reject(new Error("Failed chunk upload"))
                        return
                    }
                    resolve()
                })
                .catch((error) => {
                    reject(error)
                })
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
    upload(file: File, part: any, sendChunkStarted: any) {
        // uploading each part with its pre-signed URL
        return new Promise((resolve, reject) => {
            if (this.fileId && this.fileKey) {
                // - 1 because PartNumber is an index starting from 1 and not 0
                // @ts-ignore
                const xhr = (this.activeConnections[part.PartNumber - 1] = new XMLHttpRequest())

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
                            // @ts-ignore
                            delete this.activeConnections[part.PartNumber - 1]
                        }
                    }
                }

                xhr.onerror = (error) => {
                    reject(error)
                    // @ts-ignore
                    delete this.activeConnections[part.PartNumber - 1]
                }

                xhr.onabort = () => {
                    reject(new Error("Upload canceled by user"))
                    // @ts-ignore
                    delete this.activeConnections[part.PartNumber - 1]
                }

                xhr.send(file)
            }
        })
    }

    onProgress(onProgress: any) {
        this.onProgressFn = onProgress
        return this
    }

    // @ts-ignore
    onError(onError) {
        this.onErrorFn = onError
        return this
    }

    abort() {
        Object.keys(this.activeConnections)
            .map(Number)
            .forEach((id) => {
                // @ts-ignore
                this.activeConnections[id].abort()
            })

        this.aborted = true
    }
}

export {Uploader}
