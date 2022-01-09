import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { AnnotatedPrediction } from "@tensorflow-models/face-landmarks-detection/dist/mediapipe-facemesh";
import "@tensorflow/tfjs-backend-webgl";
import * as tf from "@tensorflow/tfjs-core";

export const setupModel = async () => {
  await tf.setBackend("webgl");
  const model = await faceLandmarksDetection.load(
    faceLandmarksDetection.SupportedPackages.mediapipeFacemesh,
    { maxFaces: 2 }
  );
  return model;
};

export const region = (
  points: [number, number, number][],
  open: boolean = false
) => {
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

type Scale = (point: [number, number, number]) => [number, number, number];
export const scaler =
  (scale: [number, number, number]): Scale =>
  (point) => {
    return [point[0] * scale[0], point[1] * scale[1], point[2] * scale[2]];
  };

export const annotateFeatures = (
  ctx: CanvasRenderingContext2D,
  predictions: AnnotatedPrediction[],
  scale: Scale = scaler([1, 1, 1])
) => {
  for (let prediction of predictions) {
    //@ts-ignore
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
};
