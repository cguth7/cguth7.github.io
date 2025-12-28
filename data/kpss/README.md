# KPSS Patent Valuation Data Exploration

## Data Source

**KPSS Patent Values** - Market-based valuations of patents from publicly traded firms

- **Paper**: Kogan, Leonid, Dimitris Papanikolaou, Amit Seru, and Noah Stoffman. "Technological innovation, resource allocation, and growth." *Quarterly Journal of Economics* 132.2 (2017): 665-712.
- **GitHub Repo**: https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data
- **Alternative**: Noah Stoffman's website: https://kelley.iu.edu/nstoffma/
- **Coverage**: 1926-2010 (original), possibly extended to 2018+

## How KPSS Values Are Calculated

**Method**: Stock market event study around patent grant dates

1. Identify patent grant date
2. Calculate 3-day abnormal returns around grant (using market model)
3. Multiply abnormal return × firm market cap = patent value
4. This gives us a dollar estimate of what investors think the patent is worth

**Why this matters**: Gives us a market-based valuation rather than just counting patents

## Expected Data Structure

Based on the KPSS paper, we expect:

- **Patent number** (to merge with our USPTO patents)
- **Patent value** (in dollars)
- **Grant date** (year or exact date)
- **Firm identifier** (PERMNO from CRSP or similar)
- **Possibly**: Standard errors, significance flags, additional firm characteristics

## Data We Need to Extract

### Core Fields:
- Patent number (to merge with `Full_Patent.parquet`)
- Patent value in dollars
- Grant year (for our panel timing)

### Optional Fields:
- Firm identifiers (to understand which firms our patents come from)
- Confidence intervals (to understand measurement error)
- Industry classifications (for heterogeneity analysis)

## Data Structure & Ontology Questions

Key questions to answer when exploring the data:

### 1. **Patent Number Format**
- What format are patent numbers in? (e.g., "1234567", numeric only?)
- Do they match our USPTO patent IDs in `Full_Patent.parquet`?
- Will we need to standardize patent number formats for merging?

### 2. **Coverage & Completeness**
- How many total patents in KPSS data?
- What time period: 1926-2010? Extended to 2018? To 2020?
- What % of our 92K patents will match?
- **Critical**: Does KPSS cover our analysis period (2000-2020)?

### 3. **Value Distribution**
- How many patents have value = 0? (Market didn't react)
- How skewed is the distribution? (Mean vs. Median)
- What are the outliers? (Blockbuster patents worth billions)
- Should we winsorize extreme values?

### 4. **Public Firm Coverage**
- Only covers patents from publicly traded firms
- What % of pharmaceutical patents are from public firms?
- **Bias concern**: Are public firm patents systematically different?
- Missing: University patents, private company patents, individual inventors

### 5. **Measurement Issues**
- Zero values: No market reaction or measurement error?
- Negative values: Are they possible? (Unexpected patent signals overinvestment?)
- Confounding events: What if other news happened on grant date?

## Expected Challenges

### 1. **Time Coverage**
- KPSS original data: 1926-2010
- Our panel: 2000-2020
- **Gap**: 2011-2020 may not be covered
- **Options**:
  - Use KPSS for 2000-2010 subset only
  - Check if extended data exists (2011-2018)
  - Replicate methodology for recent years (requires CRSP access)

### 2. **Match Rate**
- KPSS only includes ~3-4M patents from public firms
- Our data has 92K unique patents
- Expected match rate: 20-40%?
- **Question**: What % of pharma/biotech patents are from public firms?

### 3. **Selection Bias**
- Public firms may be systematically different:
  - Larger R&D budgets
  - More commercially oriented
  - Better patent quality
- If GWAS affects public vs. private firms differently, our estimates are biased

### 4. **Zero Values**
- Many patents have zero estimated value
- Reasons:
  - Market already anticipated the patent
  - Patent granted on non-trading day
  - Long-term value not captured in 3-day window
  - Patent genuinely has low value
- **Question**: Include as zeros or drop from analysis?

## Next Steps (Manual Download Required)

**You'll need to:**
1. Go to https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data
2. Clone the repo or download the patent values file
3. Check Noah Stoffman's website for extended data (2011-2018)
4. Place data files in this directory
5. Run the exploration script (to be created next)

**Once downloaded, we can:**
- Parse the patent value data
- Check time coverage (critical!)
- Calculate match rate with our patents
- Understand value distribution
- Assess feasibility for our analysis

## Alternative: Replicate KPSS Methodology

If KPSS data doesn't extend to 2020, we could replicate:

**Requirements:**
- CRSP stock price data (daily)
- Patent grant dates from USPTO
- Patent-firm matching (USPTO assignee data)
- Event study code (standard finance methodology)

**Feasibility**: Medium difficulty
- Need university CRSP subscription (likely have it)
- Code is relatively standard
- Time consuming: ~1-2 weeks

**Question for user**: Do you have access to CRSP?
