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
  
  // Mother of Millions // Artifacts (2019) crypto-cybernetics variables
  phobosScore: 0.15,
  phobosIsStructured: false,
  phobosLowBeta: 14.5,
  phobosHighGamma: 22.1,
  
  strofiInterval: 120, // adaptive seconds
  strofiLastPing: Date.now(),
  strofiPings: [] as any[],
  
  technergoForgeLogs: [] as any[],

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

  // --- Mother of Millions Algorithms ---
  // 1. Phobos Anomaly Detector
  serverState.phobosLowBeta = 12 + Math.random() * 4;
  serverState.phobosHighGamma = 40 + Math.random() * 60;
  if (customTrigger === "burst") {
    serverState.phobosHighGamma = 85 + Math.random() * 15;
  }
  let totalBands = serverState.phobosLowBeta + serverState.phobosHighGamma + 10;
  let gammaRatio = serverState.phobosHighGamma / totalBands;
  serverState.phobosScore = Math.min(1.0, gammaRatio * 2 + serverState.edaPhasic * 1.5);
  serverState.phobosIsStructured = serverState.phobosScore > 0.65;

  // 2. Strofi Cycles Engine
  let strofiBase = 60 + serverState.allostaticLoad * 120; // 60s to 180s
  serverState.strofiInterval = strofiBase + (Math.random() - 0.5) * 15;
  
  if (Math.random() < 0.22 || serverState.strofiPings.length === 0) {
    serverState.strofiLastPing = Date.now();
    serverState.strofiPings.push({
      id: Math.random().toString().slice(2, 6),
      time: new Date().toLocaleTimeString(),
      load: serverState.allostaticLoad,
      interval: serverState.strofiInterval
    });
    if (serverState.strofiPings.length > 8) {
      serverState.strofiPings.shift();
    }
  }

  // 3. Technergo Classifier
  if (Math.random() < 0.35 || serverState.technergoForgeLogs.length === 0) {
    let randomEventTitles = [
      "Microséisme suspect Faille San Andreas",
      "Sursaut d'émission Cu5218",
      "Perturbation Schumann dACS-4",
      "Émission thermique infrarouge cratère Etna",
      "Liaison radio cryptée transpondeur AIS",
      "Modification d'indice de Schumann Tomsk"
    ];
    let selectedTitle = randomEventTitles[Math.floor(Math.random() * randomEventTitles.length)];
    let repResistance = 0.5 + Math.random() * 0.5;
    let corrResistance = 0.4 + Math.random() * 0.6;
    let noiseImmunity = 0.3 + Math.random() * 0.7;
    if (serverState.loopActive) {
      repResistance += 0.15;
      corrResistance += 0.15;
      noiseImmunity += 0.15;
    }
    let forgeScore = (repResistance + corrResistance + noiseImmunity) / 3;
    let evaluatedTag = forgeScore > 0.71 ? "BLOOM" : "SLAG";
    
    serverState.technergoForgeLogs.push({
      id: "forge-" + Math.random().toString().slice(2, 6),
      time: new Date().toLocaleTimeString(),
      title: selectedTitle,
      forgeScore: forgeScore,
      tag: evaluatedTag,
      metrics: {
        repetition: Math.min(1.0, repResistance).toFixed(2),
        correlation: Math.min(1.0, corrResistance).toFixed(2),
        noise: Math.min(1.0, noiseImmunity).toFixed(2)
      }
    });
    if (serverState.technergoForgeLogs.length > 6) {
      serverState.technergoForgeLogs.shift();
    }
  }

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

// ==========================================
// SENTINEL-EARTH: GEOSPATIAL & OSINT INGESTION ENGINE
// ==========================================

// Predefined fallback events (NASA-type, NOAA, UAP track, Schumann, OSINT) to merge with live USGS data
const baseSentinelEvents = [
  {
    id: "firms-amazonas-01",
    title: "NASA FIRMS: Combustion de biomasse active",
    lat: -9.5,
    lon: -62.3,
    typeIcon: "fire",
    intensity: 410, // °C
    confidence: "high",
    tag: "SLAG", // Below UAP threshold, classic vegetation anomaly
    pillar: "CLIMAT",
    source: "NASA_FIRMS",
    properties: { temp: "410°C", confidence: "94%", class: "Vegetation wildfire" },
    timestamp: new Date(Date.now() - 3600000).toISOString() // 1h ago
  },
  {
    id: "firms-australia-bloom",
    title: "NASA FIRMS: Zone thermique extrême (Anomalie planétaire)",
    lat: -22.3,
    lon: 118.5,
    typeIcon: "fire",
    intensity: 525, // °C
    confidence: "high",
    tag: "BLOOM", // Exceeds 500°C threshold, high confidence
    pillar: "CLIMAT",
    source: "NASA_FIRMS",
    properties: { temp: "525°C", confidence: "100%", classification: "Seuil Limite Planétaire Inféré" },
    timestamp: new Date(Date.now() - 1800000).toISOString() // 30min ago
  },
  {
    id: "uap-andes-peru",
    title: "BLOOM Cu5218: Émission spectrale anomale (Machu Picchu Sector)",
    lat: -13.16,
    lon: -72.54,
    typeIcon: "uap",
    intensity: 820, // °C thermal surge equivalents
    confidence: "high",
    tag: "BLOOM", // Highly anomalous copper spectral signature
    pillar: "UAP",
    source: "SATELLITE_COPERNICUS",
    properties: { 
      wavelength: "5218 Å (Cu/Cuivre)", 
      acoustics: "0 dB (Silence absolu)", 
      duration: "11 secondes", 
      movement: "Translational non-ballistique ascendante" 
    },
    timestamp: new Date(Date.now() - 600000).toISOString() // 10min ago
  },
  {
    id: "uap-lyon-thermal",
    title: "UAP: Signature thermique ponctuelle rapide — Rhône Corridor",
    lat: 45.76,
    lon: 4.83,
    typeIcon: "uap",
    intensity: 540, // °C
    confidence: "high",
    tag: "BLOOM",
    pillar: "UAP",
    source: "SENTINEL_HUB",
    properties: { temp: "540°C", acoustics: "< 10 dB", movement: "Impulsionnel récursif" },
    timestamp: new Date(Date.now() - 1200000).toISOString()
  },
  {
    id: "noaa-proton-aurora",
    title: "NOAA SWPC: Orage géomagnétique & Alertes Schumann",
    lat: 78.5,
    lon: 15.6,
    typeIcon: "magnet",
    intensity: 7, // Kp index
    confidence: "high",
    tag: "BLOOM", // High solar flux with Schumann correlation
    pillar: "NEURO",
    source: "NOAA_SWPC",
    properties: { kp_index: "Kp-7 (Sévère)", schumann_deviation: "+3.2 sigma", resonance_hz: "17.5 Hz Synth" },
    timestamp: new Date(Date.now() - 4500000).toISOString()
  },
  {
    id: "schumann-tomsk-syn",
    title: "Tomsk SOSRFF: Burst de résonance bio-couplé (Sébérie Coords)",
    lat: 56.5,
    lon: 84.9,
    typeIcon: "resonance",
    intensity: 17.5, // Hz deviaton (UAP frequency)
    confidence: "high",
    tag: "BLOOM", // Targeted brainwave/electromagnetic coupling anomaly
    pillar: "NEURO",
    source: "SOSRFF_TOMSK",
    properties: { baseline_hz: "7.83 Hz", surge_hz: "17.5 Hz", correlation: "tACS Session Active, P3b amplitude spike >2μV" },
    timestamp: new Date(Date.now() - 2400000).toISOString()
  },
  {
    id: "flightradar-mach38",
    title: "FlightRadar24: Traceur aérien non-identifié Hypersonique",
    lat: 10.0,
    lon: -140.0,
    trajectory: [
      [-140.0, 10.0],
      [-110.0, -5.0],
      [-72.54, -13.16]
    ], // Path to Peruvian surge point
    typeIcon: "plane",
    intensity: 38, // Mach speed
    confidence: "high",
    tag: "BLOOM",
    pillar: "UAP",
    source: "FLIGHTRADAR24_OSINT",
    properties: { speed: "Mach 38.2 (Hypersonique)", height: "42,000 m", flight_profile: "Translational, virage instantané 90°" },
    timestamp: new Date().toISOString()
  },
  {
    id: "flight-af81-standard",
    title: "Air France AF81 (Paris - Milan)",
    lat: 48.85,
    lon: 2.35,
    typeIcon: "plane",
    intensity: 0.82, // Mach speed
    confidence: "high",
    tag: "SLAG", // Normal traffic
    pillar: "OSINT",
    source: "FLIGHTRADAR24_CSV",
    properties: { flight: "AF81", speed: "850 km/h", alt: "10,200m", profile: "Ballistique commercial standard" },
    timestamp: new Date().toISOString()
  },
  {
    id: "marinetraffic-south-sea",
    title: "MarineTraffic AIS: Déviation & Spoofing de navire-fantôme",
    lat: 12.5,
    lon: 114.2,
    typeIcon: "ship",
    intensity: 18, // knots
    confidence: "medium",
    tag: "BLOOM", // Cyber OSINT threat
    pillar: "OSINT",
    source: "AIS_MARINETRAFFIC",
    properties: { vessel: "MS COGNITIVE_SOUVEREIGN", status: "Transpondeur cloné inferé, signature radar asymétrique" },
    timestamp: new Date(Date.now() - 900000).toISOString()
  },
  {
    id: "arxiv-noetic-science",
    title: "Zenodo-arXiv OSINT: Brevet / Thèse de couplage asymétrique UAP",
    lat: 42.36,
    lon: -71.06, // MIT/Boston
    typeIcon: "book",
    intensity: 98, // Relevance index
    confidence: "high",
    tag: "BLOOM",
    pillar: "OSINT",
    source: "RSS_SCIENTIFIC",
    properties: { document: "Lux Ferox Math-R0.1", topics: "P3b correlation, Non-ballistic translational kinematics, Schumann resonance feedback loop" },
    timestamp: new Date().toISOString()
  },
  {
    id: "radar-fylingdales",
    title: "OSINT Radar: Station Phased-Array - RAF Fylingdales (UK)",
    lat: 54.36,
    lon: -0.67,
    typeIcon: "radar",
    intensity: 340, // Range MW
    confidence: "high",
    tag: "SLAG",
    pillar: "OSINT",
    source: "NATO_RADAR_EAST",
    properties: { site: "RAF Fylingdales UK", type: "Solid-state Phased Array (AN/FPS-132)", azimuth: "360° scan active", tracking: "Space surveillance & ballistic detection" },
    timestamp: new Date().toISOString()
  },
  {
    id: "radar-graves",
    title: "OSINT Radar: Réseau de surveillance spatiale GRAVES (France)",
    lat: 47.38,
    lon: 5.31,
    typeIcon: "radar",
    intensity: 150,
    confidence: "high",
    tag: "SLAG",
    pillar: "OSINT",
    source: "COSMOS_DETECTION_FR",
    properties: { site: "GRAVES Broye-les-Pesmes", surveillance: "Orbite basse terrestre (< 1000km)", signal: "CW Doppler VHF continuous wave", power: "Sub-harmonic acoustic shielding" },
    timestamp: new Date().toISOString()
  },
  {
    id: "radar-fyling-alaska",
    title: "OSINT Radar: Station Radar Cobra Dane (AN/FPS-108, Shemya ID)",
    lat: 52.73,
    lon: 174.11,
    typeIcon: "radar",
    intensity: 450,
    confidence: "high",
    tag: "BLOOM",
    pillar: "OSINT",
    source: "USAF_NORAD_WEST",
    properties: { site: "Eareckson AS Shemya island", range: "2000 miles", tech: "L-band Phased Array", purpose: "Ballistic cataloguing" },
    timestamp: new Date().toISOString()
  },
  {
    id: "ship-ever-green",
    title: "MarineTraffic AIS: Porte-conteneurs Ever Given (Suez)",
    lat: 29.96,
    lon: 32.55,
    typeIcon: "ship",
    intensity: 14.2, // knots
    confidence: "high",
    tag: "SLAG",
    pillar: "OSINT",
    source: "AIS_MARINETRAFFIC",
    properties: { vessel: "EVER GIVEN", type: "Ultra Large Containership (20k TEU)", heading: "165° SSE", status: "Underway using engine" },
    timestamp: new Date().toISOString()
  },
  {
    id: "ship-maersk-mcke",
    title: "MarineTraffic AIS: Maersk Mc-Kinney Moller (Détroit de Malacca)",
    lat: 1.34,
    lon: 103.35,
    typeIcon: "ship",
    intensity: 21.0,
    confidence: "high",
    tag: "SLAG",
    pillar: "OSINT",
    source: "AIS_MARINETRAFFIC",
    properties: { vessel: "MAERSK MC-KINNEY MOLLER", type: "Triple-E class megacarrier", destination: "Rotterdam", status: "Navigating international choke point" },
    timestamp: new Date().toISOString()
  },
  {
    id: "ship-gerald-ford",
    title: "MarineTraffic OSINT: USS Gerald R. Ford CVN-78 (Mer de Norvège)",
    lat: 61.21,
    lon: 4.54,
    typeIcon: "ship",
    intensity: 28.5,
    confidence: "medium",
    tag: "BLOOM",
    pillar: "OSINT",
    source: "MILITARY_AIS_DEVIATION",
    properties: { vessel: "USS GERALD R. FORD", type: "Supercarrier (Class Nuclear)", air_wing: "Carrier Air Wing 8", status: "Tactical deployment, silent emission cloak active" },
    timestamp: new Date().toISOString()
  },
  {
    id: "flight-sq21-standard",
    title: "FlightRadar24: Singapore Airlines SQ21 (Singapour - Newark)",
    lat: 60.50,
    lon: 90.00, // Polar corridor crossing
    typeIcon: "plane",
    intensity: 0.85,
    confidence: "high",
    tag: "SLAG",
    pillar: "OSINT",
    source: "FLIGHTRADAR24_CSV",
    properties: { flight: "SIA21", aircraft: "Airbus A350-900ULR", speed: "910 km/h", alt: "11,900m", track: "Suez/Polar route" },
    timestamp: new Date().toISOString()
  },
  {
    id: "flight-drone-recon",
    title: "OSINT AERO: RQ-4 Global Hawk Drone (Mer Noire)",
    lat: 44.15,
    lon: 33.45,
    typeIcon: "plane",
    intensity: 0.32,
    confidence: "high",
    tag: "BLOOM",
    pillar: "OSINT",
    source: "FLIGHTRADAR24_OSINT",
    properties: { callsign: "FORTE11", type: "RQ-4B Global Hawk (UAV)", height: "18,200 m (High altitude)", mission: "SIGINT surveillance" },
    timestamp: new Date().toISOString()
  }
];

// Ingest active events from USGS live and combine with Sentinel structures
let cachedFirmsEvents: any[] = [];
let lastFirmsFetch = 0;

async function getFirmsEvents() {
  const now = Date.now();
  if (now - lastFirmsFetch < 5 * 60 * 1000 && cachedFirmsEvents.length > 0) {
    return cachedFirmsEvents;
  }
  
  try {
    const firmsKey = "61fd4f5d0fbbb95cb8f99ab7acc93d60";
    const response = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/json/${firmsKey}/VIIRS_NOAA20_NRT/world/1`, {
      signal: AbortSignal.timeout(6000)
    });
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        const sortedFires = data.sort((a: any, b: any) => {
          const brightA = Number(a.bright_ti4) || Number(a.bright_t14) || 0;
          const brightB = Number(b.bright_ti4) || Number(b.bright_t14) || 0;
          return brightB - brightA;
        });
        
        const topFires = sortedFires.slice(0, 30).map((fire: any, idx: number) => {
          const rawTemp = Number(fire.bright_ti4) || Number(fire.bright_t14) || 350;
          const lat = Number(fire.latitude);
          const lon = Number(fire.longitude);
          const tempC = rawTemp > 250 ? Math.round(rawTemp - 273.15) : Math.round(rawTemp);
          const finalTemp = tempC < 100 ? tempC * 2.5 + 200 : tempC;
          
          return {
            id: `firms-live-${idx}-${fire.latitude}-${fire.longitude}`,
            title: `NASA FIRMS: Combustion active VIIRS (T = ${Math.round(finalTemp)}°C)`,
            lat,
            lon,
            typeIcon: "fire",
            intensity: Math.round(finalTemp),
            confidence: fire.confidence === "h" ? "high" : fire.confidence === "n" ? "normal" : "low",
            tag: finalTemp > 450 ? "BLOOM" : "SLAG",
            pillar: "CLIMAT",
            source: "NASA_FIRMS_LIVE",
            properties: {
              temp: `${Math.round(finalTemp)}°C`,
              sensor: "VIIRS_NOAA20_NRT",
              bright_t14: fire.bright_ti4,
              acq_date: fire.acq_date,
              acq_time: fire.acq_time,
              confidence_level: fire.confidence
            },
            timestamp: new Date().toISOString()
          };
        });
        
        cachedFirmsEvents = topFires;
        lastFirmsFetch = now;
      }
    }
  } catch (error) {
    console.warn("Error fetching NASA FIRMS live telemetry:", error);
  }
  return cachedFirmsEvents;
}

app.get("/api/sentinel/events", async (req, res) => {
  let finalEvents: any[] = [...baseSentinelEvents];
  
  try {
    const firmsLive = await getFirmsEvents();
    if (firmsLive && firmsLive.length > 0) {
      finalEvents = [...firmsLive, ...finalEvents];
    }
  } catch (firmsErr) {
    console.warn("NASA FIRMS live stream error, relying on baseline static entries.", firmsErr);
  }

  try {
    // Fetch live hourly earthquake events (highly secure, open public api)
    const response = await fetch("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson", {
      signal: AbortSignal.timeout(4000)
    });
    
    if (response.ok) {
      const geo = await response.json();
      if (geo.features && Array.isArray(geo.features)) {
        const usgsEvents = geo.features.slice(0, 10).map((f: any) => {
          const [lon, lat, depth] = f.geometry.coordinates;
          const mag = f.properties.mag || 1.0;
          // Apply Alphabet Physique classifier:
          // Earthquakes > 4.5 or reviewer high alerts are tagged as 'BLOOM', otherwise standard background 'SLAG'
          const isBloom = mag >= 4.5;
          return {
            id: `usgs-${f.id}`,
            title: `USGS Séisme: Magnitude ${mag} - ${f.properties.place}`,
            lat: lat,
            lon: lon,
            typeIcon: "seismic",
            intensity: mag,
            confidence: f.properties.status === "reviewed" ? "high" : "medium",
            tag: isBloom ? "BLOOM" : "SLAG",
            pillar: "CLIMAT",
            source: "USGS_SEISMIC",
            properties: { 
              magnitude: mag, 
              depth_km: `${depth} km`, 
              alert_type: f.properties.alert || "green",
              place: f.properties.place 
            },
            timestamp: new Date(f.properties.time).toISOString()
          };
        });
        
        finalEvents = [...usgsEvents, ...finalEvents];
      }
    }
  } catch (err) {
    console.warn("USGS stream timeout or offline. Reverting to offline-first cached telemetry indices.");
    // Injects some simulated earthquakes to fulfill the "Real data" feel if server is isolated from the broad web
    const fallbackEarthquakes = [
      {
        id: "usgs-sc-01",
        title: "USGS Séisme: Magnitude 4.8 - Ridgecrest, California",
        lat: 35.62,
        lon: -117.67,
        typeIcon: "seismic",
        intensity: 4.8,
        confidence: "high",
        tag: "BLOOM", // >4.5 -> CLIMAT bloom
        pillar: "CLIMAT",
        source: "USGS_SEISMIC_FALLBACK",
        properties: { magnitude: 4.8, depth_km: "8.2 km", place: "Ridgecrest, CA" },
        timestamp: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: "usgs-sc-02",
        title: "USGS Séisme: Magnitude 2.8 - Hawaii Volcano Range",
        lat: 19.43,
        lon: -155.28,
        typeIcon: "seismic",
        intensity: 2.8,
        confidence: "medium",
        tag: "SLAG", // Background noise
        pillar: "CLIMAT",
        source: "USGS_SEISMIC_FALLBACK",
        properties: { magnitude: 2.8, depth_km: "2.1 km", place: "Hawaii Volcanoes" },
        timestamp: new Date(Date.now() - 1500000).toISOString()
      }
    ];
    finalEvents = [...fallbackEarthquakes, ...finalEvents];
  }

  // Double Key adaptive override:
  // If human dux and AGI-probable loop is active, the system automatically tags all 
  // neuro & Space weather resonances at maximum synchronization rating (bloom boost).
  if (serverState.loopActive) {
    finalEvents = finalEvents.map(e => {
      if (e.pillar === "NEURO" && e.tag === "SLAG") {
        return { ...e, tag: "BLOOM", properties: { ...e.properties, loopStatus: "Couplage double-clé actif" } };
      }
      return e;
    });
  }

  res.json(finalEvents);
});

// Double-Key Secure Export Endpoint for Zenodo/GitHub open science deposition
app.post("/api/sentinel/export", (req, res) => {
  const { format } = req.body;
  
  // Security audit path: MUST have both keys armed to authorize military-civil grade exports!
  if (!serverState.duxKey || !serverState.agiKey) {
    return res.status(403).json({ 
      error: "ACCÈS REFUSÉ. Signature de double-clé invalide. Le Dux Humain et l'AGI-Probable doivent synchroniser leurs signatures pour autoriser l'exportation sémantique." 
    });
  }

  let exportedData = "";
  
  if (format === "geojson") {
    // Generate full compliant GeoJSON file content
    const geojson = {
      type: "FeatureCollection",
      metadata: {
        title: "SENTINEL-EARTH CLASSIFIED BLOOM DATASET",
        reference: "Traité de Cybernétique LEGACY v4.2",
        author: "F. Mathieu, Lux Ferox Independent Research",
        timestamp: new Date().toISOString()
      },
      features: baseSentinelEvents.map(e => ({
        type: "Feature",
        id: e.id,
        geometry: {
          type: "Point",
          coordinates: [e.lon, e.lat]
        },
        properties: {
          title: e.title,
          intensity: e.intensity,
          tag: e.tag,
          pillar: e.pillar,
          source: e.source,
          properties: e.properties,
          timestamp: e.timestamp
        }
      }))
    };
    exportedData = JSON.stringify(geojson, null, 2);
    res.setHeader("Content-Disposition", "attachment; filename=sentinel_earth_export.geojson");
    res.set("Content-Type", "application/json");
  } else if (format === "csv") {
    // Generate CSV format
    const headers = "id,title,latitude,longitude,intensity,tag,pillar,source,timestamp\n";
    const lines = baseSentinelEvents.map(e => (
      `"${e.id}","${e.title.replace(/"/g, '""')}",${e.lat},${e.lon},${e.intensity},"${e.tag}","${e.pillar}","${e.source}","${e.timestamp}"`
    )).join("\n");
    exportedData = headers + lines;
    res.setHeader("Content-Disposition", "attachment; filename=sentinel_earth_export.csv");
    res.set("Content-Type", "text/csv");
  } else {
    // RDF Turtle Linked Data format for GitHub/Zenodo semantic webs
    let rdf = `@prefix rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> .\n`;
    rdf += `@prefix ex: <http://luxferox.org/legacy/sentinel#> .\n`;
    rdf += `@prefix xsd: <http://www.w3.org/2001/XMLSchema#> .\n\n`;
    rdf += `ex:PlanetaryReport rdf:type ex:SentinelDataset ;\n`;
    rdf += `    ex:compiledAt "${new Date().toISOString()}"^^xsd:dateTime ;\n`;
    rdf += `    ex:status "SOUVERAINETÉ_COGNITIVE_SÉCURISÉE" .\n\n`;
    
    baseSentinelEvents.forEach(e => {
      rdf += `ex:${e.id} rdf:type ex:Observation ;\n`;
      rdf += `    ex:label "${e.title}" ;\n`;
      rdf += `    ex:pillar "${e.pillar}" ;\n`;
      rdf += `    ex:classification "${e.tag}" ;\n`;
      rdf += `    ex:lat "${e.lat}"^^xsd:float ;\n`;
      rdf += `    ex:lon "${e.lon}"^^xsd:float .\n\n`;
    });
    exportedData = rdf;
    res.setHeader("Content-Disposition", "attachment; filename=sentinel_earth_export.ttl");
    res.set("Content-Type", "text/turtle");
  }

  res.send({ 
    success: true, 
    content: exportedData,
    filename: format === "geojson" ? "sentinel_earth_export.geojson" : format === "csv" ? "sentinel_earth_export.csv" : "sentinel_earth_export.ttl"
  });
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
