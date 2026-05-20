import type { CurvePoint, Emitter } from '../../types';

export interface TimelineTrack {
  id: string;
  label: string;
  nativeName: string;
  points: CurvePoint[];
}

export interface TimelineState {
  time: number;
  duration: number;
  playing: boolean;
  looping: boolean;
  snap: number;
  selectedTrack: string | null;
}

export function buildEmitterTimeline(emitter: Emitter | undefined): TimelineTrack[] {
  if (!emitter) return [];
  return [
    { id: `${emitter.uid}:alpha`, label: 'Alpha', nativeName: 'TimeEventAlpha', points: emitter.alphaCurve },
    { id: `${emitter.uid}:size-x`, label: 'Size X', nativeName: 'TimeEventScaleX', points: emitter.sizeCurve },
    { id: `${emitter.uid}:speed`, label: 'Speed', nativeName: 'TimeEventEmittingVelocity', points: emitter.speedCurve },
    { id: `${emitter.uid}:spin`, label: 'Spin', nativeName: 'TimeEventRotation', points: emitter.spinCurve },
  ];
}
