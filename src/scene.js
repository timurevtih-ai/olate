// 3D-сцена для первого экрана: керамическая чашка с латте-артом, пар,
// летающие макарон и кофейные зёрна. Three.js собирается в js/app.js (см. README).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutBack = (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ---------- текстуры, нарисованные на canvas ----------
function stonewareTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#e9dccb'; g.fillRect(0, 0, 512, 512);
  // мягкие полосы гончарного круга
  for (let y = 0; y < 512; y += 3) {
    g.fillStyle = `rgba(150,120,95,${Math.random() * 0.05})`;
    g.fillRect(0, y, 512, 2);
  }
  // крапинки, как у матовой керамики
  for (let i = 0; i < 2600; i++) {
    const r = Math.random() * 1.6 + 0.3;
    g.fillStyle = `rgba(${90 + Math.random() * 40},${60 + Math.random() * 30},${40 + Math.random() * 20},${0.15 + Math.random() * 0.35})`;
    g.beginPath(); g.arc(Math.random() * 512, Math.random() * 512, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function latteTexture() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S / 2);
  grd.addColorStop(0, '#c99463'); grd.addColorStop(0.62, '#a8683b'); grd.addColorStop(0.9, '#7e4724'); grd.addColorStop(1, '#5d3219');
  g.fillStyle = grd; g.fillRect(0, 0, S, S);
  // пятнистая крема
  for (let i = 0; i < 400; i++) {
    g.fillStyle = `rgba(${200 + Math.random() * 40},${150 + Math.random() * 40},${100 + Math.random() * 30},${Math.random() * 0.08})`;
    g.beginPath(); g.arc(Math.random() * S, Math.random() * S, Math.random() * 14 + 2, 0, Math.PI * 2); g.fill();
  }
  const heart = (s) => {
    g.beginPath(); g.moveTo(0, s * 0.78);
    g.bezierCurveTo(-s * 1.1, s * 0.02, -s * 0.78, -s * 1.0, 0, -s * 0.36);
    g.bezierCurveTo(s * 0.78, -s * 1.0, s * 1.1, s * 0.02, 0, s * 0.78);
    g.closePath();
  };
  g.save(); g.translate(S / 2, S / 2 + 6);
  g.shadowColor = 'rgba(248,236,218,0.95)'; g.shadowBlur = 22;
  g.fillStyle = '#f7ecdc'; heart(158); g.fill();
  g.shadowBlur = 0;
  // «волны» внутри сердца, как у настоящего латте-арта
  g.lineWidth = 7; g.strokeStyle = 'rgba(176,118,70,0.28)';
  [118, 84, 52].forEach((s, i) => { g.save(); g.translate(0, -10 - i * 8); heart(s); g.stroke(); g.restore(); });
  // хвостик
  g.strokeStyle = 'rgba(247,236,220,0.9)'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -150); g.quadraticCurveTo(4, 0, 0, 128); g.stroke();
  g.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function lathe(points, segments = 96) {
  const curve = new THREE.SplineCurve(points.map(([x, y]) => new THREE.Vector2(x, y)));
  return new THREE.LatheGeometry(curve.getPoints(160), segments);
}

// ---------- модели ----------
function makeCup(stoneMat) {
  const group = new THREE.Group();

  const saucer = new THREE.Mesh(lathe([
    [0.0, 0.0], [0.65, 0.0], [0.95, 0.015], [1.16, 0.07], [1.28, 0.15], [1.31, 0.175],
    [1.28, 0.185], [1.14, 0.12], [0.9, 0.075], [0.55, 0.065], [0.0, 0.065]
  ]), stoneMat);
  saucer.castShadow = saucer.receiveShadow = true;
  group.add(saucer);

  const cup = new THREE.Mesh(lathe([
    [0.0, 0.065], [0.33, 0.065], [0.4, 0.085], [0.47, 0.13], [0.58, 0.25], [0.68, 0.43],
    [0.75, 0.65], [0.785, 0.86], [0.792, 0.97], [0.784, 1.0], [0.764, 1.004], [0.752, 0.985],
    [0.744, 0.86], [0.7, 0.64], [0.62, 0.44], [0.5, 0.26], [0.3, 0.16], [0.0, 0.15]
  ]), stoneMat);
  cup.castShadow = cup.receiveShadow = true;
  group.add(cup);

  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.068, 24, 64, Math.PI * 1.38), stoneMat);
  handle.rotation.z = -Math.PI * 0.69;
  handle.position.set(0.88, 0.6, 0);
  handle.castShadow = true;
  group.add(handle);

  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(0.77, 72),
    new THREE.MeshPhysicalMaterial({ map: latteTexture(), roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.25 })
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.rotation.z = Math.PI; // сердце «кончиком» к гостю
  coffee.position.y = 0.935;
  group.add(coffee);

  return { group, coffee };
}

const MACARON_COLORS = [
  [0xe58ea2, 0xf6dbe0], // малина
  [0xa6c26d, 0xe8b9c4], // фисташка-малина
  [0xf29a3c, 0xf8e3b6], // манго-маракуйя
  [0xf1d36b, 0xfff1d3], // банан-нутелла
  [0x7b4b33, 0x4b2b1d], // ферреро
  [0xe9ab83, 0xb37b4a], // солёная карамель
  [0xf0a7c0, 0x9fd3da]  // бабл-гам
];

function makeMacaron(shellGeo, fillGeo, [shell, cream]) {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshStandardMaterial({ color: shell, roughness: 0.6 });
  const top = new THREE.Mesh(shellGeo, shellMat);
  top.position.y = 0.03;
  const bottom = new THREE.Mesh(shellGeo, shellMat);
  bottom.scale.y = -1; bottom.position.y = -0.03;
  const fill = new THREE.Mesh(fillGeo, new THREE.MeshStandardMaterial({ color: cream, roughness: 0.45 }));
  [top, bottom, fill].forEach((m) => g.add(m));
  return g;
}

function makeBeanGeometry() {
  const geo = new THREE.SphereGeometry(0.1, 28, 18);
  const p = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.x *= 1.0; v.y *= 0.62; v.z *= 0.72;
    // бороздка по центру плоской стороны
    if (v.z > 0) v.z -= 0.035 * Math.exp(-(v.y * v.y) / 0.0006) * (1 - Math.abs(v.x) / 0.1);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

// ---------- пар ----------
function makeSteam(count = 34) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), seed = new Float32Array(count), speed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.random() * 0.4;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = 0; pos[i * 3 + 2] = Math.sin(a) * r;
    seed[i] = Math.random(); speed[i] = 0.12 + Math.random() * 0.1;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geo.setAttribute('aSpeed', new THREE.BufferAttribute(speed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uTime: { value: 0 }, uOrigin: { value: new THREE.Vector3() }, uScale: { value: 800 }, uSize: { value: 1 }, uBoost: { value: 0 } },
    vertexShader: /* glsl */`
      uniform float uTime; uniform vec3 uOrigin; uniform float uScale; uniform float uSize; uniform float uBoost;
      attribute float aSeed; attribute float aSpeed;
      varying float vAlpha;
      void main(){
        float t = fract(uTime * aSpeed * (1.0 + uBoost) + aSeed);
        vec3 p = position * uSize;
        p.y += t * 2.1 * uSize;
        p.x += (sin(t * 7.0 + aSeed * 25.0) * 0.22 + (aSeed - 0.5) * 0.35) * t * uSize;
        p.z += cos(t * 5.0 + aSeed * 13.0) * 0.18 * t * uSize;
        vec4 mv = modelViewMatrix * vec4(uOrigin + p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (0.35 + 1.1 * t) * uSize * uScale / -mv.z;
        vAlpha = smoothstep(0.0, 0.18, t) * (1.0 - smoothstep(0.45, 1.0, t)) * (0.32 + uBoost * 0.25);
      }`,
    fragmentShader: /* glsl */`
      varying float vAlpha;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(1.0, 0.985, 0.96, a * a * vAlpha);
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
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  const camBase = new THREE.Vector3(0, 3.9, 8.9);
  const target = new THREE.Vector3(0, 0.7, 0);

  scene.add(new THREE.HemisphereLight(0xfff4e8, 0xcbb7a2, 1.0));
  const key = new THREE.DirectionalLight(0xffe7cf, 2.4);
  key.position.set(-3.2, 6.5, 4.2);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -3.5, right: 3.5, top: 3.5, bottom: -3.5, near: 1, far: 20 });
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 0.9);
  rim.position.set(4, 2.5, -3.5);
  scene.add(rim);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.14 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // чашка
  const stone = new THREE.MeshPhysicalMaterial({ map: stonewareTexture(), roughness: 0.68, clearcoat: 0.3, clearcoatRoughness: 0.55 });
  const rig = new THREE.Group();
  scene.add(rig);
  const { group: cupGroup, coffee } = makeCup(stone);
  rig.add(cupGroup);

  // пар
  const steam = makeSteam();
  scene.add(steam);

  // макарон
  const shellGeo = lathe([
    [0.0, 0.0], [0.17, 0.0], [0.205, 0.012], [0.218, 0.03], [0.203, 0.046], [0.212, 0.062],
    [0.2, 0.092], [0.16, 0.122], [0.09, 0.142], [0.0, 0.148]
  ], 48);
  const fillGeo = new THREE.CylinderGeometry(0.182, 0.182, 0.07, 40);
  const macarons = MACARON_COLORS.map((col, i) => {
    const m = makeMacaron(shellGeo, fillGeo, col);
    const s = 0.95 + Math.random() * 0.35;
    m.scale.setScalar(s);
    m.userData = {
      angle: (i / MACARON_COLORS.length) * Math.PI * 2 + Math.random() * 0.3,
      radius: 1.6 + Math.random() * 0.3,
      height: 0.35 + Math.random() * 1.35,
      speed: 0.16 + Math.random() * 0.08,
      spin: new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(1.2),
      phase: Math.random() * Math.PI * 2,
      delay: 0.15 + i * 0.09
    };
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    scene.add(m);
    return m;
  });

  // кофейные зёрна
  const BEANS = 18;
  const beanMesh = new THREE.InstancedMesh(makeBeanGeometry(), new THREE.MeshStandardMaterial({ color: 0x4a2a18, roughness: 0.42 }), BEANS);
  const beans = [];
  const col = new THREE.Color();
  for (let i = 0; i < BEANS; i++) {
    const a = Math.random() * Math.PI * 2, r = 1.4 + Math.random() * 1.2;
    beans.push({
      x: Math.cos(a) * r, z: Math.sin(a) * r * 0.7 - 0.4, y: 0.2 + Math.random() * 2.4,
      rx: Math.random() * 6, ry: Math.random() * 6, vr: (Math.random() - 0.5) * 1.4,
      ph: Math.random() * 6, s: 0.8 + Math.random() * 0.7
    });
    beanMesh.setColorAt(i, col.setHSL(0.06 + Math.random() * 0.02, 0.45, 0.16 + Math.random() * 0.1));
  }
  scene.add(beanMesh);
  const dummy = new THREE.Object3D();

  // ---------- состояние ----------
  const state = {
    started: false, t0: 0, progress: 0, progressS: 0,
    px: 0, py: 0, pxS: 0, pyS: 0,
    spinVel: 0, spin: 0, burst: 0, visible: true
  };

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, w < 600 ? 1.75 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // на узком экране отодвигаем камеру, чтобы всё влезло
    camera.fov = w / h < 0.9 ? 30 : 26;
    camera.updateProjectionMatrix();
    steam.material.uniforms.uScale.value = (h * dpr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const clock = new THREE.Timer();
  clock.connect(document);
  const tmp = new THREE.Vector3();

  function frame() {
    clock.update();
    const dt = Math.min(clock.getDelta(), 0.05);
    const time = clock.getElapsed();
    const speed = reduceMotion ? 0.25 : 1;

    // интро
    const it = state.started ? clamp01((time - state.t0) / 1.6) : 0;
    const intro = easeOutBack(it);

    state.progressS = lerp(state.progressS, state.progress, 1 - Math.pow(0.001, dt));
    state.pxS = lerp(state.pxS, state.px, 1 - Math.pow(0.02, dt));
    state.pyS = lerp(state.pyS, state.py, 1 - Math.pow(0.02, dt));
    const p = state.progressS;

    // камера: лёгкий параллакс от курсора и наезд при прокрутке
    camera.position.set(camBase.x + state.pxS * 0.5, camBase.y - state.pyS * 0.35 + p * 1.2, camBase.z - p * 1.4);
    camera.lookAt(target.x, target.y + p * 0.3, target.z);

    // чашка
    state.spinVel *= Math.pow(0.18, dt);
    state.spin += (state.spinVel + 0.12 * speed) * dt;
    state.burst *= Math.pow(0.12, dt);
    rig.scale.setScalar(Math.max(0.001, intro));
    rig.position.y = (1 - easeOutCubic(it)) * -1.2 + Math.sin(time * 1.1) * 0.025 * speed;
    rig.rotation.y = state.spin + state.pxS * 0.35 + p * Math.PI * 0.9 - 0.5;

    // пар — из центра кофе, только вверх
    coffee.getWorldPosition(tmp);
    steam.material.uniforms.uOrigin.value.copy(tmp);
    steam.material.uniforms.uSize.value = rig.scale.x;
    steam.material.uniforms.uTime.value = time * speed;
    steam.material.uniforms.uBoost.value = state.burst;

    // макарон на орбите
    macarons.forEach((m, i) => {
      const u = m.userData;
      const mi = easeOutCubic(clamp01((time - state.t0 - u.delay) / 1.3) * (state.started ? 1 : 0));
      const a = u.angle + time * u.speed * speed + p * 1.2;
      const r = u.radius * (1 + p * 0.9 + state.burst * 0.5) * lerp(3.2, 1, mi);
      m.position.set(
        Math.cos(a) * r,
        u.height + Math.sin(time * 0.9 * speed + u.phase) * 0.12 + p * (i % 2 ? 1.6 : -0.2),
        Math.sin(a) * r * 0.72
      );
      m.rotation.x += u.spin.x * dt * speed * (1 + state.burst * 4);
      m.rotation.y += u.spin.y * dt * speed * (1 + state.burst * 4);
      m.rotation.z += u.spin.z * dt * speed;
      m.visible = mi > 0.001;
    });

    // зёрна
    beans.forEach((b, i) => {
      const s = b.s * Math.max(0.001, easeOutCubic(clamp01((time - state.t0 - 0.3 - i * 0.03) / 1.2) * (state.started ? 1 : 0)));
      dummy.position.set(
        b.x * (1 + p * 0.6),
        b.y + Math.sin(time * 0.7 * speed + b.ph) * 0.15 + p * (i % 3 - 1) * 0.8,
        b.z
      );
      dummy.rotation.set(b.rx + time * b.vr * speed, b.ry + time * b.vr * 0.6 * speed, 0);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      beanMesh.setMatrixAt(i, dummy.matrix);
    });
    beanMesh.instanceMatrix.needsUpdate = true;

    renderer.render(scene, camera);
  }

  let running = false;
  const setRunning = (on) => {
    if (on === running) return;
    running = on;
    renderer.setAnimationLoop(on ? frame : null);
  };

  new IntersectionObserver(([e]) => { state.visible = e.isIntersecting; setRunning(state.visible && !document.hidden); }, { threshold: 0 }).observe(stage);
  document.addEventListener('visibilitychange', () => setRunning(state.visible && !document.hidden));
  setRunning(true);

  // клик по чашке: раскрутить и «выдохнуть» пар
  canvas.addEventListener('pointerdown', () => {
    state.spinVel += 9;
    state.burst = 1;
  });

  return {
    intro() { if (!state.started) { state.started = true; state.t0 = clock.getElapsed(); } },
    setProgress(v) { state.progress = clamp01(v); },
    setPointer(x, y) { state.px = x; state.py = y; }
  };
}
