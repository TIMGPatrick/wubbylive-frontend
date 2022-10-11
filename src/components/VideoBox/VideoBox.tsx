import React from "react";
import videojs, {VideoJsPlayer} from "video.js";
import VideoJS from "../VideoJS/VideoJS";


export const VideoBox = (props: any) => {

    console.log("props: ", props.myvideo?.video.id)
    const videoSourceProp = props?.myvideo?.video

    const playerRef = React.useRef<VideoJsPlayer | null>(null);

    let videoJsOptions = {
        autoplay: false,
        controls: true,
        responsive: true,
        aspectRatio:"16:9",
        // videoWidth:"1020px",
        // fluid: true,
        sources: [{
            src: props?.myvideo?.video?.hls_manifest_url,
            type: 'audio/x-mpegURL'
        }]
    };

    const handlePlayerReady = (player:VideoJsPlayer | null) => {
        playerRef.current = player;

        // You can handle player events here, for example:
        player?.on('waiting', () => {
            videojs.log('player is waiting');
        });

        player?.on('dispose', () => {
            videojs.log('player will dispose');
        });
    };

    console.log()

    return (
        <div className={"bg-amber-500 mx-auto my-5"}>
            <VideoJS options={videoJsOptions} videoSource={videoSourceProp?.hls_manifest_url} onReady={handlePlayerReady} />
        </div>
    )
}

export default VideoBox;
