# cguth7.github.io - GitHub Pages

## Purpose
Personal GitHub Pages site for hosting research dashboards, demos, and project showcases.

**URL:** https://cguth7.github.io

## Directory Structure
```
/
├── index.html          # Main landing page
├── research/           # Research dashboards and visualizations
│   ├── index.html      # Research section index
│   ├── pathway-alignment/   # KEGG/Wiki pathway alignment
│   ├── hippo-image-jaccard/ # Per-image Hippo Jaccard analysis
│   ├── gwas/           # GWAS patent analysis
│   └── serendipity/    # Gene panel analysis
├── demos/              # Interactive demos
├── projects/           # Project showcases
├── data/               # Shared data files and documentation
└── assets/             # CSS, JS, images
```

## Data Separation Pattern

**IMPORTANT:** When creating visualizations, keep data separate from HTML:
- Store data in a `data.json` file alongside `index.html`
- Load data via `fetch('data.json')` in JavaScript
- Don't hardcode data into the HTML file

**Why?**
- Allows data updates without touching visualization code
- Keeps HTML files readable
- Makes it easier to regenerate data from source repos

**Example structure:**
```
research/hippo-image-jaccard/
├── index.html    # Visualization code
└── data.json     # Data (loaded at runtime)
```

## Deployment
Use the `/github-pages` skill which handles:
1. Git add/commit/push
2. Auto-links new pages to main index if needed

Or manually: `git push origin main` (GitHub Pages auto-deploys from main)

## Adding New Research Pages
1. Create directory under `research/`
2. Add `index.html` (visualization) and `data.json` (data)
3. Add link to `research/index.html`
4. Commit and push

## Tech Stack
- Static HTML/CSS/JS (no build step)
- Jekyll config exists but rarely used
- Vanilla JS for interactivity (no frameworks needed for simple dashboards)

---

## Lessons

### Data Loading
- Always use relative paths for data files: `fetch('data.json')` not `/research/.../data.json`
- Handle loading states and errors in JavaScript

### Styling
- Keep CSS inline in HTML for simple pages (no build step needed)
- Use system fonts: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
