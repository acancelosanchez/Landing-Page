const driver  = document.getElementById('scroll-driver');
const canvas  = document.getElementById('barrel-canvas');
const ctx     = canvas.getContext('2d');
const bgLight = document.getElementById('bg-light');
const overlay = document.getElementById('overlay');
const flash   = document.getElementById('flash');
const content = document.getElementById('content');
const hint    = document.getElementById('hint');

/* ── Helpers ── */
const clamp  = (v, a, b) => Math.max(a, Math.min(b, v));
const remap  = (v, i0, i1, o0, o1) => o0 + clamp((v - i0) / (i1 - i0), 0, 1) * (o1 - o0);
const smooth = t => t * t * (3 - 2 * t);

/* ── Estado de animación ── */
let currentRot   = 0;
let currentScale = 1;
let pending      = false;

/* ── Cargar imagen ── */
const img = new Image();
img.src = 'img/Cañon_Arma.png';
img.onload = () => {
  resizeCanvas();
  drawBarrel();
};

/* ── Resize: canvas siempre = tamaño real del viewport ── */
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  drawBarrel();
}
window.addEventListener('resize', resizeCanvas);

/* ── Dibuja la imagen centrada, cubriendo viewport, rotada y escalada ── */
function drawBarrel() {
  if (!img.complete || !img.naturalWidth) return;

  const W  = canvas.width;
  const H  = canvas.height;
  const cx = W / 2;
  const cy = H / 2;

  ctx.clearRect(0, 0, W, H);

  // Calcular tamaño "cover": la imagen cubre siempre el canvas completo
  const imgRatio    = img.naturalWidth / img.naturalHeight;
  const canvasRatio = W / H;

  let drawW, drawH;
  if (imgRatio > canvasRatio) {
    drawH = H;
    drawW = H * imgRatio;
  } else {
    drawW = W;
    drawH = W / imgRatio;
  }

  // Aplicar escala adicional del scroll encima del cover
  drawW *= currentScale;
  drawH *= currentScale;

  // Rotar desde el centro
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(currentRot * Math.PI / 180);
  ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  ctx.restore();
}

/* ── Scroll handler ── */
driver.addEventListener('scroll', () => {
  if (!pending) { requestAnimationFrame(render); pending = true; }
}, { passive: true });

function render() {
  pending = false;

  const maxScroll = driver.scrollHeight - driver.clientHeight;
  const p = driver.scrollTop / maxScroll; // 0 → 1

  /* FASE 1: avanzar por el cañón (0 → 0.75) */
  const p1 = clamp(p / 0.75, 0, 1);

  currentRot   = p1 * 540;             // 1.5 vueltas
  currentScale = 1 + smooth(p1) * 8;  // zoom ×9 máximo sobre el cover base

  drawBarrel();

  bgLight.style.filter   = `brightness(${1 + smooth(p1) * 3.5})`;
  overlay.style.opacity  = 1 - smooth(p1) * 1.4;
  hint.style.opacity     = remap(p, 0, 0.08, 1, 0);

  /* FASE 2: salida del cañón (0.75 → 1) */
  const flashPeak = remap(p, 0.75, 0.84, 0, 1);
  const flashFade = remap(p, 0.84, 1.0,  1, 0);
  flash.style.opacity = smooth(clamp(Math.min(flashPeak, flashFade), 0, 1));

  const co = smooth(remap(p, 0.86, 1, 0, 1));
  content.style.opacity       = co;
  content.style.pointerEvents = co > 0.05 ? 'auto' : 'none';
}

/* ── Render inicial (sin scroll) ── */
render();
