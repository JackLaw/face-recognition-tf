import React, { useEffect, VideoHTMLAttributes } from "react";

const Camera = React.forwardRef<HTMLVideoElement, VideoHTMLAttributes<any>>(
  ({ ...props }, ref) => {
    useEffect(() => {
      const setup = async () => {
        // @ts-ignore
        const video = ref?.current;

        if (
          video &&
          navigator.mediaDevices &&
          navigator.mediaDevices.getUserMedia
        ) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: "user",
              width: { ideal: 1280 },
              height: { ideal: 1024 },
            },
          });
          video.srcObject = stream;

          return new Promise<HTMLVideoElement>((resolve) => {
            video.onloadedmetadata = () => {
              resolve(video);
            };
          });
        }
      };

      setup().then((video) => {
        video?.play();
      });
    }, [ref, props.height, props.width]);
    return <video ref={ref} {...props} />;
  }
);

export default Camera;
