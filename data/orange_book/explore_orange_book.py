"""
Orange Book Data Exploration Script

This script explores the FDA Orange Book data to understand:
1. Data structure and schemas
2. Primary and foreign key relationships
3. Data ontologies and naming conventions
4. Data quality and completeness

Run this after downloading the Orange Book ZIP file.
"""

import pandas as pd
import zipfile
import os
from pathlib import Path
from collections import Counter

def explore_orange_book():
    """Main exploration function"""

    data_dir = Path(__file__).parent
    zip_path = data_dir / "orange_book.zip"

    if not zip_path.exists():
        print("ERROR: orange_book.zip not found!")
        print(f"Expected location: {zip_path}")
        print("\nPlease download from: https://www.fda.gov/media/76860/download")
        return

    print("="*80)
    print("FDA ORANGE BOOK DATA EXPLORATION")
    print("="*80)
    print()

    # Extract ZIP contents
    print("Extracting ZIP file...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        file_list = zip_ref.namelist()
        print(f"\nFiles in archive: {len(file_list)}")
        for f in file_list:
            print(f"  - {f}")
        zip_ref.extractall(data_dir)
    print()

    # Explore each file
    explore_patents(data_dir)
    explore_products(data_dir)
    explore_exclusivity(data_dir)

    print("\n" + "="*80)
    print("EXPLORATION COMPLETE")
    print("="*80)


def explore_patents(data_dir):
    """Explore patent.txt file"""

    print("="*80)
    print("EXPLORING: patent.txt")
    print("="*80)
    print()

    patent_file = data_dir / "patent.txt"
    if not patent_file.exists():
        print(f"WARNING: {patent_file} not found!")
        return

    # Try to infer delimiter (could be tab or pipe)
    with open(patent_file, 'r', encoding='latin-1') as f:
        first_line = f.readline()
        if '\t' in first_line:
            delimiter = '\t'
        elif '|' in first_line:
            delimiter = '|'
        else:
            delimiter = ','

    print(f"Detected delimiter: {repr(delimiter)}")

    # Read the file
    df = pd.read_csv(patent_file, delimiter=delimiter, encoding='latin-1', low_memory=False)

    print(f"\n📊 BASIC STATS:")
    print(f"  - Total rows: {len(df):,}")
    print(f"  - Total columns: {len(df.columns)}")
    print(f"  - Memory usage: {df.memory_usage(deep=True).sum() / 1024**2:.2f} MB")

    print(f"\n📋 COLUMN NAMES:")
    for i, col in enumerate(df.columns, 1):
        print(f"  {i}. {col}")

    print(f"\n🔍 SAMPLE ROWS (first 5):")
    print(df.head())

    print(f"\n📊 COLUMN DETAILS:")
    for col in df.columns:
        non_null = df[col].notna().sum()
        null_pct = (1 - non_null/len(df)) * 100
        unique_vals = df[col].nunique()
        dtype = df[col].dtype

        print(f"\n  {col}:")
        print(f"    - Type: {dtype}")
        print(f"    - Non-null: {non_null:,} ({100-null_pct:.1f}%)")
        print(f"    - Unique values: {unique_vals:,}")

        # Show sample values
        if unique_vals <= 10:
            print(f"    - All values: {df[col].unique().tolist()}")
        else:
            sample_vals = df[col].dropna().head(5).tolist()
            print(f"    - Sample values: {sample_vals}")

    # Analyze patent numbers specifically
    if 'Patent_No' in df.columns:
        print(f"\n🔑 PATENT NUMBER ANALYSIS:")
        patent_col = 'Patent_No'
    elif 'PATENT_NO' in df.columns:
        print(f"\n🔑 PATENT NUMBER ANALYSIS:")
        patent_col = 'PATENT_NO'
    else:
        patent_col = None
        print(f"\n⚠️  WARNING: Could not find patent number column!")
        print(f"   Available columns: {df.columns.tolist()}")

    if patent_col:
        patents = df[patent_col].dropna()
        print(f"  - Total patents: {len(patents):,}")
        print(f"  - Unique patents: {patents.nunique():,}")
        print(f"  - Patents per drug (avg): {len(patents) / df['Appl_No'].nunique():.2f}" if 'Appl_No' in df.columns else "")

        # Analyze patent number format
        print(f"\n  📝 Patent Number Format Analysis:")
        sample_patents = patents.head(20).tolist()
        print(f"    Sample patent numbers:")
        for p in sample_patents[:10]:
            print(f"      - {p}")

        # Check for prefixes
        has_prefix = patents.astype(str).str.contains(r'^[A-Z]', regex=True).sum()
        print(f"\n    - Patents with letter prefix: {has_prefix:,} ({has_prefix/len(patents)*100:.1f}%)")
        print(f"    - Patents without prefix: {len(patents)-has_prefix:,} ({(len(patents)-has_prefix)/len(patents)*100:.1f}%)")

        # Length distribution
        lengths = patents.astype(str).str.len()
        print(f"\n    - Length range: {lengths.min()} to {lengths.max()} characters")
        print(f"    - Most common length: {lengths.mode().values[0] if len(lengths.mode()) > 0 else 'N/A'} characters")

    # Save sample for reference
    sample_path = data_dir / "patent_sample.csv"
    df.head(100).to_csv(sample_path, index=False)
    print(f"\n💾 Saved 100-row sample to: {sample_path}")

    print()


def explore_products(data_dir):
    """Explore products.txt file"""

    print("="*80)
    print("EXPLORING: products.txt")
    print("="*80)
    print()

    products_file = data_dir / "products.txt"
    if not products_file.exists():
        print(f"WARNING: {products_file} not found!")
        return

    # Try to infer delimiter
    with open(products_file, 'r', encoding='latin-1') as f:
        first_line = f.readline()
        if '\t' in first_line:
            delimiter = '\t'
        elif '|' in first_line:
            delimiter = '|'
        else:
            delimiter = ','

    print(f"Detected delimiter: {repr(delimiter)}")

    # Read the file
    df = pd.read_csv(products_file, delimiter=delimiter, encoding='latin-1', low_memory=False)

    print(f"\n📊 BASIC STATS:")
    print(f"  - Total rows: {len(df):,}")
    print(f"  - Total columns: {len(df.columns)}")

    print(f"\n📋 COLUMN NAMES:")
    for i, col in enumerate(df.columns, 1):
        print(f"  {i}. {col}")

    print(f"\n🔍 SAMPLE ROWS (first 5):")
    print(df.head())

    print(f"\n📊 COLUMN DETAILS:")
    for col in df.columns:
        non_null = df[col].notna().sum()
        null_pct = (1 - non_null/len(df)) * 100
        unique_vals = df[col].nunique()
        dtype = df[col].dtype

        print(f"\n  {col}:")
        print(f"    - Type: {dtype}")
        print(f"    - Non-null: {non_null:,} ({100-null_pct:.1f}%)")
        print(f"    - Unique values: {unique_vals:,}")

        # Show sample values
        if unique_vals <= 10:
            print(f"    - All values: {df[col].unique().tolist()}")
        else:
            sample_vals = df[col].dropna().head(5).tolist()
            print(f"    - Sample values: {sample_vals}")

    # Analyze active ingredients
    ingredient_cols = [c for c in df.columns if 'ingredient' in c.lower() or 'active' in c.lower()]
    if ingredient_cols:
        print(f"\n💊 ACTIVE INGREDIENT ANALYSIS:")
        for col in ingredient_cols:
            print(f"\n  Column: {col}")
            ingredients = df[col].dropna()
            print(f"    - Total: {len(ingredients):,}")
            print(f"    - Unique: {ingredients.nunique():,}")
            print(f"    - Top 10 most common:")
            top10 = ingredients.value_counts().head(10)
            for ing, count in top10.items():
                print(f"      - {ing}: {count:,} products")

    # Analyze approval dates if present
    date_cols = [c for c in df.columns if 'date' in c.lower() or 'approval' in c.lower()]
    if date_cols:
        print(f"\n📅 DATE ANALYSIS:")
        for col in date_cols:
            print(f"\n  Column: {col}")
            dates = df[col].dropna()
            print(f"    - Non-null: {len(dates):,}")
            print(f"    - Sample values: {dates.head(10).tolist()}")
            # Try to parse as datetime
            try:
                parsed_dates = pd.to_datetime(dates, errors='coerce')
                valid_dates = parsed_dates.dropna()
                if len(valid_dates) > 0:
                    print(f"    - Parseable as date: {len(valid_dates):,} ({len(valid_dates)/len(dates)*100:.1f}%)")
                    print(f"    - Date range: {valid_dates.min()} to {valid_dates.max()}")
            except:
                print(f"    - Could not parse as datetime")

    # Save sample
    sample_path = data_dir / "products_sample.csv"
    df.head(100).to_csv(sample_path, index=False)
    print(f"\n💾 Saved 100-row sample to: {sample_path}")

    print()


def explore_exclusivity(data_dir):
    """Explore exclusivity.txt file"""

    print("="*80)
    print("EXPLORING: exclusivity.txt")
    print("="*80)
    print()

    exclusivity_file = data_dir / "exclusivity.txt"
    if not exclusivity_file.exists():
        print(f"INFO: {exclusivity_file} not found (optional file)")
        return

    # Try to infer delimiter
    with open(exclusivity_file, 'r', encoding='latin-1') as f:
        first_line = f.readline()
        if '\t' in first_line:
            delimiter = '\t'
        elif '|' in first_line:
            delimiter = '|'
        else:
            delimiter = ','

    print(f"Detected delimiter: {repr(delimiter)}")

    # Read the file
    df = pd.read_csv(exclusivity_file, delimiter=delimiter, encoding='latin-1', low_memory=False)

    print(f"\n📊 BASIC STATS:")
    print(f"  - Total rows: {len(df):,}")
    print(f"  - Total columns: {len(df.columns)}")

    print(f"\n📋 COLUMN NAMES:")
    for i, col in enumerate(df.columns, 1):
        print(f"  {i}. {col}")

    print(f"\n🔍 SAMPLE ROWS (first 5):")
    print(df.head())

    print()


def analyze_relationships(data_dir):
    """Analyze foreign key relationships between files"""

    print("="*80)
    print("ANALYZING RELATIONSHIPS")
    print("="*80)
    print()

    # This will be implemented after we see the actual data structure
    print("TODO: Analyze FK relationships after examining actual data")
    print()


if __name__ == "__main__":
    explore_orange_book()
