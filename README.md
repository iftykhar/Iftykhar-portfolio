# Iftykhar Alam — Portfolio

Welcome to my personal portfolio! I'm **S M Iftykhar Ul Alam**, a Full-Stack Developer based in Dhaka, Bangladesh, specializing in high-performance **React / Next.js** frontends and **Laravel**-backed backends.

## 🚀 Live Site

<https://iftykhar-portfolio.vercel.app/>

## 🛠 Tech Stack

- **Frontend:** React, Next.js, TypeScript, Tailwind CSS, Bootstrap, MUI, shadcn/ui
- **Backend:** PHP, Laravel, REST APIs
- **Databases:** MySQL, SQLite
- **Tooling & Deployment:** Git, GitHub, Vercel, Nginx, PM2, Make.com
- **Workflow:** Agile development & delivery

## ✨ Features

- 🌗 Light / dark theme with saved preference and OS-follow fallback
- 🧊 Interactive hero with canvas particle network and custom cursor
- 🎯 Case-study **bento grid** with live category filtering
- 📖 Rich project modals — vision, solution, and metrics breakdowns
- ♿ Accessibility-first: skip link, focus traps, `inert` page locking, reduced-motion support
- 📬 Contact form wired to Formspree

## 📦 Getting Started

The site is static — the Tailwind CSS is precompiled into `output.css`, so it runs straight from `index.html`.

```bash
# Install dependencies (only needed to rebuild the CSS)
npm install

# Rebuild the compiled stylesheet after editing input.css / classes
npm run build:css

# Serve locally (any static server works, e.g.):
npx serve .
```

## 📁 Project Structure

```
index.html            # Single-page markup (all sections)
input.css             # Tailwind source + design tokens & custom styles
output.css            # Compiled stylesheet (committed)
main.js               # Interactions, rendering, modal, theme, particles
portfolio-data.js     # Project data (case studies, personal, mini)
skills-data.js        # Skills grid data
tailwind.config.js    # Tailwind config (design-token colors)
image/ images/        # Static assets
fonts/                # Self-hosted fonts (latin subsets)
```

## 🖼 Open Graph Card (Share Preview)

The share preview shown when the site is pasted into Facebook, LinkedIn, WhatsApp, etc. is defined by the Open Graph `<meta>` tags in the `<head>` of `index.html` and the image at `image/og-image.webp` (1200×630 WebP).

**Relevant tags:** `og:image`, `og:image:type`, `og:image:width`, `og:image:height`, `og:image:alt`, plus `og:title`, `og:description`, `og:locale` and the `twitter:*` equivalents.

### How to regenerate the card image

The editable design source lives in `og-card.html` (uses the site's real fonts, colors, and `image/iftykharalam.webp`). To restyle the preview, edit that file, then re-render it at exactly 1200×630:

```bash
# 1. Render the card with headless Chrome (adjust the chrome path for your OS)
"/c/Program Files/Google/Chrome/Application/chrome.exe" \
  --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 \
  --screenshot="og-card-raw.png" \
  --virtual-time-budget=6000 \
  "file:///path/to/og-card.html"

# 2. Convert the PNG to a compressed WebP (Python + Pillow)
python -c "from PIL import Image; Image.open('og-card-raw.png').convert('RGB').save('image/og-image.webp', 'WEBP', quality=88, method=6)"
rm og-card-raw.png
```

### Why the preview looks stale after changes

Social platforms cache OG previews aggressively (Facebook ~1 week, LinkedIn ~7 days). After deploying, force a re-scrape:

- **Facebook:** <https://developers.facebook.com/tools/debug/> → paste the URL → *Scrape Again*
- **LinkedIn:** <https://www.linkedin.com/post-inspector/> → paste the URL → *Inspect*
- **X/Twitter:** <https://cards-dev.twitter.com/validator> → paste the URL → *Preview card*

## 📬 Contact

- **Email:** [s.m.ifty49@gmail.com](mailto:s.m.ifty49@gmail.com)
- **GitHub:** [https://github.com/iftykhar](https://github.com/iftykhar)
- **LinkedIn:** [https://www.linkedin.com/in/iftykhar-alam/](https://www.linkedin.com/in/iftykhar-alam/)

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
