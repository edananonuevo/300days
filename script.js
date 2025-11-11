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
  // Hide the indicator immediately when sequence starts
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

// Robust positioning: place the `.tear-instruction` to the left/top of the `#tearTab` image
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
          x.src = stickVariants[0];
          x.style.display = '';
          x.style.opacity = '';
          x.style.pointerEvents = '';
        });
        s.classList.add('in-front');
        // ensure the front stick shows the base variant unless it was already advanced
        const current = parseInt(s.dataset.variantIndex || '0', 10);
        s.src = stickVariants[current] || stickVariants[0];
        return;
      }

      // If already in-front, advance the variant index and update appearance
      let idx = parseInt(s.dataset.variantIndex || '0', 10);
  idx = idx + 1; // advance to next variant on each click while in-front

  if (idx < stickVariants.length) {
        s.dataset.variantIndex = String(idx);
        s.src = stickVariants[idx];
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
        }, 240);
      }
    });
  });
  // If some sticks were already hidden (edge case), enable the letter now
  checkAllSticksHidden();
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
    letter.style.pointerEvents = 'none';

    // Slide the box bottom down and then hide it so the letter is unobstructed
    boxBottom.classList.add('box-bottom-slide');

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
}

