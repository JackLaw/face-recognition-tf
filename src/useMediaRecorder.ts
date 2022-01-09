import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type UseMediaRecorderOptions = {
  timeSlice?: number;
  onDataAvailable?: (event: BlobEvent) => void;
  onStart?: () => void;
  onStop?: (recorded: Blob) => void;
  onError?: (event: MediaRecorderErrorEvent) => void;
  blobPropertyBag?: BlobPropertyBag;
};

type Status = "idle" | "recording" | "paused" | "error";

const useMediaRecorder = (
  options?: MediaRecorderOptions,
  {
    timeSlice,
    onDataAvailable,
    onStart,
    onStop,
    onError,
    blobPropertyBag,
  }: UseMediaRecorderOptions = {}
) => {
  const [recorded, setRecorded] = useState<Blob>();
  const [status, setStatus] = useState<Status>("idle");
  const chunksRef = useRef<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder>();
  // const mediaRecorder = useMemo(() => {
  //   return new MediaRecorder(stream, recorderOptions);
  // }, [stream, recorderOptions]);

  useEffect(() => {}, []);

  const handleDataAvailable = useCallback(
    (event: BlobEvent) => {
      if (event.data.size) {
        chunksRef.current.push(event.data);
        onDataAvailable?.(event);
      }
    },
    [onDataAvailable]
  );

  const handleError = useCallback(
    (event: MediaRecorderErrorEvent) => {
      setStatus("error");
      onError?.(event);
    },
    [onError]
  );

  const start = useCallback(
    (stream: MediaStream) => {
      chunksRef.current = [];
      recorderRef.current = new MediaRecorder(stream, options);
      recorderRef.current.addEventListener('dataavailable', handleDataAvailable);
      // @ts-ignore
      recorderRef.current.addEventListener('error', handleError);
      recorderRef.current.start(timeSlice);
      setStatus("recording");
      onStart?.();
    },
    [options, timeSlice, handleDataAvailable, handleError, onStart]
  );

  useEffect(() => {
    const recorder = recorderRef.current;
    if (recorder) {
      recorder.addEventListener('dataavailable', handleDataAvailable);
      // @ts-ignore
      recorder.addEventListener('error', handleError);
      return () => {
        recorder.removeEventListener("dataavailable", handleDataAvailable);
        // @ts-ignore
        recorder.removeEventListener("error", handleError);
      };
    }
  }, [handleDataAvailable, handleError]);

  const pause = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.pause();
      setStatus("paused");
    }
  }, []);

  const resume = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "paused") {
      recorderRef.current.resume();
      setStatus("recording");
    }
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
      const newRecorded = new Blob(chunksRef.current, blobPropertyBag);
      recorderRef.current = undefined;
      setRecorded(newRecorded);
      setStatus("idle");
      onStop?.(newRecorded);
      return newRecorded
    }
  }, [blobPropertyBag, onStop]);

  return useMemo(() => {
    return [
      status,
      {
        start,
        pause,
        resume,
        stop,
      },
      recorded,
      recorderRef.current?.stream,
    ] as const;
  }, [status, recorded, start, pause, resume, stop]);
};

export default useMediaRecorder;
