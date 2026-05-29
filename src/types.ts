export interface SimulationState {
  // OODA loop metrics
  phase: number; // 0, 1, 2, 2.5, 3, 4
  phaseName: string;
  duxKey: boolean;
  agiKey: boolean;
  loopActive: boolean;

  // Signal / Brain metrics
  eegThetaDelta: number;
  eegAlphaBetaBurst: boolean;
  p3bAmplitude: number;
  hrvRmssd: number;
  pupilDilatation: number;
  edaPhasic: number;

  // Swarm & Arm metrics
  complexityBias: number;
  noiseFactor: number;
  stability: number;
  robotPositions: Array<{ x: number; y: number; angle1: number; angle2: number; role: string }>;
  averageReward: number;
  targets: Array<{ x: number; y: number }>;

  // Environmental telemetry 3 pillars
  pm25: number;
  co2: number;
  elfField: number; // Electromagnetic low frequency
  ambientNoise: number;
  allostaticLoad: number;

  // Defensive Matrix
  adversaryObservationDetected: boolean;
  stealthMode: boolean;
  socialMimicryIndex: number;
  schumannFrequency: number;
  phiNetwork: number;
}

export interface TelemetryHistory {
  timestamp: string;
  eegRatio: number;
  hrv: number;
  allostatic: number;
  phi: number;
  schumann: number;
}
