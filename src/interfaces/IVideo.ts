interface IVideo {
    id: string;
    title: string;
    uploaded_at: Date;
    created_at: Date;
    description: string;
    tags: string;
    user_id: string;
    dash_manifest_url: string;
    hls_manifest_url: string;
}

interface IFileUrlData {
    fileName: string | undefined
    fileType: string | undefined
    userId: string | undefined
    description: string | null
    tags: string[] | null

}


export type {IVideo, IFileUrlData}
