
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import * as constants from './constants';
import type { GazePoint, Fixation, Regression, MousePosition, DetectionParameters } from './types';
import { DetectionStatus } from './types';
import { detectFixations, detectRegressions } from './services/gazeProcessor';
import { CameraIcon, FocusIcon, ConfusionIcon, InfoIcon } from './components/IconComponents';

const ReadingPanel = React.memo(() => (
  <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl text-gray-300 leading-relaxed text-lg">
    <h2 className="text-2xl font-bold text-cyan-400 mb-4">The Challenge of E-Learning Engagement</h2>
    <p className="mb-4">
      E-learning became essential post-COVID, but monitoring student engagement is difficult without in-person observation. Traditional monitoring methods, such as video or physiological sensors, often raise significant privacy issues. The key problem is how to non-intrusively and privately monitor and recognize what a student is doing—whether it's learning-related or not—during online study. This system is a proof-of-concept for a privacy-preserving solution using only a standard webcam.
    </p>
    <p className="mb-4">
      By analyzing subtle cues in your eye movements, such as <strong className="text-yellow-400">fixations</strong> (where your gaze pauses), <strong className="text-yellow-400">saccades</strong> (the rapid jumps between pauses), and especially <strong className="text-red-400">regressions</strong> (when you jump back to re-read text), this application estimates your cognitive state. When you re-read text or your gaze pauses for an extended period, it's often a sign of confusion or deep thought. This system will attempt to detect these moments in real-time.
    </p>
  </div>
));

const StatusDisplay = ({ status, score, threshold }: { status: DetectionStatus; score: number, threshold: number }) => {
  const getStatusColor = () => {
    switch (status) {
      case DetectionStatus.Focused: return 'text-green-400';
      case DetectionStatus.Confused: return 'text-red-400';
      case DetectionStatus.Initializing: return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case DetectionStatus.Focused: return <FocusIcon className="w-8 h-8" />;
      case DetectionStatus.Confused: return <ConfusionIcon className="w-8 h-8" />;
      default: return <InfoIcon className="w-8 h-8" />;
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center justify-center space-y-2 w-full">
      <div className={`flex items-center space-x-3 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-2xl font-bold">{status}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-cyan-500 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${Math.min(score / threshold * 100, 100)}%` }}
        ></div>
      </div>
      <span className="text-xs text-gray-400">Confusion Score: {score.toFixed(0)} / {threshold}</span>
    </div>
  );
};

const SessionRecapCard = ({ summary, onFeedback, feedbackSubmitted }: { 
  summary: { confusionCount: number, sessionDuration: number };
  onFeedback: (isAccurate: boolean) => void;
  feedbackSubmitted: boolean;
}) => {
  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg animate-fade-in">
      <h3 className="text-xl font-bold text-cyan-400 mb-4">Session Summary</h3>
      <div className="space-y-3 text-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Total Duration:</span>
          <span className="font-semibold">{formatDuration(summary.sessionDuration)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Moments of Confusion:</span>
          <span className="font-semibold text-red-400">{summary.confusionCount}</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        {feedbackSubmitted ? (
          <p className="text-center text-green-400 font-semibold">Thank you! Your feedback helps the model improve.</p>
        ) : (
          <>
            <div className="flex items-center justify-center text-center text-gray-400 mb-3">
              <span>Was our confusion detection accurate?</span>
              <div className="relative group ml-2">
                  <InfoIcon className="w-5 h-5 cursor-pointer" />
                  <div className="absolute bottom-full mb-2 w-60 bg-gray-900 text-white text-xs rounded py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none transform -translate-x-1/2 left-1/2">
                      Your feedback adjusts the algorithm's sensitivity to better match your personal reading behavior.
                  </div>
              </div>
            </div>
            <div className="flex justify-center space-x-4">
              <button onClick={() => onFeedback(true)} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 transition-colors">Yes, Accurate</button>
              <button onClick={() => onFeedback(false)} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 transition-colors">No, Inaccurate</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};


export default function App() {
  const [status, setStatus] = useState<DetectionStatus>(DetectionStatus.Idle);
  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const [confusionScore, setConfusionScore] = useState(0);
  const [sessionSummary, setSessionSummary] = useState<{
    confusionCount: number;
    sessionDuration: number;
  } | null>(null);
  const [showRecapCard, setShowRecapCard] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const [detectionParams, setDetectionParams] = useState<DetectionParameters>(() => {
    const savedParams = localStorage.getItem('detectionParams');
    return savedParams ? JSON.parse(savedParams) : { ...constants };
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  
  const faceLandmarker = useRef<FaceLandmarker | null>(null);
  
  const gazeBuffer = useRef<GazePoint[]>([]);
  const fixations = useRef<Fixation[]>([]);
  const lastFixationId = useRef(0);
  const regressions = useRef<Regression[]>([]);
  const mousePosition = useRef<MousePosition>({ x: 0, y: 0, timestamp: 0 });
  const sessionStartTimeRef = useRef<number>(0);
  const sessionConfusionCountRef = useRef<number>(0);
  const prevStatusRef = useRef<DetectionStatus>(status);
  
  const initializeMediaPipe = useCallback(async () => {
    setStatus(DetectionStatus.Initializing);
    try {
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
      faceLandmarker.current = await FaceLandmarker.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: constants.MEDIAPIPE_MODEL_PATH,
          delegate: "GPU",
        },
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      setStatus(DetectionStatus.Idle);
    } catch (error) {
      console.error("Error initializing MediaPipe:", error);
      setStatus(DetectionStatus.Error);
    }
  }, []);

  useEffect(() => {
    initializeMediaPipe();
    
    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current = { x: event.clientX, y: event.clientY, timestamp: Date.now() };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [initializeMediaPipe]);

  const startWebcam = async () => {
    setShowRecapCard(false);
    setSessionSummary(null);
    sessionConfusionCountRef.current = 0;
    sessionStartTimeRef.current = Date.now();
    
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', () => {
            setIsWebcamOn(true);
            setStatus(DetectionStatus.Focused);
            requestRef.current = requestAnimationFrame(predictWebcam);
          });
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
        setStatus(DetectionStatus.Error);
      }
    }
  };

  const stopWebcam = () => {
    const sessionDuration = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
    setSessionSummary({
      confusionCount: sessionConfusionCountRef.current,
      sessionDuration,
    });
    setShowRecapCard(true);
    setFeedbackSubmitted(false);
  
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamOn(false);
    setStatus(DetectionStatus.Idle);
    gazeBuffer.current = [];
    fixations.current = [];
    regressions.current = [];
    setConfusionScore(0);
  };
  
  const handleToggleWebcam = () => {
    if (isWebcamOn) {
      stopWebcam();
    } else {
      startWebcam();
    }
  };

  const handleFeedback = useCallback((isAccurate: boolean) => {
    if (isAccurate) {
      // If accurate, no changes needed. The model is well-calibrated.
    } else {
      const newParams = { ...detectionParams };
      const LEARNING_RATE = 0.1;

      if (sessionSummary && sessionSummary.confusionCount > 0) {
        // False Positive: Detected confusion, but user was not confused.
        // Make it harder to detect confusion.
        newParams.CONFUSION_SCORE_THRESHOLD *= (1 + LEARNING_RATE);
      } else {
        // False Negative: Did not detect confusion, but user was confused.
        // Make it easier to detect confusion.
        newParams.CONFUSION_SCORE_THRESHOLD *= (1 - LEARNING_RATE);
      }
      setDetectionParams(newParams);
      localStorage.setItem('detectionParams', JSON.stringify(newParams));
    }
    setFeedbackSubmitted(true);
  }, [detectionParams, sessionSummary]);
  
  const predictWebcam = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !faceLandmarker.current) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const video = videoRef.current;
    if (video.readyState < 2) {
      requestRef.current = requestAnimationFrame(predictWebcam);
      return;
    }

    const startTimeMs = performance.now();
    const results: FaceLandmarkerResult = faceLandmarker.current.detectForVideo(video, startTimeMs);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        const landmarks = results.faceLandmarks[0];
        const leftIris = [474, 475, 476, 477].map(i => landmarks[i]);
        const rightIris = [469, 470, 471, 472].map(i => landmarks[i]);

        const leftCenter = leftIris.reduce((acc, lm) => ({ x: acc.x + lm.x, y: acc.y + lm.y }), { x: 0, y: 0 });
        leftCenter.x /= leftIris.length;
        leftCenter.y /= leftIris.length;
        
        const rightCenter = rightIris.reduce((acc, lm) => ({ x: acc.x + lm.x, y: acc.y + lm.y }), { x: 0, y: 0 });
        rightCenter.x /= rightIris.length;
        rightCenter.y /= rightIris.length;

        const gazeX = 1 - (leftCenter.x + rightCenter.x) / 2;
        const gazeY = (leftCenter.y + rightCenter.y) / 2;

        const screenX = gazeX * window.innerWidth;
        const screenY = gazeY * window.innerHeight;
        
        gazeBuffer.current.push({ timestamp: Date.now(), point: { x: screenX, y: screenY } });
        if (gazeBuffer.current.length > detectionParams.GAZE_BUFFER_SIZE) {
            gazeBuffer.current.shift();
        }

        const fixationDetectionResult = detectFixations(gazeBuffer.current, lastFixationId.current);
        if (fixationDetectionResult.fixations.length > 0) {
            const newFixations = fixationDetectionResult.fixations;
            fixations.current.push(...newFixations);
            lastFixationId.current = fixationDetectionResult.newFixationId;
            
            const lastFixationEndTime = newFixations[newFixations.length - 1].endTime;
            gazeBuffer.current = gazeBuffer.current.filter(p => p.timestamp > lastFixationEndTime);
            
            newFixations.forEach(fix => {
                if (fix.duration > detectionParams.LONG_FIXATION_THRESHOLD) {
                    setConfusionScore(s => s + detectionParams.LONG_FIXATION_SCORE_BUMP);
                }
                const dist = Math.sqrt((fix.point.x - mousePosition.current.x)**2 + (fix.point.y - mousePosition.current.y)**2);
                if (dist > detectionParams.LARGE_EYE_MOUSE_DISTANCE) {
                    setConfusionScore(s => s + detectionParams.EYE_MOUSE_DISTANCE_SCORE_BUMP);
                }
            });
            
            const newRegressions = detectRegressions(fixations.current.slice(-5));
            if (newRegressions.length > 0) {
                regressions.current.push(...newRegressions);
                setConfusionScore(s => s + (detectionParams.REGRESSION_SCORE_BUMP * newRegressions.length));
            }
        }
      }
      
      setConfusionScore(s => Math.max(0, s - detectionParams.SCORE_DECAY_RATE));
      
      const lastGaze = gazeBuffer.current[gazeBuffer.current.length -1];
      if(lastGaze) {
        const gazeDot = document.getElementById('gaze-dot');
        if (gazeDot) {
          gazeDot.style.transform = `translate(${lastGaze.point.x}px, ${lastGaze.point.y}px)`;
          gazeDot.style.opacity = '1';
        }
      }
    }

    requestRef.current = requestAnimationFrame(predictWebcam);
  }, [detectionParams]);

  useEffect(() => {
    if (isWebcamOn) {
      if (confusionScore > detectionParams.CONFUSION_SCORE_THRESHOLD) {
        setStatus(DetectionStatus.Confused);
      } else {
        setStatus(DetectionStatus.Focused);
      }
    }
  }, [confusionScore, isWebcamOn, detectionParams.CONFUSION_SCORE_THRESHOLD]);

  useEffect(() => {
    if (status === DetectionStatus.Confused && prevStatusRef.current !== DetectionStatus.Confused) {
      sessionConfusionCountRef.current++;
    }
    prevStatusRef.current = status;
  }, [status]);
  
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 md:p-8 font-sans">
      <div id="gaze-dot" className="fixed w-4 h-4 bg-cyan-400 rounded-full pointer-events-none z-50 opacity-0 transition-opacity duration-100 mix-blend-screen" style={{top: '-8px', left: '-8px'}}></div>
      <div className="w-full max-w-7xl">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
            Real-Time Confusion Detector
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Using Webcam Eye-Tracking and Behavioral Analysis</p>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 flex flex-col space-y-8">
            <ReadingPanel />
          </div>
          
          <aside className="flex flex-col space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold text-cyan-400 mb-4">Controls</h3>
              <button 
                onClick={handleToggleWebcam} 
                disabled={status === DetectionStatus.Initializing || status === DetectionStatus.Error}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isWebcamOn 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } disabled:bg-gray-600 disabled:cursor-not-allowed`}
              >
                <CameraIcon className="w-6 h-6" />
                <span>{isWebcamOn ? 'Stop Detection' : 'Start Detection'}</span>
              </button>
            </div>
            
            <StatusDisplay status={status} score={confusionScore} threshold={detectionParams.CONFUSION_SCORE_THRESHOLD} />

            {showRecapCard && sessionSummary && (
              <SessionRecapCard 
                summary={sessionSummary} 
                onFeedback={handleFeedback} 
                feedbackSubmitted={feedbackSubmitted} 
              />
            )}
            
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg relative">
               <h3 className="text-xl font-bold text-cyan-400 mb-2">Webcam Feed</h3>
                <div className="relative aspect-video bg-black rounded-md overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full transform -scale-x-100"></video>
                    <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full"></canvas>
                </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
