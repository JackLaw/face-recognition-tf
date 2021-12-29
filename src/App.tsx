import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { MediaPipeFaceMesh } from "@tensorflow-models/face-landmarks-detection/dist/types";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs-core";
import { useCallback, useEffect, useRef } from "react";
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

export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const modelRef = useRef<MediaPipeFaceMesh | null>(null);

  useEffect(() => {
    const setup = async () => {
      await tf.setBackend("webgl");
      const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        { maxFaces: 1 }
      );
      modelRef.current = model;
    };
    setup();
  }, []);

  const predict = useCallback(async (video: HTMLVideoElement) => {
    if (!ctxRef.current) {
      ctxRef.current = canvasRef.current?.getContext("2d") || null;
    }
    const ctx = ctxRef.current;
    const model = modelRef.current;
    if (
      model &&
      canvasRef.current &&
      ctx &&
      video &&
      !video.paused &&
      !video.ended
    ) {

      const begin = Date.now();
      const predictions = await model.estimateFaces({
        input: video,
        returnTensors: false,
        flipHorizontal: false,
        predictIrises: false,
      });
      const end = Date.now();
      console.log(end - begin, begin, end);
      ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      if (predictions.length > 0) {
        const prediction = predictions[0];
        // @ts-ignore
        const { annotations } = prediction;
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "#32EE62";
        ctx.stroke(region(annotations.lipsUpperInner, true));
        ctx.stroke(region(annotations.lipsUpperOuter, true));
        ctx.stroke(region(annotations.lipsLowerInner, true));
        ctx.stroke(region(annotations.lipsLowerOuter, true));
        ctx.strokeStyle = "#ff0068";
        ctx.stroke(region(annotations.rightEyeUpper0, true));
        ctx.stroke(region(annotations.rightEyeLower0, true));
        ctx.stroke(region(annotations.rightEyeUpper1, true));
        ctx.stroke(region(annotations.rightEyeLower1, true));
        ctx.stroke(region(annotations.rightEyeUpper2, true));
        ctx.stroke(region(annotations.rightEyeLower2, true));
        ctx.stroke(region(annotations.rightEyeLower3, true));
        ctx.stroke(region(annotations.leftEyeUpper0, true));
        ctx.stroke(region(annotations.leftEyeLower0, true));
        ctx.stroke(region(annotations.leftEyeUpper1, true));
        ctx.stroke(region(annotations.leftEyeLower1, true));
        ctx.stroke(region(annotations.leftEyeUpper2, true));
        ctx.stroke(region(annotations.leftEyeLower2, true));
        ctx.stroke(region(annotations.leftEyeLower3, true));
        ctx.strokeStyle = "#32EfDB";
        ctx.stroke(region(annotations.rightEyebrowUpper, true));
        ctx.stroke(region(annotations.rightEyebrowLower, true));
        ctx.stroke(region(annotations.leftEyebrowUpper, true));
        ctx.stroke(region(annotations.leftEyebrowLower, true));
      }
    }
  }, []);

  const onSetup = useCallback(
    (video: HTMLVideoElement) => {
      video.addEventListener("play", () => {
        if (canvasRef.current) {
          canvasRef.current.width = video.videoWidth;
          canvasRef.current.height = video.videoHeight;
        }
        console.log("played");
        const run = () => {
          predict(video);
          requestAnimationFrame(run);
        };
        requestAnimationFrame(run);
      });
    },
    [predict]
  );

  return (
    <div className="App">
      <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2>

      <canvas ref={canvasRef} height={400} width={400} />
      <Camera
        ref={videoRef}
        onSetup={onSetup}
        playsInline
        hidden
        height={400}
        width={400}
      />
    </div>
  );
}
