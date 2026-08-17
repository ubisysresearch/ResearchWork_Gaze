
export interface Point {
  x: number;
  y: number;
}

export interface GazePoint {
  timestamp: number;
  point: Point;
}

export interface Fixation {
  id: number;
  startTime: number;
  endTime: number;
  duration: number;
  point: Point;
  dispersion: number;
}

export interface Regression {
  from: Fixation;
  to: Fixation;
}

export interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
}

export enum DetectionStatus {
  Idle = "IDLE",
  Initializing = "INITIALIZING",
  Calibrating = "CALIBRATING",
  Focused = "FOCUSED",
  Confused = "CONFUSION DETECTED",
  Error = "ERROR",
}

export interface DetectionParameters {
  GAZE_BUFFER_SIZE: number;
  MIN_FIXATION_DURATION: number;
  MAX_DISPERSION_THRESHOLD: number;
  REGRESSION_X_THRESHOLD: number;
  REGRESSION_Y_TOLERANCE: number;
  CONFUSION_SCORE_THRESHOLD: number;
  SCORE_DECAY_RATE: number;
  LONG_FIXATION_THRESHOLD: number;
  LARGE_EYE_MOUSE_DISTANCE: number;
  REGRESSION_SCORE_BUMP: number;
  LONG_FIXATION_SCORE_BUMP: number;
  EYE_MOUSE_DISTANCE_SCORE_BUMP: number;
}
