"""
KPSS Patent Valuation Data Exploration Script

This script explores the KPSS patent value data to understand:
1. Data structure and schemas
2. Patent number formats for merging
3. Value distributions and outliers
4. Time coverage (critical: does it extend to 2020?)
5. Match rate with our patent data

Run this after downloading the KPSS data from GitHub.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns

def explore_kpss():
    """Main exploration function"""

    data_dir = Path(__file__).parent

    print("="*80)
    print("KPSS PATENT VALUATION DATA EXPLORATION")
    print("="*80)
    print()

    # Look for data files
    print("Searching for KPSS data files...")
    data_files = list(data_dir.glob("*.csv")) + list(data_dir.glob("*.dta")) + list(data_dir.glob("*.txt"))

    if not data_files:
        print("ERROR: No data files found!")
        print(f"Searched in: {data_dir}")
        print("\nPlease download data from:")
        print("  - https://github.com/KPSS2017/Technological-Innovation-Resource-Allocation-and-Growth-Extended-Data")
        print("  - https://kelley.iu.edu/nstoffma/ (for extended data)")
        return

    print(f"\nFound {len(data_files)} data file(s):")
    for f in data_files:
        print(f"  - {f.name}")

    # Try to load each file
    for data_file in data_files:
        print(f"\n{'='*80}")
        print(f"EXPLORING: {data_file.name}")
        print('='*80)

        try:
            # Try different formats
            if data_file.suffix == '.csv':
                df = pd.read_csv(data_file, low_memory=False)
            elif data_file.suffix == '.dta':
                df = pd.read_stata(data_file)
            elif data_file.suffix == '.txt':
                # Try tab-delimited first, then comma
                try:
                    df = pd.read_csv(data_file, sep='\t', low_memory=False)
                except:
                    df = pd.read_csv(data_file, low_memory=False)
            else:
                print(f"Unknown file format: {data_file.suffix}")
                continue

            explore_dataframe(df, data_file.name, data_dir)

        except Exception as e:
            print(f"ERROR loading {data_file.name}: {e}")
            continue

    print("\n" + "="*80)
    print("EXPLORATION COMPLETE")
    print("="*80)


def explore_dataframe(df, filename, data_dir):
    """Explore a single dataframe"""

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

    # Identify patent number column
    patent_col = identify_patent_column(df)
    if patent_col:
        analyze_patent_numbers(df, patent_col)

    # Identify value column
    value_col = identify_value_column(df)
    if value_col:
        analyze_patent_values(df, value_col, data_dir)

    # Identify year column
    year_col = identify_year_column(df)
    if year_col:
        analyze_time_coverage(df, year_col)

    # Save sample
    sample_path = data_dir / f"{filename}_sample.csv"
    df.head(100).to_csv(sample_path, index=False)
    print(f"\n💾 Saved 100-row sample to: {sample_path.name}")


def identify_patent_column(df):
    """Try to identify the patent number column"""

    candidates = [c for c in df.columns if any(term in c.lower() for term in ['patent', 'pat_'])]

    if not candidates:
        print(f"\n⚠️  Could not find patent number column!")
        return None

    # Prefer columns with 'number' or 'no' in name
    for c in candidates:
        if 'number' in c.lower() or c.lower().endswith('no') or c.lower() == 'patent':
            return c

    return candidates[0]


def identify_value_column(df):
    """Try to identify the patent value column"""

    candidates = [c for c in df.columns if any(term in c.lower() for term in ['value', 'val', 'worth', 'dollar', 'xi'])]

    if not candidates:
        print(f"\n⚠️  Could not find patent value column!")
        return None

    # Prefer columns with 'value' in name
    for c in candidates:
        if 'value' in c.lower():
            return c

    return candidates[0]


def identify_year_column(df):
    """Try to identify the year column"""

    candidates = [c for c in df.columns if any(term in c.lower() for term in ['year', 'yr', 'date', 'grant'])]

    if not candidates:
        return None

    # Prefer 'year' or 'grant_year'
    for c in candidates:
        if c.lower() in ['year', 'grant_year', 'gyear']:
            return c

    return candidates[0]


def analyze_patent_numbers(df, patent_col):
    """Analyze patent number format and characteristics"""

    print(f"\n🔑 PATENT NUMBER ANALYSIS (column: {patent_col}):")

    patents = df[patent_col].dropna()
    print(f"  - Total entries: {len(patents):,}")
    print(f"  - Unique patents: {patents.nunique():,}")

    # Sample values
    print(f"\n  📝 Sample patent numbers:")
    for p in patents.head(20).tolist()[:10]:
        print(f"      - {p}")

    # Analyze format
    patents_str = patents.astype(str)

    # Check for prefixes
    has_prefix = patents_str.str.match(r'^[A-Z]').sum()
    print(f"\n    - Patents with letter prefix: {has_prefix:,} ({has_prefix/len(patents)*100:.1f}%)")

    # Length distribution
    lengths = patents_str.str.len()
    print(f"\n    - Length range: {lengths.min()} to {lengths.max()} characters")
    print(f"    - Most common length: {lengths.mode().values[0] if len(lengths.mode()) > 0 else 'N/A'}")
    print(f"    - Length distribution:")
    for length, count in lengths.value_counts().head(5).items():
        print(f"      - {length} chars: {count:,} patents ({count/len(patents)*100:.1f}%)")


def analyze_patent_values(df, value_col, data_dir):
    """Analyze patent value distribution"""

    print(f"\n💰 PATENT VALUE ANALYSIS (column: {value_col}):")

    values = df[value_col].dropna()
    print(f"  - Total non-null: {len(values):,}")

    # Basic statistics
    print(f"\n  📊 Distribution Statistics:")
    print(f"    - Mean: ${values.mean():,.2f}")
    print(f"    - Median: ${values.median():,.2f}")
    print(f"    - Std Dev: ${values.std():,.2f}")
    print(f"    - Min: ${values.min():,.2f}")
    print(f"    - Max: ${values.max():,.2f}")

    # Percentiles
    print(f"\n  📈 Percentiles:")
    for p in [1, 5, 10, 25, 50, 75, 90, 95, 99]:
        val = values.quantile(p/100)
        print(f"    - {p}th percentile: ${val:,.2f}")

    # Zero values
    zeros = (values == 0).sum()
    print(f"\n  🔍 Zero Values:")
    print(f"    - Count: {zeros:,} ({zeros/len(values)*100:.1f}%)")

    # Negative values
    negatives = (values < 0).sum()
    if negatives > 0:
        print(f"\n  ⚠️  Negative Values:")
        print(f"    - Count: {negatives:,} ({negatives/len(values)*100:.1f}%)")

    # Top values
    print(f"\n  🏆 Top 10 Most Valuable Patents:")
    top10 = values.nlargest(10)
    for i, (idx, val) in enumerate(top10.items(), 1):
        print(f"    {i}. ${val:,.2f}")

    # Create histogram (if reasonable size)
    if len(values) < 10_000_000:
        try:
            print(f"\n  📊 Creating value distribution plot...")
            fig, axes = plt.subplots(1, 2, figsize=(12, 5))

            # Raw distribution
            axes[0].hist(values, bins=50, edgecolor='black', alpha=0.7)
            axes[0].set_xlabel('Patent Value ($)')
            axes[0].set_ylabel('Frequency')
            axes[0].set_title('Patent Value Distribution (Raw)')

            # Log distribution (excluding zeros/negatives)
            positive_values = values[values > 0]
            if len(positive_values) > 0:
                axes[1].hist(np.log10(positive_values), bins=50, edgecolor='black', alpha=0.7)
                axes[1].set_xlabel('Patent Value (log10 $)')
                axes[1].set_ylabel('Frequency')
                axes[1].set_title('Patent Value Distribution (Log Scale)')

            plt.tight_layout()
            plot_path = data_dir / "kpss_value_distribution.png"
            plt.savefig(plot_path, dpi=150, bbox_inches='tight')
            print(f"    - Saved plot to: {plot_path.name}")
            plt.close()
        except Exception as e:
            print(f"    - Could not create plot: {e}")


def analyze_time_coverage(df, year_col):
    """Analyze time coverage of the data"""

    print(f"\n📅 TIME COVERAGE ANALYSIS (column: {year_col}):")

    years = df[year_col].dropna()
    print(f"  - Total non-null: {len(years):,}")

    # Try to convert to numeric year
    try:
        if years.dtype == 'object':
            # Try to extract year from date string
            years_numeric = pd.to_datetime(years, errors='coerce').dt.year
        else:
            years_numeric = years

        years_numeric = years_numeric.dropna()

        print(f"\n  📊 Year Range:")
        print(f"    - Earliest: {int(years_numeric.min())}")
        print(f"    - Latest: {int(years_numeric.max())}")
        print(f"    - Span: {int(years_numeric.max() - years_numeric.min())} years")

        # Check our analysis period (2000-2020)
        in_our_period = years_numeric.between(2000, 2020).sum()
        print(f"\n  🎯 Coverage of Our Analysis Period (2000-2020):")
        print(f"    - Patents in period: {in_our_period:,}")
        print(f"    - % of total: {in_our_period/len(years_numeric)*100:.1f}%")

        # Year distribution
        print(f"\n  📈 Patents by Year (most recent 10 years):")
        year_counts = years_numeric.value_counts().sort_index(ascending=False).head(10)
        for year, count in year_counts.items():
            print(f"    - {int(year)}: {count:,} patents")

        # Critical question: Does it cover 2011-2020?
        coverage_2011_2020 = years_numeric[years_numeric >= 2011].min()
        if pd.notna(coverage_2011_2020):
            print(f"\n  ✅ Data extends beyond 2010! Latest year: {int(years_numeric.max())}")
        else:
            print(f"\n  ⚠️  WARNING: Data may not extend beyond 2010!")
            print(f"     This is a CRITICAL LIMITATION for our analysis (needs 2000-2020)")

    except Exception as e:
        print(f"  ⚠️  Could not parse years: {e}")
        print(f"  Sample values: {years.head(10).tolist()}")


if __name__ == "__main__":
    explore_kpss()
