# Orange Book & KPSS Data Acquisition Status

**Last Updated**: December 28, 2025
**Status**: Awaiting manual data downloads

---

## Summary

We're working on Days 1-4 of the Orange Book extension plan, which involves acquiring and exploring two key datasets:

1. **FDA Orange Book** - Patents for FDA-approved drugs (~3K patents)
2. **KPSS Patent Values** - Market-based patent valuations (3-4M patents)

Both datasets require manual downloads due to network restrictions. Exploration scripts are ready to run once data is available.

---

## What We've Prepared

### ✅ Ready to Use

1. **Orange Book Exploration**
   - Location: `/data/orange_book/`
   - README documenting data sources and key questions
   - Python exploration script: `explore_orange_book.py`
   - Will analyze: data structure, FK/PK relationships, patent formats, ontologies

2. **KPSS Exploration**
   - Location: `/data/kpss/`
   - README documenting data sources and challenges
   - Python exploration script: `explore_kpss.py`
   - Will analyze: value distributions, time coverage, match rates

3. **Site Integration**
   - Added Orange Book plan to research page: `/research/index.html`
   - Plan accessible at: `/orange-book-plan`

---

## What We Need From You

### 🔴 Critical Data Downloads

#### 1. Orange Book Data
**Download URL**: https://www.fda.gov/media/76860/download

**Steps**:
1. Click the link above (or go to https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files)
2. Download the ZIP file (should be ~5-10 MB)
3. Save as: `/data/orange_book/orange_book.zip`
4. Run: `python data/orange_book/explore_orange_book.py`

**What we'll get**:
- `patent.txt` - Patent numbers, expiration dates, approval numbers
- `products.txt` - Drug names, active ingredients, approval dates
- `exclusivity.txt` - Market exclusivity info

**Key questions to answer**:
- What's the patent number format? (Need to match our USPTO IDs)
- How many patents total? (~3,000 expected)
- What are the FK relationships? (How do patents link to products?)
- How are active ingredients named? (Need to map to genes)
- What date fields exist? (Grant date vs. approval date)

#### 2. KPSS Patent Values
**Download URL**: https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data

**Steps**:
1. Go to the GitHub repo
2. Look for patent value data files (likely CSV or Stata format)
3. Download to: `/data/kpss/`
4. **ALSO CHECK**: Noah Stoffman's website for extended data (2011-2018): https://kelley.iu.edu/nstoffma/
5. Run: `python data/kpss/explore_kpss.py`

**What we'll get**:
- Patent numbers
- Dollar values (market-based estimates)
- Grant years
- Possibly: firm identifiers, confidence intervals

**CRITICAL QUESTIONS** to answer:
- ⚠️ **Does the data extend to 2020?** (Original paper: 1926-2010)
- If not, is there extended data available? (Check Stoffman's site)
- What % of our 92K patents will match? (KPSS only has public firms)
- How many zero values? (Market didn't react to patent)
- What's the value distribution? (Mean, median, outliers)

---

## Critical Unknowns (Need Data to Answer)

### Orange Book Ontology Questions

1. **Patent Number Format**
   - Do they use "US1234567" or just "1234567"?
   - Will they match our patent IDs in `Full_Patent.parquet`?
   - Need to standardize before merging

2. **Foreign Key Structure**
   - Primary key in products.txt: Appl_No? Drug_Name?
   - How many products per patent? (One-to-many?)
   - How many patents per product? (Many-to-many?)

3. **Active Ingredient Naming**
   - Generic names or brand names or both?
   - Are there ontology codes? (RxNorm, UNII, ChEMBL)
   - How to map ingredients → genes? (Will need drug-target database)

4. **Temporal Coverage**
   - What's the earliest approval date?
   - Are all currently approved drugs included?
   - Historical approvals that were later withdrawn?

### KPSS Coverage Questions

1. **Time Period** 🔴 **MOST CRITICAL**
   - Original data: 1926-2010
   - Our analysis needs: 2000-2020
   - **Gap**: 2011-2020 coverage unknown
   - If data stops at 2010: We lose half our panel!
   - **Action**: Check for extended data immediately

2. **Match Rate**
   - KPSS has 3-4M patents total
   - Our data has 92K unique patents
   - But KPSS only covers public firms
   - What % of pharma/biotech patents are from public firms?
   - **Expected**: 20-40% match rate (need to verify)

3. **Selection Bias**
   - Public firms may be systematically different:
     - Larger, more R&D-intensive
     - More commercially oriented
     - Higher quality patents
   - If GWAS affects public vs. private differently → bias
   - **Need to discuss**: Is this acceptable?

4. **Zero Values**
   - Many patents have value = $0 (market didn't react)
   - How many zeros?
   - Include as zeros or exclude from analysis?
   - May need to use Tobit regression or similar

---

## Likely Data Issues We'll Encounter

### Orange Book

1. **Low Match Rate**
   - ~3,000 OB patents vs. 92,000 in our data
   - Match rate: 3-5% expected
   - Most of our patents won't be in Orange Book
   - **Solution**: This is fine! OB is meant to be sparse (only FDA-approved drugs)

2. **Patent Number Formatting**
   - May need to strip prefixes, add prefixes, or reformat
   - Common issue when merging USPTO data
   - **Solution**: Try multiple format variations

3. **Multiple Patents Per Drug**
   - One drug can have 10+ patents (formulation, use, process)
   - How to aggregate? Sum? Max? First patent only?
   - **Decision needed**: Discuss with professor

4. **Active Ingredient → Gene Mapping**
   - OB has drug names, we need genes
   - Will require external database (e.g., DrugBank, DGIdb)
   - May not have perfect coverage
   - **Backup plan**: Use disease indication instead of target gene

### KPSS

1. **Time Coverage Gap** 🔴
   - If data ends at 2010, we have a problem
   - Options:
     - Use 2000-2010 subset only (lose 10 years)
     - Find extended data (2011-2018 exists?)
     - Replicate methodology ourselves (need CRSP access)
   - **Critical**: Check this FIRST when downloading

2. **Public Firm Bias**
   - Only ~40% of patents may match (public firms only)
   - Missing: Universities (important!), private firms, individuals
   - **Implication**: Estimates only apply to public firm patenting
   - **Mitigation**: Discuss limitation in paper, suggest as future work

3. **Extreme Skewness**
   - Patent values are log-normally distributed
   - Mean >> Median (due to blockbusters)
   - A few huge values will dominate
   - **Solutions**:
     - Winsorize at 95th or 99th percentile
     - Log transformation
     - Quantile regression
     - Report both mean and median effects

4. **Many Zeros**
   - 30-50% of patents may have value = 0
   - Interpretation unclear (truly worthless or measurement error?)
   - **Solutions**:
     - Include as zeros (conservative)
     - Drop and note selection (less conservative)
     - Tobit regression (accounts for censoring)

---

## Once We Have the Data: Next Steps

### Immediate (Days 1-4 of Plan)

1. **Run Exploration Scripts**
   ```bash
   cd data/orange_book
   python explore_orange_book.py > exploration_output.txt

   cd ../kpss
   python explore_kpss.py > exploration_output.txt
   ```

2. **Answer Key Questions**
   - Document all schemas
   - Identify FK/PK relationships
   - Document ontologies
   - Check time coverage (KPSS especially!)
   - Calculate descriptive stats

3. **Create Data Documentation**
   - Schema diagrams
   - FK relationship maps
   - Format conversion needed
   - Known data issues
   - Match rate estimates

### Short-Term (Day 5 of Plan)

4. **Test Merges**
   ```python
   # Load our patent data
   our_patents = pd.read_parquet('Full_Patent.parquet')

   # Try merging with Orange Book
   ob_merge = our_patents.merge(orange_book, on='patent_id', how='inner')
   print(f"Match rate: {len(ob_merge) / len(our_patents):.1%}")

   # Try merging with KPSS
   kpss_merge = our_patents.merge(kpss, on='patent_id', how='left')
   print(f"Match rate: {kpss_merge['value'].notna().sum() / len(our_patents):.1%}")
   ```

5. **Report to User**
   - Match rates
   - Coverage statistics
   - Data quality issues
   - Feasibility assessment
   - Recommendations for proceeding

---

## Red Flags to Watch For

🚨 **STOP and discuss if we find:**

1. **KPSS data ends before 2015**
   - Means we're missing too much of our panel
   - Need to either:
     - Find extended data
     - Replicate methodology
     - Abandon KPSS approach

2. **Orange Book match rate < 1%**
   - Suggests patent number format mismatch
   - Or our patents are not FDA-approved drugs (expected, but verify)
   - May need alternative matching strategy

3. **Orange Book has no active ingredient field**
   - Makes gene mapping very difficult
   - May need to rely on drug name → PubChem → gene lookups
   - Much messier

4. **KPSS match rate < 10%**
   - Lower than expected
   - May not have enough statistical power
   - Consider focusing on Orange Book only

---

## Questions for You

Before proceeding, we should discuss:

1. **CRSP Access**: Do you have access to CRSP stock price data?
   - Needed if we have to replicate KPSS for 2011-2020
   - Standard at universities but need to confirm

2. **Drug-Target Databases**: Do you have access to DrugBank or DGIdb?
   - Needed to map Orange Book active ingredients → genes
   - Some are free, some require subscription

3. **Time Budget**: If KPSS data isn't available for 2011-2020:
   - Option A: Use 2000-2010 only (quick, limited scope)
   - Option B: Replicate methodology (2 weeks work, full coverage)
   - Your preference?

4. **Private Firm Patents**: Should we investigate alternatives to KPSS for non-public firms?
   - Venture capital data?
   - Acquisition prices?
   - Or accept the public-firm-only limitation?

---

## What We CAN Do Without Data

Even without the actual files, we can:

1. ✅ **Review Literature**
   - Read Azoulay et al. (2019) Section 5.4 in detail
   - Read KPSS (2017) methodology sections
   - Look for papers citing KPSS that use extended data

2. ✅ **Prepare Merge Code**
   - Write flexible merging scripts that handle different formats
   - Create patent number standardization functions
   - Prepare for multiple FK/PK scenarios

3. ✅ **Plan Panel Construction**
   - Design Orange Book panel structure
   - Design KPSS value-weighted panel structure
   - Plan for sparsity (Poisson regression, etc.)

4. ✅ **Contact Data Providers**
   - Email Noah Stoffman asking about extended KPSS data
   - Check NBER patent data project for merged datasets
   - Look for replication packages from papers using KPSS post-2017

---

## Summary: Where We Stand

**Prepared**:
- ✅ Exploration scripts ready
- ✅ Documentation frameworks created
- ✅ Key questions identified
- ✅ Plan integrated into website

**Blocked on**:
- 🔴 Manual data downloads (Orange Book, KPSS)
- 🔴 KPSS time coverage unknown (critical!)

**Next Actions**:
1. You download Orange Book data
2. You download KPSS data (check for extended versions!)
3. We run exploration scripts
4. We assess feasibility
5. We decide how to proceed based on actual coverage

**Estimated Time Once Data Available**:
- Exploration: 2-4 hours
- Documentation: 2-3 hours
- Test merges: 1-2 hours
- **Total: ~1 day of work**

---

Let me know once you have the data files, and we can run the exploration immediately!
