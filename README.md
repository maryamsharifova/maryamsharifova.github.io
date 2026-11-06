# Maryam Sharifova — Portfolio

A minimal, multi-page personal portfolio built with HTML, CSS, and JavaScript.
It is designed for GitHub Pages and does not require build tools or packages.

## Project structure

```text
.
├── index.html       # Home
├── about.html       # About
├── projects.html    # Projects
├── resume.html      # Resume
├── contact.html     # Contact
├── css/
│   └── style.css    # Shared layout, themes, and responsive styles
├── js/
│   └── main.js      # Shared theme toggle and Home-page animation
└── images/
    └── profile.jpg  # Home hero portrait
```

## Preview locally

Open `index.html` in a web browser. To publish it with GitHub Pages, open the
repository's **Settings → Pages**, choose **Deploy from a branch**, then select
the branch you want to publish and its `/ (root)` folder.

## Customize

- Add or replace the portrait at `images/profile.jpg`.
- Adjust shared colors and styles in `css/style.css`.
- Add images to `images/` and reference them from your HTML or CSS.
- The theme button switches between dark and light mode. The selection is saved
  in the browser's local storage.
- The Home page's laptop intro is drawn in CSS, with shared JavaScript updating
  its transforms from scroll position so it does not depend on CSS scroll
  timelines. The screen lid hinges above a separate flat keyboard deck, and the
  intro text uses a JavaScript typewriter effect that fades before the lid opens.
- Opening the laptop powers on a container-sized lock screen, with a live local
  clock, animated security details, and a keyboard light and name-typing effect.
- Unlocking the screen reveals the responsive homepage hero; the measured screen
  and laptop zoom smoothly to the browser viewport before the hero becomes
  clickable.
- Google Fonts are loaded from Google Fonts when the pages are online.

The GitHub icon in the footer links to the portfolio repository:
[maryamsharifova.github.io](https://github.com/maryamsharifova/maryamsharifova.github.io).
