import React from 'react';
import videojs, {VideoJsPlayer} from 'video.js';
import 'video.js/dist/video-js.css';

export const VideoJS = (props: any) => {
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const placeholderRef = React.useRef(null);
    const playerRef = React.useRef<VideoJsPlayer | null>(null);
    const {options, onReady, videoSource} = props;

    React.useEffect(() => {

        // Make sure Video.js player is only initialized once
        if (!playerRef.current) {
            console.log("inside video js player if statement")
            const placeholderEl = placeholderRef.current;
            // @ts-ignore
            const videoElement = placeholderEl.appendChild(
                document.createElement("video-js")
            );
            videoElement.classList.add('vjs-big-play-centered')

            if (!videoElement) return;
            const player = playerRef.current = videojs(videoElement, options, () => {
                videojs.log('player is ready');
                onReady && onReady(player);
            });

            // You could update an existing player in the `else` block here

            // on prop change, for example:
        } else {
            const player = playerRef.current;
            player.autoplay(options.autoplay);

            // player.src(options.sources);
            player.src({src: videoSource, type: 'audio/x-mpegURL'});
            console.log("inside video js player else statement", player)
        }
    }, [options, videoRef, videoSource, onReady]);

    // Dispose the Video.js player when the functional component unmounts
    React.useEffect(() => {
        const player = playerRef.current;
        console.log("here is the player from within the VideoJS function: ", player)

        return () => {
            if (player) {
                player.dispose();
                playerRef.current = null;
            }
        };
    }, [playerRef]);

    // return (
    //     <div data-vjs-player>
    //         <video ref={videoRef} className='video-js vjs-big-play-centered' />
    //     </div>
    // );
    return (<div className={"aspect-video h-auto w-1/2 mx-auto"} ref={placeholderRef}></div>);

}

export default VideoJS;
