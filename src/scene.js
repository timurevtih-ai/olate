// 3D-сцена первого экрана: плитка «Адыгского шоколада» О'ЛАТЕ.
// Глянцевый молочный шоколад, восковая печать с адыгским гербом,
// при прокрутке плитка раскалывается и показывает начинку — адыгейский сыр с черкесским орехом.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

// детерминированный рандом — чтобы сцена выглядела одинаково при каждом заходе
let seed = 7;
const rnd = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

function canvasTex(size, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// микрорельеф шоколада: мелкая «пыль» и мягкие разводы, чтобы поверхность не выглядела пластиком
function chocolateBump() {
  const t = canvasTex(512, (g, S) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 40; i++) {
      const x = rnd() * S, y = rnd() * S, r = 30 + rnd() * 90;
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      const v = rnd() > 0.5 ? 150 : 105;
      gr.addColorStop(0, `rgba(${v},${v},${v},0.35)`); gr.addColorStop(1, 'rgba(128,128,128,0)');
      g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 14000; i++) {
      const v = 80 + rnd() * 100;
      g.fillStyle = `rgba(${v},${v},${v},0.22)`;
      g.fillRect(rnd() * S, rnd() * S, 1.4, 1.4);
    }
  }, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// срез начинки: адыгейский сыр с кусочками черкесского ореха
function fillingTexture() {
  const t = canvasTex(512, (g, S) => {
    g.fillStyle = '#efe3cb'; g.fillRect(0, 0, S, S);
    const crumbs = ['#f8f0e0', '#e4d3b3', '#fbf6ec', '#eadbbf'];
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = crumbs[(rnd() * crumbs.length) | 0];
      g.globalAlpha = 0.5 + rnd() * 0.5;
      g.beginPath(); g.arc(rnd() * S, rnd() * S, 1 + rnd() * 4, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    const nut = ['#8a5631', '#a26b3c', '#6b3f22', '#b98150', '#7a4a2a'];
    for (let i = 0; i < 70; i++) {
      const cx = rnd() * S, cy = rnd() * S, r = 6 + rnd() * 15, n = 5 + ((rnd() * 3) | 0);
      g.beginPath();
      for (let k = 0; k < n; k++) {
        const a = (k / n) * Math.PI * 2 + rnd() * 0.6, rr = r * (0.55 + rnd() * 0.6);
        k ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      }
      g.closePath();
      g.fillStyle = nut[(rnd() * nut.length) | 0]; g.fill();
      g.strokeStyle = 'rgba(70,35,15,0.35)'; g.lineWidth = 1.5; g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// рельеф восковой печати: адыгский герб — 12 звёзд дугой и три скрещённые стрелы
function sealBump(bg = '#000', fg = '#fff', srgb = false) {
  return canvasTex(512, (g, S) => {
    g.fillStyle = bg; g.fillRect(0, 0, S, S);
    g.filter = 'blur(2px)';
    g.strokeStyle = g.fillStyle = fg;
    const c = S / 2;
    g.lineWidth = 18; g.beginPath(); g.arc(c, c, 232, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.arc(c, c, 204, 0, Math.PI * 2); g.stroke();
    const star = (x, y, R, r) => {
      g.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5, rr = k % 2 ? r : R;
        k ? g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : g.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      g.closePath(); g.fill();
    };
    for (let i = 0; i < 12; i++) {
      const a = lerp(-Math.PI * 0.9, -Math.PI * 0.1, i / 11);
      star(c + Math.cos(a) * 158, 318 + Math.sin(a) * 158, 17, 7);
    }
    const arrow = (ang) => {
      const L = 190, cx = c, cy = 330;
      const dx = Math.cos(ang), dy = Math.sin(ang);
      const tx = cx + dx * L / 2, ty = cy + dy * L / 2, bx = cx - dx * L / 2, by = cy - dy * L / 2;
      g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(bx, by); g.lineTo(tx, ty); g.stroke();
      const px = -dy, py = dx;
      g.beginPath(); g.moveTo(tx + dx * 26, ty + dy * 26); g.lineTo(tx + px * 14, ty + py * 14); g.lineTo(tx - px * 14, ty - py * 14); g.closePath(); g.fill();
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(bx + dx * 22, by + dy * 22); g.lineTo(bx + px * 14 * s - dx * 4, by + py * 14 * s - dy * 4); g.stroke(); }
    };
    arrow(-Math.PI / 2);
    arrow(-Math.PI / 2 - 0.62);
    arrow(-Math.PI / 2 + 0.62);
  }, srgb);
}

// растягиваем UV коробки по реальным размерам граней — чтобы кусочки ореха не вытягивались
function worldUV(geo, w, h, d, unit = 0.45) {
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    const [fw, fh] = dims[f];
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * fw / unit + f * 0.37, uv.getY(i) * fh / unit + f * 0.21);
    }
  }
  uv.needsUpdate = true;
}

function walnutGeometry() {
  const geo = new THREE.SphereGeometry(0.17, 72, 48);
  const p = geo.attributes.position;
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  const dark = new THREE.Color('#3a1d0c'), light = new THREE.Color('#a86d3a');
  const colors = [];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); n.copy(v).normalize();
    let f = Math.sin(n.x * 15 + Math.sin(n.z * 8) * 1.8) * Math.sin(n.z * 12 + n.y * 7 + 1.3);
    f = f * 0.5 + 0.5;
    const groove = n.y > 0 ? Math.exp(-(n.z * n.z) / 0.006) : 0;
    v.x *= 1.2; v.z *= 0.92;
    if (v.y < 0) v.y *= 0.28; // плоская сторона половинки
    if (n.y > -0.1) v.addScaledVector(n, 0.026 * f - 0.055 * groove);
    p.setXYZ(i, v.x, v.y, v.z);
    const c = dark.clone().lerp(light, clamp01(0.25 + f * 0.75 - groove * 0.8));
    if (n.y < -0.1) c.lerp(new THREE.Color('#b98552'), 0.5);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

function shardGeometry(r) {
  const sh = new THREE.Shape();
  const n = 5 + ((rnd() * 3) | 0);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 + rnd() * 0.5, rr = r * (0.5 + rnd() * 0.65);
    k ? sh.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : sh.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.028, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 });
  g.center();
  return g;
}

function makeDust(count) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), s = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (rnd() - 0.5) * 12; pos[i * 3 + 1] = (rnd() - 0.5) * 6; pos[i * 3 + 2] = -4 + rnd() * 6;
    s[i] = rnd();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(s, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uScale: { value: 800 }, uFade: { value: 0 } },
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uScale;
      attribute float aSeed; varying float vA;
      void main(){
        vec3 p = position;
        p.y = mod(position.y + 3.0 + uTime * (0.04 + aSeed * 0.06), 6.0) - 3.0;
        p.x += sin(uTime * 0.17 + aSeed * 31.0) * 0.25;
        p.z += cos(uTime * 0.13 + aSeed * 17.0) * 0.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = max(1.0, (0.012 + 0.03 * aSeed) * uScale / -mv.z);
        vA = 0.25 + 0.75 * abs(sin(uTime * 0.7 + aSeed * 40.0));
      }`,
    fragmentShader: /* glsl */`
      uniform float uFade; varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(1.0, 0.82, 0.62, a * vA * 0.55 * uFade);
      }`
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  return pts;
}

// ---------- сцена ----------
export function initScene(canvas, stage, { reduceMotion = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.42;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const camBase = new THREE.Vector3(0, 2.0, 6.7);
  const look = new THREE.Vector3(0, 0, 0);

  // свет: тёплый ключевой, шалфейный контровой, янтарная подсветка снизу
  scene.add(new THREE.HemisphereLight(0xffe9d6, 0x1a0f0a, 0.35));
  const key = new THREE.DirectionalLight(0xffe2c2, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -2.6, right: 2.6, top: 2.6, bottom: -2.6, near: 0.5, far: 16 });
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 4;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xcfe8d6, 2.6);
  scene.add(rim, rim.target);
  const glow = new THREE.PointLight(0xff9a52, 5, 9, 2);
  scene.add(glow);

  // материалы
  const bump = chocolateBump();
  const milk = new THREE.MeshPhysicalMaterial({
    color: 0x4f2814, roughness: 0.4, clearcoat: 0.45, clearcoatRoughness: 0.32,
    bumpMap: bump, bumpScale: 0.35
  });
  const dark = milk.clone();
  dark.color = new THREE.Color(0x2e170d);
  const filling = new THREE.MeshStandardMaterial({ map: fillingTexture(), roughness: 0.82 });
  const sealSide = new THREE.MeshPhysicalMaterial({ color: 0x2c6644, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.25 });
  const sealTop = sealSide.clone();
  sealTop.bumpMap = sealBump();
  sealTop.bumpScale = 14;
  sealTop.map = sealBump('#2a6342', '#6aa47e', true);
  sealTop.color = new THREE.Color(0xffffff);

  // ---------- плитка ----------
  const COLS = 3, ROWS = 2, S = 0.8, T = 0.055, HC = 0.17;
  const BASE_Y = -0.19;
  const tileGeo = (() => {
    const w = S - 0.21, r = 0.07, h = w / 2;
    const sh = new THREE.Shape();
    sh.moveTo(-h + r, -h); sh.lineTo(h - r, -h); sh.quadraticCurveTo(h, -h, h, -h + r);
    sh.lineTo(h, h - r); sh.quadraticCurveTo(h, h, h - r, h); sh.lineTo(-h + r, h);
    sh.quadraticCurveTo(-h, h, -h, h - r); sh.lineTo(-h, -h + r); sh.quadraticCurveTo(-h, -h, -h + r, -h);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 8, curveSegments: 12 });
    g.rotateX(-Math.PI / 2);
    return g;
  })();
  // все шоколадные части куска склеиваем в одну геометрию — меньше вызовов отрисовки
  const rboxGeo = (w, h, d, x, y, z) => { const b = new RoundedBoxGeometry(w, h, d, 2, 0.014).translate(x, y, z); return b.index ? b.toNonIndexed() : b; };
  const tileFlat = tileGeo.index ? tileGeo.toNonIndexed() : tileGeo;

  const bar = new THREE.Group();
  const pieces = [];
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const g = new THREE.Group();
      const parts = [rboxGeo(S, T, S, 0, T / 2, 0)];
      const xmin = -S / 2 + (i === 0 ? T : 0), xmax = S / 2 - (i === COLS - 1 ? T : 0);
      const zmin = -S / 2 + (j === 0 ? T : 0), zmax = S / 2 - (j === ROWS - 1 ? T : 0);
      const cw = xmax - xmin, cd = zmax - zmin;
      const coreGeo = new THREE.BoxGeometry(cw, HC, cd);
      worldUV(coreGeo, cw, HC, cd);
      const core = new THREE.Mesh(coreGeo, filling);
      core.position.set((xmin + xmax) / 2, T + HC / 2, (zmin + zmax) / 2);
      core.receiveShadow = true;
      g.add(core);
      if (i === 0) parts.push(rboxGeo(T, HC + 0.004, S, -S / 2 + T / 2, T + HC / 2, 0));
      if (i === COLS - 1) parts.push(rboxGeo(T, HC + 0.004, S, S / 2 - T / 2, T + HC / 2, 0));
      if (j === 0) parts.push(rboxGeo(S, HC + 0.004, T, 0, T + HC / 2, -S / 2 + T / 2));
      if (j === ROWS - 1) parts.push(rboxGeo(S, HC + 0.004, T, 0, T + HC / 2, S / 2 - T / 2));
      parts.push(rboxGeo(S, T, S, 0, T + HC + T / 2, 0));
      parts.push(tileFlat.clone().translate(0, 2 * T + HC, 0));
      const shell = new THREE.Mesh(mergeGeometries(parts), milk);
      shell.castShadow = shell.receiveShadow = true;
      g.add(shell);

      const base = new THREE.Vector3((i - (COLS - 1) / 2) * S, BASE_Y, (j - (ROWS - 1) / 2) * S);
      const dir = new THREE.Vector3(base.x, 0, base.z * 1.7).normalize();
      g.userData = { base, dir, r1: rnd(), r2: rnd(), r3: rnd() };
      bar.add(g);
      pieces.push(g);

      // восковая печать — на центральном куске переднего ряда
      if (i === 1 && j === ROWS - 1) {
        const sg = new THREE.CylinderGeometry(0.27, 0.285, 0.055, 96, 1);
        const sp = sg.attributes.position;
        for (let k = 0; k < sp.count; k++) {
          const x = sp.getX(k), z = sp.getZ(k), r = Math.hypot(x, z);
          if (r < 0.01) continue;
          const a = Math.atan2(z, x);
          const f = 1 + 0.035 * Math.sin(a * 5 + 1) + 0.02 * Math.sin(a * 11 + 2) + 0.012 * Math.sin(a * 17);
          sp.setX(k, x * f); sp.setZ(k, z * f);
        }
        sg.computeVertexNormals();
        const seal = new THREE.Mesh(sg, [sealSide, sealTop, sealSide]);
        seal.position.y = 2 * T + HC + 0.095 + 0.024;
        seal.rotation.y = -0.15;
        seal.castShadow = true;
        g.add(seal);
      }
    }
  }
  scene.add(bar);

  // орехи и осколки вокруг
  const orbit = new THREE.Group();
  scene.add(orbit);
  const walnutGeo = walnutGeometry();
  const walnutMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7 });
  const walnuts = [0, 1, 2, 3, 4].map((k) => {
    const m = new THREE.Mesh(walnutGeo, walnutMat);
    m.castShadow = true;
    m.userData = {
      a: (k / 5) * Math.PI * 2 + 0.4, r: 1.85 + rnd() * 0.45, y: -0.5 + rnd() * 1.3,
      s: 0.85 + rnd() * 0.45, sp: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.8), ph: rnd() * 6
    };
    m.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
    orbit.add(m);
    return m;
  });
  const SHARD_SPOTS = [[-1.9, 1.05, -1.4], [2.05, 1.25, -0.9], [1.75, -1.0, 0.7], [-1.6, -1.05, -0.6], [0.3, 1.55, -1.8]];
  const shards = SHARD_SPOTS.map((spot, k) => {
    const m = new THREE.Mesh(shardGeometry(0.2 + rnd() * 0.14), k % 2 ? milk : dark);
    m.castShadow = true;
    m.userData = {
      spot,
      sp: new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.7), ph: rnd() * 6
    };
    m.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6);
    orbit.add(m);
    return m;
  });

  const dust = makeDust(window.innerWidth < 700 ? 260 : 520);
  scene.add(dust);

  // ---------- раскладка под размер экрана ----------
  const L = { x: 0, y: 0, s: 1, mobile: false };
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1.75 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const D = camBase.distanceTo(look);
    const halfH = D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), halfW = halfH * aspect;
    L.mobile = aspect < 1.05;
    if (!L.mobile) { L.x = halfW * 0.45; L.y = -0.1; L.s = Math.min(0.88, (halfW * 0.42) / 1.6); }
    else { L.x = 0; L.y = -halfH * 0.56; L.s = Math.min(0.85, (halfW * 2 * 0.74) / 2.6); }
    dust.material.uniforms.uScale.value = (h * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  // ---------- анимация ----------
  const state = { started: false, t0: 0, progress: 0, pS: 0, px: 0, py: 0, pxS: 0, pyS: 0, kick: 0, impulse: 0, visible: true };
  const timer = new THREE.Timer();
  timer.connect(document);
  const keyOffset = new THREE.Vector3(-2.6, 4.6, 3.4);
  const rimOffset = new THREE.Vector3(3.2, 1.4, -3.6);

  function frame() {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.05);
    const time = timer.getElapsed();
    const sp = reduceMotion ? 0.2 : 1;

    state.pS = lerp(state.pS, state.progress, 1 - Math.pow(0.002, dt));
    state.pxS = lerp(state.pxS, state.px, 1 - Math.pow(0.02, dt));
    state.pyS = lerp(state.pyS, state.py, 1 - Math.pow(0.02, dt));
    state.kick *= Math.pow(0.25, dt);
    state.impulse = lerp(state.impulse, state.kick, 1 - Math.pow(0.0005, dt));
    const p = state.pS;

    const it = state.started ? clamp01((time - state.t0) / 2.4) : 0;
    const intro = 1 - easeOutCubic(it);
    const e = intro * 3.4 + smooth(0.16, 0.62, p) * 1.0 + state.impulse * 0.75;

    // камера
    camera.position.set(camBase.x + state.pxS * 0.35, camBase.y - state.pyS * 0.25 + p * 0.5, camBase.z - p * 0.7);
    camera.lookAt(look.x + state.pxS * 0.1, look.y + p * 0.15, look.z);

    // плитка
    bar.visible = state.started;
    bar.scale.setScalar(L.s * lerp(1, 0.92, intro));
    bar.position.set(L.x - (L.mobile ? 0 : p * 0.45), L.y + Math.sin(time * 0.8 * sp) * 0.035 - (L.mobile ? p * 0.15 : 0), 0);
    const k = L.mobile ? 0.48 : 0.55;
    bar.rotation.set(
      0.42 - p * 0.12 + state.pyS * 0.1 + intro * 0.4,
      -0.5 + Math.sin(time * 0.22 * sp) * 0.22 + p * 0.9 + state.pxS * 0.3 - intro * 1.2,
      Math.sin(time * 0.37 * sp) * 0.025
    );
    pieces.forEach((pc) => {
      const u = pc.userData;
      pc.position.set(u.base.x + u.dir.x * e * k, u.base.y + e * (0.06 + u.r1 * (L.mobile ? 0.22 : 0.38)), u.base.z + u.dir.z * e * k);
      pc.rotation.set(e * (u.r2 - 0.5) * 1.3, e * (u.r3 - 0.5) * 0.9, e * (u.r1 - 0.5) * 1.1);
    });

    // орехи подлетают ближе на шаге «черкесский орех»
    const near = smooth(0.48, 0.85, p);
    orbit.position.copy(bar.position);
    orbit.scale.setScalar(L.s);
    walnuts.forEach((m, k) => {
      const u = m.userData;
      const wIn = easeOutCubic(clamp01((time - state.t0 - 0.6 - k * 0.12) / 1.6) * (state.started ? 1 : 0));
      const a = u.a + time * 0.09 * sp + p * 0.8;
      const r = u.r * lerp(2.6, 1, wIn) * (1 - near * 0.3);
      m.position.set(Math.cos(a) * r, u.y + Math.sin(time * 0.7 * sp + u.ph) * 0.08 + near * 0.25, Math.sin(a) * r * 0.75);
      m.rotation.x += u.sp.x * dt * sp; m.rotation.y += u.sp.y * dt * sp;
      m.scale.setScalar(u.s * Math.max(0.001, wIn));
    });
    shards.forEach((m, k) => {
      const u = m.userData;
      const wIn = easeOutCubic(clamp01((time - state.t0 - 0.9 - k * 0.08) / 1.8) * (state.started ? 1 : 0));
      const spread = lerp(2.2, 1, wIn) * (1 + p * 0.25);
      m.position.set(u.spot[0] * spread, u.spot[1] * spread + Math.sin(time * 0.5 * sp + u.ph) * 0.1, u.spot[2]);
      // осколок почти всегда повёрнут к камере плоскостью и лишь слегка покачивается
      m.rotation.set(u.sp.x + Math.sin(time * 0.4 * sp + u.ph) * 0.35, u.sp.y + Math.sin(time * 0.3 * sp + u.ph * 2) * 0.45, u.sp.z + time * 0.08 * sp);
      m.scale.setScalar(Math.max(0.001, wIn));
    });

    // свет следует за плиткой; на старте ключевой свет «проезжает» по плитке
    key.position.copy(bar.position).add(keyOffset).add(new THREE.Vector3(-4 * intro, 0, 0));
    key.target.position.copy(bar.position);
    rim.position.copy(bar.position).add(rimOffset);
    rim.target.position.copy(bar.position);
    glow.position.set(bar.position.x - 0.4, bar.position.y - 1.2, 1.6);

    dust.material.uniforms.uTime.value = time * sp;
    dust.material.uniforms.uFade.value = clamp01((time - state.t0) / 2) * (state.started ? 1 : 0);

    renderer.render(scene, camera);
  }

  let running = false;
  const setRunning = (on) => {
    if (on === running) return;
    running = on;
    renderer.setAnimationLoop(on ? frame : null);
  };
  new IntersectionObserver(([en]) => { state.visible = en.isIntersecting; setRunning(state.visible && !document.hidden); }, { threshold: 0 }).observe(stage);
  document.addEventListener('visibilitychange', () => setRunning(state.visible && !document.hidden));
  setRunning(true);

  // нажатие: плитка раскалывается и снова собирается
  canvas.addEventListener('pointerdown', () => { state.kick = 1.25; });

  return {
    intro() { if (!state.started) { state.started = true; state.t0 = timer.getElapsed(); } },
    setProgress(v) { state.progress = clamp01(v); },
    setPointer(x, y) { state.px = x; state.py = y; }
  };
}
