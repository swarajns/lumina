export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private isInitialized = false;

  async startRecording(mode: 'audio' | 'video' | 'screen', options: {
    hasAudio: boolean;
    hasWebcam: boolean;
  }): Promise<void> {
    try {
      console.log('Starting recording with mode:', mode, 'options:', options);
      
      // Get the appropriate stream based on mode
      this.stream = await this.getStream(mode, options);
      
      if (!this.stream) {
        throw new Error('Failed to get media stream');
      }

      // Reset chunks
      this.chunks = [];

      // Get supported MIME type
      const mimeType = this.getSupportedMimeType();
      console.log('Using MIME type:', mimeType);

      // Create MediaRecorder with options
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: mimeType || undefined
      });

      // Handle data available
      this.mediaRecorder.ondataavailable = (event) => {
        console.log('Data available, size:', event.data.size);
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };

      // Handle errors
      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        throw new Error('Recording failed');
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isInitialized = true;
      
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Error starting recording:', error);
      this.cleanup();
      throw error;
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isInitialized) {
        reject(new Error('No recording in progress'));
        return;
      }

      console.log('Stopping recording...');

      this.mediaRecorder.onstop = () => {
        console.log('Recording stopped, chunks count:', this.chunks.length);
        
        if (this.chunks.length === 0) {
          reject(new Error('No recording data available'));
          return;
        }

        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mimeType });
        
        console.log('Created blob, size:', blob.size, 'type:', blob.type);
        
        this.cleanup();
        resolve(blob);
      };

      this.mediaRecorder.stop();
    });
  }

  pauseRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      console.log('Pausing recording');
      this.mediaRecorder.pause();
    }
  }

  resumeRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      console.log('Resuming recording');
      this.mediaRecorder.resume();
    }
  }

  getRecordingState(): string {
    return this.mediaRecorder?.state || 'inactive';
  }

  private async getStream(mode: string, options: {
    hasAudio: boolean;
    hasWebcam: boolean;
  }): Promise<MediaStream> {
    console.log('Getting stream for mode:', mode);

    switch (mode) {
      case 'audio':
        try {
          const constraints = {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            }
          };
          return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
          console.error('Audio stream error:', error);
          throw new Error('Microphone access denied or unavailable');
        }
      
      case 'video':
        try {
          const constraints = {
            video: {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 }
            },
            audio: options.hasAudio ? {
              echoCancellation: true,
              noiseSuppression: true
            } : false
          };
          return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
          console.error('Video stream error:', error);
          throw new Error('Camera access denied or unavailable');
        }
      
      case 'screen':
        try {
          const screenConstraints = {
            video: {
              mediaSource: 'screen',
              width: { max: 1920 },
              height: { max: 1080 },
              frameRate: { max: 30 }
            },
            audio: options.hasAudio
          };

          const screenStream = await navigator.mediaDevices.getDisplayMedia(screenConstraints);
          
          // If webcam overlay is requested, add webcam video
          if (options.hasWebcam) {
            try {
              const webcamStream = await navigator.mediaDevices.getUserMedia({
                video: {
                  width: { ideal: 320 },
                  height: { ideal: 240 }
                },
                audio: false // Don't add webcam audio to avoid echo
              });
              
              // For now, just return screen stream
              // TODO: Implement proper stream mixing for webcam overlay
              console.log('Webcam stream obtained but not mixed yet');
              webcamStream.getTracks().forEach(track => track.stop());
            } catch (webcamError) {
              console.warn('Webcam access failed, continuing with screen only:', webcamError);
            }
          }
          
          return screenStream;
        } catch (error) {
          console.error('Screen capture error:', error);
          throw new Error('Screen capture denied or unavailable');
        }
      
      default:
        throw new Error('Invalid recording mode');
    }
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus', 
      'video/webm;codecs=h264,opus',
      'video/webm',
      'audio/webm;codecs=opus',
      'audio/webm',
      'video/mp4;codecs=h264,aac',
      'video/mp4',
      'audio/mp4',
      'audio/mpeg'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Selected MIME type:', type);
        return type;
      }
    }

    console.warn('No supported MIME type found, using default');
    return '';
  }

  private cleanup(): void {
    console.log('Cleaning up recording resources');
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      this.stream = null;
    }
    
    this.mediaRecorder = null;
    this.chunks = [];
    this.isInitialized = false;
  }
}
