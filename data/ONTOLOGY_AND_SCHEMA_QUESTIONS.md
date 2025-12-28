# Data Ontology & Schema Analysis Questions

**Focus**: Understanding foreign keys, primary keys, and "weird quirks" in Orange Book and KPSS data

---

## Orange Book Schema Questions

### Primary Key Structure

**Question**: What uniquely identifies each row?

**Hypotheses to test**:

1. **`patent.txt` primary key**:
   - Option A: `patent_no` alone (one row per patent)
   - Option B: `(appl_no, patent_no)` combo (multiple applications can reference same patent)
   - Option C: `(appl_no, patent_no, patent_use_code)` (one patent, multiple uses)

2. **`products.txt` primary key**:
   - Option A: `appl_no` alone (one application = one product)
   - Option B: `(appl_no, product_no)` (one application, multiple products/strengths)
   - Option C: `(appl_no, product_no, strength)` (multiple strengths per product)

**How to test**:
```python
# Check for duplicates
patent_df.groupby(['patent_no']).size().max()  # If > 1, not a PK
patent_df.groupby(['appl_no', 'patent_no']).size().max()  # Test combo key

# Check uniqueness
len(patent_df) == patent_df[['patent_no']].drop_duplicates().shape[0]
```

**Why this matters**:
- Determines join strategy
- Affects row-level interpretation
- Critical for counting "distinct" patents

---

### Foreign Key Relationships

**Question**: How do patents link to products?

**Expected FK**: `appl_no` in both files

**Relationship types to investigate**:

1. **One-to-One** (unlikely):
   - One application → One patent → One product
   - Simplest case

2. **One-to-Many** (likely):
   - One application → Many patents (formulation, use, process patents)
   - One product → Many strength formulations

3. **Many-to-Many** (possible):
   - One patent → Many products (different uses)
   - One product → Many patents (comprehensive protection)

**Tests**:
```python
# Count patents per application
patents_per_app = patent_df.groupby('appl_no')['patent_no'].nunique()
print(f"Mean patents per app: {patents_per_app.mean():.2f}")
print(f"Max patents per app: {patents_per_app.max()}")

# Count products per patent (requires merge)
merged = patent_df.merge(products_df, on='appl_no')
products_per_patent = merged.groupby('patent_no')['product_no'].nunique()
print(f"Mean products per patent: {products_per_patent.mean():.2f}")
```

**Implications**:
- If one-to-many: Need to decide aggregation strategy
- If many-to-many: Need junction table or duplicate handling
- Affects merge strategy and result interpretation

---

### Patent Number Format Quirks

**Question**: How are patent numbers formatted, and will they match our data?

**Possible formats**:

1. **Numeric only**: `7123456`
2. **With US prefix**: `US7123456`
3. **With comma separators**: `7,123,456`
4. **With type codes**: `RE45123` (reissue), `D234567` (design)
5. **Old format**: Pre-2001 patents (6 digits vs. 7 digits)

**Our data format** (from USPTO):
- Likely: Numeric only, 7-8 digits
- Possibly: Includes type prefixes

**Standardization needed**:
```python
def standardize_patent_no(patent_str):
    """Convert various formats to standard numeric format"""
    # Remove common prefixes
    patent = str(patent_str).upper().strip()
    patent = patent.replace('US', '').replace(',', '').replace(' ', '')

    # Extract numeric part
    # Handle RE, D, PP prefixes if present
    if patent.startswith(('RE', 'PP')):
        return f"{patent[:2]}{patent[2:].zfill(7)}"  # Keep prefix
    elif patent.startswith('D'):
        return f"D{patent[1:].zfill(7)}"  # Design patent
    else:
        return patent.zfill(7)  # Regular utility patent

# Apply to both datasets before merge
orange_book['patent_std'] = orange_book['patent_no'].apply(standardize_patent_no)
our_data['patent_std'] = our_data['patent_id'].apply(standardize_patent_no)

# Then merge on standardized column
merged = orange_book.merge(our_data, on='patent_std')
```

**Edge cases to check**:
- Provisional applications (might have different format)
- Foreign patents (should not be in Orange Book, but check)
- Invalid/placeholder patent numbers

---

### Active Ingredient Ontology

**Question**: How are drugs/ingredients named, and how do we map to genes?

**Possible naming systems**:

1. **Generic (INN) names**: e.g., "acetaminophen"
   - International Nonproprietary Names
   - Standardized by WHO
   - Best for mapping

2. **Brand names**: e.g., "Tylenol"
   - Proprietary
   - Multiple brands per active ingredient
   - Need lookup table to convert to generic

3. **Chemical names**: e.g., "N-acetyl-para-aminophenol"
   - IUPAC names
   - Very specific but hard to match

4. **Structured identifiers**:
   - UNII codes (FDA Unique Ingredient Identifiers)
   - RxNorm codes
   - ChEMBL IDs
   - Best case scenario!

**What to check**:
```python
# Sample ingredient names
print("Sample ingredient names:")
print(products_df['active_ingredient'].head(20))

# Check for structured identifiers
print("\nColumn names (looking for codes):")
print([c for c in products_df.columns if any(term in c.lower()
       for term in ['code', 'id', 'unii', 'rxnorm'])])

# Check name format
print("\nName characteristics:")
print(f"Max length: {products_df['active_ingredient'].str.len().max()}")
print(f"Contains semicolons (combos): {products_df['active_ingredient'].str.contains(';').sum()}")
print(f"Contains 'AND' (combos): {products_df['active_ingredient'].str.contains(' AND ').sum()}")
```

**Mapping strategy** (Ingredient → Gene):

1. **Best case**: Orange Book has UNII codes
   - UNII → DrugBank → Gene targets
   - Clean, structured mapping

2. **Good case**: Generic names available
   - Generic name → DrugBank → Gene targets
   - Requires name matching (can have spelling variations)

3. **Harder case**: Only brand names
   - Brand → Generic lookup (RxNorm/RxNav)
   - Then Generic → Gene

4. **Hardest case**: No structured data
   - Manual curation
   - Or use disease indication instead of gene target

**External databases needed**:
- **DrugBank**: Drug → Gene target mapping (best resource)
- **DGIdb**: Drug-Gene Interaction database
- **ChEMBL**: Chemical → Target mapping
- **RxNorm**: Name standardization

---

### Date Format Quirks

**Question**: What date fields exist and in what format?

**Expected date fields**:
- `approval_date` - When FDA approved the drug
- `patent_expire_date` - When patent protection ends
- `patent_grant_date` - When USPTO granted the patent (maybe not in OB)

**Possible formats**:
1. `YYYY-MM-DD` (ISO standard)
2. `MM/DD/YYYY` (US format)
3. `YYYYMMDD` (numeric)
4. `Jan 1, 2020` (text)
5. Excel serial numbers (if file was corrupted by Excel)

**Tests**:
```python
def detect_date_format(date_series):
    """Figure out what date format is used"""
    sample = date_series.dropna().head(20)

    print(f"Sample values: {sample.tolist()}")

    # Try parsing with different formats
    formats_to_try = [
        '%Y-%m-%d',
        '%m/%d/%Y',
        '%Y%m%d',
        '%d-%b-%Y',
    ]

    for fmt in formats_to_try:
        try:
            parsed = pd.to_datetime(sample, format=fmt, errors='coerce')
            success_rate = parsed.notna().sum() / len(sample)
            print(f"Format {fmt}: {success_rate:.1%} success")
            if success_rate > 0.8:
                print(f"  → Likely format: {fmt}")
        except:
            pass

detect_date_format(products_df['approval_date'])
```

**Critical decision**: Which date to use for panel timing?

- **Option A: Patent grant date** (consistent with main analysis)
  - Pro: Matches our patent-level analysis timing
  - Con: May not be in Orange Book (need to get from USPTO)

- **Option B: Drug approval date** (economically relevant)
  - Pro: When drug actually reaches market (revenue starts)
  - Con: Can be years after patent grant (clinical trials delay)

- **Recommendation**: Try both, discuss with professor
  - Approval date probably makes more sense for Orange Book analysis
  - It's the "high value" moment (FDA approval)

---

### Combination Products Quirks

**Question**: How are combination drugs (multiple active ingredients) handled?

**Example**: A pill with both aspirin and caffeine

**Possible representations**:

1. **Separate rows**:
   - Row 1: Appl_No=123, Ingredient=aspirin
   - Row 2: Appl_No=123, Ingredient=caffeine
   - Result: Duplicates when counting products

2. **Concatenated string**:
   - Single row: Ingredient="aspirin; caffeine"
   - Need to parse and split

3. **Separate columns**:
   - Ingredient_1=aspirin, Ingredient_2=caffeine, Ingredient_3=NULL
   - Wide format

**How to check**:
```python
# Check for duplicated appl_no (suggests multiple ingredients)
dupe_apps = products_df[products_df.duplicated('appl_no', keep=False)]
print(f"Applications with multiple rows: {dupe_apps['appl_no'].nunique()}")

# Check for delimiters in ingredient field
has_semicolon = products_df['active_ingredient'].str.contains(';', na=False).sum()
has_and = products_df['active_ingredient'].str.contains(' AND ', na=False).sum()
has_plus = products_df['active_ingredient'].str.contains(r'\+', na=False).sum()
print(f"Ingredients with semicolon: {has_semicolon}")
print(f"Ingredients with AND: {has_and}")
print(f"Ingredients with plus: {has_plus}")

# Check for ingredient_2, ingredient_3 columns
print("Ingredient columns:", [c for c in products_df.columns if 'ingredient' in c.lower()])
```

**Implication for gene mapping**:
- Combination drugs may map to multiple genes
- Need to handle many-to-many relationship
- Decision: Include all genes or just first listed?

---

## KPSS Schema Questions

### Primary Key Structure

**Question**: What uniquely identifies each row?

**Expected format**: One row per patent

**Tests**:
```python
# Check for duplicate patents
len(kpss_df) == kpss_df['patent_no'].nunique()

# If duplicates exist, why?
dupes = kpss_df[kpss_df.duplicated('patent_no', keep=False)]
print("Duplicate patents:")
print(dupes.head())

# Possible reasons for duplicates:
# - Multiple valuations (different event windows?)
# - Patent assigned to multiple firms (reissue/transfer?)
# - Errors in data
```

**Possible PK combinations**:
- `patent_no` alone (expected)
- `(patent_no, permno)` - if patent assigned to multiple firms
- `(patent_no, grant_year)` - if multiple grants (unlikely)

---

### Patent Number Format Quirks

**Question**: Same as Orange Book, but KPSS may differ

**Likely format**: Numeric only (since from USPTO)

**But check for**:
- Leading zeros stripped (Excel corruption)
- Scientific notation (also Excel)
- Type prefixes included or excluded

**Standardization**:
```python
# Same as Orange Book, but verify format
sample_patents = kpss_df['patent_no'].head(100)
print("Sample patent numbers:")
print(sample_patents.tolist())

# Check data type
print(f"Data type: {kpss_df['patent_no'].dtype}")

# If it's float (bad sign - Excel corrupted it)
if kpss_df['patent_no'].dtype == 'float64':
    print("WARNING: Patents stored as float (Excel corruption?)")
    kpss_df['patent_no'] = kpss_df['patent_no'].astype(int).astype(str)
```

---

### Value Field Characteristics

**Question**: What are the quirks of the value distribution?

**Things to check**:

1. **Units**: Dollars or millions or thousands?
```python
print(f"Mean value: {kpss_df['value'].mean():,.2f}")
print(f"Median value: {kpss_df['value'].median():,.2f}")
# If mean is like 50, units are probably millions
# If mean is like 50000, units are probably dollars
```

2. **Negative values**: Possible if "bad news" patent
```python
negative_count = (kpss_df['value'] < 0).sum()
print(f"Negative values: {negative_count} ({negative_count/len(kpss_df)*100:.1f}%)")
# If many negatives, may need to handle separately
```

3. **Exact zeros vs. missing**: Different meanings
```python
exact_zeros = (kpss_df['value'] == 0).sum()
missing = kpss_df['value'].isna().sum()
print(f"Exact zeros: {exact_zeros} (market didn't react)")
print(f"Missing: {missing} (no data)")
# Zeros = measured but no effect
# Missing = not measured
```

4. **Extreme outliers**: Blockbuster patents
```python
top_values = kpss_df.nlargest(10, 'value')
print("Top 10 patents:")
print(top_values[['patent_no', 'value']])
# Check if top values are reasonable (billions possible for pharma)
```

5. **Inflation adjustment**: Are values in constant or nominal dollars?
```python
# Check if there's a year column
if 'year' in kpss_df.columns:
    print("Value by year (check for inflation adjustment):")
    print(kpss_df.groupby('year')['value'].agg(['mean', 'median']))
    # If mean is constant over time → real dollars
    # If mean grows over time → nominal dollars (need to adjust)
```

---

### Firm Identifier Quirks

**Question**: How are firms identified, and does it matter?

**Possible identifiers**:
- `permno` - CRSP permanent company number
- `gvkey` - Compustat identifier
- `cusip` - Committee on Uniform Securities Identification Procedures
- Firm name (text, messy)

**Why we care**:
- May want to analyze by firm size or industry
- Could merge with firm characteristics (R&D spending, etc.)
- Public firm bias - which firms are included?

**Tests**:
```python
# Check firm identifier columns
firm_cols = [c for c in kpss_df.columns if any(term in c.lower()
             for term in ['firm', 'company', 'permno', 'gvkey', 'cusip'])]
print(f"Firm identifier columns: {firm_cols}")

# How many unique firms?
if 'permno' in kpss_df.columns:
    print(f"Unique firms: {kpss_df['permno'].nunique()}")

    # Patents per firm
    patents_per_firm = kpss_df.groupby('permno').size()
    print(f"Mean patents per firm: {patents_per_firm.mean():.1f}")
    print(f"Median patents per firm: {patents_per_firm.median():.1f}")
```

---

### Time Coverage Quirks

**Question**: Does data extend to our analysis period? (CRITICAL!)

**Key checks**:

1. **Latest year in data**:
```python
if 'year' in kpss_df.columns:
    print(f"Latest year: {kpss_df['year'].max()}")
    if kpss_df['year'].max() < 2015:
        print("⚠️ CRITICAL: Data doesn't extend to 2015!")
        print("   This is a MAJOR LIMITATION for our 2000-2020 analysis")
```

2. **Coverage by year**:
```python
year_coverage = kpss_df.groupby('year').size()
print("\nPatents by year (last 20 years):")
print(year_coverage.tail(20))

# Check if coverage drops off (suggests data collection ended)
recent_years = year_coverage.tail(5)
if recent_years.mean() < year_coverage.mean() * 0.5:
    print("⚠️ WARNING: Coverage drops in recent years (data may be incomplete)")
```

3. **Overlap with our panel**:
```python
our_start, our_end = 2000, 2020
overlap_start = max(our_start, kpss_df['year'].min())
overlap_end = min(our_end, kpss_df['year'].max())
overlap_years = overlap_end - overlap_start + 1

print(f"\nOur analysis period: {our_start}-{our_end} ({our_end-our_start+1} years)")
print(f"KPSS data period: {kpss_df['year'].min()}-{kpss_df['year'].max()}")
print(f"Overlap: {overlap_start}-{overlap_end} ({overlap_years} years)")
print(f"Coverage: {overlap_years / (our_end-our_start+1) * 100:.0f}% of our period")

if overlap_years < 15:
    print("\n🚨 WARNING: Less than 15 years of overlap!")
    print("   Consider:")
    print("   1. Finding extended KPSS data")
    print("   2. Replicating methodology for missing years")
    print("   3. Restricting analysis to overlap period only")
```

---

## Summary of "Weird Quirks" to Watch For

### Orange Book

1. **Many-to-many relationships** - One patent, multiple drugs OR one drug, multiple patents
2. **Combination products** - Multiple active ingredients per product (how represented?)
3. **Patent type codes** - RE (reissue), D (design) patents (should filter these?)
4. **Approval date ≠ grant date** - Timing mismatch (which to use?)
5. **Discontinued products** - Separate file? (Do we exclude them?)
6. **Generic vs. brand** - Same active ingredient, different applicants (duplicates?)

### KPSS

1. **Zero inflation** - Many patents with $0 value (include or exclude?)
2. **Public firm only** - Systematic bias (universities, private firms missing)
3. **Time coverage gap** - Data may end before 2020 (CRITICAL!)
4. **Extreme skewness** - Top 1% of patents dominate total value
5. **Measurement error** - 3-day window may miss long-term value
6. **Confounding events** - Other news on grant date (adds noise)

---

## Next Steps

Once we have the data:

1. **Run exploration scripts** - Document actual schema
2. **Test all hypotheses** - Run all the code snippets above
3. **Create schema diagrams** - Visual FK/PK relationships
4. **Document quirks** - List all edge cases found
5. **Plan merge strategy** - Based on actual formats observed
6. **Assess feasibility** - Can we get the data we need?

**Critical questions to answer**:
- ✅ or ❌ KPSS extends to 2015+? (If ❌, major problem)
- ✅ or ❌ Orange Book has structured ingredient codes? (If ❌, harder mapping)
- ✅ or ❌ Patent numbers standardizable? (If ❌, manual matching needed)
- ✅ or ❌ FK relationships clean? (If ❌, complex merging)

Let me know once you have the data files!
