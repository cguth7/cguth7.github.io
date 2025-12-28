# Research Page Templates

Standardized templates for posting medical research data (GWAS, AlphaFold, gene analysis, etc.)

## Quick Start

1. Copy `research-page.html` to your research subdirectory
2. Update the title, content, and data
3. Save figures as PNG in the same directory
4. That's it - GitHub Pages will serve it

## Components

### Stat Cards
```html
<div class="stat-card">
    <div class="stat-value">1,234</div>
    <div class="stat-label">Your Metric</div>
</div>
```

### Key Finding Box
```html
<div class="key-finding">
    <h3>Key Finding</h3>
    <p>Important insight here.</p>
</div>
```

### Figure with Caption
```html
<div class="figure">
    <img src="figure1.png" alt="Description">
    <p class="caption"><strong>Figure 1:</strong> Explanation.</p>
</div>
```

### Data Table
```html
<table>
    <thead>
        <tr><th>Column 1</th><th>Column 2</th></tr>
    </thead>
    <tbody>
        <tr><td>Data</td><td>More data</td></tr>
    </tbody>
</table>
```

### Code Block
```html
<pre><code>your code here</code></pre>
```

## Design System

**Colors:**
- Blue: #2563eb (primary accent)
- Green: #16a34a (success, key findings)
- Yellow: #ca8a04 (warnings)
- Red: #dc2626 (errors)

**Fonts:**
- Body: System fonts (-apple-system, etc.)
- Code: JetBrains Mono, Monaco

**Layout:**
- Max width: 1200px
- Padding: 2rem
- Mobile breakpoint: 768px

## Workflow

From Claude/vim:
1. Generate your figures (matplotlib → PNG)
2. Export tables (pandas → CSV or HTML)
3. Drop everything in a new directory under `research/`
4. Copy template, update content
5. Push to GitHub → instant hosted page

No IDE needed!
