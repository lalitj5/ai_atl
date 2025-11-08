// Microphone service for wake word detection and audio recording
export interface MicrophoneState {
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  silenceTimer: NodeJS.Timeout | null;
  audioContext: AudioContext | null;
  analyser: AnalyserNode | null;
  microphone: MediaStreamAudioSourceNode | null;
  javascriptNode: ScriptProcessorNode | null;
  currentStream: MediaStream | null;
  recognition: any; // SpeechRecognition type
}

const SILENCE_DURATION = 3500; // 3.5 seconds
const SILENCE_THRESHOLD = -20; // -20 dB
const WAKE_WORD = 'hey journey';

export function getAudioLevel(analyser: AnalyserNode): number {
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);

  const sum = dataArray.reduce((a, b) => a + b, 0);
  const average = sum / bufferLength;
  const dB = 20 * Math.log10(average / 255);

  return dB;
}

export function startWakeWordDetection(
  onWakeWordDetected: () => void,
  isListeningRef: () => boolean
): any {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error('Speech recognition not supported in this browser');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  recognition.onresult = (event: any) => {
    const transcript = Array.from(event.results)
      .map((result: any) => result[0].transcript)
      .join('')
      .toLowerCase()
      .trim();

    if (isListeningRef() && transcript.includes(WAKE_WORD)) {
      recognition.stop();
      setTimeout(() => onWakeWordDetected(), 500);
    }
  };

  recognition.onerror = (event: any) => {
    console.error('Speech recognition error:', event.error);
    if (event.error === 'no-speech') {
      setTimeout(() => {
        if (isListeningRef()) {
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
          }
        }
      }, 100);
    }
  };

  recognition.onend = () => {
    if (isListeningRef()) {
      try {
        recognition.start();
      } catch (e) {
        console.error('Failed to restart recognition:', e);
      }
    }
  };

  try {
    recognition.start();
  } catch (e) {
    console.error('Failed to start recognition:', e);
  }

  return recognition;
}

export async function startRecordingWithNewStream(
  onRecordingComplete: (blob: Blob) => void,
  onStopRecording: () => void
): Promise<MicrophoneState | null> {
  try {
    const recordingStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    return startRecording(recordingStream, onRecordingComplete, onStopRecording);
  } catch (error) {
    console.error('Error getting recording stream:', error);
    return null;
  }
}

export function startRecording(
  stream: MediaStream,
  onRecordingComplete: (blob: Blob) => void,
  onStopRecording: () => void
): MicrophoneState {
  const audioChunks: Blob[] = [];
  const currentStream = stream;

  const mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
    }

    onRecordingComplete(audioBlob);
  };

  const audioContext = new AudioContext();
  const analyser = audioContext.createAnalyser();
  const microphone = audioContext.createMediaStreamSource(stream);
  const javascriptNode = audioContext.createScriptProcessor(2048, 1, 1);

  analyser.smoothingTimeConstant = 0.8;
  analyser.fftSize = 2048;

  microphone.connect(analyser);
  analyser.connect(javascriptNode);
  javascriptNode.connect(audioContext.destination);

  let silenceTimer: NodeJS.Timeout | null = null;

  javascriptNode.onaudioprocess = () => {
    const volume = getAudioLevel(analyser);

    if (volume < SILENCE_THRESHOLD) {
      if (!silenceTimer) {
        silenceTimer = setTimeout(() => {
          onStopRecording();
        }, SILENCE_DURATION);
      }
    } else {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
    }
  };

  mediaRecorder.start();

  return {
    mediaRecorder,
    audioChunks,
    silenceTimer,
    audioContext,
    analyser,
    microphone,
    javascriptNode,
    currentStream,
    recognition: null
  };
}

export function stopRecording(state: MicrophoneState): void {
  if (state.silenceTimer) {
    clearTimeout(state.silenceTimer);
    state.silenceTimer = null;
  }

  if (state.javascriptNode) {
    state.javascriptNode.disconnect();
    state.javascriptNode = null;
  }
  if (state.analyser) {
    state.analyser.disconnect();
    state.analyser = null;
  }
  if (state.microphone) {
    state.microphone.disconnect();
    state.microphone = null;
  }
  if (state.audioContext) {
    state.audioContext.close();
    state.audioContext = null;
  }

  if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
    state.mediaRecorder.stop();
  }
}

export async function sendToServer(audioBlob: Blob): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    formData.append('translate', 'true');

    const response = await fetch('http://localhost:3001/transcribe', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      console.log('TRANSCRIPTION:', data.transcription);
      return data.transcription;
    } else {
      throw new Error(data.message || 'Translation failed');
    }
  } catch (error: any) {
    console.error('Error:', error);
    throw error;
  }
}

export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    // Check if microphone devices are available
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevices = devices.filter(device => device.kind === 'audioinput');

    if (audioDevices.length === 0) {
      return false;
    }

    // Add timeout to prevent hanging forever
    const getUserMediaPromise = navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    const timeoutPromise = new Promise<MediaStream>((_, reject) => {
      setTimeout(() => reject(new Error('getUserMedia timeout after 5 seconds')), 5000);
    });

    const permissionStream = await Promise.race([getUserMediaPromise, timeoutPromise]);

    permissionStream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error: any) {
    if (error.name !== 'NotAllowedError') {
      console.error('Error accessing microphone:', error);
    }
    return false;
  }
}

export function checkBrowserCompatibility(): boolean {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.error('Your browser does not support speech recognition. Please use Chrome or Edge.');
    return false;
  }
  return true;
}
