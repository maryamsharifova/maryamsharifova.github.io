# Maryam Sharifova — Portfolio

This is my personal portfolio. I built it as an individual project for SITE 1101 (Principles of Information Systems) at ADA University. It is a static site in plain HTML, CSS and JavaScript, with no frameworks and no build step, and it is published with GitHub Pages.

Live site: [https://maryamsharifova.github.io](https://maryamsharifova.github.io)

## How it was built

- I wrote the code with AI coding agents. I started with GitHub Copilot in VS Code, then moved to Cursor, and then to Claude Code after I ran out of requests on the first two. The chat exports from all three are submitted with the project.
- I planned the design ideas and prompts with Claude.
- The balcony photo on the Home page was generated with Gemini.
- The fonts come from Google Fonts: **Space Grotesk** for headings, **Inter** for body text and **JetBrains Mono** for small labels and code.

## Pages

- **Home** (`index.html`): one long page that opens on a "living photo" of a balcony at night in Baku, with a closed laptop on the table. The words "Hi, I'm Maryam" appear above a line that types out a few short phrases. The photo has twinkling stars, city lights, glints on the bay, glowing lamps and candles, the Flame Towers' LED flames and steam from a coffee cup. As you scroll, the laptop lid opens, the keys type "MARYAM", the camera moves in, and the view dives into the screen until the portfolio hero (my name, a short intro and my photo) fills the window. Below the hero come the same sections as the separate pages: About, Projects, Resume, Security lab and Contact.
- **About** (`about.html`): a short biography, my skills, and a small terminal that runs only in the browser and answers a fixed set of commands (`help`, `whoami`, `skills`, `projects`, `open`, `contact`, `lab` and more).
- **Projects** (`projects.html`): six projects, each on its own card with a small live visual. On a wide screen the cards pin in place and slide sideways as you scroll. Clicking a card opens a macOS-style window with more details. You can link to a single project with `#p1` to `#p6`.
- **Resume** (`resume.html`): a game-style player card with my toolkits and skill levels, a **Timeline** of my studies, internship and projects, my certifications (IELTS and SAT), my languages and a button that opens my PDF resume. The **Security lab** is at the end of this page (`resume.html#lab`). It is a "Phishing or legit?" game with six made-up emails where you check where each link really goes, and you get a score at the end. The Security lab has no page of its own. It appears on Home and on the Resume page.
- **Contact** (`contact.html`): a "Let's talk." heading and four contact cards for LinkedIn, GitHub, my location and my resume. At the bottom, a small laptop closes its lid as you reach the end of the page.

## Features

- **Light and dark mode.** Every visitor starts in light mode. The sun/moon button switches to dark mode, and the browser remembers the choice for the next visit.
- **Floating navigation** with links to every page, the Security lab and the theme button, plus small page dots on the right edge. Home has its own section links, and the other pages get the same navigation from `main.js`.
- **Footer** on every page with the copyright line, my GitHub profile and a link to this site's code.
- **Responsive layouts** for phones, tablets and desktops, in portrait and landscape. On small or short screens the project cards stack instead of sliding sideways.
- **Reduced motion.** If the visitor's system asks for less motion, the animations stop or jump straight to their end, and the project cards simply stack.
- **Keyboard and screen-reader support.** Everything can be reached with the keyboard and has a visible focus outline. Project cards open with Enter, and the project window closes with Escape. In the terminal, the Up and Down arrows recall earlier commands. The navigation marks the current page or section, and screen readers announce new terminal output and the Security lab results.
- On desktop with a mouse, there is a custom cursor and some buttons that pull slightly toward the pointer.

## Folder structure

```text
.
├── .nojekyll              # Tells GitHub Pages to publish the files as they are
├── .gitignore             # Keeps editor settings (.vscode/) out of the repository
├── README.md              # This file
├── index.html             # Home: laptop intro, hero and every section on one page
├── about.html             # About: biography, skills and the terminal
├── projects.html          # Projects: six project cards and the project window
├── resume.html            # Resume: player card, timeline, certifications and the Security lab
├── contact.html           # Contact: contact cards and the closing laptop
├── css/
│   └── style.css          # All styles: layout, light and dark themes, responsive rules
├── js/
│   └── main.js            # All behaviour: theme, navigation, intro, projects, terminal, timeline, lab
├── assets/
│   └── Maryam_Sharifova_CV.pdf  # My PDF resume
└── images/
    ├── balcony-empty.jpg  # Home intro background: a balcony at night in Baku
    ├── profile.jpg        # My photo in the hero
    ├── favicon.ico        # Favicon (16 and 32 px): my own MS monogram logo
    ├── favicon-32.png     # 32 px PNG favicon
    ├── favicon-512.png    # 512 px PNG favicon for large displays
    ├── apple-touch-icon.png  # 180 px icon for iPhone and iPad home screens
    └── projects/          # Optional project photos (see below)
```

## Project photos

`main.js` checks `images/projects/` for these file names. If a file exists, its photo appears on that project's card automatically. If it does not, the card keeps its drawn visual.

| Project | File name |
| --- | --- |
| 1. Speech-to-text API for Azerbaijani | `speech-api.jpg` |
| 2. Local LLM chatbot | `chatbot.png` |
| 3. Plant-health vision for Agrohub | `agrohub-leaf.jpg` |
| 4. Logic gates | `logic-gates.jpg` |
| 5. Hour of AI | `hour-of-ai.jpg` |
| 6. Line-following robot with LEGO EV3 | `ev3-robot.jpg` |

## Run it locally

1. Open the project folder in VS Code.
2. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension if you do not have it.
3. Right-click `index.html` and choose **Open with Live Server**.

You can also open `index.html` directly in a browser, but from a `file://` address the browser blocks some features:

- The **project photo check** does not work, so the photos in `images/projects/` do not appear.
- The site cannot **read the balcony photo's pixels**, so the stars are placed at random spots in the sky instead of on dark areas, and the city lights are left out.

Live Server (or the live GitHub Pages site) shows everything as intended.
