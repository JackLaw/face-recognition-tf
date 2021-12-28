import React, { useEffect, useRef, VideoHTMLAttributes } from "react";

// const Camera: React.FC<VideoHTMLAttributes<any>> = (props) => {
const Camera = React.forwardRef<HTMLVideoElement, VideoHTMLAttributes<any>>(
  (props, ref) => {
    // const ref = useRef<HTMLVideoElement>(null);
    useEffect(() => {
      const setup = async () => {
        const video = ref?.current;

        if (
          video &&
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia
        ) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: { facingMode: "user" }
          });
          video.srcObject = stream;

          return new Promise<HTMLVideoElement>((resolve) => {
            video.onloadedmetadata = () => {
              resolve(video);
            };
          });
        }
      };

      setup().then((video) => video?.play());
    }, [ref]);
    return <video ref={ref} {...props} />;
  }
);

export default Camera;
