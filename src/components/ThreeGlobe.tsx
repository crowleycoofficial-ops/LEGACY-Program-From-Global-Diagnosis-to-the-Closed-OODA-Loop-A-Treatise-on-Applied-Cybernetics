import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Define the interface for the events matching app SentinelEvent
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
}

interface ThreeGlobeProps {
  events: SentinelEvent[];
  selectedEvent: SentinelEvent | null;
  onSelectEvent: (event: SentinelEvent | null) => void;
  activeLayers: {
    UAP: boolean;
    CLIMAT: boolean;
    NEURO: boolean;
    OSINT: boolean;
  };
  tempFilter: number;
  seismicFilter: number;
  schumannFilter: number;
  timelineIndex: number; // 0-100 timeline slider
  duxMode: boolean; // active when loopActive is true or based on lever
  onUpdateCoords: (coords: { lat: number; lon: number; alt: number } | null) => void;
  isSolar?: boolean;
  isJamming?: boolean;
  apocalypseSeal?: number;
  activeSatTypes?: {
    iss: boolean;
    starlink: boolean;
    spy: boolean;
  };
  dShoggoth?: number;
  thetaTotal?: number;
  tLux?: number;
  nri?: number;
  riValue?: number;
  forgeWorldState?: {
    conflict: number;
    solar: number;
    maritime: number;
    orbital: number;
    noiseLevel: number;
  };
  forgeFactions?: {
    name: string;
    power: number;
    economy: number;
    stability: number;
    aggression: number;
    color: string;
  }[];
}

// Keplerian Satellite structure definitions
interface SatDefinition {
  id: string;
  name: string;
  type: "iss" | "starlink" | "spy";
  orbitRadius: number;
  inclination: number;
  raan: number;
  speed: number;
  phaseOffset: number;
  color: number;
}

const SAT_DEFS: SatDefinition[] = [
  { id: "iss", name: "ISS (ZARYA)", type: "iss", orbitRadius: 1.10, inclination: 51.64, raan: 45, speed: 1.0, phaseOffset: 0, color: 0x22d3ee },
  { id: "usa-224", name: "USA-224 (KH-11) SPY", type: "spy", orbitRadius: 1.20, inclination: 98.0, raan: 180, speed: 1.25, phaseOffset: Math.PI / 3, color: 0xff3b30 }
];

// Combine Starlink train of 8 small internet repeaters
for (let i = 0; i < 8; i++) {
  SAT_DEFS.push({
    id: `starlink-100${i}`,
    name: `STARLINK-100${i}`,
    type: "starlink",
    orbitRadius: 1.14,
    inclination: 53.0,
    raan: 110,
    speed: 0.95,
    phaseOffset: (i * Math.PI) / 4.0, // staggered spacing along the orbit plane
    color: 0x34d399
  });
}

// High performance Keplerian orbit position calculator
function getKeplerianPosition(
  timeMs: number,
  orbitRadius: number,
  inclinationDeg: number,
  raanDeg: number,
  speedFactor: number,
  phaseOffsetRad: number
): THREE.Vector3 {
  const inc = (inclinationDeg * Math.PI) / 180;
  const raan = (raanDeg * Math.PI) / 180;
  const theta = (timeMs * 0.00012 * speedFactor) + phaseOffsetRad;

  // 1. Position in orbital plane
  const xOrb = orbitRadius * Math.cos(theta);
  const zOrb = orbitRadius * Math.sin(theta);
  const yOrb = 0;

  // 2. Apply Inclination rotation around the X axis
  const x1 = xOrb;
  const y1 = yOrb * Math.cos(inc) - zOrb * Math.sin(inc);
  const z1 = yOrb * Math.sin(inc) + zOrb * Math.cos(inc);

  // 3. Apply Right Ascension longitude around Y polar axis
  const xFinal = x1 * Math.cos(raan) - z1 * Math.sin(raan);
  const yFinal = y1;
  const zFinal = x1 * Math.sin(raan) + z1 * Math.cos(raan);

  return new THREE.Vector3(xFinal, yFinal, zFinal);
}

export default function ThreeGlobe({
  events,
  selectedEvent,
  onSelectEvent,
  activeLayers,
  tempFilter,
  seismicFilter,
  schumannFilter,
  timelineIndex,
  duxMode,
  onUpdateCoords,
  isSolar = false,
  isJamming = false,
  apocalypseSeal = -1,
  activeSatTypes = { iss: true, starlink: true, spy: true },
  dShoggoth = 0.35,
  thetaTotal = 0.45,
  tLux = 1.2,
  nri = 0.5,
  riValue = 0.25,
  forgeWorldState,
  forgeFactions
}: ThreeGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Track loaded state
  const [loading, setLoading] = useState(true);

  // Keep references to ThreeJS instances to manipulate them reactively
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Group references for layered items
  const firmsGroupRef = useRef<THREE.Group | null>(null);
  const usgsGroupRef = useRef<THREE.Group | null>(null);
  const osintGroupRef = useRef<THREE.Group | null>(null);
  const schumannGroupRef = useRef<THREE.Group | null>(null);
  const satGroupRef = useRef<THREE.Group | null>(null);
  const moonGroupRef = useRef<THREE.Group | null>(null);
  const forgeGroupRef = useRef<THREE.Group | null>(null);
  const cloudsRef = useRef<THREE.Mesh | null>(null);
  const auroraMeshRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const atmosphereMeshRef = useRef<THREE.Mesh | null>(null);

  // Interactive mouse click tracking raycaster
  const rayMeshRef = useRef<THREE.Mesh | null>(null); // the interactive globe collider

  const globeRadius = 1;

  // Helper: Convert Lat/Lon to 3D Vector on sphere surface
  function latLonToVec3(lat: number, lon: number, radius: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  }

  // --- INITIALIZE THREE.JS ---
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // 1. Create Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 0, 3.2);
    cameraRef.current = camera;

    // 2. Create Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // 3. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.55;
    controls.minDistance = 1.15;
    controls.maxDistance = 6.0;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controlsRef.current = controls;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    sunLight.position.set(5, 3, 5);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    // 5. Stars System
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 1800;
    const starCoords = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount * 3; i++) {
      starCoords[i] = (Math.random() - 0.5) * 80;
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(starCoords, 3));
    const starsMaterial = new THREE.PointsMaterial({
      size: 0.015,
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);

    // 6. Layer Groups
    const firmsGroup = new THREE.Group();
    const usgsGroup = new THREE.Group();
    const osintGroup = new THREE.Group();
    const schumannGroup = new THREE.Group();
    const satGroup = new THREE.Group();
    const moonGroup = new THREE.Group();
    const forgeGroup = new THREE.Group();
    scene.add(firmsGroup);
    scene.add(usgsGroup);
    scene.add(osintGroup);
    scene.add(schumannGroup);
    scene.add(satGroup);
    scene.add(moonGroup);
    scene.add(forgeGroup);
    
    firmsGroupRef.current = firmsGroup;
    usgsGroupRef.current = usgsGroup;
    osintGroupRef.current = osintGroup;
    schumannGroupRef.current = schumannGroup;
    satGroupRef.current = satGroup;
    moonGroupRef.current = moonGroup;
    forgeGroupRef.current = forgeGroup;

    // --- Moon Orbit Line & Sphere Mesh Setup ---
    const moonOrbitPts: THREE.Vector3[] = [];
    for (let j = 0; j <= 120; j++) {
      const ang = (j / 120) * Math.PI * 2;
      moonOrbitPts.push(new THREE.Vector3(Math.cos(ang) * 3.5, 0, Math.sin(ang) * 3.5));
    }
    const moonOrbitGeo = new THREE.BufferGeometry().setFromPoints(moonOrbitPts);
    const moonOrbitMat = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.18,
    });
    const moonOrbitLine = new THREE.Line(moonOrbitGeo, moonOrbitMat);
    moonOrbitLine.rotation.x = Math.PI / 2;
    moonGroup.add(moonOrbitLine);

    const moonGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const moonMat = new THREE.MeshPhongMaterial({
      color: 0x94a3b8,
      emissive: 0x020617,
      specular: 0x111111,
      shininess: 1,
    });
    const moonMesh = new THREE.Mesh(moonGeo, moonMat);
    moonMesh.userData = { name: "MOON (LUNA)", type: "moon" };
    moonGroup.add(moonMesh);

    // --- Satellite Orbits & Static Geometries Setup ---
    SAT_DEFS.forEach((sat) => {
      // Draw static orbit track for each satellite
      const pts: THREE.Vector3[] = [];
      const steps = 120;
      for (let s = 0; s <= steps; s++) {
        pts.push(
          getKeplerianPosition(
            0,
            sat.orbitRadius,
            sat.inclination,
            sat.raan,
            0, // frozen phase to trace circle boundary circumference
            (s / steps) * Math.PI * 2
          )
        );
      }
      const trackGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const trackMat = new THREE.LineDashedMaterial({
        color: sat.color,
        dashSize: 0.025,
        gapSize: 0.015,
        transparent: true,
        opacity: sat.type === "spy" ? 0.40 : 0.18,
      });
      const trackLine = new THREE.Line(trackGeo, trackMat);
      trackLine.computeLineDistances();
      satGroup.add(trackLine);

      // Create satellite marker mesh
      let satGeo: THREE.BufferGeometry;
      if (sat.type === "iss") {
        satGeo = new THREE.BoxGeometry(0.015, 0.005, 0.025);
      } else if (sat.type === "spy") {
        satGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.018, 6);
      } else {
        satGeo = new THREE.OctahedronGeometry(0.004, 0);
      }

      const satMat = new THREE.MeshBasicMaterial({
        color: sat.color,
      });
      const satMesh = new THREE.Mesh(satGeo, satMat);
      satMesh.name = sat.id;
      satMesh.userData = {
        name: sat.name,
        satType: sat.type,
        color: sat.color
      };
      satGroup.add(satMesh);
    });

    // Create tactical laser tracking beam for USA-224 polar satellite during Seal 3
    const laserGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ]);
    const laserMaterial = new THREE.LineBasicMaterial({
      color: 0xef4444, // neon crimson tactical red
      transparent: true,
      opacity: 0.0,    // default hidden
    });
    const spyLaser = new THREE.Line(laserGeometry, laserMaterial);
    spyLaser.name = "usa-224-laser";
    satGroup.add(spyLaser);

    // 7. Textures Loading with beautiful Blueprints limits
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    const textures = {
      day: "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      bump: "https://unpkg.com/three-globe/example/img/earth-topology.png",
      clouds: "https://unpkg.com/three-globe/example/img/earth-clouds.png",
    };

    let globeMaterial: THREE.Material;

    // Pre-create generic procedural fallback material in case image sources fail (offline usage)
    const fallbackMaterial = new THREE.MeshPhongMaterial({
      color: 0x0f172a,
      emissive: 0x020617,
      specular: 0x475569,
      shininess: 15,
      wireframe: false,
    });

    const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    const globeMesh = new THREE.Mesh(globeGeometry, fallbackMaterial);
    scene.add(globeMesh);
    rayMeshRef.current = globeMesh;

    // Try loading actual Earth textures
    textureLoader.load(
      textures.day,
      (dayTex) => {
        setLoading(false);
        dayTex.colorSpace = THREE.SRGBColorSpace;
        
        // Enhance material
        const liveMat = new THREE.MeshPhongMaterial({
          map: dayTex,
          specular: new THREE.Color(0x222222),
          shininess: 6,
        });

        // Add bump texture if possible
        textureLoader.load(
          textures.bump,
          (bumpTex) => {
            liveMat.bumpMap = bumpTex;
            liveMat.bumpScale = 0.035;
            liveMat.needsUpdate = true;
          },
          undefined,
          (err) => console.warn("Failed to load topology bump map, using planar", err)
        );

        globeMesh.material = liveMat;
        globeMesh.material.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.warn("Failed loading Earth Day texture. Falling back to wire-mesh tactical visual.", err);
        setLoading(false);
        // Stylize the fallback as a stunning glowing grid
        const gridMat = new THREE.MeshPhongMaterial({
          color: 0x111c30,
          emissive: 0x040b1a,
          specular: 0x1e3a8a,
          shininess: 25,
        });
        globeMesh.material = gridMat;
        globeMesh.material.needsUpdate = true;
      }
    );

    // 8. Clouds sphere overlay outer rim
    const cloudsGeometry = new THREE.SphereGeometry(globeRadius * 1.008, 64, 64);
    const cloudsMaterial = new THREE.MeshPhongMaterial({
      transparent: true,
      opacity: 0.0, // default until loaded
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    scene.add(cloudsMesh);
    cloudsRef.current = cloudsMesh;

    textureLoader.load(
      textures.clouds,
      (cloudsTex) => {
        cloudsMaterial.map = cloudsTex;
        cloudsMaterial.opacity = 0.45;
        cloudsMaterial.needsUpdate = true;
      },
      undefined,
      (err) => console.warn("Failed loading clouds texture, spinning hidden layers", err)
    );

    // 9. Volumetric Atmosphere Glow Shader
    const atmosphereGeometry = new THREE.SphereGeometry(globeRadius * 1.15, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
          // Waving light blue/cyan glow
          gl_FragColor = vec4(0.2, 0.55, 0.9, 1.0) * intensity * 0.7;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphereMesh);
    atmosphereMeshRef.current = atmosphereMesh;

    // 10. Schumann Aurora Waves Shader Ring
    const auroraGeometry = new THREE.SphereGeometry(globeRadius * 1.045, 64, 64);
    const auroraVertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;
    const auroraFragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform vec3 hotspots[5];
      uniform float time;
      uniform float activity;
      void main() {
        float intensity = 0.0;
        vec3 dir = normalize(vPosition);
        for (int i = 0; i < 5; i++) {
          float d = dot(dir, normalize(hotspots[i]));
          float angle = acos(clamp(d, -1.0, 1.0));
          // Gaussian dispersion around each hotspot field
          float sigma = 0.35;
          intensity += exp(-angle * angle / (2.0 * sigma * sigma)) * 0.7;
        }
        intensity = clamp(intensity, 0.0, 1.0);
        // Dynamic time-based electric waving
        intensity *= 0.55 + 0.45 * sin(time * 2.5 + vPosition.y * 7.5);
        
        // Fluorescent green electromagnetic aurora color
        vec3 color = vec3(0.05, 0.95, 0.35) * intensity * activity;
        float alpha = intensity * 0.65 * activity;
        
        gl_FragColor = vec4(color, alpha);
      }
    `;

    // Static default seed hotspots corresponding to observatories/lightning maps
    const defaultHotspots = [
      latLonToVec3(64.8, -19.2, 1.0),  // Iceland
      latLonToVec3(-3.4, -62.2, 1.0),  // Amazon
      latLonToVec3(55.8, 37.6, 1.0),   // Tomsk region
      latLonToVec3(-6.2, 106.8, 1.0),  // Indonesia
      latLonToVec3(42.36, -71.06, 1.0), // Boston MIT
    ];

    const auroraMaterial = new THREE.ShaderMaterial({
      vertexShader: auroraVertexShader,
      fragmentShader: auroraFragmentShader,
      uniforms: {
        hotspots: { value: defaultHotspots },
        time: { value: 0 },
        activity: { value: 0.8 },
      },
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
    });
    const auroraMesh = new THREE.Mesh(auroraGeometry, auroraMaterial);
    scene.add(auroraMesh);
    auroraMeshRef.current = auroraMesh;

    // --- RESIZE OBSERVER CRADLE ---
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      
      const cam = cameraRef.current;
      const ren = rendererRef.current;
      if (cam && ren) {
        cam.aspect = width / height;
        cam.updateProjectionMatrix();
        ren.setSize(width, height);
      }
    });
    resizeObserver.observe(containerRef.current);

    // --- ANIMATION RECURRING RENDER LOOP ---
    let frameId: number;
    const startAnimation = () => {
      const animate = () => {
        frameId = requestAnimationFrame(animate);

        const ctrl = controlsRef.current;
        if (ctrl) ctrl.update();

        // Spin clouds slowly
        const clouds = cloudsRef.current;
        if (clouds && apocalypseSeal !== 6) {
          clouds.rotation.y += 0.00018;
          clouds.rotation.x += 0.00005;
        }

        // Real-time Sun position alignment with hourly UTC clock
        const sunLight = sunLightRef.current;
        if (sunLight && apocalypseSeal !== 6) {
          const now = new Date();
          const utch = now.getUTCHours() + now.getUTCMinutes() / 60;
          const sunAngle = (utch / 24) * Math.PI * 2 - Math.PI / 2;
          sunLight.position.set(Math.cos(sunAngle) * 5, 2.2, Math.sin(sunAngle) * 5);
        }

        // 1. UPDATE PLANET MOON
        const moonGroup = moonGroupRef.current;
        if (moonGroup) {
          moonGroup.visible = !!isSolar && apocalypseSeal !== 6;
          if (isSolar && apocalypseSeal !== 6) {
            const moonMesh = moonGroup.children[1] as THREE.Mesh;
            if (moonMesh) {
              const timeFactor = performance.now() * 0.00018;
              moonMesh.position.set(Math.cos(timeFactor) * 3.5, 0, Math.sin(timeFactor) * 3.5);
              moonMesh.rotation.y += 0.002;
            }
          }
        }

        // 2. UPDATE KEPPLER SATELLITES
        const satGroup = satGroupRef.current;
        if (satGroup) {
          const timeMs = performance.now();
          const applyJitter = !!isJamming && Math.random() < 0.28;

          satGroup.children.forEach((child) => {
            if (child instanceof THREE.Mesh) {
              const sType = child.userData.satType as "iss" | "starlink" | "spy";
              const isFilteredVisible = activeSatTypes ? activeSatTypes[sType] : true;
              
              child.visible = isFilteredVisible && (apocalypseSeal !== 6);

              if (child.visible) {
                const def = SAT_DEFS.find((d) => d.id === child.name);
                if (def) {
                  const pos = getKeplerianPosition(
                    timeMs,
                    def.orbitRadius,
                    def.inclination,
                    def.raan,
                    def.speed,
                    def.phaseOffset
                  );

                  if (applyJitter) {
                    pos.add(new THREE.Vector3(
                      (Math.random() - 0.5) * 0.04,
                      (Math.random() - 0.5) * 0.04,
                      (Math.random() - 0.5) * 0.04
                    ));
                  }

                  child.position.copy(pos);
                  child.lookAt(0, 0, 0);
                  child.rotateX(Math.PI / 2);
                }
              }
            } else if (child instanceof THREE.Line) {
              child.visible = (apocalypseSeal !== 6);
            }
          });

          // Draw vertical targeted laser beam for spy satellite under Apocalypse Seal 3 (Conquest)
          const spyLaserMesh = satGroup.getObjectByName("usa-224-laser") as THREE.Line;
          if (spyLaserMesh) {
            const spyMesh = satGroup.getObjectByName("usa-224") as THREE.Mesh;
            if (spyMesh && apocalypseSeal === 3 && spyMesh.visible) {
              spyLaserMesh.visible = true;
              const satPos = spyMesh.position.clone();
              // Earth surface position is the normalized vector at the surface of unit sphere (globeRadius = 1)
              const surfPos = satPos.clone().normalize().multiplyScalar(1.0);
              spyLaserMesh.geometry.setFromPoints([satPos, surfPos]);
              if (spyLaserMesh.material instanceof THREE.LineBasicMaterial) {
                spyLaserMesh.material.opacity = 0.6 + 0.4 * Math.sin(performance.now() * 0.02);
              }
            } else {
              spyLaserMesh.visible = false;
            }
          }
        }

        // 3. APOCALYPSE SEALS SHADERS & MATS OVERRIDES
        const amb = ambientLightRef.current;
        const sun = sunLightRef.current;
        const atm = atmosphereMeshRef.current;
        const aur = auroraMeshRef.current;

        // Restore baseline lights values to prevent permanent shifts after toggle-off
        if (amb) amb.intensity = (apocalypseSeal === 1) ? 0.12 : (apocalypseSeal === 6 ? 0.0 : 1.2);
        if (sun) sun.intensity = (apocalypseSeal === 1) ? 0.35 : (apocalypseSeal === 6 ? 0.0 : 2.5);

        if (apocalypseSeal === 0) {
          // Seal 0: WAR - Atmosphere shifts to emergency red glow
          if (atm && atm.material instanceof THREE.ShaderMaterial) {
            atm.visible = true;
            atm.material.fragmentShader = `
              varying vec3 vNormal;
              void main() {
                float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
                gl_FragColor = vec4(0.95, 0.18, 0.05, 1.0) * intensity * 0.95;
              }
            `;
            atm.material.needsUpdate = true;
          }
        } else if (apocalypseSeal === 6) {
          // Seal 6: SILENCE - Absolute total blackout
          if (atm) atm.visible = false;
          if (aur) aur.visible = false;
        } else {
          // Normal light blue / cyan atmosphere behavior
          if (atm && apocalypseSeal !== 6) {
            atm.visible = true;
            if (atm.material instanceof THREE.ShaderMaterial && atm.material.fragmentShader.includes("0.95, 0.18")) {
              atm.material.fragmentShader = `
                varying vec3 vNormal;
                void main() {
                  float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.8);
                  gl_FragColor = vec4(0.2, 0.55, 0.9, 1.0) * intensity * 0.7;
                }
              `;
              atm.material.needsUpdate = true;
            }
          }
          if (aur && apocalypseSeal !== 6) aur.visible = true;
        }

        // Animate Aurora Shader uniforms
        const aurora = auroraMeshRef.current;
        if (aurora && aurora.material instanceof THREE.ShaderMaterial) {
          // If Seal 4 (Martyr) is active, boost frequency activity significantly
          const speedMultiplier = apocalypseSeal === 4 ? 6.5 : 1.0;
          aurora.material.uniforms.time.value = performance.now() * 0.001 * speedMultiplier;
          aurora.material.uniforms.activity.value = apocalypseSeal === 4 ? 2.5 : (duxMode ? 1.35 : 0.70);
        }

        // Pulse OSINT points & rotate radar cones
        const osint = osintGroupRef.current;
        if (osint) {
          // Jitter points of interest if active Jamming is on
          const time = performance.now() * 0.004;
          osint.children.forEach((child) => {
            if (child.userData.isRadarCone) {
              child.rotateY(isJamming ? 0.045 : 0.015);
            } else if (child instanceof THREE.Mesh && child.userData.baseScale) {
              const baseScale = child.userData.baseScale || 1.0;
              const phase = child.userData.phase || 0;
              const flicker = isJamming ? (0.6 + 0.4 * Math.sin(time * 3 + phase)) : 1.0;
              const scale = baseScale * (1.0 + 0.28 * Math.sin(time + phase)) * flicker;
              child.scale.set(scale, scale, scale);
            }
          });
        }

        // Animate Forge Group nodes in real-time matching telemetry
        const fg = forgeGroupRef.current;
        if (fg) {
          const tFactor = performance.now() * 0.001;
          const noise = forgeWorldState?.noiseLevel ?? 0.3;
          const speed = 0.5 * (1.0 + noise * 1.5);
          fg.children.forEach((child) => {
            if (child.name.startsWith("swarm-node-")) {
              const baseAngle = child.userData.angleIndex || 0;
              const curAngle = tFactor * speed + baseAngle;
              const x = Math.cos(curAngle) * 1.15;
              const y = Math.sin(curAngle) * 0.15 * Math.sin(curAngle);
              const z = Math.sin(curAngle) * 1.15;
              child.position.set(x, y, z);
              child.rotation.y += 0.02;
              child.rotation.x += 0.015;
            } else if (child.name.startsWith("f-capital-head-")) {
              const baseScale = child.userData.baseScale || 1.0;
              const pulse = baseScale * (1.0 + 0.12 * Math.sin(tFactor * 4 + (child.userData.phase || 0)));
              child.scale.set(pulse, pulse, pulse);
            } else if (child.name === "agi-attractor-ring") {
              child.rotation.y += 0.003 * speed;
            }
          });
        }

        const ren = rendererRef.current;
        const scn = sceneRef.current;
        const cm = cameraRef.current;
        if (ren && scn && cm) {
          ren.render(scn, cm);
        }
      };
      animate();
    };
    startAnimation();

    // CLEANUP
    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  // --- REACT TO SWITCHING DEVIANT MODES (DUX VS. AGI LEVER) ---
  useEffect(() => {
    const sun = sunLightRef.current;
    const ctrl = controlsRef.current;
    const aurora = auroraMeshRef.current;

    if (duxMode) {
      // AGI Mode: Intense tech blue lighting, faster spinning
      if (sun) sun.color.setHex(0xa5f3fc); // electric cyan blue tint
      if (ctrl) {
        ctrl.autoRotateSpeed = 0.85; // Faster rotation
      }
      if (aurora && aurora.material instanceof THREE.ShaderMaterial) {
        // Boost aurora luminous activity
        aurora.material.uniforms.activity.value = 1.35;
      }
    } else {
      // Dux Model: Realist warm neutral natural daylight lighting, slow spinning
      if (sun) sun.color.setHex(0xffffff);
      if (ctrl) {
        ctrl.autoRotateSpeed = 0.35;
      }
      if (aurora && aurora.material instanceof THREE.ShaderMaterial) {
        aurora.material.uniforms.activity.value = 0.70;
      }
    }
  }, [duxMode]);

  // --- REACT TO FORGERON AGI ORBIT & GEOPOLITICAL FACTION UPDATES ---
  useEffect(() => {
    const fg = forgeGroupRef.current;
    if (!fg) return;

    // 1. Clear old Children
    while (fg.children.length > 0) {
      const child = fg.children[0];
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      } else if (child instanceof THREE.Line) {
        child.geometry.dispose();
        if (child.material instanceof THREE.Material) child.material.dispose();
      }
      fg.remove(child);
    }

    // 2. Define the realist power capital coordinates
    const capitals = [
      { name: "USA", lat: 38.9072, lon: -77.0369, defaultColor: 0x22d3ee }, // Cyan
      { name: "CHINE", lat: 39.9042, lon: 116.4074, defaultColor: 0xf59e0b }, // Amber
      { name: "RUSSIE", lat: 55.7558, lon: 37.6173, defaultColor: 0xf43f5e }, // Rose
      { name: "EUROPE (UE)", lat: 50.8503, lon: 4.3517, defaultColor: 0x14b8a6 }, // Teal
      { name: "SUD GLOBAL", lat: -25.7479, lon: 28.1878, defaultColor: 0xa855f7 } // Purple
    ];

    capitals.forEach((cap) => {
      // Find corresponding state in forgeFactions
      const fac = forgeFactions?.find(
        (f) => f.name.toUpperCase() === cap.name.toUpperCase()
      );
      const p = fac ? fac.power : 0.7;
      const agg = fac ? fac.aggression : 0.5;

      const base = latLonToVec3(cap.lat, cap.lon, globeRadius);
      const height = 0.03 + p * 0.08;
      const top = latLonToVec3(cap.lat, cap.lon, globeRadius + height);

      // Plot outward cylinder representing vector power
      const cylGeo = new THREE.CylinderGeometry(0.0035, 0.0055, height, 6);
      cylGeo.translate(0, height / 2, 0);
      const normal = base.clone().normalize();
      const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      cylGeo.applyQuaternion(quat);
      cylGeo.translate(base.x, base.y, base.z);

      const cylMat = new THREE.MeshBasicMaterial({
        color: cap.defaultColor,
        transparent: true,
        opacity: 0.5 + dShoggoth * 0.3
      });
      const cylMesh = new THREE.Mesh(cylGeo, cylMat);
      cylMesh.name = `f-capital-bar-${cap.name}`;
      fg.add(cylMesh);

      // Pulsing head sphere on top of vector bar
      const headGeo = new THREE.SphereGeometry(0.008 + agg * 0.006, 8, 8);
      const headMat = new THREE.MeshBasicMaterial({
        color: cap.defaultColor,
        transparent: true,
        opacity: 0.95
      });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.copy(top);
      headMesh.name = `f-capital-head-${cap.name}`;
      headMesh.userData = { baseScale: 1.0, phase: Math.random() * 10 };
      fg.add(headMesh);
    });

    // 3. Connect capitals with tension bezier lines matching conflict score
    const connections = [
      { from: 0, to: 3 }, // USA -> EU
      { from: 0, to: 1 }, // USA -> CHINE
      { from: 1, to: 2 }, // CHINE -> RUSSIE
      { from: 2, to: 3 }, // RUSSIE -> EU
      { from: 4, to: 1 }, // SUD GLOBAL -> CHINE
      { from: 4, to: 0 }  // SUD GLOBAL -> USA
    ];
    connections.forEach((conn, idx) => {
      const c1 = capitals[conn.from];
      const c2 = capitals[conn.to];
      const p1 = latLonToVec3(c1.lat, c1.lon, globeRadius + 0.015);
      const p2 = latLonToVec3(c2.lat, c2.lon, globeRadius + 0.015);

      const mid = new THREE.Vector3()
        .addVectors(p1, p2)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(globeRadius + 0.08 + (forgeWorldState?.conflict ?? 0.3) * 0.1);

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(12);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

      const tensionColor = (forgeWorldState?.conflict ?? 0.4) > 0.65 ? 0xff4500 : 0xec4899; // red-orange or deep pink
      const lineMat = new THREE.LineBasicMaterial({
        color: tensionColor,
        transparent: true,
        opacity: 0.25 + (forgeWorldState?.conflict ?? 0.3) * 0.55
      });
      const lineMesh = new THREE.Line(lineGeo, lineMat);
      lineMesh.name = `faction-tension-arc-${idx}`;
      fg.add(lineMesh);
    });

    // 4. Trace Forgeron AGI Attractor orbital ring (Equatorial tilted loop)
    const ringPts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const ang = (i / 64) * Math.PI * 2;
      const x = Math.cos(ang) * 1.15;
      const y = Math.sin(ang) * 0.14 * Math.sin(ang); // tilted rise
      const z = Math.sin(ang) * 1.15;
      ringPts.push(new THREE.Vector3(x, y, z));
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
    const ringMat = new THREE.LineBasicMaterial({
      color: 0xff6b00, // Forgeron signature ORANGE
      transparent: true,
      opacity: 0.35 + riValue * 0.5
    });
    const ringMesh = new THREE.Line(ringGeo, ringMat);
    ringMesh.name = "agi-attractor-ring";
    fg.add(ringMesh);

    // 5. Spawn Swarm Compilers rotating widgets
    for (let s = 0; s < 4; s++) {
      const sGeo = new THREE.OctahedronGeometry(0.009 + nri * 0.006, 0);
      const sMat = new THREE.MeshBasicMaterial({
        color: 0x22c55e, // Green
        transparent: true,
        opacity: 0.8
      });
      const sMesh = new THREE.Mesh(sGeo, sMat);
      sMesh.name = `swarm-node-${s}`;
      sMesh.userData = { angleIndex: s * (Math.PI / 2.0) };
      fg.add(sMesh);
    }

    // 6. Project Aurora electromagnetic activity hotspots over active capital capitals
    const aurora = auroraMeshRef.current;
    if (aurora && aurora.material instanceof THREE.ShaderMaterial) {
      const liveHotspots = capitals.map((c) => latLonToVec3(c.lat, c.lon, globeRadius));
      aurora.material.uniforms.hotspots.value = liveHotspots;
    }
  }, [forgeFactions, forgeWorldState, dShoggoth, thetaTotal, tLux, nri, riValue]);

  // --- REACT TO APOCALYPSE SEALS WATER specular COLOR (BLOOD RED) ---
  useEffect(() => {
    const globe = rayMeshRef.current;
    if (globe && globe.material instanceof THREE.MeshPhongMaterial) {
      if (apocalypseSeal === 2) {
        // Turning seas specular reflection to toxic blood red
        globe.material.specular.setHex(0x9d0208);
        globe.material.color.setHex(0x450a0a);
      } else {
        // Restore standard color representation
        globe.material.specular.setHex(0x222222);
        globe.material.color.setHex(0xffffff);
      }
      globe.material.needsUpdate = true;
    }
  }, [apocalypseSeal]);

  // --- REACT TO SOLAR SCOPE OPTICAL TRANSITIONS ---
  useEffect(() => {
    const cam = cameraRef.current;
    const ctrl = controlsRef.current;
    if (!cam || !ctrl) return;
    if (isSolar) {
      // Shift viewpoint out to let user observe Earth and Lunar orbit
      cam.position.set(0, 4.2, 7.2);
      ctrl.minDistance = 1.15;
      ctrl.maxDistance = 22.0;
    } else {
      // Return focus to Earth sphere surface
      cam.position.set(0, 0, 3.2);
      ctrl.minDistance = 1.15;
      ctrl.maxDistance = 6.0;
    }
    ctrl.update();
  }, [isSolar]);

  // --- REBUILD DYNAMIC LAYERS BASED ON ACTIVE TELEMETRY EVENTS AND SLIDERS ---
  useEffect(() => {
    const scene = sceneRef.current;
    const firms = firmsGroupRef.current;
    const usgs = usgsGroupRef.current;
    const osint = osintGroupRef.current;
    if (!scene || !firms || !usgs || !osint) return;

    // Clear previous elements
    while (firms.children.length > 0) firms.remove(firms.children[0]);
    while (usgs.children.length > 0) usgs.remove(usgs.children[0]);
    while (osint.children.length > 0) osint.remove(osint.children[0]);

    // Gather active events
    // Playback filter age index
    const sorted = [...events].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const cutLimit = Math.floor((sorted.length * timelineIndex) / 100);
    const activeEvents = sorted.slice(0, Math.max(1, cutLimit));

    activeEvents.forEach((ev) => {
      // Check Layer filter toggle
      if (!activeLayers[ev.pillar]) return;

      const isBloom = ev.tag === "BLOOM";
      const isSelected = selectedEvent?.id === ev.id;

      // 1. LAYER CLIMAT : FIRE (NASA FIRMS)
      if (ev.source.includes("NASA_FIRMS") || ev.typeIcon === "fire") {
        if (ev.intensity < tempFilter) return;

        // Draw thermal column pillar
        const baseHeight = 0.05 + (ev.intensity / 900) * 0.22; // scale proportional
        const height = isSelected ? baseHeight * 1.5 : baseHeight;
        const color = isBloom ? 0xff3700 : 0xff7700; // fiery orange/red

        const basePos = latLonToVec3(ev.lat, ev.lon, globeRadius);
        const topPos = latLonToVec3(ev.lat, ev.lon, globeRadius + height);

        // Cylinder Geometry oriented radially out
        const cylGeo = new THREE.CylinderGeometry(0.0055, 0.0055, height, 6);
        cylGeo.translate(0, height / 2, 0); // shift base to local zero

        const normal = basePos.clone().normalize();
        const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
        cylGeo.applyQuaternion(quat);
        cylGeo.translate(basePos.x, basePos.y, basePos.z);

        const cylMat = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: isSelected ? 0.95 : 0.70,
        });
        const cylMesh = new THREE.Mesh(cylGeo, cylMat);
        cylMesh.userData = { eventId: ev.id, isPillar: true };
        firms.add(cylMesh);

        // Header glow point
        const headGeo = new THREE.SphereGeometry(isSelected ? 0.016 : 0.011, 8, 8);
        const headMat = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.9,
        });
        const headMesh = new THREE.Mesh(headGeo, headMat);
        headMesh.position.copy(topPos);
        headMesh.userData = { eventId: ev.id };
        firms.add(headMesh);
      }

      // 2. LAYER CLIMAT : SEISMIC (USGS EARTHQUAKES)
      if (ev.source.includes("USGS_SEISMIC") || ev.typeIcon === "seismic") {
        if (ev.intensity < seismicFilter) return;

        // Concentric Seismic shock rings
        const center = latLonToVec3(ev.lat, ev.lon, globeRadius);
        const normal = center.clone().normalize();
        const magnitude = ev.intensity;
        const baseRadius = 0.014 * magnitude;
        
        // Colors from yellow to bright crimson
        const ringColor = magnitude >= 5.5 ? 0xef4444 : magnitude >= 4.0 ? 0xf59e0b : 0xeab308;

        // Generates lines aligned tangent to surface (orthogonal to Normal vector)
        const arbitrary = new THREE.Vector3(1, 0, 0);
        if (Math.abs(normal.dot(arbitrary)) > 0.98) arbitrary.set(0, 1, 0);
        const u = new THREE.Vector3().crossVectors(normal, arbitrary).normalize();
        const v = new THREE.Vector3().crossVectors(u, normal).normalize();

        const count = isSelected ? 5 : 3;
        for (let r = 0; r < count; r++) {
          const radius = baseRadius * (r + 1) * 0.9;
          const segments = 48;
          const points: THREE.Vector3[] = [];

          for (let s = 0; s <= segments; s++) {
            const angle = (s / segments) * Math.PI * 2;
            const dx = Math.cos(angle) * radius;
            const dy = Math.sin(angle) * radius;
            // Project slightly above surface to prevent clipping (1.003 radius)
            const projectedRingPt = center
              .clone()
              .normalize()
              .multiplyScalar(globeRadius * 1.002)
              .add(u.clone().multiplyScalar(dx))
              .add(v.clone().multiplyScalar(dy));
            points.push(projectedRingPt);
          }

          const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
          const ringMat = new THREE.LineBasicMaterial({
            color: ringColor,
            transparent: true,
            opacity: isSelected ? 0.95 - r * 0.15 : 0.65 - r * 0.15,
          });
          const ringMesh = new THREE.Line(ringGeo, ringMat);
          ringMesh.userData = { eventId: ev.id };
          usgs.add(ringMesh);
        }
      }

      // 3. LAYER OSINT / NEURO / UAP : SPECIALIZED RADAR, MARINE, AERO & GENERAL PULSATING POINTS
      if (ev.pillar === "OSINT" || ev.pillar === "UAP" || ev.pillar === "NEURO") {
        if (ev.pillar === "NEURO" && ev.source.startsWith("SOSRFF") && ev.intensity < schumannFilter) {
          return; // omit Schumann under slider
        }

        const isRadar = ev.typeIcon === "radar";
        const isShip = ev.typeIcon === "ship";
        const isPlane = ev.typeIcon === "plane";

        if (isRadar) {
          const basePos = latLonToVec3(ev.lat, ev.lon, globeRadius);

          // Grey radome dome
          const domeGeo = new THREE.SphereGeometry(0.009, 8, 8);
          const domeMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
          const domeMesh = new THREE.Mesh(domeGeo, domeMat);
          domeMesh.position.copy(basePos);
          domeMesh.userData = { eventId: ev.id };
          osint.add(domeMesh);

          // Translucent radar sweep cone
          const coneHeight = isSelected ? 0.12 : 0.08;
          const coneGeo = new THREE.CylinderGeometry(0.025, 0.001, coneHeight, 12, 1, true);
          coneGeo.translate(0, coneHeight / 2, 0); // shift local base pivot to center coords
          const normal = basePos.clone().normalize();
          coneGeo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal));

          const coneMat = new THREE.MeshBasicMaterial({
            color: 0x10b981, // high-contrast military green
            transparent: true,
            opacity: isSelected ? 0.40 : 0.18,
            side: THREE.DoubleSide,
            depthWrite: false
          });
          const coneMesh = new THREE.Mesh(coneGeo, coneMat);
          coneMesh.position.copy(basePos);
          coneMesh.userData = {
            eventId: ev.id,
            isRadarCone: true
          };
          osint.add(coneMesh);

        } else if (isShip) {
          const basePos = latLonToVec3(ev.lat, ev.lon, globeRadius * 1.001);

          // Floating triangular wedge-hull geometry
          const shipGeo = new THREE.ConeGeometry(0.006, 0.015, 4);
          shipGeo.rotateX(Math.PI / 2);
          const normal = basePos.clone().normalize();
          shipGeo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal));

          const shipMat = new THREE.MeshBasicMaterial({
            color: isSelected ? 0x22d3ee : 0x06b6d4, // glowing cyan AIS
            transparent: true,
            opacity: 0.95
          });
          const shipMesh = new THREE.Mesh(shipGeo, shipMat);
          shipMesh.position.copy(basePos);
          shipMesh.userData = { eventId: ev.id };
          osint.add(shipMesh);

          // Simple small dotted maritime wake trail leading up to location
          const pathPoints: THREE.Vector3[] = [];
          for (let i = 0; i <= 3; i++) {
            const backLat = ev.lat - (i * 0.4);
            const backLon = ev.lon - (i * 0.4);
            pathPoints.push(latLonToVec3(backLat, backLon, globeRadius * 1.0015));
          }
          const trailGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
          const trailMat = new THREE.LineBasicMaterial({
            color: 0x0891b2,
            transparent: true,
            opacity: 0.45
          });
          const trailLine = new THREE.Line(trailGeo, trailMat);
          osint.add(trailLine);

        } else if (isPlane) {
          // Flight altitude radius offset
          const flightRadius = globeRadius * 1.06;
          const pos = latLonToVec3(ev.lat, ev.lon, flightRadius);

          const planeGroup = new THREE.Group();
          const fuselage = new THREE.Mesh(
            new THREE.BoxGeometry(0.0035, 0.0025, 0.012),
            new THREE.MeshBasicMaterial({ color: isSelected ? 0xfef08a : 0xfacc15 })
          );
          const wings = new THREE.Mesh(
            new THREE.BoxGeometry(0.012, 0.0012, 0.003),
            new THREE.MeshBasicMaterial({ color: isSelected ? 0xfef08a : 0xfacc15 })
          );
          planeGroup.add(fuselage);
          planeGroup.add(wings);

          planeGroup.position.copy(pos);
          const normal = pos.clone().normalize();
          planeGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
          planeGroup.userData = { eventId: ev.id };
          osint.add(planeGroup);

          // Flight trajectory curved linking arc back to land
          const groundPos = latLonToVec3(ev.lat, ev.lon, globeRadius);
          const curvePts = [groundPos, pos];
          const pathGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
          const pathMat = new THREE.LineBasicMaterial({
            color: 0xeab308, // bright yellow standard transponder
            transparent: true,
            opacity: isSelected ? 0.70 : 0.40
          });
          const pathLine = new THREE.Line(pathGeo, pathMat);
          osint.add(pathLine);

        } else {
          // Standard OSINT / UAP / NEURO points
          const pos = latLonToVec3(ev.lat, ev.lon, globeRadius * 1.006);
          const size = isSelected ? 0.024 : 0.012 + (ev.intensity / 1000) * 0.015;
          
          let color = 0x00d4ff; // default tech blue for OSINT
          if (ev.pillar === "UAP") color = 0xd946ef; // glowing orchid pink
          if (ev.pillar === "NEURO") color = 0x8b5cf6; // deep purple

          const sphereGeo = new THREE.SphereGeometry(size, 8, 8);
          const sphereMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: isSelected ? 0.95 : 0.70,
          });
          const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
          sphereMesh.position.copy(pos);
          
          // Feed scale and random phase variables for the loop to parse
          sphereMesh.userData = {
            eventId: ev.id,
            baseScale: 1.0,
            phase: Math.random() * Math.PI * 2,
          };
          osint.add(sphereMesh);
        }
      }
    });

  }, [events, selectedEvent, activeLayers, tempFilter, seismicFilter, schumannFilter, timelineIndex]);

  // --- MOUSE HOVER/CLICK RAYCASTER DETECT ---
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !rayMeshRef.current) return;

    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    
    // Check intersection with Earth Sphere
    const intersects = raycaster.intersectObject(rayMeshRef.current);

    if (intersects.length > 0) {
      const intersectPt = intersects[0].point;
      // Derived Lat/Lon from Cartesian 3D coordinate point on unit sphere
      const lat = 90 - (Math.acos(Math.max(-1, Math.min(1, intersectPt.y / globeRadius))) * 180) / Math.PI;
      
      let theta = Math.atan2(intersectPt.z, -intersectPt.x);
      if (theta < 0) theta += Math.PI * 2;
      const lon = (theta * 180) / Math.PI - 180;
      
      // Calculate realistic altitude from camera distance in virtual km (approx 6371km Earth equivalent multiplier)
      const camDist = cameraRef.current.position.distanceTo(new THREE.Vector3(0,0,0));
      const alt = Math.max(200, Math.round((camDist - globeRadius) * 6371));

      onUpdateCoords({ lat, lon, alt });
    } else {
      onUpdateCoords(null);
    }
  };

  const handleMouseLeave = () => {
    onUpdateCoords(null);
  };

  const handleGlobeClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !rayMeshRef.current) return;

    const rect = rendererRef.current.domElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    
    const intersects = raycaster.intersectObject(rayMeshRef.current);

    if (intersects.length > 0) {
      const intersectPt = intersects[0].point;
      
      // Look for closest event in list
      const lat = 90 - (Math.acos(Math.max(-1, Math.min(1, intersectPt.y / globeRadius))) * 180) / Math.PI;
      
      let theta = Math.atan2(intersectPt.z, -intersectPt.x);
      if (theta < 0) theta += Math.PI * 2;
      const lon = (theta * 180) / Math.PI - 180;

      let nearestEvent: SentinelEvent | null = null;
      let minDistance = 10000;

      events.forEach((ev) => {
        // Calculate broad spherical distance approximation
        const dLat = ev.lat - lat;
        const dLon = ev.lon - lon;
        const dist = Math.sqrt(dLat * dLat + dLon * dLon);
        if (dist < minDistance && dist < 15) { // within 15 degrees bound
          minDistance = dist;
          nearestEvent = ev;
        }
      });

      if (nearestEvent) {
        onSelectEvent(nearestEvent);
      } else {
        onSelectEvent(null);
      }
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleGlobeClick}
    >
      <canvas ref={canvasRef} className="w-full h-full absolute inset-0 block touch-none outline-none" />
      
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur border border-slate-800 rounded-xl z-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-teal-400 border-slate-800 animate-spin mb-3" />
          <span className="font-mono text-[10px] uppercase text-teal-400 animate-pulse tracking-widest">
            SYNCHRONISATION SPATIALE DU GLOBE 3D...
          </span>
        </div>
      )}
    </div>
  );
}
