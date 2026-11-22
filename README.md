# Maryam Sharifova — Portfolio

This is my personal portfolio. I built it as an individual project for SITE 1101 (Principles of Information Systems) at ADA University. It is a static site in plain HTML, CSS and JavaScript, with no frameworks and no build step, and it is published with GitHub Pages.

Live site: [https://maryamsharifova.github.io](https://maryamsharifova.github.io)

## How it was built

- I wrote the code with AI coding agents. I started with GitHub Copilot in VS Code, then moved to Cursor, and then to Claude Code after I ran out of requests on the first two. The chat exports from all three are submitted with the project.
- I planned the design ideas and prompts with Claude.
- The balcony photo on the Home page was generated with Gemini.
- The fonts come from Google Fonts: **Fraunces** for headings, **Source Serif 4** for body text, **Inter** for small interface text (navigation, buttons, tags and counters) and **JetBrains Mono** for labels, code and the terminals.

## Pages

- **Home** (`index.html`): one long page that opens on a "living photo" of a balcony at night in Baku, with a closed laptop on the table. The words "Hi, I'm Maryam" appear above a line that types out a few short phrases. The photo has twinkling stars, city lights, glints on the bay, glowing lamps and candles, the Flame Towers' LED flames and steam from a coffee cup. As you scroll, the laptop lid opens, the keys type "MARYAM", the camera moves in, and the view dives into the screen until the portfolio hero (my name, a short intro and my photo) fills the window. Below the hero come the same sections as the separate pages: About, Projects, Resume, Security lab and Contact.
- **About** (`about.html`): a short biography, my skills, and a small terminal that runs only in the browser and answers a fixed set of commands (`help`, `whoami`, `skills`, `projects`, `open`, `contact`, `lab` and more).
- **Projects** (`projects.html`): six projects, each on its own card with a photo or screenshot (or a small live visual when there is no photo). On a wide screen the cards pin in place and slide sideways as you scroll. Clicking a card opens a macOS-style window with more details. The logic gates window also has a small demo: a "Press the button" control switches between two Tinkercad pictures of our NOT gate. You can link to a single project with `#p1` to `#p6`. The projects are in this order:
  1. Plant-health vision for Agrohub (`#p1`)
  2. Speech-to-text API for Azerbaijani (`#p2`)
  3. Local LLM chatbot, running a local model (Qwen 2.5 3B) in LM Studio (`#p3`)
  4. Logic gates (`#p4`)
  5. Hour of AI (`#p5`)
  6. Line-following robot with LEGO EV3 (`#p6`)
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
    ├── avatar-ms.png      # Resume player card avatar: my own MS monogram logo
    ├── monogram-navy.png  # Closing laptop's screen at the end of Contact: my own MS monogram logo (navy)
    ├── favicon.ico        # Favicon (16 and 32 px): my own MS monogram logo
    ├── favicon-32.png     # 32 px PNG favicon (MS monogram)
    ├── favicon-512.png    # 512 px PNG favicon for large displays (MS monogram)
    ├── apple-touch-icon.png  # 180 px icon for iPhone and iPad home screens (MS monogram)
    └── projects/          # Project photos and screenshots (see below)
        ├── agrohub-code.png   # 01 Vision: the Python code that called the Kindwise API (in the window)
        ├── agrohub-leaf.jpg   # 01 Vision: the plant-health API's JSON response
        ├── speech-api.jpg     # 02 Speech: terminal screenshot of my speech-to-text API (redacted)
        ├── chatbot.png        # 03 Local AI: my Telegram bot's commands and status
        ├── logic-gates.jpg    # 04 Logic gates: our team's real breadboard
        ├── not-gate-off.png   # 04 Logic gates demo: Tinkercad NOT gate, button pressed, LED off
        ├── not-gate-on.png    # 04 Logic gates demo: Tinkercad NOT gate, button released, LED on
        ├── hour-of-ai.jpg     # 05 Hour of AI: our team with the children and their certificates
        └── ev3-robot.jpg      # 06 EV3 robot: the robot with its colour sensor on the line
```

## Project photos

`main.js` checks `images/projects/` for these file names. If a file exists, its photo appears on that project's card and in its window automatically. If it does not, the card keeps its drawn visual. The file names and alt texts are listed in `main.js` in the same order as the cards, and `style.css` frames each one.

| Project | File name | How it is shown |
| --- | --- | --- |
| 1. Plant-health vision for Agrohub | `agrohub-leaf.jpg` | The card shows the top of the screenshot; the window shows all of it at full width in a scrollable area |
| 2. Speech-to-text API for Azerbaijani | `speech-api.jpg` | The whole screenshot on a black background |
| 3. Local LLM chatbot | `chatbot.png` | The whole screenshot on a dark navy background |
| 4. Logic gates | `logic-gates.jpg` | Photo filling the frame, aimed at the circuit and its LED |
| 5. Hour of AI | `hour-of-ai.jpg` | Photo filling the frame, aimed at our team and the children |
| 6. Line-following robot with LEGO EV3 | `ev3-robot.jpg` | Photo filling the frame, aimed at the robot and its colour sensor |

The Agrohub window also shows `agrohub-code.png`, a screenshot of the Python code that called the Kindwise API, above the response screenshot. The logic gates window also uses `not-gate-on.png` and `not-gate-off.png` for its NOT gate demo.

## Run it locally

1. Open the project folder in VS Code.
2. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension if you do not have it.
3. Right-click `index.html` and choose **Open with Live Server**.

You can also open `index.html` directly in a browser, but from a `file://` address the browser blocks some features:

- The **project photo check** does not work, so the photos in `images/projects/` do not appear.
- The site cannot **read the balcony photo's pixels**, so the stars are placed at random spots in the sky instead of on dark areas, and the city lights are left out.

Live Server (or the live GitHub Pages site) shows everything as intended.
