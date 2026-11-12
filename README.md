# Maryam Sharifova — Portfolio

A personal portfolio for a university course. It is a static site in plain HTML, CSS, and JavaScript, with no frameworks or build step, and it is published with GitHub Pages.

Live site: [https://maryamsharifova.github.io](https://maryamsharifova.github.io)

Design ideas and prompts were planned with Claude; the code was built with GitHub Copilot in VS Code and Cursor.

Balcony photo generated with Gemini.

## Pages

- **Home** (`index.html`) — scroll-driven laptop introduction on a "living photo" of a night balcony in Baku, with twinkling stars and city lights, the Flame Towers' LED flames, flickering lamps and steam from a coffee cup. The 3D laptop lies on the table, the lid opens, the camera moves in, the screen powers on, and the view glides into the portfolio hero. Below the hero, the same About, Projects, Resume, Security lab ("Phishing or legit?"), and Contact content follows on one long page.
- **About** (`about.html`) — short biography, skills, and a browser-only terminal with a fixed set of commands.
- **Projects** (`projects.html`) — six case studies. On a wide screen the cards pin and slide sideways. Each one opens in a macOS-style window.
- **Resume** (`resume.html`) — a game-style player card, a mission timeline, certifications, and languages. The PDF resume is in `assets/`.
- **Contact** (`contact.html`) — LinkedIn, GitHub, location, and the resume. A small laptop at the bottom closes as the page ends.

Every page has dark and light mode, a floating navigation pill, and a layout that works on phones. The theme choice is saved in the browser.

## Folder structure

```text
.
├── index.html
├── about.html
├── projects.html
├── resume.html
├── contact.html
├── css/
│   └── style.css          # Shared layout, themes, and responsive styles
├── js/
│   └── main.js            # Theme, Home intro and live photo, projects, terminal, timeline, lab
├── assets/
│   └── Maryam_Sharifova_CV.pdf
└── images/
    ├── balcony-empty.jpg  # Home intro background: a night balcony in Baku
    ├── profile.jpg
    └── projects/          # Optional project photos
```

## Run it locally

1. Open the project folder in VS Code.
2. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension if it is not already installed.
3. Right-click `index.html` and choose **Open with Live Server**.

The site also opens if you open `index.html` directly in a browser. Live Server is the better preview because project photos are checked with a request the browser may block from a `file://` address.
