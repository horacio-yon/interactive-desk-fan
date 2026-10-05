document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Generar rejilla radial ---------- */
  (function buildGrille() {
    const grille = document.getElementById('grille');
    const total = 28;
    const rInner = 16;
    const rOuter = 83;

    for (let i = 0; i < total; i++) {
      const angle = (i * 360 / total) * Math.PI / 180;
      const x1 = 100 + rInner * Math.cos(angle);
      const y1 = 100 + rInner * Math.sin(angle);
      const x2 = 100 + rOuter * Math.cos(angle);
      const y2 = 100 + rOuter * Math.sin(angle);

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1.toFixed(2));
      line.setAttribute('y1', y1.toFixed(2));
      line.setAttribute('x2', x2.toFixed(2));
      line.setAttribute('y2', y2.toFixed(2));
      grille.appendChild(line);
    }
  })();

  /* ---------- Referencias DOM ---------- */
  const fanScene   = document.getElementById('fanScene');
  const bladesGrp  = document.getElementById('bladesGroup');
  const statusText = document.getElementById('statusText');
  const btnOn      = document.getElementById('btnOn');
  const btnOff     = document.getElementById('btnOff');
  const speedBtns  = document.querySelectorAll('.speed-btn');

  /* Velocidades en grados/segundo */
  const speedTargets = { 1: 260, 2: 560, 3: 960 };

  let isOn = false;
  let currentSpeed = 1;

  let angle = 0;              // Ángulo actual
  let currentVel = 0;         // Velocidad angular actual (deg/s)
  let targetVel = 0;          // Velocidad angular objetivo (deg/s)
  let lastTime = null;
  let rafId = null;

  const ACCEL_RATE = 1.4;     // Tasa de aceleración
  const DECEL_RATE = 0.55;    // Tasa de desaceleración (inercia natural)

  function updateStatus() {
    statusText.textContent = isOn
      ? 'Encendido · Velocidad ' + currentSpeed
      : (currentVel > 1 ? 'Deteniendo…' : 'Apagado');
  }

  function loop(timestamp) {
    if (lastTime === null) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    const rate = targetVel > currentVel ? ACCEL_RATE : DECEL_RATE;
    currentVel += (targetVel - currentVel) * (1 - Math.exp(-rate * dt * 10));

    if (Math.abs(targetVel - currentVel) < 0.5 && targetVel === 0) {
      currentVel = 0;
    }

    angle = (angle + currentVel * dt) % 360;
    bladesGrp.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' 100 100)');

    fanScene.classList.toggle('spinning', currentVel > 4);

    if (!isOn) updateStatus();

    if (currentVel > 0.05 || targetVel > 0) {
      rafId = requestAnimationFrame(loop);
    } else {
      currentVel = 0;
      lastTime = null;
      rafId = null;
      updateStatus();
    }
  }

  function ensureLoop() {
    if (rafId === null) {
      lastTime = null;
      rafId = requestAnimationFrame(loop);
    }
  }

  function turnOn() {
    isOn = true;
    targetVel = speedTargets[currentSpeed];
    btnOn.classList.add('active');
    btnOff.classList.remove('active');
    speedBtns.forEach(b => b.disabled = false);
    speedBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.speed) === currentSpeed));
    updateStatus();
    ensureLoop();
  }

  function turnOff() {
    isOn = false;
    targetVel = 0;
    btnOff.classList.add('active');
    btnOn.classList.remove('active');
    speedBtns.forEach(b => b.disabled = true);
    speedBtns.forEach(b => b.classList.toggle('active', false));
    updateStatus();
    ensureLoop();
  }

  function setSpeed(speed) {
    currentSpeed = speed;
    speedBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.speed) === speed));
    if (isOn) {
      targetVel = speedTargets[speed];
      ensureLoop();
    }
    updateStatus();
  }

  /* Event Listeners */
  btnOn.addEventListener('click', turnOn);
  btnOff.addEventListener('click', turnOff);

  speedBtns.forEach(b => {
    b.addEventListener('click', () => {
      if (!isOn) return;
      setSpeed(Number(b.dataset.speed));
    });
  });

  /* Estado inicial */
  setSpeed(1);
  turnOff();
});