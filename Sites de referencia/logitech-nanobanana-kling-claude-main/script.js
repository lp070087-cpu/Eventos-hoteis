/* ------------------------------------------------------------------
   Scroll-driven frame-sequence scrubbing (Apple/Logitech-style).
   A sequence of JPEGs is preloaded and drawn to a <canvas> sized to
   the hero stage (right column). The frame index maps to scroll
   progress through #scroll-hero and is eased each rAF. No video
   seeking, so it works reliably across browsers and static hosts.
------------------------------------------------------------------- */

const FRAME_COUNT = 241;
const framePath = i => `assets/frames/f_${String(i).padStart(3, '0')}.jpg`;

const canvas   = document.getElementById('hero-canvas');
const ctx      = canvas.getContext('2d');
const stage    = canvas.parentElement;            // .hero-stage
const hero     = document.getElementById('scroll-hero');
const bar      = document.getElementById('scroll-progress-bar');
const loader   = document.getElementById('hero-loader');
const loaderBar= document.getElementById('hero-loader-bar');

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const frames = new Array(FRAME_COUNT);
let loaded = 0, ready = false;
let targetFrame = 0, easedFrame = 0, lastDrawn = -1;

/* ---------- preload ---------- */
function preload() {
  for (let i = 0; i < FRAME_COUNT; i++) {
    const img = new Image();
    img.onload = img.onerror = () => {
      loaded++;
      loaderBar.style.width = Math.round((loaded / FRAME_COUNT) * 100) + '%';
      if (i === 0 && !ready) { ready = true; sizeCanvas(); }
      if (loaded === FRAME_COUNT) loader.classList.add('is-done');
    };
    img.src = framePath(i + 1);
    frames[i] = img;
  }
}

/* ---------- canvas sizing (DPR-aware) ---------- */
function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = stage.clientWidth, h = stage.clientHeight;
  canvas.width  = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  lastDrawn = -1;
  draw(easedFrame);
}

/* draw a frame with object-fit: cover (fills the whole viewport so the
   image edges sit at the screen boundary — no visible box). ANCHOR_X
   biases the framing slightly right so the diagonal keyboard sits
   center-right and the upper-left stays clear for the headline. */
const ANCHOR_X = 0.50;   // stage matches image ratio → exact fill, centered
const ANCHOR_Y = 0.50;
function draw(frameFloat) {
  const idx = clamp(Math.round(frameFloat), 0, FRAME_COUNT - 1);
  const img = frames[idx];
  if (!img || !img.complete || img.naturalWidth === 0) return;

  const cw = stage.clientWidth, ch = stage.clientHeight;
  const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = (cw - dw) * ANCHOR_X;
  const dy = (ch - dh) * ANCHOR_Y;

  ctx.clearRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
  lastDrawn = idx;
}

/* ---------- scroll mapping ---------- */
function progress() {
  const rect  = hero.getBoundingClientRect();
  const total = hero.offsetHeight - window.innerHeight;
  return clamp(-rect.top / total, 0, 1);
}
function onScroll() {
  const p = progress();
  targetFrame = p * (FRAME_COUNT - 1);
  if (bar) bar.style.width = (p * 100).toFixed(2) + '%';
}

/* ---------- per-frame easing loop ---------- */
function tick() {
  easedFrame += (targetFrame - easedFrame) * 0.18;
  if (Math.abs(targetFrame - easedFrame) < 0.01) easedFrame = targetFrame;
  if (ready && Math.round(easedFrame) !== lastDrawn) draw(easedFrame);
  requestAnimationFrame(tick);
}

/* ---------- reveal on scroll ---------- */
function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
}

/* ---------- init ---------- */
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', sizeCanvas);
preload();
onScroll();
setupReveal();
requestAnimationFrame(tick);
