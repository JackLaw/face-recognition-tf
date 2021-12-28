import { useEffect, useRef } from "react";
import Camera from "./Camera";
import "./styles.css";

import "@tensorflow/tfjs-backend-webgl";

import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as tf from "@tensorflow/tfjs-core";
import { MediaPipeFaceMesh } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";

let count = 0;

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
// function drawPath(ctx, points, closePath) {
//   ctx.stroke(region);
// }
export default function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D>(null);

  useEffect(() => {
    let rafId: number;

    const setup = async () => {
      await tf.setBackend("webgl");
      const model = await faceLandmarksDetection.load(
        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
        { maxFaces: 1 }
      );
      return model;
    };

    const predict = async (model: MediaPipeFaceMesh) => {
      const run = async () => {
        if (!ctxRef.current) {
          ctxRef.current = canvasRef.current?.getContext("2d");
        }
        const ctx = ctxRef.current;
        // const ctx = canvasRef.current?.getContext("2d");
        const video = videoRef.current;

        // console.log(ctx, video, video?.paused);
        if (ctx && video && !video.paused && !video.ended) {
          canvasRef.current!.width = video.videoWidth;
          canvasRef.current!.height = video.videoHeight;
          // if (count % 60 === 0) {
            ctx.strokeStyle = "#32EEDB";
            ctx.lineWidth = 0.5;

            // ctx.stroke(
            //   region(
            //     [
            //       // [5, 5, 0],
            //       // [5, 50, 0],
            //       // [50, 50, 0],
            //       // [50, 5, 0]

            //       [225.6452178955078, 424.2281799316406, 13.969615936279297],
            //       [227.68629455566406, 422.4673156738281, 8.848345756530762],
            //       [232.02305603027344, 421.9060363769531, 3.8572874069213867],
            //       [237.55531311035156, 420.7864990234375, -0.6405412554740906],
            //       [249.29058837890625, 420.41546630859375, -4.729137420654297],
            //       [262.26177978515625, 423.7639465332031, -5.925846576690674],
            //       [276.6902160644531, 422.05169677734375, -6.245362758636475],
            //       [291.8392333984375, 424.3356018066406, -3.7967865467071533],
            //       [300.926513671875, 426.18328857421875, -0.5071419477462769],
            //       [308.56866455078125, 426.9857482910156, 3.453565835952759],
            //       [312.60357666015625, 428.8511962890625, 8.06679916381836]
            //     ],
            //     false
            //   )
            // );
            const predictions = await model.estimateFaces({
              input: video,
              returnTensors: false,
              flipHorizontal: false,
              predictIrises: true
            });
            console.log("predicted");
            ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            if (predictions.length > 0) {
              const prediction = predictions[0] as AnnotatedPredictionValues;
              const { lipsUpperOuter } = prediction.annotations;
              ctx.stroke(region(lipsUpperOuter, false));
              // ctx.fill();
              // console.log("?", JSON.stringify(lipsUpperOuter));
            // }
          }
          count++;
          rafId = requestAnimationFrame(run);
        }
      };
      rafId = requestAnimationFrame(run);
    };

    setup().then((model) => {
      predict(model);
    });

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

      <canvas ref={canvasRef} height={400} width={400} />
      <Camera ref={videoRef} hidden playsInline height={400} width={400} />
    </div>
  );
}
