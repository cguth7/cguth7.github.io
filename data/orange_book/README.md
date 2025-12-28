# Orange Book Data Exploration

## Data Source

**FDA Orange Book** - Official listing of approved drug products with therapeutic equivalence evaluations

- **Download URL**: https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files
- **Documentation**: https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files
- **Update Frequency**: Monthly
- **Format**: Text files with `~` (tilde) delimiter
- **Note**: Files are available directly from FDA website (no ZIP needed)

## Required Files

The Orange Book data includes:

1. **`patent.txt`** - Patent information for approved drugs
2. **`products.txt`** - Approved drug products
3. **`exclusivity.txt`** - Market exclusivity information
4. **`discontinued.txt`** - Discontinued drug products (optional)

## Actual Schema (From Sample Data)

### File Format
- **Delimiter**: `~` (tilde character)
- **Encoding**: UTF-8 or latin-1
- **Header**: First row contains column names

### `patent.txt` Columns
```
Appl_Type~Appl_No~Product_No~Patent_No~Patent_Expire_Date_Text~Drug_Substance_Flag~Drug_Product_Flag~Patent_Use_Code~Delist_Flag~Submission_Date
```

Key columns:
- **`Patent_No`**: USPTO patent number (7-digit format, e.g., 7625884) ✅ **Matches USPTO format**
- **`Appl_Type`**: Application type (N = NDA, A = ANDA)
- **`Appl_No`**: Application number (part of composite key)
- **`Product_No`**: Product number (part of composite key)
- **`Patent_Expire_Date_Text`**: Patent expiration date
- **`Drug_Substance_Flag`**: Y = chemical compound patent, blank = no
- **`Drug_Product_Flag`**: Y = formulation patent, blank = no
- **`Patent_Use_Code`**: Use code (e.g., U-141, U-986)

### `products.txt` Columns
```
Ingredient~DF;Route~Trade_Name~Applicant~Strength~Appl_Type~Appl_No~Product_No~TE_Code~Approval_Date~RLD~RS~Type~Applicant_Full_Name
```

Key columns:
- **`Ingredient`**: Active ingredient name (e.g., BUDESONIDE, MINOCYCLINE HYDROCHLORIDE) ⭐ **This maps to genes**
- **`Trade_Name`**: Brand name
- **`Appl_Type`**: Application type (composite key)
- **`Appl_No`**: Application number (composite key)
- **`Product_No`**: Product number (composite key)
- **`Approval_Date`**: FDA approval date
- **`Applicant_Full_Name`**: Company name

### `exclusivity.txt` Columns
```
Appl_Type~Appl_No~Product_No~Exclusivity_Code~Exclusivity_Date
```

Key columns:
- **`Appl_Type`**: Application type (composite key)
- **`Appl_No`**: Application number (composite key)
- **`Product_No`**: Product number (composite key)
- **`Exclusivity_Code`**: Type of exclusivity (e.g., RTO, D-193, I-975)
- **`Exclusivity_Date`**: Exclusivity expiration date

### Composite Primary Key
All three files link via: **`Appl_Type + Appl_No + Product_No`**

```
Products (ingredients, trade names, approval dates)
    ↓ [Appl_Type + Appl_No + Product_No]
Patents (patent numbers, expiration dates)
    ↓ [Appl_Type + Appl_No + Product_No]
Exclusivity (exclusivity periods)
```

## Data We Need to Extract

### From `patent.txt`:
- Patent numbers (to merge with our USPTO patent data)
- Patent expiration dates
- Drug approval numbers (foreign key to products.txt)

### From `products.txt`:
- Drug approval numbers (primary key)
- Active ingredients (to link to genes/diseases)
- Approval dates
- Drug names
- Applicant/sponsor information

## Data Structure & Ontology Questions

### ✅ ANSWERED from Sample Data:

1. **Primary Keys & Foreign Keys**
   - ✅ Composite key: `Appl_Type + Appl_No + Product_No`
   - ✅ All three files use the same composite key
   - ⚠️ Still need to check: One-to-many vs. many-to-many relationships

2. **Patent Number Format**
   - ✅ Patent numbers are 7-digit USPTO format (e.g., 7625884, 8455524)
   - ✅ Should match directly with USPTO patent data
   - ✅ No "US" prefix or other formatting issues observed

3. **Active Ingredients**
   - ✅ Generic/chemical names (e.g., BUDESONIDE, MINOCYCLINE HYDROCHLORIDE)
   - ✅ Located in `Ingredient` column of `products.txt`
   - ⚠️ Still need: Mapping strategy for `Ingredient → Gene`

### ❓ STILL NEED TO ANSWER (Run Exploration Script):

4. **Date Fields**
   - What date format is used in `Approval_Date`? (e.g., "Apr 12, 2023" or "2023-04-12")
   - What is the time coverage? (Need to overlap with 2000-2020 panel)
   - Are dates parseable? Any null values?

5. **Data Completeness**
   - How many total patents in Orange Book?
   - How many unique approved drugs?
   - How many unique active ingredients?
   - What's the match rate with our 92K patents?

6. **Relationships & Cardinality**
   - Are there multiple patents per drug? (One drug → many patents)
   - Are there multiple drugs per patent? (One patent → many drugs)
   - How many products per ingredient?
   - How sparse will the panel be?

7. **Data Quality**
   - Null values in key columns?
   - Duplicate records?
   - Patent numbers formatted consistently?
   - Active ingredient naming conventions?

## Next Steps

**Ready to run exploration:**
1. Place the three data files in this directory:
   - `patent.txt`
   - `products.txt`
   - `exclusivity.txt`

2. Run the exploration script:
   ```bash
   cd /home/user/cguth7.github.io/data/orange_book/
   python explore_orange_book.py
   ```

3. The script will:
   - Auto-detect the `~` delimiter
   - Analyze all three files
   - Document schemas and data types
   - Check patent number formats
   - Analyze active ingredient naming
   - Calculate data completeness metrics
   - Export sample CSVs for reference

**Once exploration is complete, we can:**
- Calculate match rate with existing 92K patents
- Design `Ingredient → Gene` mapping strategy
- Build Orange Book patent count panel
- Run regression analysis
