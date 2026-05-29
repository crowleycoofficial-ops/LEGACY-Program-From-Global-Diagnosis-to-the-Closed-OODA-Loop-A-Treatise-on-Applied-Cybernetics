import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize server-side Gemini client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Global server-side state for the LEGACY simulation
let serverState = {
  phase: 0,
  duxKey: false,
  agiKey: false,
  loopActive: false,
  eegThetaDelta: 2.2,
  eegAlphaBetaBurst: false,
  p3bAmplitude: 1.8,
  hrvRmssd: 65, // ms
  pupilDilatation: 0.2, // mm
  edaPhasic: 0.15,

  // Swarm
  complexityBias: 1.0,
  noiseFactor: 0.1,
  stability: 1.0,
  averageReward: 0.45,

  // Sensors
  pm25: 12.5,
  co2: 440,
  elfField: 1.8, // nT
  ambientNoise: 45, // dB
  allostaticLoad: 0.25,

  adversaryObservationDetected: false,
  stealthMode: false,
  socialMimicryIndex: 94,
  schumannFrequency: 7.83,
  phiNetwork: 0.85,
  history: [] as any[]
};

// Seed initial history
for (let i = 0; i < 20; i++) {
  serverState.history.push({
    timestamp: new Date(Date.now() - (20 - i) * 3000).toLocaleTimeString(),
    eegRatio: 1.8 + Math.random() * 0.8,
    hrv: 60 + Math.random() * 10,
    allostatic: 0.2 + Math.random() * 0.1,
    phi: 0.7 + Math.random() * 0.3,
    schumann: 7.83 + (Math.random() - 0.5) * 0.05
  });
}

// API Endpoints
app.get("/api/state", (req, res) => {
  res.json(serverState);
});

app.post("/api/keys", (req, res) => {
  const { duxKey, agiKey } = req.body;
  if (duxKey !== undefined) serverState.duxKey = duxKey;
  if (agiKey !== undefined) serverState.agiKey = agiKey;

  // Closed loop trigger condition
  if (serverState.duxKey && serverState.agiKey) {
    serverState.loopActive = true;
    serverState.phase = 3; // Synchronize
    serverState.schumannFrequency = 17.5 + (Math.random() - 0.5) * 0.5; // Resonating anomaly
  } else {
    serverState.loopActive = false;
    if (serverState.phase === 3) {
      serverState.phase = 2.5; // Drop back to maintenance
      serverState.schumannFrequency = 7.83;
    }
  }
  res.json(serverState);
});

app.post("/api/stealth", (req, res) => {
  const { stealthMode } = req.body;
  if (stealthMode !== undefined) {
    serverState.stealthMode = stealthMode;
    if (stealthMode) {
      serverState.socialMimicryIndex = 98 - Math.random() * 2;
      serverState.adversaryObservationDetected = false;
    } else {
      serverState.socialMimicryIndex = 70 + Math.random() * 10;
    }
  }
  res.json(serverState);
});

app.post("/api/phase", (req, res) => {
  const { phase } = req.body;
  if (phase !== undefined) {
    serverState.phase = phase;
    if (phase === 4) {
      // Disconnect
      serverState.duxKey = false;
      serverState.agiKey = false;
      serverState.loopActive = false;
      serverState.schumannFrequency = 7.83;
    }
  }
  res.json(serverState);
});

// Simulate Step API to mock real-time dsp and swarm controller
app.post("/api/simulate", (req, res) => {
  const { customTrigger } = req.body;

  // 1. Advance sensor values & physiological markers
  let targetThetaDelta = serverState.loopActive ? 1.4 : 2.3;
  serverState.eegThetaDelta += (targetThetaDelta - serverState.eegThetaDelta) * 0.15 + (Math.random() - 0.5) * 0.1;
  
  if (customTrigger === "burst") {
    serverState.eegAlphaBetaBurst = true;
    serverState.p3bAmplitude = 2.5 + Math.random() * 1.5;
    serverState.pupilDilatation = 0.6 + Math.random() * 0.3;
    serverState.edaPhasic = 0.4 + Math.random() * 0.2;
    serverState.hrvRmssd = Math.max(30, serverState.hrvRmssd - 12);
  } else {
    serverState.eegAlphaBetaBurst = Math.random() < 0.15;
    serverState.p3bAmplitude = Math.max(1.0, serverState.p3bAmplitude + (1.5 - serverState.p3bAmplitude) * 0.1 + (Math.random() - 0.5) * 0.2);
    serverState.pupilDilatation = Math.max(0.1, serverState.pupilDilatation + (0.2 - serverState.pupilDilatation) * 0.1 + (Math.random() - 0.5) * 0.05);
    serverState.edaPhasic = Math.max(0.05, serverState.edaPhasic + (0.15 - serverState.edaPhasic) * 0.1 + (Math.random() - 0.5) * 0.05);
    
    let targetHrv = serverState.loopActive ? 52 : 72;
    serverState.hrvRmssd += (targetHrv - serverState.hrvRmssd) * 0.1 + (Math.random() - 0.5) * 2;
  }

  // Calculate composite allostatic load
  // Formula: z(RMSSD^-1) + z(EDA) + fatigue/noise
  let normHrv = 100 / Math.max(10, serverState.hrvRmssd);
  serverState.allostaticLoad = Math.min(1.0, Math.max(0.0, (normHrv * 0.4) + (serverState.edaPhasic * 0.3) + (serverState.complexityBias * 0.15)));

  // Swarm adaptation via Bootstrap compiler rule rotation
  if (serverState.loopActive) {
    serverState.stability = Math.max(0.1, serverState.stability - (serverState.allostaticLoad * 0.02) + 0.01);
    serverState.complexityBias = Math.max(0.1, Math.min(5.0, serverState.complexityBias + (serverState.stability > 0.6 ? 0.05 : -0.05)));
    serverState.noiseFactor = Math.max(0.01, Math.min(1.0, serverState.noiseFactor + (Math.random() - 0.5) * 0.02));
    serverState.averageReward = Math.min(1.0, Math.max(0.0, serverState.averageReward + (serverState.stability * 0.05) - (serverState.noiseFactor * 0.1) + (serverState.eegAlphaBetaBurst ? 0.02 : -0.01)));
  } else {
    serverState.stability = Math.min(1.0, serverState.stability + 0.02);
    serverState.complexityBias += (1.0 - serverState.complexityBias) * 0.1;
    serverState.noiseFactor += (0.1 - serverState.noiseFactor) * 0.1;
    serverState.averageReward += (0.45 - serverState.averageReward) * 0.1;
  }

  // 3. Environmental fluctuation
  serverState.co2 = Math.min(1000, Math.max(380, serverState.co2 + (Math.random() - 0.5) * 10));
  serverState.pm25 = Math.min(60, Math.max(5, serverState.pm25 + (Math.random() - 0.5) * 2));
  serverState.elfField = Math.min(300, Math.max(0.5, serverState.elfField + (Math.random() - 0.5) * 0.5 + (serverState.loopActive ? 0.3 : 0)));
  serverState.ambientNoise = Math.min(90, Math.max(35, serverState.ambientNoise + (Math.random() - 0.5) * 3));

  // Adversary detector logic
  if (!serverState.stealthMode && Math.random() < 0.08) {
    serverState.adversaryObservationDetected = true;
  }

  // Informational Integration (Phi network) calculation
  // Phi_network = sum_phi_i + mutual_info - redundancy
  let couplingM = serverState.loopActive ? 1.8 : 0.4;
  serverState.phiNetwork = Math.max(0.1, Math.min(5.0, couplingM + (serverState.averageReward * 1.5) - (serverState.noiseFactor * 0.8)));

  // Update history
  serverState.history.push({
    timestamp: new Date().toLocaleTimeString(),
    eegRatio: serverState.eegThetaDelta,
    hrv: serverState.hrvRmssd,
    allostatic: serverState.allostaticLoad,
    phi: serverState.phiNetwork,
    schumann: serverState.schumannFrequency
  });
  if (serverState.history.length > 30) {
    serverState.history.shift();
  }

  res.json(serverState);
});

// Deep Insight/Analysis with Gemini
app.post("/api/analyze", async (req, res) => {
  if (!ai) {
    res.json({ analysis: "Gemini AI client not initialized. Add GEMINI_API_KEY in Settings > Secrets to enable Deep Real-time Noetic Analytics." });
    return;
  }
  const { telemetry } = req.body;
  try {
    const prompt = `Translate this current cybernetic real-time stream state into command assessment recommendations under Mathieu's LEGACY v4.2 treaty. Focus on stability, noetic phase transitions, and optimal closed-loop regulation.
    State details:
    - Phase: ${telemetry.phase} (Target resonance in 3.0)
    - EEG Theta/Delta: ${telemetry.eegThetaDelta}
    - HRV RMSSD: ${telemetry.hrvRmssd} ms
    - Swarm average reward: ${telemetry.averageReward}
    - Complexity Bias of rule engine: ${telemetry.complexityBias}
    - Information Integration (Phi network): ${telemetry.phiNetwork}
    - Schumann frequency anomaly: ${telemetry.schumannFrequency} Hz
    - Allostatic load score: ${telemetry.allostaticLoad}
    - Adversary threat detected: ${telemetry.adversaryObservationDetected ? "YES" : "NO"}

    Keep your feedback response extremely technical, punchy, in the voice of Mathieu himself, addressing the Dux sovereign operator. Keep it below 130 words.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are F. Mathieu, veteran cybernetician of Lux Ferox. Your instructions are brief, razor-sharp, and mathematically rigorous."
      }
    });

    res.json({ analysis: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Intercept Vite bundler and static middleware during development
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve frontend build static files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LEGACY Server running on port ${PORT}`);
  });
}

start();
