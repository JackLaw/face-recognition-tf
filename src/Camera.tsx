import React, { useEffect, VideoHTMLAttributes } from "react";

const Camera = React.forwardRef<
  HTMLVideoElement,
  VideoHTMLAttributes<any> & { onSetup: (video: HTMLVideoElement) => void }
>(({ onSetup, ...props }, ref) => {
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
          video: { facingMode: "user" },
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
      if (video) {
        onSetup(video);
        video.play();
      }
    });
  }, [ref]);
  return <video ref={ref} {...props} />;
});

export default Camera;
