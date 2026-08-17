
import type { GazePoint, Fixation, Regression, Point } from '../types';
import {
  MIN_FIXATION_DURATION,
  MAX_DISPERSION_THRESHOLD,
  REGRESSION_X_THRESHOLD,
  REGRESSION_Y_TOLERANCE,
} from '../constants';

const calculateDispersion = (points: Point[]): number => {
  if (points.length < 2) return 0;
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  return Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
};

const calculateCentroid = (points: Point[]): Point => {
  const sumX = points.reduce((acc, p) => acc + p.x, 0);
  const sumY = points.reduce((acc, p) => acc + p.y, 0);
  return { x: sumX / points.length, y: sumY / points.length };
};

export const detectFixations = (gazeBuffer: GazePoint[], lastFixationId: number): { fixations: Fixation[], newFixationId: number } => {
  const newFixations: Fixation[] = [];
  let currentFixationId = lastFixationId;
  
  if (gazeBuffer.length < 2) return { fixations: [], newFixationId: lastFixationId };

  let windowStartIndex = 0;
  for (let i = 1; i < gazeBuffer.length; i++) {
    const windowSlice = gazeBuffer.slice(windowStartIndex, i + 1);
    const duration = windowSlice[windowSlice.length - 1].timestamp - windowSlice[0].timestamp;
    const dispersion = calculateDispersion(windowSlice.map(gp => gp.point));

    if (dispersion > MAX_DISPERSION_THRESHOLD) {
      const fixationCandidate = windowSlice.slice(0, -1);
      if (fixationCandidate.length > 0) {
        const fixationDuration = fixationCandidate[fixationCandidate.length - 1].timestamp - fixationCandidate[0].timestamp;
        if (fixationDuration >= MIN_FIXATION_DURATION) {
          const points = fixationCandidate.map(gp => gp.point);
          currentFixationId++;
          newFixations.push({
            id: currentFixationId,
            startTime: fixationCandidate[0].timestamp,
            endTime: fixationCandidate[fixationCandidate.length - 1].timestamp,
            duration: fixationDuration,
            point: calculateCentroid(points),
            dispersion: calculateDispersion(points),
          });
        }
      }
      windowStartIndex = i;
    }
  }
  return { fixations: newFixations, newFixationId: currentFixationId };
};

export const detectRegressions = (fixations: Fixation[]): Regression[] => {
  const regressions: Regression[] = [];
  if (fixations.length < 2) return [];

  for (let i = 1; i < fixations.length; i++) {
    const prevFix = fixations[i - 1];
    const currFix = fixations[i];

    const dx = prevFix.point.x - currFix.point.x;
    const dy = Math.abs(prevFix.point.y - currFix.point.y);

    if (dx > REGRESSION_X_THRESHOLD && dy < REGRESSION_Y_TOLERANCE) {
      regressions.push({ from: prevFix, to: currFix });
    }
  }
  return regressions;
};
