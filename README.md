# Iftykhar Alam — Portfolio

Welcome to my personal portfolio! I'm **S M Iftykhar Ul Alam**, a Full-Stack Developer and UI/UI Designer based in Dhaka, Bangladesh, specializing in high-performance **React / Next.js** frontends and **Laravel**-backed backends.

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

## 📬 Contact

- **Email:** [s.m.ifty49@gmail.com](mailto:s.m.ifty49@gmail.com)
- **GitHub:** [https://github.com/iftykhar](https://github.com/iftykhar)
- **LinkedIn:** [https://www.linkedin.com/in/iftykhar-alam/](https://www.linkedin.com/in/iftykhar-alam/)

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
