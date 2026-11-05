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
  const themeToggle = document.querySelector("#theme-toggle");

  // Keep the theme button label in sync with the current theme.
  if (themeToggle) {
    const updateToggleLabel = () => {
      const isLight = document.documentElement.dataset.theme === "light";
      const label = isLight ? "Switch to dark mode" : "Switch to light mode";
      themeToggle.setAttribute("aria-label", label);
      themeToggle.setAttribute("title", label);
    };

    updateToggleLabel();

    // Toggle the theme and remember the visitor's choice for next time.
    themeToggle.addEventListener("click", () => {
      const isLight = document.documentElement.dataset.theme !== "light";

      if (isLight) {
        document.documentElement.dataset.theme = "light";
      } else {
        delete document.documentElement.dataset.theme;
      }

      updateToggleLabel();

      try {
        localStorage.setItem("portfolio-theme", isLight ? "light" : "dark");
      } catch (error) {
        console.warn("Could not save the theme preference.", error);
      }
    });
  }

  const laptopIntro = document.querySelector(".laptop-intro");
  if (!laptopIntro) {
    return;
  }

  const laptopStage = laptopIntro.querySelector(".laptop-stage");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const typedPhrase = laptopIntro.querySelector(".typed-phrase");
  // These phrases appear one at a time in the intro's typing line.
  const phrases = [
    "secure enterprise data",
    "build local AI tools",
    "teach machines Azerbaijani",
    "turn logs into answers",
  ];
  const animatedProperties = [
    "--camera-angle",
    "--laptop-scale",
    "--lid-angle",
    "--lid-lift",
    "--logo-opacity",
    "--screen-reveal",
    "--logo-shimmer",
    "--intro-opacity",
    "--desk-glow-opacity",
  ];
  let animationFrame = 0;
  let typingTimer = 0;
  let phraseIndex = 0;
  let characterIndex = 0;
  let deleting = false;

  // Keep animation inputs inside the 0-to-1 range.
  const clamp = (value) => Math.min(1, Math.max(0, value));

  // Convert a progress range into a 0-to-1 value.
  const progressBetween = (progress, start, end) => clamp((progress - start) / (end - start));

  // Ease in and out so camera movement does not start or stop abruptly.
  const easeInOut = (progress) => progress * progress * (3 - 2 * progress);

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

  // Clear inline animation values so the CSS starting state can take over.
  const resetLaptop = () => {
    for (const property of animatedProperties) {
      laptopIntro.style.removeProperty(property);
    }
  };

  // Map the current scroll position to the laptop's camera and hinge angles.
  const updateLaptop = () => {
    animationFrame = 0;

    if (reducedMotion.matches) {
      resetLaptop();
      return;
    }

    const scrollDistance = laptopIntro.offsetHeight - laptopStage.offsetHeight;
    const progress = scrollDistance > 0
      ? clamp(-laptopIntro.getBoundingClientRect().top / scrollDistance)
      : 0;
    // Sweep the logo's reflective highlight during the first 16% of the intro scroll.
    const logoShimmerProgress = easeInOut(progressBetween(progress, 0, 0.16));
    // Open the lid from 16% to 44%, using smoothstep easing for gentle starts and stops.
    const openingProgress = progressBetween(progress, 0.16, 0.44);
    const opening = easeInOut(openingProgress);
    // Fade the intro from 2% to 15%, the logo from 19% to 31%, and light the screen by 44%.
    // The desk glow starts at 39% and reaches full strength at 52%.
    const introFade = progressBetween(progress, 0.02, 0.15);
    const logoFade = progressBetween(progress, 0.19, 0.31);
    const screenReveal = progressBetween(progress, 0.37, 0.44);
    const deskGlow = progressBetween(progress, 0.39, 0.52);
    const laptopOpenScale = Number.parseFloat(
      window.getComputedStyle(laptopIntro).getPropertyValue("--laptop-open-scale"),
    );

    laptopIntro.style.setProperty("--camera-angle", `${-38 + 31 * opening}deg`);
    laptopIntro.style.setProperty("--laptop-scale", `${0.52 + (laptopOpenScale - 0.52) * opening}`);
    laptopIntro.style.setProperty("--lid-angle", `${-90 + 98 * opening}deg`);
    // Lift the closed laptop between the greeting and cue, then lower it into the open framing.
    laptopIntro.style.setProperty("--lid-lift", `${-27 + 22 * opening}vh`);
    laptopIntro.style.setProperty("--logo-opacity", `${1 - logoFade}`);
    laptopIntro.style.setProperty("--screen-reveal", `${screenReveal * 100}%`);
    laptopIntro.style.setProperty("--logo-shimmer", `${100 - 220 * logoShimmerProgress}%`);
    laptopIntro.style.setProperty("--intro-opacity", `${1 - introFade}`);
    laptopIntro.style.setProperty("--desk-glow-opacity", `${0.65 * deskGlow}`);
  };

  // Use one animation frame for any burst of scroll or resize events.
  const requestLaptopUpdate = () => {
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

  updateTypewriterMotion();
  requestLaptopUpdate();
});
