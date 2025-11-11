let sticksEaten = 0;
const totalSticks = document.querySelectorAll('.stick').length;

function openLid() {
  const box = document.querySelector('.pepero-box');
  box.classList.add('open');
}

function eatStick(stick) {
  if (stick.classList.contains('eaten')) return;
  stick.classList.add('eaten');
  stick.style.height = '0';
  stick.style.opacity = '0';
  sticksEaten++;

  if (sticksEaten === totalSticks) {
    revealPaper();
  }
}

function revealPaper() {
  const paper = document.querySelector('.paper');
  paper.style.display = 'block';
  paper.style.animation = 'pop 0.6s ease';
}

function openLetter() {
  const letter = document.querySelector('.letter');
  letter.style.display = 'block';
  letter.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 800, fill: 'forwards' });
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

