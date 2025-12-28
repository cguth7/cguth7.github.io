# Orange Book Data Exploration

## Data Source

**FDA Orange Book** - Official listing of approved drug products with therapeutic equivalence evaluations

- **Download URL**: https://www.fda.gov/media/76860/download
- **Documentation**: https://www.fda.gov/drugs/drug-approvals-and-databases/orange-book-data-files
- **Update Frequency**: Monthly
- **Format**: ZIP file containing multiple text files

## Required Files

According to the FDA documentation, the Orange Book download should contain:

1. **`patent.txt`** - Patent information for approved drugs
2. **`products.txt`** - Approved drug products
3. **`exclusivity.txt`** - Market exclusivity information
4. **`discontinued.txt`** - Discontinued drug products (optional)

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

Key questions to answer when exploring the data:

### 1. **Primary Keys & Foreign Keys**
- What is the primary key in `products.txt`? (Likely: Appl_No or combination)
- What is the foreign key in `patent.txt` that links to products? (Likely: Appl_No)
- Are there one-to-many relationships? (One drug → many patents?)
- Are there many-to-many relationships? (One patent → many drugs?)

### 2. **Patent Number Format**
- What format are patent numbers in? (e.g., "US1234567", "1234567")
- Do they match our USPTO patent IDs in `Full_Patent.parquet`?
- Will we need to standardize patent number formats for merging?

### 3. **Date Fields**
- What date format is used? (YYYY-MM-DD, MM/DD/YYYY, etc.)
- Key dates: Patent grant date vs. drug approval date vs. patent expiration date
- Which date should we use for our panel analysis?

### 4. **Active Ingredients**
- How are active ingredients named? (Brand names vs. generic names vs. chemical names)
- Are there standardized ontologies used? (e.g., RxNorm, UNII, ChEMBL)
- How to link active ingredients → genes? (May need drug-target databases)

### 5. **Data Completeness**
- How many total patents in Orange Book?
- How many approved drugs?
- What time period does the data cover?
- Are there null values in key fields?

## Next Steps (Manual Download Required)

**You'll need to:**
1. Go to https://www.fda.gov/media/76860/download
2. Download the Orange Book ZIP file
3. Place it in this directory (`/home/user/cguth7.github.io/data/orange_book/`)
4. Run the exploration script (to be created next)

**Once downloaded, we can:**
- Extract and parse the text files
- Document the exact schema
- Answer the ontology questions above
- Create the merge strategy with our patent data
