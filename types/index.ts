export interface Meeting {
  id: string;
  title: string;
  duration: number;
  timestamp: Date;
  audioUrl?: string;
  videoUrl?: string;
  transcript?: string;
  summary?: string;
  actionItems?: ActionItem[];
}

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  mode: 'audio' | 'video' | 'screen';
  hasAudio: boolean;
  hasWebcam: boolean;
}

export interface AIAnalysis {
  transcript: string;
  summary: string;
  actionItems: ActionItem[];
  keyPoints: string[];
}
