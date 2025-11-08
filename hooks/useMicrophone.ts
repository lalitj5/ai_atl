"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  MicrophoneState,
  startWakeWordDetection,
  startRecordingWithNewStream,
  stopRecording,
  sendToServer,
  requestMicrophonePermission,
  checkBrowserCompatibility
} from '@/lib/services/microphoneService';

export function useMicrophone() {
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const recordingStateRef = useRef<MicrophoneState | null>(null);
  const isListeningRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    try {
      const text = await sendToServer(audioBlob);
      setTranscription(text);
      setIsRecording(false);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      setIsRecording(false);
    }
  }, []);

  const handleStopRecording = useCallback(() => {
    if (recordingStateRef.current) {
      stopRecording(recordingStateRef.current);
      recordingStateRef.current = null;
    }
  }, []);

  const handleWakeWordDetected = useCallback(async () => {
    setIsRecording(true);
    const state = await startRecordingWithNewStream(
      handleRecordingComplete,
      handleStopRecording
    );
    recordingStateRef.current = state;
  }, [handleRecordingComplete, handleStopRecording]);

  const startListening = useCallback(async (isAutoStart = false) => {
    if (!checkBrowserCompatibility()) {
      if (!isAutoStart) {
        alert('Your browser does not support speech recognition. Please use Chrome or Edge.');
      }
      return false;
    }

    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      if (!isAutoStart) {
        alert('Could not access microphone. Please check permissions.');
      }
      return false;
    }

    setIsListening(true);
    recognitionRef.current = startWakeWordDetection(
      handleWakeWordDetected,
      () => isListeningRef.current
    );
    return true;
  }, [handleWakeWordDetected]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    handleStopRecording();
    setIsListening(false);
    setIsRecording(false);
  }, [handleStopRecording]);

  const toggleMute = useCallback(async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening(false);
    }
  }, [isListening, stopListening, startListening]);

  // Manual stop recording (when button is pressed while recording)
  const manualStopRecording = useCallback(() => {
    if (isRecording) {
      handleStopRecording();
    }
  }, [isRecording, handleStopRecording]);

  // Try to start listening on mount (default unmuted)
  // This may fail due to browser requiring user gesture, but that's ok
  // TEMPORARILY DISABLED FOR DEBUGGING
  // useEffect(() => {
  //   console.log('Component mounted, trying auto-start');
  //   const tryAutoStart = async () => {
  //     const result = await startListening(true);
  //     console.log('Auto-start result:', result);
  //   };
  //   tryAutoStart();
  // }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (recordingStateRef.current) {
        stopRecording(recordingStateRef.current);
      }
    };
  }, []);

  return {
    isListening,
    isRecording,
    transcription,
    toggleMute,
    manualStopRecording
  };
}
