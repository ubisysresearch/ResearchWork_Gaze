
# Real-Time Webcam Confusion Detector

Website link - https://webcame-based-confusion-detector-60xav2l5e.vercel.app/

An AI-powered web application that uses your webcam to analyze eye movements and user behavior, detecting moments of confusion or increased cognitive load while reading in real-time. This project is built entirely with client-side technologies, ensuring user privacy by processing all data directly in the browser.

## How It Works

The application uses a standard webcam to track the user's face and eyes. It then applies a series of algorithms to translate raw eye movements into meaningful behavioral patterns, which are fed into a heuristic model to calculate a "confusion score."

1.  **Iris Tracking**: Using Google's **MediaPipe FaceLandmarker** library, the application pinpoints the user's irises with high accuracy in every frame of the webcam feed.
2.  **Gaze Mapping**: The 3D coordinates of the irises are mapped to 2D coordinates on the screen, creating a continuous stream of gaze points.
3.  **Fixation Detection**: The stream of gaze points is processed using a **Dispersion-Threshold Identification (I-DT)** algorithm. This algorithm identifies **fixations**, which are moments when the user's gaze pauses in a specific location for a minimum duration (e.g., while reading a word).
4.  **Behavioral Analysis**: Once fixations are identified, the system looks for key indicators of confusion:
    *   **Regressions**: The strongest indicator. This occurs when the user's eyes jump backward to re-read a previous section of text.
    *   **Long Fixations**: Staring at a single point for an unusually long time, which can signify difficulty processing information.
    *   **Eye-Mouse Divergence**: A large, sustained distance between the user's gaze point and their mouse cursor, suggesting a potential loss of focus.
5.  **Confusion Scoring**: Each of these indicators adds points to a `confusionScore`. This score naturally decays over time, ensuring that only a cluster of these behaviors in a short period will trigger a "Confused" state.
6.  **Adaptive Learning**: After each session, the user can provide feedback on the accuracy of the detection. This feedback tunes the `CONFUSION_SCORE_THRESHOLD`, making the model more or less sensitive over time and personalizing it to the user's unique reading habits.

## Key Features

-   **Real-Time Eye Tracking**: Smooth and performant gaze tracking using a standard webcam.
-   **Privacy-First Architecture**: All video processing and analysis happen 100% in the browser. No data or images are ever sent to a server.
-   **Heuristic-Based Confusion Model**: Uses established cognitive science principles (regressions, fixation duration) to estimate cognitive load.
-   **Adaptive Self-Correction**: A user feedback loop allows the model to learn and adjust its sensitivity, improving accuracy with each use.
-   **Session Summaries**: Provides a recap of session duration and the number of confusion moments detected.
-   **Modern Tech Stack**: Built with React, TypeScript, and Tailwind CSS for a responsive and maintainable user interface.

## Technology Stack

-   **Frontend Framework**: [React](https://reactjs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **AI / Machine Learning**: [Google MediaPipe Tasks for Vision](https://developers.google.com/mediapipe) (specifically the FaceLandmarker task)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Runtime**: Runs in any modern web browser that supports WebRTC (`getUserMedia`).

## File Structure

The project is organized to separate concerns, making it easier to understand and maintain.

```
/
├── public/
│   └── (static assets)
├── src/
│   ├── components/
│   │   └── IconComponents.tsx      # SVG icons for the UI
│   ├── services/
│   │   └── gazeProcessor.ts        # Core logic for fixation/regression detection
│   ├── App.tsx                     # Main application component, state, and UI logic
│   ├── constants.ts                # All tunable parameters for the algorithm
│   ├── index.tsx                   # Main entry point for the React app
│   └── types.ts                    # TypeScript interfaces for data structures
├── index.html                      # The main HTML file
└── README.md                       # This file
```

## How to Run

This project is designed to run in a web-based development environment.

1.  Ensure you have a webcam connected and have granted the browser permission to access it.
2.  Open the application in your browser.
3.  Click **"Start Detection"** to begin the session.
4.  Read the text panel while the application monitors your gaze in the background.
5.  Click **"Stop Detection"** to end the session and view your summary.
6.  Provide feedback to help the model improve for your next session!
