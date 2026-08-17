# Welcome — start here

Hi! You're inheriting the lab's **reading-confusion detection** project: two interns before you built systems that watch a reader's eyes and try to catch the moment they get confused. Your job is not to start over — it's to understand what exists, fix what we already know is broken, and run the next experiments. This repo looks huge, but it's really just two tracks and three documents.

## How to interpret this repo

| What | Where | What it is |
|---|---|---|
| **Track 1 — Tobii** | `README.md` + `IITJ_Project.zip` | Eye-tracker pipeline: green-bubble gaze capture → fixations → confusion dataset → RF/XGBoost model → live prediction, plus two demo systems (ChatGPT popups, Wikipedia study) |
| **Track 2 — Webcam** | `WEBCAM/README.md` + `WEBCAM/app/` | No-hardware version: browser app, MediaPipe iris tracking, heuristic confusion score |
| **Demo videos** | `working_video.zip` | Screen recordings of every procedure — watch the matching one before you run anything |

Everything else (`DOCUMENTATION_.docx`, the CSVs and `.pkl` files inside the zip) is history and data from the previous interns — reference material, not things you need to run.

## Read in this order

1. **`README.md`** top to bottom — the Tobii runbook. Sections 1–9 tell you exactly what to install, when to connect the Tobii, and how to run each stage. **Section 10 is the most important thing in the repo**: the honest list of what's wrong.
2. **`WEBCAM/README.md`** — the webcam track, including which Tobii features a webcam can and cannot reproduce.
3. Then reproduce one Tobii session end-to-end (README stages 1–7) and run the webcam app once, just to feel both pipelines work.

## The one thing you must know before believing anything

**The existing trained model is not valid.** Its features include screen position and its labels were assigned per text line, so it learned *where* the confusing lines were on screen — not what confusion looks like in eye movements (`README.md` §10.1). Never report its accuracy. Fixing this is literally your first task.

## What you need to do

Your work plan, in order (full details in the linked sections):

1. **Re-label the existing data by time window**, not by text line — `README.md` §11, Experiment 1. No new data collection needed.
2. **Retrain on behavioral features only and evaluate honestly** (leave-one-text-out) — Experiment 2. Expect accuracy to drop; *that drop is the real baseline and the honest result.*
3. **Make the webcam app a research instrument** — CSV logging + confused-button, matching the Tobii schemas — `WEBCAM/README.md` §5, task W1. Can run in parallel with 1–2.
4. **Webcam calibration + DOM-based AOIs** — tasks W2–W4.
5. **The validation experiment:** record webcam and Tobii *simultaneously* on the same readers and measure the webcam's real accuracy — task W5. This plus Experiment 3 (multi-text, multi-participant dataset) is the core study of your term.

Rule of thumb whenever you're unsure: the READMEs are the source of truth, section 10/§4 of each lists the known traps, and anything you fix or learn — write it back into those files for the intern after you.

Good luck — the groundwork is done; the interesting part starts with you.
