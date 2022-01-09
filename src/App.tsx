import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { MediaPipeFaceMesh } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs-core";
import React, { useEffect, useRef, useState } from "react";
import Camera from "./Camera";
import "./styles.css";

const region = (points: [number, number, number][], open: boolean = false) => {
  const path = new Path2D();
  path.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    const point = points[i];
    path.lineTo(point[0], point[1]);
  }
  if (!open) {
    path.closePath();
  }
  return path;
};

const scaler =
  (scale: [number, number, number]) => (point: [number, number, number]) => {
    return [point[0] * scale[0], point[1] * scale[1], point[2] * scale[2]];
  };

const mimeType = MediaRecorder.isTypeSupported("video/mp4")
  ? "video/mp4;codecs=avc1.4D001a"
  : "video/webm;codecs=vp9";

const download = (chunks: Blob[], set: any) => {
  console.log("??");
  const blob = new Blob(chunks, { type: mimeType.split(';')[0] });
  const url = URL.createObjectURL(blob);
  set(url);
  console.log(url);
  return;
  var reader = new FileReader();
  reader.onload = function (e) {
    set(reader.result);
  };
  reader.readAsDataURL(blob);
  return;
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
export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [url, setUrl] = useState("");

  useEffect(() => {
    let rafId: number;

    const setup = async () => {
      await tf.setBackend("webgl");
      const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        { maxFaces: 2 }
      );
      return model;
    };

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
          ctx.strokeStyle = "#32EEDB";
          ctx.lineWidth = 0.5;

          const predictions = await model.estimateFaces({
            input: video,
            returnTensors: false,
            flipHorizontal: false,
            predictIrises: false,
          });
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          if (predictions.length > 0) {
            const prediction = predictions[0];
            const scale = scaler([
              canvas.width / video.videoWidth,
              canvas.width / video.videoWidth,
              1,
            ]);
            // @ts-ignore
            const { annotations } = prediction;
            ctx.lineWidth = 1;
            ctx.strokeStyle = "#32EE62";
            ctx.stroke(region(annotations.lipsUpperInner.map(scale), true));
            ctx.stroke(region(annotations.lipsUpperOuter.map(scale), true));
            ctx.stroke(region(annotations.lipsLowerInner.map(scale), true));
            ctx.stroke(region(annotations.lipsLowerOuter.map(scale), true));
            ctx.strokeStyle = "#ff0068";
            ctx.stroke(region(annotations.rightEyeUpper0.map(scale), true));
            ctx.stroke(region(annotations.rightEyeLower0.map(scale), true));
            ctx.stroke(region(annotations.rightEyeUpper1.map(scale), true));
            ctx.stroke(region(annotations.rightEyeLower1.map(scale), true));
            ctx.stroke(region(annotations.rightEyeUpper2.map(scale), true));
            ctx.stroke(region(annotations.rightEyeLower2.map(scale), true));
            ctx.stroke(region(annotations.rightEyeLower3.map(scale), true));
            ctx.stroke(region(annotations.leftEyeUpper0.map(scale), true));
            ctx.stroke(region(annotations.leftEyeLower0.map(scale), true));
            ctx.stroke(region(annotations.leftEyeUpper1.map(scale), true));
            ctx.stroke(region(annotations.leftEyeLower1.map(scale), true));
            ctx.stroke(region(annotations.leftEyeUpper2.map(scale), true));
            ctx.stroke(region(annotations.leftEyeLower2.map(scale), true));
            ctx.stroke(region(annotations.leftEyeLower3.map(scale), true));
            ctx.strokeStyle = "#32EfDB";
            ctx.stroke(region(annotations.rightEyebrowUpper.map(scale), true));
            ctx.stroke(region(annotations.rightEyebrowLower.map(scale), true));
            ctx.stroke(region(annotations.leftEyebrowUpper.map(scale), true));
            ctx.stroke(region(annotations.leftEyebrowLower.map(scale), true));
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

        rafId = requestAnimationFrame(run);
      };
      rafId = requestAnimationFrame(run);
    };

    setup().then((model) => {
      predict(model);
    });

    const stream = canvasRef.current!.captureStream(30);
    console.log(stream);
    const options = {
      mimeType,
      frameRate: 1,
      bitsPerSecond: 500_000,
    };
    const recorder = new MediaRecorder(stream, options);

    const now = Date.now();
    let size = 0;
    recorder.ondataavailable = (event) => {
      if (Date.now() - now < 10000) {
        console.log(event);
        setUrl(event.data.type);
      }
      chunksRef.current.push(event.data);
      size += event.data.size;
      console.log(
        `Size: ${size / 1000} kB after ${(event.timecode - now) / 1000}s`
      );
    };
    recorder.start(1000);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>

      <canvas ref={canvasRef} />
      <button onClick={() => download(chunksRef.current, setUrl)}>
        Finish
      </button>
      <a href={url} download>
        Link {url ? "v" : ""}
      </a>
      <Camera ref={videoRef} playsInline hidden />
    </div>
  );
}
