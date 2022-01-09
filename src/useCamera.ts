import { useEffect, useRef, useState } from "react";
import { useVideo } from "react-use";

type ElOrProps = Parameters<typeof useVideo>[0];

const useCamera = (
  elOrProps: ElOrProps,
  constraints?: MediaStreamConstraints,
  onStreamReady?: (stream: MediaStream) => void
) => {
  const [video, state, controls, ref] = useVideo(elOrProps);
  const [stream, setStream] = useState<MediaStream>()
  const onStreamReadyRef = useRef(onStreamReady);

  useEffect(() => {
    const videoRefCurrent = ref.current;
    if (videoRefCurrent) {
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        throw new Error("Not support");
      }

      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        videoRefCurrent.srcObject = stream;
        setStream(stream);
        onStreamReadyRef.current?.(stream);
      });
    }
  }, [constraints, ref]);

  return [video, state, controls, ref, stream] as const;
};

export default useCamera