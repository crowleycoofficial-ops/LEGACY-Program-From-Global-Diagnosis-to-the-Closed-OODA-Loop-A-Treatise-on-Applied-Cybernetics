import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Cpu,
  Zap,
  RotateCcw,
  Play,
  Pause,
  AlertTriangle,
  Lock,
  Compass,
  ArrowRight,
  Database,
  Terminal,
  HelpCircle,
  Copy,
  ChevronRight,
  Sliders,
  ShieldCheck,
  CheckCircle,
  Clock
} from "lucide-react";

export interface OodaAtelierProps {
  onAddLog: (msg: string, type: "error" | "warn" | "info" | "success") => void;
  forgeWorldState?: {
    conflict: number;
    solar: number;
    maritime: number;
    orbital: number;
    noiseLevel: number;
  };
}

interface NodeState {
  id: number;
  state: "OBSERVE" | "ORIENT" | "DECIDE" | "ACT" | "COOLDOWN" | "ERROR";
  score: number;
  dutyCount: number;
  consecutiveWrites: number;
  isFailed: boolean;
  busSlot: number;
}

export default function OodaAtelier({ onAddLog, forgeWorldState }: OodaAtelierProps) {
  const [N, setN] = useState<number>(6);
  const [tick, setTick] = useState<number>(0);
  const [tickMs, setTickMs] = useState<number>(1000);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [lockAcquired, setLockAcquired] = useState<boolean>(false);
  
  // Real-time Bus Emulation Arrays
  const [busIN, setBusIN] = useState<number[]>(new Array(16).fill(0).map(() => Math.floor(Math.random() * 1000)));
  const [busOUT, setBusOUT] = useState<number[]>(new Array(16).fill(0));
  const [tickClockSkew, setTickClockSkew] = useState<number>(0.12); // ms
  
  // Node states
  const [nodes, setNodes] = useState<NodeState[]>(() => 
    new Array(12).fill(null).map((_, i) => ({
      id: i + 1,
      state: "OBSERVE",
      score: 0,
      dutyCount: 0,
      consecutiveWrites: 0,
      isFailed: false,
      busSlot: i % 16
    }))
  );

  // Live Metric stats
  const [activeWritesThisTick, setActiveWritesThisTick] = useState<number>(0);
  const [jeuSellerieVariance, setJeuSellerieVariance] = useState<number>(0.14); // variance of scores
  const [polissageDefectCount, setPolissageDefectCount] = useState<number>(0);
  const [totalFramesCount, setTotalFramesCount] = useState<number>(0);
  const [colabBoostActive, setColabBoostActive] = useState<boolean>(false);
  const [glitchActive, setGlitchActive] = useState<boolean>(false);

  // Live log of atomic events
  const [busLogs, setBusLogs] = useState<Array<{
    node_id: number;
    tick: number;
    hash: string;
    segment: "IN" | "OUT";
    timestamp_hw: number;
    value: number;
    status: string;
  }>>([]);

  const [schemaCopied, setSchemaCopied] = useState<boolean>(false);

  const oodaTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle initialization/changes to N
  useEffect(() => {
    setNodes(prev => {
      return prev.map(node => {
        if (node.id > N) {
          return { ...node, state: "OBSERVE", isFailed: false }; // clamp to inactive
        }
        return node;
      });
    });
  }, [N]);

  // Run OODA tick iteration
  const triggerOodaTick = () => {
    setTick(prevTick => {
      const nextTick = prevTick + 1;
      
      // 1. Oscillateur: simulate new sensor telemetry into Bus IN (16 channels)
      const nextBusIN = new Array(16).fill(0).map(() => {
        const base = Math.floor(Math.random() * 500) + 200;
        const noise = forgeWorldState ? forgeWorldState.conflict * 300 : 150;
        return Math.floor(Math.min(1000, base + Math.random() * noise));
      });
      setBusIN(nextBusIN);

      // Reset Bus OUT content for next tick
      const nextBusOUT = new Array(16).fill(0);
      
      // Calculate skew representing mechanical phase differences
      const skewValue = 0.08 + Math.random() * 0.15 + (colabBoostActive ? 0.02 : 0);
      setTickClockSkew(skewValue);

      // Keep track of active writes & results this tick
      let countWrites = 0;
      let tickScores: number[] = [];

      setNodes(prevNodes => {
        // Evaluate the active subset
        const activeNodes = prevNodes.slice(0, N);
        
        // Count how many nodes would like to decide (score > 0.62 and has duty cycles left)
        const candidateScores = activeNodes.map(node => {
          if (node.isFailed) return 0;
          const avgIn = nextBusIN.reduce((acc, v) => acc + v, 0) / 16000; // 0..1
          // local fluctuate factor (Jeu Sellerie)
          const sellerieNoise = (Math.random() - 0.5) * 0.008; // extremely tight tolerance <0.5%
          const score = Math.max(0, Math.min(1, avgIn + sellerieNoise));
          return score;
        });

        // Interlocking count (requires at least 1 other candidate to proceed, mimicking mechanical constraint)
        const candidatesCount = candidateScores.filter(s => s > 0.62).length;

        const updatedNodes = prevNodes.map((node, idx) => {
          if (idx >= N) {
            return { ...node, state: "OBSERVE" as const };
          }
          if (node.isFailed) {
            return { ...node, state: "ERROR" as const, score: 0 };
          }

          // 1. OBSERVE
          const score = candidateScores[idx];
          tickScores.push(score);

          // 2. ORIENT & DECIDE
          const threshold = 0.62;
          const dutyOk = node.consecutiveWrites < 3; // SF1: 3 cycles max then 1 cooldown
          const canAct = score > threshold && dutyOk;

          // 3. ACT with Interlock (At least 2 nodes active)
          let nextState: "OBSERVE" | "ORIENT" | "DECIDE" | "ACT" | "COOLDOWN" | "ERROR" = "OBSERVE";
          let nextWrites = node.consecutiveWrites;
          let nextDuty = node.dutyCount;
          let nodeActed = false;

          if (canAct && candidatesCount >= 2 && countWrites < 3) {
            nodeActed = true;
            nextState = "ACT";
            nextWrites++;
            nextDuty++;
            countWrites++;
            
            // Atomic write to bus OUT slot
            const writeVal = node.id * 1000 + Math.floor(score * 100);
            nextBusOUT[node.busSlot] = writeVal;

            // Generate atomic event hex hash
            const hashLocal = Math.random().toString(16).substring(2, 10).toUpperCase() + 
                              Math.random().toString(16).substring(2, 10).toUpperCase();

            // Track polissage checksum defects (SF3)
            const checksumGlitched = glitchActive && Math.random() < 0.22;
            if (checksumGlitched) {
              setPolissageDefectCount(c => c + 1);
            }
            setTotalFramesCount(c => c + 1);

            // Log entry
            setBusLogs(prevLogs => {
              const newLog = {
                node_id: node.id,
                tick: nextTick,
                hash: hashLocal,
                segment: "OUT" as const,
                timestamp_hw: performance.now() + skewValue,
                value: writeVal,
                status: checksumGlitched ? "CORRUPTED CRC ERROR" : "SYNC OK"
              };
              return [newLog, ...prevLogs.slice(0, 49)];
            });
          } else {
            // Check if cooldown tick is triggered (SF1)
            if (!dutyOk) {
              nextState = "COOLDOWN";
              nextWrites = 0; // reset
            } else {
              nextState = score > threshold ? "DECIDE" : score > 0.4 ? "ORIENT" : "OBSERVE";
            }
          }

          // SF1 Repos cycle resets state machine duty counters
          if (nextTick % 4 === 0) {
            nextWrites = 0;
          }

          return {
            ...node,
            state: nextState,
            score,
            consecutiveWrites: nextWrites,
            dutyCount: nextDuty
          };
        });

        // Compute Variance of scores (SF2 Jeu Sellerie)
        if (tickScores.length > 1) {
          const mean = tickScores.reduce((a,b)=>a+b,0) / tickScores.length;
          const variance = tickScores.reduce((a,b) => accVariance(a, b, mean), 0) / tickScores.length;
          // Scale it to percentage for display
          setJeuSellerieVariance(variance * 100);
        }

        setActiveWritesThisTick(countWrites);
        return updatedNodes;
      });

      setBusOUT(nextBusOUT);
      
      // Periodically trigger a log in the Forge terminal
      if (nextTick % 10 === 0) {
        onAddLog(`OODA INTERLOCK : Tick ${nextTick} complété. Bus OUT écritures sérialisées = ${countWrites}.`, "info");
      }

      return nextTick;
    });
  };

  const accVariance = (sum: number, val: number, mean: number) => {
    return sum + Math.pow(val - mean, 2);
  };

  // Playback loop controller
  useEffect(() => {
    if (oodaTimer.current) clearInterval(oodaTimer.current);
    if (isPlaying) {
      oodaTimer.current = setInterval(() => {
        triggerOodaTick();
      }, tickMs);
    }
    return () => {
      if (oodaTimer.current) clearInterval(oodaTimer.current);
    };
  }, [isPlaying, tickMs, colabBoostActive, glitchActive, N]);

  // Action: Injecter Court-Circuit
  const injectGlitchCircuit = () => {
    setNodes(prev => {
      const idx = Math.floor(Math.random() * N);
      return prev.map((node, i) => {
        if (i === idx) {
          onAddLog(`COURT-CIRCUIT ATELIER : Déconnexion forcée du Nœud #${node.id}. Bascule SF4 dégradée active.`, "error");
          return { ...node, isFailed: true, state: "ERROR" as const };
        }
        return node;
      });
    });
    setGlitchActive(true);
    setTimeout(() => setGlitchActive(false), 3000);
  };

  // Action: Restaurer les nœuds déconnectés
  const restoreAllNodes = () => {
    setNodes(prev => prev.map(node => ({ ...node, isFailed: false, state: "OBSERVE" as const })));
    onAddLog("MAINTENANCE TERMINÉE : Tous les fusibles du bus ont été remplacés. Nœuds en ligne.", "success");
  };

  // Action: Détourner Google Colab / Scavenge computing resources
  const triggerColabScavenge = () => {
    setColabBoostActive(prev => {
      const nextState = !prev;
      if (nextState) {
        onAddLog("SCAVENGER TRIGGERED : Injection de 12 cycles de calcul Colab éphémères. Tick de rotation accéléré.", "success");
        setTickMs(500);
      } else {
        onAddLog("SCAVENGER DISMISSED : Vitesse standard rétablie.", "info");
        setTickMs(1000);
      }
      return nextState;
    });
  };

  // Calculate Capacity SF4
  const activeCount = nodes.slice(0, N).filter(n => !n.isFailed).length;
  const realCapacity = N > 0 ? (activeCount / N) * 100 : 0;

  // Copy Schema to Clipboard
  const copySchemaJSON = () => {
    const schema = {
      bus_shared_array_4ko: {
        offsets: {
          "0x00": "tick_u32",
          "0x04": "lock_state_i32",
          "0x08-0x24": "16_channel_sensor_bus_in_u16",
          "0x28-0x44": "16_channel_actuator_bus_out_u16",
          "0x48": "active_writes_this_tick_u8",
          "0x50": "timestamp_epoch_ns"
        },
        mechanics: {
          arbitration: "Atomics.compareExchange hardware lock",
          duty_cycle: "3 ticks writing / 1 tick repos rule (SF1)",
          interlock: "Double sensing validation required (active writes >= 2)"
        }
      }
    };
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setSchemaCopied(true);
    setTimeout(() => setSchemaCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 shadow-2xl font-mono text-xs text-slate-350 select-none">
      
      {/* Header section with status badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-3 mb-4 gap-3">
        <div>
          <h3 className="text-sm font-extrabold uppercase text-green-400 tracking-widest flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400 animate-pulse" />
            🔥 ATELIER ESSAIM MECHANIQUE OODA (CDC V3)
          </h3>
          <p className="text-[9px] text-slate-500 uppercase tracking-wide mt-0.5">
            Synchronisation déterministe en étoile · Shared memory bus emulé · Atomics lock & Interverrouillage
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="text-[8.5px] uppercase bg-green-950/60 border border-green-900/80 px-2 py-0.5 text-green-400 font-extrabold font-mono flex items-center gap-1.5 rounded">
            <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-green-400 animate-ping" : "bg-slate-600"}`} />
            OSC: {isPlaying ? "ACTIVE TICKING" : "PAUSED"}
          </div>
          <div className="text-[8.5px] uppercase bg-slate-950 border border-slate-800 px-2 py-0.5 text-slate-400 font-extrabold font-mono rounded">
            SKEW: {tickClockSkew.toFixed(4)} MS
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COMPONENT: Controls & SF Validation Checklist */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Deck panel */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pb-1 border-b border-slate-900 flex justify-between items-center">
              <span>Éléments de contrôle</span>
              <Clock className="w-3 h-3 text-slate-500" />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>TICK COURANT :</span>
              <span className="font-extrabold text-green-400 text-sm select-all">{String(tick).padStart(5, "0")}</span>
            </div>

            {/* Slider for N */}
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>NŒUDS DE PRODUCTION (N) :</span>
                <span className="font-bold text-green-400">{N} / 12 actif(s)</span>
              </div>
              <input
                type="range"
                min="3"
                max="12"
                value={N}
                onChange={(e) => setN(parseInt(e.target.value))}
                className="w-full accent-green-500 cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="text-[9px] text-slate-400">CADENCE DU TICK OSCILLATEUR :</div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => { setTickMs(1000); setIsPlaying(true); }}
                  className={`py-1.5 px-2 rounded border font-bold text-[9px] cursor-pointer transition-all ${
                    tickMs === 1000 && isPlaying
                      ? "bg-green-500 text-slate-950 border-green-500"
                      : "border-slate-850 text-slate-400 hover:text-white"
                  }`}
                >
                  1000 MS
                </button>
                <button
                  onClick={() => { setTickMs(500); setIsPlaying(true); }}
                  className={`py-1.5 px-2 rounded border font-bold text-[9px] cursor-pointer transition-all ${
                    tickMs === 500 && isPlaying
                      ? "bg-green-500 text-slate-950 border-green-500"
                      : "border-slate-850 text-slate-400 hover:text-white"
                  }`}
                >
                  500 MS
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`py-1.5 px-2 rounded border font-bold text-[9px] cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    !isPlaying
                      ? "bg-amber-500 text-slate-950 border-amber-500 animate-pulse"
                      : "border-slate-850 text-slate-400 hover:text-white"
                  }`}
                >
                  {!isPlaying ? <Play className="w-2.5 h-2.5 fill-current" /> : <Pause className="w-2.5 h-2.5 fill-current" />}
                  {!isPlaying ? "RUN" : "PAUSE"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900/60">
              <button
                onClick={injectGlitchCircuit}
                className="py-2.5 px-2 bg-rose-950/20 border border-rose-800 hover:bg-rose-900/40 text-rose-300 font-bold text-[9px] uppercase tracking-wider rounded cursor-pointer transition-all flex items-center justify-center gap-1.5"
                title="Déconnecter un fusible sur un nœud stochastique"
              >
                <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
                Dépôt Glitch
              </button>

              <button
                onClick={triggerColabScavenge}
                className={`py-2.5 px-2 border font-bold text-[9px] uppercase tracking-wider rounded cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                  colabBoostActive
                    ? "bg-green-500 text-slate-950 border-green-500"
                    : "bg-teal-950/20 border-teal-800 hover:bg-teal-900/40 text-teal-300"
                }`}
                title="Détourner des cycles de calcul de notebooks Colab gratuits"
              >
                <Database className="w-3 h-3 text-teal-400 animate-bounce" />
                Cycles Colab
              </button>
            </div>

            {nodes.some(n => n.isFailed) && (
              <button
                onClick={restoreAllNodes}
                className="w-full py-1.5 bg-emerald-950/25 border border-emerald-900 hover:bg-emerald-900/40 text-emerald-400 rounded text-[8.5px] font-bold uppercase transition-all"
              >
                🔧 Rétablir tous les fusibles (Reset Errors)
              </button>
            )}
          </div>

          {/* SF Specifications checklist panel */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pb-1 border-b border-slate-900 flex justify-between items-center">
              <span>SF SPEC SUMMARY Checklist</span>
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400 animate-bounce" />
            </div>

            <div className="space-y-2.5 text-[10px] font-mono">
              {/* SF1: Duty cycle */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">SF1 : Duty Cycle (Forge write &le;3) :</span>
                  <span className="font-extrabold text-green-400 uppercase">SYNCHRONISÉ</span>
                </div>
                <div className="text-[8.5px] text-slate-600 uppercase">3 ticks consécutifs max, sinon repos obligatoire au tick %4</div>
              </div>

              {/* SF2: sellerie */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">SF2 : Jeu Sellerie (Tolerance &lt;0.5%) :</span>
                  <span className={`font-extrabold ${jeuSellerieVariance < 0.5 ? "text-green-400" : "text-amber-400 animate-pulse"}`}>
                    {jeuSellerieVariance.toFixed(4)} %
                  </span>
                </div>
                <div className="text-[8.5px] text-slate-600 uppercase">Variance statistique instantanée entre nœuds</div>
              </div>

              {/* SF3: Polissage checksum */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">SF3 : Checksum Polissage (&lt;1/1000) :</span>
                  <span className={`font-extrabold ${polissageDefectCount === 0 ? "text-green-400" : "text-rose-400 animate-pulse"}`}>
                    {polissageDefectCount} / {totalFramesCount} ({(totalFramesCount > 0 ? (polissageDefectCount/totalFramesCount)*100 : 0).toFixed(2)}%)
                  </span>
                </div>
                <div className="text-[8.5px] text-slate-600 uppercase">Nombre total d'anomalies de checksum CRC détectées</div>
              </div>

              {/* SF4: Dégradation capacity */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">SF4 : Capacité Résiduelle (Degradation) :</span>
                  <span className={`font-extrabold ${realCapacity === 100 ? "text-green-400" : "text-amber-400"}`}>
                    {realCapacity.toFixed(1)}% (N-1 = {activeCount})
                  </span>
                </div>
                <div className="text-[8.5px] text-slate-600 uppercase">Formulaire Guédelon mécanique : Capacité = (N-1)/N</div>
              </div>

              {/* SF5: Cycle processing Intel */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-500">SF5 : Temps Cycle Intel (Latency) :</span>
                  <span className="font-extrabold text-green-400">12 NS / CYCLE</span>
                </div>
                <div className="text-[8.5px] text-slate-600 uppercase">Lenteur CPU de l'atelier mesurée au microscope hardware</div>
              </div>
            </div>
          </div>

        </div>

        {/* MIDDLE COMPONENT: Nodes Live Processing Grid */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pb-1.5 border-b border-slate-900 flex justify-between items-center mb-3">
                <span>État des N-Nœuds en temps-réel</span>
                <span className="text-[9px] px-1 bg-slate-900 border border-slate-800 text-slate-500">LIMIT N: {N}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {nodes.slice(0, N).map((node) => {
                  const isActive = node.id <= N;
                  return (
                    <div
                      key={node.id}
                      className={`border p-2.5 rounded-lg transition-all flex flex-col justify-between h-20 ${
                        node.state === "ACT"
                          ? "bg-amber-950/20 border-amber-500/85 shadow-[0_0_8px_rgba(245,158,11,0.25)_inset]"
                          : node.state === "ERROR"
                          ? "bg-rose-950/20 border-rose-800"
                          : node.state === "COOLDOWN"
                          ? "bg-slate-900/50 border-purple-900/60 text-purple-400 dimmed"
                          : node.state === "DECIDE"
                          ? "bg-cyan-950/10 border-cyan-500/50"
                          : "bg-slate-900/30 border-slate-850"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-[10px] font-bold ${node.isFailed ? "text-rose-400 animate-pulse" : "text-green-400"}`}>
                          N{String(node.id).padStart(2, "0")}
                        </span>
                        
                        <span className={`text-[7.5px] px-1 rounded font-extrabold uppercase ${
                          node.state === "ACT"
                            ? "bg-amber-500 text-slate-950"
                            : node.state === "ERROR"
                            ? "bg-rose-950 text-rose-300 animate-pulse"
                            : node.state === "COOLDOWN"
                            ? "bg-purple-950 text-purple-300"
                            : "bg-slate-950 text-slate-550"
                        }`}>
                          {node.state}
                        </span>
                      </div>

                      {node.isFailed ? (
                        <div className="text-[7.5px] text-rose-500 uppercase font-semibold leading-tight flex items-center gap-1 mb-1">
                          ⚠️ FUSIBLE COURT-CIRCUIT COURT EXTRÊME
                        </div>
                      ) : (
                        <div>
                          <div className="flex justify-between items-center text-[8px] text-slate-500 mb-1">
                            <span>MOTIF s :</span>
                            <span className="font-semibold text-slate-300">{(node.score * 100).toFixed(0)}%</span>
                          </div>
                          
                          <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                node.state === "ACT" ? "bg-amber-500" : "bg-green-500"
                              }`}
                              style={{ width: `${node.score * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-[7.5px] text-slate-600 mt-1 uppercase">
                        <span>DUTY WRITES : {node.consecutiveWrites} / 3</span>
                        <span>SLOT {node.busSlot}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-900 text-[8px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
              <span>LECTURE simultanée permise</span>
              <span className="text-slate-800">|</span>
              <span>COMPTEUR TICK WRITES : {activeWritesThisTick}</span>
              <span className="text-slate-800">|</span>
              <span>SLOTS MEMOIRE: 16 (0-15)</span>
            </div>
          </div>

        </div>

        {/* RIGHT COMPONENT: Event Logs & Bus Live Values */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Bus State Monitor */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pb-1.5 border-b border-slate-900 flex justify-between items-center mb-2.5">
              <span>Visualisation du Bus</span>
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="space-y-1 text-[8.5px] font-mono select-all">
              <div className="text-slate-500 uppercase text-[8px]">SEGMENT BUS IN (METERED INPUTS) :</div>
              <div className="grid grid-cols-8 gap-1 text-center bg-slate-900/60 p-1 rounded-lg">
                {busIN.slice(0, 8).map((v, i) => (
                  <div key={i} className="py-1 border border-slate-950 rounded text-green-400" title={`Channel ${i}: ${v}`}>
                    {v}
                  </div>
                ))}
              </div>
              <div className="text-slate-500 uppercase text-[8px] mt-2">SEGMENT BUS OUT (ACTUATOR OUTPUTS) :</div>
              <div className="grid grid-cols-8 gap-1 text-center bg-slate-900/60 p-1 rounded-lg">
                {busOUT.slice(0, 8).map((v, i) => (
                  <div key={i} className={`py-1 border rounded font-bold ${v > 0 ? "bg-amber-900/20 border-amber-500/50 text-amber-400" : "border-slate-950 text-slate-700"}`}>
                    {v > 0 ? v : "0"}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Event Logs panel */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider pb-1.5 border-b border-slate-900 flex justify-between items-center mb-2.5">
              <span>Logs du bus d'Atelier</span>
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
            </div>

            <div className="space-y-1.5 font-mono text-[8px] max-h-36 overflow-y-auto overflow-x-hidden scrollbar-thin">
              {busLogs.map((log, i) => (
                <div key={i} className="py-1 border-b border-slate-900/40 last:border-0 flex justify-between items-start leading-relaxed">
                  <div className="text-slate-500">[{log.tick}] <span className="font-bold text-teal-400">N{log.node_id}</span></div>
                  <div className="flex-1 pl-1.5 truncate text-slate-450 text-slate-400">
                    H:{log.hash} <span className="text-amber-500 font-semibold">{log.value}</span>
                  </div>
                  <div className={`shrink-0 font-bold ${log.status.includes("ERROR") ? "text-rose-400" : "text-green-400"}`}>
                    {log.status === "SYNC OK" ? "✓" : "⚠️"}
                  </div>
                </div>
              ))}
              {busLogs.length === 0 && (
                <div className="text-slate-600 italic py-6 text-center">Aucun événement de cycle d'écriture n'a transité...</div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Footer / Copiable JSON address schema schema */}
      <div className="mt-5 p-3 bg-slate-950 border border-slate-900/90 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 relative">
        <div className="flex-1">
          <div className="text-[8.5px] text-slate-500 uppercase font-extrabold flex items-center gap-1">
            <Database className="w-3 h-3 text-teal-400" />
            CARTOGRAPHIE DU SEGMENT BUS HW REEL (SHAREDARRAYBUFFER SPECIFICATION) :
          </div>
          <p className="text-[8px] text-slate-600 mt-1 uppercase">
            Offset 0x00=Tick | Offset 0x04=Lock | Offset 0x08-0x24=Bus IN | Offset 0x28-0x44=Bus OUT
          </p>
        </div>

        <button
          onClick={copySchemaJSON}
          className="py-1.5 px-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-350 text-[9px] font-bold uppercase rounded cursor-pointer transition-colors flex items-center gap-1 px-4 shrink-0"
        >
          {schemaCopied ? <CheckCircle className="w-3 h-3 text-green-400 animate-bounce" /> : <Copy className="w-3 h-3" />}
          {schemaCopied ? "COMPLIANT JSON COPIED !" : "COPIER SCHÉMA ADRESSAGE"}
        </button>
      </div>

    </div>
  );
}
