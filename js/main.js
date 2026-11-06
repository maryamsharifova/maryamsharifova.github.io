// Load the saved theme before paint to prevent a flash of the wrong colors.
try {
  const savedTheme = localStorage.getItem("portfolio-theme");
  if (savedTheme === "light") {
    document.documentElement.dataset.theme = "light";
  }
} catch (error) {
  console.warn("Could not read the saved theme preference.", error);
}

document.addEventListener("DOMContentLoaded", () => {
  const themeToggles = document.querySelectorAll(".theme-toggle");

  // Keep each navigation theme button in sync with the selected theme.
  if (themeToggles.length > 0) {
    const updateToggleLabels = () => {
      const label = document.documentElement.dataset.theme === "light"
        ? "Switch to dark mode"
        : "Switch to light mode";

      themeToggles.forEach((themeToggle) => {
        themeToggle.setAttribute("aria-label", label);
        themeToggle.setAttribute("title", label);
      });
    };

    updateToggleLabels();

    // Let the header, hero, and floating navigation buttons share one theme setting.
    themeToggles.forEach((themeToggle) => {
      themeToggle.addEventListener("click", () => {
        const isLight = document.documentElement.dataset.theme !== "light";

        if (isLight) {
          document.documentElement.dataset.theme = "light";
        } else {
          delete document.documentElement.dataset.theme;
        }

        updateToggleLabels();

        try {
          localStorage.setItem("portfolio-theme", isLight ? "light" : "dark");
        } catch (error) {
          console.warn("Could not save the theme preference.", error);
        }
      });
    });
  }

  const laptopIntro = document.querySelector(".laptop-intro");
  if (!laptopIntro) {
    return;
  }

  const laptopStage = laptopIntro.querySelector(".laptop-stage");
  const laptopDive = laptopIntro.querySelector(".laptop-dive");
  const screenDisplay = laptopIntro.querySelector(".screen-display");
  const lockScreen = laptopIntro.querySelector(".lock-screen");
  const heroSection = document.querySelector(".portfolio-hero-section");
  const heroFrame = heroSection.querySelector(".portfolio-hero-frame");
  const heroCanvas = heroFrame.querySelector(".portfolio-hero");
  const floatingNav = document.querySelector(".floating-nav");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const typedPhrase = laptopIntro.querySelector(".typed-phrase");
  const lockDate = laptopIntro.querySelector(".lock-date");
  const lockTime = laptopIntro.querySelector(".lock-time");
  // These phrases appear one at a time in the intro's typing line.
  const phrases = [
    "secure enterprise data",
    "build local AI tools",
    "teach machines Azerbaijani",
    "turn logs into answers",
  ];
  let animationFrame = 0;
  let currentProgress = 0;
  let targetProgress = 0;
  let diveScale = 1;
  let diveX = 0;
  let diveY = 0;
  let typingTimer = 0;
  let phraseIndex = 0;
  let characterIndex = 0;
  let deleting = false;
  let keySequencePlayed = false;
  let keySequenceTimers = [];

  // Fill the lock screen's date and clock using the visitor's local time.
  const updateLockClock = () => {
    const now = new Date();
    lockDate.textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(now);
    lockTime.textContent = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(now);
  };

  // Give each of the 14 hex columns its own speed and starting offset.
  const createHexRain = () => {
    const rain = laptopIntro.querySelector(".hex-rain");
    const hexCharacters = "0123456789ABCDEF";

    for (let columnIndex = 0; columnIndex < 14; columnIndex += 1) {
      const column = document.createElement("span");
      const stream = document.createElement("span");
      const randomCode = Array.from(
        { length: 24 },
        () => hexCharacters[Math.floor(Math.random() * hexCharacters.length)],
      ).join("\n");
      const duration = 8 + Math.random() * 10;

      column.className = "hex-column";
      stream.className = "hex-stream";
      stream.textContent = `${randomCode}\n${randomCode}`;
      column.style.setProperty("--fall-duration", `${duration}s`);
      column.style.setProperty("--fall-delay", `${-Math.random() * duration}s`);
      column.append(stream);
      rain.append(column);
    }
  };

  // Stop any remaining presses and allow the sequence to run on the next opening.
  const resetKeySequence = () => {
    for (const timer of keySequenceTimers) {
      window.clearTimeout(timer);
    }

    keySequenceTimers = [];
    laptopIntro.querySelectorAll(".key.is-pressed").forEach((key) => {
      key.classList.remove("is-pressed");
    });
    keySequencePlayed = false;
  };

  // Type MARYAM on the keyboard once the lid is nearly fully open.
  const playKeySequence = () => {
    if (keySequencePlayed) {
      return;
    }

    keySequencePlayed = true;
    const letters = ["M", "A", "R", "Y", "A", "M"];

    letters.forEach((letter, index) => {
      const pressTimer = window.setTimeout(() => {
        laptopIntro.querySelectorAll(".key.is-pressed").forEach((key) => {
          key.classList.remove("is-pressed");
        });

        const key = laptopIntro.querySelector(`.key[data-letter="${letter}"]`);
        key.classList.add("is-pressed");

        const releaseTimer = window.setTimeout(() => {
          key.classList.remove("is-pressed");
        }, 130);
        keySequenceTimers.push(releaseTimer);
      }, index * 170);

      keySequenceTimers.push(pressTimer);
    });
  };

  // Keep animation inputs inside the 0-to-1 range.
  const clamp = (value) => Math.min(1, Math.max(0, value));

  // Convert a progress range into a 0-to-1 value.
  const progressBetween = (progress, start, end) => clamp((progress - start) / (end - start));

  // Ease in and out so camera movement does not start or stop abruptly.
  const easeInOut = (progress) => progress * progress * (3 - 2 * progress);

  // Convert the current page scroll into the 0-to-1 sticky intro timeline.
  const readScrollProgress = () => {
    const scrollDistance = laptopIntro.offsetHeight - laptopStage.offsetHeight;
    return scrollDistance > 0
      ? clamp(-laptopIntro.getBoundingClientRect().top / scrollDistance)
      : 0;
  };

  // Restore the screen window to normal page flow after the dive has passed.
  const showHeroInPage = () => {
    heroSection.classList.add("is-current");
    heroFrame.classList.remove("is-active", "is-fullscreen");
    heroFrame.style.removeProperty("position");
    heroFrame.style.removeProperty("left");
    heroFrame.style.removeProperty("top");
    heroFrame.style.removeProperty("width");
    heroFrame.style.removeProperty("height");
    heroFrame.style.removeProperty("border-radius");
    heroFrame.style.removeProperty("opacity");
    heroCanvas.style.removeProperty("--hero-fit-scale");
    // Reveal the nav after a short scroll while leaving room at the page bottom.
    floatingNav.classList.toggle(
      "is-visible",
      window.scrollY > heroSection.offsetTop + window.innerHeight * 0.08,
    );
  };

  // Measure the real screen and fit the undistorted hero inside its changing bounds.
  const updateHeroScene = (progress, diveProgress) => {
    const heroSectionTop = heroSection.getBoundingClientRect().top + window.scrollY;

    if (window.scrollY >= heroSectionTop) {
      showHeroInPage();
      return;
    }

    heroSection.classList.remove("is-current");
    floatingNav.classList.remove("is-visible");
    heroFrame.classList.add("is-active");
    heroFrame.classList.remove("is-fullscreen");
    heroFrame.style.position = "fixed";

    const screenRect = screenDisplay.getBoundingClientRect();
    const openingReveal = easeInOut(progressBetween(progress, 0.4, 0.5));
    const viewportRect = laptopStage.getBoundingClientRect();
    const centerX = viewportRect.left + viewportRect.width / 2;
    const centerY = viewportRect.top + viewportRect.height / 2;
    const baseCenterX = centerX + (
      screenRect.left + screenRect.width / 2 - centerX - diveX
    ) / diveScale;
    const baseCenterY = centerY + (
      screenRect.top + screenRect.height / 2 - centerY - diveY
    ) / diveScale;
    const finalScale = Math.max(
      window.innerWidth / (screenRect.width / diveScale),
      window.innerHeight / (screenRect.height / diveScale),
    );
    diveScale = 1 + (finalScale - 1) * diveProgress;
    diveX = centerX - (centerX + (baseCenterX - centerX) * diveScale);
    diveY = centerY - (centerY + (baseCenterY - centerY) * diveScale);
    laptopDive.style.setProperty("--dive-scale", `${diveScale}`);
    laptopDive.style.setProperty("--dive-x", `${diveX}px`);
    laptopDive.style.setProperty("--dive-y", `${diveY}px`);

    // Measure again after zooming so the clipped hero matches this exact frame.
    const alignedScreenRect = screenDisplay.getBoundingClientRect();
    const fitScale = Math.min(
      alignedScreenRect.width / window.innerWidth,
      alignedScreenRect.height / window.innerHeight,
    );
    const radius = Math.min(alignedScreenRect.width * 0.012, alignedScreenRect.height * 0.024);

    heroFrame.style.left = `${alignedScreenRect.left}px`;
    heroFrame.style.top = `${alignedScreenRect.top}px`;
    heroFrame.style.width = `${alignedScreenRect.width}px`;
    heroFrame.style.height = `${alignedScreenRect.height}px`;
    heroFrame.style.borderRadius = `${radius}px`;
    heroFrame.style.opacity = `${openingReveal}`;
    heroCanvas.style.setProperty("--hero-fit-scale", `${fitScale}`);
    lockScreen.style.opacity = `${1 - openingReveal}`;
    lockScreen.style.transform = `translateY(${-40 * openingReveal}%)`;

    // At the last intro frame, remove the hero mask and canvas transform completely.
    if (progress >= 0.999) {
      heroFrame.classList.add("is-fullscreen");
      heroFrame.style.removeProperty("left");
      heroFrame.style.removeProperty("top");
      heroFrame.style.removeProperty("width");
      heroFrame.style.removeProperty("height");
      heroFrame.style.removeProperty("border-radius");
      heroFrame.style.removeProperty("opacity");
      heroCanvas.style.removeProperty("--hero-fit-scale");
    }
  };

  // Add or remove one character, then pause or switch phrases as needed.
  const typeNextCharacter = () => {
    if (reducedMotion.matches) {
      typedPhrase.textContent = phrases[0];
      typingTimer = 0;
      return;
    }

    const phrase = phrases[phraseIndex];

    if (deleting) {
      characterIndex -= 1;
      typedPhrase.textContent = phrase.slice(0, characterIndex);

      if (characterIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }

      // Delete faster than typing, then pause briefly before the next phrase.
      typingTimer = window.setTimeout(typeNextCharacter, characterIndex === 0 ? 320 : 32);
      return;
    }

    characterIndex += 1;
    typedPhrase.textContent = phrase.slice(0, characterIndex);

    if (characterIndex === phrase.length) {
      deleting = true;
      // Keep each complete phrase on screen for 1.8 seconds.
      typingTimer = window.setTimeout(typeNextCharacter, 1800);
      return;
    }

    // Reveal the phrase one character at a time.
    typingTimer = window.setTimeout(typeNextCharacter, 58);
  };

  // Restart the typewriter, or show one complete phrase for reduced motion.
  const updateTypewriterMotion = () => {
    window.clearTimeout(typingTimer);

    if (reducedMotion.matches) {
      typedPhrase.textContent = phrases[0];
      return;
    }

    phraseIndex = 0;
    characterIndex = 0;
    deleting = false;
    typedPhrase.textContent = "";
    typingTimer = window.setTimeout(typeNextCharacter, 450);
  };

  // Smooth the scroll target, then update the laptop, screen, and homepage hero.
  const updateLaptop = () => {
    animationFrame = 0;
    targetProgress = readScrollProgress();
    // Move 10% of the remaining distance each frame so scroll changes glide.
    currentProgress += (targetProgress - currentProgress) * (reducedMotion.matches ? 1 : 0.1);
    if (Math.abs(targetProgress - currentProgress) < 0.0005) {
      currentProgress = targetProgress;
    }

    const progress = currentProgress;
    // Sweep the logo's reflective highlight during the first 16% of the intro scroll.
    const logoShimmerProgress = easeInOut(progressBetween(progress, 0, 0.16));
    // Open the lid from 16% to 44%, using smoothstep easing for gentle starts and stops.
    const openingProgress = progressBetween(progress, 0.16, 0.44);
    const opening = easeInOut(openingProgress);
    // Power the display from 60% to 90% open, and reveal keys from 35% to 85%.
    const screenPower = progressBetween(opening, 0.6, 0.9);
    const keyboardReveal = progressBetween(opening, 0.35, 0.85);
    // Fade the intro from 2% to 15% and the logo from 19% to 31%.
    // The desk glow begins halfway open and builds as the display powers on.
    const introFade = progressBetween(progress, 0.02, 0.15);
    const logoFade = progressBetween(progress, 0.19, 0.31);
    const deskGlow = progressBetween(opening, 0.5, 0.85);
    const diveProgress = easeInOut(progressBetween(progress, 0.58, 1));
    const laptopOpenScale = Number.parseFloat(
      window.getComputedStyle(laptopIntro).getPropertyValue("--laptop-open-scale"),
    );

    laptopIntro.style.setProperty("--camera-angle", `${-38 + 31 * opening}deg`);
    laptopIntro.style.setProperty("--laptop-scale", `${0.52 + (laptopOpenScale - 0.52) * opening}`);
    laptopIntro.style.setProperty("--lid-angle", `${-90 + 98 * opening}deg`);
    // Lift the closed laptop between the greeting and cue, then lower it into the open framing.
    laptopIntro.style.setProperty("--lid-lift", `${-27 + 22 * opening}vh`);
    laptopIntro.style.setProperty("--screen-power", screenPower);
    laptopIntro.style.setProperty("--keyboard-reveal", keyboardReveal);
    laptopIntro.style.setProperty("--logo-opacity", `${1 - logoFade}`);
    laptopIntro.style.setProperty("--logo-shimmer", `${100 - 220 * logoShimmerProgress}%`);
    laptopIntro.style.setProperty("--intro-opacity", `${1 - introFade}`);
    // Fade the desk and reflected screen glow away during the dive.
    laptopIntro.style.setProperty("--desk-glow-opacity", `${0.65 * deskGlow * (1 - diveProgress)}`);

    // Play the keys once above 90%; re-arm only after closing below 30%.
    if (opening < 0.3) {
      if (keySequencePlayed || keySequenceTimers.length > 0) {
        resetKeySequence();
      }
    } else if (opening > 0.9) {
      playKeySequence();
    }

    updateHeroScene(progress, diveProgress);

    // Keep measuring the screen while the smoothed position catches the real scroll.
    if (Math.abs(targetProgress - currentProgress) >= 0.0005) {
      animationFrame = window.requestAnimationFrame(updateLaptop);
    }
  };

  // Start or retarget the smoothing loop after scroll and resize events.
  const requestLaptopUpdate = () => {
    targetProgress = readScrollProgress();
    if (!animationFrame) {
      animationFrame = window.requestAnimationFrame(updateLaptop);
    }
  };

  window.addEventListener("scroll", requestLaptopUpdate, { passive: true });
  window.addEventListener("resize", requestLaptopUpdate);

  // Recheck both animations whenever the visitor changes motion preferences.
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", requestLaptopUpdate);
    reducedMotion.addEventListener("change", updateTypewriterMotion);
  } else {
    reducedMotion.addListener(requestLaptopUpdate);
    reducedMotion.addListener(updateTypewriterMotion);
  }

  // Start from the visitor's current scroll position instead of animating from zero.
  currentProgress = readScrollProgress();
  targetProgress = currentProgress;
  updateLockClock();
  // Refresh the displayed local time every 20 seconds.
  window.setInterval(updateLockClock, 20000);
  createHexRain();
  updateTypewriterMotion();
  requestLaptopUpdate();

});
