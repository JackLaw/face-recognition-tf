import { MediaPipeFaceMesh } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";
import "@tensorflow/tfjs-backend-webgl";
import React, { useEffect, useRef, useState } from "react";
import { annotateFeatures, scaler, setupModel } from "./prediction";
import "./styles.css";
import useCamera from "./useCamera";
import useMediaRecorder from "./useMediaRecorder";

const IS_MOBILE = MediaRecorder.isTypeSupported("video/mp4");
const MIME_TYPE = IS_MOBILE
  ? "video/mp4;codecs=avc1.4D001a"
  : "video/webm;codecs=vp9";
const BLOB_TYPE = IS_MOBILE ? "video/mp4" : "video/webm";

const download = (chunks: Blob[], set: any) => {
  console.log("??");
  const blob = new Blob(chunks, { type: BLOB_TYPE });
  const url = URL.createObjectURL(blob);
  set(url);
  // var reader = new FileReader();
  // reader.onload = function (e) {
  //   set(reader.result);
  // };
  // reader.readAsDataURL(blob);
  // return;
  // return url;
  // const a = document.createElement("a");
  // document.body.appendChild(a);
  // a.style = "display: none";
  // a.href = url;
  // a.download = "test.webm";
  // a.click();
  // window.URL.revokeObjectURL(url);
};

const WIDTH = 800;
const CONSTRAINTS = {
  audio: false,
  video: {
    facingMode: "user",
    width: { ideal: 1280 },
    height: { ideal: 1024 },
    frameRate: 10,
  },
};

export default function App() {
  const [status, recorderControls, recorded] = useMediaRecorder(
    {
      mimeType: MIME_TYPE,
      bitsPerSecond: 500_000,
    },
    {
      timeSlice: 1000,
      blobPropertyBag: { type: BLOB_TYPE },
    }
  );
  const [cameraEl, state, cameraControls, videoRef, stream] = useCamera(
    <video hidden autoPlay />,
    CONSTRAINTS,
    (stream) => {
      console.log("stream ready", stream);
      recorderControls.start(stream);
    }
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [url, setUrl] = useState("");

  useEffect(() => {
    let rafId: number;

    const predict = async (model: MediaPipeFaceMesh) => {
      const run = async () => {
        if (!ctxRef.current) {
          // @ts-ignore
          ctxRef.current = canvasRef.current?.getContext("2d");
        }
        const canvas = canvasRef.current;
        const ctx = ctxRef.current;
        // const ctx = canvasRef.current?.getContext("2d");
        const video = videoRef.current;
        // console.log(ctx, video, video?.paused);
        if (canvas && ctx && video && !video.paused && !video.ended) {
          if (canvas.width !== WIDTH) {
            canvas.width = WIDTH;
            canvas.height = (video.videoHeight / video.videoWidth) * WIDTH;
            console.log(
              (video.videoHeight / video.videoWidth) * WIDTH,
              video.videoHeight,
              video.videoWidth
            );
          }
          const predictions = await model.estimateFaces({
            input: video,
            returnTensors: false,
            flipHorizontal: false,
            predictIrises: false,
          });
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          if (predictions.length > 0) {
            annotateFeatures(
              ctx,
              predictions,
              scaler([
                canvas.width / video.videoWidth,
                canvas.width / video.videoWidth,
                1,
              ])
            );
          }
        } else if (ctx) {
          ctx.font = "30px Arial";
          if (!video) {
            ctx.fillText("Initializing video", 10, 50);
          } else if (video.paused) {
            ctx.fillText("Video paused", 10, 50);
          } else if (video.ended) {
            ctx.fillText("Video ended", 10, 50);
          }
        }
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(run);
      };
      rafId = requestAnimationFrame(run);
    };

    setupModel().then((model) => {
      predict(model);
    });

    // const stream = canvasRef.current!.captureStream(30);
    // console.log(stream);
    // const options = {
    //   mimeType: MIME_TYPE,
    //   frameRate: 1,
    //   bitsPerSecond: 500_000,
    // };
    // const recorder = new MediaRecorder(stream, options);

    // const now = Date.now();
    // let size = 0;
    // recorder.ondataavailable = (event) => {
    //   if (Date.now() - now < 10000) {
    //     console.log(event);
    //     setUrl(event.data.type);
    //   }
    //   chunksRef.current.push(event.data);
    //   size += event.data.size;
    //   console.log(
    //     `Size: ${size / 1000} kB after ${(event.timecode - now) / 1000}s`
    //   );
    // };
    // recorder.start(1000);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [videoRef]);

  useEffect(() => {
    if (recorded) {
      const url = URL.createObjectURL(recorded);
      setUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [recorded]);

  return (
    <div className="App">
      <canvas ref={canvasRef} />

      <div>
        <button onClick={() => download(chunksRef.current, setUrl)}>
          Finish
        </button>
        <a href={url} download>
          Link {url ? "v" : ""}
        </a>

        <div>
          {state.paused ? (
            <button onClick={() => cameraControls.play()}>Start</button>
          ) : (
            <button
              onClick={() => {
                console.log("??");
                cameraControls.pause();
              }}
            >
              Stop
            </button>
          )}
        </div>

        <div>
          {status === "paused" ? (
            <button onClick={() => recorderControls.resume()}>Resume</button>
          ) : status === "idle" && videoRef.current?.srcObject ? (
            <button
              onClick={() =>
                stream ? recorderControls.start(stream) : undefined
              }
            >
              New recording
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  recorderControls.pause();
                }}
              >
                Pause
              </button>
              <button
                onClick={() => {
                  recorderControls.stop();
                }}
              >
                Stop
              </button>
            </>
          )}
        </div>
        {cameraEl}
        {status}
      </div>
    </div>
  );
}
