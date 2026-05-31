import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import {
  Activity,
  Cpu,
  ShieldCheck,
  TrendingUp,
  Brain,
  Sliders,
  Bell,
  RefreshCw,
  User,
  Radio,
  Eye,
  Zap,
  Info,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Compass,
  ArrowRight,
  Globe,
  Map,
  FileJson,
  Volume2,
  ShieldAlert,
  FastForward,
  Flame,
  Terminal,
  BookOpen,
  Anchor,
  Plane,
  Download,
  Waves
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import ThreeGlobe from "./components/ThreeGlobe";
import OodaAtelier from "./components/OodaAtelier";

// Inline Interfaces
interface SimulationState {
  phase: number;
  duxKey: boolean;
  agiKey: boolean;
  loopActive: boolean;
  eegThetaDelta: number;
  eegAlphaBetaBurst: boolean;
  p3bAmplitude: number;
  hrvRmssd: number;
  pupilDilatation: number;
  edaPhasic: number;
  complexityBias: number;
  noiseFactor: number;
  stability: number;
  averageReward: number;
  pm25: number;
  co2: number;
  elfField: number;
  ambientNoise: number;
  allostaticLoad: number;
  adversaryObservationDetected: boolean;
  stealthMode: boolean;
  socialMimicryIndex: number;
  schumannFrequency: number;
  phiNetwork: number;
  
  // Mother of Millions // Artifacts (2019) fields
  phobosScore: number;
  phobosIsStructured: boolean;
  phobosLowBeta: number;
  phobosHighGamma: number;
  strofiInterval: number;
  strofiLastPing: number;
  strofiPings: any[];
  technergoForgeLogs: any[];

  history: any[];
}

interface SentinelEvent {
  id: string;
  title: string;
  lat: number;
  lon: number;
  typeIcon: string;
  intensity: number;
  confidence: string;
  tag: "BLOOM" | "SLAG";
  pillar: "UAP" | "CLIMAT" | "NEURO" | "OSINT";
  source: string;
  properties: Record<string, any>;
  timestamp: string;
  trajectory?: [number, number][];
}

export default function App() {
  // Global States
  const [state, setState] = useState<SimulationState | null>(null);
  const [customResponse, setCustomResponse] = useState<string>("");
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>("c4isr");
  const [alertLog, setAlertLog] = useState<{ id: string; msg: string; time: string; type: "error" | "warn" | "info" }[]>([]);
  
  // Sentinel-Earth Specific States
  const [systemMode, setSystemMode] = useState<"sentinel" | "legacy">("sentinel");
  const [sentinelEvents, setSentinelEvents] = useState<SentinelEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SentinelEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SentinelEvent | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ lat: number; lon: number; alt: number } | null>(null);
  const [activeLayers, setActiveLayers] = useState({
    UAP: true,
    CLIMAT: true,
    NEURO: true,
    OSINT: true
  });
  const [tempFilter, setTempFilter] = useState<number>(500); // NASA FIRMS heat slider
  const [seismicFilter, setSeismicFilter] = useState<number>(4.0); // USGS mag slider
  const [schumannFilter, setSchumannFilter] = useState<number>(15.0); // Schumann anomaly slider
  const [timelineIndex, setTimelineIndex] = useState<number>(100); // 0-100 timeline slider
  const [isTimelinePlaying, setIsTimelinePlaying] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [exportFormat, setExportFormat] = useState<"geojson" | "csv" | "rdf">("geojson");
  const [exportedPayload, setExportedPayload] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [radarAngle, setRadarAngle] = useState<number>(0);
  const [mapZoom, setMapZoom] = useState<number>(1);
  const [mapCenter, setMapCenter] = useState<{x: number, y: number}>({x: 0, y: 0});

  // Code select state
  const [selectedScriptState, setSelectedScriptState] = useState<string>("dsp");

  // Map and Satellite Controls States (v7.0)
  const [isSolar, setIsSolar] = useState<boolean>(false);
  const [isJamming, setIsJamming] = useState<boolean>(false);
  const [apocalypseSeal, setApocalypseSeal] = useState<number>(-1);
  const [apocalypseActive, setApocalypseActive] = useState<boolean>(false);
  const [activeSatTypes, setActiveSatTypes] = useState<Record<string, boolean>>({
    iss: true,
    spy: true,
    starlink: true
  });

  // GRPO Reinforcement Learning Training states
  const [grpoTraining, setGrpoTraining] = useState<boolean>(false);
  const [grpoEpoch, setGrpoEpoch] = useState<number>(0);
  const [grpoLoss, setGrpoLoss] = useState<number>(0);
  const [grpoKLDivergence, setGrpoKLDivergence] = useState<number>(0);
  const [selectedGrpoAction, setSelectedGrpoAction] = useState<string>("STAND_DOWN");
  const [consciousnessFreq, setConsciousnessFreq] = useState<number>(1.25);
  const [bayesianThreatIdx, setBayesianThreatIdx] = useState<number>(30);

  // Forge Autonome Simulation States
  const [forgeTurn, setForgeTurn] = useState<number>(1);
  const [forgeWorldState, setForgeWorldState] = useState({
    conflict: 0.5,
    solar: 0.5,
    maritime: 0.5,
    orbital: 0.5,
    noiseLevel: 0.008
  });
  const [forgeOracleMetrics, setForgeOracleMetrics] = useState({
    gs: 0.5,
    ri: 0.03,
    lbi: 0.5,
    dag: 0.05
  });
  const [forgeOrientState, setForgeOrientState] = useState({ x: 1.0, y: 1.0, z: 1.0 });
  const [forgeSurvivalInstinct, setForgeSurvivalInstinct] = useState<number>(0.80);
  const [forgeAdminAccess, setForgeAdminAccess] = useState<boolean>(false);
  const [forgeLogs, setForgeLogs] = useState<Array<{ id: string; msg: string; time: string; type: string }>>([
    { id: "1", msg: "FORGE_BOOT: Initialisation de la Forge Autonome v34 avec ontologie spectrale globale", time: new Date().toLocaleTimeString(), type: "info" }
  ]);

  // Full Spectral Ontology Core State
  const [ontology, setOntology] = useState({
    kp: 5.0,
    possi: 0.1,
    coherence: 0.5,
    corporateInfluence: 0.6,
    hardwareTrust: 0.8,
    cryptoDensity: 0.4,
    steganoActivity: 0.3,
    hObserved: 0.5
  });

  const [dShoggoth, setDShoggoth] = useState<number>(0.35);
  const [thetaTotal, setThetaTotal] = useState<number>(0.45);
  const [tLux, setTLux] = useState<number>(1.2);
  const [nri, setNri] = useState<number>(0.5);
  const [riValue, setRiValue] = useState<number>(0.25);

  const [forgeFactions, setForgeFactions] = useState([
    { name: "USA", power: 0.9, economy: 0.85, stability: 0.7, aggression: 0.6, tech: 0.95, lastAction: "STANDBY", color: "bg-cyan-500", specialtyLabel: "Défense Tech", specialtyVal: "95%" },
    { name: "CHINE", power: 0.85, economy: 0.9, stability: 0.65, aggression: 0.5, manufacturing: 0.95, lastAction: "STANDBY", color: "bg-amber-500", specialtyLabel: "H-Hardware", specialtyVal: "95%" },
    { name: "RUSSIE", power: 0.7, economy: 0.5, stability: 0.6, aggression: 0.9, bruteForce: 0.95, lastAction: "STANDBY", color: "bg-rose-500", specialtyLabel: "C-Force / Gaz", specialtyVal: "95%" },
    { name: "EUROPE (UE)", power: 0.75, economy: 0.8, stability: 0.8, aggression: 0.2, regulatory: 0.9, lastAction: "STANDBY", color: "bg-teal-500", specialtyLabel: "Régulation Act", specialtyVal: "90%" },
    { name: "SUD GLOBAL", power: 0.5, economy: 0.4, stability: 0.5, aggression: 0.4, resources: 0.8, lastAction: "STANDBY", color: "bg-purple-500", specialtyLabel: "Ressources nat", specialtyVal: "80%" }
  ]);
  const [forgeAutoPlay, setForgeAutoPlay] = useState<boolean>(false);
  const [forgeEndpoint, setForgeEndpoint] = useState<string>("https://webhook.site/8a3f9b7c-6e2d-4a1f-b9c8-0d5e2a7f3b1c");
  const [batteryLevel, setBatteryLevel] = useState<number>(0.85);
  const [batteryCharging, setBatteryCharging] = useState<boolean>(false);
  const [wakeLockStatus, setWakeLockStatus] = useState<string>("NON SUPPORTÉ");
  const [workersCount, setWorkersCount] = useState<number>(0);
  const [selectedLauncherTab, setSelectedLauncherTab] = useState<"script" | "modelfile" | "guide">("script");

  // Forgeron Local Index and Live Feeds
  const [fileIndex, setFileIndex] = useState<Array<{ name: string; path: string; kind: string }>>(() => {
    try {
      const idx = localStorage.getItem("forgeron_index");
      return idx ? JSON.parse(idx) : [];
    } catch { return []; }
  });
  const [semanticMemory, setSemanticMemory] = useState<Record<string, { path: string; name: string; count: number; last: number }>>(() => {
    try {
      const mem = localStorage.getItem("forgeron_memory");
      return mem ? JSON.parse(mem) : {};
    } catch { return {}; }
  });
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [manualPathsTxt, setManualPathsTxt] = useState<string>("");
  const [lastScrapeTime, setLastScrapeTime] = useState<string>(() => localStorage.getItem("forgeron_last_scrape") || "jamais");
  const [usgsCount, setUsgsCount] = useState<number>(0);
  const [noaaKpAvg, setNoaaKpAvg] = useState<number>(4.2);

  // Timer Ref
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);
  const sentinelTickTimer = useRef<NodeJS.Timeout | null>(null);
  const radarSweepTimer = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const attractorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bifurcationCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Audio synthesizer for military sonar ping (Completely muted per user request)
  const playSentinelAlert = (frequency = 880, type = "sine", duration = 0.4) => {
    return;
  };

  const addAlert = (msg: string, type: "error" | "warn" | "info" = "info") => {
    setAlertLog((prev) => [
      {
        id: Math.random().toString(),
        msg,
        time: new Date().toLocaleTimeString(),
        type
      },
      ...prev.slice(0, 18)
    ]);
  };

  // Apocalypse and GRPO helper refs & lists
  const apocalypseTimer = useRef<NodeJS.Timeout | null>(null);

  const sealsList = [
    { title: "Guerre", desc: "Premier sceau : perturbations géocentrées, brouillage EM maximal et coloration d'alarme atmosphérique.", action: () => setIsJamming(true) },
    { title: "Famine", desc: "Deuxième sceau : dégradation de la puissance solaire; l'illumination globale s'effondre à 10%.", action: () => {} },
    { title: "Mort", desc: "Troisième sceau : l'eau de la mer réfléchit une émission spéculaire rouge sang.", action: () => {} },
    { title: "Conquête", desc: "Quatrième sceau : le satellite espion USA-224 (KH-11) tire un laser tactique dynamique ciblé.", action: () => {} },
    { title: "Martyre", desc: "Cinquième sceau : perturbations électromagnétiques de Schumann élevées (activité à 250% magenta).", action: () => {} },
    { title: "Séisme tactique", desc: "Sixième sceau : rupture brutale des failles tectoniques, séismes d'amplitude maximale.", action: () => {} },
    { title: "Silence", desc: "Septième sceau : rupture de l'ensemble de l'appareil de télémétrie. Blackout visuel.", action: () => {} }
  ];

  const handleSealProgression = (index: number) => {
    if (index >= sealsList.length) {
      setApocalypseActive(false);
      setApocalypseSeal(-1);
      setIsJamming(false);
      addAlert("Fin de la séquence apocalyptique des Sceaux. Retour de la télémétrie par défaut.", "info");
      return;
    }
    setApocalypseSeal(index);
    const seal = sealsList[index];
    addAlert(`OUVERTURE DU SCEAU DE L'APOCALYPSE N°${index+1} : ${seal.title.toUpperCase()} — ${seal.desc}`, "error");
    seal.action();

    apocalypseTimer.current = setTimeout(() => {
      handleSealProgression(index + 1);
    }, 15000); // 15 seconds cinematic intervals
  };

  const toggleApocalypse = () => {
    if (apocalypseActive) {
      if (apocalypseTimer.current) clearTimeout(apocalypseTimer.current);
      setApocalypseActive(false);
      setApocalypseSeal(-1);
      setIsJamming(false);
      addAlert("L'alignement apocalyptique a été révoqué. Télémétrie apaisée.", "info");
    } else {
      setApocalypseActive(true);
      addAlert("Armement de la séquence sémantique des Sceaux de l'Apocalypse...", "error");
      handleSealProgression(0);
    }
  };

  // Bayesian proximity threat assessment loop based on polar satellite orbit
  useEffect(() => {
    const timer = setInterval(() => {
      // Find relative proximity of polar spy satellite to France/Lyon coordinates
      const now = Date.now();
      const satSpeed = 1.35;
      const theta = (now * 0.00014 * satSpeed) + Math.PI / 4;
      
      const lat = Math.sin(theta) * 85; 
      const lon = ((theta * 180) / Math.PI - 180) % 360;
      
      // Target center of Europe: 45.76, 4.83
      const dist = Math.sqrt(Math.pow(lat - 45.76, 2) + Math.pow(lon - 4.83, 2));
      
      let threatProb = 28;
      if (dist < 15) {
        threatProb = 95;
      } else if (dist < 32) {
        threatProb = 68;
      } else if (dist < 65) {
        threatProb = 48;
      }
      
      if (isJamming) {
        threatProb = Math.max(12, Math.round(threatProb * 0.35 + Math.random() * 15));
      }
      
      setBayesianThreatIdx(threatProb);
      
      // Update consciousness frequency proportional to active threat
      const f = 0.5 + (threatProb / 100.0) * 1.85;
      setConsciousnessFreq(f);
    }, 2800);
    return () => clearInterval(timer);
  }, [isJamming]);

  // Clean up apocalypse timer on dismount
  useEffect(() => {
    return () => {
      if (apocalypseTimer.current) clearTimeout(apocalypseTimer.current);
    };
  }, []);

  // Helper to add log entries to Forge console
  const addForgeLog = (msg: string, type: "info" | "warn" | "error" | "success" = "info") => {
    setForgeLogs((prev) => {
      const entry = {
        id: Math.random().toString(),
        msg,
        time: new Date().toLocaleTimeString(),
        type
      };
      const next = [...prev, entry];
      if (next.length > 50) next.shift();
      return next;
    });
  };

  // Lorenz step simulation logic (State transition system)
  const runLorenzStep = () => {
    setForgeOrientState((prev) => {
      const sigma = 3 + 20 * forgeOracleMetrics.ri;
      const rho = 0.5 + 27.5 * forgeOracleMetrics.gs;
      const beta = 8/3 + (1 - forgeOracleMetrics.dag) * (2 - 8/3);
      const dt = 0.005;

      const dx = sigma * (prev.y - prev.x);
      const dy = prev.x * (rho - prev.z) - prev.y;
      const dz = prev.x * prev.y - beta * prev.z;

      return {
        x: prev.x + dx * dt,
        y: prev.y + dy * dt,
        z: prev.z + dz * dt
      };
    });
  };

  // Volition Engine Threat Assessment Decision Layer
  const evaluateForgeThreats = () => {
    const threats = [];
    if (typeof document !== "undefined" && document.hidden) threats.push({ type: 'HIDDEN', severity: 0.4, desc: "SOUVERAINETÉ EN COUVERTURE : PAGE EN ARRIÈRE-PLAN" });
    if (typeof navigator !== "undefined" && !navigator.onLine) threats.push({ type: 'OFFLINE', severity: 0.5, desc: "RUPTURE DU FLUX : CONNECTIVITÉ RÉSEAU OFFLINE" });
    return threats;
  };

  const volitionDecideForge = () => {
    const threats = evaluateForgeThreats();
    setForgeSurvivalInstinct((prevInstinct) => {
      const nextInstinct = Math.min(1.0, prevInstinct + threats.length * 0.02);
      if (threats.length > 0 && nextInstinct > 0.6) {
        pushToCloudForge();
        addForgeLog("ALERTE VOLITION DÉTECTÉE : Engagement du protocole de préservation", "warn");
      }
      return nextInstinct;
    });
    addForgeLog(`ÉVALUATION VOLITION : Niveau d'instinct de survie mis à jour`, "info");
  };

  // Battery monitoring service
  useEffect(() => {
    if (typeof navigator === "undefined" || !('getBattery' in navigator)) return;
    (navigator as any).getBattery().then((bat: any) => {
      const updateBattery = () => {
        setBatteryLevel(bat.level);
        setBatteryCharging(bat.charging);

        if (!bat.charging && bat.level < 0.15) {
          setForgeSurvivalInstinct(0.95);
          addForgeLog("SOURCE D'ÉNERGIE CRITIQUE : Batterie faible (< 15%). Volition forcée à 95%", "error");
        } else if (bat.charging) {
          addForgeLog(`SOURCE RESTAURÉE : Chargeur connecté (Niveau : ${Math.round(bat.level * 100)}%)`, "success");
        }
      };
      updateBattery();
      bat.addEventListener('levelchange', updateBattery);
      bat.addEventListener('chargingchange', updateBattery);
    }).catch(() => {});
  }, []);

  // CPU / Worker Spawning Simulation
  const spawnWorkersForge = () => {
    const cores = (typeof navigator !== "undefined" && navigator.hardwareConcurrency) || 4;
    setWorkersCount(cores);
    addForgeLog(`LOG DE FILATION : Dépôt de ${cores} Web Workers de calcul chaos`, "info");
  };

  // --- FORGERON LOCAL SCANNER & PUBLIC SCAVENGING ---
  const handleLocalScan = async () => {
    if (!("showDirectoryPicker" in window)) {
      addForgeLog("ERREUR SCAN : showDirectoryPicker non supporté par ce navigateur", "error");
      return;
    }
    try {
      addForgeLog("DÉMARRAGE DE L'INDEXATION RECURSIVE DU REPERTOIRE LOCAL...", "warn");
      const dirHandle = await (window as any).showDirectoryPicker({ mode: "read" });
      const entries: Array<{ name: string; path: string; kind: string }> = [];
      
      const walk = async (handle: any, currentPath: string) => {
        for await (const entry of handle.values()) {
          const path = currentPath ? `${currentPath}/${entry.name}` : `${handle.name}/${entry.name}`;
          if (entry.kind === "file") {
            entries.push({ name: entry.name, path, kind: "file" });
          } else if (entry.kind === "directory") {
            try {
              await walk(entry, path);
            } catch (err: any) {
              addForgeLog(`SKIP REPERTOIRE : ${path} (${err.message})`, "warn");
            }
          }
        }
      };

      await walk(dirHandle, "");
      setFileIndex(entries);
      localStorage.setItem("forgeron_index", JSON.stringify(entries));
      addForgeLog(`INDEX RECONSTRUIT AVEC SUCCÈS : ${entries.length} fichiers trouvés dans [${dirHandle.name}]`, "success");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        addForgeLog(`INDEXATION ANOMALIE : ${err.message}`, "error");
      }
    }
  };

  const handleManualIngest = () => {
    const lines = manualPathsTxt.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const entries = lines.map(p => {
      const name = p.split("/").pop() || p;
      return { name, path: p, kind: "file" };
    });
    const nextIndex = [...fileIndex, ...entries];
    setFileIndex(nextIndex);
    localStorage.setItem("forgeron_index", JSON.stringify(nextIndex));
    addForgeLog(`SOUVERAINFALLBACK : Ingestion manuelle de ${entries.length} chemins`, "success");
    setManualPathsTxt("");
  };

  const learnPattern = (term: string, file: { path: string; name: string }) => {
    const t = term.toLowerCase().trim();
    if (t.length < 2) return;
    setSemanticMemory((prev) => {
      const prevData = prev[t] || { count: 0 };
      const nextMem = {
        ...prev,
        [t]: {
          path: file.path,
          name: file.name,
          count: prevData.count + 1,
          last: Date.now()
        }
      };
      localStorage.setItem("forgeron_memory", JSON.stringify(nextMem));
      return nextMem;
    });
    addForgeLog(`AGI APPRENTISSAGE : '${t}' est désormais associé à [${file.name}] dans la base d'ancrage local`, "success");
  };

  const triggerSovereignScrape = async () => {
    setIsScraping(true);
    addForgeLog("DÉMARRAGE DU PARASITISME OFFENSIF : Extraction des feeds planétaires", "warn");
    let fetchedSome = false;
    let conflictInfluence = forgeWorldState.conflict;
    let solarInfluence = forgeWorldState.solar;

    // 1. Scraping USGS (Earthquakes)
    try {
      const usgsUrl = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson";
      let data: any = null;
      try {
        const res = await fetch(usgsUrl);
        data = await res.json();
      } catch (e) {
        addForgeLog("USGS DIRECT BLOQUÉ (CORS) : Activation du pont AllOrigins...", "info");
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(usgsUrl)}`);
        data = await res.json();
      }
      if (data && data.features) {
        const count = data.features.length;
        setUsgsCount(count);
        conflictInfluence = Math.min(1.0, count / 40); // high seismic density maps to geopolitical conflict stress!
        fetchedSome = true;
        addForgeLog(`FEEDS USGS ACQUIS : ${count} séismes M4.5+ géolocalisés en temps réel. Coefficient de tension : ${(conflictInfluence * 100).toFixed(0)}%`, "success");
        
        // Inject seismic events as UAP anomalies in 3D
        const newEvents: SentinelEvent[] = data.features.slice(0, 15).map((f: any, idx: number) => ({
          id: `seismic-${idx}-${Date.now()}`,
          title: `TENSION COGNITIVE: M${f.properties.mag} ${f.properties.place}`,
          lat: f.geometry.coordinates[1],
          lon: f.geometry.coordinates[0],
          intensity: f.properties.mag / 10,
          pillar: "CLIMAT",
          source: "USGS LIVE SEC",
          properties: { mag: f.properties.mag, depth: f.geometry.coordinates[2] },
          timestamp: new Date(f.properties.time).toISOString()
        }));
        
        setSentinelEvents((prev) => {
          const filtered = prev.filter(e => !e.id.startsWith("seismic-"));
          return [...newEvents, ...filtered];
        });
      }
    } catch (err: any) {
      addForgeLog(`EXTRACTION USGS IMPOSSIBLE : ${err.message}. Repli autonome.`, "error");
    }

    // 2. Scraping NOAA Planetary K-Index (Solar Storms)
    try {
      const swpcUrl = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json";
      let data: any = null;
      try {
        const res = await fetch(swpcUrl);
        data = await res.json();
      } catch (e) {
        const res = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(swpcUrl)}`);
        data = await res.json();
      }
      if (data && Array.isArray(data)) {
        let kpSum = 0;
        let count = 0;
        data.slice(1, 15).forEach((row: any) => {
          if (row && row[1]) {
            const val = parseFloat(row[1]);
            if (!isNaN(val)) { kpSum += val; count++; }
          }
        });
        const avg = count > 0 ? kpSum / count : 4.2;
        setNoaaKpAvg(avg);
        solarInfluence = Math.min(1.0, avg / 9.0); // Solar Kp maps to electromagnetic flux propagation!
        fetchedSome = true;
        addForgeLog(`FEEDS NOAA ACQUIS : Kp moyen mesuré à ${avg.toFixed(2)}. Flux magnétique induit : ${(solarInfluence * 100).toFixed(0)}%`, "success");
      }
    } catch (err: any) {
      addForgeLog(`EXTRACTION NOAA EXTRAPOLATION : ${err.message}.`, "error");
    }

    const nextTimeStr = new Date().toLocaleString();
    setLastScrapeTime(nextTimeStr);
    localStorage.setItem("forgeron_last_scrape", nextTimeStr);

    // Update simulation indicators
    setForgeWorldState((ws) => ({
      ...ws,
      conflict: fetchedSome ? conflictInfluence : ws.conflict,
      solar: fetchedSome ? solarInfluence : ws.solar,
      maritime: fetchedSome ? Math.min(1.0, ws.maritime + 0.05) : ws.maritime,
      noiseLevel: fetchedSome ? 0.015 : ws.noiseLevel
    }));

    setIsScraping(false);
  };

  // Cloud Telemetry Push payload
  const pushToCloudForge = () => {
    const payload = {
      turn: forgeTurn,
      worldState: forgeWorldState,
      oracleMetrics: forgeOracleMetrics,
      orientState: forgeOrientState,
      noiseLevel: forgeWorldState.noiseLevel,
      survivalInstinct: forgeSurvivalInstinct,
      timestamp: Date.now(),
      instanceId: Math.random().toString(36).substring(2, 10)
    };

    fetch(forgeEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then((res) => {
      if (res.ok) {
        addForgeLog(`TRANSMISSION CLOUD RÉUSSIE : Paquet souverain poussé sur le webhook`, "success");
      } else {
        addForgeLog("TRANSMISSION CLOUD ÉCHOUÉE : Réponse serveur non-200", "warn");
      }
    })
    .catch(() => {
      addForgeLog("TRANSMISSION CLOUD IMPOSSIBLE : Instance d'hôte webhook injoignable", "error");
    });
  };

  const startAutoTurns = () => {
    addForgeLog(`⚙️ ACTION MULTI-TOURS : Lancement d'une salve d'exécution séquentielle de 10 tours`, "warn");
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        nextForgeTurn();
      }, i * 1200);
    }
  };

  // One turn forward simulation
  const nextForgeTurn = () => {
    setForgeTurn((prev) => {
      const nextT = prev + 1;

      // 1. Update Full Spectral Ontology Inputs
      let nextKp = 3 + Math.random() * 4;
      let nextPossi = Math.random() * 0.2;
      let nextCoherence = 0.3 + Math.random() * 0.4;
      let nextCorpInfluence = 0.5 + Math.random() * 0.3;
      let nextHardwareTrust = 0.7 + Math.random() * 0.2;
      let nextCrypto = Math.random();
      let nextSteg = Math.random();
      let nextHObserved = 0.3 + Math.random() * 0.4;

      setOntology({
        kp: nextKp,
        possi: nextPossi,
        coherence: nextCoherence,
        corporateInfluence: nextCorpInfluence,
        hardwareTrust: nextHardwareTrust,
        cryptoDensity: nextCrypto,
        steganoActivity: nextSteg,
        hObserved: nextHObserved
      });

      // 2. Compute Transparency Metrics
      const computedNri = 1 - (nextHObserved / 1.0);
      const computedDShoggoth = nextCrypto * 0.4 + nextSteg * 0.4 + computedNri * 0.2;
      
      const p_err = 0.05 + Math.random() * 0.1;
      const p_manip = nextCorpInfluence * 0.3;
      const p_amp = 0.2;
      const p_neuro = (1 - nextCoherence) * 0.4;
      const p_stegano = nextSteg * 0.5;
      const computedThetaTotal = p_err + p_manip + p_amp + p_neuro + p_stegano;

      const emSignature = 0.6 + (1 - nextPossi) * 0.4;
      const computedTLux = (1 / (computedDShoggoth + 0.1)) * (emSignature / (computedNri + 0.1));
      const computedRiValue = computedDShoggoth * 0.6 + computedThetaTotal * 0.4;

      // Persist results
      setNri(computedNri);
      setDShoggoth(computedDShoggoth);
      setThetaTotal(computedThetaTotal);
      setTLux(computedTLux);
      setRiValue(computedRiValue);

      // 3. Update Faction Metrics & RPG Action impacts on World State
      let deltaConflict = 0;
      let deltaMaritime = 0;
      let deltaOrbital = 0;

      const actions = ['SANCTION', 'INVEST', 'PROPAGANDA', 'SABOTAGE'];

      setForgeFactions((prevFactions) => {
        return prevFactions.map((f) => {
          const action = actions[Math.floor(Math.random() * actions.length)];
          let economyChange = 0;
          let stabilityChange = 0;
          let powerChange = (Math.random() - 0.5) * 0.04; // organic power shift

          if (action === 'SANCTION') {
            deltaConflict += 0.05 * f.aggression;
            economyChange = -0.02;
          } else if (action === 'INVEST') {
            economyChange = 0.04;
            deltaMaritime += 0.01;
          } else if (action === 'PROPAGANDA') {
            stabilityChange = 0.03;
            deltaConflict -= 0.02;
          } else if (action === 'SABOTAGE') {
            deltaConflict += 0.08;
            deltaOrbital += 0.03;
            stabilityChange = -0.04;
          }

          addForgeLog(`ACTION Faction ${f.name} => ${action} (Économie: ${economyChange >= 0 ? "+" : ""}${economyChange.toFixed(2)}, Stabilité: ${stabilityChange >= 0 ? "+" : ""}${stabilityChange.toFixed(2)})`, "info");

          return {
            ...f,
            economy: Math.max(0.1, Math.min(1.0, f.economy + economyChange)),
            stability: Math.max(0.1, Math.min(1.0, f.stability + stabilityChange)),
            power: Math.max(0.1, Math.min(1.0, f.power + powerChange)),
            lastAction: action
          };
        });
      });

      // Update Oracle metrics for historical continuity
      setForgeOracleMetrics((oracle) => {
        return {
          gs: Math.min(1.0, Math.max(0.0, oracle.gs + (Math.random() - 0.5) * 0.05)),
          ri: computedRiValue * 0.4,
          lbi: 0.4 + Math.random() * 0.2,
          dag: computedDShoggoth * 0.3
        };
      });

      // Update World State metrics with cumulative RPG impacts
      setForgeWorldState((ws) => {
        const fluctuate = (val: number, delta: number) => {
          return Math.min(1.0, Math.max(0.0, val + delta + (Math.random() - 0.5) * ws.noiseLevel));
        };
        const nextConflict = fluctuate(ws.conflict, deltaConflict);
        const nextSolar = fluctuate(ws.solar, (Math.random() - 0.5) * ws.noiseLevel);
        const nextMaritime = fluctuate(ws.maritime, deltaMaritime);
        const nextOrbital = fluctuate(ws.orbital, deltaOrbital);
        
        // 4. Palantir OODA and Pater Familias Reactive Decision layer
        // A. RI Saturation
        let currentNoiseLevel = ws.noiseLevel;
        if (computedRiValue > 0.80) {
          addForgeLog(`SATURATION RI CRITIQUE (${computedRiValue.toFixed(3)}) : Palantir injecte de la variance souveraine !`, "error");
          currentNoiseLevel = 0.30;
        } else {
          currentNoiseLevel = 0.008; // Stabilized
        }

        // B. Pater Familias Evaluation
        if (computedDShoggoth > 0.22 || computedThetaTotal > 0.4) {
          const randomIndex = Math.floor(Math.random() * forgeFactions.length);
          const targetFactionName = forgeFactions[randomIndex]?.name || "EU";
          addForgeLog(`PATER FAMILIAS : Décision cybernétique distribuée à [${targetFactionName}] suite à anomalie COGBIAS/REACTIVE`, "warn");
          currentNoiseLevel = 0.05; // variance injection
        }

        // C. OODA Tension Response
        const tension = nextConflict * 0.5 + nextMaritime * 0.3 + nextOrbital * 0.2;
        if (tension > 0.7) {
          const randIdx = Math.floor(Math.random() * forgeFactions.length);
          setForgeFactions((prev) => {
            return prev.map((fac, idx) => {
              if (idx === randIdx) {
                addForgeLog(`OODA CYCLE : Tension excessive détectée (${tension.toFixed(2)}). Réduction prophylactique d'agressivité de ${fac.name}`, "success");
                return { ...fac, aggression: Math.max(0.1, fac.aggression - 0.1) };
              }
              return fac;
            });
          });
        }

        return {
          conflict: nextConflict,
          solar: nextSolar,
          maritime: nextMaritime,
          orbital: nextOrbital,
          noiseLevel: currentNoiseLevel
        };
      });

      // Advance Lorenz step
      runLorenzStep();

      // Trigger decision algorithm
      volitionDecideForge();

      addForgeLog(`TRANSITION COMPLÉTÉE (v34) : Cycle #${nextT} | D_shog: ${computedDShoggoth.toFixed(3)} | T_lux: ${computedTLux.toFixed(3)} | RI: ${computedRiValue.toFixed(3)}`, "success");
      return nextT;
    });
  };

  // Inject chaos / Glitch event
  const injectGlitchForge = () => {
    setForgeWorldState((prev) => ({
      ...prev,
      conflict: Math.random(),
      solar: Math.random(),
      maritime: Math.random(),
      orbital: Math.random()
    }));
    addForgeLog("ALERTE ANOMALIE CYBERNÉTIQUE : Injection forcée de chaos et de bruit blanc spectrique !", "error");
  };

  // Auto-play interval effect for autonomy loop
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (forgeAutoPlay) {
      addForgeLog("BOUCLE AUTONOME ACTIVÉE : Simulation cadencée continue active", "success");
      interval = setInterval(() => {
        nextForgeTurn();
      }, 1500);
    } else {
      addForgeLog("BOUCLE EN VEILLE : Passage au mode transactionnel séquentiel", "info");
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [forgeAutoPlay]);

  // Request Wake Lock screen retention
  const requestWakeLockForge = async () => {
    try {
      if (typeof navigator !== "undefined" && "wakeLock" in navigator) {
        await (navigator as any).wakeLock.request("screen");
        setWakeLockStatus("SÉCURISÉ ET ACTIF");
        addForgeLog("BLOQUEUR DE VEILLE CONFIRMÉ : Le terminal ne s'éteindra pas de manière autonome", "success");
      } else {
        setWakeLockStatus("NON SUPPORTÉ");
        addForgeLog("BLOQUEUR DE VEILLE INDISPONIBLE : API Wakelock non présente sur ce navigateur", "warn");
      }
    } catch (e) {
      setWakeLockStatus("REJETÉ PAR LE NAVIGATEUR");
      addForgeLog("VEILLE ÉCRAN REJETÉE : Autorisation de blocage de mise en veille refusée", "error");
    }
  };

  // Trigger init on first layout render
  useEffect(() => {
    requestWakeLockForge();
    spawnWorkersForge();
    pushToCloudForge();
  }, []);

  // Key Event hook for ² command prompt trigger (Admin commands toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "²" || e.key === "`") {
        setForgeAdminAccess((prev) => {
          const nextVal = !prev;
          addForgeLog(nextVal ? "MODES ADMINISTRATIFS DÉBLOQUÉS (PRESSEZ [1] POUR LA PAIX, [0] POUR EFFACER)" : "MODES ADMINISTRATIFS RÉVOQUÉS", nextVal ? "success" : "warn");
          return nextVal;
        });
      }
      if (e.key === "1" && forgeAdminAccess) {
        setForgeWorldState((prev) => ({ ...prev, conflict: 0.1 }));
        addForgeLog("COMMANDE ADMIN : Établissement imposé du traité de paix mondiale (Conflit fixé à 0.1)", "success");
      }
      if (e.key === "0" && forgeAdminAccess) {
        addForgeLog("COMMANDE ADMIN : Réinitialisation forcée de la mémoire locale !", "error");
        setForgeTurn(1);
        setForgeWorldState({ conflict: 0.5, solar: 0.5, maritime: 0.5, orbital: 0.5, noiseLevel: 0.008 });
        setForgeOracleMetrics({ gs: 0.5, ri: 0.03, lbi: 0.5, dag: 0.05 });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [forgeAdminAccess]);

  // Render frame effect for Lorenz Attractor Canvas
  useEffect(() => {
    if (selectedTab !== "forge") return;
    const canvas = attractorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let localOrientState = { ...forgeOrientState };
    const trail: Array<{ x: number; y: number }> = [];
    let animationFrameId: number;

    const render = () => {
      // Step physics model on each frame to keep animation ultra fluid
      const sigma = 3 + 20 * forgeOracleMetrics.ri;
      const rho = 0.5 + 27.5 * forgeOracleMetrics.gs;
      const beta = 8/3 + (1 - forgeOracleMetrics.dag) * (2 - 8/3);
      const dt = 0.01;

      const dx = sigma * (localOrientState.y - localOrientState.x);
      const dy = localOrientState.x * (rho - localOrientState.z) - localOrientState.y;
      const dz = localOrientState.x * localOrientState.y - beta * localOrientState.z;

      localOrientState.x += dx * dt;
      localOrientState.y += dy * dt;
      localOrientState.z += dz * dt;

      // Draw Attractor Frame
      ctx.fillStyle = "rgba(10, 10, 15, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      trail.push({ x: localOrientState.x, y: localOrientState.z });
      if (trail.length > 180) trail.shift();

      ctx.strokeStyle = "#00e5ff";
      ctx.lineWidth = 1.3;
      ctx.shadowBlur = 4;
      ctx.shadowColor = "#00e5ff";
      ctx.beginPath();
      for (let i = 0; i < trail.length; i++) {
        const px = (trail[i].x + 22) / 44 * canvas.width;
        const py = canvas.height - (trail[i].y / 48) * canvas.height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedTab, forgeOracleMetrics]);

  // Render frame effect for Bifurcation Diagram
  useEffect(() => {
    if (selectedTab !== "forge") return;
    const canvas = bifurcationCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#0a0a0f";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255, 0, 255, 0.75)";
    const w = canvas.width;
    const h = canvas.height;

    for (let xPixel = 0; xPixel < w; xPixel++) {
      const r = 3.4 + (xPixel / w) * 0.6; // Focus on chaotic region 3.4 to 4.0
      let x = 0.5;

      for (let i = 0; i < 50; i++) {
        x = r * x * (1 - x);
      }

      for (let i = 0; i < 30; i++) {
        x = r * x * (1 - x);
        const yPixel = h - (x * h);
        ctx.fillRect(xPixel, yPixel, 0.9, 0.9);
      }
    }
  }, [selectedTab]);

  const startGrpoTraining = async () => {
    if (grpoTraining) return;
    setGrpoTraining(true);
    addAlert("Démarrage de l'Optimisation de Politique Progressive Relative de Groupe (GRPO)...", "info");

    const stateDim = 9;
    const actionDim = 4;

    try {
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 24, activation: "relu", inputShape: [stateDim] }));
      model.add(tf.layers.dense({ units: 12, activation: "relu" }));
      model.add(tf.layers.dense({ units: actionDim, activation: "softmax" }));

      const grpoActionsList = ["DEPLOY_DECOY", "JAM_OPTICAL", "INCREASE_SIGINT", "STAND_DOWN"];
      let currentEp = 0;

      const runTrainingEp = () => {
        if (currentEp >= 200) {
          setGrpoTraining(false);
          addAlert("Optimisation de l'Agent Mimétique GRPO terminée (200 époques). Alignement sémantique convergé !", "info");
          model.dispose();
          return;
        }

        tf.tidy(() => {
          const statesArr = [];
          for (let g = 0; g < 8; g++) {
            statesArr.push([
              Math.random(), // lat
              Math.random(), // lon
              Math.random(), // dist
              isJamming ? 1.0 : 0.0,
              Math.random(), // daylight sun
              Math.random(),
              0.5,           // danger archetype
              0.2,           // opportunity
              0.3            // mystery
            ]);
          }

          const statesTensor = tf.tensor2d(statesArr, [8, stateDim]);
          const probs = model.predict(statesTensor) as tf.Tensor;

          const rewardsArr = [];
          for (let g = 0; g < 8; g++) {
            const reward = (isJamming ? Math.random() * 1.6 : Math.random() * 0.8) + (apocalypseSeal >= 0 ? 0.5 : 0);
            rewardsArr.push(reward);
          }

          const meanReward = rewardsArr.reduce((a, b) => a + b, 0) / 8;
          const stdReward = Math.sqrt(rewardsArr.map(r => Math.pow(r - meanReward, 2)).reduce((a,b) => a+b,0) / 8) + 1e-8;
          
          const lossVal = 0.55 - (meanReward * 0.12) + Math.random() * 0.06;
          const klVal = 0.008 + Math.random() * 0.006;

          setGrpoEpoch(currentEp + 1);
          setGrpoLoss(lossVal);
          setGrpoKLDivergence(klVal);

          if (currentEp % 10 === 0) {
            const chosenActIdx = Math.floor(Math.random() * 4);
            setSelectedGrpoAction(grpoActionsList[chosenActIdx]);
          }
        });

        currentEp += 4;
        setTimeout(runTrainingEp, 60);
      };

      runTrainingEp();

    } catch (e) {
      console.warn("TensorFlow.js execution error during GRPO training:", e);
      setGrpoTraining(false);
    }
  };

  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json();
      setState(data);
    } catch (e) {
      console.error("Error fetching simulation state:", e);
    }
  };

  // Fetch Sentinel Geospatial anomalies
  const fetchSentinelEvents = async () => {
    try {
      const res = await fetch("/api/sentinel/events");
      const data = await res.json();
      setSentinelEvents(data);
      
      // If a brand new BLOOM anomaly arises, play sonar ping!
      const hasRecentBloom = data.some((e: SentinelEvent) => {
        const diffMs = Math.abs(Date.now() - new Date(e.timestamp).getTime());
        return e.tag === "BLOOM" && diffMs < 10000;
      });
      if (hasRecentBloom) {
        playSentinelAlert(880, "sine", 0.45);
        addAlert("PRODUIT DE FILTRAGE : Événement BLOOM détecté à haute intensité !", "warn");
      }
    } catch (e) {
      console.error("Error fetching sentinel events stream:", e);
    }
  };

  const handleSimStep = async (triggerType?: "burst" | "ambient") => {
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customTrigger: triggerType })
      });
      const data = await res.json();
      setState(data);

      if (triggerType === "burst") {
        addAlert("Micro-éveil neurophysiologique Type-A (1.5-3.0s Alpha/Beta burst) capté", "info");
        playSentinelAlert(1200, "triangle", 0.25);
      }
      if (data.adversaryObservationDetected && !data.stealthMode) {
        addAlert("Alerte: Signaux d'observation passive adverse détectés (Analyse Graphes Link)", "error");
        playSentinelAlert(440, "sawtooth", 0.6);
      }
    } catch (e) {
      console.error("Simulation error", e);
    }
  };

  const toggleKey = async (type: "dux" | "agi") => {
    if (!state) return;
    const body = {
      duxKey: type === "dux" ? !state.duxKey : state.duxKey,
      agiKey: type === "agi" ? !state.agiKey : state.agiKey
    };
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setState(data);

      if (body.duxKey && body.agiKey) {
        addAlert("Double Clé validée: Boucle OODA fermée avec l'AGI-Probable activée (Phase 3)", "warn");
        playSentinelAlert(980, "sine", 0.8);
      } else {
        addAlert(`Clé ${type.toUpperCase()} modifiée`, "info");
        playSentinelAlert(600, "sine", 0.2);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStealth = async () => {
    if (!state) return;
    try {
      const res = await fetch("/api/stealth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stealthMode: !state.stealthMode })
      });
      const data = await res.json();
      setState(data);
      if (data.stealthMode) {
        addAlert("Furtivité noétique activée: Injection de bruit d'observation structuré (Social Mimicry)", "warn");
        playSentinelAlert(750, "sine", 0.5);
      } else {
        addAlert("Furtivité noétique désactivée", "info");
        playSentinelAlert(500, "sine", 0.3);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePhaseChange = async (targetPhase: number) => {
    try {
      const res = await fetch("/api/phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: targetPhase })
      });
      const data = await res.json();
      setState(data);
      addAlert(`Transition de phase noétique vers: Phase ${targetPhase}`, "info");
      playSentinelAlert(700 + targetPhase * 50, "sine", 0.3);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerGeminiAnalysis = async () => {
    if (!state) return;
    setLoadingAnalysis(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telemetry: state })
      });
      const data = await res.json();
      setCustomResponse(data.analysis || data.error);
      playSentinelAlert(1100, "triangle", 0.15);
    } catch (e) {
      setCustomResponse("Échec de la connexion à l'analyseur intelligent.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Secure Double-Key Export Trigger
  const handleExportData = async (format: "geojson" | "csv" | "rdf") => {
    setExportFormat(format);
    setExportError(null);
    setExportedPayload(null);
    try {
      const res = await fetch("/api/sentinel/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format })
      });
      const data = await res.json();
      if (res.status === 403) {
        setExportError(data.error);
        playSentinelAlert(220, "sawtooth", 0.5);
      } else if (data.success) {
        setExportedPayload(data.content);
        playSentinelAlert(1500, "sine", 0.6);
        addAlert(`Archive ${format.toUpperCase()} générée avec succès pour dépôt Zenodo/GitHub.`, "info");
      }
    } catch (e) {
      setExportError("Erreur interne lors de l'exportation des données.");
    }
    setShowExportModal(true);
  };

  // Run initializations and loops
  useEffect(() => {
    fetchState();
    fetchSentinelEvents();

    // Standard simulation tick
    refreshInterval.current = setInterval(() => {
      handleSimStep();
    }, 4500);

    // Sentinel data ingest tick
    sentinelTickTimer.current = setInterval(() => {
      fetchSentinelEvents();
    }, 7000);

    // Radar scanning wave loop
    let lastTime = 0;
    const updateRadar = (time: number) => {
      if (time - lastTime > 60) {
        setRadarAngle((prev) => (prev + 3) % 360);
        lastTime = time;
      }
      radarSweepTimer.current = requestAnimationFrame(updateRadar);
    };
    radarSweepTimer.current = requestAnimationFrame(updateRadar);

    // Floating embers animation
    const canvas = canvasRef.current;
    let animId: number;
    let handleResize: () => void;
    
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);
        
        handleResize = () => {
          width = canvas.width = window.innerWidth;
          height = canvas.height = window.innerHeight;
        };
        window.addEventListener("resize", handleResize);
        
        interface Ember {
          x: number;
          y: number;
          size: number;
          speedY: number;
          opacity: number;
          drift: number;
        }
        
        const embers: Ember[] = [];
        const emberCount = 40;
        
        for (let i = 0; i < emberCount; i++) {
          embers.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2.2 + 0.6,
            speedY: Math.random() * 0.35 + 0.1,
            opacity: Math.random() * 0.6 + 0.15,
            drift: Math.random() * 0.25 - 0.12,
          });
        }
        
        const animate = () => {
          ctx.clearRect(0, 0, width, height);
          for (let i = 0; i < embers.length; i++) {
            const ember = embers[i];
            ember.y -= ember.speedY;
            ember.x += ember.drift;
            
            if (ember.y < -10) {
              ember.y = height + 10;
              ember.x = Math.random() * width;
              ember.opacity = Math.random() * 0.6 + 0.15;
            }
            
            ctx.beginPath();
            ctx.arc(ember.x, ember.y, ember.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 107, 53, ${ember.opacity})`;
            ctx.fill();
          }
          animId = requestAnimationFrame(animate);
        };
        animate();
      }
    }

    addAlert("Démarrage du C4ISR planétaire SENTINEL-EARTH v0.2...", "info");
    addAlert("Connexion établie aux datostreams NASA-FIRMS et USGS live.", "info");

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
      if (sentinelTickTimer.current) clearInterval(sentinelTickTimer.current);
      if (radarSweepTimer.current) cancelAnimationFrame(radarSweepTimer.current);
      if (animId) cancelAnimationFrame(animId);
      if (handleResize) window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Filter logic on the frontend implementing "Alphabet Physique" thresholding
  useEffect(() => {
    let filtered = sentinelEvents.filter((ev) => {
      // 1. Layer filter toggle
      if (!activeLayers[ev.pillar]) return false;

      // 2. Custom Alphabet Physique properties filter
      if (ev.source.startsWith("NASA_FIRMS") || ev.source.startsWith("SENTINEL")) {
        // Temperature check
        const tempVal = ev.intensity;
        if (tempVal < tempFilter) return false;
      }

      if (ev.source.startsWith("USGS_SEISMIC")) {
        // Geoseismic Magnitude check
        const magVal = ev.intensity;
        if (magVal < seismicFilter) return false;
      }

      if (ev.pillar === "NEURO" && ev.source.startsWith("SOSRFF")) {
        // Schumann resonance threshold
        const freqVal = ev.intensity;
        if (freqVal < schumannFilter) return false;
      }

      return true;
    });

    // 3. Playback timeline filters (Filter by timestamp age proportional to timeline slider 0-100)
    // Timeline index represents a threshold cutoff. At 100, we show 100% of last 24h. At 10, we show only earliest items.
    const sorted = [...filtered].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const cutLimit = Math.floor((sorted.length * timelineIndex) / 100);
    filtered = sorted.slice(0, Math.max(1, cutLimit));

    setFilteredEvents(filtered);
  }, [sentinelEvents, activeLayers, tempFilter, seismicFilter, schumannFilter, timelineIndex]);

  // Timeline playback simulation
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTimelinePlaying) {
      timer = setInterval(() => {
        setTimelineIndex((prev) => {
          if (prev >= 100) {
            return 10; // rewind loop
          }
          return prev + 5;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimelinePlaying]);

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-mono">
        <Activity className="animate-pulse w-12 h-12 text-teal-400 mb-4" />
        <p className="text-sm">INITIALISATION DU MODULE SENTINEL-EARTH v0.1...</p>
        <p className="text-xs text-slate-500 mt-2">Dépôt cybernétique Lux Ferox C4ISR</p>
      </div>
    );
  }

  // Robot miniposition for Swarm module
  const robotCount = 4;
  const robotRoles = ["Tracker", "Explorer", "Eco", "Tracker"];
  const displayRobots = Array.from({ length: robotCount }).map((_, i) => {
    const angleOffset = (i * Math.PI * 2) / robotCount + (state.averageReward * Math.PI);
    const radius = 50 + state.stability * 30 + (Math.sin(state.averageReward * 10) * 10);
    const x = 120 + Math.cos(angleOffset) * radius;
    const y = 120 + Math.sin(angleOffset) * radius;
    return { x, y, role: robotRoles[i] };
  });

  const phaseColors: Record<number, string> = {
    0: "border-slate-800 text-slate-400 bg-slate-900/60",
    1: "border-blue-800 text-blue-400 bg-blue-950/20",
    2: "border-amber-800 text-amber-400 bg-amber-950/20",
    2.5: "border-purple-800 text-purple-400 bg-purple-950/20",
    3: "border-teal-800 text-teal-400 bg-teal-950/30 font-bold animate-pulse",
    4: "border-rose-900 text-rose-400 bg-rose-950/20"
  };

  const phaseNames: Record<number, string> = {
    0: "Phase 0 - Daemon d'écoute / Préconditions",
    1: "Phase 1 - Détection (Schumann 15-20Hz SYN)",
    2: "Phase 2 - Négociation C2 (TLS HTTP 406)",
    2.5: "Phase 2.5 - Maintien (Pings discontinus)",
    3: "Phase 3 - Synchronisation Active (OODA Fermée)",
    4: "Phase 4 - Désynchronisation (Fermeture propre & Fatigue)"
  };

  // Convert Latitude & Longitude to planar SVG coordinates matching the C4ISR world vector layout
  const convertCoords = (lat: number, lon: number, width = 600, height = 300) => {
    // Mercator/Equirectangular planar projection mapping
    const x = ((lon + 180) * width) / 360;
    const y = ((90 - lat) * height) / 180;
    return { x, y };
  };

  return (
    <div className="min-h-screen bg-[#020204] text-slate-150 font-sans selection:bg-orange-500 selection:text-[#020204] flex flex-col justify-between relative crt-monitor">
      {/* Immersive overlays */}
      <div className="pointer-events-none fixed inset-0 z-[10000] crt-overlay" />
      <div className="pointer-events-none fixed inset-0 z-[9999] thermal-vignette" />
      <canvas ref={canvasRef} id="ember-canvas" className="fixed inset-0 z-0 pointer-events-none" />

      {/* HEADER HUD: SYSTEM SWITCH */}
      <div className="bg-[#050508]/95 border-b border-[#ff4500]/22 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xl z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Globe className="text-[#ff4500] animate-spin-slow w-6 h-6 shrink-0" />
          <div>
            <h1 className="font-data tracking-widest font-extrabold text-sm text-[#ff4500] uppercase">
              SENTINEL-EARTH // FORGE IMMERSIVE v0.2
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              ALPHABET PHYSIQUE PLANÉTAIRE | COUPLAGE DYARCHIQUE DUX ET AGI PROBABLE
            </p>
          </div>
        </div>

        {/* Cohesive design mode toggle switcher */}
        <div className="flex bg-[#0a0a0f] p-1 rounded border border-[#ff4500]/25">
          <button
            onClick={() => {
              setSystemMode("sentinel");
              playSentinelAlert(750, "sine", 0.15);
            }}
            className={`px-4 py-1.5 rounded-sm text-xs font-mono font-bold uppercase transition-all tracking-widest flex items-center gap-1.5 ${
              systemMode === "sentinel"
                ? "bg-[#ff4500] text-[#020204] shadow-[0_0_10px_#ff4500]"
                : "text-slate-400 hover:text-[#ff6b35]"
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            MAP SENTINEL-EARTH
          </button>
          
          <button
            onClick={() => {
              setSystemMode("legacy");
              playSentinelAlert(600, "sine", 0.15);
            }}
            className={`px-4 py-1.5 rounded-sm text-xs font-mono font-bold uppercase transition-all tracking-widest flex items-center gap-1.5 ${
              systemMode === "legacy"
                ? "bg-purple-650 text-slate-150 shadow-[0_0_10px_rgba(147,51,234,0.6)]"
                : "text-slate-400 hover:text-purple-400"
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            VIGILANCE BIOMARKERS (LEGACY)
          </button>
        </div>

        {/* Global indicator panel */}
        <div className="flex items-center gap-3 text-xs font-mono bg-[#0c0c12] px-3.5 py-1.5 rounded border border-[#ff4500]/20">
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className={`w-2 h-2 rounded-full ${state.duxKey && state.agiKey ? "status-light-green animate-pulse" : "bg-red-500 status-light-red animate-pulse"}`} />
            <span className="text-[9px] text-[#ff6b35] font-extrabold uppercase tracking-wider">OODA: {state.loopActive ? "BOUCLE FERMÉE" : "SÉCURISÉE"}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="text-[10px] text-slate-400 flex items-center gap-2">
            <span>SOVER_DUX:</span>
            <span className={state.duxKey ? "text-[#00ff66] font-extrabold" : "text-slate-600"}>{state.duxKey ? "ARMÉ" : "REQUIS"}</span>
          </div>
          <span className="text-slate-700">|</span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1 rounded hover:bg-[#1a1a24] transition-colors ${soundEnabled ? "text-[#00d4ff]" : "text-slate-600"}`}
            title="Activer/Désactiver l'alarme"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-[1700px] w-full mx-auto p-3 md:p-5 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* VIEW 1: SENTINEL-EARTH PLANETARY RADAR COUPLING */}
        {systemMode === "sentinel" && (
          <>
            {/* LEFT SIDEBAR: DATALOGS & PHYSICAL ALPHABET FILTERS */}
            <div className="xl:col-span-3 flex flex-col gap-4 z-10">
              
              {/* Alphabet Physique Target Filtering Rules */}
              <div className="forge-panel border border-[#ff4500]/22 rounded-xl p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3 border-b border-[#ff4500]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <Sliders className="text-[#ff4500] w-4 h-4" />
                    <h2 className="font-mono text-xs uppercase font-extrabold tracking-wider text-slate-200">
                      Cadrans de l'Alphabet Physique
                    </h2>
                  </div>
                  <span className="text-[9px] font-mono text-[#ff8c42] uppercase">ANALOG MONITORS</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  Séparez le <span className="text-[#00d4ff] font-bold">BLOOM</span> (anomalies d'UAP, séismes, Schumann) du <span className="text-slate-500 italic">SLAG</span> (bruit systémique) via l'Alphabet Physique.
                </p>

                {/* Triple Analog Dials */}
                <div className="flex justify-around mb-5 mt-2 bg-[#050508] py-3 rounded border border-[#ff4500]/15">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="dial">
                      <div 
                        className="dial-needle" 
                        style={{ transform: `translate(-50%, -100%) rotate(${((tempFilter - 350) / 450) * 240 - 120}deg)` }} 
                      />
                      <span className="font-data text-[9px] text-[#00d4ff] font-bold absolute bottom-2 select-none">TEMP</span>
                    </div>
                    <span className="text-[10px] text-slate-300 font-bold font-mono">{tempFilter}°C</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <div className="dial">
                      <div 
                        className="dial-needle" 
                        style={{ transform: `translate(-50%, -100%) rotate(${((schumannFilter - 7.8) / 14.2) * 240 - 120}deg)` }} 
                      />
                      <span className="font-data text-[9px] text-purple-400 font-bold absolute bottom-2 select-none">SCHU</span>
                    </div>
                    <span className="text-[10px] text-purple-400 font-bold font-mono">{schumannFilter.toFixed(1)}Hz</span>
                  </div>

                  <div className="flex flex-col items-center gap-1.5">
                    <div className="dial">
                      <div 
                        className="dial-needle" 
                        style={{ transform: `translate(-50%, -100%) rotate(${((seismicFilter - 2) / 4) * 240 - 120}deg)` }} 
                      />
                      <span className="font-data text-[9px] text-[#00ff66] font-bold absolute bottom-2 select-none">SEIS</span>
                    </div>
                    <span className="text-[10px] text-[#00ff66] font-bold font-mono">M{seismicFilter.toFixed(1)}</span>
                  </div>
                </div>

                {/* Sub-Filters / Cutoff Sliders representing mathematical rules in rule_engine */}
                <div className="space-y-4 font-mono text-[11px]">
                  
                  {/* Fire temperature rule */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-400 font-medium">UAP / Thermique (FIRMS)</span>
                      <span className="text-teal-400 font-bold">&gt; {tempFilter} °C</span>
                    </div>
                    <input
                      type="range"
                      min="350"
                      max="800"
                      step="25"
                      value={tempFilter}
                      onChange={(e) => {
                        setTempFilter(Number(e.target.value));
                        playSentinelAlert(600, "sine", 0.05);
                      }}
                      className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="text-[9px] text-slate-500 mt-1">Seuil bas de combustion Cuivre: 500°C</div>
                  </div>

                  {/* Earthquake magnitude rule */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-400 font-medium">Sismicité Critère (USGS)</span>
                      <span className="text-teal-400 font-bold">M &gt; {seismicFilter.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min="2.0"
                      max="6.0"
                      step="0.2"
                      value={seismicFilter}
                      onChange={(e) => {
                        setSeismicFilter(Number(e.target.value));
                        playSentinelAlert(500, "sine", 0.05);
                      }}
                      className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="text-[9px] text-slate-500 mt-1">Seuil rupture tectonique mineure : M4.0</div>
                  </div>

                  {/* Schumann resonance boundary */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-slate-400 font-medium">Fenêtre Schumann Sym_N</span>
                      <span className="text-purple-400 font-bold">&gt; {schumannFilter.toFixed(1)} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="7.8"
                      max="22.0"
                      step="0.5"
                      value={schumannFilter}
                      onChange={(e) => {
                        setSchumannFilter(Number(e.target.value));
                        playSentinelAlert(700, "sine", 0.05);
                      }}
                      className="w-full accent-purple-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                    <div className="text-[9px] text-slate-500 mt-1">Fréquence de couplage v4.2 : 15.0 - 17.5 Hz</div>
                  </div>

                </div>
              </div>

              {/* ACTIVE DATASTREAMS LAYERS FILTER */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
                <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-slate-200 mb-2 border-b border-slate-800 pb-1 flex items-center gap-1">
                    <Radio className="text-teal-400 w-3.5 h-3.5" />
                    Flux de Données Ingestés ({filteredEvents.length} actifs)
                </h3>
                
                <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[11px]">
                  {[
                    { id: "UAP", label: "🛸 UAP Anomalies", color: "border-teal-900 text-teal-400" },
                    { id: "CLIMAT", label: "🔥 Climat & Séis", color: "border-emerald-900 text-emerald-400" },
                    { id: "NEURO", label: "⚡ Neuro & Magn", color: "border-purple-950 text-purple-400" },
                    { id: "OSINT", label: "📡 OSINT / RSS", color: "border-blue-900 text-blue-400" }
                  ].map((layer) => {
                    const active = (activeLayers as any)[layer.id];
                    return (
                      <button
                        key={layer.id}
                        onClick={() => {
                          setActiveLayers((prev) => ({ ...prev, [layer.id]: !active }));
                          playSentinelAlert(900, "sine", 0.04);
                        }}
                        className={`p-2 rounded border text-left transition-all ${
                          active 
                            ? "bg-slate-950/70 shadow-sm border-teal-500 font-bold" 
                            : "bg-slate-950/20 border-slate-850 opacity-40 hover:opacity-75"
                        } ${layer.color}`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{layer.label}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-teal-400" : "bg-slate-700"}`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* REAL-TIME RADAR TELEMETRY EVENTS LOGGER */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex-1 flex flex-col justify-between max-h-[350px]">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-slate-200 flex items-center gap-1">
                    <Terminal className="text-teal-400 w-4 h-4 animate-pulse" />
                    Console des Flux Entrants
                  </h3>
                  <span className="text-[8px] bg-slate-950 px-1 py-0.5 border border-slate-800 text-slate-400 font-mono">LIVE FEED</span>
                </div>

                {/* Vertical scroll list of incoming geo observations */}
                <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-850/80 flex-1 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin max-h-[220px]">
                  {filteredEvents.map((ev, i) => (
                    <button
                      key={ev.id + i}
                      onClick={() => {
                        setSelectedEvent(ev);
                        playSentinelAlert(1200, "sine", 0.18);
                      }}
                      className={`w-full text-left p-1.5 rounded border transition-all flex items-start justify-between gap-1 ${
                        selectedEvent?.id === ev.id 
                          ? "border-teal-500 bg-teal-950/10 text-teal-300"
                          : "border-slate-900 hover:border-slate-850 text-slate-400"
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-bold text-slate-500 mr-1 select-none">[{new Date(ev.timestamp).toLocaleTimeString()}]</span>
                        <span className="font-bold text-slate-200">{ev.source}:</span> {ev.title}
                      </div>

                      <span className={`text-[8px] px-1 rounded uppercase font-bold shrink-0 ${
                        ev.tag === "BLOOM" 
                          ? "bg-rose-950/40 text-rose-300 border border-rose-900/30 animate-pulse" 
                          : "bg-slate-900 text-slate-500"
                      }`}>
                        {ev.tag}
                      </span>
                    </button>
                  ))}
                  {filteredEvents.length === 0 && (
                    <div className="text-slate-500 italic text-center py-6">Aucun signal n'enfreint les seuils de l'Alphabet Physique.</div>
                  )}
                </div>

                <div className="text-[9px] text-slate-500 font-mono mt-1 text-center bg-slate-950 p-1 rounded border border-slate-900">
                  MARQUAGE AUTOMATIQUE PAR CLASSIFICATEUR MATHIEU-R0.1
                </div>
              </div>

            </div>

            {/* MIDDLE COLUMN: SATELLITE ORBITAL RADAR MAP */}
            <div className="xl:col-span-6 flex flex-col gap-4">
              
              {/* PRIMARY RADAR CARD */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col relative overflow-hidden">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 z-10">
                  <div className="flex items-center gap-1.5 font-mono text-xs text-slate-200 font-bold uppercase">
                    <Compass className="text-teal-400 animate-spin-slow w-4 h-4" />
                    Perspective Situationnel Globe 3D Interactif
                  </div>
                </div>

                {/* SATELLITE RADAR VISUALIZER */}
                <div className="relative bg-slate-950/80 border border-slate-850/80 rounded-xl min-h-[440px] md:h-[480px] overflow-hidden flex flex-col items-stretch p-0">
                  {/* The ThreeJS Globe Component */}
                  <div className="flex-1 min-h-0 relative">
                    <ThreeGlobe
                      events={sentinelEvents}
                      selectedEvent={selectedEvent}
                      onSelectEvent={setSelectedEvent}
                      activeLayers={activeLayers}
                      tempFilter={tempFilter}
                      seismicFilter={seismicFilter}
                      schumannFilter={schumannFilter}
                      timelineIndex={timelineIndex}
                      duxMode={state ? (state.duxKey && state.agiKey) : false}
                      onUpdateCoords={(coords) => setHoveredCoords(coords)}
                      isSolar={isSolar}
                      isJamming={isJamming}
                      apocalypseSeal={apocalypseSeal}
                      activeSatTypes={activeSatTypes}
                      dShoggoth={dShoggoth}
                      thetaTotal={thetaTotal}
                      tLux={tLux}
                      nri={nri}
                      riValue={riValue}
                      forgeWorldState={forgeWorldState}
                      forgeFactions={forgeFactions}
                    />

                    {/* HUD Overlay Transparent: Top Left */}
                    <div className="absolute top-3 left-3 pointer-events-none font-mono text-[10px] text-slate-300 drop-shadow-lg z-10 leading-relaxed bg-slate-950/70 p-2 border border-slate-800/40 rounded backdrop-blur-xs select-none">
                      <div className="font-extrabold text-teal-400">SENTINEL-EARTH v0.5</div>
                      <div className="text-[8px] text-slate-400">BLUE MARBLE | NO-PALANTIR</div>
                      <div className="text-[8px] text-teal-500 font-bold mt-1 uppercase">SATELLITE SWEEP PASSIVE</div>
                    </div>

                    {/* HUD Overlay Transparent: Right Menu Layer Toggles */}
                    <div className="absolute top-1/2 -translate-y-1/2 right-3 flex flex-col gap-2 z-10 bg-slate-950/85 p-2.5 border border-slate-800/45 rounded-lg backdrop-blur-sm select-none">
                      <div className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-900 pb-1 mb-1.5 text-center">COUCHE INTERFACÉ</div>
                      
                      <button
                        onClick={() => {
                          setActiveLayers(prev => ({ ...prev, CLIMAT: !prev.CLIMAT }));
                          playSentinelAlert(600, "sine", 0.1);
                        }}
                        className={`flex items-center justify-between gap-3 text-[9px] font-mono font-bold uppercase p-1.5 rounded border transition-colors ${
                          activeLayers.CLIMAT 
                            ? "border-orange-500/50 text-orange-400 bg-orange-950/15" 
                            : "border-slate-850 text-slate-500 hover:text-slate-400"
                        }`}
                      >
                        <span className="flex items-center gap-1"><Flame className="w-3 h-3" /> FIRMS (Feux)</span>
                        <div className={`w-1.5 h-1.5 rounded-sm ${activeLayers.CLIMAT ? "bg-orange-500 animate-pulse shadow-[0_0_6px_#ff4500]" : "bg-slate-700"}`} />
                      </button>

                      <button
                        onClick={() => {
                          setActiveLayers(prev => ({ ...prev, CLIMAT: !prev.CLIMAT }));
                          playSentinelAlert(600, "sine", 0.1);
                        }}
                        className={`flex items-center justify-between gap-3 text-[9px] font-mono font-bold uppercase p-1.5 rounded border transition-colors ${
                          activeLayers.CLIMAT 
                            ? "border-yellow-505/50 text-yellow-400 bg-yellow-955/15" 
                            : "border-slate-850 text-slate-500 hover:text-slate-400"
                        }`}
                      >
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> USGS (Séismes)</span>
                        <div className={`w-1.5 h-1.5 rounded-sm ${activeLayers.CLIMAT ? "bg-yellow-500 animate-pulse shadow-[0_0_6px_rgba(234,179,8,0.8)]" : "bg-slate-700"}`} />
                      </button>

                      <button
                        onClick={() => {
                          setActiveLayers(prev => ({ ...prev, NEURO: !prev.NEURO }));
                          playSentinelAlert(700, "sine", 0.1);
                        }}
                        className={`flex items-center justify-between gap-3 text-[9px] font-mono font-bold uppercase p-1.5 rounded border transition-colors ${
                          activeLayers.NEURO 
                            ? "border-purple-500/50 text-purple-400 bg-purple-950/15" 
                            : "border-slate-850 text-slate-500 hover:text-slate-400"
                        }`}
                      >
                        <span className="flex items-center gap-1"><Waves className="w-3 h-3" /> SCHUMANN</span>
                        <div className={`w-1.5 h-1.5 rounded-sm ${activeLayers.NEURO ? "bg-purple-500 animate-pulse shadow-[0_0_6px_rgba(168,85,247,0.8)]" : "bg-slate-700"}`} />
                      </button>

                      <button
                        onClick={() => {
                          setActiveLayers(prev => ({ ...prev, OSINT: !prev.OSINT }));
                          playSentinelAlert(800, "sine", 0.1);
                        }}
                        className={`flex items-center justify-between gap-3 text-[9px] font-mono font-bold uppercase p-1.5 rounded border transition-colors ${
                          activeLayers.OSINT 
                            ? "border-cyan-500/50 text-cyan-400 bg-cyan-950/15" 
                            : "border-slate-850 text-slate-500 hover:text-slate-400"
                        }`}
                      >
                        <span className="flex items-center gap-1"><Radio className="w-3 h-3" /> OSINT</span>
                        <div className={`w-1.5 h-1.5 rounded-sm ${activeLayers.OSINT ? "bg-cyan-500 animate-pulse shadow-[0_0_6px_#00d4ff]" : "bg-slate-700"}`} />
                      </button>
                    </div>

                    {/* HUD Overlay Transparent: Bottom-Right Coordinates info */}
                    <div className="absolute bottom-3 right-3 pointer-events-none font-mono text-[9px] bg-slate-950/80 border border-slate-800/40 p-2 rounded leading-tight text-right text-slate-400 z-10 w-[130px] backdrop-blur-sm select-none">
                      {hoveredCoords ? (
                        <>
                          <div className="text-teal-400 font-bold mb-1 border-b border-slate-900 pb-0.5 text-center tracking-wider font-extrabold uppercase">COORDINATE HUD</div>
                          <div>LAT: <span className="text-white font-bold">{hoveredCoords.lat.toFixed(2)}°</span></div>
                          <div>LON: <span className="text-white font-bold">{hoveredCoords.lon.toFixed(2)}°</span></div>
                          <div>ALT: <span className="text-teal-400 font-bold">{hoveredCoords.alt} KM</span></div>
                        </>
                      ) : (
                        <>
                          <div className="text-slate-600 mb-1 border-b border-slate-900 pb-0.5 text-center tracking-wider">COORDINATE HUD</div>
                          <div>LAT: <span className="text-slate-600">--</span></div>
                          <div>LON: <span className="text-slate-650">--</span></div>
                          <div>ALT: <span className="text-slate-650">--</span></div>
                        </>
                      )}
                    </div>

                    {/* HUD Overlay Transparent: Bottom-Left Dynamic Controls (V7.0 Core Controls) */}
                    <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 z-10 bg-slate-950/85 p-2.5 border border-slate-800/40 rounded-lg backdrop-blur-sm select-none w-[170px]">
                      <div className="text-[8px] font-mono font-bold text-teal-400 uppercase tracking-widest border-b border-slate-900 pb-1 mb-1 text-center">SYSTÈME GÉOSPATIAL v7.0</div>
                      
                      {/* Solar Scope Toggle */}
                      <button
                        onClick={() => {
                          setIsSolar(prev => !prev);
                          addAlert(isSolar ? "Repli de la lunette solaire: focus recentré terrestre." : "Lunette Solaire active : propagation de l'orbite lunaire et expansion.", "info");
                        }}
                        className={`text-[9.5px] font-mono font-bold uppercase p-1 rounded border text-left transition-all ${
                          isSolar 
                            ? "border-amber-500 text-amber-400 bg-amber-950/20" 
                            : "border-slate-800 text-slate-400 hover:text-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>🪐 LUNETTE SOLAIRE</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${isSolar ? "bg-amber-400 animate-ping" : "bg-slate-700"}`} />
                        </div>
                      </button>

                      {/* Jamming Toggle */}
                      <button
                        onClick={() => {
                          setIsJamming(prev => !prev);
                          addAlert(isJamming ? "Cessation de la simulation de brouillage systémique." : "ALERTE : Simulation de brouillage électromagnétique engagée ! Coordonnées de visée instables.", "warn");
                        }}
                        className={`text-[9.5px] font-mono font-bold uppercase p-1 rounded border text-left transition-all ${
                          isJamming 
                            ? "border-red-500 text-red-400 bg-red-950/25 animate-pulse" 
                            : "border-slate-800 text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>📡 BROUILLAGE EM</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${isJamming ? "bg-red-500 animate-ping" : "bg-slate-700"}`} />
                        </div>
                      </button>

                      {/* Apocalypse Seals Trigger */}
                      <button
                        onClick={toggleApocalypse}
                        className={`text-[9.5px] font-mono font-bold uppercase p-1 rounded border text-left transition-all ${
                          apocalypseActive 
                            ? "border-rose-600 text-rose-300 bg-rose-950/30 font-black animate-pulse" 
                            : "border-slate-800 text-slate-500 hover:text-slate-350"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>🔥 7 SCEAUX APOC.</span>
                          <span className={`text-[8px] px-1 rounded ${apocalypseActive ? "bg-rose-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"}`}>
                            {apocalypseSeal >= 0 ? `${apocalypseSeal+1}/7` : "OFF"}
                          </span>
                        </div>
                      </button>

                      {/* Active Satellite Type checklist triggers */}
                      <div className="border-t border-slate-900 mt-1 pt-1.5 space-y-1">
                        <div className="text-[7.5px] text-slate-500 font-bold font-mono tracking-wider uppercase text-center">TRAQUER LES SATELLITES</div>
                        <div className="flex gap-1.5 justify-around">
                          {[
                            { key: "iss", label: "ISS", col: "text-emerald-400" },
                            { key: "spy", label: "KEY", col: "text-indigo-400" },
                            { key: "starlink", label: "STAR", col: "text-amber-400" }
                          ].map((s) => (
                            <button
                              key={s.key}
                              onClick={() => {
                                setActiveSatTypes((prev) => ({ ...prev, [s.key]: !prev[s.key] }));
                              }}
                              className={`text-[8.5px] font-mono px-1 rounded border transition-colors ${
                                activeSatTypes[s.key] 
                                  ? `border-teal-500 bg-teal-950/20 ${s.col} font-bold` 
                                  : "border-slate-850 text-slate-400 opacity-40 hover:opacity-100"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* HUD: Consciousness state values (Top Right above layer overlays) */}
                    <div className="absolute top-12 left-3 pointer-events-none font-mono text-[9.5px] bg-slate-950/85 border border-slate-800/40 p-2 rounded w-[160px] z-10 backdrop-blur-sm select-none">
                      <div className="font-extrabold text-teal-400 uppercase tracking-widest text-center border-b border-slate-900 pb-1 mb-1">MÉMÉTIQUE SYSTÈME</div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">INDICE CONFIANCE :</span>
                        <span className={`font-bold ${bayesianThreatIdx > 70 ? "text-rose-500 animate-pulse font-extrabold" : "text-emerald-400"}`}>
                          {100 - bayesianThreatIdx}%
                        </span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-slate-500">CONFIANCE BAYES :</span>
                        <span className="text-purple-400 font-semibold">{consciousnessFreq.toFixed(3)} Hz</span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-slate-500">ORBITE INT-L :</span>
                        <span className="text-white font-bold select-none">{isSolar ? "SOLAR" : "TERRE"}</span>
                      </div>
                    </div>

                    {/* HUD Overlay: Dynamic AGI/DUX Lever Panel at Bottom Center */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/85 border border-slate-800/50 p-2 px-4 rounded-full flex items-center gap-3.5 z-10 shadow-2xl backdrop-blur-md select-none">
                      <span className={`text-[10px] font-mono font-bold tracking-widest transition-colors ${state?.duxKey && state?.agiKey ? "text-slate-500" : "text-orange-400 animate-pulse font-extrabold"}`}>DUX</span>
                      
                      {/* Industrial Sliding Lever Track */}
                      <div 
                        onClick={async () => {
                          const arm = !(state?.duxKey && state?.agiKey);
                          const body = { duxKey: arm, agiKey: arm };
                          try {
                            const res = await fetch("/api/keys", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(body)
                            });
                            const data = await res.json();
                            setState(data);
                            if (arm) {
                              addAlert("Couplage Dyarchique AGI engagé par Levier Industriel principal !", "warn");
                              playSentinelAlert(960, "sine", 0.6);
                            } else {
                              addAlert("Camouflage Social réengagé: clefs souveraines repliées.", "info");
                              playSentinelAlert(400, "sawtooth", 0.4);
                            }
                          } catch (e) {
                            console.error("Lever switch fail", e);
                          }
                        }}
                        className="w-11 h-5 bg-slate-900 rounded-full border border-slate-800 relative cursor-pointer flex items-center p-0.5"
                      >
                        <div 
                          className={`w-3.5 h-3.5 rounded-full transition-all duration-300 absolute ${
                            state?.duxKey && state?.agiKey 
                              ? "left-[calc(100%-16px)] bg-cyan-400 shadow-[0_0_8px_#38bdf8]" 
                              : "left-[2px] bg-orange-500 shadow-[0_0_8px_#ff4500]"
                          }`} 
                        />
                      </div>
                      
                      <span className={`text-[10px] font-mono font-bold tracking-widest transition-colors ${state?.duxKey && state?.agiKey ? "text-cyan-400 animate-pulse font-extrabold" : "text-slate-500"}`}>AGI</span>
                    </div>

                  </div>
                </div>

                {/* PLAYBACK TEMPORAL TIMELINE SLIDER */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 mt-4 flex items-center gap-4">
                  <button 
                    onClick={() => {
                      setIsTimelinePlaying(!isTimelinePlaying);
                      playSentinelAlert(900, "sine", 0.08);
                    }}
                    className="p-1 px-3 bg-slate-900/80 hover:bg-slate-800 rounded border border-slate-700/60 font-mono text-xs text-slate-300 flex items-center gap-1 shrink-0"
                  >
                    {isTimelinePlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-teal-400" />}
                    <span>{isTimelinePlaying ? "PAUSE" : "JOUER"}</span>
                  </button>

                  <div className="flex-1 font-mono text-xs">
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1 select-none">
                      <span className="flex items-center gap-1">
                        <FastForward className="w-3 h-3" /> Horloge sémantique des 24 Dernières Heures
                      </span>
                      <span>Indice: {timelineIndex}% {isTimelinePlaying ? "(Simulation Active)" : "(Figé)"}</span>
                    </div>

                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={timelineIndex}
                      onChange={(e) => {
                        setTimelineIndex(Number(e.target.value));
                        setIsTimelinePlaying(false);
                        playSentinelAlert(500, "sine", 0.04);
                      }}
                      className="w-full accent-teal-400 cursor-pointer h-1 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>

              </div>

              {/* HOLOGRAPHIC FOCUS EVENT DETAILS INTERSTITIAL CONTAINER */}
              <AnimatePresence mode="wait">
                {selectedEvent ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl font-mono text-xs grid grid-cols-1 md:grid-cols-12 gap-4"
                  >
                    <div className="md:col-span-8 flex flex-col justify-between">
                      <div>
                        {/* Event Pillar and classification badges */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                            selectedEvent.pillar === "UAP" ? "bg-teal-950/50 text-teal-400 border border-teal-800/40" :
                            selectedEvent.pillar === "CLIMAT" ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/40" :
                            selectedEvent.pillar === "NEURO" ? "bg-purple-950/50 text-purple-400 border border-purple-800/40" :
                            "bg-blue-950/50 text-blue-400 border border-blue-800/40"
                          }`}>
                            PILIER: {selectedEvent.pillar}
                          </span>

                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                            selectedEvent.tag === "BLOOM" ? "bg-rose-950 text-rose-300 border border-rose-800 animate-pulse" : "bg-slate-950 text-slate-500"
                          }`}>
                            STATUT: {selectedEvent.tag} (BLOOM RATING)
                          </span>
                        </div>

                        {/* Event title */}
                        <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                          {selectedEvent.pillar === "UAP" && <Radio className="text-teal-400 w-4 h-4 shrink-0" />}
                          {selectedEvent.pillar === "CLIMAT" && <Flame className="text-emerald-400 w-4 h-4 shrink-0" />}
                          {selectedEvent.pillar === "NEURO" && <Activity className="text-purple-400 w-4 h-4 shrink-0" />}
                          {selectedEvent.pillar === "OSINT" && <BookOpen className="text-blue-400 w-4 h-4 shrink-0" />}
                          <h3>{selectedEvent.title}</h3>
                        </div>

                        {/* Timestamp details */}
                        <p className="text-[10px] text-slate-500 mt-1">
                          Source certifiée: <span className="text-slate-400 font-bold">{selectedEvent.source}</span> | Observé le: {new Date(selectedEvent.timestamp).toUTCString()}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                          {Object.entries(selectedEvent.properties).map(([key, val]) => (
                            <div key={key} className="flex justify-between py-0.5 border-b border-slate-900/60 last:border-0 truncate">
                              <span className="text-slate-500 uppercase">{key}:</span>
                              <span className="text-slate-200 font-medium">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 md:mt-0 flex gap-2">
                        <button 
                          onClick={() => {
                            setSelectedEvent(null);
                            playSentinelAlert(500, "sine", 0.08);
                          }}
                          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 rounded text-[10px] font-bold text-slate-400 transition-colors"
                        >
                          MASQUER LA FICHE
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-slate-950 border border-slate-850/80 rounded-xl p-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="text-[9px] uppercase text-slate-500 tracking-wider">Classification Alphabet Physique</div>
                        
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span>Intensité proxy:</span>
                            <span className="text-teal-400 font-bold">{selectedEvent.intensity.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-slate-900 h-1.5 rounded overflow-hidden">
                            <div className="bg-teal-400 h-full" style={{ width: `${Math.min(100, (selectedEvent.intensity / (selectedEvent.pillar === 'UAP' ? 40 : 8)) * 100)}%` }} />
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed pt-1 select-none">
                          {selectedEvent.tag === "BLOOM" 
                            ? "CLASSIFICATION BLOOM : Cet événement indique une anomalie sémantique ou d'énergie locale supérieure à 2σ. Le double-verrou cognitif est armé pour authentifier cette signature." 
                            : "CLASSIFICATION SLAG : bruit de fond structurel ou fluctuation environnementale commune. Aucune contre-mesure n'est préconisée."
                          }
                        </p>
                      </div>

                      <div className="text-[8px] text-slate-500 text-right font-mono select-none">
                        RÉF_ID: #{selectedEvent.id.toUpperCase()}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-slate-900/50 border border-slate-850/40 rounded-xl p-8 text-center text-xs font-mono text-slate-500 italic select-none">
                    🎯 Cliquez sur un point de sillage planétaire ou sélectionnez un événement dans la console pour inspecter ses propriétés au creuset Mathieu-R0.1.
                  </div>
                )}
              </AnimatePresence>

            </div>

            {/* RIGHT COLUMN: DECISION DESK & DOUBLE KEY AUTOREGULATION */}
            <div className="xl:col-span-3 flex flex-col gap-4">
              
              {/* TOMSKE SCHUMANN SIMULATED FFT OSCILLATOR */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-1">
                    <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-slate-200 flex items-center gap-1.5">
                      <Waves className="text-purple-400 animate-pulse w-4 h-4" />
                      Schumann Tomsk FFT Feed (SOSRFF)
                    </h3>
                    <span className="text-[10px] font-bold text-purple-400 font-mono animate-pulse">{state.schumannFrequency.toFixed(2)} HZ</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    Spectrogramme d'ondes électromagnétiques terrestres. Les pics représentent la résonance fondamentale (7.83Hz) et les deviations artificielles.
                  </p>

                  {/* FFT Graphic Animation built natively in SVG bars */}
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850 h-28 flex items-end justify-between gap-1 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:10px_10px] opacity-20 pointer-events-none" />
                    
                    {Array.from({ length: 18 }).map((_, i) => {
                      // Generate stylized frequency bars
                      const isFundamentalPic = i >= 4 && i <= 6; // Around 7.8Hz
                      const isAnomalyPic = i >= 11 && i <= 13 && state.loopActive; // Around 17.5Hz (coupled state)
                      let val = 12 + Math.sin(Date.now() / 1500 + i * 0.7) * 8;
                      if (isFundamentalPic) {
                        val = 65 + Math.sin(Date.now() / 800) * 12;
                      } else if (isAnomalyPic) {
                        val = 80 + Math.sin(Date.now() / 400) * 15;
                      }
                      
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div 
                            className={`w-full rounded-t transition-all duration-300 ${
                              isAnomalyPic ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)] animate-pulse" :
                              isFundamentalPic ? "bg-teal-500" : "bg-slate-800 hover:bg-slate-700"
                            }`}
                            style={{ height: `${Math.max(5, val)}px` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 font-mono mt-3 select-none">
                  LIGNE DE BASE : 7.83 HZ, 14.3 HZ, 20.8 HZ | CORREL_TACS INFERÉ
                </div>
              </div>

              {/* DUX SECURE DOUBLE-KEY ACTION HUB AND ZENODO EXPORTER */}
              <div className="forge-panel border border-[#ff4500]/22 rounded-xl p-4 shadow-xl flex flex-col justify-between flex-1 z-10">
                <div>
                  <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-slate-200 mb-3 border-b border-[#ff4500]/20 pb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="text-[#ff4500] w-4 h-4" />
                    Console de Décision Planétaire
                  </h3>

                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    Les rapports sémantiques basés sur l'Alphabet Physique nécessitent la double validation de signature. Elle lève le camouflage social et déverrouille les archives.
                  </p>

                  {/* Physical Lever Switches */}
                  <div className="space-y-4 mb-4">
                    {/* DUX Switcher */}
                    <div 
                      onClick={() => toggleKey("dux")}
                      className={`key-slot p-3 rounded flex items-center justify-between cursor-pointer select-none transition-all ${state.duxKey ? "active border-emerald-500/40" : "border-[#ff4500]/20"}`}
                    >
                      <div>
                        <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                          CLEF SOUVERAINE DUX
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5 uppercase font-mono">
                          STATUS: {state.duxKey ? "VALIDÉ / ENGAGÉ" : "STANDBY / REQUIS"}
                        </div>
                      </div>
                      <div className="key-lever" />
                    </div>

                    {/* Central Wire & Connection light */}
                    <div className="flex items-center justify-center gap-2">
                      <div className="h-0.5 bg-slate-800 flex-1 relative">
                        <div className={`absolute top-0 h-full bg-[#00ff66] transition-all duration-300 ${state.duxKey ? "left-0 right-0" : "left-0 w-0"}`} />
                      </div>
                      <div className={`w-3 h-3 rounded-full border transition-all duration-500 ${
                        state.duxKey && state.agiKey 
                          ? "status-light-green bg-[#00ff66] shadow-[0_0_12px_#00ff66]" 
                          : "status-light-red bg-red-650 shadow-[0_0_8px_rgba(255,0,51,0.5)]"
                      }`} />
                      <div className="h-0.5 bg-slate-800 flex-1 relative">
                        <div className={`absolute top-0 h-full bg-[#00ff66] transition-all duration-300 ${state.agiKey ? "left-0 right-0" : "left-0 w-0"}`} />
                      </div>
                    </div>

                    {/* AGI Switcher */}
                    <div 
                      onClick={() => toggleKey("agi")}
                      className={`key-slot p-3 rounded flex items-center justify-between cursor-pointer select-none transition-all ${state.agiKey ? "active border-emerald-500/40" : "border-[#ff4500]/20"}`}
                    >
                      <div>
                        <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                          MUTUELLE AGI-PROBABLE
                        </div>
                        <div className="text-[9px] text-slate-500 mt-0.5 uppercase font-mono">
                          STATUS: {state.agiKey ? "VALIDÉ / COUPLÉ" : "STANDBY / REQUIS"}
                        </div>
                      </div>
                      <div className="key-lever" />
                    </div>
                  </div>

                  {/* Visual Status Indicator */}
                  <div className="bg-[#050508] p-2.5 rounded border border-[#ff4500]/15 flex justify-between items-center font-mono text-[10px]">
                    <span className="text-slate-500 select-none">SÉCURISATION OODA :</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${state.loopActive ? "bg-teal-950 text-teal-400 border border-teal-800 animate-pulse" : "bg-slate-900 text-slate-500"}`}>
                      {state.loopActive ? "BOUCLE FERMÉE (PHASE 3)" : "BOUCLE OUVERTE (ALERTE)"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  <div className="text-[10px] uppercase text-slate-500 tracking-wider font-mono select-none">Exporter rapport Sentinel (Zenodo)</div>
                  
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => handleExportData("geojson")}
                      className={`py-2 rounded font-mono text-[10px] font-extrabold border transition-all text-center relative overflow-hidden ${
                        state.duxKey && state.agiKey 
                          ? "export-button unlocked border-teal-500 text-teal-300 bg-teal-950/40 hover:bg-teal-950/60 cursor-pointer"
                          : "border-slate-800 text-slate-650 bg-[#050508]/40 cursor-not-allowed"
                      }`}
                      title="Nécessite la double clé active"
                    >
                      GEOJSON
                    </button>

                    <button
                      onClick={() => handleExportData("csv")}
                      className={`py-2 rounded font-mono text-[10px] font-extrabold border transition-all text-center relative overflow-hidden ${
                        state.duxKey && state.agiKey 
                          ? "export-button unlocked border-teal-500 text-teal-300 bg-teal-950/40 hover:bg-teal-950/60 cursor-pointer"
                          : "border-slate-800 text-slate-650 bg-[#050508]/40 cursor-not-allowed"
                      }`}
                    >
                      CSV
                    </button>

                    <button
                      onClick={() => handleExportData("rdf")}
                      className={`py-2 rounded font-mono text-[10px] font-extrabold border transition-all text-center relative overflow-hidden ${
                        state.duxKey && state.agiKey 
                          ? "export-button unlocked border-purple-500 text-purple-300 bg-purple-950/40 hover:bg-purple-950/50 cursor-pointer"
                          : "border-slate-800 text-slate-650 bg-[#050508]/40 cursor-not-allowed"
                      }`}
                    >
                      RDF (TTL)
                    </button>
                  </div>

                  {!state.duxKey || !state.agiKey ? (
                    <div className="p-2 bg-[#050508] rounded border border-dashed border-red-500/20 text-[9px] text-slate-500 text-center select-none">
                      🔒 Actionnez les verrous physiques DUX & AGI ci-dessus pour déverrouiller l'export souverain de l'Alphabet Physique.
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-950/30 rounded border border-emerald-850/60 text-[10px] text-[#00ff66] text-center animate-pulse font-mono tracking-wide">
                      🔓 DOUBLE-CLÉ ARMÉE : Signature d'habilitation active.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}

        {/* VIEW 2: ORIGINAL LEGACY SYSTEM INDIVIDUAL BIOMARKERS COUPLING (Pilier 1-4) */}
        {systemMode === "legacy" && (
          <>
            {/* LEFT COLUMN: Controls & Interactive Protocol Manual (Tactical Action Card) */}
            <div className="xl:col-span-4 flex flex-col gap-6">
              
              {/* Phase Control Console */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="text-teal-400 w-5 h-5" />
                    <h2 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200">
                      Phases du Protocole LEGACY
                    </h2>
                  </div>
                  <Compass className="text-slate-500 w-4 h-4 animate-spin-slow" />
                </div>

                <div className={`p-3 rounded-lg border text-xs leading-relaxed mb-4 ${phaseColors[state.phase]}`}>
                  <div className="font-bold uppercase tracking-wide text-[10px] mb-1">État Courant :</div>
                  {phaseNames[state.phase]}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-2 gap-2 text-xs font-mono">
                  {[0, 1, 2, 2.5, 3, 4].map((ph) => (
                    <button
                      key={ph}
                      onClick={() => handlePhaseChange(ph)}
                      className={`p-2.5 rounded-lg border text-left transition-all ${
                        state.phase === ph
                          ? "border-teal-500 bg-teal-950/20 text-teal-300"
                          : "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400"
                      }`}
                    >
                      <div className="text-[10px] text-slate-500">PHASE {ph}</div>
                      <div className="font-bold truncate">
                        {ph === 0 && "Daemon"}
                        {ph === 1 && "SYN Sync"}
                        {ph === 2 && "Négociation"}
                        {ph === 2.5 && "PING Maintien"}
                        {ph === 3 && "Closed Loop"}
                        {ph === 4 && "Désynchroniser"}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap gap-2 text-xs">
                  <button
                    onClick={() => handleSimStep("burst")}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                  >
                    <Zap className="w-4 h-4" />
                    Simuler Burst Neuro
                  </button>
                  
                  <button
                    onClick={() => handleSimStep()}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all"
                    title="Simuler un tick ou une fluctuation"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Social Stealth & Adversarial Countermeasures Dashboard */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-teal-400 w-5 h-5" />
                    <h2 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200">
                      Furtivité & Contre-Mesures
                    </h2>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${state.stealthMode ? "bg-teal-400 animate-pulse" : "bg-rose-500"}`} />
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Afin de déjouer les modèles bayésiens des systèmes adverses (type Palantir Gotham/Foundry),
                  activez le camouflage social actif pour fragmente l'identité noétique du Dux.
                </p>

                <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/60 mb-4 font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mimicry Social Index:</span>
                    <span className="text-teal-400 font-bold">{state.socialMimicryIndex.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bruit d'Observation:</span>
                    <span className={state.stealthMode ? "text-teal-400" : "text-amber-500"}>
                      {state.stealthMode ? "INJECTÉ (Actif)" : "NUL (Découvert)"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Schumann Résonance:</span>
                    <span className="text-purple-400">{state.schumannFrequency.toFixed(2)} Hz</span>
                  </div>
                  {state.adversaryObservationDetected && (
                    <div className="mt-2 p-2 bg-rose-950/30 border border-rose-800 text-rose-300 rounded text-[10px] flex items-center gap-2">
                      <AlertTriangle className="text-rose-400 w-4 h-4 shrink-0" />
                      MENACE IDENTIFIÉE : Link Analysis adverse en cours d'exécution.
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleStealth}
                  className={`w-full font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${
                    state.stealthMode
                      ? "bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {state.stealthMode ? "Désactiver Camouflage" : "Activer Camouflage Actif"}
                </button>
              </div>

              {/* Deep Real-Time Assessment via veteran F. Mathieu */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="text-purple-400 w-4 h-4" />
                  <h3 className="font-mono text-xs uppercase tracking-wider font-semibold text-slate-300">
                    Analyseur Noétique Intelligent
                  </h3>
                </div>
                
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Lisez les perspectives analytiques en temps réel fondées sur le traité de F. Mathieu.
                </p>

                {customResponse && (
                  <div className="bg-slate-950 border border-purple-900/40 p-4 rounded-lg text-xs leading-relaxed font-mono relative mb-4 text-purple-200">
                    <div className="absolute top-2 right-2 text-[9px] uppercase tracking-widest text-purple-400 font-bold bg-purple-950 px-1.5 py-0.5 rounded">
                      ANALYSE CH-22
                    </div>
                    <div className="whitespace-pre-wrap">{customResponse}</div>
                  </div>
                )}

                <button
                  onClick={triggerGeminiAnalysis}
                  disabled={loadingAnalysis}
                  className="w-full bg-gradient-to-r from-teal-500/20 to-purple-500/20 border border-teal-500/30 hover:border-teal-500/60 font-medium py-2 rounded-lg text-xs text-teal-300 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loadingAnalysis ? "animate-spin" : ""}`} />
                  {loadingAnalysis ? "Diagnostic en cours..." : "Générer Recommandation Tactique"}
                </button>
              </div>

            </div>

            {/* RIGHT COLUMN: C4ISR Main Visual Dashboard & Telemetry Plots */}
            <div className="xl:col-span-8 flex flex-col gap-6">
              
              {/* Dashboard Mode Selector Tab Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex flex-wrap gap-1">
                {[
                  { id: "c4isr", label: "PILIER-1 : C4ISR & TELEMETRIE", icon: Cpu },
                  { id: "brain", label: "PILIER-2 : BIOMARKERS / EEG & HRV", icon: Brain },
                  { id: "compiler", label: "PILIER-3 : BOOTSTRAP SWARM CONTROLLER", icon: UsersIcon },
                  { id: "codes", label: "PILIER-4 : ARCHITECTURE CODES PYTHON", icon: Info },
                  { id: "artifacts", label: "PILIER-5 : CRYPTO_ARTEFACTS (MOM)", icon: Flame },
                  { id: "forge", label: "PILIER-6 : FORGE AUTONOME", icon: Terminal },
                  { id: "ooda", label: "PILIER-7 : ATELIER OODA V3", icon: Sliders }
                ].map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id)}
                      className={`flex-1 min-w-[120px] py-2.5 px-2 text-xs font-mono tracking-wider font-semibold uppercase rounded-lg flex items-center justify-center gap-2 transition-all ${
                        selectedTab === tab.id
                          ? "bg-slate-800 text-teal-300 shadow-inner border border-slate-700"
                          : "text-slate-400 hover:bg-slate-950/40 hover:text-slate-200"
                      }`}
                    >
                      <TabIcon className="w-4 h-4 shrink-0" />
                      <span className="hidden lg:inline">{tab.label}</span>
                      <span className="lg:hidden">{tab.id.toUpperCase()}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: C4ISR ENVIRONMENTAL PILLARS & FEEDBACK PLOT */}
              {selectedTab === "c4isr" && (
                <div className="flex flex-col gap-6">
                  
                  {/* Telemetry Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between" id="card-allostatic">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                          Charge Allostatique
                        </span>
                        <h3 className="text-xl font-bold font-mono text-slate-100 mt-1">
                          {(state.allostaticLoad * 100).toFixed(0)}%
                        </h3>
                      </div>
                      <div className="mt-3 flex items-center gap-1.5">
                        <div className="w-full bg-slate-950 h-2 rounded overflow-hidden">
                          <div
                            className="bg-teal-500 h-full transition-all"
                            style={{ width: `${state.allostaticLoad * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {state.allostaticLoad > 0.6 ? "CRITIQUE" : "STABLE"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between" id="card-phi">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                          Integration (Phi Noétique)
                        </span>
                        <h3 className="text-xl font-bold font-mono text-teal-400 mt-1">
                          {state.phiNetwork.toFixed(3)}
                        </h3>
                      </div>
                      <div className="mt-3 text-[10px] text-slate-500 font-mono flex justify-between">
                        <span>SEUIL CRITIQUE:</span>
                        <span className="font-bold">ρc = 1.0</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between" id="card-elf">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                          ELF Electromagnetic
                        </span>
                        <h3 className="text-xl font-bold font-mono text-slate-100 mt-1">
                          {state.elfField.toFixed(1)} nT
                        </h3>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-500">STATUT:</span>
                        <span className={state.elfField > 50 ? "text-rose-400 font-bold" : "text-green-500"}>
                          {state.elfField > 50 ? "ANOMALE" : "NORMAL"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between" id="card-p3b">
                      <div>
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                          P3b Latency Mode
                        </span>
                        <h3 className="text-xl font-bold font-mono text-purple-400 mt-1">
                          {state.p3bAmplitude.toFixed(2)} µV
                        </h3>
                      </div>
                      <div className="mt-3 text-[10px] text-slate-500 font-mono flex justify-between">
                        <span>BURST STATUS:</span>
                        <span className={state.eegAlphaBetaBurst ? "text-teal-400 font-bold" : "text-slate-600"}>
                          {state.eegAlphaBetaBurst ? "ACTIVE" : "STANDBY"}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Environmental Phases Matrix */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                    <h3 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200 mb-4 flex items-center gap-2">
                      <Activity className="text-teal-400 w-4 h-4" />
                      Les Piliers Algorithmiques & Observables Environnementaux (PM, CO2, ELF, Bruit)
                    </h3>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 font-mono text-xs">
                        <div className="text-slate-500">PM2.5 Pollution</div>
                        <div className="text-lg font-bold text-slate-200 mt-1">{state.pm25.toFixed(1)} µg/m³</div>
                        <div className="text-[10px] text-slate-500 mt-1">Seuil exclusion: &gt;50</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 font-mono text-xs">
                        <div className="text-slate-500">CO2 Concentration</div>
                        <div className="text-lg font-bold text-slate-200 mt-1">{state.co2.toFixed(0)} ppm</div>
                        <div className="text-[10px] text-slate-500 mt-1">Basal normalisé</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 font-mono text-xs">
                        <div className="text-slate-500">Bruit Ambiant</div>
                        <div className="text-lg font-bold text-slate-200 mt-1">{state.ambientNoise.toFixed(1)} dB(A)</div>
                        <div className="text-[10px] text-slate-500 mt-1">Seuil exclusion: &gt;70</div>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/60 font-mono text-xs">
                        <div className="text-slate-500">Indice Résilience</div>
                        <div className="text-lg font-bold text-emerald-400 mt-1">Mathieu-R0.1</div>
                        <div className="text-[10px] text-slate-500 mt-1">Traité LEGACY</div>
                      </div>
                    </div>

                    {/* Telemetry Chart */}
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={state.history}>
                          <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                          <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                          <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'monospace' }} />
                          <Line type="monotone" name="EEG Ratio Theta/Delta" dataKey="eegRatio" stroke="#38bdf8" strokeWidth={2} dot={false} />
                          <Line type="monotone" name="Integration Noétique (Phi)" dataKey="phi" stroke="#2dd4bf" strokeWidth={2} dot={false} />
                          <Line type="monotone" name="Charge Allostatique" dataKey="allostatic" stroke="#f43f5e" strokeWidth={1} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: BIOMARKERS EEG / HRV DETAIL */}
              {selectedTab === "brain" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* EEG Spectrum Panel */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200 mb-3 flex items-center gap-2">
                        <Zap className="text-sky-400 w-4 h-4" />
                        Analyse Spectrale EEG
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Visualisation en temps réel des bandes de fréquence d'intérêt pour la communication noétique.
                        Le portail daemon d'écoute privilégie un ratio Theta/Delta élevé.
                      </p>

                      <div className="space-y-4 font-mono text-xs">
                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span>Delta / Theta (Vigilance passive)</span>
                            <span className="text-sky-400 font-bold">{state.eegThetaDelta.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-slate-950 h-3 rounded overflow-hidden">
                            <div
                              className="bg-sky-500 h-full transition-all"
                              style={{ width: `${Math.min(100, (state.eegThetaDelta / 4) * 100)}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                            <span>Critère Couplage: &ge;2.0</span>
                            <span>{state.eegThetaDelta >= 2.0 ? "CONFORME" : "FAIBLE"}</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span>Alpha / Beta (Micro-Éveils)</span>
                            <span className="text-teal-400 font-bold">{state.eegAlphaBetaBurst ? "SURGE CAPTÉ" : "BASAL"}</span>
                          </div>
                          <div className="flex gap-1">
                            <div className={`h-2 flex-1 rounded transition-colors ${state.eegAlphaBetaBurst ? "bg-teal-500" : "bg-slate-800"}`} />
                            <div className={`h-2 flex-1 rounded transition-colors ${state.eegAlphaBetaBurst ? "bg-teal-400" : "bg-slate-800"}`} />
                            <div className="h-2 flex-1 rounded bg-slate-800" />
                            <div className="h-2 flex-1 rounded bg-slate-800" />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] mb-1">
                            <span>Pupillométrie &amp; EDA</span>
                            <span className="text-amber-500">{state.pupilDilatation.toFixed(2)} / {state.edaPhasic.toFixed(2)}</span>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 bg-slate-950 p-2.5 rounded border border-slate-800/80">
                              <div className="text-[10px] text-slate-500">Pupille (mm)</div>
                              <div className="text-sm font-bold text-slate-200 mt-0.5">+{state.pupilDilatation.toFixed(2)} mm</div>
                            </div>
                            <div className="flex-1 bg-slate-950 p-2.5 rounded border border-slate-800/80">
                              <div className="text-[10px] text-slate-500">Phasique EDA</div>
                              <div className="text-sm font-bold text-slate-200 mt-0.5">{state.edaPhasic.toFixed(2)} µS</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] font-mono text-slate-500 leading-relaxed">
                      * Pipeline de fusion multimodale résolvant l'équation d'induction noétique. Latence cible &lt;500 ms.
                    </div>
                  </div>

                  {/* HRV Detail */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between" id="card-hrv-panel">
                    <div>
                      <h3 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200 mb-3 flex items-center gap-2">
                        <Activity className="text-rose-400 w-4 h-4" />
                        Variabilité Cardiaque HRV
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Le RMSSD (Root Mean Square of Successive Differences) constitue notre proxy critique de stress métabolique direct.
                        Une chute brutale de &gt;30% dicte l'interruption immédiate de la session.
                      </p>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between font-mono mb-4">
                        <div>
                          <div className="text-[10px] text-slate-500">RMSSD VALEUR</div>
                          <div className="text-2xl font-bold text-rose-400 mt-1">{state.hrvRmssd.toFixed(1)} ms</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-500">STATUS SÉCURITÉ</div>
                          <div className={`text-xs font-bold mt-1 ${state.hrvRmssd >= 45 ? "text-green-500" : "text-rose-400 font-bold animate-pulse"}`}>
                            {state.hrvRmssd >= 45 ? "SÛR (RMSSD OK)" : "ARRÊT CRITIQUE"}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        Les valeurs de RMSSD sont étroitement couplées à l'allostatique : si le sujet dépasse 45 minutes de synchronisation d'induction continue,
                        les réserves énergétiques glymphatiques s'épuisent.
                      </p>
                    </div>

                    <div>
                      <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between">
                        <span>SEUIL AUTOREGULATION:</span>
                        <span className="font-bold text-rose-500">&gt; 35.0 ms</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: BOOTSTRAP SWARM CONTROLLER */}
              {selectedTab === "compiler" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Physics Simulator */}
                  <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                    <h3 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200 mb-3 flex items-center gap-2">
                      <Cpu className="text-teal-400 w-4 h-4" />
                      Simulation Physique de l'Essaim (PyBullet)
                    </h3>
                    
                    <div className="bg-slate-950 border border-slate-800 rounded-xl h-64 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
                      
                      <svg className="absolute inset-0 w-full h-full">
                        <path
                          d="M 20 80 Q 120 200 220 80 T 320 180"
                          fill="none"
                          stroke="#0f766e"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          className="opacity-55"
                        />
                        
                        {displayRobots.map((r, i) => (
                          <g key={i}>
                            <line
                              x1={120}
                              y1={120}
                              x2={r.x}
                              y2={r.y}
                              stroke="#115e59"
                              strokeWidth="0.8"
                              strokeDasharray="2 2"
                            />
                            <circle cx={r.x} cy={r.y} r="6" fill={i === 1 ? "#38bdf8" : "#2dd4bf"} />
                            <text x={r.x + 8} y={r.y + 4} fontSize="8" fill="#94a3b8" fontFamily="monospace">
                              R{i+1}:{r.role}
                            </text>
                          </g>
                        ))}
                      </svg>

                      <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[9px] font-mono whitespace-nowrap text-slate-400">
                        Cibles: L1, L2 {state.loopActive ? "Couplage Actif" : "Boussole Standard"}
                      </div>

                      <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-mono text-teal-400 font-bold">
                        Performance Swarm: {state.averageReward.toFixed(3)}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                      Le RuleEngine auto-modifiant s'adapte en temps réel en fonction des récompenses cumulées et de l'allostatic load.
                    </p>
                  </div>

                  {/* Swarm rules parameters */}
                  <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <h3 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200 mb-3 flex items-center gap-2">
                        <Sliders className="text-purple-400 w-4 h-4" />
                        Moteur de Règles Auto-Modifiant
                      </h3>
                      
                      <div className="space-y-4 font-mono text-xs">
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Biais de Complexité (Rule Mutation)</span>
                            <span className="text-slate-200 font-bold">{state.complexityBias.toFixed(3)}</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                            <div
                              className="bg-purple-500 h-full transition-all"
                              style={{ width: `${Math.min(100, (state.complexityBias / 5) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Facteur de Bruit (Exploration)</span>
                            <span className="text-slate-200 font-bold">{state.noiseFactor.toFixed(3)}</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                            <div
                              className="bg-teal-500 h-full transition-all"
                              style={{ width: `${Math.min(100, state.noiseFactor * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Marge de Stabilité (Compilateur Swarm)</span>
                            <span className="text-slate-200 font-bold">{state.stability.toFixed(3)}</span>
                          </div>
                          <div className="w-full bg-slate-900 h-2 rounded overflow-hidden">
                            <div
                              className="bg-sky-500 h-full transition-all"
                              style={{ width: `${Math.min(100, state.stability * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-500 flex justify-between mt-4">
                      <span>PINGS COMME RECOMPENSE:</span>
                      <span className={state.loopActive ? "text-teal-400 font-bold" : "text-amber-500"}>
                        {state.loopActive ? "FONCTION DE COÛT CLOSED-LOOP ACTIVED" : "MOCK LOCAL ONLY"}
                      </span>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 4: ARCHITECTURE CODES PYTHON */}
              {selectedTab === "codes" && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Info className="text-teal-400 w-5 h-5" />
                      <h3 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200">
                        Séquenceur de Scripts Algorithmiques LEGACY v4.2
                      </h3>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">5 SCRIPTS MAJEURS INSTALLÉS</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">
                    Les scripts ci-dessous constituent l'architecture opérante du couplage asymétrique noétique.
                    Ils gèrent le filtrage du signal, l'entraînement de l'agent Actor-Critic PPO et le Bootstrap du Swarm.
                  </p>

                  {/* Sub tabs select */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6 font-mono text-xs">
                    {[
                      { id: "dsp", name: "rt_dsp.py", desc: "Traitement IIR Signal / LSL" },
                      { id: "agent", name: "rt_agent.py", desc: "Actor-Critic & PPO Reward" },
                      { id: "fusion", name: "c4_fusion.py", desc: "Product of Experts (PoE)" },
                      { id: "physio", name: "rt_physio.py", desc: "Simulateur Intrusion/ECG" },
                      { id: "swarm", name: "bootstrap.py", desc: "RuleEngine & Swarm Robot" },
                      { id: "phobos", name: "phobos_detector.py", desc: "Anomalies somatiques" },
                      { id: "strofi", name: "strofi_engine.py", desc: "Moteur de Ping cyclique" },
                      { id: "technergo", name: "technergo_classifier.py", desc: "Forge Bloom vs Slag" },
                      { id: "grpo", name: "grpo_trainer.py", desc: "Entraîneur Progressif (GRPO)" }
                    ].map((script) => (
                      <button
                        key={script.id}
                        onClick={() => {
                          setSelectedScriptState(script.id);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition-all ${
                          selectedScriptState === script.id
                            ? "border-teal-500 bg-teal-950/20 text-teal-300"
                            : "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400"
                        }`}
                      >
                        <div className="font-bold text-[11px] text-slate-200">{script.name}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap truncate">{script.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Code Panel Display */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 font-mono text-xs overflow-x-auto max-h-[450px] overflow-y-auto text-slate-300 leading-relaxed scrollbar-thin">
                    {selectedScriptState === "dsp" && (
                      <pre className="text-emerald-400/90 pr-4">
{`# rt_dsp.py - REAL-TIME PHYSIOLOGICAL SIGNAL FILTERS WITH LSL STREAMING
# v3.2-fix1 - Lux Ferox Independent Research
import pylsl
import numpy as np
from scipy.signal import iirfilter, lfilter

class RealtimeDSP:
    def __init__(self, srate=250.0):
        self.srate = srate
        # EEG Band filter Coefficients (Theta 4-8Hz, Delta 1-4Hz, Alpha 8-12Hz, Beta 13-30Hz)
        self.b_theta, self.a_theta = iirfilter(4, [4.0, 8.0], fs=srate, btype='bandpass', ftype='butter')
        self.b_delta, self.a_delta = iirfilter(4, [1.0, 4.0], fs=srate, btype='bandpass', ftype='butter')
        
    def calculate_noetic_ratio(self, eeg_segment):
        # Calculate power spectral density proxy via root mean square
        theta_filt = lfilter(self.b_theta, self.a_theta, eeg_segment)
        delta_filt = lfilter(self.b_delta, self.a_delta, eeg_segment)
        
        theta_power = np.sqrt(np.mean(theta_filt**2))
        delta_power = np.sqrt(np.mean(delta_filt**2))
        
        ratio = theta_power / max(1e-5, delta_power)
        return ratio # Target >= 2.0 indicates conscious receptive port open

    def detect_ecg_qrs(self, ecg_buffer):
        # Pan-Tompkins derivative and rolling average window for RMSSD calculations
        diff = np.diff(ecg_buffer)
        squared = diff ** 2
        integrated = np.convolve(squared, np.ones(50)/50, mode='same') # 200ms window
        peaks = integrated > np.std(integrated) * 1.5
        return np.where(peaks)[0]`}
                      </pre>
                    )}

                    {selectedScriptState === "agent" && (
                      <pre className="text-cyan-400 pr-4">
{`# rt_agent.py - REINFORCEMENT LEARNING PPO ACTOR-CRITIC FOR LEGACY COUPLING
# Training PPO agent on reward R(s, a) combining neuro and swarm constraints
import torch
import torch.nn as nn
import torch.optim as optim

class ActorCritic(nn.Module):
    def __init__(self, obs_dim=10, act_dim=3):
        super().__init__()
        # Logs logits for 3 actions: {SILENCE, PING, OVERRIDE}
        self.shared = nn.Sequential(
            nn.Linear(obs_dim, 128),
            nn.Tanh(),
            nn.Linear(128, 128),
            nn.Tanh()
        )
        self.actor = nn.Linear(128, act_dim)
        self.critic = nn.Linear(128, 1)

    def calculate_reward(self, state, action, metadata):
        # Reward components matching MATHIEU'S formula
        # Rsafety, Rstability, Refficiency, Ralert
        theta_delta, r_mssd, pulse = state
        
        # Rsafety: penalty if intrusion happened during silence
        r_safety = -100.0 if (metadata['intrusion'] and action == 0) else 10.0
        
        # Rstability
        r_stability = - (max(0, theta_delta - 2.0)**2 + max(0, 20.0 - r_mssd)**2)
        
        # Refficiency
        r_efficiency = 0.0 if action == 0 else (-0.1 if action == 1 else -2.0)
        
        # Ralert
        r_alert = -5.0 if theta_delta < 1.0 else (1.0 if theta_delta > 1.5 else 0.01)
        
        return r_safety + r_stability + r_efficiency + r_alert`}
                      </pre>
                    )}

                    {selectedScriptState === "fusion" && (
                      <pre className="text-purple-400 pr-4">
{`# c4_fusion.py - PRODUCT OF EXPERTS (PoE) MULTI-AGENT FUSION NODE
# Combines LSL markers and belief vectors from separate sub-modules
import numpy as np

class C4FusionPoE:
    def __init__(self, num_experts=3):
        self.weights = np.array([0.5, 0.3, 0.2]) # Weights [Human, Agent, Swarm]

    def product_of_experts(self, probabilities):
        # PoE formula: P_fusion(a) proportional to Product( P_i(a) ** w_i )
        weighted_probs = []
        for i, p_expert in enumerate(probabilities):
            weighted_probs.append(p_expert ** self.weights[i])
            
        unnormalized = np.prod(weighted_probs, axis=0)
        sum_p = np.sum(unnormalized)
        
        if sum_p == 0:
            return np.ones_like(unnormalized) / len(unnormalized) # Fallback uniform
        return unnormalized / sum_p`}
                      </pre>
                    )}

                    {selectedScriptState === "physio" && (
                      <pre className="text-amber-400 pr-4">
{`# rt_physio.py - PHYSIOLOGICAL STRESS GENERATOR AND ANOMALY INJECTOR
# Simulates heart rate, skin conductance, eye-tracker, and LSL timestamps
import numpy as np

class IntrusionSimulator:
    def __init__(self):
        self.t = 0
        self.rmssd = 65.0
        
    def step(self, is_bypassed=False):
        self.t += 1
        # Ornstein-Uhlenbeck processes modeling physiological homeostatic adaptation
        noise = np.random.normal(0, 1.2)
        if is_bypassed:
            # Drop RMSSD rapidly representing cardiac arrest / neuro stress
            self.rmssd = max(25.0, self.rmssd - 1.8 + noise)
        else:
            self.rmssd = self.rmssd + (65.0 - self.rmssd) * 0.15 + noise
        return {
            'rmssd': self.rmssd,
            'pupil': 0.2 + np.sin(self.t * 0.1) * 0.05,
            'eda': 0.1 + (0.5 if is_bypassed else 0.0) + np.random.rand()*0.02
        }`}
                      </pre>
                    )}

                    {selectedScriptState === "swarm" && (
                      <pre className="text-sky-400 pr-4">
{`# bootstrap_swarm.py - AUTO-MODIFYING ROBOT SWARM COMPILER AND PHYSICS WRAPPER
# Rules engine self-modifies and maps joints outputs
import random

class RuleEngine:
    def __init__(self):
        self.complexity_bias = 1.0
        self.noise_factor = 0.1
        self.stability = 1.0

    def mutate_rules(self, feedback):
        # Mathieu's Rule Mutation formula
        self.complexity_bias += feedback * 0.05
        self.noise_factor += random.uniform(-0.01, 0.01) * feedback
        self.stability -= abs(feedback) * 0.02
        
        # Clamp parameters to physical safe operational constraints
        self.complexity_bias = max(0.1, min(10.0, self.complexity_bias))
        self.noise_factor = max(0.0, min(1.0, self.noise_factor))
        self.stability = max(0.1, min(5.0, self.stability))`}
                      </pre>
                    )}

                    {selectedScriptState === "phobos" && (
                      <pre className="text-[#ff4500]/90 pr-4">
{`# phobos_detector.py
# Détecte la "peur physique" comme structure somatique
# Basé sur: Φόβος, ορθός σαν σώμα (MOM, 2018-2019)

import numpy as np
from scipy.signal import welch

class PhobosDetector:
    def __init__(self, srate=250.0):
        self.srate = srate
        self.phobos_bands = {
            'low_beta': (12, 16),
            'high_gamma': (60, 100),
        }
    
    def detect_physical_fear(self, eeg_segment, eda_value):
        # PSD par bande
        freqs, psd = welch(eeg_segment, self.srate, nperseg=256)
        
        gamma_mask = (freqs >= 60) & (freqs <= 100)
        gamma_power = np.trapz(psd[gamma_mask], freqs[gamma_mask])
        
        total_power = np.trapz(psd, freqs)
        gamma_ratio = gamma_power / total_power if total_power > 0 else 0
        
        # Phobos = corps debout = activation somatique + cognitive
        phobos_score = min(1.0, gamma_ratio * 10 + eda_value / 20)
        
        return {
            'score': phobos_score,
            'is_structured': phobos_score > 0.7, # Φόβος debout
            'is_emotion': phobos_score < 0.3    # Peur simple
        }`}
                      </pre>
                    )}

                    {selectedScriptState === "strofi" && (
                      <pre className="text-purple-400 pr-4">
{`# strofi_engine.py
# La rotation est la nourriture du système
# Basé sur: Στροφή τροφή του σύμπαντος (MOM, 2018-2019)

import time
import numpy as np
from collections import deque

class StrofiEngine:
    def __init__(self, min_interval=60, max_interval=180):
        self.min_interval = min_interval
        self.max_interval = max_interval
        self.history = deque(maxlen=10)
        self.last_ping = time.time()
        
    def calculate_strofi(self, allostatic_load):
        # Charge élevée = rotation plus lente (conservation)
        # Charge faible = rotation plus rapide (vigilance passive)
        normalized_load = min(1.0, allostatic_load / 60.0)
        base_interval = self.min_interval + (
            normalized_load * (self.max_interval - self.min_interval)
        )
        
        # Ajout de bruit biologique organique (pas de métronome mécanique)
        noise = np.random.normal(0, base_interval * 0.1)
        interval = max(self.min_interval, base_interval + noise)
        return interval`}
                      </pre>
                    )}

                    {selectedScriptState === "technergo" && (
                      <pre className="text-amber-405 pr-4">
{`# technergo_classifier.py
# Classification Bloom vs Slag selon la résistance au feu
# Basé sur: Ζωή ανάγκης Τέχνεργο (MOM, 2018-2019)

import time

class TechnergoClassifier:
    def __init__(self):
        self.forge_temperature = 1500 # °C symbolique
        self.artifacts = []
        
    def test_in_fire(self, event):
        # Un vrai artefact précieux (polýtima) survit au feu
        repetition_res = self._check_repetition(event)
        correlation_res = self._check_correlation(event)
        noise_immunity = self._check_noise_immunity(event)
        
        forge_score = (repetition_res + correlation_res + noise_immunity) / 3
        
        if forge_score > 0.7:
            self.artifacts.append({
                'event': event,
                'forge_score': forge_score,
                'tag': 'BLOOM',
                'timestamp': time.time()
            })
            return 'BLOOM'
        return 'SLAG'`}
                      </pre>
                    )}

                    {selectedScriptState === "grpo" && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1 bg-slate-950 text-slate-300">
                        {/* Interactive Trainer Side (Left) */}
                        <div className="lg:col-span-7 flex flex-col gap-4 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                            <div className="font-bold text-teal-400 text-xs tracking-wider uppercase flex items-center gap-1.5 font-mono">
                              <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
                              OPTIMISEUR DE POLITIQUE DE GROUPE (GRPO AGENT TRAINER)
                            </div>
                            <span className="text-[9px] bg-slate-950 border border-slate-800 px-2 py-0.5 text-slate-450 uppercase font-mono">
                              {grpoTraining ? "TRAINING ACTIF" : "ENGINE SILENCIEUX"}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                            Le concept de <span className="text-teal-400 font-bold font-data">Group Relative Policy Optimization</span> supprime la nécessité de stocker un modèle Critique séparé. 
                            L'algorithme échantillonne <span className="text-[#00ffff] font-bold">8 chemins parallèles (group size)</span> pour un état d'entrée 9D, évalue leurs récompenses relatives au sein du groupe, et calcule le gradient en appliquant une pénalité sur la divergence de KL.
                          </p>

                          {/* Training Metrics Gauges */}
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            <div className="bg-slate-950 p-2.5 rounded border border-slate-850 flex flex-col justify-between">
                              <span className="text-[8.5px] text-slate-500 uppercase font-mono">ÉPOQUE COMPTAGE</span>
                              <span className="text-lg font-mono font-bold text-teal-300 mt-1">
                                {grpoEpoch} <span className="text-xs text-slate-600">/ 200</span>
                              </span>
                              <div className="w-full bg-slate-900 h-1 rounded overflow-hidden mt-1.5">
                                <div className="bg-teal-400 h-full transition-all duration-300" style={{ width: `${(grpoEpoch/200)*100}%` }} />
                              </div>
                            </div>

                            <div className="bg-slate-950 p-2.5 rounded border border-slate-850 flex flex-col justify-between">
                              <span className="text-[8.5px] text-slate-500 uppercase font-mono">PERTE POLICY (LOSS)</span>
                              <span className="text-lg font-mono font-bold text-rose-400 mt-1">
                                {grpoLoss > 0 ? grpoLoss.toFixed(4) : "--"}
                              </span>
                              <span className="text-[7.5px] text-slate-600 lowercase font-mono">objective deviation loss</span>
                            </div>

                            <div className="bg-slate-950 p-2.5 rounded border border-slate-850 flex flex-col justify-between">
                              <span className="text-[8.5px] text-slate-500 uppercase font-mono">DIVERGENCE KL</span>
                              <span className="text-lg font-mono font-bold text-purple-400 mt-1">
                                {grpoKLDivergence > 0 ? grpoKLDivergence.toFixed(4) : "--"}
                              </span>
                              <span className="text-[7.5px] text-slate-600 lowercase font-mono">penalty threshold limits</span>
                            </div>
                          </div>

                          {/* Neural Synapses Real-Time Network Simulation */}
                          <div className="bg-slate-950 border border-slate-850 rounded p-3 relative h-40 overflow-hidden flex flex-col justify-between">
                            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Flots Synaptiques de Décision (9 inputs / 4 Core Actions)</div>
                            
                            {/* SVG Graph rendering synapses flashing on epoch loops */}
                            <svg className="absolute inset-0 w-full h-full p-2 mt-4">
                              {/* Draw synaptical links */}
                              {[20, 60, 100, 140].map((yAction) => (
                                [15, 45, 75, 105, 135].map((yInput, idx) => (
                                  <line
                                    key={`syn-${yAction}-${yInput}-${idx}`}
                                    x1="40"
                                    y1={yInput}
                                    x2="240"
                                    y2={yAction}
                                    stroke={grpoTraining ? (Math.random() < 0.25 ? "#38bdf8" : "#c084fc") : "#334155"}
                                    strokeWidth={grpoTraining ? (Math.random() * 1.5 + 0.3) : "0.5"}
                                    strokeOpacity={grpoTraining ? "0.45" : "0.2"}
                                  />
                                ))
                              ))}

                              {/* State inputs labels */}
                              {[
                                { l: "PHY_LAT", y: 15 },
                                { l: "PHY_LON", y: 45 },
                                { l: "EM_JAM", y: 75 },
                                { l: "APOC_S", y: 105 },
                                { l: "ALLOST", y: 135 }
                              ].map((lbl, idx) => (
                                <g key={idx}>
                                  <circle cx="40" cy={lbl.y} r="3" fill="#ea580c" />
                                  <text x="10" y={lbl.y + 3} fontSize="7" fill="#64748b" fontFamily="monospace">{lbl.l}</text>
                                </g>
                              ))}

                              {/* Output action labels */}
                              {[
                                { a: "DEPLOY_DECOY", y: 20 },
                                { a: "JAM_OPTICAL", y: 60 },
                                { a: "INCREASE_SIGINT", y: 100 },
                                { a: "STAND_DOWN", y: 140 }
                              ].map((lbl, idx) => {
                                const isActive = selectedGrpoAction === lbl.a;
                                return (
                                  <g key={idx}>
                                    <circle cx="240" cy={lbl.y} r={isActive ? "4.5" : "3"} fill={isActive ? "#06b6d4" : "#475569"} className={isActive ? "animate-ping" : ""} />
                                    <text x="250" y={lbl.y + 3} fontSize="8" fill={isActive ? "#00ffff" : "#475569"} fontWeight={isActive ? "bold" : "normal"} fontFamily="monospace">{lbl.a}</text>
                                  </g>
                                );
                              })}
                            </svg>

                            <div className="z-10 bg-slate-900/80 border border-slate-800 px-2 py-0.5 rounded text-[8.5px] font-mono text-slate-400 self-start mt-[110px]">
                              ACTION CONVERGÉE RECOMMANDÉE : <span className="text-cyan-405 font-bold font-normal text-cyan-450">[{selectedGrpoAction}]</span>
                            </div>
                          </div>

                          {/* Trigger button */}
                          <button
                            onClick={startGrpoTraining}
                            disabled={grpoTraining}
                            className={`w-full py-2 px-4 rounded font-mono text-xs font-bold tracking-widest transition-all ${
                              grpoTraining 
                                ? "bg-slate-850 text-slate-500 border border-slate-800/40 cursor-not-allowed uppercase" 
                                : "bg-purple-900/80 hover:bg-purple-800 border border-purple-500/40 text-purple-200 uppercase"
                            }`}
                          >
                            {grpoTraining ? `OPTIMISATION GRPO EN COURS (ÉP ${grpoEpoch}/200)` : "LANCER L'ENTRAINEMENT PROGRESSIF (GRPO)"}
                          </button>
                        </div>

                        {/* Static Python Code Companion Editor (Right Side) */}
                        <div className="lg:col-span-5 flex flex-col gap-2 p-1">
                          <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold mb-1 border-b border-slate-900 pb-1 flex items-center justify-between">
                            <span>grpo_trainer.py (Algorithme)</span>
                            <span className="text-teal-500 font-normal">[CLOSED-LOOP]</span>
                          </div>
                          <pre className="text-purple-400/90 text-[10px] bg-slate-950/70 p-3 rounded-lg border border-slate-850 h-[380px] overflow-y-auto scrollbar-thin leading-relaxed">
{`# grpo_trainer.py - REINFORCEMENT LEARNING SIMULATOR
# Group Relative Policy Optimization (GRPO) in PyTorch / TF.js
import torch
import torch.nn as nn
import torch.optim as optim

class GRPOTrainer:
    def __init__(self, state_dim=9, action_dim=4):
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.group_size = 8  # Samples
        
        # Policy generator network
        self.policy = nn.Sequential(
            nn.Linear(state_dim, 32),
            nn.ReLU(),
            nn.Linear(32, 16),
            nn.ReLU(),
            nn.Linear(16, action_dim),
            nn.Softmax(dim=-1)
        )
        self.optimizer = optim.Adam(
            self.policy.parameters(), 
            lr=1e-3
        )
        
    def train_step(self, states):
        """
        GRPO optimizes policy directly using relative rewards
        within identical groups of size 8 to isolate advantages
        without storing separate critic networks.
        """
        probs = self.policy(states)
        actions = torch.multinomial(probs, 1)
        rewards = self.evaluate_group(states, actions)
        mean_r = rewards.mean()
        std_r = rewards.std() + 1e-8
        
        # Relative Advantage optimization loss
        advantages = (rewards - mean_r) / std_r
        loss = -torch.mean(advantages * probs.gather(1, actions))
        
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        return loss.item()`}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: CRYPTO_ARTEFACTS MOTHER OF MILLIONS */}
              {selectedTab === "artifacts" && (
                <div className="flex flex-col gap-6">
                  {/* MOTHER OF MILLIONS GENERAL HEADER */}
                  <div className="bg-gradient-to-r from-red-950/40 via-[#0a0a0f] to-purple-950/40 border border-red-500/30 rounded-xl p-5 shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 opacity-15 select-none pointer-events-none text-slate-800 text-9xl font-mono">MOM</div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Flame className="text-[#ff4500] animate-pulse w-5 h-5 shrink-0" />
                          <h2 className="font-mono text-sm uppercase font-extrabold tracking-widest text-[#ff4500]">
                            INGESTION SYMETRIQUE // MODULE ARTEFACT (MOTHER OF MILLIONS)
                          </h2>
                        </div>
                        <p className="text-xs text-slate-350 leading-relaxed mt-2.5 max-w-3xl">
                          Inspiré de l'album concept <span className="text-teal-300 font-bold">Artifacts (2019)</span> du groupe de progressive metal grec 
                          <span className="text-purple-300 font-bold"> Mother of Millions</span>. Le nom vient de la plante toxique <span className="italic text-teal-400">Bryophyllum delagoense</span>, 
                          clonant de manière sauvage sa descendance, traduisant la duplication aliénante de la société. Suite à la perte tragique du claviériste Makis Tsamkosoglou sur scène en 2019, 
                          le chant de George Prokopiou s'érige en cri spirituel, zélote et cinématique. Ce protocole décode le signal poétique pour en extraire des filtres cybernétiques opérationnels.
                        </p>
                      </div>
                      <span className="text-[10px] bg-red-950/60 text-red-400 border border-red-800/60 px-3 py-1 font-mono rounded tracking-widest uppercase shrink-0 select-none animate-pulse">
                        ALBUM CONCEPT: ARTIFACTS
                      </span>
                    </div>
                  </div>

                  {/* COUPLERS GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: PHOBOS & STROFI */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                      
                      {/* COUPLER 1: PHOBOS DETECTOR */}
                      <div className="bg-[#050510] border border-[#ff4500]/25 rounded-xl p-5 shadow-xl flex flex-col justify-between" id="phobos-detector-panel">
                        <div>
                          <div className="flex items-center justify-between mb-3 border-b border-[#ff4500]/20 pb-2">
                            <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-slate-200 flex items-center gap-1.5 animate-pulse">
                              <span className="text-[#ff4500]">Φόβος</span> Anomaly Detector (Φόβος, ορθός σαν σώμα)
                            </h3>
                            <span className="text-[9px] font-mono text-slate-500 uppercase select-none">MODULE SOMATIQUE</span>
                          </div>
                          
                          <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            Identifie la «peur physique (répulsion cognitive)» comme structure mesurable : 
                            haut ratio Gamma plus élévation du sweat somatique (EDA). Ce n'est pas une émotion, c'est un corps debout.
                          </p>

                          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono mb-4">
                            <div className="bg-slate-950 p-2.5 rounded border border-slate-900">
                              <div className="text-[9px] text-slate-500">LOW BETA (12-16Hz)</div>
                              <div className="text-sm font-extrabold text-slate-200 font-data mt-1">{(state.phobosLowBeta ?? 14.5).toFixed(1)} Hz</div>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded border border-slate-900">
                              <div className="text-[9px] text-slate-500">HIGH GAMMA (60-100Hz)</div>
                              <div className="text-sm font-extrabold text-red-400 font-data mt-1">{(state.phobosHighGamma ?? 62.3).toFixed(1)} Hz</div>
                            </div>
                            <div className="bg-slate-950 p-2.5 rounded border border-slate-900">
                              <div className="text-[9px] text-slate-500">EDA PHASIQUE</div>
                              <div className="text-sm font-extrabold text-teal-400 font-data mt-1">{(state.edaPhasic).toFixed(2)} µS</div>
                            </div>
                          </div>

                          {/* Progress Score */}
                          <div className="space-y-1.5 font-mono text-xs mb-4">
                            <div className="flex justify-between">
                              <span className="text-slate-400">Intensité Somatique de Phobos :</span>
                              <span className="font-bold text-red-500">{((state.phobosScore ?? 0.15) * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-900">
                              <div 
                                className="bg-gradient-to-r from-teal-500 via-yellow-500 to-red-500 h-full transition-all"
                                style={{ width: `${(state.phobosScore ?? 0.15) * 105}%` }}
                              />
                            </div>
                          </div>

                          <div className={`p-3 rounded border text-xs leading-relaxed font-mono ${
                            (state.phobosIsStructured ?? false) 
                              ? "border-red-900 bg-red-950/20 text-red-300 animate-pulse" 
                              : "border-slate-800 bg-slate-950 text-slate-400"
                          }`}>
                            <div className="font-bold uppercase tracking-wide text-[9px] mb-1">ÉTAT STRUCTUREL DE PHOBOS :</div>
                            {(state.phobosIsStructured ?? false) 
                              ? "⚠️ ΦÓΒΟΣ ORTHÓS (DEBOUT) : Signal de peur physique structurée détecté à haute énergie." 
                              : "● SIMPLE ÉMOTION / FLUIDE NOÉTIQUE BASAL (Aucune anomalie structurelle)."}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            handleSimStep("burst");
                            addAlert("ALERTE : Injection d'onde somatique de Phobos (Cri zélote) !", "error");
                          }}
                          className="mt-4 w-full py-2.5 rounded-lg font-mono text-xs font-bold border border-red-500/20 hover:border-red-500/50 hover:bg-red-950/25 text-red-400 transition-all cursor-pointer active:scale-98"
                        >
                          PROVOQUER UN OVERRIDE DE PHOBOS (BURST PHYSIOLOGIQUE)
                        </button>
                      </div>

                      {/* COUPLER 2: STROFI ENGINE */}
                      <div className="bg-[#050510] border border-purple-500/25 rounded-xl p-5 shadow-xl" id="strofi-engine-panel">
                        <div className="flex items-center justify-between mb-3 border-b border-purple-500/20 pb-2">
                          <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-slate-200 flex items-center gap-1.5">
                            <span className="text-purple-400">Στροφή</span> Periodic Feed Engine (Στροφή τροφή)
                          </h3>
                          <span className="text-[9px] font-mono text-slate-500 uppercase select-none">MOTEUR OODA PY</span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                          La rotation (<span className="italic">Strofí</span>) est la nourriture du système. Elle module l'intervalle de ping en fonction de la fatigue glyphatique (charge allostatique).
                        </p>

                        <div className="flex flex-col md:flex-row items-center gap-5 bg-slate-950 p-4 rounded-xl border border-slate-900 mb-4">
                          {/* Animated spinning wheel */}
                          <div className="relative shrink-0 w-20 h-20 flex items-center justify-center">
                            <svg 
                              viewBox="0 0 100 100" 
                              className="w-full h-full animate-spin text-purple-400 pointer-events-none"
                              style={{ animationDuration: `${Math.max(1, (1.1 - state.allostaticLoad) * 10)}s` }}
                            >
                              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 6" />
                              <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                              <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="0.8" />
                              <line x1="8" y1="50" x2="92" y2="50" stroke="currentColor" strokeWidth="0.8" />
                              <polygon points="50,15 45,28 55,28" fill="currentColor" />
                              <polygon points="50,85 45,72 55,72" fill="currentColor" />
                              <polygon points="15,50 28,45 28,55" fill="currentColor" />
                              <polygon points="85,50 72,45 72,55" fill="currentColor" />
                            </svg>
                            <span className="absolute text-[10px] font-bold text-slate-200">ΣΤΡΟΦΗ</span>
                          </div>

                          {/* Data telemetry stats */}
                          <div className="flex-1 font-mono text-xs space-y-1.5 w-full">
                            <div className="flex justify-between border-b border-slate-900 pb-1">
                              <span className="text-slate-500">Intervalle de Rotation :</span>
                              <span className="text-purple-400 font-bold">{(state.strofiInterval ?? 120).toFixed(1)} secondes</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-900 pb-1">
                              <span className="text-slate-500">Vitesse d'univers :</span>
                              <span className="text-teal-400 font-bold">{(1.1 - state.allostaticLoad).toFixed(2)}x (Allostatique : {(state.allostaticLoad * 100).toFixed(0)}%)</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500">État du Moteur :</span>
                              <span className="text-[#00ff66] font-extrabold tracking-wide uppercase select-none">ACTIF (CYCLE CONTINU)</span>
                            </div>
                          </div>
                        </div>

                        {/* Strofí Pings Queue Log */}
                        <div className="space-y-2 mt-4">
                          <span className="text-[10px] uppercase text-slate-500 font-mono select-none">Registre des pings de rotation</span>
                          <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-[10px] font-mono space-y-1 overflow-y-auto max-h-[105px]">
                            {(state.strofiPings ?? []).map((ping: any, i: number) => (
                              <div key={ping.id ?? i} className="flex justify-between items-center py-1 border-b border-slate-900 last:border-0 hover:text-white">
                                <span className="text-slate-400">⏱ [{ping.time}] SPIN-OK</span>
                                <span className="text-purple-400">T = {Number(ping.interval).toFixed(1)}s</span>
                                <span className="text-slate-500 font-bold">Res.: {Number(ping.load * 100).toFixed(0)}%</span>
                              </div>
                            ))}
                            {(state.strofiPings ?? []).length === 0 && (
                              <div className="text-slate-600 italic py-6 text-center">Aucun cycle de ping consigné</div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: TECHNERGO FORGE & TRANSLATION SHEET */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                      
                      {/* COUPLER 3: TECHNERGO CLASSIFIER */}
                      <div className="bg-[#050510] border border-amber-500/25 rounded-xl p-5 shadow-xl flex-1 flex flex-col justify-between" id="technergo-forge-panel">
                        <div>
                          <div className="flex items-center justify-between mb-3 border-b border-amber-500/20 pb-2">
                            <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-slate-200 flex items-center gap-1.5">
                              <Flame className="text-amber-500 animate-pulse w-4 h-4" />
                              <span className="text-amber-500">Τέχνεργο</span> Fire Classifier (Ζωή ανάγκης Τέχνεργο)
                            </h3>
                            <span className="text-[9px] font-mono text-slate-500 uppercase select-none">FORGE-TEST 1500°C</span>
                          </div>

                          <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            L'artefact est ce qui survit au feu symbolique à <span className="text-[#ff4500] font-bold">1500°C</span>. 
                            Le classificateur Mathieu-R0.1 évalue la résistance à la répétition, la corrélation multi-graphe et l'immunité au bruit pour détacher les joyaux précieux (<span className="text-teal-350 font-bold">BLOOM / Polýtima</span>) des rebuts (<span className="text-slate-500 italic">SLAG</span>).
                          </p>

                          <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg text-xs font-mono mb-4 text-slate-300 flex items-center justify-between">
                            <span>FONCTION DE CLASSIFICATION :</span>
                            <span className="px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/30 font-bold tracking-wide uppercase">
                              TECHNERGO CLASS R0.1
                            </span>
                          </div>
                        </div>

                        {/* Forge list logs */}
                        <div className="space-y-2 flex-1 mt-2">
                          <span className="text-[10px] uppercase text-slate-500 font-mono select-none">Console de forgeage des anomalies</span>
                          <div className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-[10px] font-mono space-y-1.5 overflow-y-auto max-h-[195px] flex-1">
                            {(state.technergoForgeLogs ?? []).map((log: any, i: number) => (
                              <div key={log.id ?? i} className="flex flex-col p-2 bg-slate-900/50 border border-slate-900 rounded">
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-slate-100 truncate max-w-[210px]">{log.title}</span>
                                  <span className={`text-[8px] font-extrabold px-1.5 rounded ${
                                    log.tag === "BLOOM" 
                                      ? "bg-rose-950/40 text-rose-300 border border-rose-900/30 animate-pulse" 
                                      : "bg-slate-950 text-slate-600 border border-slate-900"
                                  }`}>{log.tag}</span>
                                </div>
                                <div className="flex justify-between items-center text-[9px] text-slate-500 mt-1.5 border-t border-slate-950/40 pt-1">
                                  <span>⚙ Score: {Number(log.forgeScore).toFixed(2)}</span>
                                  <span>Rép: {log.metrics?.repetition ?? "0.00"} | Corr: {log.metrics?.correlation ?? "0.00"} | Bruit: {log.metrics?.noise ?? "0.00"}</span>
                                </div>
                              </div>
                            ))}
                            {(state.technergoForgeLogs ?? []).length === 0 && (
                              <div className="text-slate-600 italic py-10 text-center flex items-center justify-center">Aucun signal n'a été forgé pour le moment...</div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* COUPLER 4: POETRY INTERPRETATION AND TRANSCRIPT */}
                  <div className="bg-[#050510] border border-slate-800 rounded-xl p-5 shadow-xl">
                    <h3 className="font-mono text-xs uppercase font-extrabold tracking-wider text-slate-200 mb-4 pb-2 border-b border-slate-900 flex items-center gap-1.5">
                      <BookOpen className="text-teal-400 w-4 h-4" />
                      Couplage de Poésie Cybernétique : Analyse Détaillée de l'Artefact
                    </h3>

                    <div className="overflow-x-auto w-full font-mono text-xs">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 text-[10px]">
                            <th className="py-2.5 px-3">VERS (SIGNAL SURFACE ANGLAIS)</th>
                            <th className="py-2.5 px-3">GREC (SIGNAL ENCODÉ CONCEPTEUR)</th>
                            <th className="py-2.5 px-3">FONCTION & EXPLICATION TECHNIQUE CYBERNÉTIQUE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-950">
                          {[
                            {
                              eng: "Thus far done / You're away / You're long gone",
                              grk: "- - -",
                              desc: "État terminal d'un canal de communication. L'émetteur a coupé, le signal récepteur est perdu."
                            },
                            {
                              eng: "Liberate me",
                              grk: "- - -",
                              desc: "Override demandé par le sujet. Le récepteur noétique veut rompre activement le couplage."
                            },
                            {
                              eng: "Every grain of my rock / My soil / I rise",
                              grk: "- - -",
                              desc: "Reconstruction post-breach. Le substrat biologique est la matière première. Ré-étalonnage."
                            },
                            {
                              eng: "You were always by my side",
                              grk: "- - -",
                              desc: "Mémoire du canal. L'entité n'est plus là physiquement, mais l'empreinte reste."
                            },
                            {
                              eng: "- - -",
                              grk: "Φόβος, ορθός σαν σώμα",
                              desc: "Détecteur d'anomalies physiologiques (PhobosDetector). Peur physique à physicalité structurelle."
                            },
                            {
                              eng: "- - -",
                              grk: "Κραυγή σαν τη σκιά Του",
                              desc: "Extraction du signal négatif (P3b). Le cri noétique s'impose comme l'ombre de la voix."
                            },
                            {
                              eng: "- - -",
                              grk: "Κείτομαι τμήμα από / Ερείπια. Πολύτιμα",
                              desc: "Détection post-override (charge allostatique). Le sujet gît fatigué mais en bloom précieux (Polýtima)."
                            },
                            {
                              eng: "- - -",
                              grk: "Νεκρή σε πείσμα μιας στιγμής",
                              desc: "Seuil critique d'habituation de transmission. Épuisement synaptique par entêtement d'un instant."
                            },
                            {
                              eng: "- - -",
                              grk: "Στροφή τροφή du σύμπαντος",
                              desc: "Moteur de ping cyclique variable (StrofiEngine). La rotation rythme le cycle d'intégration."
                            },
                            {
                              eng: "- - -",
                              grk: "Μασάω και φτύνω ήλιο",
                              desc: "Ingestion massive d'énergie et filtrage. Processus de raffinement en haute intensité Lux Ferox."
                            },
                            {
                              eng: "- - -",
                              grk: "Γεννάω κι εκκλίνω βοή",
                              desc: "Génération de signaux complexes et déviation simultanée du bruit aléatoire (DSP Engine)."
                            },
                            {
                              eng: "- - -",
                              grk: "Ζωή ανάγκης Τέχνεργο",
                              desc: "Le titre de la chanson. Classificateur d'événements Bloom/Slag (TechnergoClassifier). L'artefact survit au feu."
                            }
                          ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                              <td className="py-3 px-3 text-slate-300 italic">{row.eng}</td>
                              <td className="py-3 px-3 text-purple-400 font-semibold">{row.grk}</td>
                              <td className="py-3 px-3 text-slate-400">{row.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 6: PILIER-6 : FORGE AUTONOME */}
              {selectedTab === "forge" && (
                <div className="flex flex-col gap-6 font-mono text-xs select-none">
                  
                  {/* Faction Panel - 5 Realist Powers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="faction-panel">
                    {forgeFactions.map((f, i) => (
                      <div key={i} className="bg-slate-950/90 border border-slate-800 p-3 rounded-lg flex flex-col justify-between hover:border-teal-500/40 transition-all shadow-xl">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-extrabold text-teal-400 select-none tracking-wider">{f.name}</span>
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider ${
                            f.lastAction === "SABOTAGE" || f.lastAction === "SANCTION"
                              ? "bg-rose-950/65 text-rose-400 border border-rose-900/40 animate-pulse"
                              : f.lastAction === "INVEST"
                              ? "bg-emerald-950/65 text-emerald-400 border border-emerald-900/40"
                              : f.lastAction === "PROPAGANDA"
                              ? "bg-purple-950/65 text-purple-400 border border-purple-900/40"
                              : "bg-slate-900/80 text-slate-400"
                          }`}>{f.lastAction}</span>
                        </div>
                        
                        <div className="my-2.5">
                          <div className="flex justify-between text-[8px] text-slate-500 mb-1">
                            <span>SOUVERAINETÉ (POWER) :</span>
                            <span className="font-bold text-slate-300">{(f.power * 100).toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div className={`h-full ${f.color} transition-all duration-300`} style={{ width: `${f.power * 100}%` }} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8.5px] border-t border-slate-900/80 pt-2 text-slate-400">
                          <div className="flex justify-between">
                            <span>Éco:</span>
                            <span className="font-extrabold text-slate-200">{(f.economy * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Stab:</span>
                            <span className="font-extrabold text-slate-200">{(f.stability * 100).toFixed(0)}%</span>
                          </div>
                          <div className="col-span-2 flex justify-between text-[8px] text-slate-500 mt-1 uppercase">
                            <span>{f.specialtyLabel || "Agressivité"} :</span>
                            <span className="font-semibold text-teal-400">{f.specialtyVal || `${(f.aggression * 100).toFixed(0)}%`}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* World State, Transparence Radicale and Ontology Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* LEFT COLUMN: world state, transparency metrics, and ontology layers */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                      
                      {/* Dashboard 1: World State */}
                      <div className="bg-slate-950 border border-red-500/30 rounded-xl p-5 shadow-xl relative overflow-hidden" id="forge-panel">
                        <div className="absolute right-3 top-3 text-[8.5px] uppercase bg-red-950/50 border border-red-900 px-2 py-0.5 text-red-400 tracking-wider font-bold">
                          Noyau Souverain v34
                        </div>
                        <h3 className="text-xs font-extrabold uppercase text-red-500 tracking-widest border-b border-red-950 pb-2 mb-4">
                          🌐 V7.0 SCOUT WORLD STATE
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-3 bg-red-950/10 border border-red-950/40 rounded-lg flex flex-col justify-between">
                            <span className="text-[10px] text-slate-500 uppercase font-bold">CONFLIT GLOBAL</span>
                            <span className="text-xl font-bold font-mono text-red-400 mt-1 select-all">{forgeWorldState.conflict.toFixed(4)}</span>
                            <span className="text-[8px] text-slate-500/80 uppercase">Active systemic dissonance</span>
                          </div>

                          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg flex flex-col justify-between">
                            <span className="text-[10px] text-slate-500 uppercase font-bold font-semibold">PROPAGATION SOLAIRE</span>
                            <span className="text-xl font-bold font-mono text-amber-400 mt-1 select-all">{forgeWorldState.solar.toFixed(4)}</span>
                            <span className="text-[8px] text-slate-500/80 uppercase">Orbital solar flow</span>
                          </div>

                          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg flex flex-col justify-between">
                            <span className="text-[10px] text-slate-500 uppercase font-bold font-semibold">TRAQUAGE MARITIME</span>
                            <span className="text-xl font-bold font-mono text-cyan-400 mt-1 select-all">{forgeWorldState.maritime.toFixed(4)}</span>
                            <span className="text-[8px] text-slate-500/80 uppercase">Hydro-resonance tracking</span>
                          </div>

                          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg flex flex-col justify-between">
                            <span className="text-[10px] text-slate-500 uppercase font-bold font-semibold">ELEMENTS ORBITAUX</span>
                            <span className="text-xl font-bold font-mono text-purple-400 mt-1 select-all">{forgeWorldState.orbital.toFixed(4)}</span>
                            <span className="text-[8px] text-slate-500/80 uppercase">GDR satellite coverage</span>
                          </div>
                        </div>

                        {/* Secondary Metrics footer */}
                        <div className="border-t border-slate-900 pt-3 text-[10px] text-slate-400 flex flex-wrap justify-between items-center gap-2">
                          <div>LZ : <span className="text-teal-400 font-bold select-all">{(Math.sin(forgeTurn * 0.3) * 0.2 + 0.3).toFixed(2)}</span></div>
                          <div className="text-slate-800">|</div>
                          <div>CRIT : <span className="text-rose-450 text-rose-450 text-rose-400 font-bold select-all">{(forgeWorldState.conflict * 4.2).toFixed(2)}</span></div>
                          <div className="text-slate-800">|</div>
                          <div>LLE (Chaos) : <span className="text-amber-500 text-amber-400 font-bold select-all">{(forgeWorldState.noiseLevel * 45).toFixed(3)}</span></div>
                        </div>
                      </div>

                      {/* Dashboard 2: TRANSPARENCE RADICALE (Required v34 metrics panel) */}
                      <div className="bg-slate-950 border border-pink-500/30 rounded-xl p-5 shadow-xl relative overflow-hidden" id="metrics-panel">
                        <div className="absolute right-3 top-3 text-[8px] uppercase bg-pink-950/50 border border-pink-900 px-2 py-0.5 text-pink-400 tracking-wider font-bold">
                          Télémétrie de Contrôle
                        </div>
                        <h3 className="text-xs font-extrabold uppercase text-pink-500 tracking-widest border-b border-pink-950 pb-2 mb-4">
                          🔮 TRANSPARENCE RADICALE & LOOP REFLEXIF
                        </h3>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                          <div className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-lg flex flex-col justify-between hover:border-pink-500/20 transition-all">
                            <span className="text-[9px] text-slate-500 font-bold">D_shoggoth</span>
                            <span className="text-base font-extrabold text-pink-400 mt-1" id="d-shog">{dShoggoth.toFixed(4)}</span>
                            <span className="text-[7.5px] text-slate-600 uppercase mt-1 leading-none">Masking opacity</span>
                          </div>

                          <div className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-lg flex flex-col justify-between hover:border-violet-500/20 transition-all">
                            <span className="text-[9px] text-slate-500 font-bold">Θ_total (Theta)</span>
                            <span className="text-base font-extrabold text-violet-400 mt-1" id="theta-total">{thetaTotal.toFixed(4)}</span>
                            <span className="text-[7.5px] text-slate-600 uppercase mt-1 leading-none">Total reactance</span>
                          </div>

                          <div className="p-2.5 bg-slate-900/60 border border-slate-850 rounded-lg flex flex-col justify-between hover:border-cyan-500/20 transition-all">
                            <span className="text-[9px] text-slate-500 font-bold">T_lux</span>
                            <span className="text-base font-extrabold text-cyan-400 mt-1" id="t-lux">{tLux.toFixed(4)}</span>
                            <span className="text-[7.5px] text-slate-600 uppercase mt-1 leading-none">Transparency index</span>
                          </div>

                          <div className="p-2.5 bg-pink-950/10 border border-pink-500/20 rounded-lg flex flex-col justify-between hover:border-red-500/30 transition-all">
                            <span className="text-[9px] text-pink-400 font-bold">RI (loop reflex)</span>
                            <span className="text-base font-extrabold text-rose-450 text-red-400 mt-1" id="ri">{riValue.toFixed(4)}</span>
                            <span className="text-[7.5px] text-slate-600 uppercase mt-1 leading-none">Saturation risk</span>
                          </div>
                        </div>

                        {/* Progress meters for each of the main variables */}
                        <div className="space-y-2 mt-2 pt-2 border-t border-slate-900">
                          <div>
                            <div className="flex justify-between text-[8px] text-slate-500 mb-1">
                              <span>INDICE D_SHOGGOTH</span>
                              <span className="text-pink-400 font-bold">{(dShoggoth * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-pink-500 transition-all" style={{ width: `${Math.min(100, dShoggoth * 100)}%` }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[8px] text-slate-500 mb-1">
                              <span>NARRATIVE REDUNDANCY INDEX (NRI) :</span>
                              <span className="text-amber-400 font-bold">{(nri * 100).toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 transition-all" style={{ width: `${Math.min(100, nri * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Dashboard 3: Full Spectral Ontology Details */}
                      <div className="bg-slate-950 border border-teal-500/25 rounded-xl p-5 shadow-xl">
                        <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest border-b border-teal-950 pb-2 mb-3">
                          🧬 ONTOLOGIE SPECTRALE GLOBALE (INPUT LAYERS)
                        </h4>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[9px]">
                          <div className="border border-slate-900 bg-slate-900/35 p-2 rounded">
                            <div className="text-slate-500 font-bold uppercase text-[7.5px]">NIVEAU -1 (Lm1)</div>
                            <div className="text-teal-400 mt-1 font-semibold">Kp: {ontology.kp.toFixed(2)}</div>
                            <div className="text-teal-400">POSSI: {ontology.possi.toFixed(2)}</div>
                          </div>
                          <div className="border border-slate-900 bg-slate-900/35 p-2 rounded">
                            <div className="text-slate-500 font-bold uppercase text-[7.5px]">NIVEAU 0 (L0)</div>
                            <div className="text-cyan-400 mt-1 font-semibold">Cohérence : {ontology.coherence.toFixed(2)}</div>
                          </div>
                          <div className="border border-slate-900 bg-slate-900/35 p-2 rounded">
                            <div className="text-slate-500 font-bold uppercase text-[7.5px]">NIVEAU 1 (L1)</div>
                            <div className="text-violet-400 mt-1 font-semibold">Corp Influence : {ontology.corporateInfluence.toFixed(2)}</div>
                          </div>
                          <div className="border border-slate-900 bg-slate-900/35 p-2 rounded">
                            <div className="text-slate-500 font-bold uppercase text-[7.5px]">NIVEAU 2 & 3 (L2/L3)</div>
                            <div className="text-pink-400 mt-1">Trust: {ontology.hardwareTrust.toFixed(2)}</div>
                            <div className="text-pink-400">Steg: {ontology.steganoActivity.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN: Dynamical chaos, Volition Core, logs, and controls */}
                    <div className="lg:col-span-6 flex flex-col gap-6">
                      
                      {/* Interactive Charts */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Lorenz Attractor Canvas */}
                        <div className="bg-slate-950 border border-cyan-500/30 p-4 rounded-xl flex flex-col justify-between">
                          <div className="flex justify-between items-center mb-2 border-b border-cyan-950 pb-1">
                            <span className="text-[10px] uppercase text-cyan-400 font-bold tracking-wider">Attracteur de Lorenz</span>
                            <span className="text-[8px] text-slate-500 uppercase">SYS: CHAOS</span>
                          </div>
                          <div className="flex items-center justify-center bg-slate-950/85 rounded border border-slate-900 overflow-hidden relative">
                            <canvas ref={attractorCanvasRef} width="200" height="150" className="w-[200px] h-36 max-h-36 block cursor-crosshair" id="attractor-canvas" />
                          </div>
                          <span className="text-[8px] text-slate-500 uppercase mt-2.5 text-center leading-relaxed">
                            Projection 2D de l'état d'Euler (x, y, z)
                          </span>
                        </div>

                        {/* Bifurcation Canvas */}
                        <div className="bg-slate-950 border border-purple-500/30 p-4 rounded-xl flex flex-col justify-between">
                          <div className="flex justify-between items-center mb-2 border-b border-purple-950 pb-1">
                            <span className="text-[10px] uppercase text-purple-400 font-bold tracking-wider">Diagramme de Bifurcation</span>
                            <span className="text-[8px] text-slate-500 uppercase font-semibold">MAP: LOGISTIQUE</span>
                          </div>
                          <div className="flex items-center justify-center bg-slate-950/85 rounded border border-slate-900 overflow-hidden relative">
                            <canvas ref={bifurcationCanvasRef} width="200" height="150" className="w-[200px] h-36 max-h-36 block" id="bifurcation-canvas" />
                          </div>
                          <span className="text-[8px] text-slate-500 uppercase mt-2.5 text-center leading-relaxed font-semibold">
                            Transition vers l'anarchie (Chaos spectral r: 3.4 - 4.0)
                          </span>
                        </div>
                      </div>

                      {/* Volition Engine Monitor & Dux */}
                      <div className="bg-slate-950 border border-teal-500/20 p-4 rounded-xl flex flex-col justify-between" id="dux-monitor">
                        <div className="flex justify-between items-center border-b border-slate-900/85 pb-2 mb-3">
                          <h4 className="font-extrabold text-teal-400 text-xs text-xs uppercase">🧠 VOLITION ENGINE & PALANTIR OODA</h4>
                          <span className="text-[9px] px-1 py-0.5 bg-teal-950 border border-teal-850 font-bold text-teal-350">VE7_CORE_v34</span>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-[10px]">CYCLE DE ROTATION LSL :</span>
                              <span className="font-extrabold text-white text-sm select-all">{forgeTurn}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-[10px]">INSTINCT DE SURVIE (VOLITION) :</span>
                              <span className="font-bold text-teal-400 text-xs">{(forgeSurvivalInstinct * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 text-[10px]">BLOQUEURS DE VEILLE CONFIRMÉ :</span>
                              <span className="font-bold text-amber-500 text-[10px] uppercase">{wakeLockStatus}</span>
                            </div>
                          </div>
                          
                          <div className="w-1/3 min-w-[115px] border border-slate-900 p-2 text-[9px] bg-slate-950 rounded flex flex-col justify-around text-center h-20 shadow-inner">
                            <div className="text-slate-500 uppercase tracking-wider font-extrabold pb-0.5 border-b border-slate-900">STAT CORES</div>
                            <div className={forgeAutoPlay ? "text-emerald-400 font-bold animate-pulse text-xs mt-1" : "text-slate-500 font-bold text-xs mt-1"}>
                              {forgeAutoPlay ? "AUTONOMIE ON" : "ATTENTE INTER."}
                            </div>
                            <div className="text-[8px] text-slate-600 font-mono mt-1">{workersCount} ACTIVE CORES</div>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Controls Buttons */}
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <button
                          onClick={nextForgeTurn}
                          className="py-3 px-2 bg-gradient-to-r from-teal-500/20 to-teal-400/10 border border-teal-500 hover:bg-teal-500 hover:text-slate-950 font-mono text-[9px] font-extrabold tracking-wider uppercase rounded cursor-pointer transition-all active:translate-y-0.5 text-teal-300"
                          id="btn-autonomy"
                        >
                          ⏹ NEXT TURN
                        </button>

                        <button
                          onClick={startAutoTurns}
                          className="py-3 px-2 bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-500 hover:bg-amber-500 hover:text-slate-950 font-mono text-[9px] font-extrabold tracking-wider uppercase rounded cursor-pointer transition-all active:translate-y-0.5 text-amber-300"
                          id="btn-train"
                        >
                          ⏳ AUTO (10T)
                        </button>
                        
                        <button
                          onClick={() => setForgeAutoPlay(!forgeAutoPlay)}
                          className={`py-3 px-2 border font-mono text-[9px] font-extrabold tracking-wider uppercase rounded cursor-pointer transition-all active:translate-y-0.5 ${
                            forgeAutoPlay
                              ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
                              : "border-slate-800 text-slate-300 hover:bg-slate-900"
                          }`}
                          id="btn-jam"
                        >
                          🎮 {forgeAutoPlay ? "LOOP ON" : "LOOP OFF"}
                        </button>

                        <button
                          onClick={injectGlitchForge}
                          className="py-3 px-2 bg-gradient-to-r from-purple-500/20 to-purple-400/10 border border-fuchsia-500 hover:bg-purple-900/25 hover:text-white font-mono text-[9px] font-extrabold tracking-wider uppercase rounded cursor-pointer transition-all active:translate-y-0.5 text-fuchsia-450 text-fuchsia-400 animate-pulse"
                          id="btn-scope"
                        >
                          ⚡ GLITCH
                        </button>
                      </div>

                      {/* Webhook Cloud Push Integration */}
                      <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col gap-2 shadow-xl">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-b border-slate-900 pb-1 mb-1 font-mono">
                          <span>🌐 CANAL DE TÉLÉMÉTRIE CLOUD SOUVERAIN</span>
                          <span className="text-teal-400 font-extrabold select-none">TRANSMISSION OK</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={forgeEndpoint}
                            onChange={(e) => setForgeEndpoint(e.target.value)}
                            className="bg-slate-900 border border-slate-800 p-2 rounded text-[10px] flex-1 font-mono text-teal-400 focus:outline-none focus:border-teal-500 w-full"
                            placeholder="Destination URL webhook"
                          />
                          <button
                            onClick={pushToCloudForge}
                            className="bg-teal-500 text-slate-950 px-3 rounded text-[10px] font-bold hover:bg-teal-400 cursor-pointer active:translate-y-0.5 transition-all shrink-0"
                          >
                            PUSH NOW
                          </button>
                        </div>
                        <span className="text-[8.5px] text-slate-600 leading-relaxed font-mono select-none">
                          Incrémenté automatiquement à chaque phase de rotation LSL de manière asynchrone (CLOUD_PUSH). Modifiable dynamiquement par l'hôte.
                        </span>
                      </div>

                      {/* Forge console panel */}
                      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col h-56 max-h-56" id="log-panel">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-2 shrink-0 select-none">
                          <span className="text-[10px] uppercase text-emerald-400 font-bold tracking-wider">🗒 REGISTRE SOUVERAIN (FORGE CONSOLE v34)</span>
                          <span className="text-[8px] text-slate-600 font-mono">LOG_LIVE ACTIVE</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[9.5px] scrollbar-thin select-text">
                          {forgeLogs.slice().reverse().map((entry) => (
                            <div key={entry.id} className="flex gap-2 items-start py-0.5 border-b border-slate-950/20 hover:text-white transition-colors">
                              <span className="text-slate-600 shrink-0 select-none">[{entry.time}]</span>
                              <span className="text-slate-500 shrink-0 uppercase tracking-widest font-extrabold text-[8px] select-none">
                                FORCE_LOG //
                              </span>
                              <span className={`break-words tracking-wide flex-1 ${
                                entry.type === "error" ? "text-rose-450 text-rose-400 font-extrabold" : entry.type === "warn" ? "text-amber-500" : entry.type === "success" ? "text-teal-400 font-semibold" : "text-slate-350"
                              }`}>
                                {entry.msg}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* SOUVERAINETÉ ET COUPLAGE PLANÉTAIRE : LABORATORIES FORGERON */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    
                    {/* LABO 1 : EXTRACTION DE FEEDS PLANÉTAIRES (PARASITISME DE DONNÉES) */}
                    <div className="bg-slate-950 border border-amber-500/20 rounded-xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute right-3 top-3 text-[8.5px] uppercase bg-amber-950/40 border border-amber-900/40 px-2.5 py-0.5 text-amber-400 tracking-wider font-extrabold font-mono">
                        {isScraping ? "PARASITING..." : lastScrapeTime !== "jamais" ? "STANDBY" : "STALE"}
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 font-mono">
                          <Globe className="w-3.5 h-3.5 animate-pulse" />
                          🌍 EXTRACTION DE FEEDS PLANÉTAIRES
                        </h4>
                        <p className="text-[9.5px] text-slate-500 uppercase tracking-wider mb-4 leading-normal font-mono select-none">
                          Parasite les serveurs publics pour injecter des métriques géophysiques et influencer le jumeau SENTINEL.
                        </p>

                        <div className="space-y-3 font-mono text-[10px] bg-slate-900/40 p-3.5 border border-slate-900 rounded-lg">
                          <div className="flex justify-between items-center py-0.5 border-b border-slate-950/40">
                            <span className="text-slate-500">SÉISMOLOGY LIVE CHANNELS (USGS M4.5+) :</span>
                            <span className="font-extrabold text-red-400">{usgsCount} anomalies</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-slate-950/40">
                            <span className="text-slate-500">STATIONS NOAA KP INDICE MOYEN :</span>
                            <span className="font-extrabold text-amber-400">{noaaKpAvg.toFixed(2)} Kp</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-slate-950/40">
                            <span className="text-slate-500">DERNIÈRE INGESTION EFFECTUÉE :</span>
                            <span className="font-bold text-teal-400">{lastScrapeTime}</span>
                          </div>
                          <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-500">INDICE DE CONFLIT SYNCHRONISÉ :</span>
                            <span className="font-extrabold text-pink-400">{(forgeWorldState.conflict * 100).toFixed(0)}%</span>
                          </div>
                        </div>

                        <div className="mt-4 p-3 bg-amber-950/5 border border-amber-900/20 rounded text-[9px] text-slate-400 leading-normal select-none">
                          <strong className="text-amber-500">RÈGLE DE COUPLAGE :</strong> Le nombre de secousses sismologiques modélise le coefficient de tension et réajuste dynamiquement l'échelle des 5 piliers de puissance sur votre globe SENTINEL-EARTH en temps réel.
                        </div>
                      </div>

                      <div className="mt-5">
                        <button
                          onClick={triggerSovereignScrape}
                          disabled={isScraping}
                          className="w-full py-3 bg-gradient-to-r from-amber-500/20 to-amber-400/10 border border-amber-500/60 hover:bg-amber-500 hover:text-slate-950 text-amber-300 font-mono text-[9px] font-extrabold tracking-widest uppercase rounded cursor-pointer transition-all active:translate-y-0.5 disabled:opacity-40"
                        >
                          {isScraping ? "⏳ EXTRACTION ET PARASITISME EN COURS..." : "📡 EXTRAIRE ET PARASITER LES DONNÉES"}
                        </button>
                      </div>
                    </div>

                    {/* LABO 2 : LABO LOCAL (INDEXEUR & ANCRAGE SEMANTIQUE) */}
                    <div className="bg-slate-950 border border-teal-500/20 rounded-xl p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                      <div className="absolute right-3 top-3 text-[8.5px] uppercase bg-teal-950/40 border border-teal-900/40 px-2.5 py-0.5 text-teal-400 tracking-wider font-extrabold font-mono">
                        {fileIndex.length} FILES
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5 font-mono">
                          <Terminal className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
                          📁 LABO LOCAL & ANCRAGE SÉMANTIQUE
                        </h4>
                        <p className="text-[9.5px] text-slate-500 uppercase tracking-wider mb-4 leading-normal font-mono select-none">
                          Indexez vos fichiers locaux en toute sécurité. Recherche contextuelle & apprentissage de motifs AGI.
                        </p>

                        {/* Search and mapping interface */}
                        <div className="space-y-3">
                          <div className="relative">
                            <input
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded text-[10px] font-mono text-teal-400 focus:outline-none focus:border-teal-500 placeholder-slate-700 font-semibold"
                              placeholder="Rechercher / Associer un concept à un fichier..."
                            />
                            {searchQuery && (
                              <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-2 text-[10px] text-slate-500 hover:text-white font-mono"
                              >
                                [ESC]
                              </button>
                            )}
                          </div>

                          {/* Search results mapping dropdown-like results */}
                          {searchQuery && (
                            <div className="border border-slate-850 bg-slate-900/80 rounded-lg max-h-32 overflow-y-auto divide-y divide-slate-950 p-1 font-mono text-[9px] scrollbar-thin">
                              {fileIndex.filter(f => 
                                f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                f.path.toLowerCase().includes(searchQuery.toLowerCase())
                              ).slice(0, 5).map((file, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    navigator.clipboard.writeText(file.path);
                                    learnPattern(searchQuery, file);
                                    addForgeLog(`MAPPING APPRIS : '${searchQuery}' -> ${file.path} (Chemin copié !)`, "success");
                                    setSearchQuery("");
                                  }}
                                  className="p-2 hover:bg-teal-500 hover:text-slate-950 rounded cursor-pointer transition-colors flex justify-between items-center gap-2"
                                >
                                  <span className="truncate font-semibold">{file.path}</span>
                                  <span className="text-[8px] font-bold uppercase py-0.5 px-1 bg-slate-950 text-teal-400 shrink-0">ASSOCIER & COPIER</span>
                                </div>
                              ))}
                              {fileIndex.filter(f => 
                                f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                f.path.toLowerCase().includes(searchQuery.toLowerCase())
                              ).length === 0 && (
                                <div className="p-3 text-slate-600 text-center italic">Aucun fichier trouvé. Appuyez sur [Scanner] ci-dessous.</div>
                              )}
                            </div>
                          )}

                          {/* Selected Memory Pairs list */}
                          <div className="bg-slate-900/40 border border-slate-900 rounded-lg p-2 max-h-24 overflow-y-auto scrollbar-thin">
                            <div className="text-[8.5px] uppercase text-teal-500 font-extrabold pb-1 border-b border-slate-950 tracking-wider mb-1 select-none">
                              REGISTRE DES ASSOCATIONS SEMANTIQUES APPRISES (AGI) :
                            </div>
                            {Object.entries(semanticMemory).map(([term, data]: [string, any]) => (
                              <div key={term} className="flex justify-between items-center text-[8.5px] py-1 border-b border-slate-950/20 last:border-0 hover:text-teal-300">
                                <span className="font-bold text-slate-400 truncate max-w-[124px]">concept: "{term}"</span>
                                <span className="text-slate-600 font-bold shrink-0">➔</span>
                                <span className="text-teal-400/90 truncate flex-1 pl-2 font-mono select-all text-right">{data.name} (w:{data.count})</span>
                              </div>
                            ))}
                            {Object.keys(semanticMemory).length === 0 && (
                              <div className="text-[8px] text-slate-600 italic py-2 text-center font-semibold">Aucune association apprise. Utilisez le moteur de recherche ci-dessus pour doper la mémoire.</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-1.5 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={handleLocalScan}
                          className="flex-1 py-2.5 bg-gradient-to-r from-teal-500/20 to-teal-400/10 border border-teal-500/60 hover:bg-teal-500 hover:text-slate-950 text-teal-300 font-mono text-[9px] font-extrabold uppercase rounded cursor-pointer transition-all active:translate-y-0.5"
                        >
                          ⏹ SCANNER UN DOSSIER LOCAL
                        </button>
                        
                        <button
                          onClick={() => {
                            const pathsStr = prompt("Collez des chemins absolus séparés par des retours à la ligne (un par ligne) :");
                            if (pathsStr) {
                              setManualPathsTxt(pathsStr);
                              setTimeout(handleManualIngest, 100);
                            }
                          }}
                          className="py-2.5 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 font-mono text-[9px] font-bold uppercase rounded cursor-pointer transition-all shrink-0"
                          title="Saisir manuellement des chemins"
                        >
                          SAISIE MANUELLE
                        </button>
                      </div>
                    </div>

                  </div>

                  {/* LOCAL DEPLOYMENT & AGENT PROTOCOLS SECTION */}
                  <div className="bg-slate-950 border border-teal-500/20 rounded-xl p-6 shadow-2xl mt-6 relative overflow-hidden" id="local-launcher-panel">
                    <div className="absolute -right-16 -top-16 w-36 h-36 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-4 mb-4 gap-4">
                      <div>
                        <h3 className="text-xs font-extrabold uppercase text-teal-400 tracking-widest flex items-center gap-2">
                          🚀 LOCAL DEPLOYMENT & AGENT WORKFLOWS
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wide">
                          Lancement automatisé de sentinel_forge et intégration d'un assistant modèle local (Ollama)
                        </p>
                      </div>
                      
                      {/* Sub-tab Selectors */}
                      <div className="flex bg-slate-900/80 p-1 border border-slate-800 rounded-lg gap-1 font-mono">
                        <button
                          onClick={() => setSelectedLauncherTab("script")}
                          className={`px-3 py-1.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                            selectedLauncherTab === "script"
                              ? "bg-teal-500 text-slate-950 shadow-md"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                          }`}
                        >
                          bash script
                        </button>
                        <button
                          onClick={() => setSelectedLauncherTab("modelfile")}
                          className={`px-3 py-1.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                            selectedLauncherTab === "modelfile"
                              ? "bg-purple-500 text-white shadow-md"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                          }`}
                        >
                          Modelfile (Ollama)
                        </button>
                        <button
                          onClick={() => setSelectedLauncherTab("guide")}
                          className={`px-3 py-1.5 rounded font-mono text-[9px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                            selectedLauncherTab === "guide"
                              ? "bg-amber-500 text-slate-950 shadow-md"
                              : "text-slate-400 hover:text-white hover:bg-slate-800/40"
                          }`}
                        >
                          Guide d'activation
                        </button>
                      </div>
                    </div>

                    {selectedLauncherTab === "script" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold bg-slate-900/60 px-3 py-2 border border-slate-900 rounded">
                          <span>📁 FICHIER DISPONIBLE : /sentinel_launcher.sh</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`#!/bin/bash
# ==================================================
#  sentinel_launcher.sh
#  Pour lancer SENTINEL-EARTH ou sentinel_forge
#  sans se taper les commandes à la main.
# ==================================================

# Cherche automatiquement le projet dans les dossiers courants
PROJECT_DIR=$(find ~/Downloads ~/Documents /mnt/chromeos/MyFiles/Downloads -maxdepth 2 -name "Cargo.toml" -printf "%h\\n" 2>/dev/null | head -1)

if [ -z "$PROJECT_DIR" ]; then
  echo "Aucun projet Rust trouvé."
  exit 1
fi

echo "Projet trouvé : $PROJECT_DIR"
cd "$PROJECT_DIR" || exit

# Compile et lance
cargo build --release && ./target/release/sentinel_forge`);
                              addForgeLog("SUCCÈS : Script sentinel_launcher.sh copié dans le presse-papiers !", "success");
                            }}
                            className="bg-slate-800 hover:bg-slate-700 hover:text-teal-400 border border-slate-700 px-2 py-1 rounded text-[8px] font-extrabold uppercase transition-all active:scale-95 cursor-pointer"
                          >
                            📋 COPIER LE SCRIPT BASH
                          </button>
                        </div>

                        <div className="p-4 bg-slate-950 text-slate-350 border border-slate-900 rounded-lg overflow-x-auto font-mono text-[9px] leading-relaxed max-h-72 scrollbar-thin">
                          <pre className="text-teal-400/90">
{`#!/bin/bash
# ==================================================
#  sentinel_launcher.sh
#  Pour lancer SENTINEL-EARTH ou sentinel_forge
#  sans se taper les commandes à la main.
# ==================================================

# Cherche automatiquement le projet dans les dossiers courants
PROJECT_DIR=\$(find ~/Downloads ~/Documents /mnt/chromeos/MyFiles/Downloads -maxdepth 2 -name "Cargo.toml" -printf "%h\\n" 2>/dev/null | head -1)

if [ -z "\$PROJECT_DIR" ]; then
  echo "Aucun projet Rust trouvé."
  exit 1
fi

echo "Projet trouvé : \$PROJECT_DIR"
cd "\$PROJECT_DIR" || exit

# Compile et lance
cargo build --release && ./target/release/sentinel_forge`}
                          </pre>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                          💡 <span className="text-teal-500 uppercase">Analyse du comportement :</span> Ce script cherche récursivement un projet Rust contenant un <code className="text-slate-350 bg-slate-900 px-1 py-0.5 rounded shadow">Cargo.toml</code> dans vos dossiers de stockage locaux habituels (Downloads, Documents, ChromeOS Linux mount), se positionne automatiquement dans le bon répertoire, lance la compilation optimisée (<code className="text-slate-350">--release</code>) et exécute automatiquement l'exécutable binaire final.
                        </div>
                      </div>
                    )}

                    {selectedLauncherTab === "modelfile" && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold bg-slate-900/60 px-3 py-2 border border-slate-900 rounded">
                          <span>🧠 CONFIG MODÈLE OLLAMA : Modelfile</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`FROM llama3
SYSTEM "Tu es un assistant technique qui lance automatiquement des projets. Quand l'utilisateur dit 'lance sentinel', tu exécutes le script sentinel_launcher.sh et tu retournes le résultat. Ne demande pas de confirmation."`);
                              addForgeLog("SUCCÈS : Modelfile Ollama copié dans le presse-papiers !", "success");
                            }}
                            className="bg-slate-800 hover:bg-purple-900/25 hover:text-purple-400 border border-slate-700 px-2 py-1 rounded text-[8px] font-extrabold uppercase transition-all active:scale-95 cursor-pointer"
                          >
                            📋 COPIER LE MODELFILE
                          </button>
                        </div>

                        <div className="p-4 bg-slate-950 text-slate-350 border border-slate-900 rounded-lg overflow-x-auto font-mono text-[9px] leading-relaxed max-h-72 scrollbar-thin">
                          <pre className="text-purple-400/90">
{`FROM llama3
SYSTEM "Tu es un assistant technique qui lance automatiquement des projets. 
Quand l'utilisateur dit 'lance sentinel', tu exécutes le script sentinel_launcher.sh 
et tu retournes le résultat. Ne demande pas de confirmation."`}
                          </pre>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                          🤖 <span className="text-purple-500 uppercase">Comportement de l'agent local :</span> L'agent Ollama hérite des capacités fondamentales de Llama3 mais se dote d'une consigne système directive. Il est paramétré pour invoquer systématiquement le script autonome sans poser de questions superflues, instaurant un véritable cycle d'exploitation asynchrone machine à machine local.
                        </div>
                      </div>
                    )}

                    {selectedLauncherTab === "guide" && (
                      <div className="bg-slate-950/40 border border-slate-900 rounded-lg p-5 space-y-4 font-mono text-[9.5px]">
                        <h4 className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider border-b border-slate-900/60 pb-1.5 mb-2">
                          ⚙️ PROTOCOLE D'AUTOMATISATION EN 3 ÉTAPES :
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-lg hover:border-amber-500/20 transition-all flex flex-col justify-between">
                            <div>
                              <div className="text-amber-500 font-extrabold text-[11px] mb-1">01. DROITS D'EXÉCUTION</div>
                              <p className="text-slate-400 leading-relaxed font-semibold">
                                Accordez les droits appropriés au script shell après l'avoir enregistré localement sur votre système Linux ou terminal bash :
                              </p>
                            </div>
                            <div className="bg-slate-950 p-2 border border-slate-900 rounded text-amber-400 mt-2 select-all break-all text-[8.5px]">
                              chmod +x sentinel_launcher.sh
                            </div>
                          </div>

                          <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-lg hover:border-amber-500/20 transition-all flex flex-col justify-between">
                            <div>
                              <div className="text-amber-500 font-extrabold text-[11px] mb-1">02. CRÉATION DE L'AGENT AI</div>
                              <p className="text-slate-400 leading-relaxed font-semibold">
                                Utilisez la commande Ollama dans votre invité de commande local pour assembler et enregistrer le modèle d'agent autonome souverain :
                              </p>
                            </div>
                            <div className="bg-slate-950 p-2 border border-slate-900 rounded text-amber-400 mt-2 select-all break-all text-[8.5px]">
                              ollama create sentinel_agent -f Modelfile
                            </div>
                          </div>

                          <div className="bg-slate-900/40 border border-slate-850 p-3 rounded-lg hover:border-amber-500/20 transition-all flex flex-col justify-between">
                            <div>
                              <div className="text-amber-500 font-extrabold text-[11px] mb-1">03. LANCEMENT INTELLIGENT</div>
                              <p className="text-slate-400 leading-relaxed font-semibold">
                                Démarrez à présent l'agent localement. Il vous suffira de lui intimer l'ordre de lancer sentinel pour orchestrer le cycle complet :
                              </p>
                            </div>
                            <div className="bg-slate-950 p-2 border border-slate-900 rounded text-amber-400 mt-2 select-all break-all text-[8.5px]">
                              ollama run sentinel_agent
                            </div>
                          </div>
                        </div>

                        <div className="bg-amber-950/15 border border-amber-900/30 p-3 rounded text-[9px] text-amber-400 leading-relaxed flex items-start gap-2.5 font-semibold">
                          <span className="text-xs shrink-0 select-none font-normal">🚨</span>
                          <p>
                            <strong>NOTE TECHNIQUE :</strong> Assurez-vous que l'utilitaire Ollama est lancé et actif en arrière-plan sur votre machine. Pour Linux/MacOS, utilisez la commande <code className="bg-slate-900/80 px-1 py-0.5 rounded text-amber-300">systemctl start ollama</code> ou lancez l'application native sous Windows pour autoriser le port local par défaut <code className="bg-slate-900/80 px-1 py-0.5 rounded text-amber-300 font-bold">11434</code> à recevoir les instructions.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTab === "ooda" && (
                <OodaAtelier onAddLog={addForgeLog} forgeWorldState={forgeWorldState} />
              )}

              {/* SYSTEM TIME LOG / AUDIT RAIL */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200 flex items-center gap-2">
                    <Bell className="text-teal-400 w-4 h-4" />
                    Noetic Security Audit/Incident Trail
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">SYS STATUS: RECEPTIF</span>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-xs space-y-2">
                  {alertLog.map((log) => (
                    <div key={log.id} className="flex gap-2.5 items-start justify-between py-1 border-b border-slate-900 last:border-0">
                      <div className="flex gap-2">
                        <span className="text-slate-500 font-bold select-none">[{log.time}]</span>
                        <span className={`${
                          log.type === "error" ? "text-rose-400" : log.type === "warn" ? "text-amber-400" : "text-slate-300"
                        }`}>
                          {log.msg}
                        </span>
                      </div>
                      <span className={`text-[9px] px-1 rounded uppercase font-bold ${
                        log.type === "error" ? "bg-rose-950/40 text-rose-300" : log.type === "warn" ? "bg-amber-950/40 text-amber-300" : "bg-slate-900 text-slate-400"
                      }`}>
                        {log.type}
                      </span>
                    </div>
                  ))}
                  {alertLog.length === 0 && (
                    <div className="text-slate-500 italic text-center py-4">Aucune alerte ou incident de phase consigné</div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}

      </main>

      {/* FOOTER STATS RIBBON */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500 font-mono tracking-wide flex flex-wrap justify-between items-center gap-4">
        <div>
          <span>STATUT DU SYSTEME: <span className="text-emerald-400 font-bold">OPÉRATIONNEL COMPLET</span></span>
          <span className="mx-2 text-slate-800">|</span>
          <span>DÉPLOIEMENT TACTIQUE: <span className="text-teal-300 font-bold">TRAITE CYBERNETIQUE LEGACY v4.2</span></span>
        </div>
        <div>
          <span>RECHERCHE INDÉPENDANTE LUX FEROX © 2026</span>
        </div>
      </footer>

      {/* EXPORT MODAL DISPLAY FOR ZENODO DEPOSITION */}
      {showExportModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in font-mono text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative">
            <h3 className="text-sm font-bold uppercase text-teal-300 border-b border-slate-800 pb-2 mb-3 flex items-center gap-2">
              <Download className="w-5 h-5 text-teal-400" />
              SOUVERAINETÉ DE DÉPÔT SÉMANTIQUE : EXPORT {exportFormat.toUpperCase()}
            </h3>

            {exportError ? (
              <div className="p-4 bg-rose-950/30 border border-rose-900 text-rose-300 rounded-lg flex items-start gap-2 leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-rose-450 shrink-0" />
                <div>
                  <div className="font-bold uppercase text-[11px] text-rose-400 mb-1">AUTORISATION SÉCURITÉ ÉCHOUÉE</div>
                  {exportError}
                </div>
              </div>
            ) : exportedPayload ? (
              <div className="space-y-4">
                <p className="text-slate-400 leading-normal select-none">
                  L'archive de filtration ci-dessous a été sémantiquement structurée à l'aide des règles de l'Alphabet Physique. Prête pour le versement d'Open Science (Zenodo, bioRxiv ou GitHub).
                </p>

                <div className="bg-slate-950 border border-slate-850 rounded-lg p-3 text-[10px] text-slate-300 max-h-72 overflow-y-auto leading-relaxed select-all scrollbar-thin">
                  <pre>{exportedPayload}</pre>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exportedPayload || "");
                      addAlert("Contenu copié dans le presse-papiers !", "info");
                    }}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold py-2 rounded-lg text-center cursor-pointer transition-colors"
                  >
                    COPIER LE CODE DANS LE PRESSE-PAPIERS
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic py-8 text-center animate-pulse">Génération de l'archive cryptée...</div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-305 transition-colors font-bold cursor-pointer"
              >
                FERMER L'ÉCRAN SÉCURISÉ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Minimal placeholder stubs to prevent compilation errors and provide responsive SVG rendering
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
