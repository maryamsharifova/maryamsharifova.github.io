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
  // images/balcony-empty.jpg is 1376 x 768. Everything drawn on it is placed in these photo
  // pixels. The empty spot in the middle of the table, where the closed lid lies, is this box.
  const PHOTO_WIDTH = 1376;
  const PHOTO_HEIGHT = 768;
  const PHOTO_LID = { left: 463, right: 853, top: 582, bottom: 705 };
  // On portrait phones the photo sits at the bottom, 79% of the screen tall, with the point
  // 46% across the photo lined up 46% across the screen, so the table and towers both show.
  const PORTRAIT_PHOTO_HEIGHT = 0.79;
  const PORTRAIT_PHOTO_X = 0.46;

  // ----- Stage perspective (must match .laptop-stage in style.css) -----
  // One steady perspective for the whole intro; it never changes from frame to frame.
  const PERSPECTIVE = 3200;
  const PERSPECTIVE_ORIGIN_X = 0.5;
  const PERSPECTIVE_ORIGIN_Y = 0.45;

  // ----- 3D laptop poses -----
  // The closed laptop lies flat on the table, turned 6 degrees so its right side is further
  // back, tilted back 9 degrees on wide screens and 17 on portrait phones (a low view, like
  // the table's). Its size and place are fitted so the lid covers PHOTO_LID (fitIntroPoses).
  const CLOSED_YAW = 6;
  const CLOSED_CAMERA_WIDE = -9;
  const CLOSED_CAMERA_PORTRAIT = -17;
  // The lid's depth on screen in the design's reference windows, in photo pixels: 133 px at
  // 1600x900 (photo scale 1.172) and 96 px at 390x844 (photo scale 0.868).
  const LID_PHOTO_DEPTH_WIDE = 113.5;
  const LID_PHOTO_DEPTH_PORTRAIT = 110.6;
  // At the end of the camera move the laptop faces straight ahead, seen from 7 degrees above.
  const OPEN_CAMERA = -7;
  // The camera move ends with the open laptop near the middle (56% of the height) on wide
  // screens, as big as fits (never zooming past MAX_ZOOM). On phones it stays near where it
  // is (78%) with only a slight zoom, so no empty band appears under the photo.
  const WIDE_END_Y = 0.56;
  const PORTRAIT_END_Y = 0.78;
  const PORTRAIT_ZOOM = 1.12;
  const MAX_ZOOM = 2;
  // As the camera moves in, the photo goes out of focus and darkens a little.
  const FOCUS_BLUR = 3;
  const FOCUS_DIM = 0.12;

  // Values for the current window, all set by fitIntroPoses():
  // the camera angle (tilt) of the closed laptop,
  let closedCamera = CLOSED_CAMERA_WIDE;
  // its size on screen (the CSS scale times the perspective's enlargement at its depth),
  let closedSize = 0.4;
  // where the middle of its base sits on the table, in stage pixels at the start,
  let tableX = 0;
  let tableY = 0;
  // and the camera at the end of the move: zoom, and pan in stage pixels.
  let endZoom = 1;
  let endPanX = 0;
  let endPanY = 0;
  // The stage size and the laptop's own (untransformed) size, read once per fit.
  const stageSize = { width: 1, height: 1 };
  const laptopSize = { width: 1, height: 1, pivot: 0 };
  const laptopBody = laptopIntro.querySelector(".laptop");
  const balconyCamera = laptopIntro.querySelector(".balcony-camera");


  // ----- Intro timeline (shares of the intro's scroll) -----
  // 0-15%: only the greeting, labels and hint fade; the laptop and photo stay perfectly still.
  // 20-46%: the lid opens.
  // 20-58%: the camera moves in on the laptop and its angle eases to face the screen.
  // 57-60%: the sharp homepage layer takes over from the copy on the glass.
  // 58-100%: the dive into the homepage, while the balcony fades out.
  const LID_START = 0.2;
  const LID_END = 0.46;
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
  //
  // The hero is at least one screen tall, and taller when its content needs more room (a very
  // short or narrow window), so it never cuts its content off. Its height is the real hero's
  // natural height (offsetHeight ignores the dive's scaling); the hero section takes that height
  // through --hero-page-height, so the page below starts after it during the intro too.
  let heroPageWidth = 0;
  let heroPageHeight = 0;
  const realHero = heroCanvas;
  const measureHeroPage = () => {
    const box = heroSection.getBoundingClientRect();
    heroPageWidth = box.width;
    heroPageHeight = realHero.offsetHeight;
    const root = document.documentElement.style;
    root.setProperty("--hero-page-width", `${box.width}px`);
    root.setProperty("--hero-page-height", `${heroPageHeight}px`);
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

    // Before the dive the laptop is placed only by its own pose (see placeLaptop), so the dive
    // wrapper stays at rest: no zoom and no offset. Setting this directly, rather than holding
    // the screen in place by measuring it, keeps the closed laptop perfectly still on the table.
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
      // The camera move leaves the screen a little off the window's middle (the open laptop
      // sits at 56% on wide screens, lower on phones). While the screen grows, its centre
      // glides from there to where the real hero's centre will be, with the same easing, so the
      // dive starts without a step. That is the window's middle, or lower when the hero is
      // taller than the window: its top then lines up with the window's top, like the real page.
      const endY = viewportRect.top + heroPageHeight / 2;
      const goalX = baseCenterX + (centerX - baseCenterX) * diveProgress;
      const goalY = baseCenterY + (endY - baseCenterY) * diveProgress;
      diveX = goalX - (centerX + (baseCenterX - centerX) * diveScale);
      diveY = goalY - (centerY + (baseCenterY - centerY) * diveScale);
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
    // The scroll hint is gone within the first 2.5%. The greeting and side labels leave from
    // 1% to 15%, so the screen is clear before the lid starts to move. Nothing else moves yet.
    const cueFade = progressBetween(progress, 0, 0.025);
    const introFade = easeInOut(progressBetween(progress, 0.01, 0.15));
    // Open the lid (20-46%), using smoothstep easing for gentle starts and stops.
    const opening = easeInOut(progressBetween(progress, LID_START, LID_END));
    // The camera move, spread evenly from the moment the lid lifts until the dive starts
    // (20-58%). Zoom, pan, camera angle, turn and focus all follow this one eased value, so the
    // movement starts and ends gently.
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

    // Move the camera: the photo and the laptop zoom and pan together, so the laptop stays on
    // its spot on the table. Its angle eases from the low table view to facing the screen.
    // Everything here is worked out from values fitted on resize; nothing reads layout.
    const camera = cameraAt(move);
    setPhotoCamera(camera, move);
    placeLaptop(
      closedSize * camera.zoom,
      tableX * camera.zoom + camera.panX,
      tableY * camera.zoom + camera.panY,
      CLOSED_YAW * (1 - move),
      closedCamera + (OPEN_CAMERA - closedCamera) * move,
    );
    laptopIntro.style.setProperty("--lid-angle", `${-90 + 98 * opening}deg`);
    laptopIntro.style.setProperty("--screen-power", screenPower);
    laptopIntro.style.setProperty("--keyboard-reveal", keyboardReveal);
    laptopIntro.style.setProperty("--logo-opacity", `${1 - logoFade}`);
    // Slide the shine across the silver as the lid opens, so the metal catches the light.
    laptopIntro.style.setProperty("--metal-sheen", `${28 + 44 * opening}%`);
    // The soft diagonal shine on the lid's back turns slightly (96 to 106 degrees) as it opens.
    laptopIntro.style.setProperty("--lid-shine-angle", `${96 + 10 * opening}deg`);
    // Greeting fades upward, side labels slide outward, and the scroll hint simply fades.
    laptopIntro.style.setProperty("--intro-opacity", `${1 - introFade}`);
    laptopIntro.style.setProperty("--intro-shift", `${-5 * introFade}vh`);
    laptopIntro.style.setProperty("--detail-shift", `${6 * introFade}vw`);
    laptopIntro.style.setProperty("--cue-opacity", `${1 - cueFade}`);
    // The whole balcony fades out during the dive. Its live details stop once it is gone.
    laptopIntro.style.setProperty("--balcony-opacity", `${1 - diveProgress}`);
    balconyLife?.setShown(diveProgress < 1);

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

  // ===== Balcony scene: photo placement and camera =====

  // The photo's box in stage pixels at the start (before any camera move); set by placeBalcony.
  const photoBox = { left: 0, top: 0, width: 1, height: 1 };

  // Size and place the photo for a stage of this size, and return where the empty spot for the
  // closed lid lands on screen (in pixels from the stage's top-left corner).
  // Wide screens: cover, centred, like background-size: cover.
  // Portrait phones: 79% of the screen tall at the bottom, 46% across; the sky colour fills
  // the band above it.
  const placeBalcony = (width, height) => {
    const portrait = height > width;
    const scale = portrait
      ? (height * PORTRAIT_PHOTO_HEIGHT) / PHOTO_HEIGHT
      : Math.max(width / PHOTO_WIDTH, height / PHOTO_HEIGHT);
    const photoWidth = PHOTO_WIDTH * scale;
    const photoHeight = PHOTO_HEIGHT * scale;
    // object-position style: 50% centres the photo; 46% shows a little more of its left side.
    // (If a very wide phone made the photo narrower than the screen, centre it instead.)
    const across = portrait && photoWidth > width ? PORTRAIT_PHOTO_X : 0.5;
    const left = (width - photoWidth) * across;
    const top = portrait ? height - photoHeight : (height - photoHeight) / 2;
    Object.assign(photoBox, { left, top, width: photoWidth, height: photoHeight });

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

  // Keep a camera pan inside the photo: every screen edge the photo covered at the start stays
  // covered at this zoom, so no empty band ever opens beside or under it. (On phones the top
  // is plain sky colour anyway, so only the sides and bottom are held.)
  const clampPan = (zoom, panX, panY) => {
    const { left, top, width, height } = photoBox;
    let x = panX;
    let y = panY;
    if (left <= 0.5) x = Math.min(x, -zoom * left);
    if (left + width >= stageSize.width - 0.5) x = Math.max(x, stageSize.width - zoom * (left + width));
    if (top <= 0.5) y = Math.min(y, -zoom * top);
    if (top + height >= stageSize.height - 0.5) y = Math.max(y, stageSize.height - zoom * (top + height));
    return { x, y };
  };

  // The camera at a point of the move (0 = start, 1 = end). A stage point p shows at
  // p * zoom + pan. Zoom and pan both change in a straight line with the eased move value, so
  // the laptop's spot glides in a straight line too, and since the start and the end both keep
  // the photo covering the screen, every point between them does as well.
  const cameraAt = (move) => ({
    zoom: 1 + (endZoom - 1) * move,
    panX: endPanX * move,
    panY: endPanY * move,
  });

  // Apply the camera to the photo and its live details, with the focus pull: blur up to 3px and
  // 12% darker at the end of the move. The filter sits inside the zoom, so its radius is divided
  // by the zoom to look the same on screen. At rest there is no filter at all.
  const setPhotoCamera = (camera, move) => {
    balconyCamera.style.transform = `translate(${camera.panX}px, ${camera.panY}px) scale(${camera.zoom})`;
    balconyCamera.style.filter = move > 0
      ? `blur(${(FOCUS_BLUR * move) / camera.zoom}px) brightness(${1 - FOCUS_DIM * move})`
      : "none";
  };

  // Where the middle of the laptop's base ends up for a pose at scale 1, relative to the
  // laptop's own centre, following the same steps as the .laptop transform in style.css
  // (read right to left): move to the turning point, turn on the table, move back, tilt.
  // The base starts at the hinge (half the lid's height below the centre) and reaches toward
  // the viewer by the lid's height, so its middle is half that height out.
  const baseCentre = (yawDegrees, cameraDegrees) => {
    const half = laptopSize.height / 2;
    const yaw = (yawDegrees * Math.PI) / 180;
    const tilt = (cameraDegrees * Math.PI) / 180;
    let x = 0;
    let y = half;
    let z = half - laptopSize.pivot;
    [x, z] = [x * Math.cos(yaw) + z * Math.sin(yaw), -x * Math.sin(yaw) + z * Math.cos(yaw)];
    z += laptopSize.pivot;
    [y, z] = [y * Math.cos(tilt) - z * Math.sin(tilt), y * Math.sin(tilt) + z * Math.cos(tilt)];
    return { x, y, z };
  };

  // Place the laptop so the middle of its base shows at (screenX, screenY) in the stage, at this
  // size on screen, turn and camera angle. This is the stage's perspective worked out exactly,
  // so the laptop sits on its spot of the photo without measuring anything.
  //
  // "Size on screen" is the CSS scale times the perspective's enlargement at the laptop's depth.
  // The scale is flat (style.css: scale(), not scale3d()), so it does not change the depth:
  // the enlargement depends only on the pose, and the scale is simply the size divided by it.
  // That keeps the laptop's size in step with the photo's zoom.
  const placeLaptop = (size, screenX, screenY, yawDegrees, cameraDegrees) => {
    const base = baseCentre(yawDegrees, cameraDegrees);
    const enlarge = PERSPECTIVE / (PERSPECTIVE - base.z);
    const scale = size / enlarge;
    // Undo the perspective for that one point, then subtract where the pose itself puts it.
    const originX = stageSize.width * PERSPECTIVE_ORIGIN_X;
    const originY = stageSize.height * PERSPECTIVE_ORIGIN_Y;
    const flatX = originX + (screenX - originX) / enlarge;
    const flatY = originY + (screenY - originY) / enlarge;
    const style = laptopIntro.style;
    style.setProperty("--laptop-scale", String(scale));
    style.setProperty("--lid-shift", `${flatX - stageSize.width / 2 - scale * base.x}px`);
    style.setProperty("--lid-lift", `${flatY - stageSize.height / 2 - scale * base.y}px`);
    style.setProperty("--laptop-yaw", `${yawDegrees}deg`);
    style.setProperty("--camera-angle", `${cameraDegrees}deg`);
  };

  // ===== Balcony scene: live details =====
  // Small, slow movements drawn over the photo on one canvas, in photo pixels (the canvas is
  // 1376 x 768 and is stretched with the photo, so everything stays aligned through the zoom).
  const createBalconyLife = () => {
    const canvas = laptopIntro.querySelector(".balcony-canvas");
    const photo = laptopIntro.querySelector(".balcony-photo");
    const context = canvas?.getContext("2d");
    if (!context) {
      return null;
    }

    // A fixed-seed random number generator, so the stars and lights are the same every visit.
    let seed = 20261110;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    const between = (low, high) => low + (high - low) * random();

    // Soft round light, drawn once and stamped wherever a glow is needed (much cheaper than a
    // new gradient per light). One warm and one cool white version.
    const makeGlow = (red, green, blue) => {
      const sprite = document.createElement("canvas");
      sprite.width = 64;
      sprite.height = 64;
      const paint = sprite.getContext("2d");
      const gradient = paint.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, `rgb(${red} ${green} ${blue} / 100%)`);
      gradient.addColorStop(0.25, `rgb(${red} ${green} ${blue} / 55%)`);
      gradient.addColorStop(1, `rgb(${red} ${green} ${blue} / 0%)`);
      paint.fillStyle = gradient;
      paint.fillRect(0, 0, 64, 64);
      return sprite;
    };
    const warmGlow = makeGlow(255, 196, 132);
    const whiteGlow = makeGlow(235, 242, 255);
    const stamp = (sprite, x, y, radius, alpha) => {
      if (alpha <= 0.002) return;
      context.globalAlpha = Math.min(1, alpha);
      context.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
    };

    // ----- Picking spots from the photo, once -----
    // Reading pixels needs the page to be served (Live Server, GitHub Pages). From a file://
    // address the browser blocks it; the stars then use random spots in the sky area and the
    // city lights are left out.
    let pixels = null;
    const readPhoto = () => {
      try {
        const reader = document.createElement("canvas");
        reader.width = PHOTO_WIDTH;
        reader.height = PHOTO_HEIGHT;
        const paint = reader.getContext("2d", { willReadFrequently: true });
        paint.drawImage(photo, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
        pixels = paint.getImageData(0, 0, PHOTO_WIDTH, PHOTO_HEIGHT).data;
      } catch {
        pixels = null;
      }
    };
    const colourAt = (x, y) => {
      const index = (Math.round(y) * PHOTO_WIDTH + Math.round(x)) * 4;
      return [pixels[index], pixels[index + 1], pixels[index + 2]];
    };
    const brightnessAt = (x, y) => {
      const [red, green, blue] = colourAt(x, y);
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };
    // Areas with a life of their own, left out of the stars and city lights.
    const TOWER_AREA = { left: 795, right: 945, top: 268, bottom: 382 };
    const PLANT_AREA = { left: 932, right: 1082, top: 428, bottom: 590 };
    const inside = (area, x, y) => x >= area.left && x <= area.right && y >= area.top && y <= area.bottom;
    // Open sky: right of the roof overhang (its edge runs from x 448 at the top to x 345 at
    // y 190) and right of the curved balcony wall below that, above the skyline.
    const inOpenSky = (x, y) => {
      if (y > 300 || inside(TOWER_AREA, x, y)) return false;
      return y < 190 ? x > 456 - y * 0.55 : x > 525;
    };

    // Stars: dark sky pixels, more of them high up where the sky is darkest.
    const stars = [];
    for (let attempt = 0; attempt < 4000 && stars.length < 90; attempt += 1) {
      const x = between(350, PHOTO_WIDTH - 2);
      const y = 2 + 296 * random() ** 1.5;
      if (!inOpenSky(x, y) || (pixels && brightnessAt(x, y) > 52)) continue;
      stars.push({
        x,
        y,
        size: between(0.7, 1.7) * (random() < 0.12 ? 1.6 : 1),
        glow: between(0.35, 0.85),
        speed: between(0.6, 2.2),
        phase: between(0, Math.PI * 2),
      });
    }

    // City lights: the brightest little points in the city band behind the railing, each a
    // local peak so one light gets one twinkle. Their own colour is used for the glow.
    const cityLights = [];
    if (pixels) {
      const found = [];
      for (let y = 342; y <= 500; y += 2) {
        for (let x = 560; x <= PHOTO_WIDTH - 4; x += 2) {
          if (inside(TOWER_AREA, x, y) || inside(PLANT_AREA, x, y)) continue;
          const light = brightnessAt(x, y);
          if (light < 150) continue;
          if (light < brightnessAt(x - 2, y) || light < brightnessAt(x + 2, y)
            || light < brightnessAt(x, y - 2) || light < brightnessAt(x, y + 2)) continue;
          found.push({ x, y, colour: colourAt(x, y) });
        }
      }
      // Shuffle and keep up to 150, spread over the whole band.
      for (let index = found.length - 1; index > 0; index -= 1) {
        const other = Math.floor(random() * (index + 1));
        [found[index], found[other]] = [found[other], found[index]];
      }
      found.slice(0, 150).forEach((light) => {
        const [red, green, blue] = light.colour;
        cityLights.push({
          ...light,
          tint: `rgb(${red} ${green} ${blue})`,
          size: between(1.6, 3.4),
          speed: between(0.4, 1.6),
          phase: between(0, Math.PI * 2),
        });
      });
    }
    // City lights are tinted copies of a small white glow, one per colour, made on first use.
    const tintedGlows = new Map();
    const glowIn = (tint) => {
      if (!tintedGlows.has(tint)) {
        const sprite = document.createElement("canvas");
        sprite.width = 32;
        sprite.height = 32;
        const paint = sprite.getContext("2d");
        paint.drawImage(whiteGlow, 0, 0, 32, 32);
        paint.globalCompositeOperation = "source-in";
        paint.fillStyle = tint;
        paint.fillRect(0, 0, 32, 32);
        tintedGlows.set(tint, sprite);
      }
      return tintedGlows.get(tint);
    };

    // Light on the bay: short glints on the water (x 1185-1370, y 400-417) drifting sideways.
    const glints = Array.from({ length: 46 }, () => ({
      x: between(1188, 1370),
      y: between(401, 416.5),
      length: between(2.5, 9),
      drift: between(-3.5, 3.5),
      speed: between(1.2, 3),
      phase: between(0, Math.PI * 2),
    }));

    // Lamps and candles: a slow breath for all, plus a faster uneven flicker for the flames.
    const lamps = [
      { x: 210, y: 298, radius: 92, glow: 0.2, flicker: 0.03 }, // desk lamp
      { x: 208, y: 372, radius: 72, glow: 0.2, flicker: 0.03 }, // table lamp, left
      { x: 531, y: 364, radius: 72, glow: 0.2, flicker: 0.03 }, // table lamp, right
      { x: 260, y: 388, radius: 26, glow: 0.42, flicker: 0.22 }, // candles
      { x: 286, y: 384, radius: 26, glow: 0.42, flicker: 0.22 },
      { x: 262, y: 466, radius: 30, glow: 0.4, flicker: 0.2 },
    ].map((lamp) => ({ ...lamp, phase: between(0, Math.PI * 2) }));

    // Steam from the coffee (surface around 966, 568): soft puffs rising, curling, fading.
    const STEAM_LIFE = 5;
    const steam = Array.from({ length: 24 }, (_, index) => ({
      born: -(index / 24) * STEAM_LIFE,
      x: between(-7, 7),
      curl: between(0, Math.PI * 2),
      sway: between(2.5, 5),
    }));

    // Flame Towers: the LED façades at night. Soft, glowing bands of warm orange light rise
    // slowly up each tower, added to the photo's own light at low strength (at most about 27%),
    // so the towers' glass always shows through. The bands fade in at the foot and out near the
    // tip, the outline's edge is feathered by about 2px, and each tower runs at its own pace,
    // slightly out of step with the others. Drawn on a small canvas covering the three towers.
    const FLAME_AREA = { left: 796, top: 270, width: 148, height: 112 };
    const FLAME_STRENGTH = 0.27;
    const towers = [
      // left tower, around x 801-845, y 275-377
      {
        outline: [[809, 275], [816, 279], [824, 289], [829, 299], [831, 310], [835, 313], [840, 323], [842, 333],
          [844, 345], [845, 365], [846, 377], [801, 377], [801, 353], [802, 334], [804, 315], [807, 295]],
        speed: 6.2, spacing: 26, phase: 0,
      },
      // middle tower, around x 881-907, y 299-357
      {
        outline: [[889, 305], [895, 301], [901, 299], [907, 298], [909, 312], [907, 357], [880, 357], [881, 334], [884, 318]],
        speed: 5.1, spacing: 22, phase: 2.1,
      },
      // right tower, around x 903-939, y 283-357
      {
        outline: [[934, 283], [935, 300], [937, 322], [939, 344], [939, 357], [910, 357], [909, 322], [910, 312],
          [912, 303], [916, 296], [924, 289]],
        speed: 5.7, spacing: 24, phase: 4.3,
      },
    ];
    const flameCanvas = document.createElement("canvas");
    flameCanvas.width = FLAME_AREA.width;
    flameCanvas.height = FLAME_AREA.height;
    const flamePaint = flameCanvas.getContext("2d");
    const flameImage = flamePaint.createImageData(FLAME_AREA.width, FLAME_AREA.height);
    const pixelCount = FLAME_AREA.width * FLAME_AREA.height;

    // Soften a mask by about 2px: a small box blur run twice across and twice down, which is
    // close to a gaussian. Done once here, never per frame (and without canvas filters, which
    // not every browser supports).
    const feather = (mask) => {
      const width = FLAME_AREA.width;
      const height = FLAME_AREA.height;
      const radius = 1;
      let source = mask;
      for (let pass = 0; pass < 4; pass += 1) {
        const across = pass % 2 === 0;
        const result = new Float32Array(pixelCount);
        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            let sum = 0;
            for (let step = -radius; step <= radius; step += 1) {
              const sx = across ? Math.min(width - 1, Math.max(0, x + step)) : x;
              const sy = across ? y : Math.min(height - 1, Math.max(0, y + step));
              sum += source[sy * width + sx];
            }
            result[y * width + x] = sum / (radius * 2 + 1);
          }
        }
        source = result;
      }
      return source;
    };

    // Each tower's own feathered mask, and its foot and tip, so the bands fade at both ends.
    towers.forEach((tower) => {
      flamePaint.clearRect(0, 0, FLAME_AREA.width, FLAME_AREA.height);
      flamePaint.beginPath();
      tower.outline.forEach(([x, y], index) => {
        const method = index === 0 ? "moveTo" : "lineTo";
        flamePaint[method](x - FLAME_AREA.left, y - FLAME_AREA.top);
      });
      flamePaint.closePath();
      flamePaint.fill();
      const coverage = flamePaint.getImageData(0, 0, FLAME_AREA.width, FLAME_AREA.height).data;
      const mask = new Float32Array(pixelCount);
      for (let index = 0; index < pixelCount; index += 1) {
        mask[index] = coverage[index * 4 + 3] / 255;
      }
      tower.mask = feather(mask);
      const heights = tower.outline.map(([, y]) => y);
      tower.top = Math.min(...heights);
      tower.bottom = Math.max(...heights);
    });
    flamePaint.clearRect(0, 0, FLAME_AREA.width, FLAME_AREA.height);

    const smoothstep = (edge0, edge1, value) => {
      const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
      return t * t * (3 - 2 * t);
    };

    const drawFlames = (time) => {
      const data = flameImage.data;
      data.fill(0);
      for (let row = 0; row < FLAME_AREA.height; row += 1) {
        const y = FLAME_AREA.top + row;
        for (let column = 0; column < FLAME_AREA.width; column += 1) {
          const index = row * FLAME_AREA.width + column;
          let glow = 0;
          for (const tower of towers) {
            const mask = tower.mask[index];
            if (mask < 0.004) continue;
            // 0 at the tower's foot, 1 at its tip; fade in over the lowest 18% and out over the
            // top 30%, so no band starts or ends on a line.
            const height = (tower.bottom - y) / (tower.bottom - tower.top);
            const ends = smoothstep(-0.02, 0.18, height) * (1 - smoothstep(0.7, 1.02, height));
            if (ends <= 0) continue;
            // Distance up the tower, moving with time so the bands rise; a gentle sideways wave
            // bends them a little, like light running over the curved glass.
            const x = FLAME_AREA.left + column;
            const rise = (tower.bottom - y) - tower.speed * time
              + 2.2 * Math.sin(x * 0.21 + time * 0.55 + tower.phase);
            const wave = 0.5 + 0.5 * Math.sin((rise / tower.spacing) * Math.PI * 2 + tower.phase);
            // Cubed, so the bands are soft glows with darker gaps between them; a slow breath
            // makes the whole façade brighten and dim a little.
            const breath = 0.78 + 0.22 * Math.sin(time * 0.33 + tower.phase);
            glow = Math.max(glow, wave * wave * wave * breath * ends * mask);
          }
          if (glow <= 0) continue;
          const offset = index * 4;
          data[offset] = 255;
          data[offset + 1] = 150;
          data[offset + 2] = 64;
          data[offset + 3] = 255 * FLAME_STRENGTH * glow;
        }
      }
      flamePaint.putImageData(flameImage, 0, 0);
      context.globalAlpha = 1;
      context.drawImage(flameCanvas, FLAME_AREA.left, FLAME_AREA.top);
    };

    // One soft shadow on the table under the laptop, centred at photo pixels (658, 655): a
    // radial gradient with a radius of 230 photo pixels, squashed vertically to 22% of its
    // width, black at 50% in the middle, 25% at 60% of the radius, fading to nothing at the
    // edge. (A 230-pixel radius makes it reach a little past the 390-pixel-wide laptop, so it
    // shows around the edges; most of it lies under the laptop.)
    const SHADOW = { x: 658, y: 655, radius: 230, squash: 0.22 };
    const drawContactShadow = () => {
      context.save();
      context.globalAlpha = 1;
      context.translate(SHADOW.x, SHADOW.y);
      context.scale(1, SHADOW.squash);
      const shadow = context.createRadialGradient(0, 0, 0, 0, 0, SHADOW.radius);
      shadow.addColorStop(0, "rgb(0 0 0 / 50%)");
      shadow.addColorStop(0.6, "rgb(0 0 0 / 25%)");
      shadow.addColorStop(1, "rgb(0 0 0 / 0%)");
      context.fillStyle = shadow;
      context.fillRect(-SHADOW.radius, -SHADOW.radius, SHADOW.radius * 2, SHADOW.radius * 2);
      context.restore();
    };

    // Draw one moment of the scene. "still" draws a calm frame for reduced motion.
    const draw = (time, still = false) => {
      context.clearRect(0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
      context.globalCompositeOperation = "source-over";
      drawContactShadow();

      // Lights add to the photo's own light.
      context.globalCompositeOperation = "lighter";
      stars.forEach((star) => {
        const twinkle = still ? 0.7 : 0.5 + 0.5 * Math.sin(time * star.speed + star.phase);
        stamp(whiteGlow, star.x, star.y, star.size * 2.2, star.glow * twinkle * twinkle);
      });
      cityLights.forEach((light) => {
        // Mostly steady, with a brighter shimmer now and then.
        const wave = still ? 0.4 : 0.5 + 0.5 * Math.sin(time * light.speed + light.phase);
        stamp(glowIn(light.tint), light.x, light.y, light.size, 0.12 + 0.38 * wave ** 3);
      });
      glints.forEach((glint) => {
        const shine = still ? 0.5 : 0.5 + 0.5 * Math.sin(time * glint.speed + glint.phase);
        const span = 1370 - 1188;
        const x = 1188 + ((((glint.x - 1188 + glint.drift * time) % span) + span) % span);
        context.globalAlpha = 0.32 * shine * shine;
        context.fillStyle = "rgb(255 236 205)";
        context.fillRect(x, glint.y, glint.length, 0.9);
      });
      lamps.forEach((lamp) => {
        const breath = still ? 0 : 0.07 * Math.sin(time * 0.8 + lamp.phase);
        const flicker = still ? 0 : lamp.flicker * (
          0.5 * Math.sin(time * 7.3 + lamp.phase)
          + 0.3 * Math.sin(time * 13.1 + lamp.phase * 2.1)
          + 0.2 * Math.sin(time * 23.7 + lamp.phase * 3.7)
        );
        stamp(warmGlow, lamp.x, lamp.y, lamp.radius * (1 + flicker * 0.3), lamp.glow * (1 + breath + flicker));
      });

      // The towers' LED light adds to the glass, like the other lights.
      drawFlames(still ? 4 : time);
      context.globalCompositeOperation = "source-over";

      // Steam: each puff rises about 24 photo pixels a second, curls side to side more as it
      // climbs, grows, and fades in and out over its life.
      steam.forEach((puff) => {
        let age = (time - puff.born) % STEAM_LIFE;
        if (still) age = (puff.born + STEAM_LIFE) % STEAM_LIFE;
        const life = age / STEAM_LIFE;
        const x = 966 + puff.x + Math.sin(age * 1.25 + puff.curl) * puff.sway * (0.4 + life * 2.2);
        const y = 563 - age * 24;
        stamp(whiteGlow, x, y, 5 + life * 15, 0.085 * Math.sin(Math.PI * life));
      });

      // No film grain: the photo stays clean and sharp. Only the soft vignette (CSS) remains.
      context.globalAlpha = 1;
    };

    // ----- One animation loop, running only while it can be seen -----
    let frame = 0;
    let ready = false;
    let onScreen = true;
    let shown = true;
    const shouldRun = () => ready && onScreen && shown && !reducedMotion.matches && !document.hidden;
    const loop = (now) => {
      frame = 0;
      if (!shouldRun()) return;
      draw(now / 1000);
      frame = window.requestAnimationFrame(loop);
    };
    const refresh = () => {
      if (!ready) return;
      if (reducedMotion.matches) {
        // No motion: one calm frame, still with the lamps, lights and shadow.
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        draw(0, true);
        return;
      }
      if (shouldRun() && !frame) {
        frame = window.requestAnimationFrame(loop);
      } else if (!shouldRun() && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    // Pause whenever the intro is scrolled out of view.
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        onScreen = entries.some((entry) => entry.isIntersecting);
        refresh();
      }).observe(laptopIntro);
    }
    document.addEventListener("visibilitychange", refresh);
    if (typeof reducedMotion.addEventListener === "function") {
      reducedMotion.addEventListener("change", refresh);
    } else {
      reducedMotion.addListener(refresh);
    }

    // Start once the photo has loaded (its pixels choose the stars and lights).
    const start = () => {
      if (ready) return;
      readPhoto();
      ready = true;
      refresh();
    };
    if (photo.complete && photo.naturalWidth > 0) {
      start();
    } else {
      photo.addEventListener("load", start, { once: true });
    }

    return {
      // Called after a refit: with reduced motion the single still frame is drawn again, so the
      // contact shadow follows the laptop to its new place. (The running loop needs nothing.)
      refresh,
      // Called by the scroll loop: stop once the balcony has faded out in the dive.
      setShown(value) {
        if (value === shown) return;
        shown = value;
        refresh();
      },
    };
  };

  // Note: stars and city lights are chosen inside createBalconyLife only after the photo has
  // loaded, because they depend on its pixels.
  let balconyLife = null;

  // ===== Fitting the two ends of the camera move =====
  // All the layout reads happen here, once per resize, never in the scroll loop.
  //
  // Start: the closed laptop lies on the table. Its size matches the empty spot's width and
  // its outline is centred on it (measured, then corrected a few times, since perspective is
  // not linear). That gives the size and the table spot that the camera move then carries.
  //
  // End: the camera zoom and pan that put the open laptop near the middle (56% of the height)
  // at the largest size that fits, or on phones near where it is (78%) at a 1.12 zoom, with
  // the photo still covering the screen.
  const fitIntroPoses = () => {
    const savedIntroStyle = laptopIntro.getAttribute("style") || "";
    const savedDiveStyle = laptopDive.getAttribute("style") || "";
    const savedCamera = [balconyCamera.style.transform, balconyCamera.style.filter];
    const stageRect = laptopStage.getBoundingClientRect();
    stageSize.width = stageRect.width;
    stageSize.height = stageRect.height;
    // The laptop's own size, before any transform (offset sizes ignore transforms).
    laptopSize.width = laptopBody.offsetWidth;
    laptopSize.height = laptopBody.offsetHeight;
    // Same as --laptop-pivot in style.css: half the base's depth, so turns happen around the
    // middle of the laptop's footprint.
    laptopSize.pivot = laptopSize.width * 0.322;
    const portrait = stageRect.height > stageRect.width;

    // Place the photo first; the closed laptop is fitted to the empty spot on its table.
    const target = placeBalcony(stageRect.width, stageRect.height);
    // Keep the photo settings through the restore at the end of this function.
    const sceneStyle = ["--scene-left", "--scene-top", "--scene-width", "--scene-height", "--sky-blend", "--cue-x", "--cue-bottom"]
      .map((name) => [name, laptopIntro.style.getPropertyValue(name)]);

    // Measure without any dive zoom or offset.
    laptopDive.removeAttribute("style");

    // The outline of some parts on screen, relative to the stage's top-left corner.
    const boxOf = (elements) => {
      const box = { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity };
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        box.left = Math.min(box.left, rect.left - stageRect.left);
        box.right = Math.max(box.right, rect.right - stageRect.left);
        box.top = Math.min(box.top, rect.top - stageRect.top);
        box.bottom = Math.max(box.bottom, rect.bottom - stageRect.top);
      });
      box.width = box.right - box.left;
      box.height = box.bottom - box.top;
      box.centerX = (box.left + box.right) / 2;
      box.centerY = (box.top + box.bottom) / 2;
      return box;
    };

    // ----- Start: closed, on the table -----
    // The closed pose uses fixed angles: tilted back 9 degrees on wide screens and 17 on
    // portrait phones, turned 6 degrees to the right. Only its size and position are fitted,
    // so the lid (the .lid element itself, not the base) covers the empty spot in the photo,
    // x 463-853 and y 582-705: the same width (390 photo pixels) and the same centre, with
    // the reference depth (below).
    // Measured boxes are converted back to photo pixels with the inverse of the cover maths
    // (photo pixel = (screen pixel - photo's left or top) / photo scale). On load and resize
    // only, never in the animation loop.
    // Reference values from the design: at 1600x900 the lid's box is centred at about
    // (765, 753), 457 x 133 px; at 390x844 at about (198, 735), 339 x 96 px.
    laptopIntro.style.setProperty("--lid-angle", "-90deg");
    closedCamera = portrait ? CLOSED_CAMERA_PORTRAIT : CLOSED_CAMERA_WIDE;
    const photoScale = photoBox.width / PHOTO_WIDTH;
    const toPhoto = (box) => ({
      left: (box.left - photoBox.left) / photoScale,
      right: (box.right - photoBox.left) / photoScale,
      top: (box.top - photoBox.top) / photoScale,
      bottom: (box.bottom - photoBox.top) / photoScale,
    });
    const lidElement = [laptopIntro.querySelector(".lid")];
    const goal = {
      width: PHOTO_LID.right - PHOTO_LID.left,
      x: (PHOTO_LID.left + PHOTO_LID.right) / 2,
      y: (PHOTO_LID.top + PHOTO_LID.bottom) / 2,
    };
    let size = (goal.width * photoScale) / Math.max(1, laptopSize.width);
    let spotX = target.left + (target.right - target.left) / 2;
    let spotY = target.top + (target.bottom - target.top) / 2;
    // At one tilt, fit the lid's width and centre (a few passes, since perspective is not
    // linear), and report the lid's height in photo pixels. Each call starts from the last
    // answer, so it settles quickly.
    const lidDepthAt = (tilt, passes) => {
      for (let pass = 0; pass < passes; pass += 1) {
        placeLaptop(size, spotX, spotY, CLOSED_YAW, tilt);
        const box = toPhoto(boxOf(lidElement));
        size *= goal.width / Math.max(1, box.right - box.left);
        spotX += (goal.x - (box.left + box.right) / 2) * photoScale;
        spotY += (goal.y - (box.top + box.bottom) / 2) * photoScale;
      }
      placeLaptop(size, spotX, spotY, CLOSED_YAW, tilt);
      const box = toPhoto(boxOf(lidElement));
      return box.bottom - box.top;
    };

    // The design's tilt (-9 or -17 degrees) gives exactly the reference look at 1600x900 and
    // 390x844. On other window shapes the perspective shows the lid a little deeper or
    // flatter, so the tilt is nudged until the lid has the same depth in the photo as in the
    // reference: 133 px at 1600x900 is 113.5 photo pixels, 96 px at 390x844 is 110.6. (At the
    // reference sizes this lands back on -9 and -17 degrees.) A steeper (more negative) tilt
    // shows more of the lid, so halve the range of tilts until the depth matches.
    const depthGoal = portrait ? LID_PHOTO_DEPTH_PORTRAIT : LID_PHOTO_DEPTH_WIDE;
    let steep = closedCamera - 30;
    let flat = closedCamera + 20;
    for (let step = 0; step < 12; step += 1) {
      const tilt = (steep + flat) / 2;
      if (lidDepthAt(tilt, 2) < depthGoal) {
        flat = tilt;
      } else {
        steep = tilt;
      }
    }
    closedCamera = (steep + flat) / 2;
    // Fit the size and position once more at the chosen tilt.
    lidDepthAt(closedCamera, 6);
    closedSize = size;
    tableX = spotX;
    tableY = spotY;

    // Record the lid's box for checking (inspect data-laptop-fit on .laptop-intro): on screen
    // (centre x, centre y, width, height in CSS pixels) and in photo pixels.
    const lidScreen = boxOf(lidElement);
    const lidPhoto = toPhoto(lidScreen);
    laptopIntro.dataset.laptopFit = `screen ${[lidScreen.centerX + stageRect.left, lidScreen.centerY + stageRect.top, lidScreen.width, lidScreen.height]
      .map((value) => value.toFixed(1)).join(" ")} / photo ${[lidPhoto.left, lidPhoto.top, lidPhoto.right, lidPhoto.bottom]
      .map((value) => value.toFixed(1)).join(" ")}`;

    // ----- End: open, facing the screen, camera moved in -----
    laptopIntro.style.setProperty("--lid-angle", "8deg");
    const openParts = laptopIntro.querySelectorAll(".lid-face, .deck, .deck-wall-front");
    const endX = stageRect.width / 2;
    const endY = stageRect.height * (portrait ? PORTRAIT_END_Y : WIDE_END_Y);
    let zoom = portrait ? PORTRAIT_ZOOM : 1.6;
    // Where the table spot should land; corrected below by how far the open laptop's outline
    // sits from it.
    let goalX = endX;
    let goalY = endY;
    let pan = { x: 0, y: 0 };
    for (let pass = 0; pass < 5; pass += 1) {
      pan = clampPan(zoom, goalX - zoom * tableX, goalY - zoom * tableY);
      placeLaptop(closedSize * zoom, tableX * zoom + pan.x, tableY * zoom + pan.y, 0, OPEN_CAMERA);
      const box = boxOf(openParts);
      if (!portrait) {
        // As big as fits: 74% of the height and 86% of the width at most.
        const room = Math.min((stageRect.height * 0.74) / box.height, (stageRect.width * 0.86) / box.width);
        zoom = Math.min(MAX_ZOOM, Math.max(1, zoom * room));
      }
      goalX += endX - box.centerX;
      goalY += endY - box.centerY;
    }
    pan = clampPan(zoom, goalX - zoom * tableX, goalY - zoom * tableY);
    endZoom = zoom;
    endPanX = pan.x;
    endPanY = pan.y;

    // Put the live pose back (keeping the new photo placement); the next frame redraws the
    // laptop and the camera with the new values.
    laptopIntro.setAttribute("style", savedIntroStyle);
    sceneStyle.forEach(([name, value]) => laptopIntro.style.setProperty(name, value));
    laptopDive.setAttribute("style", savedDiveStyle);
    [balconyCamera.style.transform, balconyCamera.style.filter] = savedCamera;
    renderedProgress = -1;
  };

  window.addEventListener("scroll", requestLaptopUpdate, { passive: true });
  // Refit when the stage changes size. The stage is 100svh tall, so it keeps its size while a
  // phone's address bar slides during a touch scroll; the photo and laptop then stay put.
  let fittedWidth = 0;
  let fittedHeight = 0;
  window.addEventListener("resize", () => {
    // The real hero's size comes first: the homepage layers and the dive's end zoom use it.
    measureHeroPage();
    if (laptopStage.clientWidth !== fittedWidth || laptopStage.clientHeight !== fittedHeight) {
      fittedWidth = laptopStage.clientWidth;
      fittedHeight = laptopStage.clientHeight;
      fitIntroPoses();
      balconyLife?.refresh();
    }
    // The homepage copy is window-sized, so refit it inside the glass on every resize.
    fitScreenHomepage();
    renderedProgress = -1;
    requestLaptopUpdate();
  });
  // The hero's natural height can also change without a resize, when the web fonts or the
  // portrait finish loading. Re-measure it then, so the dive and the page below stay in step.
  if ("ResizeObserver" in window) {
    let observedHeight = realHero.offsetHeight;
    new ResizeObserver(() => {
      if (realHero.offsetHeight === observedHeight) return;
      observedHeight = realHero.offsetHeight;
      measureHeroPage();
      fitScreenHomepage();
      renderedProgress = -1;
      requestLaptopUpdate();
    }).observe(realHero);
  }

  // Recheck both animations whenever the visitor changes motion preferences.
  if (typeof reducedMotion.addEventListener === "function") {
    reducedMotion.addEventListener("change", requestLaptopUpdate);
    reducedMotion.addEventListener("change", updateTypewriterMotion);
  } else {
    reducedMotion.addListener(requestLaptopUpdate);
    reducedMotion.addListener(updateTypewriterMotion);
  }

  // Start from the visitor's current scroll position instead of animating from zero, and draw
  // the first pose straight away, so the laptop is on the table in the very first paint.
  fittedWidth = laptopStage.clientWidth;
  fittedHeight = laptopStage.clientHeight;
  fitIntroPoses();
  balconyLife = createBalconyLife();
  currentProgress = readScrollProgress();
  targetProgress = currentProgress;
  updateTypewriterMotion();
  updateLaptop();

});
