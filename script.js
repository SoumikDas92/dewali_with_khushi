(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const audioConstructor = window.AudioContext || window.webkitAudioContext;
  let audioContext = null;
  let soundEnabled = false;

  const soundToggle = document.querySelector("#sound-toggle");
  const soundLabel = document.querySelector("#sound-label");

  function getAudioContext() {
    if (!audioConstructor) return null;
    if (!audioContext) audioContext = new audioConstructor();
    if (audioContext.state === "suspended") void audioContext.resume();
    return audioContext;
  }

  function tone(context, frequency, startAt, duration, volume, type = "sine") {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.035);
  }

  function playChime() {
    if (!soundEnabled) return;
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime + 0.015;
    tone(context, 880, now, 0.65, 0.048, "sine");
    tone(context, 1174.66, now + 0.08, 0.78, 0.034, "sine");
    tone(context, 1567.98, now + 0.16, 0.92, 0.022, "sine");
  }

  function playFireworkSound() {
    if (!soundEnabled) return;
    const context = getAudioContext();
    if (!context) return;
    const now = context.currentTime + 0.01;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(190, now);
    oscillator.frequency.exponentialRampToValueAtTime(65, now + 0.16);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1500, now);
    filter.frequency.exponentialRampToValueAtTime(350, now + 0.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.055, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.24);
    tone(context, 1318.5, now + 0.08, 0.55, 0.028, "sine");
    tone(context, 1760, now + 0.16, 0.72, 0.019, "sine");
  }

  if (soundToggle && soundLabel) {
    if (!audioConstructor) {
      soundLabel.textContent = "Sound unavailable";
      soundToggle.setAttribute("aria-label", "Sound is not supported by this browser");
      soundToggle.disabled = true;
    } else {
      soundToggle.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        soundToggle.setAttribute("aria-pressed", String(soundEnabled));
        soundToggle.setAttribute("aria-label", soundEnabled ? "Turn sound off" : "Turn sound on");
        soundLabel.textContent = soundEnabled ? "Sound on" : "Sound off";
        if (soundEnabled) playChime();
      });
    }
  }

  // A tiny, self-contained fireworks canvas keeps the page asset-free and Pages-ready.
  const canvas = document.querySelector("#fireworks-canvas");
  const canvasContext = canvas ? canvas.getContext("2d") : null;
  const particles = [];
  let canvasWidth = window.innerWidth;
  let canvasHeight = window.innerHeight;
  let frameRequest = 0;

  function resizeCanvas() {
    if (!canvas || !canvasContext) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, window.innerWidth < 600 ? 1.5 : 2);
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = Math.round(canvasWidth * pixelRatio);
    canvas.height = Math.round(canvasHeight * pixelRatio);
    canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function animateParticles() {
    if (!canvasContext) return;
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.987;
      particle.vy = particle.vy * 0.988 + 0.025;
      particle.life -= 1;
      if (particle.life <= 0) {
        particles.splice(index, 1);
        continue;
      }
      canvasContext.globalAlpha = Math.max(0, particle.life / particle.maxLife) * 0.92;
      canvasContext.fillStyle = particle.color;
      canvasContext.beginPath();
      canvasContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      canvasContext.fill();
    }
    canvasContext.globalAlpha = 1;
    if (particles.length) {
      frameRequest = window.requestAnimationFrame(animateParticles);
    } else {
      frameRequest = 0;
      canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
    }
  }

  const fireworkColors = ["#ffd987", "#ffb47a", "#f49b9e", "#dfb1e4", "#fff0c9", "#ee8d6c"];

  function burstAt(x, y, amount = 42) {
    if (!canvasContext || reducedMotion) return;
    const burstCount = Math.min(amount, 72, Math.max(0, 360 - particles.length));
    for (let index = 0; index < burstCount; index += 1) {
      const angle = (Math.PI * 2 * index) / amount + Math.random() * 0.12;
      const speed = 1.15 + Math.random() * 2.5;
      const life = 34 + Math.floor(Math.random() * 28);
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        radius: 1 + Math.random() * 1.7,
        color: fireworkColors[Math.floor(Math.random() * fireworkColors.length)]
      });
    }
    if (!frameRequest) frameRequest = window.requestAnimationFrame(animateParticles);
  }

  function burstNear(element, amount = 42, offsetX = 0, offsetY = 0) {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    burstAt(rect.left + rect.width / 2 + offsetX, rect.top + rect.height / 2 + offsetY, amount);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas, { passive: true });

  // Kindling a diya updates the wish counter and lights the full row at once.
  const diyaButtons = Array.from(document.querySelectorAll(".diya-tile"));
  const progressCount = document.querySelector("#progress-count");
  const progressCaption = document.querySelector("#progress-caption");
  const progressTrack = document.querySelector("#progress-track");
  const progressFill = document.querySelector("#progress-fill");
  const lightAllButton = document.querySelector("#light-all");

  function updateDiyas() {
    const litCount = diyaButtons.filter((button) => button.classList.contains("is-lit")).length;
    if (progressCount) progressCount.innerHTML = `${litCount} <small>/ ${diyaButtons.length}</small>`;
    if (progressTrack) {
      progressTrack.setAttribute("aria-valuenow", String(litCount));
      progressTrack.setAttribute("aria-valuetext", `${litCount} of ${diyaButtons.length} diyas lit`);
    }
    if (progressFill) progressFill.style.width = `${(litCount / diyaButtons.length) * 100}%`;
    if (lightAllButton) lightAllButton.innerHTML = litCount === diyaButtons.length ? 'Reset the diyas <span aria-hidden="true">↺</span>' : 'Light all five <span aria-hidden="true">✦</span>';

    if (progressCaption) {
      if (litCount === 0) progressCaption.textContent = "Your little lights are waiting.";
      else if (litCount === diyaButtons.length) progressCaption.textContent = "Every little wish is glowing. Happy Diwali, Khushi!";
      else progressCaption.textContent = `${diyaButtons.length - litCount} little ${diyaButtons.length - litCount === 1 ? "light" : "lights"} left to glow.`;
    }
    return litCount;
  }

  function lightAllDiyas(shouldLight) {
    diyaButtons.forEach((button) => {
      button.classList.toggle("is-lit", shouldLight);
      button.setAttribute("aria-pressed", String(shouldLight));
      const quality = button.dataset.quality || "your wish";
      button.setAttribute("aria-label", `${shouldLight ? "Extinguish" : "Light"} the diya for ${quality}`);
    });
  }

  diyaButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const wasComplete = diyaButtons.every((item) => item.classList.contains("is-lit"));
      const shouldLight = !button.classList.contains("is-lit");
      button.classList.toggle("is-lit", shouldLight);
      button.setAttribute("aria-pressed", String(shouldLight));
      const quality = button.dataset.quality || "your wish";
      button.setAttribute("aria-label", `${shouldLight ? "Extinguish" : "Light"} the diya for ${quality}`);
      const nowComplete = updateDiyas() === diyaButtons.length;
      if (shouldLight) playChime();
      if (nowComplete && !wasComplete) {
        playFireworkSound();
        const centerY = Math.min(window.innerHeight * 0.35, 300);
        [0.28, 0.5, 0.72].forEach((part, index) => {
          window.setTimeout(() => burstAt(window.innerWidth * part, centerY + (index % 2 ? -20 : 16), 34), index * 100);
        });
      }
    });
  });

  if (lightAllButton) {
    lightAllButton.addEventListener("click", () => {
      const wasComplete = diyaButtons.every((button) => button.classList.contains("is-lit"));
      lightAllDiyas(!wasComplete);
      const nowComplete = updateDiyas() === diyaButtons.length;
      if (nowComplete) {
        playFireworkSound();
        [0.3, 0.5, 0.7].forEach((part, index) => {
          window.setTimeout(() => burstAt(window.innerWidth * part, Math.min(window.innerHeight * 0.35, 300), 38), index * 100);
        });
      } else if (wasComplete) {
        playChime();
      }
    });
  }
  updateDiyas();

  // The letter stays folded until Khushi chooses to open it.
  const letterToggle = document.querySelector("#letter-toggle");
  const letterContent = document.querySelector("#letter-content");
  const letterCard = document.querySelector("#letter-card");
  if (letterToggle && letterContent) {
    letterToggle.addEventListener("click", () => {
      const isOpen = letterToggle.getAttribute("aria-expanded") !== "true";
      letterToggle.setAttribute("aria-expanded", String(isOpen));
      letterContent.hidden = !isOpen;
      if (letterCard) letterCard.classList.toggle("is-open", isOpen);
      const label = letterToggle.querySelector(".button-label");
      if (label) label.textContent = isOpen ? "Fold your note" : "Unfold your note";
      if (isOpen) {
        playChime();
        burstNear(letterCard, 20, 70, -25);
      }
    });
  }

  // Assemble the rangoli petals from simple inline SVG shapes; no image downloads needed.
  const rangoliArt = document.querySelector("#rangoli-art");
  const petalGroup = document.querySelector("#rangoli-petals");
  const svgNamespace = "http://www.w3.org/2000/svg";

  if (petalGroup) {
    for (let index = 0; index < 12; index += 1) {
      const petal = document.createElementNS(svgNamespace, "path");
      petal.setAttribute("d", "M200 203 C170 177 166 126 200 82 C234 126 230 177 200 203Z");
      petal.setAttribute("transform", `rotate(${index * 30} 200 200)`);
      petal.setAttribute("class", `rangoli-petal petal-${["a", "b", "c"][index % 3]}`);
      petalGroup.appendChild(petal);
    }
    for (let index = 0; index < 8; index += 1) {
      const petal = document.createElementNS(svgNamespace, "path");
      petal.setAttribute("d", "M200 199 C184 185 183 163 200 140 C217 163 216 185 200 199Z");
      petal.setAttribute("transform", `rotate(${index * 45 + 22.5} 200 200)`);
      petal.setAttribute("class", `rangoli-petal petal-${["c", "a", "b"][index % 3]}`);
      petalGroup.appendChild(petal);
    }
  }

  const paletteOptions = Array.from(document.querySelectorAll(".palette-swatch"));
  const paletteStatus = document.querySelector("#palette-status");
  const bloomButton = document.querySelector("#bloom-button");
  const paletteValues = {
    sunset: { colors: ["#f2b95f", "#e57864", "#ca8ea7"], message: "Sunset colours, glowing softly." },
    lotus: { colors: ["#f3b1c5", "#bc8bc9", "#f0c77b"], message: "Lotus colours, soft as a wish." },
    garden: { colors: ["#a8bb86", "#dfad69", "#dd8872"], message: "Garden colours, fresh and bright." },
    twilight: { colors: ["#9c9cce", "#df9cb0", "#efc578"], message: "Twilight colours, made for the night." }
  };

  paletteOptions.forEach((option) => {
    option.addEventListener("click", () => {
      const palette = paletteValues[option.dataset.palette];
      if (!palette || !rangoliArt) return;
      paletteOptions.forEach((item) => {
        const selected = item === option;
        item.classList.toggle("is-selected", selected);
        item.setAttribute("aria-pressed", String(selected));
      });
      rangoliArt.style.setProperty("--rangoli-a", palette.colors[0]);
      rangoliArt.style.setProperty("--rangoli-b", palette.colors[1]);
      rangoliArt.style.setProperty("--rangoli-c", palette.colors[2]);
      if (paletteStatus) paletteStatus.textContent = palette.message;
      playChime();
    });
  });

  if (bloomButton && rangoliArt) {
    bloomButton.addEventListener("click", () => {
      rangoliArt.classList.remove("is-bloomed");
      // Force a fresh bloom animation on repeated presses.
      void rangoliArt.getBoundingClientRect();
      rangoliArt.classList.add("is-bloomed");
      if (paletteStatus) paletteStatus.textContent = "A new little bloom, just for you.";
      playChime();
      burstNear(rangoliArt, 28, 0, -8);
    });
  }

  // Each star unfolds a different small blessing.
  const fortuneCards = Array.from(document.querySelectorAll(".fortune-card"));
  fortuneCards.forEach((card) => {
    const reveal = card.querySelector(".fortune-reveal");
    const hint = card.querySelector(".fortune-hint");
    const hintText = hint ? hint.firstChild : null;
    card.addEventListener("click", () => {
      const isOpen = card.getAttribute("aria-expanded") !== "true";
      card.setAttribute("aria-expanded", String(isOpen));
      card.classList.toggle("is-open", isOpen);
      if (reveal) reveal.hidden = !isOpen;
      if (hintText && hintText.nodeType === Node.TEXT_NODE) hintText.textContent = isOpen ? "a wish for you " : "tap to uncover ";
      if (isOpen) {
        playChime();
        burstNear(card, 18, 22, -28);
      }
    });
  });

  // A final button sends a gentle, hand-drawn firework across the current view.
  const sparkleButton = document.querySelector("#sparkle-button");
  const sparkleResponse = document.querySelector("#sparkle-response");
  const sparkleMessages = [
    "A little brightness, headed your way.",
    "May your secret wish find its way to you.",
    "One sparkle for every lovely thing ahead.",
    "The night got a little brighter, Khushi."
  ];
  let sparkleMessageIndex = 0;

  if (sparkleButton) {
    sparkleButton.addEventListener("click", () => {
      const rect = sparkleButton.getBoundingClientRect();
      const x = rect.left + rect.width * 0.72;
      const y = Math.max(55, rect.top - 45);
      burstAt(x, y, 62);
      window.setTimeout(() => burstAt(x + 38, y - 22, 34), 120);
      playFireworkSound();
      if (sparkleResponse) {
        sparkleResponse.textContent = sparkleMessages[sparkleMessageIndex % sparkleMessages.length];
        sparkleMessageIndex += 1;
      }
    });
  }
})();
