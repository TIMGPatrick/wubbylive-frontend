import React, {
    useEffect,
    useState
} from 'react';
import './App.css';
import VideoBox from "./components/VideoBox/VideoBox";
import {UploadVideo} from "./components/UploadVideo/UploadVideo";

const App = () => {

    const [video, setVideo] = useState<any>(undefined);

    // const videoSource = useRef(undefined);

    useEffect(() => {
        // fetchVideo()
        console.log("Fetching video works, disabling for the minute to get uploads working")
    }, []);

    //
    // async function fetchVideo2(): Promise<void> {
    //     await ky.get("http://localhost:8080/api/v1/v/0c7b428b-915a-493e-8237-522a16d02c41")
    //         .then(response => {
    //             response.json().then(data => {
    //                 console.log("within the fetchVideo function: ", data);
    //                 setVideo(data)
    //             }).catch(err => {
    //                 console.log(err)
    //             });
    //         });
    // }

    async function fetchVideo(): Promise<void> {
        let response = await fetch("http://localhost:8080/api/v1/v/0c7b428b-915a-493e-8237-522a16d02c41")
        let data = await response.json()
        console.log("within the fetchVideo function: ", data);
        setVideo(data)
    }

    return (
        <div className="App flex flex-col justify-center id='main' mx-auto">
            <div className={"bg-gray-200 min-h-screen p-4 "}>
                <div className={"mx-auto mt-10"}>
                    <h1 className={"text-6xl"}>Wubby Live</h1>
                </div>
                <div className={"h-full mx-auto bg-purple-400 my-10 w-full"}>
                    <div className={"mx-auto my-auto h-auto bg-green-600 p-5"}>
                        {/*<header className="App-header">*/}
                        {/*    /!*<VideoBox video={video ?? null}/>*!/*/}
                        {/*    <img src={logo} className="App-logo" alt="logo"/>*/}
                        {/*    <p>*/}
                        {/*        Edit <code>src/App.tsx</code> and save to reload.*/}
                        {/*    </p>*/}
                        {/*    <a*/}
                        {/*        className="App-link"*/}
                        {/*        href="https://reactjs.org"*/}
                        {/*        target="_blank"*/}
                        {/*        rel="noopener noreferrer"*/}
                        {/*    >*/}
                        {/*        Learn React*/}
                        {/*    </a>*/}
                        {/*</header>*/}
                        <div className={"mx-5 bg-blue-500 p-5"}>
                            {video !== undefined ? <VideoBox myvideo={video}/> : <h1>video unavailable</h1>}
                        </div>
                        {/*<VideoBox myvideo={video}></VideoBox>*/}
                    </div>
                </div>
                {/*<div className={"flex flex-col justify-center items-center"}>*/}
                {/*    <div className={"h-fit"}>*/}
                <UploadVideo/>
                {/*</div>*/}

                {/*</div>*/}
            </div>
        </div>
    );
}

export default App;
