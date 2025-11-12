const canvas = document.getElementById('snowCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

let snowflakes = [];

function createSnowflakes() {
  const x = Math.random() * width;
  const y = Math.random() * height;
  const size = Math.random() * 3 + 2;
  const speed = Math.random() * 1 + 0.5;
  snowflakes.push({ x, y, size, speed });
}

function drawSnowflakes() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'white';
  ctx.beginPath();
  for (let flake of snowflakes) {
    ctx.moveTo(flake.x, flake.y);
    ctx.arc(flake.x, flake.y, flake.size, 0, Math.PI * 2);
  }
  ctx.fill();
  moveSnowflakes();
  requestAnimationFrame(drawSnowflakes);
}

function moveSnowflakes() {
  for (let flake of snowflakes) {
    flake.y += flake.speed;
    if (flake.y > height) {
      flake.y = 0;
      flake.x = Math.random() * width;
    }
  }
}

for (let i = 0; i < 100; i++) createSnowflakes();
drawSnowflakes();


const bgMusic = document.getElementById('bgMusic');
const musicToggle = document.getElementById('musicToggle');

// Desired audible volume when unmuted
const DESIRED_VOLUME = 0.05;
bgMusic.volume = DESIRED_VOLUME; // default target volume

// Attempt audible autoplay on load. If blocked by browser, try muted autoplay
// so playback actually starts immediately; we'll unmute/fade when allowed.
let autoplayStartedMuted = false;

bgMusic.muted = false;
bgMusic.play().then(() => {
  // audible autoplay succeeded
  if (musicToggle) musicToggle.textContent = '❚❚';
}).catch(err => {
  // audible autoplay prevented -> try muted autoplay (most browsers allow this)
  console.log('Audible autoplay prevented, attempting muted autoplay:', err);
  bgMusic.muted = true;
  bgMusic.play().then(() => {
    autoplayStartedMuted = true;
    // indicate playback state (muted) so UI shows it's playing
    if (musicToggle) musicToggle.textContent = '❚❚';
    console.log('Muted autoplay started successfully');
  }).catch(err2 => {
    // muted autoplay also prevented; fall back to waiting for user interaction
    bgMusic.muted = false;
    if (musicToggle) musicToggle.textContent = '▶';
    console.log('Muted autoplay prevented as well:', err2);
  });
});

// On the first user gesture, if we started muted, unmute and fade in to desired volume.
document.body.addEventListener('click', (e) => {
  if (e.target && e.target.id === 'musicToggle') return; // ignore toggle clicks here

  if (autoplayStartedMuted && bgMusic.muted) {
    // Unmute and fade in
    try {
      bgMusic.muted = false;
      // start from 0 and fade to DESIRED_VOLUME
      bgMusic.volume = 0;
      const steps = 10;
      const stepVal = DESIRED_VOLUME / steps;
      let v = 0;
      const fade = setInterval(() => {
        v += stepVal;
        if (v >= DESIRED_VOLUME) {
          bgMusic.volume = DESIRED_VOLUME;
          clearInterval(fade);
        } else {
          bgMusic.volume = v;
        }
      }, 60);
      if (musicToggle) musicToggle.textContent = '❚❚';
    } catch (unmuteErr) {
      console.log('Failed to unmute on gesture:', unmuteErr);
    }
    // no further action needed for play since audio is already playing (muted)
    return;
  }

  // If we didn't start autoplay at all, let a regular interaction start playback
  if (bgMusic.paused) {
    bgMusic.play().then(() => {
      if (musicToggle) musicToggle.textContent = '❚❚';
    }).catch(e => console.log('Play prevented on interaction:', e));
  }
});

// Music toggle click: play/pause and ensure unmuted when user intentionally plays
if (musicToggle) {
  musicToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    if (bgMusic.paused) {
      // user explicitly requests play -> ensure not muted and set volume
      if (bgMusic.muted) bgMusic.muted = false;
      bgMusic.volume = DESIRED_VOLUME;
      bgMusic.play().then(() => {
        musicToggle.textContent = '❚❚';
      }).catch(err => console.log('Play failed from toggle:', err));
    } else {
      bgMusic.pause();
      musicToggle.textContent = '▶';
    }
  });
}


const tearTab = document.getElementById('tearTab');
const boxClosed = document.getElementById('boxClosed');
const boxTop = document.getElementById('boxTop');
const boxBottom = document.getElementById('boxBottom');
const sticks = document.getElementById('sticks');
const instruction = document.getElementById('instruction');
// Prepare tear frames (pepero_tear-1 .. pepero_tear-15) and preload them
const tearFrames = [];
const maxTear = 16;
for (let i = 1; i <= maxTear; i++) {
  // folder has a space in its name; use same relative path as your assets
  tearFrames.push(`Pepero/Pepero Tear/pepero_tear-${i}.png`);
}
// Preload images to avoid flicker
tearFrames.forEach(src => { const img = new Image(); img.src = src; });

let currentTear = 0; // how many tear frames have been shown (0..maxTear)

let isTearPlaying = false;

function playTearSequence() {
  if (!tearTab || isTearPlaying) return;
  isTearPlaying = true;
  // Hide the tear indicator immediately when sequence starts
  const tearIndicator = document.querySelector('.tear-indicator');
  if (tearIndicator) tearIndicator.style.display = 'none';
  // prevent re-click while animating
  tearTab.style.pointerEvents = 'none';

  let frame = 0;
  const frameDelay = 100; // ms per frame

  function step() {
    frame++;
    if (frame <= maxTear) {
      tearTab.src = tearFrames[frame - 1];
      setTimeout(step, frameDelay);
      return;
    }

    // After final frame, run original open/tear behavior
    setTimeout(() => {
      if (boxClosed) boxClosed.classList.add('hidden');
      if (instruction) instruction.classList.add('hidden');

      // Show the split box parts; ensure they occupy layout space even when hidden
      if (boxTop) boxTop.classList.remove('hidden');
      if (boxBottom) boxBottom.classList.remove('hidden');

      if (boxTop) boxTop.classList.add('box-top-open');

      setTimeout(() => {
        // Instead of removing from layout with .hidden (display:none), use .preserve-space
        if (boxTop) {
          boxTop.classList.remove('box-top-open');
          boxTop.classList.add('preserve-space');
        }
        if (sticks) sticks.classList.remove('hidden');
  // After sticks are revealed, show a pulsing click indicator over the first stick
  try { showStickClickIndicator(); } catch (err) { /* ignore if DOM not ready */ }
      }, 1000); // match animation duration

      // Blank and fully disable the tear row so it can't be used again
      tearTab.style.pointerEvents = 'none';
      if (tearTab.removeEventListener) tearTab.removeEventListener('click', playTearSequence);
    }, 200);
  }

  step();
}

if (tearTab) {
  tearTab.addEventListener('click', playTearSequence);
}

// Robust positioning: place the `.tear-indicator` to the left/top of the `#tearTab` image
function positionTearInstruction() {
  const scene = document.querySelector('.pepero-scene');
  const tab = document.getElementById('tearTab');
  const instr = document.querySelector('.tear-indicator');
  if (!scene || !tab || !instr) return;

  // Make sure the instruction is absolutely positioned inside the scene
  instr.style.position = 'absolute';
  instr.style.pointerEvents = 'none';
  instr.style.zIndex = '999';

  // Get bounding rects and compute scene-local coordinates
  const sceneRect = scene.getBoundingClientRect();
  const tabRect = tab.getBoundingClientRect();
  const instrRect = instr.getBoundingClientRect();

  // Calculate position: left of the tab, vertically centered on the tab
  const gap = 8; // pixels gap between instruction and tab
  let left = (tabRect.left - sceneRect.left) - instrRect.width - gap;
  let top = (tabRect.top - sceneRect.top) + (tabRect.height - instrRect.height) / 2;

  // If left would go off the scene, place it overlapping the tab instead
  if (left < 4) left = (tabRect.left - sceneRect.left) + tabRect.width * 0.02;

  // Position the indicator centered on the left edge of the tab area (start of tab)
  // We'll place the indicator at the left edge + 6px inside for clarity
  const indicatorX = (tabRect.left - sceneRect.left) + 16;
  const indicatorY = (tabRect.top - sceneRect.top) + tabRect.height / 2;
  instr.style.left = Math.round(indicatorX) + 'px';
  instr.style.top = Math.round(indicatorY) + 'px';
}

window.addEventListener('load', () => {
  positionTearInstruction();
});
window.addEventListener('resize', () => {
  positionTearInstruction();
});

// Make sticks clickable: bring clicked stick in front
function enableStickClicks() {
  const sticksContainer = document.querySelector('.sticks');
  const sticks = Array.from(document.querySelectorAll('.stick'));
  if (!sticksContainer || sticks.length === 0) return;

  // variants for cycling when a stick is already in-front
  const stickVariants = [
    'Pepero/Pepero Stick/stick-1.png',
    'Pepero/Pepero Stick/stick-2.png',
    'Pepero/Pepero Stick/stick-3.png',
    'Pepero/Pepero Stick/stick-4.png'
  ];

  // initialize per-stick state
  sticks.forEach(s => {
    s.style.cursor = 'pointer';
    s.dataset.variantIndex = '0'; // starts at variant 0 (stick-1)
    s.dataset.hidden = 'false';

    s.addEventListener('click', (e) => {
      e.stopPropagation();
      // ignore clicks on hidden sticks
      if (s.dataset.hidden === 'true') return;

      const isFront = s.classList.contains('in-front');

      if (!isFront) {
        // bring this stick forward and reset others; do NOT revive sticks that have been hidden
        sticks.forEach(x => {
          if (x === s) return;
          // if another stick was already hidden (eaten), leave it hidden
          if (x.dataset.hidden === 'true') return;
          x.classList.remove('in-front');
          x.dataset.variantIndex = '0';
          setStickSrc(x, stickVariants[0]);
          x.style.display = '';
          x.style.opacity = '';
          x.style.pointerEvents = '';
        });
  s.classList.add('in-front');
        // ensure the front stick shows the base variant unless it was already advanced
  const current = parseInt(s.dataset.variantIndex || '0', 10);
  setStickSrc(s, stickVariants[current] || stickVariants[0]);
  // Move the click indicator to this stick and position it at the top (now in-front)
  showStickClickIndicator(s);
  // Position after layout/transform is applied
  requestAnimationFrame(positionStickIndicator);
        return;
      }

      // If already in-front, advance the variant index and update appearance
      let idx = parseInt(s.dataset.variantIndex || '0', 10);
      idx = idx + 1; // advance to next variant on each click while in-front

      if (idx < stickVariants.length) {
  s.dataset.variantIndex = String(idx);
  setStickSrc(s, stickVariants[idx]);
        // reposition the indicator to move down as the stick is eaten
        requestAnimationFrame(positionStickIndicator);
      } else {
        // after final variant, hide the stick visually and disable interactions
        // Use visibility:hidden (preserves layout space) so other sticks don't shift
        s.dataset.hidden = 'true';
        // check if all sticks are now hidden and enable the letter if so
        checkAllSticksHidden();
        s.classList.remove('in-front');
        s.style.transition = 'opacity 220ms ease, transform 220ms ease';
        s.style.opacity = '0';
        // keep the element in layout but make it non-interactive and invisible
        setTimeout(() => {
          s.style.visibility = 'hidden';
          s.style.pointerEvents = 'none';
          // after this stick is fully hidden, move the indicator to the next available stick
          const next = findNextAvailableStick(s);
          if (next) {
            // ensure next has default variant index
            if (!next.dataset.variantIndex) next.dataset.variantIndex = '0';
            showStickClickIndicator(next);
            requestAnimationFrame(positionStickIndicator);
          } else {
            removeStickClickIndicator();
          }
        }, 240);
      }
    });
  });
  // If some sticks were already hidden (edge case), enable the letter now
  checkAllSticksHidden();
}

// Helper to safely update an <img> src and avoid drop-shadow/outline artifacts on mobile
function setStickSrc(imgEl, src) {
  if (!imgEl) return;
  const tmp = new Image();
  tmp.onload = () => {
    // swap source when fully loaded, then force a small repaint
    imgEl.src = src;
    // briefly toggle a paint class to ensure the browser updates the compositing
    imgEl.classList.add('refresh-repaint');
    setTimeout(() => imgEl.classList.remove('refresh-repaint'), 30);
  };
  tmp.src = src;
}

window.addEventListener('load', enableStickClicks);

// Check whether all sticks are hidden and enable the letter when they are
function checkAllSticksHidden() {
  const sticks = Array.from(document.querySelectorAll('.stick'));
  if (sticks.length === 0) return false;
  const allHidden = sticks.every(s => s.dataset.hidden === 'true');
  if (allHidden) enableLetterClick();
  return allHidden;
}

// Enable the letter to be clickable once all sticks are hidden
function enableLetterClick() {
  const letter = document.getElementById('letter');
  const boxBottom = document.getElementById('boxBottom');
  if (!letter || !boxBottom) return;

  // If already enabled, do nothing
  if (letter.dataset.enabled === 'true') return;
  letter.dataset.enabled = 'true';
  letter.style.pointerEvents = 'auto';
  letter.style.cursor = 'pointer';

  function onLetterClick(e) {
    e.stopPropagation();
    // Prevent double clicks
    // Temporarily disable pointer events while handling
    letter.style.pointerEvents = 'none';

    // If not yet revealed, perform reveal; otherwise, enlarge
    if (letter.dataset.revealed !== 'true') {
      // first click: reveal the letter (slide box bottom)
      boxBottom.classList.add('box-bottom-slide');

      const cleanup = () => {
        boxBottom.classList.remove('box-bottom-slide');
        boxBottom.classList.add('hidden');
        boxBottom.removeEventListener('transitionend', cleanup);

        // mark letter as revealed and reposition the indicator to center
        letter.dataset.revealed = 'true';
        // reposition the indicator to the center of the letter
        requestAnimationFrame(positionLetterIndicator);

        // re-enable clicking so second click can enlarge
        letter.style.pointerEvents = 'auto';
        letter.style.cursor = 'pointer';
      };

      boxBottom.addEventListener('transitionend', cleanup);
      // Fallback in case transitionend doesn't fire
      setTimeout(() => {
        if (!boxBottom.classList.contains('hidden')) {
          boxBottom.classList.add('hidden');
        }
        if (letter.dataset.revealed !== 'true') {
          letter.dataset.revealed = 'true';
          requestAnimationFrame(positionLetterIndicator);
          letter.style.pointerEvents = 'auto';
        }
      }, 900);
      return;
    }

    // Second click: enlarge the letter and remove the indicator
    letter.classList.add('letter-enlarge');
    removeLetterClickIndicator();
    // keep pointer events disabled after enlargement to avoid accidental re-clicks
    letter.style.pointerEvents = 'none';

    // After the transition finishes, hide the element (preserve layout if desired)
    const cleanup = () => {
      // final hide: remove from flow so only the letter remains visible
      boxBottom.classList.remove('box-bottom-slide');
      boxBottom.classList.add('hidden');
      boxBottom.removeEventListener('transitionend', cleanup);
    };

    boxBottom.addEventListener('transitionend', cleanup);
    // Fallback in case transitionend doesn't fire (force hide after 800ms)
    setTimeout(() => {
      if (!boxBottom.classList.contains('hidden')) {
        boxBottom.classList.add('hidden');
      }
    }, 900);
  }

  letter.addEventListener('click', onLetterClick);
  // show a click indicator for the letter now that it is enabled
  showLetterClickIndicator();
}

// --- Click indicator helpers for the first stick ---
let _stickIndicatorEl = null;
let _stickIndicatorTarget = null;

function showStickClickIndicator(targetStick) {
  // targetStick: optional DOM element to anchor the indicator to
  const first = targetStick || document.querySelector('.stick');
  if (!first) return;

  // create indicator if not present
  if (!_stickIndicatorEl) {
    const indicator = document.createElement('div');
    indicator.className = 'stick-click-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    const scene = document.querySelector('.pepero-scene') || document.body;
    scene.appendChild(indicator);
    _stickIndicatorEl = indicator;
    // Reposition on resize in case layout shifts
    window.addEventListener('resize', positionStickIndicator);
  }

  _stickIndicatorTarget = first;
  positionStickIndicator();
}

function positionStickIndicator() {
  if (!_stickIndicatorEl || !_stickIndicatorTarget) return;
  const firstStick = _stickIndicatorTarget;
  if (!firstStick) return;
  const scene = document.querySelector('.pepero-scene') || document.body;
  const sceneRect = scene.getBoundingClientRect();
  const stickRect = firstStick.getBoundingClientRect();

  // Position X centered on the stick
  const x = stickRect.left - sceneRect.left + stickRect.width / 2; // slight left offset

  // Move Y from near-top down toward bottom as the stick is eaten.
  const variantIdx = parseInt(firstStick.dataset.variantIndex || '0', 10);
  const maxVariants = 3; // 4 images => indices 0..3
  const startPct = 0.05; // top position when fresh
  const endPct = 0.75;   // bottom-ish position when eaten
  const t = Math.min(1, Math.max(0, variantIdx / maxVariants));
  const yPct = startPct + (endPct - startPct) * t;
  const y = stickRect.top - sceneRect.top + stickRect.height * yPct;

  _stickIndicatorEl.style.left = Math.round(x) + 'px';
  _stickIndicatorEl.style.top = Math.round(y) + 'px';
}

function removeStickClickIndicator() {
  if (!_stickIndicatorEl) return;
  try { _stickIndicatorEl.remove(); } catch (e) { /* ignore */ }
  _stickIndicatorEl = null;
  _stickIndicatorTarget = null;
  window.removeEventListener('resize', positionStickIndicator);
}

// Find the next available (not hidden) stick in DOM order after the provided stick
function findNextAvailableStick(currentStick) {
  const all = Array.from(document.querySelectorAll('.stick'));
  if (!all || all.length === 0) return null;
  const index = all.indexOf(currentStick);
  // search forward
  for (let i = index + 1; i < all.length; i++) {
    const s = all[i];
    if (s && s.dataset.hidden !== 'true') return s;
  }
  // wrap-around: search from start to current
  for (let i = 0; i < index; i++) {
    const s = all[i];
    if (s && s.dataset.hidden !== 'true') return s;
  }
  return null;
}

// --- Letter click indicator helpers ---
let _letterIndicatorEl = null;

function showLetterClickIndicator() {
  if (_letterIndicatorEl) return;
  const letter = document.getElementById('letter');
  const scene = document.querySelector('.pepero-scene') || document.body;
  if (!letter || !scene) return;

  const el = document.createElement('div');
  el.className = 'letter-click-indicator';
  el.setAttribute('aria-hidden', 'true');
  scene.appendChild(el);
  _letterIndicatorEl = el;
  positionLetterIndicator();
  window.addEventListener('resize', positionLetterIndicator);
}

function positionLetterIndicator() {
  if (!_letterIndicatorEl) return;
  const letter = document.getElementById('letter');
  const scene = document.querySelector('.pepero-scene') || document.body;
  if (!letter || !scene) return;
  const sceneRect = scene.getBoundingClientRect();
  const letterRect = letter.getBoundingClientRect();
  // place at top-center of the letter image by default; center when revealed
  const x = letterRect.left - sceneRect.left + letterRect.width / 2;
  const revealed = letter.dataset.revealed === 'true';
  const y = revealed
    ? (letterRect.top - sceneRect.top + letterRect.height / 2) // center
    : (letterRect.top - sceneRect.top + (letterRect.height * 0.08)); // slightly down from top edge
  _letterIndicatorEl.style.left = Math.round(x) + 'px';
  _letterIndicatorEl.style.top = Math.round(y) + 'px';
}

function removeLetterClickIndicator() {
  if (!_letterIndicatorEl) return;
  try { _letterIndicatorEl.remove(); } catch (e) { /* ignore */ }
  _letterIndicatorEl = null;
  window.removeEventListener('resize', positionLetterIndicator);
}


