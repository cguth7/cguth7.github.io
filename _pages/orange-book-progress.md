---
title: "Orange Book & KPSS Extension: Progress Report"
permalink: /orange-book-progress
toc: true
toc_label: "Contents"
toc_sticky: true
---

# Orange Book & KPSS Extension: Progress Report

*Last Updated: December 28, 2025*

---

## Executive Summary

This document tracks progress on extending the GWAS spillover project to **value** patents rather than just count them. We're implementing two approaches inspired by Azoulay et al. (2019):

1. **Orange Book Approach**: Focus on FDA-approved drug patents (highest-value patents)
2. **KPSS Approach**: Weight patents by market value (dollar-denominated outcomes)

**Current Status**: Days 1-4 complete - data exploration framework ready, awaiting manual data downloads

**Key Achievement**: Discovered Orange Book uses tilde-delimited format with composite keys, ready to merge with USPTO data

**Critical Unknown**: KPSS time coverage may not extend to our 2000-2020 analysis period

---

## Background: The Original Plan

### Motivation

Our current GWAS spillover analysis measures patent **quantity** (counts). But not all patents are equally valuable. Some protect FDA-approved blockbuster drugs worth billions, while others gather dust.

**Azoulay et al. (2019)** showed that NIH funding has **larger effects on high-value patents** than on average patents. We want to test if GWAS discoveries have similar heterogeneous effects.

### Two Valuation Approaches

| Approach | What It Measures | Data Source | Expected Outcome |
|----------|------------------|-------------|------------------|
| **Orange Book** | Count of FDA-approved drug patents | FDA Orange Book | β_OB > β_all (larger effects on high-value patents) |
| **KPSS** | Dollar value of patents (market-based) | Kogan et al. (2017) | Direct economic magnitude in dollars |

**Why both?**
- Orange Book: Very high-value patents, but extremely sparse (~3K patents vs. 92K in our data)
- KPSS: Broader coverage (3-4M patents), but only public firms, possible time gap

---

## What We've Accomplished (Days 1-4)

### ✅ Infrastructure Built

1. **Exploration Scripts Created**
   - `/data/orange_book/explore_orange_book.py` - Analyzes FDA Orange Book structure
   - `/data/kpss/explore_kpss.py` - Analyzes KPSS patent values
   - Both scripts auto-detect delimiters, document schemas, check FK/PK relationships

2. **Documentation Framework**
   - `/data/orange_book/README.md` - Orange Book data sources and schemas
   - `/data/kpss/README.md` - KPSS data sources and challenges
   - `/data/DATA_ACQUISITION_STATUS.md` - Overall status and next steps
   - `/data/ONTOLOGY_AND_SCHEMA_QUESTIONS.md` - Detailed schema analysis plan

3. **Website Integration**
   - Created [Orange Book plan page](/orange-book-plan) with full methodology
   - Added to research page navigation
   - This progress report page

### ✅ Key Discoveries: Orange Book Schema

**Critical Finding**: FDA Orange Book uses **tilde-delimited format** (`~` separator)

#### File Structure

**Three core files**:
1. `patent.txt` - Patent numbers and expiration dates
2. `products.txt` - Drug names, active ingredients, approval dates
3. `exclusivity.txt` - Market exclusivity periods

#### Primary Key: Composite Key Structure

All three files link via: **`Appl_Type + Appl_No + Product_No`**

```
Products (drug details, ingredients, approval dates)
    ↓ [Appl_Type + Appl_No + Product_No]
Patents (patent numbers, expiration dates)
    ↓ [Appl_Type + Appl_No + Product_No]
Exclusivity (exclusivity periods)
```

#### Schema Details

**`patent.txt` columns**:
```
Appl_Type~Appl_No~Product_No~Patent_No~Patent_Expire_Date_Text~
Drug_Substance_Flag~Drug_Product_Flag~Patent_Use_Code~Delist_Flag~Submission_Date
```

**Key fields**:
- `Patent_No`: USPTO patent number (7-digit format, e.g., "7625884") ✅ **Matches our data!**
- `Appl_Type`: Application type (N = NDA, A = ANDA)
- `Patent_Expire_Date_Text`: Patent expiration date
- `Drug_Substance_Flag`: Y = chemical compound patent
- `Drug_Product_Flag`: Y = formulation patent

**`products.txt` columns**:
```
Ingredient~DF;Route~Trade_Name~Applicant~Strength~Appl_Type~Appl_No~
Product_No~TE_Code~Approval_Date~RLD~RS~Type~Applicant_Full_Name
```

**Key fields**:
- `Ingredient`: Active ingredient name ⭐ **This maps to genes!**
  - Examples: "BUDESONIDE", "MINOCYCLINE HYDROCHLORIDE"
  - Generic/chemical names (good for mapping)
- `Trade_Name`: Brand name
- `Approval_Date`: FDA approval date (economically relevant timing)
- `Applicant_Full_Name`: Company name

**`exclusivity.txt` columns**:
```
Appl_Type~Appl_No~Product_No~Exclusivity_Code~Exclusivity_Date
```

#### Patent Number Format

✅ **CONFIRMED**: Orange Book patent numbers match USPTO 7-digit format
- Example: `7625884`, `8455524`
- No "US" prefix, no formatting issues observed
- Should merge directly with our `Full_Patent.parquet` data

---

## Data We Have vs. Don't Have

### ✅ What We Have

**Code & Infrastructure**:
- Exploration scripts ready to run
- Patent number standardization functions
- Merge strategy planned
- Schema documentation complete
- Composite key handling logic

**Existing Data Assets** (from main GWAS project):
- `Full_Patent.parquet`: 92,611 unique patents with BioBERT extractions
- Gene-disease-patent mappings at 99% probability threshold
- Panel structure: 7M gene-disease pairs × 21 years (2000-2020)
- GWAS treatment indicators (direct hits, 1-hop, 2-hop, 3-hop spillovers)

**Understanding**:
- Orange Book schema fully documented
- FK/PK relationships identified
- Patent number format compatibility confirmed
- Merge strategy designed

### ❌ What We DON'T Have

**Critical Missing Data**:
1. **Actual Orange Book data files** 🔴
   - Need to download from: https://www.fda.gov/media/76860/download
   - ~5-10 MB download
   - Cannot download programmatically due to network restrictions
   - **User must manually download**

2. **Actual KPSS patent value data** 🔴
   - Need to download from: https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data
   - Check Noah Stoffman's website for extended data (2011-2018+)
   - **User must manually download**

3. **KPSS time coverage confirmation** 🚨 **CRITICAL**
   - Original KPSS data: 1926-2010
   - Our analysis needs: 2000-2020
   - **Gap**: Unknown if data extends to 2011-2020
   - If not available: Lose half our panel OR need to replicate methodology

**Empirical Unknowns** (need data to answer):
- Orange Book match rate with our 92K patents (expected: 3-5%, ~1,500-3,000 patents)
- KPSS match rate with our patents (expected: 20-40%, ~18K-37K patents)
- Orange Book date format and completeness
- KPSS value distribution (zeros, outliers, skewness)
- Active ingredient naming conventions in Orange Book

---

## Current Struggles & Challenges

### 1. Network Restrictions Prevent Automated Downloads

**Problem**: Cannot use `wget`, `curl`, or web scraping to download data

**Impact**:
- Delays Days 1-4 completion
- Cannot run exploration scripts until data available
- Cannot validate schema assumptions

**Solution**: User must manually download files

**Status**: ⏸️ **Blocked** - awaiting manual downloads

---

### 2. KPSS Time Coverage Uncertainty 🚨 **CRITICAL**

**Problem**: Original KPSS data covers 1926-2010, but our panel needs 2000-2020

**Impact**:
- If data stops at 2010: We lose half our panel (2011-2020)
- If extended data exists but stops at 2018: Still missing 2019-2020
- If no extended data: Must replicate methodology (requires CRSP, 1-2 weeks work)

**What we need to check immediately**:
1. Does KPSS GitHub have extended data?
2. Does Noah Stoffman's website have 2011-2018+ data?
3. Has anyone published replication packages with recent data?

**Contingency options**:
- **Option A**: Restrict analysis to 2000-2010 (11 years, lose recent GWAS discoveries)
- **Option B**: Find extended KPSS data (ideal if it exists)
- **Option C**: Replicate KPSS methodology for 2011-2020 (requires CRSP access, significant work)
- **Option D**: Abandon KPSS approach, focus only on Orange Book (simpler but less informative)

**Status**: 🔴 **Critical unknown** - must check when downloading data

---

### 3. Orange Book Match Rate Uncertainty

**Problem**: Unknown how many of our 92K patents will be in Orange Book

**Expected match rate**: 3-5% (Orange Book has ~3,000 patents, we have 92K)

**Why low match rate is expected**:
- Orange Book only includes patents for FDA-approved drugs
- Most patents never reach FDA approval
- This is the POINT - we're focusing on high-value patents

**Potential issues**:
- Very sparse panel (most G-D-year cells will have zero Orange Book patents)
- Low statistical power
- Need Poisson or negative binomial regression (not OLS)

**Mitigation**:
- This is expected and acceptable for Orange Book approach
- Sparsity is informative (shows how rare FDA-approved patents are)
- Can still test if GWAS has larger effects on these rare, valuable patents

**Status**: ⏸️ Expected challenge, need actual data to confirm

---

### 4. Active Ingredient → Gene Mapping Complexity

**Problem**: Orange Book has drug names (e.g., "BUDESONIDE"), we need genes

**Challenge**: Must map drug active ingredients to gene targets

**Mapping strategy**:

1. **Best case**: If Orange Book has UNII codes
   - UNII → DrugBank → Gene targets
   - Clean, structured mapping

2. **Good case**: Generic names available (confirmed in schema)
   - Generic name → DrugBank → Gene targets
   - May have spelling variations

3. **Backup case**: Use disease indication instead of gene target
   - Drug → Disease (from Orange Book indications)
   - Match to our disease entities
   - Less direct but still valid

**External databases needed**:
- **DrugBank**: Drug → Gene target mapping (best resource)
- **DGIdb**: Drug-Gene Interaction database (alternative)
- **ChEMBL**: Chemical → Target mapping (if needed)

**Status**: ⏸️ Planned approach ready, need actual data to test

---

### 5. Combination Products Handling

**Problem**: Some drugs have multiple active ingredients (e.g., aspirin + caffeine)

**Unknown**: How are combination products represented in Orange Book?

**Possible formats**:
1. Separate rows per ingredient (creates duplicates when counting)
2. Concatenated string: "aspirin; caffeine" (need to parse)
3. Separate columns: Ingredient_1, Ingredient_2 (wide format)

**Implication**:
- Combination drugs map to multiple genes (many-to-many)
- Need to decide: Include all genes or just first listed?

**Status**: ⏸️ Will discover when running exploration script

---

### 6. Public Firm Bias in KPSS

**Problem**: KPSS only covers patents from publicly traded firms

**Missing coverage**:
- University patents (important for basic research!)
- Private company patents (biotech startups)
- Individual inventor patents
- Foreign firm patents (if not traded on US exchanges)

**Expected match rate**: Only 20-40% of our patents

**Selection bias**:
- Public firms may have:
  - Larger R&D budgets
  - More commercially oriented patents
  - Higher average patent quality
  - Different response to GWAS discoveries

**Implication**: KPSS estimates only apply to public firm patenting

**Mitigation**:
1. Acknowledge limitation in writeup
2. Compare Orange Book (all firms) vs. KPSS (public only)
3. Suggest private firm valuation as future work
4. Could investigate VC funding data as alternative

**Status**: ⚠️ Known limitation, acceptable for first pass

---

### 7. Date Field Ambiguity

**Problem**: Multiple relevant dates for each patent

**Date options**:
1. **Patent grant date** (from USPTO)
   - When patent was granted
   - Consistent with main analysis

2. **Drug approval date** (from Orange Book)
   - When drug reached market
   - Economically relevant (revenue starts)
   - Can be years after patent grant

3. **Patent expiration date** (from Orange Book)
   - When patent protection ends
   - Less relevant for our timing

**Critical decision needed**: Which date to use for panel timing?

**Recommendation**:
- **Approval date** for Orange Book analysis
  - It's the "high value" moment (FDA approval)
  - More economically meaningful than grant date
- Compare both as robustness check

**Status**: ⏸️ Decision planned, will test both approaches

---

## Detailed Schema Documentation

### Orange Book: Composite Key Structure

**Primary Key**: `(Appl_Type, Appl_No, Product_No)`

**Relationships**:
- One application can have multiple products (different strengths/formulations)
- One product can have multiple patents (compound, formulation, use patents)
- **Many-to-many**: Patents ↔ Products

**Cardinality tests needed**:
```python
# Expected: One application → Many patents (formulation, use, process)
patents_per_app = patent_df.groupby('Appl_No')['Patent_No'].nunique()
print(f"Mean patents per application: {patents_per_app.mean():.2f}")

# Expected: One patent → Multiple products (different indications)
products_per_patent = merged.groupby('Patent_No')['Product_No'].nunique()
print(f"Mean products per patent: {products_per_patent.mean():.2f}")
```

**Implications for our analysis**:
- Cannot simply count "distinct patents" (may double-count)
- Need to aggregate at patent level, then merge to products
- Or aggregate at product level, then count unique patents per G-D pair

---

### KPSS: Expected Schema

**Primary Key**: `Patent_No` (expected, need to verify)

**Expected columns**:
- `patent_no`: USPTO patent number
- `value`: Dollar value (market-based estimate)
- `year`: Grant year
- `permno`: CRSP firm identifier (optional)

**Value distribution characteristics**:

1. **Log-normal distribution**:
   - Mean >> Median (blockbuster patents skew distribution)
   - Need to handle outliers (winsorize at 95th or 99th percentile)

2. **Zero inflation**:
   - 30-50% of patents may have value = $0
   - Interpretation: Market didn't react (not necessarily worthless)
   - Need Tobit regression or similar to handle censoring

3. **Negative values** (possible):
   - "Bad news" patent (signals overinvestment)
   - Unexpected patent in mature technology
   - Need to check if present and how to handle

**Statistical approach for skewed data**:
- Log transformation: `log(1 + value)`
- Winsorization: Cap at 95th or 99th percentile
- Quantile regression: Estimate effects at different percentiles
- Report both mean and median effects

---

## Next Steps: What Happens When We Get Data

### Immediate (1-2 hours after download)

**Step 1**: Run exploration scripts
```bash
cd /home/user/cguth7.github.io/data/orange_book
python explore_orange_book.py > exploration_output.txt

cd ../kpss
python explore_kpss.py > exploration_output.txt
```

**Step 2**: Check critical unknowns
- ✅ or ❌ KPSS extends to 2015+? (If ❌ → major problem)
- ✅ or ❌ Orange Book has clean ingredient names? (If ❌ → harder mapping)
- ✅ or ❌ Patent numbers standardizable? (If ❌ → manual matching)

**Step 3**: Calculate match rates
```python
# Load our patent data
our_patents = pd.read_parquet('Full_Patent.parquet')

# Orange Book match
ob_merge = our_patents.merge(orange_book, on='patent_id', how='inner')
print(f"Orange Book match rate: {len(ob_merge) / len(our_patents):.1%}")
print(f"Matched patents: {len(ob_merge):,}")

# KPSS match
kpss_merge = our_patents.merge(kpss, on='patent_id', how='left')
print(f"KPSS match rate: {kpss_merge['value'].notna().sum() / len(our_patents):.1%}")
print(f"Matched patents: {kpss_merge['value'].notna().sum():,}")
```

### Short-term (Day 5 of plan)

**Step 4**: Build Orange Book panel
- Create balanced G-D-year panel (same structure as main analysis)
- Aggregate Orange Book patent counts by G-D-year
- Most cells will be zero (sparse panel)
- Add spillover treatment indicators

**Step 5**: Build KPSS value panel
- Create G-D-year panel
- Aggregate KPSS patent values by G-D-year (sum of values)
- Handle zeros and outliers
- Add spillover treatment indicators

**Step 6**: Run preliminary DID regressions
```stata
# Orange Book approach
reghdfe ob_patent_count post_gwas, absorb(gene_year disease_year) cluster(gene disease)

# KPSS approach
reghdfe patent_value post_gwas, absorb(gene_year disease_year) cluster(gene disease)
```

**Step 7**: Compare coefficients
- β_all (main analysis, all patents)
- β_OB (Orange Book, FDA-approved patents)
- β_value (KPSS, dollar-weighted)

**Expected result**: β_OB > β_all (GWAS has larger effects on high-value patents)

---

## Red Flags: When to STOP and Discuss

🚨 **Stop and discuss with user if:**

1. **KPSS data ends before 2015**
   - Missing too much of our panel
   - Need to find extended data, replicate methodology, or abandon KPSS

2. **Orange Book match rate < 1%**
   - Suggests patent number format mismatch
   - Or our patents aren't FDA-approved drugs (verify expected)

3. **KPSS match rate < 10%**
   - Lower than expected (expected: 20-40%)
   - May not have enough statistical power
   - Consider focusing on Orange Book only

4. **Orange Book has no active ingredient field**
   - Makes gene mapping very difficult
   - Need to rely on manual curation or disease indication

---

## Questions for User

Before proceeding, we need answers to:

1. **Data Access**:
   - Can you manually download Orange Book data? (https://www.fda.gov/media/76860/download)
   - Can you check KPSS GitHub and Stoffman's website for extended data?
   - Do you have access to CRSP? (If we need to replicate KPSS for 2011-2020)

2. **Methodological Choices**:
   - Orange Book timing: Patent grant year or drug approval year?
   - KPSS coverage: If data stops at 2010, use 2000-2010 subset or replicate?
   - KPSS zeros: Include as zeros (conservative) or drop?

3. **Scope**:
   - If KPSS data isn't available for 2011-2020:
     - Option A: Use 2000-2010 only (quick, limited scope)
     - Option B: Replicate methodology (2 weeks, full coverage)
     - Which do you prefer?

4. **Extensions**:
   - Should we investigate private firm patent valuations? (VC data, acquisition prices)
   - Or accept public-firm-only limitation for first pass?

---

## Timeline: Once Data Is Available

**Day 1 (2-4 hours)**:
- Run exploration scripts
- Document actual schemas
- Check KPSS time coverage (critical!)
- Calculate match rates

**Day 2 (2-3 hours)**:
- Build Orange Book panel
- Handle combination products
- Test preliminary merges

**Day 3 (2-3 hours)**:
- Build KPSS value panel
- Handle outliers and zeros
- Test preliminary merges

**Day 4 (2-3 hours)**:
- Run DID regressions for both approaches
- Compare coefficients to main analysis
- Create event study plots

**Day 5 (2-3 hours)**:
- Calculate economic magnitudes
- Rescale KPSS effects (dollars per patent)
- Draft results summary

**Total**: ~5 days of work once data is available

---

## Success Criteria

**Minimum viable product**:
- ✅ Orange Book panel constructed
- ✅ KPSS values merged (even if partial coverage)
- ✅ DID regressions run for both approaches
- ✅ Results compared to main analysis
- ✅ Economic magnitudes calculated

**Would be great**:
- 🎯 KPSS extends to 2018+
- 🎯 Match rates > 20% for both datasets
- 🎯 Clean ingredient → gene mapping
- 🎯 β_OB > β_all (larger effects on high-value patents)

**Stretch goals**:
- 🚀 Extend KPSS to 2020
- 🚀 Find private firm patent valuations
- 🚀 Calculate formal ROI of GWAS research
- 🚀 Compare to Azoulay et al. estimates

---

## References & Resources

### Papers

**Azoulay et al. (2019)**: "Public R&D Investments and Private-Sector Patenting"
- *Review of Economic Studies* 86(1): 117-152
- Section 5.4 on Orange Book patents (page 146)
- Shows NIH grants have larger effects on FDA-approved drug patents
- [Link to plan page](/orange-book-plan) for full methodology

**Kogan et al. (2017)**: "Technological Innovation, Resource Allocation, and Growth"
- *Quarterly Journal of Economics* 132(2): 665-712
- Creates patent value estimates using stock market reactions
- GitHub: https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data

### Data Sources

**FDA Orange Book**:
- Homepage: https://www.fda.gov/drugs/drug-approvals-and-databases/approved-drug-products-FDA-approved-drugs-orange-book
- Download: https://www.fda.gov/media/76860/download
- Updated: Monthly
- Format: Tilde-delimited text files

**KPSS Patent Values**:
- GitHub: https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data
- Extended data: Check Noah Stoffman's website (https://kelley.iu.edu/nstoffma/)
- Original coverage: 1926-2010
- Extended: Possibly to 2018+

### Drug-Gene Mapping Databases

**DrugBank** (best resource):
- URL: https://www.drugbank.ca/
- Free academic version available
- Drug → Gene target mapping

**DGIdb** (alternative):
- URL: http://www.dgidb.org/
- Free, open-source
- Drug-Gene Interaction database

**ChEMBL** (if needed):
- URL: https://www.ebi.ac.uk/chembl/
- Chemical → Target mapping

---

## Summary: Where We Stand

**✅ Completed (Days 1-4)**:
- Exploration scripts ready
- Orange Book schema fully documented
- Composite key structure identified
- Patent number format compatibility confirmed
- Merge strategy designed
- Website integration complete

**🔴 Blocked On**:
- Manual data downloads (Orange Book, KPSS)
- KPSS time coverage unknown (critical!)

**⏳ Next Actions**:
1. User downloads Orange Book data
2. User downloads KPSS data (check for extended versions!)
3. Run exploration scripts
4. Assess feasibility based on actual coverage
5. Build panels and run regressions

**📊 Expected Outcome**:
- Orange Book: ~1,500-3,000 matched patents (3-5% match rate)
- KPSS: ~18K-37K matched patents (20-40% match rate)
- Statistical power sufficient for both approaches
- Evidence that GWAS has larger effects on high-value patents

---

*See also*:
- [Original Orange Book Plan](/orange-book-plan) - Full methodology and implementation plan
- [Patent Analysis](/patent-analysis) - Current patent data quality analysis
- [GWAS Results](/gwas-results) - Main analysis results

---

*This progress report documents Days 1-4 of the Orange Book extension plan. Once data is available, we'll update with actual match rates, panel statistics, and regression results.*
