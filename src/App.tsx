import React, {
    useEffect,
    useState
} from 'react';
import logo from './logo.svg';
import './App.css';
import VideoBox from "./components/VideoBox/VideoBox";

const App = () => {

    const [video, setVideo] = useState(undefined);

    // const videoSource = useRef(undefined);

    useEffect(() => {
        fetchVideo()
    }, []);

    async function fetchVideo(): Promise<void> {
        await fetch("http://localhost:8080/api/v1/v/0c7b428b-915a-493e-8237-522a16d02c41")
            .then(response => {
                response.json().then(data => {
                    console.log("within the fetchVideo function: ", data);
                    setVideo(data)
                }).catch(err => {
                    console.log(err)
                });
            });
    }

    return (
        <div className="App flex flex-col justify-center">
            <div className={"mx-24 my-10 h-96 bg-green-600"}>
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
                <div className={"mt-5 mx-5 bg-blue-500"}>
                    {video !== undefined ? <VideoBox myvideo={video}/> : <h1>video unavailable</h1>}
                </div>
                {/*<VideoBox myvideo={video}></VideoBox>*/}
            </div>
        </div>
    );
}

export default App;
