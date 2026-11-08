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
    // The long Home page holds every section, so its dots scroll there instead of opening pages.
    const isLongHome = Boolean(document.querySelector(".home-section"));
    const sectionIds = ["home", "about", "projects", "resume", "contact"];

    pages.forEach(([label, href], index) => {
      const link = document.createElement("a");
      link.href = isLongHome ? `#${sectionIds[index]}` : href;
      link.setAttribute("aria-label", label);
      link.title = label;
      // On Home, the section observer marks the current dot while scrolling.
      if (!isLongHome && currentPage === href) {
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

  // On the long Home page, section links scroll smoothly and the nav follows the reader.
  // The separate pages have no .home-section, so their links keep opening pages.
  const initializeHomeNavigation = () => {
    if (!document.querySelector(".home-section")) return;

    const sections = ["home", "about", "projects", "resume", "contact"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const findSection = (hash) => sections.find((section) => `#${section.id}` === hash);

    // Glide to a section, or jump straight there when the visitor prefers less motion.
    const scrollToSection = (section, behavior) => {
      section.scrollIntoView({ behavior, block: "start" });
    };

    // One listener covers the floating nav, the hero's top bar and buttons, and the right-edge dots.
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]');
      const section = link && findSection(link.getAttribute("href"));
      if (!section) return;
      event.preventDefault();
      scrollToSection(section, reducedMotion.matches ? "auto" : "smooth");
      // Keep the address bar in step without adding a history entry for every click.
      history.replaceState(null, "", `#${section.id}`);
    });

    // Highlight the link for the section that crosses a thin band in the middle of the screen.
    const navLinks = [...document.querySelectorAll(".floating-nav a, .page-rail a, .hero-page-nav a")];
    const markCurrent = (id) => {
      navLinks.forEach((link) => {
        if (link.getAttribute("href") === `#${id}`) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    if ("IntersectionObserver" in window) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) markCurrent(entry.target.id);
        });
      }, { rootMargin: "-45% 0px -54% 0px" });
      sections.forEach((section) => sectionObserver.observe(section));
    }

    // A link such as index.html#projects lands on that section. The browser jumps there early,
    // so line it up again once fonts and images have settled the layout. Reloads and the Back
    // button keep the browser's own restored position instead.
    const requestedSection = findSection(window.location.hash);
    const navigationType = performance.getEntriesByType?.("navigation")[0]?.type;
    if (requestedSection && navigationType !== "reload" && navigationType !== "back_forward") {
      window.addEventListener("load", () => {
        const fontsReady = document.fonts?.ready ?? Promise.resolve();
        fontsReady.then(() => scrollToSection(requestedSection, "auto"));
      }, { once: true });
    }
  };

  initializeHomeNavigation();

  // Lift page content once it enters the viewport. Content already on screen stays visible.
  const initializeScrollReveals = () => {
    // Skip the closing laptop: its lid is already animated by scrolling, and a fade on it
    // would flatten the 3D laptop while it plays.
    const revealItems = new Set(document.querySelectorAll("[data-reveal], .page-content > *:not(.closing-laptop)"));
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
        // A small stagger between siblings; kept short so nothing waits long to appear.
        item.style.setProperty("--reveal-delay", `${Math.min(index, 4) * 60}ms`);
      });
    });

    if (reducedMotion.matches || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-revealed"));
      return;
    }

    // Show anything already on screen with the transition turned off.
    const revealVisibleContent = () => {
      revealItems.forEach((item) => {
        if (item.classList.contains("is-revealed")) return;
        const bounds = item.getBoundingClientRect();
        const inView = bounds.bottom > 0 && bounds.top < window.innerHeight;
        if (!inView) return;
        item.style.transition = "none";
        item.classList.add("is-revealed");
      });
      document.documentElement.offsetHeight;
      revealItems.forEach((item) => {
        if (item.style.transition === "none") item.style.transition = "";
      });
    };
    revealVisibleContent();

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    // Reveal as soon as any part of an element comes within 15% of a screen below the
    // bottom edge, so the fade has already started by the time it scrolls into view.
    }, { threshold: 0, rootMargin: "0px 0px 15% 0px" });
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
        return;
      }

      trackDistance = Math.max(0, projectList.scrollWidth - stickyTrack.clientWidth);
      trackSection.style.height = `${window.innerHeight + trackDistance}px`;
      trackStart = trackSection.getBoundingClientRect().top + window.scrollY;
      targetProgress = Math.min(1, Math.max(0, (window.scrollY - trackStart) / Math.max(1, trackDistance)));
      displayedProgress = targetProgress;
      renderHorizontalTrack();
    };

    // Ease toward the actual scroll position instead of snapping between cards.
    const renderHorizontalTrack = () => {
      projectList.style.transform = `translate3d(${-trackDistance * displayedProgress}px, 0, 0)`;
      const currentCard = Math.min(cards.length, Math.max(1, Math.round(displayedProgress * (cards.length - 1)) + 1));
      progressCount.textContent = `${String(currentCard).padStart(2, "0")} ——— ${String(cards.length).padStart(2, "0")}`;
      progressCount.parentElement.setAttribute("aria-label", `Project ${currentCard} of ${cards.length}`);
      progressBar.style.transform = `scaleX(${displayedProgress})`;
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
      // Measure the track's page position on every scroll. On the long Home page, content
      // above it (fonts, photos) can finish loading later and move it down.
      trackStart = trackSection.getBoundingClientRect().top + window.scrollY;
      const nextProgress = Math.min(1, Math.max(0, (window.scrollY - trackStart) / Math.max(1, trackDistance)));
      // Above or below the track nothing moves, so skip the frame instead of redrawing the same row.
      if (nextProgress === targetProgress && displayedProgress === targetProgress) return;
      targetProgress = nextProgress;
      if (!trackAnimationFrame) trackAnimationFrame = window.requestAnimationFrame(animateHorizontalTrack);
    };

    updateHorizontalTrack();
    window.addEventListener("scroll", updateTrackTarget, { passive: true });
    window.addEventListener("resize", updateHorizontalTrack);
    reducedMotion.addEventListener?.("change", updateHorizontalTrack);

    // Re-measure when the page's height changes (late fonts, project photos, or the
    // About terminal's content on the Home page). One update per frame is enough.
    if ("ResizeObserver" in window) {
      let pageResizeFrame = 0;
      new ResizeObserver(() => {
        if (pageResizeFrame) return;
        pageResizeFrame = window.requestAnimationFrame(() => {
          pageResizeFrame = 0;
          updateHorizontalTrack();
        });
      }).observe(document.body);
    }

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
    // On touch screens (pointer: coarse) a chip must not open the keyboard or move the page,
    // so the input is only focused for desktop pointers, where typing straight on is handy.
    const coarsePointer = window.matchMedia("(pointer: coarse)");
    terminal.querySelectorAll(".terminal-command").forEach((button) => {
      // A tap fires a compatibility mousedown that would move focus onto the chip. Cancelling it
      // keeps focus where it was; keyboard users can still Tab to the chips and press them.
      button.addEventListener("mousedown", (event) => {
        if (coarsePointer.matches) event.preventDefault();
      });
      button.addEventListener("click", () => {
        // runCommand writes the new lines and scrolls only the output box to show them.
        runCommand(button.dataset.command);
        if (!coarsePointer.matches) {
          // preventScroll keeps the page itself still while the cursor moves to the input.
          input.focus({ preventScroll: true });
        }
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
      const nextProgress = readTarget();
      // Away from the timeline the line is already empty or full, so there is nothing to redraw.
      if (nextProgress === targetProgress && currentProgress === targetProgress) return;
      targetProgress = nextProgress;
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

  // Close the small laptop at the end of Contact with the same 10% glide as the Home intro.
  const initializeClosingLaptop = () => {
    const section = document.querySelector(".closing-laptop");
    if (!section) return;

    let currentProgress = 0;
    let targetProgress = 0;
    let animationFrame = 0;
    const clamp = (value) => Math.min(1, Math.max(0, value));
    const easeInOut = (progress) => progress * progress * (3 - 2 * progress);

    // Build the unlabelled keys. Each number is a key's width in 28ths of a row, so every
    // row adds up to 28: function row, number row, tab row, caps row, shift row, space row.
    const keyboard = section.querySelector(".cl-keyboard");
    const keyRows = [
      Array(14).fill(2),
      [3, ...Array(11).fill(2), 3],
      [4, ...Array(10).fill(2), 4],
      [5, ...Array(9).fill(2), 5],
      [3, 3, 3, 10, 3, 2, 2, 2],
    ];
    keyRows.flat().forEach((width) => {
      const key = document.createElement("span");
      key.style.gridColumn = `span ${width}`;
      keyboard.append(key);
    });

    // 0 (open) while the laptop comes into view; 1 (closed) once it has moved about half a
    // screen further up. If the page ends sooner, it is fully closed at the very bottom.
    const readTarget = () => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      // Measure on the whole page, so it also works deep inside the long Home page.
      const bounds = section.getBoundingClientRect();
      // Begin once the bottom of the laptop, base included, reaches the bottom of the screen.
      const start = Math.min(bounds.bottom + window.scrollY - window.innerHeight, maxScroll - 1);
      const end = Math.min(start + window.innerHeight * 0.5, maxScroll);
      return clamp((window.scrollY - start) / Math.max(1, end - start));
    };

    // The lid swings from 10 degrees past upright down onto the base, and the shine on its
    // back slides a little as it moves.
    const renderClosingLaptop = () => {
      const opening = 1 - easeInOut(currentProgress);
      section.style.setProperty("--cl-lid-angle", `${-90 + 100 * opening}deg`);
      section.style.setProperty("--cl-sheen", `${70 - 40 * opening}%`);
    };

    const animateClosingLaptop = () => {
      animationFrame = 0;
      // Move 10% of the remaining distance each frame so the lid glides.
      currentProgress += (targetProgress - currentProgress) * (reducedMotion.matches ? 1 : 0.1);
      if (Math.abs(targetProgress - currentProgress) < 0.001) currentProgress = targetProgress;
      renderClosingLaptop();
      if (currentProgress !== targetProgress) {
        animationFrame = window.requestAnimationFrame(animateClosingLaptop);
      }
    };

    const requestClosingUpdate = () => {
      const nextProgress = readTarget();
      // Until Contact is reached the lid stays open, so higher sections skip this work.
      if (nextProgress === targetProgress && currentProgress === targetProgress) return;
      targetProgress = nextProgress;
      if (!animationFrame) animationFrame = window.requestAnimationFrame(animateClosingLaptop);
    };

    window.addEventListener("scroll", requestClosingUpdate, { passive: true });
    window.addEventListener("resize", requestClosingUpdate);
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", requestClosingUpdate);
    } else {
      reducedMotion.addListener(requestClosingUpdate);
    }

    // Start from the current scroll position instead of animating from open.
    currentProgress = readTarget();
    targetProgress = currentProgress;
    renderClosingLaptop();
  };

  initializeClosingLaptop();


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
  // The intro progress last drawn on the laptop; -1 means nothing has been drawn yet.
  let renderedProgress = -1;
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

  // Size of the closed laptop at the start of the intro, before it grows to the open size.
  const CLOSED_SCALE = 0.46;
  // The closed laptop is turned slightly on the desk and seen from 32 degrees above.
  // It ends facing straight ahead at the shallower 7 degree view of the open laptop.
  const CLOSED_YAW = -6;
  const CLOSED_CAMERA = -32;
  const OPEN_CAMERA = -7;
  // The open laptop never grows past this size, even on very large windows.
  const OPEN_SCALE_MAX = 1.06;
  // Open size for the current window; fitOpenPose() replaces it.
  let openScale = OPEN_SCALE_MAX;

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
  // Four invisible points at the corners of the glass (top-left, top-right, bottom-right,
  // bottom-left). The screen is tilted in 3D, so its outline on the page is a slight
  // trapezoid; these points give that outline exactly, frame by frame.
  const screenCorners = [["0", "0"], ["100%", "0"], ["100%", "100%"], ["0", "100%"]].map(([left, top]) => {
    const corner = document.createElement("span");
    corner.setAttribute("aria-hidden", "true");
    corner.style.cssText = `position:absolute;left:${left};top:${top};width:0;height:0;`;
    screenDisplay.append(corner);
    return corner;
  });

  const showHeroInPage = () => {
    heroSection.classList.add("is-current");
    heroFrame.classList.remove("is-active", "is-fullscreen");
    heroFrame.style.removeProperty("position");
    heroFrame.style.removeProperty("clip-path");
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
    // Clip the flat homepage layer to the glass's real outline, so it never covers the bezel
    // or spills past the laptop. During the dive the outline blends into the plain rectangle,
    // so the switch to the full-size page at the end has nothing left to jump.
    const square = progressBetween(diveProgress, 0.6, 1);
    const boxCorners = [[0, 0], [alignedScreenRect.width, 0], [alignedScreenRect.width, alignedScreenRect.height], [0, alignedScreenRect.height]];
    const outline = screenCorners.map((corner, index) => {
      const point = corner.getBoundingClientRect();
      const x = point.left - alignedScreenRect.left;
      const y = point.top - alignedScreenRect.top;
      return `${x + (boxCorners[index][0] - x) * square}px ${y + (boxCorners[index][1] - y) * square}px`;
    });
    heroFrame.style.clipPath = `polygon(${outline.join(", ")})`;
    // The homepage appears only once the lid is fully open (46% of the intro) and the screen
    // faces the viewer, and fades in quickly over the lit screen by 52%. While the lid is
    // still moving, the 3D screen shows only its own glow, which always matches its shape.
    heroFrame.style.opacity = String(progressBetween(progress, 0.46, 0.52));
    heroCanvas.style.setProperty("--hero-fit-scale", `${fitScale}`);
    // Fade the camera notch out over the middle of the dive, so it is gone before the
    // homepage fills the window. Both copies (on the glass and on the homepage layer) follow.
    const notchOpacity = String(1 - progressBetween(diveProgress, 0.15, 0.7));
    heroFrame.style.setProperty("--notch-opacity", notchOpacity);
    laptopIntro.style.setProperty("--notch-opacity", notchOpacity);

    // At the last intro frame, remove the hero mask and canvas transform completely.
    if (progress >= 0.999) {
      heroFrame.classList.add("is-fullscreen");
      heroFrame.style.removeProperty("left");
      heroFrame.style.removeProperty("top");
      heroFrame.style.removeProperty("width");
      heroFrame.style.removeProperty("height");
      heroFrame.style.removeProperty("border-radius");
      heroFrame.style.removeProperty("opacity");
      heroFrame.style.removeProperty("clip-path");
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
    // Once the hero has reached the top of the window it is the real page, so finish the
    // dive at once rather than letting the glide lag behind a fast scroll. The dive's easing
    // is almost flat at its end, so this last step is not visible.
    if (Math.abs(targetProgress - currentProgress) < 0.0005 || heroSection.getBoundingClientRect().top <= 0) {
      currentProgress = targetProgress;
    }

    const progress = currentProgress;
    // Step 1-2 (0-20%): the closed laptop turns to face the visitor while the logo shimmers.
    const turn = easeInOut(progressBetween(progress, 0, 0.2));
    // The scroll hint is gone within the first 2.5%. The greeting and side labels leave
    // from 1% to 15%, so the screen is clear before the lid starts to move.
    const cueFade = progressBetween(progress, 0, 0.025);
    const introFade = easeInOut(progressBetween(progress, 0.01, 0.15));
    // Step 3 (20-46%): open the lid, using smoothstep easing for gentle starts and stops.
    const openingProgress = progressBetween(progress, 0.2, 0.46);
    const opening = easeInOut(openingProgress);
    // Power the display from 60% to 90% open, and reveal keys from 35% to 85%.
    const screenPower = progressBetween(opening, 0.6, 0.9);
    const keyboardReveal = progressBetween(opening, 0.35, 0.85);
    // Fade the logo as the lid lifts. The desk glow begins halfway open and builds as the display powers on.
    const logoFade = progressBetween(progress, 0.22, 0.33);
    const deskGlow = progressBetween(opening, 0.5, 0.85);
    const diveProgress = easeInOut(progressBetween(progress, 0.58, 1));

    // Once the intro is finished the laptop pose stops changing. Skip restyling its many
    // parts on every scroll of the long Home page, but still let the hero settle below.
    if (progress === renderedProgress) {
      updateHeroScene(progress, diveProgress);
      return;
    }
    renderedProgress = progress;

    // Turn from 6 degrees to the side until the laptop faces the visitor. A small turn on the
    // desk keeps the front edge close to horizontal, so it still reads as a laptop lying flat.
    laptopIntro.style.setProperty("--laptop-yaw", `${CLOSED_YAW * (1 - turn)}deg`);
    laptopIntro.style.setProperty("--camera-angle", `${CLOSED_CAMERA + (OPEN_CAMERA - CLOSED_CAMERA) * opening}deg`);
    // Grow from the small closed size to the open size while the lid opens.
    // The open size comes from fitOpenPose(), so the open laptop always fits the window.
    laptopIntro.style.setProperty("--laptop-scale", `${CLOSED_SCALE + (openScale - CLOSED_SCALE) * opening}`);
    laptopIntro.style.setProperty("--lid-angle", `${-90 + 98 * opening}deg`);
    // Keep the closed laptop a little above the centre, then lower it into the open framing.
    laptopIntro.style.setProperty("--lid-lift", `${-27 + 22 * opening}vh`);
    laptopIntro.style.setProperty("--screen-power", screenPower);
    laptopIntro.style.setProperty("--keyboard-reveal", keyboardReveal);
    laptopIntro.style.setProperty("--logo-opacity", `${1 - logoFade}`);
    laptopIntro.style.setProperty("--logo-shimmer", `${100 - 220 * turn}%`);
    // Slide the shine across the silver as the lid opens, so the metal catches the light.
    laptopIntro.style.setProperty("--metal-sheen", `${28 + 44 * opening}%`);
    // Greeting fades upward, side labels slide outward, and the scroll hint simply fades.
    laptopIntro.style.setProperty("--intro-opacity", `${1 - introFade}`);
    laptopIntro.style.setProperty("--intro-shift", `${-5 * introFade}vh`);
    laptopIntro.style.setProperty("--detail-shift", `${6 * introFade}vw`);
    laptopIntro.style.setProperty("--cue-opacity", `${1 - cueFade}`);
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

  // Find the largest open size (up to OPEN_SCALE_MAX) at which the fully open laptop,
  // base and keyboard included, fits inside the window. The dive keeps the screen's centre
  // in the middle of the window, and the base reaches further below it than the lid does
  // above, so each side is measured from the screen's centre. Perspective makes the base
  // much bigger than its layout box, so measuring the real pose beats a fixed CSS size.
  const fitOpenPose = () => {
    const savedIntroStyle = laptopIntro.getAttribute("style") || "";
    const savedDiveStyle = laptopDive.getAttribute("style") || "";
    // Measure without any dive zoom, in the final open pose: facing forward, lid open.
    laptopDive.removeAttribute("style");
    laptopIntro.style.setProperty("--laptop-yaw", "0deg");
    laptopIntro.style.setProperty("--camera-angle", `${OPEN_CAMERA}deg`);
    laptopIntro.style.setProperty("--lid-angle", "8deg");
    laptopIntro.style.setProperty("--lid-lift", "-5vh");
    const parts = laptopIntro.querySelectorAll(".lid-face, .deck, .deck-wall-front");
    const stageRect = laptopStage.getBoundingClientRect();

    // How far the laptop reaches from its screen's centre, as a share of the room available.
    const overflowAt = (scale) => {
      laptopIntro.style.setProperty("--laptop-scale", String(scale));
      const screen = screenDisplay.getBoundingClientRect();
      const centerX = screen.left + screen.width / 2;
      const centerY = screen.top + screen.height / 2;
      let ratio = 0;
      parts.forEach((part) => {
        const rect = part.getBoundingClientRect();
        // Leave a 6% margin at the top and bottom and 3% at the sides.
        ratio = Math.max(
          ratio,
          (centerY - rect.top) / (stageRect.height * 0.44),
          (rect.bottom - centerY) / (stageRect.height * 0.44),
          (centerX - rect.left) / (stageRect.width * 0.47),
          (rect.right - centerX) / (stageRect.width * 0.47),
        );
      });
      return ratio;
    };

    // Perspective is not linear, so shrink a few times until the laptop settles inside.
    let scale = OPEN_SCALE_MAX;
    for (let pass = 0; pass < 3; pass += 1) {
      scale = Math.min(OPEN_SCALE_MAX, scale / Math.max(1, overflowAt(scale)));
    }
    openScale = scale;

    // Put the live pose back; the next frame redraws it with the new size.
    laptopIntro.setAttribute("style", savedIntroStyle);
    laptopDive.setAttribute("style", savedDiveStyle);
    renderedProgress = -1;
  };

  window.addEventListener("scroll", requestLaptopUpdate, { passive: true });
  // Refit after a real resize. Phones resize slightly when the address bar slides during a
  // touch scroll; ignoring those small height changes keeps the animation steady.
  let fittedWidth = window.innerWidth;
  let fittedHeight = window.innerHeight;
  window.addEventListener("resize", () => {
    if (window.innerWidth !== fittedWidth || Math.abs(window.innerHeight - fittedHeight) > 150) {
      fittedWidth = window.innerWidth;
      fittedHeight = window.innerHeight;
      fitOpenPose();
    }
    renderedProgress = -1;
    requestLaptopUpdate();
  });
  // Web fonts can change the key labels' size, so fit once more after they load.
  document.fonts?.ready.then(() => {
    fitOpenPose();
    requestLaptopUpdate();
  });

  // Recheck both animations whenever the visitor changes motion preferences.
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", requestLaptopUpdate);
    reducedMotion.addEventListener("change", updateTypewriterMotion);
  } else {
    reducedMotion.addListener(requestLaptopUpdate);
    reducedMotion.addListener(updateTypewriterMotion);
  }

  // Start from the visitor's current scroll position instead of animating from zero.
  fitOpenPose();
  currentProgress = readScrollProgress();
  targetProgress = currentProgress;
  updateTypewriterMotion();
  requestLaptopUpdate();

});
