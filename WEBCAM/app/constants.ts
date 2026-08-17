
// Gaze Processing Parameters
export const GAZE_BUFFER_SIZE = 300; // Store last 5 seconds of data at 60fps
export const MIN_FIXATION_DURATION = 150; // in milliseconds
export const MAX_DISPERSION_THRESHOLD = 50; // in pixels, for fixation detection
export const REGRESSION_X_THRESHOLD = 80; // min horizontal distance for a backward jump
export const REGRESSION_Y_TOLERANCE = 50; // max vertical distance to be considered on the same line

// Confusion Detection Parameters
export const CONFUSION_SCORE_THRESHOLD = 100;
export const SCORE_DECAY_RATE = 0.5; // points per frame
export const LONG_FIXATION_THRESHOLD = 400; // ms
export const LARGE_EYE_MOUSE_DISTANCE = 300; // pixels

// Scoring Weights
export const REGRESSION_SCORE_BUMP = 60;
export const LONG_FIXATION_SCORE_BUMP = 5;
export const EYE_MOUSE_DISTANCE_SCORE_BUMP = 2;

// MediaPipe Model Path
export const MEDIAPIPE_MODEL_PATH = "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
