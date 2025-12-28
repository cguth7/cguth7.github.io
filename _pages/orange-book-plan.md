---
title: "GWAS Extension: Orange Book & Patent Valuation"
permalink: /orange-book-plan
toc: true
toc_label: "Contents"
toc_sticky: true
---

# Extension Plan: Valuing GWAS Spillovers Using Orange Book & KPSS Data
*Created: December 28, 2025*

---

## Executive Summary

This document outlines two extensions to the GWAS spillover project that move beyond counting patents to **valuing** them. Both approaches follow Azoulay et al. (2019, Restud) by focusing on economically important patents rather than treating all patents equally.

**Current approach**: Measure GWAS treatment effects on patent counts at the gene-disease (G-D) level

**Proposed extensions**:
1. **Orange Book approach**: Focus only on FDA-approved drug patents (the most valuable patents)
2. **KPSS approach**: Weight patents by their market value (dollar-denominated outcomes)

---

## Context: What We Currently Have

### The GWAS Spillover Panel

Our current analysis uses a balanced panel with:
- **148M observations** (7M gene-disease pairs × 21 years, 2000-2020)
- **Outcome variable**: Patent counts at the G-D-year level
- **Treatment**: GWAS discoveries, classified as:
  - Direct GWAS hits (35K pairs)
  - 1-hop spillovers (189K pairs)
  - 2-hop spillovers (814K pairs)
  - 3-hop spillovers (1.02M pairs)
- **Spillover definition**: Network distance in KEGG pathways graph

### Current Identification

We run a difference-in-differences (DID) specification:

```
patents_gdt = β × post_GWAS_gdt + γ_gt + δ_dt + ε_gdt
```

Where:
- `patents_gdt` = patent count for gene g, disease d, year t
- `post_GWAS_gdt` = indicator for whether G-D pair has been "treated" by GWAS
- `γ_gt` = gene-year fixed effects
- `δ_dt` = disease-year fixed effects

**β captures the causal effect of GWAS discoveries on related patenting activity**

---

## What Azoulay et al. (2019) Did

### The Paper: "Public R&D Investments and Private-Sector Patenting"

**Citation**: Azoulay, Pierre, Joshua S. Graff Zivin, Danielle Li, and Bhaven N. Sampat. "Public R&D investments and private-sector patenting: evidence from NIH funding shocks." *Review of Economic Studies* 86.1 (2019): 117-152.

### Section 5.4: Orange Book Patents (page 146)

**Key insight**: Not all patents are equally valuable. Patents that protect FDA-approved drugs represent the commercial pinnacle of pharmaceutical innovation.

**What they did**:
1. Obtained FDA's "Orange Book" - official list of approved drugs with associated patents
2. Matched Orange Book patents to their NIH grant-funded research
3. Re-ran their analysis using Orange Book patents as the outcome
4. Found that NIH grants have **larger effects on high-value patents** than on average patents

**Why this matters for us**: If GWAS discoveries have differential effects on high-value vs. average patents, we're missing important heterogeneity by lumping all patents together.

---

## Extension 1: Orange Book Approach

### Concept

Build a parallel analysis focusing exclusively on FDA-approved drug patents. These are the patents that made it through clinical trials and reached market - representing the upper tail of innovation value.

### Methodology

1. **Get Orange Book data** at the patent level
2. **Merge** with our current BioBERT patent-gene-disease mappings
3. **Create sparse panel**: Same G-D-year structure, but outcome = Orange Book patent counts
4. **Run identical DID** specification:

```
OB_patents_gdt = β_OB × post_GWAS_gdt + γ_gt + δ_dt + ε_gdt
```

5. **Compare β_OB to β_all**:
   - If β_OB > β_all: GWAS has larger effects on high-value patents
   - Interpretation: GWAS discoveries guide R&D toward commercially successful outcomes

### Expected Panel Characteristics

- **Much sparser** than current panel (Orange Book has ~3,000 patents vs. our 92K)
- **More zeros**: Most G-D-year cells will have zero Orange Book patents
- **Higher value per patent**: Each patent represents a marketed drug

### Data Source: FDA Orange Book

**Official source**: [FDA Orange Book](https://www.fda.gov/drugs/drug-approvals-and-databases/approved-drug-products-FDA-approved-drugs-orange-book)

**Available formats**:
- Download page: https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files
- Direct download: https://www.fda.gov/media/76860/download (full database, updated monthly)

**Data structure**:
- `products.txt` - approved drug products
- `patent.txt` - patent numbers and expiration dates
- `exclusivity.txt` - market exclusivity information

**Key fields we need**:
- Patent numbers (to merge with USPTO data)
- Approval dates
- Active ingredients (to link to genes/diseases)

**Merge strategy**:
1. Extract patent numbers from Orange Book
2. Match to our `Full_Patent.parquet` using patent IDs
3. Keep only patents that appear in both datasets
4. These patents already have BioBERT gene-disease extractions

### Implementation Steps

#### Step 1: Download and Process Orange Book (1-2 hours)
```python
# Download from FDA
# Parse patent.txt and products.txt
# Extract unique patent numbers
# Create mapping: patent_id -> approval_year, drug_name, active_ingredient
```

#### Step 2: Merge with Our Patent Data (1 hour)
```python
# Load Full_Patent.parquet (our BioBERT extractions)
# Filter to only Orange Book patents
# Keep gene-disease-patent-year structure
# Apply same 99% probability threshold
```

#### Step 3: Build Orange Book Panel (2 hours)
```python
# Create balanced panel: all G-D pairs × all years (2000-2020)
# Aggregate Orange Book patents by G-D-year
# Most cells will be zero (sparse)
# Add same spillover treatment indicators as main analysis
```

#### Step 4: Run DID Regressions (1 hour)
```stata
# Same specification as main analysis
# Outcome: OB_patent_count instead of patent_count
# Compare coefficients
```

### Pricing the Effects (Azoulay's Method)

Azoulay et al. price their effects using average patent values from prior literature.

**Our approach**:
1. **Baseline**: Use average Orange Book patent value from literature
   - Harhoff et al. (1999): Patent values are log-normally distributed
   - Average pharmaceutical patent value: ~$10-20M (outdated, need 2020s estimate)

2. **Direct pricing**:
   - Each Orange Book patent protects a marketed drug
   - Could manually lookup first-year sales for subset of drugs
   - Use as benchmark for "value per Orange Book patent"

3. **Calculate economic value**:
   - If β_OB = 0.5 (GWAS increases Orange Book patents by 0.5 per G-D pair)
   - And average value = $15M per Orange Book patent
   - Then value created = 0.5 × $15M = $7.5M per treated G-D pair

### Expected Challenges

1. **Sparsity**: Orange Book has ~3,000 patents, we have 7M G-D pairs
   - Most pairs will have zero Orange Book patents in all years
   - Need Poisson or negative binomial models (not OLS)
   - Statistical power will be limited

2. **Merge rate**: Not all Orange Book patents will match our data
   - Some may pre-date our panel (before 2000)
   - Some may not mention genes/diseases in patent text
   - Expected match rate: 30-50%?

3. **Timing**: Orange Book lists patents by approval date, not grant date
   - Need to decide: use approval year or grant year?
   - Probably use approval year (economically relevant timing)

---

## Extension 2: KPSS Patent Valuation Approach

### Concept

Instead of counting patents, weight each patent by its estimated market value. This gives us a **dollar-denominated outcome**: the change in innovation value, not just innovation quantity.

### The KPSS Data

**Source**: Kogan, Leonid, Dimitris Papanikolaou, Amit Seru, and Noah Stoffman. "Technological innovation, resource allocation, and growth." *Quarterly Journal of Economics* 132.2 (2017): 665-712.

**What it provides**: Market value of each patent granted to publicly traded US firms (1926-2010, extended to 2018)

**How values are calculated**:
- Use stock market reactions around patent grants
- 3-day event window around grant announcement
- Aggregate market cap change = implied value of patent
- Accounts for investor expectations about commercial value

**Data location**:
- Original paper: https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data
- Extended data (through 2018): Available from Noah Stoffman's website
- File format: Patent number → dollar value

**Coverage**: ~3-4 million patents from publicly traded firms

### Methodology

1. **Merge KPSS values** with our patent-gene-disease data
2. **Create value-weighted panel**:
   - Instead of counting patents: sum patent values by G-D-year
   - Outcome: `patent_value_gdt` = Σ(KPSS value) for all patents mentioning G-D in year t

3. **Run DID with dollar outcomes**:

```
patent_value_gdt = β_value × post_GWAS_gdt + γ_gt + δ_dt + ε_gdt
```

4. **Rescale** by median G-D mentions per patent:
   - Current median: ~110 mentions per patent (from patent-analysis page)
   - Interpretation: β_value measures dollars per G-D mention
   - Multiply by median to get "dollars per patent"

### Data Sources

#### Primary: KPSS GitHub Repository
- **URL**: https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data
- **Files needed**:
  - `patent_values.csv` - patent number → dollar value
  - Documentation on methodology
- **Coverage**: 1926-2010 (original), extended versions available through 2018

#### Extended Data (2018+)
- Check Noah Stoffman's website: https://kelley.iu.edu/nstoffma/
- NBER Patent Data Project may have merged KPSS values
- Kogan et al. may have unpublished updates

#### Alternative: Replicate KPSS Methodology
If KPSS data doesn't cover our time period (2000-2020), we could replicate:
1. Get patent grant dates from USPTO
2. Get stock prices from CRSP for assignee firms
3. Calculate 3-day abnormal returns around grant dates
4. Multiply by market cap to get patent value

**Feasibility**: Medium difficulty, requires:
- CRSP stock price data (available via university subscription)
- Patent-firm matching (from USPTO)
- Event study code (standard in finance)

### Implementation Steps

#### Step 1: Download KPSS Data (1 hour)
```python
# Clone GitHub repo
# Load patent_values.csv
# Check coverage: how many of our 92K patents have KPSS values?
# Check time coverage: does it extend to 2020?
```

#### Step 2: Merge with Our Data (2 hours)
```python
# Load Full_Patent.parquet
# Merge KPSS values by patent_id
# Check match rate
# For unmatched patents: value = 0 (conservative) or drop?
```

#### Step 3: Build Value-Weighted Panel (2 hours)
```python
# Aggregate KPSS values by G-D-year
# Create panel: G-D pairs × years
# Outcome = total dollar value of patents mentioning G-D in year t
# Add spillover treatment indicators
```

#### Step 4: Run DID Regressions (1 hour)
```stata
# Same specification as main analysis
# Outcome: patent_value instead of patent_count
# Interpret β as "dollars of innovation value created"
```

#### Step 5: Rescaling (30 minutes)
```python
# Current median mentions per patent: 110 (from patent-analysis)
# If β_value = $1M (increase in total value per G-D pair)
# Then value per patent = $1M / 110 = $9,091 per patent
# Compare to literature benchmarks
```

### Expected Challenges

1. **Coverage**: KPSS only includes public firms
   - Our 92K patents may have low match rate with KPSS
   - Expected match rate: 20-40%?
   - Missing: patents from private firms, universities, individuals
   - **Bias**: Public firm patents may be systematically different

2. **Time period**: KPSS data may not extend to 2020
   - Original: 1926-2010
   - Extended: possibly to 2018
   - Our panel: 2000-2020
   - May need to replicate methodology for recent years

3. **Zero values**: Many patents have zero estimated value in KPSS
   - Stock market doesn't react to every patent
   - Zero value ≠ worthless, could mean:
     - Patent granted on non-trading day
     - Market already anticipated the patent
     - Patent has long-term value not captured in 3-day window

4. **Skewness**: Patent values are extremely right-skewed
   - Mean >> Median
   - A few blockbuster patents dominate
   - Need robust regression methods (winsorizing, quantile regression)

### Extensions to KPSS: Private Firm Patents?

**Question**: Has anyone extended KPSS to non-public firms?

**Possible sources to investigate**:

1. **Venture capital data**:
   - VentureXpert, Pitchbook have funding rounds
   - Could estimate patent value from VC valuations?
   - Requires matching patents → startups → VC deals

2. **Acquisition data**:
   - When private firms are acquired, deal values become public
   - Could allocate acquisition value across firm's patent portfolio
   - Sources: SDC Platinum, CapitalIQ

3. **NPE (Non-Practicing Entity) data**:
   - Patent trolls buy and monetize patents
   - Licensing/litigation settlements provide value signals
   - Data from Stanford NPE database, RPX

4. **Literature search**:
   - Google Scholar: "patent value" + "private firms" + post-2017
   - Check citations to KPSS (2017) for methodological extensions
   - NBER working papers on innovation valuation

**Recommended**: Start with public firm data (KPSS), acknowledge limitation, suggest private firm extension as future work.

---

## Data Acquisition Plan

### Orange Book Data

**Timeline**: 1-2 hours

**Steps**:
1. Download from FDA: https://www.fda.gov/media/76860/download
2. Unzip and inspect files:
   - `patent.txt`
   - `products.txt`
   - `exclusivity.txt`
3. Parse into pandas DataFrame
4. Extract patent numbers and approval dates
5. Merge with our patent IDs (from Full_Patent.parquet)

**Expected output**:
- ~3,000 Orange Book patents
- ~500-1,500 matched with our BioBERT extractions (rough estimate)

### KPSS Data

**Timeline**: 2-3 hours

**Steps**:
1. Clone GitHub repo: `git clone https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data`
2. Locate patent value file (likely CSV or Stata format)
3. Check documentation for:
   - Time coverage
   - Data structure
   - Known limitations
4. Load into pandas
5. Merge with our patent IDs
6. Calculate match rate and coverage

**Expected output**:
- 3-4M KPSS patent values (original data)
- Unknown match rate with our 92K patents (need to check)
- Possible coverage gaps after 2010

**If KPSS data is outdated**:
- Option A: Use it for 2000-2010 subset of our panel
- Option B: Replicate methodology for 2011-2020 (requires CRSP data)
- Option C: Acknowledge limitation, treat missing = zero value

---

## Implementation Timeline

### Phase 1: Data Acquisition (1 week)

**Day 1-2: Orange Book**
- [ ] Download FDA Orange Book data
- [ ] Parse patent and product files
- [ ] Document data structure
- [ ] Create patent ID → drug name mapping

**Day 3-4: KPSS**
- [ ] Clone KPSS GitHub repo
- [ ] Load patent value data
- [ ] Check time coverage and match rate with our patents
- [ ] Document any coverage gaps

**Day 5: Integration**
- [ ] Merge Orange Book patents with Full_Patent.parquet
- [ ] Merge KPSS values with Full_Patent.parquet
- [ ] Calculate descriptive statistics for both datasets
- [ ] Document match rates and coverage

### Phase 2: Panel Construction (1 week)

**Day 1-2: Orange Book Panel**
- [ ] Create balanced G-D-year panel
- [ ] Aggregate Orange Book patent counts by G-D-year
- [ ] Add spillover treatment indicators
- [ ] Calculate summary statistics

**Day 3-4: KPSS Value Panel**
- [ ] Create balanced G-D-year panel
- [ ] Aggregate KPSS patent values by G-D-year
- [ ] Add spillover treatment indicators
- [ ] Calculate summary statistics

**Day 5: Validation**
- [ ] Compare panels to original main analysis
- [ ] Check for data quality issues
- [ ] Document any anomalies

### Phase 3: Analysis (1 week)

**Day 1-2: Orange Book Regressions**
- [ ] Run DID specification with Orange Book counts
- [ ] Compare coefficients to main analysis
- [ ] Test robustness (Poisson, negative binomial)
- [ ] Create event study plots

**Day 3-4: KPSS Value Regressions**
- [ ] Run DID specification with KPSS values
- [ ] Rescale by median G-D mentions per patent
- [ ] Test robustness (winsorizing, quantile regression)
- [ ] Create event study plots

**Day 5: Synthesis**
- [ ] Compare all three approaches:
  - Main analysis (all patents)
  - Orange Book (high-value patents)
  - KPSS (dollar-weighted patents)
- [ ] Calculate economic magnitudes
- [ ] Draft results summary

### Phase 4: Documentation (3 days)

**Day 1: Methods**
- [ ] Write up Orange Book methodology
- [ ] Write up KPSS methodology
- [ ] Document data sources and merge procedures

**Day 2: Results**
- [ ] Create results tables
- [ ] Create figures (event studies, comparisons)
- [ ] Write results summary

**Day 3: Integration**
- [ ] Update main paper draft with new sections
- [ ] Create appendix with robustness checks
- [ ] Prepare slides for professor

---

## Expected Results & Interpretation

### Orange Book Results

**Hypothesis**: β_OB > β_all (larger effects on FDA-approved drug patents)

**Interpretation if confirmed**:
- GWAS discoveries don't just increase patent quantity
- They specifically guide R&D toward commercially successful outcomes
- Knowledge spillovers translate to market-ready products
- Social value of GWAS > what patent counts alone suggest

**Economic magnitude**:
- If β_OB = 0.3 (30% increase in Orange Book patents per treated G-D pair)
- Average Orange Book patent value = $15M (literature estimate)
- Value created = 0.3 × $15M = $4.5M per treated G-D pair
- With 35K direct GWAS pairs: total value = 0.3 × 35K × $15M = $157.5B

### KPSS Results

**Hypothesis**: β_value shows economically significant innovation value creation

**Interpretation**:
- GWAS discoveries increase the market value of innovation, not just quantity
- Dollar estimates are directly policy-relevant
- Can compare to cost of GWAS studies (typically ~$1-5M each)
- Calculate ROI of public genomics research

**Economic magnitude**:
- If β_value = $500K (increase in patent value per treated G-D pair)
- Median G-D mentions per patent = 110
- Implied value per patent = $500K / 110 = $4,545
- Compare to KPSS mean (~$1-2M) and median (~$50K)

### Comparison Across Approaches

| Approach | Outcome | Interpretation | Strengths | Limitations |
|----------|---------|----------------|-----------|-------------|
| **Main (current)** | Patent counts | Innovation quantity | Full coverage, clean | Treats all patents equally |
| **Orange Book** | FDA patent counts | Commercial success | High-value focus | Very sparse, small sample |
| **KPSS** | Patent dollar value | Market value | Economic magnitude | Public firms only, possibly outdated |

**Robustness check**: If all three show consistent positive effects, very strong evidence that GWAS creates real economic value.

---

## Key Questions to Resolve

### Methodological

1. **Orange Book timing**: Use patent grant year or drug approval year?
   - Grant year: consistent with main analysis
   - Approval year: economically relevant (market entry)
   - **Recommendation**: Try both, probably use approval year

2. **KPSS zeros**: How to handle patents with zero estimated value?
   - Include as zeros (conservative)
   - Drop (selection bias)
   - **Recommendation**: Include as zeros, test robustness

3. **Rescaling**: What denominator for "per patent" calculation?
   - Median mentions per patent (current approach)
   - Mean mentions per patent
   - **Recommendation**: Use median (robust to outliers)

### Data

4. **KPSS coverage**: Does it extend to 2020?
   - If not, subset analysis to 2000-2010?
   - Or attempt to replicate for 2011-2020?
   - **Next step**: Check GitHub repo and Stoffman's website

5. **Orange Book match rate**: How many OB patents have BioBERT extractions?
   - Expected: 30-50%?
   - **Next step**: Run merge and check

6. **Private firm extensions**: Can we extend KPSS to non-public firms?
   - **Next step**: Literature search + contact KPSS authors?

---

## Success Criteria

**Minimum viable product**:
- [ ] Orange Book panel constructed and merged
- [ ] KPSS values merged (even if partial coverage)
- [ ] DID regressions run for both approaches
- [ ] Results compared to main analysis
- [ ] Economic magnitudes calculated

**Stretch goals**:
- [ ] Extend KPSS to recent years (2011-2020)
- [ ] Find private firm patent valuations
- [ ] Calculate formal ROI of GWAS research
- [ ] Compare to Azoulay et al. estimates for NIH grants

---

## References

### Core Papers

**Azoulay et al. (2019)**: Public R&D Investments and Private-Sector Patenting
- *Review of Economic Studies* 86(1): 117-152
- Section 5.4 on Orange Book patents (page 146)
- Shows NIH grants have larger effects on FDA-approved drug patents

**Kogan et al. (2017)**: Technological Innovation, Resource Allocation, and Growth
- *Quarterly Journal of Economics* 132(2): 665-712
- Creates patent value estimates using stock market reactions
- Data: https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data

### Data Sources

**FDA Orange Book**:
- Homepage: https://www.fda.gov/drugs/drug-approvals-and-databases/approved-drug-products-FDA-approved-drugs-orange-book
- Download: https://www.fda.gov/media/76860/download
- Updated: Monthly

**KPSS Patent Values**:
- GitHub: https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data
- Contact: Noah Stoffman (Kelley School of Business, Indiana University)

### Methodological References

**Patent valuation literature**:
- Harhoff et al. (1999): Citation frequency and patent value. *Review of Economics and Statistics*
- Trajtenberg (1990): Economic Analysis of Product Innovation. Harvard University Press
- Hall, Jaffe, Trajtenberg (2005): Market value and patent citations. *RAND Journal*

---

## Next Steps (Immediate)

### This Week

1. **Download Orange Book data** (2 hours)
   - Parse patent and product files
   - Document structure
   - Check match rate with our patents

2. **Download KPSS data** (2 hours)
   - Clone GitHub repo
   - Load patent values
   - Check coverage (time period and match rate)
   - Contact authors if needed for updated data

3. **Preliminary merges** (2 hours)
   - Merge Orange Book patents → Full_Patent.parquet
   - Merge KPSS values → Full_Patent.parquet
   - Calculate match rates
   - Document coverage statistics

4. **Update professor** (1 hour)
   - Report match rates and coverage
   - Flag any data availability issues
   - Confirm methodology before proceeding to panel construction

### Next Week

5. **Build Orange Book panel**
6. **Build KPSS value panel**
7. **Run preliminary regressions**
8. **Draft results summary**

---

## Questions for Professor

Before proceeding, confirm:

1. **Orange Book timing**: Patent grant year or drug approval year for treatment timing?

2. **KPSS coverage**: If data only goes to 2010, subset our analysis to 2000-2010 for comparability?

3. **Sparsity**: Orange Book panel will be very sparse. Okay to use Poisson/NB models instead of OLS?

4. **Comparison**: Present all three approaches (count, Orange Book, KPSS) as complementary robustness checks, or separate analyses?

5. **Azoulay pricing**: Use their literature-based patent values, or develop our own estimates?

---

*This plan will be updated as we acquire data and learn about coverage/match rates.*
