/* YARVIS — Núcleo 3D del asistente
   Esfera de partículas + núcleo icosaédrico + anillos orbitales.
   Creado por Ronald Mamani Barrios. */
(function () {
  'use strict';

  var canvas = document.getElementById('core3d');
  if (!canvas || typeof THREE === 'undefined') return;

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05080f, 0.055);

  var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 8);

  var group = new THREE.Group();
  scene.add(group);

  var CYAN = 0x6de9ed;
  var BLUE = 0x4b86df;
  var MINT = 0xadf4ee;

  /* ---- Núcleo: icosaedro wireframe + esfera interior brillante ---- */
  var core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.35, 1),
    new THREE.MeshBasicMaterial({ color: CYAN, wireframe: true, transparent: true, opacity: 0.85 })
  );
  group.add(core);

  var innerCore = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.62, 2),
    new THREE.MeshBasicMaterial({ color: MINT, wireframe: true, transparent: true, opacity: 0.5 })
  );
  group.add(innerCore);

  var glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.34, 24, 24),
    new THREE.MeshBasicMaterial({ color: 0xdffffb, transparent: true, opacity: 0.9 })
  );
  group.add(glow);

  /* ---- Capa de partículas distribuidas en esfera ---- */
  function particleSphere(radius, count, color, size, opacity) {
    var positions = new Float32Array(count * 3);
    for (var i = 0; i < count; i++) {
      var phi = Math.acos(2 * Math.random() - 1);
      var theta = Math.random() * Math.PI * 2;
      var r = radius * (0.92 + Math.random() * 0.16);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({ color: color, size: size, transparent: true, opacity: opacity, depthWrite: false });
    return new THREE.Points(geo, mat);
  }

  var shell = particleSphere(2.4, 900, CYAN, 0.035, 0.8);
  var dust = particleSphere(5.5, 500, BLUE, 0.05, 0.35);
  group.add(shell);
  scene.add(dust);

  /* ---- Anillos orbitales ---- */
  function ring(radius, tube, color, opacity) {
    var m = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 8, 140),
      new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: opacity })
    );
    group.add(m);
    return m;
  }
  var ringA = ring(2.05, 0.012, CYAN, 0.9);
  var ringB = ring(2.75, 0.008, BLUE, 0.6);
  var ringC = ring(3.35, 0.006, CYAN, 0.35);
  ringA.rotation.x = Math.PI / 2.4;
  ringB.rotation.x = Math.PI / 3.1;
  ringB.rotation.y = 0.7;
  ringC.rotation.x = Math.PI / 1.8;
  ringC.rotation.y = -0.5;

  /* ---- Líneas radiales tipo "reactor" ---- */
  var spokes = new THREE.Group();
  var spokeMat = new THREE.LineBasicMaterial({ color: CYAN, transparent: true, opacity: 0.28 });
  for (var s = 0; s < 26; s++) {
    var a = (s / 26) * Math.PI * 2;
    var g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(Math.cos(a) * 1.6, 0, Math.sin(a) * 1.6),
      new THREE.Vector3(Math.cos(a) * 2.05, 0, Math.sin(a) * 2.05)
    ]);
    spokes.add(new THREE.Line(g, spokeMat));
  }
  spokes.rotation.x = Math.PI / 2.4;
  group.add(spokes);

  /* ---- Interacción: parallax con el ratón ---- */
  var mouseX = 0, mouseY = 0;
  window.addEventListener('pointermove', function (e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  /* Posiciona el núcleo a la derecha en pantallas anchas, centrado en móviles */
  function layout() {
    group.position.x = window.innerWidth > 900 ? 2.6 : 0;
    group.position.y = window.innerWidth > 900 ? 0.1 : 1.2;
  }
  window.addEventListener('resize', layout);
  layout();

  var t = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (!reduced) {
      t += 0.008;
      var pulse = 1 + Math.sin(t * 2.2) * 0.06;

      core.rotation.y += 0.004;
      core.rotation.x += 0.0012;
      core.scale.setScalar(pulse);

      innerCore.rotation.y -= 0.009;
      innerCore.rotation.z += 0.004;
      innerCore.scale.setScalar(1 + Math.sin(t * 3.1) * 0.1);

      glow.scale.setScalar(1 + Math.sin(t * 4) * 0.18);
      glow.material.opacity = 0.65 + Math.sin(t * 4) * 0.25;

      shell.rotation.y += 0.0016;
      shell.rotation.x += 0.0005;
      dust.rotation.y -= 0.0006;

      ringA.rotation.z += 0.003;
      ringB.rotation.z -= 0.002;
      ringC.rotation.z += 0.0012;
      spokes.rotation.z += 0.003;

      group.rotation.y += (mouseX * 0.35 - group.rotation.y) * 0.04;
      group.rotation.x += (mouseY * 0.22 - group.rotation.x) * 0.04;

      camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 0.3 - camera.position.y) * 0.03;
      camera.lookAt(group.position.x * 0.6, 0, 0);
    }
    renderer.render(scene, camera);
  }
  animate();
})();
