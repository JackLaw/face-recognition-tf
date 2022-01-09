import { useEffect } from "react";
import { useVideo } from "react-use";

type ElOrProps = Parameters<typeof useVideo>[0];

const useCamera = (
  elOrProps: ElOrProps,
  constraints?: MediaStreamConstraints
) => {
  const [video, state, controls, ref] = useVideo(elOrProps);

  useEffect(() => {
    const videoRefCurrent = ref.current;
    if (videoRefCurrent) {
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
        throw new Error("Not support");
      }

      navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
        videoRefCurrent.srcObject = stream;
      });
    }
  }, [constraints, ref]);

  return [video, state, controls, ref] as const;
};

export default useCamera