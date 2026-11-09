// Where the visitor's theme choice is stored. The name changed when light became the
// default: choices saved under the old name were made while dark was the default, so they
// are forgotten once and every visitor starts in light mode.
const THEME_KEY = "portfolio-theme-v2";

// Light is the default theme. Only a saved "dark" choice switches the page to dark, and it
// happens here, before the first paint, so there is no flash of the wrong colours.
// A saved "light" choice, or none at all, keeps the light default.
try {
  localStorage.removeItem("portfolio-theme");
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    document.documentElement.dataset.theme = "dark";
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
      // The button names the theme it will switch to.
      const label = document.documentElement.dataset.theme === "dark"
        ? "Switch to light mode"
        : "Switch to dark mode";

      themeToggles.forEach((themeToggle) => {
        themeToggle.setAttribute("aria-label", label);
        themeToggle.setAttribute("title", label);
      });
    };

    themeToggles.forEach((themeToggle) => {
      updateToggleLabels();
      themeToggle.addEventListener("click", () => {
        // Light is the default, so dark mode is the only theme that needs the attribute.
        const isDark = document.documentElement.dataset.theme !== "dark";

        if (isDark) {
          document.documentElement.dataset.theme = "dark";
        } else {
          delete document.documentElement.dataset.theme;
        }

        updateToggleLabels();

        try {
          localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
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
    // Links in the floating nav on the separate pages. The Security lab has no page of its own:
    // it is a section at the end of resume.html (and on Home, whose nav is in index.html).
    const pages = [
      ["Home", "index.html"],
      ["About", "about.html"],
      ["Projects", "projects.html"],
      ["Resume", "resume.html"],
      ["Lab", "resume.html#lab"],
      ["Contact", "contact.html"],
    ];
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    // The long Home page holds every section, so its dots scroll there instead of opening pages.
    const isLongHome = Boolean(document.querySelector(".home-section"));
    // The right-edge dots: every page, plus the Security lab, which is a section on Home and at
    // the end of resume.html.
    // Each entry is [label, link on the separate pages, section id on Home].
    const railLinks = [
      ["Home", "index.html", "home"],
      ["About", "about.html", "about"],
      ["Projects", "projects.html", "projects"],
      ["Resume", "resume.html", "resume"],
      ["Security lab", "resume.html#lab", "lab"],
      ["Contact", "contact.html", "contact"],
    ];

    railLinks.forEach(([label, href, sectionId]) => {
      const link = document.createElement("a");
      link.href = isLongHome ? `#${sectionId}` : href;
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
      toggle.setAttribute("aria-label", "Switch to dark mode");
      toggle.setAttribute("title", "Switch to dark mode");
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

    const sections = ["home", "about", "projects", "resume", "lab", "contact"]
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

  // Opens project 1-6 in its window on this page, or is null when the page has no project
  // cards (about.html). Set below; the About terminal uses it.
  let openProjectByNumber = null;

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

    // Pin the project list only on screens that are both wide and tall enough, when motion is
    // allowed. Below 600px of height (phones and small tablets on their side) a pinned card
    // would be cut off, so the cards stack instead. The same limits are in style.css.
    const sidewaysTrackQuery = window.matchMedia("(min-width: 861px) and (min-height: 600px)");
    const updateHorizontalTrack = () => {
      horizontalTrackEnabled = sidewaysTrackQuery.matches && !reducedMotion.matches;
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
        // Hold the page still behind the window (style.css, html.project-window-open).
        document.documentElement.classList.add("project-window-open");
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
      // Every way of closing (the red dot, Escape, a click outside, or the browser itself) ends
      // in this "close" event, so all clean-up happens here, once: the page's scroll lock and the
      // cursor class come off, and the sideways track is measured again from where the page is
      // now, so scrolling carries on past the last card into the next sections. (Nothing else is
      // locked: there are no touch handlers and no inline overflow styles to undo.)
      dialog.addEventListener("close", () => {
        document.body.classList.remove("project-dialog-open");
        document.documentElement.classList.remove("project-window-open");
        updateHorizontalTrack();
      });
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

      // The address bar keeps no #p1-#p6 once a project has been shown, so a reload, the Back
      // button or the browser's own anchor handling cannot scroll back to it or reopen it.
      const clearProjectHash = () => {
        if (/^#p\d+$/.test(window.location.hash)) {
          history.replaceState(history.state, "", window.location.pathname + window.location.search);
        }
      };

      // Show a project from a #p1-#p6 link: move the page (and the sideways track) to that card,
      // then open its window. This runs once per request, after the layout has settled, with no
      // second delayed scroll that could pull the page back while the visitor is scrolling.
      const showRequestedProject = (card) => {
        updateHorizontalTrack();
        if (horizontalTrackEnabled) {
          // The page position at which the track has slid exactly to this card.
          const distance = Math.min(trackDistance, card.offsetLeft - projectList.offsetLeft);
          window.scrollTo(0, trackStart + distance);
          updateHorizontalTrack();
        } else {
          card.scrollIntoView({ block: "start" });
        }
        clearProjectHash();
        openProjectWindow(card);
      };

      // A project number from the URL (projects.html#p3, as the About terminal links to it).
      const requestedProject = document.getElementById(window.location.hash.slice(1));
      if (requestedProject?.matches(".project-card")) {
        const showOnce = () => {
          const fontsReady = document.fonts?.ready ?? Promise.resolve();
          fontsReady.then(() => showRequestedProject(requestedProject));
        };
        if (document.readyState === "complete") showOnce();
        else window.addEventListener("load", showOnce, { once: true });
      }

      // A #p1-#p6 link inside this page (for example in the terminal on Home).
      window.addEventListener("hashchange", () => {
        const card = document.getElementById(window.location.hash.slice(1));
        if (card?.matches(".project-card")) showRequestedProject(card);
      });

      // The About terminal on Home opens projects here, in place, instead of going to
      // projects.html (whose page ends after Projects, so it felt like the page was stuck there).
      openProjectByNumber = (number) => {
        const card = cards[number - 1];
        if (!card) return false;
        openProjectWindow(card);
        return true;
      };
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

    // Open project 1-6. Where the page has the project cards (the long Home page) its window
    // opens right here, over the terminal, and closing it leaves the visitor where they were.
    // On about.html the project opens on projects.html instead.
    const openProject = (number) => {
      if (openProjectByNumber?.(number)) return;
      window.location.href = `projects.html#p${number}`;
    };

    // A project as a clickable line in the output. It keeps a real link (so it can still be
    // opened in a new tab), but a normal click opens it exactly like typing "open 1" to "open 6".
    const writeProjectLink = (label, number) => {
      writeLink(label, `projects.html#p${number}`);
      output.lastElementChild.querySelector("a").addEventListener("click", (event) => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();
        openProject(number);
      });
    };

    // Each project as a clickable line. A click opens it exactly like typing "open 1" to "open 6".
    const listProjectsToOpen = () => {
      projectNames.forEach((name, index) => {
        writeProjectLink(`open ${index + 1} · ${name}`, index + 1);
      });
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
        writeLine("Commands: help, whoami, skills, projects, open 1-6, experience, education, languages, contact, resume, lab, ls, cat about.txt, date, clear");
      } else if (command === "whoami" || command === "cat about.txt") {
        writeLine(whoAmI);
      } else if (command === "skills") {
        writeLine("SECURITY\n  SIEM log analysis, DLP monitoring, insider-risk awareness, network monitoring\nAI\n  Local LLM deployment, RAG, MCP, speech-to-text, computer vision\nCODE\n  Python, REST APIs, HTML & CSS, Flutter, SQL\nTOOLS\n  Hugging Face, FFmpeg, FortiAnalyzer, Palo Alto, LibreNMS, Git, Linux");
      } else if (command === "projects") {
        projectNames.forEach((name, index) => {
          writeProjectLink(`${index + 1}. ${name} · open ${index + 1}`, index + 1);
        });
      } else if (command === "open") {
        // The "open" chip (or a bare "open"): list the six projects as clickable lines.
        writeLine("Pick a project to open:");
        listProjectsToOpen();
      } else if (/^open\s+1\s*[-–…]\s*6$/.test(command)) {
        // Someone typed the "open 1-6" from the help text literally: explain it kindly.
        writeLine("Try open 1, open 2 … open 6, or pick one below:");
        listProjectsToOpen();
      } else if (/^open\s+\d+$/i.test(commandText)) {
        const projectNumber = Number.parseInt(commandText.split(/\s+/)[1], 10);
        if (projectNumber >= 1 && projectNumber <= projectNames.length) {
          openProject(projectNumber);
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
      } else if (command === "lab") {
        // The Security lab game: a section on the long Home page (where the link scrolls there
        // smoothly), and at the end of resume.html on the separate pages.
        const labHref = document.getElementById("lab") ? "#lab" : "resume.html#lab";
        writeLink("Security lab · play Phishing or legit?", labHref);
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

    // Draw the lid at most 370px wide (70% of the window on phones). With the base widening a
    // little toward the viewer, the whole laptop stays around 420px on desktop.
    // On short screens (phones on their side) the height decides instead: the open laptop's box
    // is about 1.02 design widths tall, and it must fit below the floating nav with the space
    // below it and the footer, so the closed lid also ends up clear of the nav at the page end.
    const sizeClosingLaptop = () => {
      const designWidth = Number.parseFloat(getComputedStyle(section).getPropertyValue("--closing-design-width")) || 900;
      const footer = document.querySelector(".site-footer");
      const spaceBelow = Number.parseFloat(getComputedStyle(section).marginBottom) + (footer ? footer.offsetHeight : 0);
      // About 4.5rem at the top for the nav pill and a small gap.
      const roomForLaptop = window.innerHeight - spaceBelow - 72;
      const lidWidth = Math.max(150, Math.min(370, window.innerWidth * 0.7, roomForLaptop / 1.02));
      section.style.setProperty("--closing-scale", String(lidWidth / designWidth));
    };
    sizeClosingLaptop();

    // 0 (open) until the whole laptop is on screen, 1 (closed) at the very bottom of the page.
    const readTarget = () => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      // Measure on the whole page, so it also works deep inside the long Home page.
      const bounds = section.getBoundingClientRect();
      // Begin once the bottom of the laptop, base included, reaches the bottom of the screen,
      // but always leave at least a quarter of a screen of scrolling for the lid to close.
      const start = Math.min(bounds.bottom + window.scrollY - window.innerHeight, maxScroll - window.innerHeight * 0.25);
      return clamp((window.scrollY - start) / Math.max(1, maxScroll - start));
    };

    // The lid swings from 10 degrees past upright down onto the base, and the shine on the
    // shared silver slides a little as it moves, like on the intro laptop.
    const renderClosingLaptop = () => {
      const opening = 1 - easeInOut(currentProgress);
      section.style.setProperty("--lid-angle", `${-90 + 100 * opening}deg`);
      section.style.setProperty("--metal-sheen", `${70 - 40 * opening}%`);
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
    // A new window width changes the laptop's size, so rescale it before re-reading the scroll.
    window.addEventListener("resize", () => {
      sizeClosingLaptop();
      requestClosingUpdate();
    });
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

  // ===== Security lab: "Phishing or legit?" =====
  // One invented email at a time. The visitor answers Phishing or Legit, sees whether that was
  // right and why, and gets a score and a rank after the last one. Runs on Home and resume.html.
  const initializeSecurityLab = () => {
    const game = document.querySelector(".lab-game");
    if (!game) return;

    // Each body is a list of paragraphs. A paragraph is plain text, or a link written as
    // { link: "visible text", href: "where it really goes" }. Every name, address and link is
    // made up; the links are never opened, only shown in the status bar.
    const emails = [
      {
        answer: "phishing",
        name: "IT Support",
        address: "it-support@ada-edu-az.com",
        subject: "Your password expires today",
        body: [
          "Dear student,",
          "Your university account password expires today at 17:00. To keep access to your email and courses, confirm your current password now:",
          { link: "Confirm my password", href: "https://ada-portal-reset.com/confirm" },
          "Accounts that are not confirmed today will be locked.",
          "IT Support Team",
        ],
        clue: "The sender is ada-edu-az.com instead of ada.edu.az, the link goes to ada-portal-reset.com, and the urgency plus a request for your password are classic phishing signs.",
      },
      {
        answer: "legit",
        name: "Library",
        address: "library@ada.edu.az",
        subject: "Reminder: book due on Friday",
        body: [
          "Hello,",
          "“Computer Networks” is due back on Friday. If you need more time, you can renew it once from your account:",
          { link: "View my library account", href: "https://library.ada.edu.az/account" },
          "Have a good week,\nADA Library",
        ],
        clue: "It comes from the real ada.edu.az domain, the link stays on library.ada.edu.az, and there is no urgency and no request for a password.",
      },
      {
        answer: "phishing",
        name: "CloudBox",
        address: "no-reply@cloudb0x.com",
        subject: "Anar shared “Invoice_Nov.pdf” with you",
        body: [
          "Anar shared a file with you: Invoice_Nov.pdf (248 KB).",
          "To view it, sign in with your email address and your email password.",
          { link: "Open document", href: "https://cloudb0x-share.net/view?file=Invoice_Nov.pdf" },
        ],
        clue: "“cloudb0x” has a zero in place of the letter o, the link goes to cloudb0x-share.net, and a file-sharing service never needs your email password.",
      },
      {
        answer: "legit",
        name: "DevHub",
        address: "noreply@devhub.com",
        subject: "New sign-in from Chrome on Windows",
        body: [
          "We noticed a new sign-in to your DevHub account.",
          "Browser: Chrome on Windows\nLocation: Baku, Azerbaijan\nTime: today at 09:14",
          "If this was you, there is nothing to do. If it was not, change your password in your account settings.",
        ],
        clue: "It only informs you, has no link and asks for nothing, which is exactly how real security notices look.",
      },
      {
        answer: "phishing",
        name: "Rector's Office",
        address: "rector.office@gmail.com",
        subject: "Urgent and confidential",
        body: [
          "Are you available? I am in a meeting and cannot take calls.",
          "I need you to buy five 100 AZN gift cards for a partner event today. Reply with the card codes and keep this between us until I announce it.",
          "Rector",
        ],
        clue: "An official office writing from a free Gmail address, asking for gift cards and for secrecy, is CEO fraud.",
      },
      {
        answer: "phishing",
        name: "AzPost Delivery",
        address: "info@azpost-parcel.info",
        subject: "Your parcel is on hold",
        body: [
          "Your parcel AZ-48213 could not be delivered because a fee of 1.20 AZN has not been paid.",
          "Pay within 24 hours or the parcel will be returned to the sender:",
          { link: "Pay 1.20 AZN", href: "https://bit.ly/3azPst" },
        ],
        clue: "A tiny fee, a 24-hour deadline and a shortened bit.ly link that hides the real address are the usual parcel-scam pattern.",
      },
    ];

    const dotList = game.querySelector(".lab-dots");
    const count = game.querySelector(".lab-count");
    const mailWindow = game.querySelector(".mail-window");
    const avatar = game.querySelector(".mail-avatar");
    const senderName = game.querySelector(".mail-name");
    const senderAddress = game.querySelector(".mail-address");
    const subject = game.querySelector(".mail-subject");
    const body = game.querySelector(".mail-body");
    const status = game.querySelector(".mail-status");
    const answers = game.querySelector(".lab-answers");
    const feedback = game.querySelector(".lab-feedback");
    const feedbackTitle = game.querySelector(".lab-feedback-title");
    const feedbackText = game.querySelector(".lab-feedback-text");
    const nextButton = game.querySelector(".lab-next");
    const result = game.querySelector(".lab-result");
    const score = game.querySelector(".lab-score");
    const rank = game.querySelector(".lab-rank");
    const resultText = game.querySelector(".lab-result-text");
    const restartButton = game.querySelector(".lab-restart");
    const announcer = game.querySelector(".lab-announcer");

    let current = 0;
    // One entry per answered email: true for correct, false for wrong.
    let results = [];

    // One progress dot per email.
    const dots = emails.map(() => {
      const dot = document.createElement("li");
      dotList.append(dot);
      return dot;
    });

    // Green for right, red for wrong, teal for the email on screen, plain for the rest.
    const updateProgress = () => {
      dots.forEach((dot, index) => {
        dot.className = "";
        if (index < results.length) dot.classList.add(results[index] ? "is-correct" : "is-wrong");
        else if (index === current) dot.classList.add("is-current");
      });
      count.textContent = `${Math.min(current + 1, emails.length)} / ${emails.length}`;
    };

    // The status bar at the bottom of the mail window, like a browser's link preview.
    const statusHint = "Hover over or tap a link to see where it goes.";
    const showDestination = (href) => {
      status.replaceChildren();
      const label = document.createElement("span");
      label.className = "mail-status-label";
      label.textContent = "Link goes to";
      const url = document.createElement("code");
      url.textContent = href;
      status.append(label, " ", url);
      status.classList.add("is-showing");
    };
    const resetStatus = () => {
      // After the last answer `current` is one past the list, so stay on the last email.
      const email = emails[Math.min(current, emails.length - 1)];
      status.textContent = email.body.some((part) => typeof part === "object")
        ? statusHint
        : "This email has no links.";
      status.classList.remove("is-showing");
    };

    // Build one link. It is a button, not a real link, so the made-up address can never be
    // opened: hovering, keyboard focus and a tap (or click) only show where it would go.
    const createMailLink = ({ link, href }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mail-link";
      button.textContent = link;
      button.setAttribute("aria-label", `${link} (shows where this link goes)`);
      button.addEventListener("pointerenter", () => showDestination(href));
      button.addEventListener("focus", () => showDestination(href));
      button.addEventListener("click", () => showDestination(href));
      // A mouse leaving clears the bar. After a tap the address stays until something else is
      // tapped or focused, so it can be read on a phone.
      button.addEventListener("pointerleave", (event) => {
        if (event.pointerType === "mouse" && document.activeElement !== button) resetStatus();
      });
      button.addEventListener("blur", resetStatus);
      return button;
    };

    // Put the current email in the mail window.
    const showEmail = () => {
      const email = emails[current];
      // Initials of the sender's name, such as "IT" or "RO".
      avatar.textContent = email.name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
      senderName.textContent = email.name;
      senderAddress.textContent = `<${email.address}>`;
      subject.textContent = email.subject;
      body.replaceChildren(...email.body.map((part) => {
        const paragraph = document.createElement("p");
        if (typeof part === "object") {
          paragraph.className = "mail-link-line";
          paragraph.append(createMailLink(part));
        } else {
          paragraph.textContent = part;
        }
        return paragraph;
      }));
      resetStatus();
      updateProgress();
    };

    // Check an answer, colour its dot and explain the clues.
    const answer = (choice) => {
      const email = emails[current];
      const correct = choice === email.answer;
      results.push(correct);
      updateProgress();

      const verdict = email.answer === "phishing" ? "This one is phishing." : "This one is legit.";
      feedback.classList.toggle("is-correct", correct);
      feedback.classList.toggle("is-wrong", !correct);
      feedbackTitle.textContent = correct ? "Correct." : "Not quite.";
      feedbackText.textContent = `${verdict} ${email.clue}`;
      const isLast = current === emails.length - 1;
      nextButton.firstChild.textContent = isLast ? "See my score " : "Next email ";

      answers.hidden = true;
      feedback.hidden = false;
      announcer.textContent = `${feedbackTitle.textContent} ${feedbackText.textContent}`;
      // The answer buttons just disappeared, so keep keyboard focus on the way forward.
      nextButton.focus({ preventScroll: true });
    };

    // After the last email: the score, a rank and an encouraging line.
    const showResult = () => {
      const correctCount = results.filter(Boolean).length;
      score.textContent = `${correctCount} / ${emails.length}`;
      if (correctCount === emails.length) {
        rank.textContent = "SOC analyst";
        resultText.textContent = "A perfect inbox: every fake caught and every real email trusted.";
      } else if (correctCount >= 4) {
        rank.textContent = "Security-aware";
        resultText.textContent = "Nicely done. Keep checking the sender's domain and where each link really goes.";
      } else {
        rank.textContent = "Phish bait, try again";
        resultText.textContent = "Every analyst starts here. Slow down, read the sender's address and check links before you click.";
      }
      result.classList.toggle("is-perfect", correctCount === emails.length);

      mailWindow.hidden = true;
      feedback.hidden = true;
      result.hidden = false;
      count.textContent = `${emails.length} / ${emails.length}`;
      announcer.textContent = `Your score: ${score.textContent}. Rank: ${rank.textContent}. ${resultText.textContent}`;
      score.focus({ preventScroll: true });
    };

    // On a phone the feedback sits below a tall card, so after "Next" the card's top can be
    // above the screen. Scroll the game back into view only when it is out of place.
    const bringGameIntoView = () => {
      const top = game.getBoundingClientRect().top;
      if (top < 0 || top > window.innerHeight * 0.5) {
        game.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
      }
    };

    const nextEmail = () => {
      current += 1;
      if (current >= emails.length) {
        showResult();
        bringGameIntoView();
        return;
      }
      feedback.hidden = true;
      answers.hidden = false;
      showEmail();
      bringGameIntoView();
      // Start the new email from its subject, so screen readers read it from the top.
      subject.focus({ preventScroll: true });
    };

    const restart = () => {
      current = 0;
      results = [];
      result.hidden = true;
      mailWindow.hidden = false;
      answers.hidden = false;
      announcer.textContent = "";
      showEmail();
      bringGameIntoView();
      subject.focus({ preventScroll: true });
    };

    answers.addEventListener("click", (event) => {
      const button = event.target.closest("[data-answer]");
      if (button) answer(button.dataset.answer);
    });
    nextButton.addEventListener("click", nextEmail);
    restartButton.addEventListener("click", restart);

    showEmail();

    // The rest is for resume.html, where the lab is a section at the end of the page.
    // (Home handles its own section links and highlighting.)
    const labSection = document.getElementById("lab");
    const onResumePage = labSection && !document.querySelector(".home-section");
    if (!onResumePage) return;

    // A link such as resume.html#lab (the nav's "Lab" link and the right-edge dot on the other
    // pages) can land a little off while fonts and the photo are still loading. Line the lab up
    // again once the layout has settled.
    if (window.location.hash === "#lab") {
      window.addEventListener("load", () => {
        const fontsReady = document.fonts?.ready ?? Promise.resolve();
        fontsReady.then(() => labSection.scrollIntoView({ block: "start" }));
      }, { once: true });
    }

    // On resume.html the nav's "Lab" link and the "Security lab" dot point to this same page,
    // so glide down to the lab instead of jumping.
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href="resume.html#lab"]');
      if (!link) return;
      event.preventDefault();
      labSection.scrollIntoView({ block: "start", behavior: reducedMotion.matches ? "auto" : "smooth" });
      history.replaceState(null, "", "#lab");
    });

    // Light up "Lab" instead of "Resume" (in the nav and the dots) while the lab is the part
    // being read, using the same thin band across the middle of the screen as Home.
    if ("IntersectionObserver" in window) {
      const resumeLinks = [...document.querySelectorAll('.floating-nav a[href="resume.html"], .page-rail a[href="resume.html"]')];
      const labLinks = [...document.querySelectorAll('.floating-nav a[href="resume.html#lab"], .page-rail a[href="resume.html#lab"]')];
      const markReading = (inLab) => {
        resumeLinks.forEach((link) => (inLab ? link.removeAttribute("aria-current") : link.setAttribute("aria-current", "page")));
        labLinks.forEach((link) => (inLab ? link.setAttribute("aria-current", "location") : link.removeAttribute("aria-current")));
      };
      new IntersectionObserver((entries) => {
        // The band is either inside the lab or above it, in the resume.
        entries.forEach((entry) => markReading(entry.isIntersecting || entry.boundingClientRect.top < 0));
      }, { rootMargin: "-45% 0px -54% 0px" }).observe(labSection);
    }
  };

  initializeSecurityLab();


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

  // ----- Balcony photo -----
  // Both photos are 1376 x 768 and identical except for the laptop. In balcony-laptop.jpg the
  // closed laptop's lid covers this box, in image pixels.
  const PHOTO_WIDTH = 1376;
  const PHOTO_HEIGHT = 768;
  const PHOTO_LID = { left: 463, right: 853, top: 582, bottom: 705 };
  // On portrait phones the photo is shrunk (never past cover size) until the photo's laptop
  // spans this share of the window's width, and it then sits at the bottom of the screen.
  const PORTRAIT_LID_SHARE = 0.9;

  // ----- 3D laptop poses -----
  // The closed laptop lies flat on the photo's table, turned 14 degrees so its right side is
  // further back, like the photo's laptop. Its size, its place, and the camera angle that
  // gives the same low view as the photo are worked out for each window (fitIntroPoses).
  const CLOSED_YAW = 14;
  // The open laptop faces straight ahead, seen from 7 degrees above.
  const OPEN_CAMERA = -7;
  // The open laptop never grows past this size, even on very large windows.
  const OPEN_SCALE_MAX = 1.06;
  // Values for the current window, all set by fitIntroPoses():
  // the open size and the move that puts the open screen's centre in the window's middle,
  let openScale = OPEN_SCALE_MAX;
  let openShiftX = 0;
  let openShiftY = 0;
  // and the closed size, camera angle and move that lay the lid over the photo's laptop.
  let closedScale = 0.4;
  let closedCamera = -20;
  let closedShiftX = 0;
  let closedShiftY = 0;

  // ----- Intro timeline (shares of the intro's scroll) -----
  // 0-15%: only the greeting and hint fade; the laptop and the photo stay perfectly still.
  // 20-46%: the lid opens. 20-24%: the front photo fades out as the lid starts to lift.
  // 20-58%: the laptop glides from the table spot to the centred open framing.
  // 57-60%: the sharp homepage layer takes over from the copy on the glass.
  // 58-100%: the dive into the homepage, while the balcony fades out.
  const LID_START = 0.2;
  const LID_END = 0.46;
  const PHOTO_FADE_END = 0.24;
  const DIVE_START = 0.58;
  const HERO_LAYER_START = 0.57;
  const HERO_LAYER_END = 0.6;

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
  // A copy of the homepage inside the 3D glass. It tilts with the lid, so while the lid opens
  // the homepage always has the screen's exact shape. It is a still picture: inert, hidden
  // from screen readers, and without the particle canvas. Once the lid is fully open, the
  // real homepage layer (sharp, and the one the dive grows) fades in over it.
  const screenHomepage = document.createElement("div");
  screenHomepage.className = "screen-homepage";
  screenHomepage.setAttribute("aria-hidden", "true");
  screenHomepage.inert = true;
  const homepageCopy = heroCanvas.cloneNode(true);
  homepageCopy.querySelectorAll(".hero-particles").forEach((canvas) => canvas.remove());
  // The copy takes its size from its own container, never from the live page's inline scale.
  homepageCopy.style.removeProperty("--hero-fit-scale");
  screenHomepage.append(homepageCopy);
  screenDisplay.prepend(screenHomepage);

  // How much to scale the homepage so it fits inside the glass. The homepage is always laid
  // out at the real window size (100vw by 100svh, exactly like the real hero), never smaller,
  // and then only scaled uniformly, so it is never stretched and its text wraps exactly as on
  // the real page. "Fit inside" means the larger of the two ratios decides: the page fills the
  // glass exactly in one direction and is centred in the other.
  //
  // During the dive this is worked out again on every frame from the glass's current size, so
  // the homepage grows in step with the screen the whole way. The dive ends at the zoom where
  // the glass just covers the window (finalScale in updateHeroScene), and at that size this
  // ratio is exactly 1: the homepage on the screen is then the real hero at its real size, and
  // the switch to the real page changes nothing.
  //
  // Where the window's shape differs from the glass's 16:10 (a phone, a very wide monitor), the
  // page leaves a margin on two sides of the glass. That margin is painted in the homepage's own
  // background colour (.screen-homepage, .portfolio-hero-frame.is-active), so it reads as part
  // of the page. (An earlier version scaled the page to cover the glass instead; it reached
  // full size early on such windows and then stood still while the screen kept zooming.)
  const fitScale = (glassWidth, glassHeight, pageWidth, pageHeight) => Math.min(
    glassWidth / pageWidth,
    glassHeight / pageHeight,
  );

  // The real hero's size and place on the page: the hero section's box. It is the window
  // without the scrollbar (100vw would include it, which made the scaled homepage 17px wider
  // than the real one on Windows) and inside the notch padding on phones held sideways.
  // Both homepage layers are laid out at exactly this size (style.css reads these values), and
  // the full-screen layer at the end of the dive sits exactly here, so the hand-over to the
  // real page is the same picture at the same place.
  let heroPageWidth = 0;
  let heroPageHeight = 0;
  const measureHeroPage = () => {
    const box = heroSection.getBoundingClientRect();
    heroPageWidth = box.width;
    heroPageHeight = box.height;
    const root = document.documentElement.style;
    root.setProperty("--hero-page-width", `${box.width}px`);
    root.setProperty("--hero-page-height", `${box.height}px`);
    root.setProperty("--hero-page-left", `${box.left}px`);
  };
  measureHeroPage();

  // Fit the copy inside the glass the same way the homepage layer is fitted later, so the
  // hand-over between the two (when the lid is fully open) shows the identical picture.
  const fitScreenHomepage = () => {
    const fit = fitScale(
      screenDisplay.clientWidth,
      screenDisplay.clientHeight,
      homepageCopy.offsetWidth,
      homepageCopy.offsetHeight,
    );
    screenHomepage.style.setProperty("--hero-fit-scale", String(fit));
  };
  fitScreenHomepage();

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
    // Nothing from the intro is left on the real page: no fit scale and no notch fade value.
    heroFrame.style.removeProperty("--notch-opacity");
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

    // The hero's top can fall between two pixels (the intro is 420svh tall), while the scroll
    // position is rounded to whole pixels. Allow one pixel, so landing exactly on the hero
    // (with the Home link, say) always gives the real page and never the intro's last frame.
    if (window.scrollY >= heroSectionTop - 1) {
      showHeroInPage();
      return;
    }

    heroSection.classList.remove("is-current");
    floatingNav.classList.remove("is-visible");
    heroFrame.classList.add("is-active");
    heroFrame.classList.remove("is-fullscreen");
    heroFrame.style.position = "fixed";

    // Before the dive the laptop is placed only by its own pose (see updateLaptop), so the dive
    // wrapper stays at rest: no zoom and no offset. Setting this directly, rather than holding
    // the screen in place by measuring it, keeps the closed laptop perfectly still on the photo.
    if (diveProgress <= 0) {
      diveScale = 1;
      diveX = 0;
      diveY = 0;
      laptopDive.style.removeProperty("--dive-scale");
      laptopDive.style.removeProperty("--dive-x");
      laptopDive.style.removeProperty("--dive-y");
    }

    // The sharp homepage layer is invisible until HERO_LAYER_START, so there is nothing to place
    // yet: skip the layout reads below while the laptop rests on the table and opens.
    if (progress < HERO_LAYER_START) {
      heroFrame.style.opacity = "0";
      heroFrame.style.setProperty("--notch-opacity", "1");
      laptopIntro.style.setProperty("--notch-opacity", "1");
      return;
    }

    const screenRect = screenDisplay.getBoundingClientRect();
    if (diveProgress > 0) {
      const viewportRect = laptopStage.getBoundingClientRect();
      const centerX = viewportRect.left + viewportRect.width / 2;
      const centerY = viewportRect.top + viewportRect.height / 2;
      const baseCenterX = centerX + (
        screenRect.left + screenRect.width / 2 - centerX - diveX
      ) / diveScale;
      const baseCenterY = centerY + (
        screenRect.top + screenRect.height / 2 - centerY - diveY
      ) / diveScale;
      // The zoom at the end of the dive: the glass just covers the real hero's area (the window
      // without its scrollbar). At that size the fit below is exactly 1.
      const finalScale = Math.max(
        heroPageWidth / (screenRect.width / diveScale),
        heroPageHeight / (screenRect.height / diveScale),
      );
      diveScale = 1 + (finalScale - 1) * diveProgress;
      // Hold the screen's centre at the window's middle while it grows. The open pose already
      // puts it there (fitIntroPoses), so the dive starts without any sideways step.
      diveX = centerX - (centerX + (baseCenterX - centerX) * diveScale);
      diveY = centerY - (centerY + (baseCenterY - centerY) * diveScale);
      laptopDive.style.setProperty("--dive-scale", `${diveScale}`);
      laptopDive.style.setProperty("--dive-x", `${diveX}px`);
      laptopDive.style.setProperty("--dive-y", `${diveY}px`);
    }

    // Measure again after zooming, so the homepage is fitted to the glass's size in this exact
    // frame and grows with it on every frame of the dive.
    const alignedScreenRect = screenDisplay.getBoundingClientRect();
    // Never above 1: rounding at the very last frame must not make the page a hair too big.
    const heroScale = Math.min(1, fitScale(
      alignedScreenRect.width,
      alignedScreenRect.height,
      heroPageWidth,
      heroPageHeight,
    ));
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
    // While the lid opens and the laptop glides to the middle, the homepage copy inside the
    // 3D glass is what shows. Once the laptop has settled facing the viewer (57%), this sharp
    // layer fades in over that copy by 60%. Both show the same fitted page, so nothing changes
    // except that the dive can now grow this layer cleanly to full size.
    heroFrame.style.opacity = String(progressBetween(progress, HERO_LAYER_START, HERO_LAYER_END));
    heroCanvas.style.setProperty("--hero-fit-scale", `${heroScale}`);
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
    if (Math.abs(targetProgress - currentProgress) < 0.0005 || heroSection.getBoundingClientRect().top <= 1) {
      currentProgress = targetProgress;
    }

    const progress = currentProgress;
    // The scroll hint is gone within the first 2.5%. The greeting leaves from 1% to 15%, so
    // the screen is clear before the lid starts to move. Nothing else moves until then.
    const cueFade = progressBetween(progress, 0, 0.025);
    const introFade = easeInOut(progressBetween(progress, 0.01, 0.15));
    // Open the lid (20-46%), using smoothstep easing for gentle starts and stops.
    const opening = easeInOut(progressBetween(progress, LID_START, LID_END));
    // As the lid lifts, the photo with the closed laptop fades out quickly (20-24%), revealing
    // the 3D laptop lying in exactly the same place.
    const photoFade = easeInOut(progressBetween(progress, LID_START, PHOTO_FADE_END));
    // Glide from the table spot to the centred open framing, spread evenly from the moment
    // the lid lifts until the dive starts (20-58%). Position, size, camera angle and turn all
    // follow this one eased value, so the movement starts and ends gently.
    const move = easeInOut(progressBetween(progress, LID_START, DIVE_START));
    // The homepage on the glass brightens from very faint (10% open) to fully clear just
    // before the lid is fully open. Keys light up from 35% to 85% open.
    const screenPower = progressBetween(opening, 0.1, 0.95);
    const keyboardReveal = progressBetween(opening, 0.35, 0.85);
    // Fade the logo as the lid lifts.
    const logoFade = progressBetween(progress, 0.22, 0.33);
    const diveProgress = easeInOut(progressBetween(progress, DIVE_START, 1));

    // Once the intro is finished the laptop pose stops changing. Skip restyling its many
    // parts on every scroll of the long Home page, but still let the hero settle below.
    if (progress === renderedProgress) {
      updateHeroScene(progress, diveProgress);
      return;
    }
    renderedProgress = progress;

    // The pose blends from the fitted closed pose on the table to the fitted open pose in the
    // middle (both from fitIntroPoses). Only transform values change: the perspective is fixed.
    const blend = (closed, open) => closed + (open - closed) * move;
    laptopIntro.style.setProperty("--laptop-yaw", `${CLOSED_YAW * (1 - move)}deg`);
    laptopIntro.style.setProperty("--camera-angle", `${blend(closedCamera, OPEN_CAMERA)}deg`);
    laptopIntro.style.setProperty("--laptop-scale", `${blend(closedScale, openScale)}`);
    laptopIntro.style.setProperty("--lid-shift", `${blend(closedShiftX, openShiftX)}px`);
    laptopIntro.style.setProperty("--lid-lift", `${blend(closedShiftY, openShiftY)}px`);
    laptopIntro.style.setProperty("--lid-angle", `${-90 + 98 * opening}deg`);
    laptopIntro.style.setProperty("--screen-power", screenPower);
    laptopIntro.style.setProperty("--keyboard-reveal", keyboardReveal);
    laptopIntro.style.setProperty("--logo-opacity", `${1 - logoFade}`);
    // Slide the shine across the silver as the lid opens, so the metal catches the light.
    laptopIntro.style.setProperty("--metal-sheen", `${28 + 44 * opening}%`);
    // Greeting fades upward and the scroll hint simply fades.
    laptopIntro.style.setProperty("--intro-opacity", `${1 - introFade}`);
    laptopIntro.style.setProperty("--intro-shift", `${-5 * introFade}vh`);
    laptopIntro.style.setProperty("--cue-opacity", `${1 - cueFade}`);
    // The front photo fades as the lid lifts; the whole balcony fades during the dive.
    laptopIntro.style.setProperty("--photo-opacity", `${1 - photoFade}`);
    laptopIntro.style.setProperty("--balcony-opacity", `${1 - diveProgress}`);

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

  // Size and place both balcony photos for a stage of this size, and return where the photo's
  // closed laptop lid lands on screen (in pixels from the stage's top-left corner).
  //
  // Wide screens: "cover", like background-size: cover, centred. If that crop would cut into
  // the laptop (very wide or very short windows), the crop slides just enough to keep it in.
  // Portrait phones: cover would crop the laptop's sides, so the photo is shrunk (never past
  // cover size) until the laptop spans PORTRAIT_LID_SHARE of the width, centred on the
  // laptop, and sits at the bottom of the screen; the sky colour continues above it.
  const placeBalcony = (width, height) => {
    const lidWidth = PHOTO_LID.right - PHOTO_LID.left;
    const cover = Math.max(width / PHOTO_WIDTH, height / PHOTO_HEIGHT);
    const portrait = height > width;
    const scale = portrait ? Math.min(cover, (width * PORTRAIT_LID_SHARE) / lidWidth) : cover;
    const photoWidth = PHOTO_WIDTH * scale;
    const photoHeight = PHOTO_HEIGHT * scale;

    // Sideways: centre the photo (or the laptop, on portrait screens), keep the laptop at least
    // 4% from both edges, and never show past the photo's own edges.
    const lidCenter = ((PHOTO_LID.left + PHOTO_LID.right) / 2) * scale;
    const sideMargin = width * 0.04;
    let left = portrait ? width / 2 - lidCenter : (width - photoWidth) / 2;
    left = Math.max(left, sideMargin - PHOTO_LID.left * scale);
    left = Math.min(left, width - sideMargin - PHOTO_LID.right * scale);
    left = Math.min(0, Math.max(width - photoWidth, left));

    // Up and down: a photo shorter than the screen sits on the bottom edge. A taller one is
    // centred, raised if needed so the laptop ends above the bottom 6% of the screen.
    let top;
    if (photoHeight <= height) {
      top = height - photoHeight;
    } else {
      top = Math.min((height - photoHeight) / 2, height * 0.94 - PHOTO_LID.bottom * scale);
      top = Math.min(0, Math.max(height - photoHeight, top));
    }

    const style = laptopIntro.style;
    style.setProperty("--scene-left", `${left}px`);
    style.setProperty("--scene-top", `${top}px`);
    style.setProperty("--scene-width", `${photoWidth}px`);
    style.setProperty("--scene-height", `${photoHeight}px`);
    // Blend the photo's top edge into the sky colour only when sky shows above it.
    style.setProperty("--sky-blend", top > 0 ? `${Math.min(top, photoHeight * 0.08)}px` : "0px");

    const lid = {
      left: left + PHOTO_LID.left * scale,
      right: left + PHOTO_LID.right * scale,
      top: top + PHOTO_LID.top * scale,
      bottom: top + PHOTO_LID.bottom * scale,
    };

    // The scroll hint stands just above the laptop, its line pointing down at the lid.
    style.setProperty("--cue-x", `${(lid.left + lid.right) / 2}px`);
    style.setProperty("--cue-bottom", `${lid.top - Math.max(10, height * 0.025)}px`);
    return lid;
  };

  // Work out both ends of the laptop's journey for the current window. All the layout reads
  // happen here, once per resize, never in the scroll loop; the scroll loop only blends
  // between the two poses found here.
  //
  // Open pose: the largest size (up to OPEN_SCALE_MAX) at which the fully open laptop, base
  // and keyboard included, fits inside the window with its screen's centre in the window's
  // middle, where the dive then holds it. Perspective makes the base much bigger than its
  // layout box, so measuring the real pose beats a fixed CSS size.
  //
  // Closed pose: the lid lying over the photo's laptop. The size matches the photo laptop's
  // width, a plain move matches its centre, and the camera angle is chosen so the height
  // matches too, which gives the same low view across the table.
  const fitIntroPoses = () => {
    const savedIntroStyle = laptopIntro.getAttribute("style") || "";
    const savedDiveStyle = laptopDive.getAttribute("style") || "";
    const stageRect = laptopStage.getBoundingClientRect();
    const stageMiddleX = stageRect.width / 2;
    const stageMiddleY = stageRect.height / 2;

    // Place the photos first; the closed laptop is fitted to where the photo's laptop lands.
    const target = placeBalcony(stageRect.width, stageRect.height);
    // Keep the photo settings through the restore at the end of this function.
    const sceneStyle = ["--scene-left", "--scene-top", "--scene-width", "--scene-height", "--sky-blend", "--cue-x", "--cue-bottom"]
      .map((name) => [name, laptopIntro.style.getPropertyValue(name)]);

    // Measure without any dive zoom or offset.
    laptopDive.removeAttribute("style");

    // A part's box on screen, relative to the stage's top-left corner.
    const boxOf = (elements) => {
      const box = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        box.left = Math.min(box.left, rect.left - stageRect.left);
        box.right = Math.max(box.right, rect.right - stageRect.left);
        box.top = Math.min(box.top, rect.top - stageRect.top);
        box.bottom = Math.max(box.bottom, rect.bottom - stageRect.top);
      });
      return box;
    };

    const setPose = (scale, shiftX, shiftY) => {
      laptopIntro.style.setProperty("--laptop-scale", String(scale));
      laptopIntro.style.setProperty("--lid-shift", `${shiftX}px`);
      laptopIntro.style.setProperty("--lid-lift", `${shiftY}px`);
    };

    // ----- Open pose: facing forward, lid open -----
    laptopIntro.style.setProperty("--laptop-yaw", "0deg");
    laptopIntro.style.setProperty("--camera-angle", `${OPEN_CAMERA}deg`);
    laptopIntro.style.setProperty("--lid-angle", "8deg");
    const openParts = laptopIntro.querySelectorAll(".lid-face, .deck, .deck-wall-front");

    // How far the laptop reaches from its screen's centre, as a share of the room available.
    const overflowAt = (scale, shiftX, shiftY) => {
      setPose(scale, shiftX, shiftY);
      const screen = boxOf([screenDisplay]);
      const centerX = (screen.left + screen.right) / 2;
      const centerY = (screen.top + screen.bottom) / 2;
      const reach = boxOf(openParts);
      // Leave a 6% margin at the top and bottom and 3% at the sides.
      return {
        centerX,
        centerY,
        ratio: Math.max(
          (centerY - reach.top) / (stageRect.height * 0.44),
          (reach.bottom - centerY) / (stageRect.height * 0.44),
          (centerX - reach.left) / (stageRect.width * 0.47),
          (reach.right - centerX) / (stageRect.width * 0.47),
        ),
      };
    };

    // Perspective is not linear, so settle in a few passes: move the screen's centre to the
    // middle, then shrink until the laptop fits around it.
    let scale = OPEN_SCALE_MAX;
    let shiftX = 0;
    let shiftY = 0;
    for (let pass = 0; pass < 4; pass += 1) {
      const fit = overflowAt(scale, shiftX, shiftY);
      shiftX += stageMiddleX - fit.centerX;
      shiftY += stageMiddleY - fit.centerY;
      scale = Math.min(OPEN_SCALE_MAX, scale / Math.max(1, fit.ratio));
    }
    // One last centring step at the final size.
    const openFit = overflowAt(scale, shiftX, shiftY);
    openScale = scale;
    openShiftX = shiftX + stageMiddleX - openFit.centerX;
    openShiftY = shiftY + stageMiddleY - openFit.centerY;

    // ----- Closed pose: lid shut, lying on the photo's table -----
    laptopIntro.style.setProperty("--laptop-yaw", `${CLOSED_YAW}deg`);
    laptopIntro.style.setProperty("--lid-angle", "-90deg");
    // The closed laptop's outline: the lid's silver back on top, the base and its edges below.
    const closedParts = laptopIntro.querySelectorAll(".back-face, .deck, .deck-wall");
    const targetWidth = target.right - target.left;
    const targetCenterX = (target.left + target.right) / 2;
    const targetCenterY = (target.top + target.bottom) / 2;
    const targetShape = (target.bottom - target.top) / targetWidth;

    // At one camera angle, match the photo laptop's width and centre, then report how tall
    // the laptop is for its width. Each call starts from the last answer, so it settles fast.
    scale = closedScale;
    shiftX = closedShiftX || targetCenterX - stageMiddleX;
    shiftY = closedShiftY || targetCenterY - stageMiddleY;
    const shapeAt = (camera) => {
      laptopIntro.style.setProperty("--camera-angle", `${camera}deg`);
      let box = null;
      for (let pass = 0; pass < 3; pass += 1) {
        setPose(scale, shiftX, shiftY);
        box = boxOf(closedParts);
        scale *= targetWidth / Math.max(1, box.right - box.left);
        shiftX += targetCenterX - (box.left + box.right) / 2;
        shiftY += targetCenterY - (box.top + box.bottom) / 2;
      }
      setPose(scale, shiftX, shiftY);
      box = boxOf(closedParts);
      return (box.bottom - box.top) / Math.max(1, box.right - box.left);
    };

    // A steeper (more negative) camera angle shows more of the lid's top, so the laptop looks
    // taller. Halve the range of angles until the height matches the photo's laptop.
    let steep = -60;
    let shallow = 15;
    for (let step = 0; step < 10; step += 1) {
      const camera = (steep + shallow) / 2;
      if (shapeAt(camera) < targetShape) {
        shallow = camera;
      } else {
        steep = camera;
      }
    }
    closedCamera = (steep + shallow) / 2;
    shapeAt(closedCamera);
    closedScale = scale;
    closedShiftX = shiftX;
    closedShiftY = shiftY;

    // Put the live pose back (keeping the new photo placement); the next frame redraws the
    // laptop with the new values.
    laptopIntro.setAttribute("style", savedIntroStyle);
    sceneStyle.forEach(([name, value]) => laptopIntro.style.setProperty(name, value));
    laptopDive.setAttribute("style", savedDiveStyle);
    renderedProgress = -1;
  };

  window.addEventListener("scroll", requestLaptopUpdate, { passive: true });
  // Refit when the stage changes size. The stage is 100svh tall, so it keeps its size while a
  // phone's address bar slides during a touch scroll; the photo and laptop then stay put.
  let fittedWidth = laptopStage.clientWidth;
  let fittedHeight = laptopStage.clientHeight;
  window.addEventListener("resize", () => {
    // The real hero's size comes first: the homepage layers and the dive's end zoom use it.
    measureHeroPage();
    if (laptopStage.clientWidth !== fittedWidth || laptopStage.clientHeight !== fittedHeight) {
      fittedWidth = laptopStage.clientWidth;
      fittedHeight = laptopStage.clientHeight;
      fitIntroPoses();
    }
    // The homepage copy is window-sized, so refit it inside the glass on every resize.
    fitScreenHomepage();
    renderedProgress = -1;
    requestLaptopUpdate();
  });
  // Web fonts can change the key labels' size, so fit once more after they load.
  document.fonts?.ready.then(() => {
    fitIntroPoses();
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
  fitIntroPoses();
  currentProgress = readScrollProgress();
  targetProgress = currentProgress;
  updateTypewriterMotion();
  requestLaptopUpdate();

});
