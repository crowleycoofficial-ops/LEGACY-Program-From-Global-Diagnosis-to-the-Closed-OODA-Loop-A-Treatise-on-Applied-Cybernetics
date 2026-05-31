// sentinel.js — Moteur de rendu 3D géodésique holographique (Canvas 2D pur)
// Zéro dépendance (sans Three.js), calcul trigonométrique direct optimisé pour CPU 4Go.

const CAPITALS = {
  USA: { lat: 38.9, lon: -77.0, label: "WASHINGTON", color: "#60a5fa" },
  CHN: { lat: 39.9, lon: 116.4, label: "PEKIN", color: "#facc15" },
  RUS: { lat: 55.75, lon: 37.6, label: "MOSCOU", color: "#ef4444" },
  EUR: { lat: 50.85, lon: 4.35, label: "BRUXELLES", color: "#10b981" },
  SUD: { lat: -25.7, lon: 28.2, label: "PRETORIA", color: "#a855f7" }
};

export class GpsCanvasGlobe {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.radius = 110;
    this.rotX = 0.4;  // Inclinaison de base
    this.rotY = 0;    // Rotation automatique
    this.conflict = 0.40;
    this.solar = 0.30;
    this.pulse = 0;

    // Redimensionnement automatique
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight || 300;
  }

  // Conversion Sphérique → Cartésien 3D
  toCartesian(lat, lon) {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = (lon + 180) * Math.PI / 180;
    return {
      x: this.radius * Math.sin(phi) * Math.cos(theta),
      y: this.radius * Math.cos(phi),
      z: this.radius * Math.sin(phi) * Math.sin(theta)
    };
  }

  // Rotation 3D matricielle
  rotate(pt) {
    // Rotation autour de Y (spinning)
    let x1 = pt.x * Math.cos(this.rotY) - pt.z * Math.sin(this.rotY);
    let z1 = pt.x * Math.sin(this.rotY) + pt.z * Math.cos(this.rotY);

    // Rotation autour de X (inclinaison)
    let y2 = pt.y * Math.cos(this.rotX) - z1 * Math.sin(this.rotX);
    let z2 = pt.y * Math.sin(this.rotX) + z1 * Math.cos(this.rotX);

    return { x: x1, y: y2, z: z2 }; // z2 > 0 signifie face avant
  }

  updateTension(conflict, solar) {
    this.conflict = conflict;
    this.solar = solar;
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const cx = this.canvas.width / 2;
    const cy = this.canvas.height / 2;
    this.pulse = (this.pulse + 0.05) % (Math.PI * 2);

    // Mise à jour de la rotation
    this.rotY += 0.006;

    // --- 1. DESSINER LA CARTE DU CIEL / ÉMULATION COUPLAGE ---
    this.ctx.strokeStyle = '#111822';
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
    this.ctx.stroke();

    // --- 2. DESSINER LES MÉRIDIENS & PARALLÈLES (GRILLE GÉODÉSIQUE) ---
    this.ctx.strokeStyle = 'rgba(74, 222, 128, 0.05)';
    this.ctx.lineWidth = 1;

    // Dessin des parallèles (latitudes)
    for (let lat = -70; lat <= 70; lat += 20) {
      this.ctx.beginPath();
      let first = true;
      for (let lon = -180; lon <= 180; lon += 5) {
        const rawPt = this.toCartesian(lat, lon);
        const rotPt = this.rotate(rawPt);
        if (rotPt.z > 0) { // Uniquement la face visible
          const sx = cx + rotPt.x;
          const sy = cy - rotPt.y;
          if (first) {
            this.ctx.moveTo(sx, sy);
            first = false;
          } else {
            this.ctx.lineTo(sx, sy);
          }
        } else {
          first = true;
        }
      }
      this.ctx.stroke();
    }

    // Dessin des méridiens (longitudes)
    for (let lon = -180; lon < 180; lon += 30) {
      this.ctx.beginPath();
      let first = true;
      for (let lat = -85; lat <= 85; lat += 5) {
        const rawPt = this.toCartesian(lat, lon);
        const rotPt = this.rotate(rawPt);
        if (rotPt.z > 0) {
          const sx = cx + rotPt.x;
          const sy = cy - rotPt.y;
          if (first) {
            this.ctx.moveTo(sx, sy);
            first = false;
          } else {
            this.ctx.lineTo(sx, sy);
          }
        } else {
          first = true;
        }
      }
      this.ctx.stroke();
    }

    // --- 3. RENDRE LES PILIERS DIRECTS DE SOUVERAINETÉ (POLITIQUE DE PUISSANCE) ---
    const activeCoords = {};
    for (const [key, cap] of Object.entries(CAPITALS)) {
      const rawPt = this.toCartesian(cap.lat, cap.lon);
      const rotPt = this.rotate(rawPt);
      
      const sx = cx + rotPt.x;
      const sy = cy - rotPt.y;

      activeCoords[key] = { sx, sy, z: rotPt.z, name: cap.label, color: cap.color };

      if (rotPt.z > 0) {
        // Dessiner le pilier tridimensionnel (Ligne verticale sortant du sol terrestre)
        const pillarHeight = 35 + this.conflict * 40; // Hauteur corrélée aux séismes / tensions
        
        // Calcul du vecteur unitaire sortant
        const rLen = Math.sqrt(rotPt.x * rotPt.x + rotPt.y * rotPt.y + rotPt.z * rotPt.z);
        const vx = (rotPt.x / rLen) * pillarHeight;
        const vy = (rotPt.y / rLen) * pillarHeight;

        this.ctx.strokeStyle = cap.color;
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(sx, sy);
        this.ctx.lineTo(sx + vx, sy - vy);
        this.ctx.stroke();

        // Pulsation au sommet
        const pSize = 3 + Math.sin(this.pulse * 2) * 1.5;
        this.ctx.fillStyle = cap.color;
        this.ctx.beginPath();
        this.ctx.arc(sx + vx, sy - vy, pSize, 0, Math.PI * 2);
        this.ctx.fill();

        // Label du point d'ancrage local
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.font = '8px monospace';
        this.ctx.fillText(cap.label, sx + vx + 5, sy - vy + 3);
      }
    }

    // --- 4. DESSINER LES ARCS DE TENSION ACTIVES (OODA INTERLOCK CYBER TRAFFIC) ---
    const connections = [
      ["USA", "CHN"],
      ["USA", "RUS"],
      ["CHN", "RUS"]
    ];

    connections.forEach(([fromKey, toKey]) => {
      const ptA = activeCoords[fromKey];
      const ptB = activeCoords[toKey];

      // On dessine l'arc si au moins une extrémité est visible
      if (ptA && ptB && (ptA.z > -10 || ptB.z > -10)) {
        this.ctx.strokeStyle = 'rgba(239, 68, 68, ' + (0.15 + this.conflict * 0.7) + ')';
        this.ctx.lineWidth = 1 + this.conflict * 2;

        this.ctx.beginPath();
        this.ctx.moveTo(ptA.sx, ptA.sy);
        
        // Point de contrôle géodésique pour simuler une courbe balistique
        const mx = (ptA.sx + ptB.sx) / 2;
        const my = (ptA.sy + ptB.sy) / 2 - (40 + this.solar * 30); // Dérivé de l'orage NOAA

        this.ctx.quadraticCurveTo(mx, my, ptB.sx, ptB.sy);
        this.ctx.stroke();

        // Tracer un bit de signal d'interverrouillage (pulsation circulante)
        const t = (performance.now() / 1500) % 1.0;
        // Formule de Bézier quadratique pour positionner le signal
        const px = (1 - t) * (1 - t) * ptA.sx + 2 * (1 - t) * t * mx + t * t * ptB.sx;
        const py = (1 - t) * (1 - t) * ptA.sy + 2 * (1 - t) * t * my + t * t * ptB.sy;

        this.ctx.fillStyle = '#ff6b00';
        this.ctx.beginPath();
        this.ctx.arc(px, py, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // halo lumineux
        this.ctx.strokeStyle = 'rgba(255, 107, 0, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(px, py, 5, 0, Math.PI * 2);
        this.ctx.stroke();
      }
    });

    // --- 5. RASEUR TEXTE INFOBAR LOCAL DE PERCEPTION ---
    this.ctx.fillStyle = 'rgba(94, 224, 82, 0.9)';
    this.ctx.font = '8.5px monospace';
    this.ctx.fillText("SENTINEL GEODETIC SIMULATOR ACTIVE", 15, this.canvas.height - 15);
  }
}
