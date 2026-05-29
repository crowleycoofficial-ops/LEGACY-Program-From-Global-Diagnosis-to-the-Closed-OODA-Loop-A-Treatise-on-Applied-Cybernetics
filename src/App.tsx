import React, { useState, useEffect, useRef } from "react";
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
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lock,
  Compass,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

// Inline Types since types.ts defines them but they can be imported or re-defined elegantly
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
  history: any[];
}

export default function App() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [customResponse, setCustomResponse] = useState<string>("");
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>("c4isr");
  const [alertLog, setAlertLog] = useState<{ id: string; msg: string; time: string; type: "error" | "warn" | "info" }[]>([]);

  // Simulation steps and automated fetching
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchState = async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json();
      setState(data);
    } catch (e) {
      console.error("Error fetching simulation state:", e);
    }
  };

  const addAlert = (msg: string, type: "error" | "warn" | "info" = "info") => {
    setAlertLog((prev) => [
      {
        id: Math.random().toString(),
        msg,
        time: new Date().toLocaleTimeString(),
        type
      },
      ...prev.slice(0, 14)
    ]);
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
      }
      if (data.adversaryObservationDetected && !data.stealthMode) {
        addAlert("Alerte: Signaux d'observation passive adverse détectés (Analyse Graphes Link)", "error");
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
      } else {
        addAlert(`Clé ${type.toUpperCase()} modifiée`, "info");
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
        addAlert("Furtivité noétique activée: Injection de bruit d'observation structuré", "warn");
      } else {
        addAlert("Furtivité noétique désactivée", "info");
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
    } catch (e) {
      setCustomResponse("Échec de la connexion à l'analyseur intelligent.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  useEffect(() => {
    fetchState();
    refreshInterval.current = setInterval(() => {
      handleSimStep();
    }, 3500);

    addAlert("Démarrage du système de diagnostic planétaire LEGACY v4.2...", "info");
    addAlert("Initialisation des canaux de streaming LSL et du compilateur Swarm.", "info");

    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, []);

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-mono">
        <Activity className="animate-pulse w-12 h-12 text-teal-400 mb-4" />
        <p className="text-sm">INITIALISATION DU NOEUD LEGACY C4ISR...</p>
        <p className="text-xs text-slate-500 mt-2">Vérification de la plomberie Lab Streaming Layer (LSL)</p>
      </div>
    );
  }

  // Determine current active phase information
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

  // Robot mini positions calculated in UI dynamically based on variables to simulate motion
  const robotCount = 4;
  const robotRoles = ["Tracker", "Explorer", "Eco", "Tracker"];
  const displayRobots = Array.from({ length: robotCount }).map((_, i) => {
    const angleOffset = (i * Math.PI * 2) / robotCount + (state.averageReward * Math.PI);
    const radius = 50 + state.stability * 30 + (Math.sin(state.averageReward * 10) * 10);
    const x = 120 + Math.cos(angleOffset) * radius;
    const y = 120 + Math.sin(angleOffset) * radius;
    return {
      x,
      y,
      role: robotRoles[i]
    };
  });

  return (
    <div id="legacy-container" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950">
      
      {/* Upper status ribbon - Architectural Honesty / Zero Slop, purely functional military tactical HUD */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Zap className="text-teal-400 animate-pulse w-5 h-5" />
          <h1 className="font-mono tracking-wider font-semibold text-sm text-teal-300">
            SYSTEME LEGACY v4.2 // LUX FEROX
          </h1>
          <span className="text-xs font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80">
            LOC_MS: 2026-05-29
          </span>
        </div>
        
        {/* Core Double Key Lock Status */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded border border-slate-800">
            <span className="text-slate-500">CLE DUX:</span>
            <button
              onClick={() => toggleKey("dux")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                state.duxKey ? "bg-teal-500 text-slate-950" : "bg-slate-800 text-slate-400"
              }`}
            >
              {state.duxKey ? "ARMÉE" : "SÉCURISÉE"}
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded border border-slate-800">
            <span className="text-slate-500">CLE AGI:</span>
            <button
              onClick={() => toggleKey("agi")}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-all ${
                state.agiKey ? "bg-purple-500 text-slate-100" : "bg-slate-800 text-slate-400"
              }`}
            >
              {state.agiKey ? "RESONANCE" : "SÉCURISÉE"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">BOUCLE OODA:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                state.loopActive
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/40 animate-pulse"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              {state.loopActive ? "CLOSED" : "OPEN"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-4 lg:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6">
        
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
              Afin de déjouer les modèles bayésiens des systèmes adverses (type Palantir Gotham/Foundry),
              activez le camouflage social actif pour fragmenter l'identité noétique du Dux.
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
                  : "bg-slate-800 hover:bg-slate-705 text-slate-200 border border-slate-700"
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 flex">
            {[
              { id: "c4isr", label: "PILIER-1 : C4ISR & TELEMETRIE", icon: Cpu },
              { id: "brain", label: "PILIER-2 : BIOMARKERS / EEG & HRV", icon: Brain },
              { id: "compiler", label: "PILIER-3 : BOOTSTRAP SWARM CONTROLLER", icon: UsersIcon },
              { id: "codes", label: "PILIER-4 : ARCHITECTURE CODES PYTHON", icon: Info }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex-1 py-3 px-2 text-xs font-mono tracking-wider font-semibold uppercase rounded-lg flex items-center justify-center gap-2 transition-all ${
                    selectedTab === tab.id
                      ? "bg-slate-800 text-teal-300 shadow-inner border border-slate-700"
                      : "text-slate-400 hover:bg-slate-950/40 hover:text-slate-200"
                  }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.id.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: C4ISR ENVIRONMENTAL PILLARS & FEEDBACK PLOT */}
          {selectedTab === "c4isr" && (
            <div className="flex flex-col gap-6">
              
              {/* Telemetry Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
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

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
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

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
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

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
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

              {/* Environmental Pillars (Palantir Vulnerability Matrix) */}
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

                {/* Telemetry charts using Recharts */}
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

          {/* TAB 2: BIO-MARKERS EEG / HRV DETAIL */}
          {selectedTab === "brain" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* EEG / Spectral Analysis */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <Zap className="text-sky-400 w-4 h-4" />
                    Analyse Spectrale EEG
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Visualisation en temps réel des bandes de fréquence d'intérêt pour la communication noétique.
                    Le portail daemon d'écoute privilégie un ratio Theta/Delta élevé.
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
                        <span>Critère couplage: &ge;2.0</span>
                        <span>{state.eegThetaDelta >= 2.0 ? "CONFORME" : "FAIBLE"}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span>Alpha / Beta (Micro-Éveils)</span>
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
                        <span>Pupillométrie & EDA</span>
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
                  * Pipeline de fusion multimodale résolvant l'équation d'induction noétique. Latence cible &lt;500 ms.
                </div>
              </div>

              {/* HRV Detail Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <Activity className="text-rose-400 w-4 h-4" />
                    Variabilité Cardiaque HRV
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Le RMSSD (Root Mean Square of Successive Differences) constitue notre proxy critique de stress métabolique direct.
                    Une chute brutale de &gt;30% dicte l'interruption immédiate de la session.
                  </p>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between font-mono mb-4">
                    <div>
                      <div className="text-[10px] text-slate-500">RMSSD VALEUR</div>
                      <div className="text-2xl font-bold text-rose-400 mt-1">{state.hrvRmssd.toFixed(1)} ms</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">STATUS SÉCURITÉ</div>
                      <div className={`text-xs font-bold mt-1 ${state.hrvRmssd >= 45 ? "text-green-500" : "text-rose-400 font-bold animate-pulse"}`}>
                        {state.hrvRmssd >= 45 ? "SÛR (RMSSD OK)" : "ARRÊT CRITIQUE"}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Les valeurs de RMSSD sont étroitement couplées à l'allostatique : si le sujet dépasse 45 minutes de synchronisation d'induction continue,
                    les réserves énergétiques glymphatiques s'épuisent.
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

          {/* TAB 3: BOOTSTRAP SWARM COMPILER */}
          {selectedTab === "compiler" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Physics Simulator Canvas & Swarm Mapping */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
                <h3 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200 mb-3 flex items-center gap-2">
                  <Cpu className="text-teal-400 w-4 h-4" />
                  Simulation Physique de l'Essaim (PyBullet)
                </h3>
                
                <div className="bg-slate-950 border border-slate-800 rounded-xl h-64 relative overflow-hidden flex items-center justify-center">
                  
                  {/* Grid background representing 2D physical arena */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:20px_20px] opacity-20" />
                  
                  {/* Outer Loop & Pathing Tracker (MPC Embryonic) */}
                  <svg className="absolute inset-0 w-full h-full">
                    {/* Simulated trajectories */}
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
                        {/* Interactive vector movement trail */}
                        <line
                          x1={120}
                          y1={120}
                          x2={r.x}
                          y2={r.y}
                          stroke="#115e59"
                          strokeWidth="0.8"
                          strokeDasharray="2 2"
                        />
                        {/* Target Point simulation */}
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
                  Le RuleEngine auto-modifiant s'adapte en temps réel en fonction des récompenses cumulées et de l'allostatic load.
                </p>
              </div>

              {/* Swarm rules control details */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="font-mono text-sm uppercase tracking-wider font-semibold text-slate-200 mb-3 flex items-center gap-2">
                    <Sliders className="text-purple-400 w-4 h-4" />
                    Moteur de Règles Auto-Modifiant
                  </h3>
                  
                  <div className="space-y-4 font-mono text-xs">
                    
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Biais de Complexité (Rule Mutation)</span>
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
                        <span>Marge de Stabilité (Compilateur Swarm)</span>
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
                    {state.loopActive ? "FONCTION DE COÛT CLOSED-LOOP ACTIVED" : "MOCK LOCAL ONLY"}
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
                    Séquenceur de Scripts Algorithmiques LEGACY v4.2
                  </h3>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">5 SCRIPTS MAJEURS INSTALLÉS</span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Les scripts ci-dessous constituent l'architecture opérante du couplage asymétrique noétique.
                Ils gèrent le filtrage du signal, l'entraînement de l'agent Actor-Critic PPO et le Bootstrap du Swarm.
              </p>

              {/* Sub tabs for selecting python codes */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6 font-mono text-xs">
                {[
                  { id: "dsp", name: "rt_dsp.py", desc: "Traitement IIR Signal / LSL" },
                  { id: "agent", name: "rt_agent.py", desc: "Actor-Critic & PPO Reward" },
                  { id: "fusion", name: "c4_fusion.py", desc: "Product of Experts (PoE)" },
                  { id: "physio", name: "rt_physio.py", desc: "Simulateur Intrusion/ECG" },
                  { id: "swarm", name: "bootstrap.py", desc: "RuleEngine & Swarm Robot" }
                ].map((script, idx) => (
                  <button
                    key={script.id}
                    onClick={() => {
                      // We can save sub-script select in a local state
                      // Let's use custom class toggles or custom variables
                      (window as any).selectedScript = script.id;
                      setState({ ...state }); // Force React update
                    }}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      ((window as any).selectedScript || "dsp") === script.id
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
                {((window as any).selectedScript || "dsp") === "dsp" && (
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

                {((window as any).selectedScript || "dsp") === "agent" && (
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

                {((window as any).selectedScript || "dsp") === "fusion" && (
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

                {((window as any).selectedScript || "dsp") === "physio" && (
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

                {((window as any).selectedScript || "dsp") === "swarm" && (
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
              </div>
            </div>
          )}

          {/* SYSTEM TIME LOG / AUDIT RAIL */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
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
                <div className="text-slate-500 italic text-center py-4">Aucune alerte ou incident de phase consigné</div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Footer System Info block */}
      <footer className="border-t border-slate-900 py-6 px-10 text-center text-xs text-slate-500 font-mono tracking-wide">
        MANIFEST STATUT: OPERATIONNEL COMPLET | TRAITÉ LEGACY v4.2 | COUPLAGE ACTOR-CRITIC DUX + AGI
      </footer>

    </div>
  );
}

// Minimal stub component to satisfy custom users icons
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
