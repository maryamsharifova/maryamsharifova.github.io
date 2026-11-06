// Load the saved theme before paint to prevent a flash of the wrong colors.
try {
  const savedTheme = localStorage.getItem("portfolio-theme");
  if (savedTheme === "light") {
    document.documentElement.dataset.theme = "light";
  }
} catch (error) {
  console.warn("Could not read the saved theme preference.", error);
}

// Remember whether this visit came from scrolling forward or back, then clear it.
let portfolioEnter = "start";
try {
  portfolioEnter = sessionStorage.getItem("portfolio-enter") || "start";
  if (sessionStorage.getItem("portfolio-travel") === "back") {
    document.documentElement.dataset.travel = "back";
  }
  sessionStorage.removeItem("portfolio-enter");
  sessionStorage.removeItem("portfolio-travel");
} catch (error) {
  console.warn("Could not read the saved page direction.", error);
}

// The browser must not restore an old scroll position over the one chosen below.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

const openedAtEnd = portfolioEnter === "end" && !window.location.hash;
// The project track reads this while it is measuring, before the scroll listeners exist.
window.portfolioEnter = openedAtEnd ? "end" : "start";

// Forward visits start at the top. Back visits wait until the body has a height.
if (!openedAtEnd && !window.location.hash) {
  window.scrollTo(0, 0);
}

// Put a back-visit on the previous ending before the transition captures the page.
const placePageEntry = () => {
  if (!openedAtEnd) {
    if (!window.location.hash) window.scrollTo(0, 0);
    return;
  }

  // Projects lands on the last card once that track has been measured.
  if (document.querySelector(".projects-page")) return;

  const hero = document.querySelector(".portfolio-hero-section");
  if (hero) {
    window.scrollTo(0, hero.offsetTop);
    return;
  }

  window.scrollTo(0, document.documentElement.scrollHeight);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", placePageEntry);
} else {
  placePageEntry();
}
window.addEventListener("pagereveal", placePageEntry);

// Warm the neighbouring pages so a scroll at either edge can switch without a blank wait.
const portfolioPages = ["index.html", "about.html", "projects.html", "resume.html", "contact.html"];
const portfolioFile = window.location.pathname.split("/").pop();
const currentPortfolioPage = portfolioFile && portfolioFile.endsWith(".html") ? portfolioFile : "index.html";
const portfolioIndex = portfolioPages.indexOf(currentPortfolioPage);
const warmPortfolioPages = [portfolioPages[portfolioIndex - 1], portfolioPages[portfolioIndex + 1]].filter(Boolean);

if (warmPortfolioPages.length > 0 && document.head) {
  warmPortfolioPages.forEach((page) => {
    const prefetch = document.createElement("link");
    prefetch.rel = "prefetch";
    prefetch.href = page;
    document.head.append(prefetch);
  });

  // Chromium can prerender from these rules. Other browsers keep the links above.
  const speculation = document.createElement("script");
  speculation.type = "speculationrules";
  speculation.textContent = JSON.stringify({
    prerender: [{ urls: warmPortfolioPages, eagerness: "immediate" }],
    prefetch: [{ urls: warmPortfolioPages, eagerness: "immediate" }],
  });
  document.head.append(speculation);
}

document.addEventListener("DOMContentLoaded", () => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // Bind theme controls after the shared floating navigation has been created.
  const initializeThemeToggles = () => {
    const themeToggles = document.querySelectorAll(".theme-toggle");
    const updateToggleLabels = () => {
      const label = document.documentElement.dataset.theme === "light"
        ? "Switch to dark mode"
        : "Switch to light mode";

      themeToggles.forEach((themeToggle) => {
        themeToggle.setAttribute("aria-label", label);
        themeToggle.setAttribute("title", label);
      });
    };

    themeToggles.forEach((themeToggle) => {
      updateToggleLabels();
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
    updateToggleLabels();
  };

  // Create the shared UI here so every page can use it without repeated markup.
  const createSharedUi = () => {
    const rail = document.createElement("nav");
    rail.className = "page-rail";
    rail.setAttribute("aria-label", "Page shortcuts");
    const pages = [
      ["Home", "index.html"],
      ["About", "about.html"],
      ["Projects", "projects.html"],
      ["Resume", "resume.html"],
      ["Contact", "contact.html"],
    ];
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    pages.forEach(([label, href]) => {
      const link = document.createElement("a");
      link.href = href;
      link.setAttribute("aria-label", label);
      link.title = label;
      if (currentPage === href) {
        link.setAttribute("aria-current", "page");
      }
      rail.append(link);
    });

    // Sun and moon drawings live here so the hidden page header is no longer needed.
    const themeIconMarkup = `
      <svg class="sun-icon" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <circle cx="12" cy="12" r="4"></circle>
        <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path>
      </svg>
      <svg class="moon-icon" aria-hidden="true" viewBox="0 0 24 24" focusable="false">
        <path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.5 8.5 0 1 0 20.2 15.4Z"></path>
      </svg>
    `;

    const floatingNav = document.querySelector(".floating-nav") || document.createElement("nav");
    if (!floatingNav.classList.contains("floating-nav")) {
      floatingNav.className = "floating-nav";
      floatingNav.setAttribute("aria-label", "Main navigation");
      pages.forEach(([label, href]) => {
        const link = document.createElement("a");
        link.href = href;
        link.textContent = label;
        floatingNav.append(link);
      });

      const toggle = document.createElement("button");
      toggle.className = "theme-toggle floating-theme-toggle";
      toggle.type = "button";
      toggle.setAttribute("aria-label", "Switch to light mode");
      toggle.setAttribute("title", "Switch to light mode");
      toggle.innerHTML = themeIconMarkup;
      floatingNav.append(toggle);
      document.body.append(floatingNav);
    }

    floatingNav.querySelectorAll("a").forEach((link) => {
      if (link.getAttribute("href") === currentPage) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    // Keep the floating theme button on the same sun and moon artwork as the hero.
    floatingNav.querySelectorAll(".theme-toggle").forEach((toggle) => {
      toggle.innerHTML = themeIconMarkup;
    });

    const toastArea = document.createElement("div");
    toastArea.className = "toast-area";
    toastArea.setAttribute("aria-live", "polite");
    toastArea.setAttribute("aria-atomic", "false");
    toastArea.setAttribute("aria-label", "Notifications");

    document.body.append(rail, toastArea);

    // Keep brief confirmations available to page-specific controls.
    const showToast = (message) => {
      const toast = document.createElement("p");
      toast.className = "site-toast";
      toast.textContent = message;
      toastArea.append(toast);
      window.setTimeout(() => toast.classList.add("is-visible"), 10);
      window.setTimeout(() => {
        toast.classList.remove("is-visible");
        window.setTimeout(() => toast.remove(), 220);
      }, 3000);
    };

    window.showPortfolioToast = showToast;
    window.addEventListener("portfolio:toast", (event) => {
      if (typeof event.detail?.message === "string") {
        showToast(event.detail.message);
      }
    });

    // Reveal the right-edge page links only after the laptop hero reaches the page.
    const heroSection = document.querySelector(".portfolio-hero-section");
    if (heroSection) {
      const revealRail = () => rail.classList.toggle("is-visible", heroSection.classList.contains("is-current"));
      new MutationObserver(revealRail).observe(heroSection, { attributes: true, attributeFilter: ["class"] });
      revealRail();
      // Keep the Home pill hidden until the laptop dive reaches the full hero.
      const revealHomeNav = () => floatingNav.classList.toggle(
        "is-visible",
        heroSection.classList.contains("is-current")
          && window.scrollY > heroSection.offsetTop + window.innerHeight * 0.08,
      );
      new MutationObserver(revealHomeNav).observe(heroSection, { attributes: true, attributeFilter: ["class"] });
      window.addEventListener("scroll", revealHomeNav, { passive: true });
      revealHomeNav();
    } else {
      floatingNav.classList.add("is-visible");
      rail.classList.add("is-visible");
    }

  };

  createSharedUi();
  initializeThemeToggles();

  // Fade, unblur, and lift page content once it enters the viewport.
  const initializeScrollReveals = () => {
    // Skip the closing laptop. A transform or blur on that section would break its sticky pin.
    const revealItems = new Set(document.querySelectorAll("[data-reveal], .page-content > *:not(.thanks-scroll)"));
    document.querySelectorAll("[data-reveal], .page-content > * > [data-reveal]").forEach((item) => revealItems.add(item));

    const revealGroups = new Map();
    revealItems.forEach((item) => {
      item.classList.add("reveal-on-scroll");
      const parent = item.parentElement;
      const siblings = revealGroups.get(parent) || [];
      siblings.push(item);
      revealGroups.set(parent, siblings);
    });

    revealGroups.forEach((siblings) => {
      siblings.forEach((item, index) => {
        item.style.setProperty("--reveal-delay", `${index * 120}ms`);
      });
    });

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
    reducedMotion.addEventListener?.("change", () => {
      if (reducedMotion.matches) {
        revealItems.forEach((item) => item.classList.add("is-revealed"));
      }
    });
  };

  initializeScrollReveals();

  // Let card spotlights follow the pointer without changing each card's content.
  document.querySelectorAll(".spotlight-card, .card, .project-card, [data-spotlight]").forEach((card) => {
    card.classList.add("spotlight-card");
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      card.style.setProperty("--spot-x", `${event.clientX - bounds.left}px`);
      card.style.setProperty("--spot-y", `${event.clientY - bounds.top}px`);
    });
  });

  // Build small project demos and wire the case-study detail windows.
  const initializeProjectPage = () => {
    const projectPage = document.querySelector(".projects-page");
    if (!projectPage) return;

    const trackSection = projectPage.querySelector(".projects-track");
    const stickyTrack = projectPage.querySelector(".projects-pin");
    const projectList = projectPage.querySelector(".project-list");
    const cards = [...projectPage.querySelectorAll(".project-card")];
    const progressCount = projectPage.querySelector(".project-progress-count");
    const progressBar = projectPage.querySelector(".project-progress-bar > span");
    let horizontalTrackEnabled = false;
    let trackDistance = 0;
    let trackStart = 0;
    let targetProgress = 0;
    let displayedProgress = 0;
    let trackAnimationFrame = 0;

    // Pin the project list only on wide screens when motion is allowed.
    const updateHorizontalTrack = () => {
      horizontalTrackEnabled = window.matchMedia("(min-width: 861px)").matches && !reducedMotion.matches;
      projectPage.classList.toggle("has-horizontal-scroll", horizontalTrackEnabled);
      if (!horizontalTrackEnabled) {
        trackSection.style.height = "";
        projectList.style.transform = "";
        displayedProgress = 0;
        targetProgress = 0;
        // A stacked list has no sideways track, so the next page can arm at the footer.
        projectPage.dataset.trackDone = "1";
        if (window.portfolioEnter === "end") {
          window.portfolioEnter = "start";
          window.scrollTo(0, document.documentElement.scrollHeight);
        }
        return;
      }

      trackDistance = Math.max(0, projectList.scrollWidth - stickyTrack.clientWidth);
      trackSection.style.height = `${window.innerHeight + trackDistance}px`;
      trackStart = trackSection.getBoundingClientRect().top + window.scrollY;
      targetProgress = Math.min(1, Math.max(0, (window.scrollY - trackStart) / Math.max(1, trackDistance)));
      displayedProgress = targetProgress;
      // A back-visit opens on the last card instead of sliding there from the first.
      if (window.portfolioEnter === "end") {
        window.portfolioEnter = "start";
        window.scrollTo(0, trackStart + trackDistance);
        targetProgress = 1;
        displayedProgress = 1;
      }
      renderHorizontalTrack();
    };

    // Ease toward the actual scroll position instead of snapping between cards.
    const renderHorizontalTrack = () => {
      projectList.style.transform = `translate3d(${-trackDistance * displayedProgress}px, 0, 0)`;
      const currentCard = Math.min(cards.length, Math.max(1, Math.round(displayedProgress * (cards.length - 1)) + 1));
      progressCount.textContent = `${String(currentCard).padStart(2, "0")} ——— ${String(cards.length).padStart(2, "0")}`;
      progressCount.parentElement.setAttribute("aria-label", `Project ${currentCard} of ${cards.length}`);
      progressBar.style.transform = `scaleX(${displayedProgress})`;
      // The next page only arms once the last card has slid into place.
      projectPage.dataset.trackDone = displayedProgress >= 0.985 ? "1" : "0";
    };

    const animateHorizontalTrack = () => {
      trackAnimationFrame = 0;
      if (!horizontalTrackEnabled) return;
      displayedProgress += (targetProgress - displayedProgress) * 0.1;
      if (Math.abs(targetProgress - displayedProgress) < 0.001) displayedProgress = targetProgress;
      renderHorizontalTrack();
      if (displayedProgress !== targetProgress) {
        trackAnimationFrame = window.requestAnimationFrame(animateHorizontalTrack);
      }
    };

    const updateTrackTarget = () => {
      if (!horizontalTrackEnabled) return;
      targetProgress = Math.min(1, Math.max(0, (window.scrollY - trackStart) / Math.max(1, trackDistance)));
      if (!trackAnimationFrame) trackAnimationFrame = window.requestAnimationFrame(animateHorizontalTrack);
    };

    updateHorizontalTrack();
    window.addEventListener("scroll", updateTrackTarget, { passive: true });
    window.addEventListener("resize", updateHorizontalTrack);
    reducedMotion.addEventListener?.("change", updateHorizontalTrack);

    // Generate a varied waveform without relying on an external image or library.
    projectPage.querySelectorAll(".waveform-bars").forEach((waveform) => {
      for (let index = 0; index < 38; index += 1) {
        const bar = document.createElement("span");
        const height = 14 + Math.random() * 82;
        bar.style.height = `${height}px`;
        bar.style.setProperty("--bar-delay", `${-Math.random() * 950}ms`);
        waveform.append(bar);
      }
    });

    // Add a real project photo only when its file exists; the custom visual remains otherwise.
    const photoFiles = ["speech-api.jpg", "chatbot.png", "agrohub-leaf.jpg", "logic-gates.jpg", "hour-of-ai.jpg", "ev3-robot.jpg"];
    cards.forEach((card, index) => {
      card.classList.add("is-revealed");
      const photoPath = `images/projects/${photoFiles[index]}`;
      fetch(photoPath, { method: "HEAD" }).then((response) => {
        if (!response.ok) return;
        const image = document.createElement("img");
        image.className = "project-photo";
        image.src = photoPath;
        image.alt = `${card.querySelector("h2").textContent} project photo`;
        card.querySelector(".project-visual").append(image);
      }).catch((error) => {
        console.warn(`Could not check for project photo ${photoPath}.`, error);
      });
    });

    // Rebuild the truth table and LED output for the selected inputs and gate.
    const circuit = projectPage.querySelector("[data-circuit]");
    if (circuit) {
      const inputValues = { a: 0, b: 0 };
      const inputButtons = [...circuit.querySelectorAll("[data-input]")];
      const gateSelect = circuit.querySelector(".gate-select");
      const tableBody = circuit.querySelector(".truth-table tbody");
      const bColumn = circuit.querySelector("[data-b-column]");
      const led = circuit.querySelector(".circuit-led");
      const calculateOutput = (gate, a, b) => {
        if (gate === "NOT") return Number(!a);
        if (gate === "OR") return Number(Boolean(a || b));
        return Number(Boolean(a && b));
      };

      const updateCircuit = () => {
        const gate = gateSelect.value;
        const currentOutput = calculateOutput(gate, inputValues.a, inputValues.b);
        const isNotGate = gate === "NOT";
        const rows = isNotGate
          ? [[0, null], [1, null]]
          : [[0, 0], [0, 1], [1, 0], [1, 1]];

        inputButtons.forEach((button) => {
          const inputName = button.dataset.input;
          button.querySelector("span").textContent = String(inputValues[inputName]);
          button.setAttribute("aria-pressed", String(Boolean(inputValues[inputName])));
          button.disabled = isNotGate && inputName === "b";
        });
        bColumn.hidden = isNotGate;
        led.classList.toggle("is-on", currentOutput === 1);
        led.querySelector("strong").textContent = String(currentOutput);
        tableBody.replaceChildren();

        rows.forEach(([a, b]) => {
          const outputValue = calculateOutput(gate, a, b ?? 0);
          const row = document.createElement("tr");
          const isCurrentRow = isNotGate
            ? a === inputValues.a
            : a === inputValues.a && b === inputValues.b;
          if (isCurrentRow) row.classList.add("is-current");

          [a, ...(isNotGate ? [] : [b]), outputValue].forEach((value) => {
            const cell = document.createElement("td");
            cell.textContent = String(value);
            row.append(cell);
          });
          tableBody.append(row);
        });
      };

      inputButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const inputName = button.dataset.input;
          inputValues[inputName] = Number(!inputValues[inputName]);
          updateCircuit();
        });
      });
      gateSelect.addEventListener("change", updateCircuit);
      updateCircuit();
    }

    // The titlebar path keeps each project window grounded in a familiar file layout.
    const dialog = document.querySelector(".project-dialog");
    if (dialog) {
      const dialogLabel = dialog.querySelector(".project-dialog-label");
      const dialogTitle = dialog.querySelector("#project-dialog-title");
      const dialogDescription = dialog.querySelector(".project-dialog-description");
      const dialogTags = dialog.querySelector(".project-dialog-tags");
      const dialogPath = dialog.querySelector(".project-window-path");
      const dialogVisual = dialog.querySelector(".project-window-visual");
      const dialogHighlights = dialog.querySelector(".project-dialog-highlights");
      const projectSlugs = ["speech-to-text", "local-llm-chatbot", "plant-health-agrohub", "logic-gates", "hour-of-ai", "lego-ev3-robot"];
      const highlights = [
        ["Benchmarked five Hugging Face models on a real Azerbaijani phone call.", "Compared WAV and MP4 audio inputs.", "SeamlessM4T v2 produced the most accurate transcript.", "Built a Python REST endpoint with FFmpeg conversion.", "Traced output differences to missing decoding parameters."],
        ["Ran a Llama model locally with LM Studio.", "Connected the assistant to Telegram and WhatsApp.", "Added MCP tools for connected workflows.", "Embedded the chatbot into a website I built."],
        ["Compared more than ten plant-health APIs.", "Reviewed Kindwise, Plantix, and Agrio.", "Tested crops grown in Azerbaijan.", "Recommended Kindwise for crop and disease identification.", "Returned confidence scores and treatment advice as JSON."],
        ["Built AND, OR, and NOT gates with a team.", "Used transistors and resistors on a breadboard.", "Read inputs with push buttons.", "Displayed each gate output with an LED."],
        ["Taught a one-hour AI and coding lesson as a team.", "Used Microsoft MakeCode block programming.", "Helped children build and run their own program.", "Each participant earned a certificate."],
        ["Built a LEGO Mindstorms EV3 robot in ADA's MakerSpace.", "Programmed the robot with MakeCode blocks and JavaScript.", "Followed a predefined track autonomously.", "Used the gyro sensor for accurate turns."],
      ];

      const openProjectWindow = (card, pointerX, pointerY) => {
        const projectIndex = cards.indexOf(card);
        const cardBounds = card.getBoundingClientRect();
        dialogLabel.textContent = card.querySelector(".project-label").textContent;
        dialogTitle.textContent = card.querySelector("h2").textContent;
        dialogDescription.textContent = card.querySelector(".project-copy > p:not(.project-label)").textContent;
        dialogPath.textContent = `~/projects/${projectSlugs[projectIndex]}`;
        dialogTags.replaceChildren();
        card.querySelectorAll(".project-tags li").forEach((tag) => {
          const item = document.createElement("li");
          item.textContent = tag.textContent;
          dialogTags.append(item);
        });
        dialogHighlights.replaceChildren();
        highlights[projectIndex].forEach((text) => {
          const item = document.createElement("li");
          item.textContent = text;
          dialogHighlights.append(item);
        });

        const visualCopy = card.querySelector(".project-visual").cloneNode(true);
        const ids = new Map();
        visualCopy.querySelectorAll("[id]").forEach((element) => {
          const oldId = element.id;
          const newId = `${oldId}-window`;
          ids.set(oldId, newId);
          element.id = newId;
        });
        [visualCopy, ...visualCopy.querySelectorAll("*")].forEach((element) => {
          [...element.attributes].forEach((attribute) => {
            let value = attribute.value.replace(/url\(#([^)]+)\)/g, (match, id) => `url(#${ids.get(id) || id})`);
            if (value.startsWith("#") && ids.has(value.slice(1))) value = `#${ids.get(value.slice(1))}`;
            element.setAttribute(attribute.name, value);
          });
        });
        dialogVisual.replaceChildren(visualCopy);
        dialog.showModal();
        // Hide the custom cursor while the window is open; the system pointer takes over.
        document.body.classList.add("project-dialog-open");
        const windowBounds = dialog.getBoundingClientRect();
        const originX = Number.isFinite(pointerX) ? pointerX : cardBounds.left + cardBounds.width / 2;
        const originY = Number.isFinite(pointerY) ? pointerY : cardBounds.top + cardBounds.height / 2;
        dialog.style.setProperty("--dialog-origin", `${originX - windowBounds.left}px ${originY - windowBounds.top}px`);
      };

      projectPage.querySelectorAll(".project-open-button").forEach((button) => {
        button.dataset.magnetic = "";
        button.addEventListener("click", (event) => {
          openProjectWindow(button.closest(".project-card"), event.clientX, event.clientY);
        });
      });

      cards.forEach((card) => {
        card.addEventListener("click", (event) => {
          if (event.target.closest("button, a, input, select, textarea")) return;
          openProjectWindow(card, event.clientX, event.clientY);
        });
        card.addEventListener("keydown", (event) => {
          if (event.target === card && event.key === "Enter") {
            event.preventDefault();
            openProjectWindow(card);
          }
        });
        card.addEventListener("pointermove", (event) => {
          const bounds = card.getBoundingClientRect();
          const tiltX = ((event.clientY - bounds.top) / bounds.height - 0.5) * -6;
          const tiltY = ((event.clientX - bounds.left) / bounds.width - 0.5) * 6;
          card.style.setProperty("--card-tilt-x", `${tiltX}deg`);
          card.style.setProperty("--card-tilt-y", `${tiltY}deg`);
        });
        card.addEventListener("pointerleave", () => {
          card.style.setProperty("--card-tilt-x", "0deg");
          card.style.setProperty("--card-tilt-y", "0deg");
        });
      });

      dialog.querySelector(".project-dialog-close").addEventListener("click", () => dialog.close());
      dialog.addEventListener("close", () => document.body.classList.remove("project-dialog-open"));
      // A click on the dimmed page, outside the window, closes it.
      dialog.addEventListener("click", (event) => {
        const bounds = dialog.getBoundingClientRect();
        const insideWindow = event.clientX >= bounds.left && event.clientX <= bounds.right
          && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
        if (!insideWindow) dialog.close();
      });
      // Escape closes the window even if the browser's built-in dialog shortcut is cancelled.
      dialog.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && dialog.open) {
          event.preventDefault();
          dialog.close();
        }
      });

      // Direct project links scroll to the requested stop and open its window.
      const requestedProject = document.getElementById(window.location.hash.slice(1));
      if (requestedProject?.matches(".project-card")) {
        window.setTimeout(() => {
          let requestedScrollY = 0;
          if (horizontalTrackEnabled) {
            const requestedDistance = Math.min(trackDistance, requestedProject.offsetLeft - projectList.offsetLeft);
            requestedScrollY = trackStart + requestedDistance;
            targetProgress = requestedDistance / Math.max(1, trackDistance);
            displayedProgress = targetProgress;
            renderHorizontalTrack();
          } else {
            requestedProject.scrollIntoView({ block: "start" });
          }
          openProjectWindow(requestedProject);
          if (horizontalTrackEnabled) {
            window.setTimeout(() => {
              window.scrollTo(0, requestedScrollY);
              targetProgress = Math.min(1, Math.max(0, (window.scrollY - trackStart) / Math.max(1, trackDistance)));
              displayedProgress = targetProgress;
              renderHorizontalTrack();
            }, 120);
          }
        }, 120);
      }
    }
  };

  initializeProjectPage();

  // Desktop cursor dot follows directly; its larger ring eases toward the pointer.
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  if (finePointer.matches && !reducedMotion.matches) {
    const cursorDot = document.createElement("span");
    const cursorRing = document.createElement("span");
    cursorDot.className = "custom-cursor-dot";
    cursorRing.className = "custom-cursor-ring";
    cursorDot.setAttribute("aria-hidden", "true");
    cursorRing.setAttribute("aria-hidden", "true");
    document.body.append(cursorDot, cursorRing);
    document.body.classList.add("has-custom-cursor");

    let pointerX = -100;
    let pointerY = -100;
    let ringX = pointerX;
    let ringY = pointerY;
    let cursorAnimation = 0;
    const followCursor = () => {
      cursorAnimation = 0;
      ringX += (pointerX - ringX) * (reducedMotion.matches ? 1 : 0.18);
      ringY += (pointerY - ringY) * (reducedMotion.matches ? 1 : 0.18);
      cursorRing.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      if (Math.abs(pointerX - ringX) > 0.2 || Math.abs(pointerY - ringY) > 0.2) {
        cursorAnimation = window.requestAnimationFrame(followCursor);
      }
    };

    document.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      cursorDot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`;
      cursorDot.classList.add("is-visible");
      cursorRing.classList.add("is-visible");
      if (!cursorAnimation) {
        cursorAnimation = window.requestAnimationFrame(followCursor);
      }
    });
    document.addEventListener("pointerover", (event) => {
      const interactive = event.target.closest("a, button, [role='button'], .spotlight-card");
      cursorRing.classList.toggle("is-interactive", Boolean(interactive));
    });

    // Magnetic controls move a small fraction of the pointer distance, then spring back.
    if (!reducedMotion.matches) {
      document.querySelectorAll(".hero-button, [data-magnetic]").forEach((button) => {
        button.addEventListener("pointermove", (event) => {
          const bounds = button.getBoundingClientRect();
          const x = event.clientX - bounds.left - bounds.width / 2;
          const y = event.clientY - bounds.top - bounds.height / 2;
          button.style.setProperty("--magnetic-x", `${x * 0.25}px`);
          button.style.setProperty("--magnetic-y", `${y * 0.35}px`);
        });
        button.addEventListener("pointerleave", () => {
          button.style.setProperty("--magnetic-x", "0px");
          button.style.setProperty("--magnetic-y", "0px");
        });
      });
    }
  }

  // Add the home-only particle canvas and orbit response.
  const particleHero = document.querySelector(".portfolio-hero");
  if (particleHero) {
    const particles = document.createElement("canvas");
    particles.className = "hero-particles";
    particles.setAttribute("aria-hidden", "true");
    particleHero.prepend(particles);
    const context = particles.getContext("2d");
    const portrait = particleHero.querySelector(".hero-portrait");
    let particleList = [];
    let canvasWidth = 0;
    let canvasHeight = 0;
    let pointer = { x: -1000, y: -1000 };
    let animationId = 0;
    let heroIsVisible = false;

    const resizeCanvas = () => {
      const bounds = particles.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvasWidth = particles.clientWidth;
      canvasHeight = particles.clientHeight;
      particles.width = Math.round(canvasWidth * ratio);
      particles.height = Math.round(canvasHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(90, Math.max(12, Math.floor((canvasWidth * canvasHeight) / 16000)));
      particleList = Array.from({ length: count }, () => ({
        x: Math.random() * canvasWidth,
        y: Math.random() * canvasHeight,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        radius: 0.8 + Math.random() * 0.9,
      }));
      if (!bounds.width || !bounds.height) {
        particleList = [];
      }
    };

    const stopParticles = () => {
      window.cancelAnimationFrame(animationId);
      animationId = 0;
    };

    const drawParticles = () => {
      animationId = 0;
      if (!heroIsVisible || reducedMotion.matches || document.hidden) {
        return;
      }

      const color = getComputedStyle(particleHero).getPropertyValue("--particle-color").trim();
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      particleList.forEach((dot, index) => {
        const dx = pointer.x - dot.x;
        const dy = pointer.y - dot.y;
        const cursorDistance = Math.hypot(dx, dy);
        if (cursorDistance < 180 && cursorDistance > 0) {
          dot.vx += (dx / cursorDistance) * 0.004;
          dot.vy += (dy / cursorDistance) * 0.004;
        }
        dot.vx *= 0.995;
        dot.vy *= 0.995;
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (dot.x < 0) dot.x = canvasWidth;
        if (dot.x > canvasWidth) dot.x = 0;
        if (dot.y < 0) dot.y = canvasHeight;
        if (dot.y > canvasHeight) dot.y = 0;

        for (let otherIndex = index + 1; otherIndex < particleList.length; otherIndex += 1) {
          const other = particleList[otherIndex];
          const distance = Math.hypot(dot.x - other.x, dot.y - other.y);
          if (distance < 140) {
            context.strokeStyle = color;
            context.globalAlpha = (1 - distance / 140) * 0.22;
            context.lineWidth = 0.6;
            context.beginPath();
            context.moveTo(dot.x, dot.y);
            context.lineTo(other.x, other.y);
            context.stroke();
          }
        }

        const nearCursor = cursorDistance < 180;
        context.globalAlpha = nearCursor ? 0.9 : 0.55;
        context.fillStyle = color;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius + (nearCursor ? 0.8 : 0), 0, Math.PI * 2);
        context.fill();
        if (nearCursor) {
          context.globalAlpha = (1 - cursorDistance / 180) * 0.5;
          context.beginPath();
          context.moveTo(dot.x, dot.y);
          context.lineTo(pointer.x, pointer.y);
          context.stroke();
        }
      });
      context.globalAlpha = 1;
      animationId = window.requestAnimationFrame(drawParticles);
    };

    const startParticles = () => {
      if (heroIsVisible && !reducedMotion.matches && !document.hidden && !animationId) {
        animationId = window.requestAnimationFrame(drawParticles);
      }
    };

    if (context) {
      resizeCanvas();
      const visibilityObserver = new IntersectionObserver((entries) => {
        heroIsVisible = entries.some((entry) => entry.isIntersecting);
        if (heroIsVisible) startParticles();
        else stopParticles();
      });
      visibilityObserver.observe(particleHero);
      window.addEventListener("resize", resizeCanvas);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) stopParticles();
        else startParticles();
      });
      const updateParticleMotion = () => {
        if (reducedMotion.matches) stopParticles();
        else startParticles();
      };
      if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", updateParticleMotion);
      } else {
        reducedMotion.addListener(updateParticleMotion);
      }
      particleHero.addEventListener("pointermove", (event) => {
        if (reducedMotion.matches) return;
        const bounds = particles.getBoundingClientRect();
        pointer = {
          x: ((event.clientX - bounds.left) / bounds.width) * canvasWidth,
          y: ((event.clientY - bounds.top) / bounds.height) * canvasHeight,
        };
        const orbit = portrait.getBoundingClientRect();
        const relativeX = (event.clientX - orbit.left) / orbit.width - 0.5;
        const relativeY = (event.clientY - orbit.top) / orbit.height - 0.5;
        const distance = Math.min(1, Math.hypot(relativeX, relativeY) * 2);
        portrait.style.setProperty("--orbit-tilt-x", `${-relativeY * 30}deg`);
        portrait.style.setProperty("--orbit-tilt-y", `${relativeX * 30}deg`);
        portrait.style.setProperty("--portrait-glow-opacity", `${(1 - distance) * 0.4}`);
      });
      particleHero.addEventListener("pointerleave", () => {
        pointer = { x: -1000, y: -1000 };
        portrait.style.setProperty("--orbit-tilt-x", "0deg");
        portrait.style.setProperty("--orbit-tilt-y", "0deg");
        portrait.style.setProperty("--portrait-glow-opacity", "0");
      });
    }
  }

  // Run a small fixed command set; terminal input is displayed, never executed.
  const initializeAboutTerminal = () => {
    const terminal = document.querySelector(".terminal-card");
    if (!terminal) return;

    const output = terminal.querySelector(".terminal-output");
    const form = terminal.querySelector(".terminal-form");
    const input = terminal.querySelector("#terminal-input");
    const history = [];
    let historyIndex = 0;
    const projectNames = [
      "Speech-to-text API for Azerbaijani",
      "Local LLM chatbot",
      "Plant-health vision for Agrohub",
      "Logic gates",
      "Hour of AI",
      "Line-following robot with LEGO EV3",
    ];
    const whoAmI = "Maryam Sharifova | Computer Engineering student at ADA University and AI & Cybersecurity intern at RAM Holding, Baku.";

    const writeLine = (text, className = "terminal-system-line") => {
      const line = document.createElement("p");
      line.className = className;
      line.textContent = text;
      output.append(line);
      output.scrollTop = output.scrollHeight;
    };

    const writeLink = (label, href, newTab = false) => {
      const line = document.createElement("p");
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      if (newTab) {
        link.target = "_blank";
        link.rel = "noopener";
      }
      line.append(link);
      output.append(line);
      output.scrollTop = output.scrollHeight;
    };

    const runCommand = (rawCommand) => {
      const commandText = rawCommand.trim();
      if (!commandText) return;

      writeLine(`maryam@portfolio:~$ ${commandText}`, "terminal-command-line");
      history.push(commandText);
      historyIndex = history.length;
      input.value = "";

      const command = commandText.toLowerCase();
      if (command === "clear") {
        output.replaceChildren();
        return;
      }
      if (command === "help") {
        writeLine("Commands: help, whoami, skills, projects, open 1-6, experience, education, languages, contact, resume, ls, cat about.txt, date, clear");
      } else if (command === "whoami" || command === "cat about.txt") {
        writeLine(whoAmI);
      } else if (command === "skills") {
        writeLine("SECURITY\n  SIEM log analysis, DLP monitoring, insider-risk awareness, network monitoring\nAI\n  Local LLM deployment, RAG, MCP, speech-to-text, computer vision\nCODE\n  Python, REST APIs, HTML & CSS, Flutter, SQL\nTOOLS\n  Hugging Face, FFmpeg, FortiAnalyzer, Palo Alto, LibreNMS, Git, Linux");
      } else if (command === "projects") {
        projectNames.forEach((name, index) => {
          writeLink(`${index + 1}. ${name} · open ${index + 1}`, `projects.html#p${index + 1}`);
        });
      } else if (/^open\s+\d+$/i.test(commandText)) {
        const projectNumber = Number.parseInt(commandText.split(/\s+/)[1], 10);
        if (projectNumber >= 1 && projectNumber <= projectNames.length) {
          window.location.href = `projects.html#p${projectNumber}`;
        } else {
          writeLine("Usage: open 1 through open 6");
        }
      } else if (command === "experience") {
        writeLine("AI and Cybersecurity Intern · RAM Holding · Baku · July 2026–Present\nTriage DLP alerts, investigate insider-risk cases, pivot SIEM events into FortiAnalyzer and Palo Alto logs, and monitor network health in LibreNMS.");
      } else if (command === "education") {
        writeLine("BSc Computer Engineering · ADA University · Baku, Azerbaijan · Expected 2030");
      } else if (command === "languages") {
        writeLine("Azerbaijani — Native\nEnglish — Fluent\nTurkish — Fluent\nRussian — Upper-Intermediate\nIELTS 7.5 · SAT 1510");
      } else if (command === "contact") {
        writeLink("LinkedIn: linkedin.com/in/maryam-sharifova", "https://www.linkedin.com/in/maryam-sharifova/");
        writeLink("GitHub: github.com/maryamsharifova", "https://github.com/maryamsharifova");
      } else if (command === "resume") {
        writeLink("Open Maryam Sharifova's CV (PDF)", "assets/Maryam_Sharifova_CV.pdf", true);
      } else if (command === "ls") {
        writeLine("about.txt projects/ assets/Maryam_Sharifova_CV.pdf contact.md");
      } else if (command === "date") {
        writeLine(new Date().toLocaleString());
      } else if (command === "sudo" || command.startsWith("sudo ")) {
        writeLine("Permission denied. This attempt has been logged by the SOC. Nice try.");
      } else {
        writeLine(`command not found: ${commandText} · type help`);
      }
    };

    // Buttons run the same commands as the keyboard input.
    terminal.querySelectorAll(".terminal-command").forEach((button) => {
      button.addEventListener("click", () => {
        runCommand(button.dataset.command);
        input.focus();
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      runCommand(input.value);
    });

    // Up and Down move through commands the visitor already entered.
    input.addEventListener("keydown", (event) => {
      if (event.key === "ArrowUp" && history.length > 0) {
        event.preventDefault();
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = history[historyIndex];
      } else if (event.key === "ArrowDown" && history.length > 0) {
        event.preventDefault();
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] || "";
      }
    });
  };

  initializeAboutTerminal();

  // Grow the mission line with the same 10% glide the laptop intro uses.
  const initializeQuestTimeline = () => {
    const timeline = document.querySelector(".quest-timeline");
    if (!timeline) return;

    const quests = [...timeline.querySelectorAll(".quest")];
    let currentProgress = 0;
    let targetProgress = 0;
    let animationFrame = 0;

    const clamp = (value) => Math.min(1, Math.max(0, value));

    // Progress is how far a point in the lower viewport has traveled through the list.
    const readTarget = () => {
      const bounds = timeline.getBoundingClientRect();
      const reach = window.innerHeight * 0.68;
      return clamp((reach - bounds.top) / Math.max(1, timeline.offsetHeight));
    };

    const renderTimeline = () => {
      timeline.style.setProperty("--line-progress", String(currentProgress));
      // Match the painted line, which stops a little short of the list's bottom.
      const lineEnd = currentProgress * Math.max(0, timeline.offsetHeight - 16);
      quests.forEach((quest) => {
        // Light a mission only once the gliding line has reached its node.
        quest.classList.toggle("is-lit", currentProgress > 0.01 && lineEnd >= quest.offsetTop + 6);
      });
    };

    const animateTimeline = () => {
      animationFrame = 0;
      // Move 10% of the remaining distance each frame so the line glides.
      currentProgress += (targetProgress - currentProgress) * (reducedMotion.matches ? 1 : 0.1);
      if (Math.abs(targetProgress - currentProgress) < 0.001) currentProgress = targetProgress;
      renderTimeline();
      if (currentProgress !== targetProgress) {
        animationFrame = window.requestAnimationFrame(animateTimeline);
      }
    };

    const requestTimelineUpdate = () => {
      targetProgress = readTarget();
      if (!animationFrame) animationFrame = window.requestAnimationFrame(animateTimeline);
    };

    window.addEventListener("scroll", requestTimelineUpdate, { passive: true });
    window.addEventListener("resize", requestTimelineUpdate);
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", requestTimelineUpdate);
    } else {
      reducedMotion.addListener(requestTimelineUpdate);
    }

    // Start from the current scroll position instead of drawing the line from empty.
    currentProgress = readTarget();
    targetProgress = currentProgress;
    renderTimeline();
  };

  initializeQuestTimeline();

  // Close the contact laptop with the same 10% glide as the home intro.
  const initializeThanksLaptop = () => {
    const section = document.querySelector(".thanks-scroll");
    if (!section) return;

    const stage = section.querySelector(".thanks-stage");
    let currentProgress = 0;
    let targetProgress = 0;
    let animationFrame = 0;
    const clamp = (value) => Math.min(1, Math.max(0, value));
    const progressBetween = (progress, start, end) => clamp((progress - start) / (end - start));
    const easeInOut = (progress) => progress * progress * (3 - 2 * progress);

    // 0 while the laptop is still ahead, 1 at the very bottom of the page.
    const readTarget = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      return clamp((window.scrollY - section.offsetTop) / Math.max(1, maxScroll - section.offsetTop));
    };

    const renderThanksLaptop = () => {
      const opening = 1 - easeInOut(currentProgress);
      stage.style.setProperty("--lid-angle", `${-90 + 98 * opening}deg`);
      stage.style.setProperty("--screen-power", String(progressBetween(opening, 0.45, 0.82)));
      stage.style.setProperty("--keyboard-reveal", String(progressBetween(opening, 0.22, 0.72)));
      stage.style.setProperty("--logo-opacity", String(1 - progressBetween(opening, 0.18, 0.5)));
    };

    const animateThanksLaptop = () => {
      animationFrame = 0;
      currentProgress += (targetProgress - currentProgress) * (reducedMotion.matches ? 1 : 0.1);
      if (Math.abs(targetProgress - currentProgress) < 0.001) currentProgress = targetProgress;
      renderThanksLaptop();
      if (currentProgress !== targetProgress) {
        animationFrame = window.requestAnimationFrame(animateThanksLaptop);
      }
    };

    const requestThanksUpdate = () => {
      targetProgress = readTarget();
      if (!animationFrame) animationFrame = window.requestAnimationFrame(animateThanksLaptop);
    };

    window.addEventListener("scroll", requestThanksUpdate, { passive: true });
    window.addEventListener("resize", requestThanksUpdate);
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", requestThanksUpdate);
    } else {
      reducedMotion.addListener(requestThanksUpdate);
    }

    currentProgress = readTarget();
    targetProgress = currentProgress;
    renderThanksLaptop();
  };

  initializeThanksLaptop();

  // After a short rest at either edge, a little extra scroll opens the neighbour page.
  const initializePageFlow = () => {
    const nextPage = portfolioPages[portfolioIndex + 1];
    const previousPage = portfolioPages[portfolioIndex - 1];
    if (!nextPage && !previousPage) return;

    const restDelay = 300;
    const wheelWindow = 1000;
    const wheelDistance = 120;
    const swipeDistance = 60;
    let lastScrollAt = performance.now();
    let wheelSamples = [];
    let touchGesture = null;
    let navigating = false;

    const atTop = () => window.scrollY <= 4;

    const atBottom = () => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      return window.scrollY >= maxScroll - 4;
    };

    // An open project window or the About prompt must keep the current page.
    const blocked = () => {
      if (document.body.classList.contains("project-dialog-open")) return true;
      return Boolean(document.activeElement && document.activeElement.closest(".terminal-card"));
    };

    // Home waits for the hero. Projects waits until the last sideways card.
    const forwardReady = () => {
      if (!nextPage || blocked()) return false;
      const hero = document.querySelector(".portfolio-hero-section");
      if (hero && !hero.classList.contains("is-current")) return false;
      const projects = document.querySelector(".projects-page");
      if (projects && projects.dataset.trackDone !== "1") return false;
      return atBottom();
    };

    const backReady = () => !blocked() && Boolean(previousPage) && atTop();

    const resting = () => performance.now() - lastScrollAt >= restDelay;

    const openPage = (url, direction) => {
      if (navigating) return;
      // One gesture can fire several events. Leave only after the first one.
      navigating = true;
      wheelSamples = [];
      touchGesture = null;
      try {
        sessionStorage.setItem("portfolio-travel", direction);
        sessionStorage.setItem("portfolio-enter", direction === "back" ? "end" : "start");
      } catch (error) {
        console.warn("Could not remember the page direction.", error);
      }
      if (direction === "back") document.documentElement.dataset.travel = "back";
      // Reduced motion still changes pages; the stylesheet turns the fade off.
      window.location.assign(url);
    };

    window.addEventListener("scroll", () => {
      lastScrollAt = performance.now();
      if (!atTop() && !atBottom()) wheelSamples = [];
    }, { passive: true });

    // These listeners stay passive, so the page can always scroll while it still has room.
    window.addEventListener("wheel", (event) => {
      const pixels = event.deltaMode === 1
        ? event.deltaY * 16
        : event.deltaMode === 2
          ? event.deltaY * window.innerHeight
          : event.deltaY;
      const goingForward = pixels > 0 && forwardReady();
      const goingBack = pixels < 0 && backReady();

      // Momentum that merely arrives at the edge does not count as the extra scroll.
      if (!resting() || (!goingForward && !goingBack)) {
        if (goingForward || goingBack) lastScrollAt = performance.now();
        if (!atTop() && !atBottom()) wheelSamples = [];
        return;
      }

      const now = performance.now();
      // A change of direction starts the distance again.
      if (wheelSamples.some((sample) => Math.sign(sample.pixels) !== Math.sign(pixels))) {
        wheelSamples = [];
      }
      wheelSamples.push({ time: now, pixels });
      wheelSamples = wheelSamples.filter((sample) => now - sample.time <= wheelWindow);
      const traveled = wheelSamples.reduce((total, sample) => total + sample.pixels, 0);
      if (traveled >= wheelDistance && nextPage) openPage(nextPage, "forward");
      if (traveled <= -wheelDistance && previousPage) openPage(previousPage, "back");
    }, { passive: true });

    window.addEventListener("touchstart", (event) => {
      const touch = event.touches[0];
      if (!touch || !resting()) {
        touchGesture = null;
        return;
      }
      // Arm only the edge the finger starts on. A later move cannot change pages mid-scroll.
      let direction = null;
      if (forwardReady()) direction = "forward";
      else if (backReady()) direction = "back";
      touchGesture = direction ? { startY: touch.clientY, direction } : null;
    }, { passive: true });

    window.addEventListener("touchmove", (event) => {
      if (!touchGesture || navigating) return;
      const touch = event.touches[0];
      if (!touch) return;
      const rise = touchGesture.startY - touch.clientY;
      // Finger up continues downward. Finger down goes back to the previous page.
      if (touchGesture.direction === "forward" && rise >= swipeDistance && nextPage) {
        openPage(nextPage, "forward");
      } else if (touchGesture.direction === "back" && rise <= -swipeDistance && previousPage) {
        openPage(previousPage, "back");
      }
    }, { passive: true });

    window.addEventListener("touchend", () => {
      touchGesture = null;
    }, { passive: true });
    window.addEventListener("touchcancel", () => {
      touchGesture = null;
    }, { passive: true });
  };

  initializePageFlow();

  const laptopIntro = document.querySelector(".laptop-intro");
  if (!laptopIntro) {
    return;
  }

  const laptopStage = laptopIntro.querySelector(".laptop-stage");
  const laptopDive = laptopIntro.querySelector(".laptop-dive");
  const screenDisplay = laptopIntro.querySelector(".screen-display");
  const heroSection = document.querySelector(".portfolio-hero-section");
  const heroFrame = heroSection.querySelector(".portfolio-hero-frame");
  const heroCanvas = heroFrame.querySelector(".portfolio-hero");
  const floatingNav = document.querySelector(".floating-nav");
  const typedPhrase = laptopIntro.querySelector(".typed-phrase");
  // These phrases appear one at a time in the intro's typing line.
  const phrases = [
    "secure company data",
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
  const updateHeroScene = (progress, diveProgress, screenPower) => {
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
    // The homepage fades in with the same progress that lifts the black power layer.
    heroFrame.style.opacity = `${screenPower}`;
    heroCanvas.style.setProperty("--hero-fit-scale", `${fitScale}`);

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

    updateHeroScene(progress, diveProgress, screenPower);

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
  updateTypewriterMotion();
  requestLaptopUpdate();

});
