---
title: "GWAS Spillover Pipeline Results"
permalink: /gwas-results
toc: true
toc_label: "Contents"
toc_sticky: true
---

# GWAS Spillover Pipeline - Results Summary
*Generated: December 5, 2025*

## Pipeline Status

| Step | Description | Status | Runtime |
|------|-------------|--------|---------|
| 01 | GWAS Cleaning | Complete | ~1 min |
| 02 | Patent Preparation | Complete | ~2 min |
| 03 | Panel Filtering | Complete | ~3 min |
| 04 | Spillover Creation | Complete | ~2 min |
| 05 | Panel Creation | Complete | 31.5 min |
| 06 | Spillover Integration | Complete | 4.6 min |
| 07 | Stata Export | **Pending** | - |

---

## Step 5: Panel Creation Results

- **Panel rows**: 148,124,655
- **Unique gene-disease pairs**: 7,053,555
- **Unique genes**: 14,368
- **Unique diseases**: 2,435
- **Years covered**: 2000-2020 (21 years)
- **Total patents in panel**: 49,724,209
- **Mean patents per pair-year**: 0.336
- **Extensive margin (any patents)**: 15.91%
- **Memory usage**: 5.24 GB

---

## Step 6: Spillover Integration Results

### Treatment Coverage in Final Panel

| Spillover Level | Rows | Percentage |
|-----------------|------|------------|
| Direct GWAS | 247,485 | 0.2% |
| 1-hop spillover | 1,764,021 | 1.2% |
| 2-hop spillover | 5,830,755 | 3.9% |
| 3-hop spillover | 7,007,658 | 4.7% |
| **No treatment** | **133,274,736** | **90.0%** |

### Spillover Pair Counts (pre-panel)
- Direct GWAS pairs: 35,008
- 1-hop pairs: 189,088
- 2-hop pairs: 814,121
- 3-hop pairs: 1,024,077
- **Total treated pairs**: 2,062,294

---

## Patent Count Analysis (Before vs After 99% Filtering)

| Metric | Before Filtering | After Filtering | Removed |
|--------|------------------|-----------------|---------|
| **Rows** | 140,520,525 | 49,724,209 | 90,796,316 (64.6%) |
| **Unique Patents** | 163,928 | 92,611 | 71,317 (43.5%) |

---

## Probability Threshold Analysis

The pipeline uses a 99% BioBERT probability threshold to filter patent-gene/disease matches.

### Probability Distribution (gene_prob column)
- Mean: 0.9532
- Median: 0.9908
- Std: 0.0932
- Range: 0.3362 - 1.0000

### Threshold Sensitivity

| Threshold | Rows Kept | % Kept | Unique Patents |
|-----------|-----------|--------|----------------|
| 50% | 137,332,498 | 97.7% | 163,434 |
| 70% | 131,869,342 | 93.8% | 160,943 |
| 80% | 127,101,726 | 90.5% | 159,130 |
| 90% | 119,073,479 | 84.7% | 155,823 |
| 95% | 110,657,709 | 78.7% | 152,174 |
| **99%** | **72,016,306** | **51.2%** | **128,067** |
| 99.9% | 1,486,096 | 1.1% | 7,986 |

### Characteristics by Confidence Level

|  | High Confidence (>=99%) | Low Confidence (<99%) |
|--|-------------------------|----------------------|
| Rows | 72,016,306 | 65,725,744 |
| GWAS match rate | 0.46% | 0.34% |
| Median patent year | 2014 | 2015 |
| Unique genes | 15,366 | 16,050 |

**Conclusion**: The 99% threshold keeps 51.2% of observations and 128,067 unique patents. This is a reasonable trade-off between data quality and coverage.

---

## Panel Diagnostics Results

### Basic Panel Structure
- **Observations**: 148,124,655
- **Unique gene-disease pairs**: 7,053,555
- **Unique genes**: 14,368
- **Unique diseases**: 2,435
- **Years**: 21 (2000-2020)
- **Observations per pair**: 21.0
- **Panel balance**: Yes (all pairs have exactly 21 observations)

### Treatment Coverage
- **Pairs ever treated**: 11,785 (0.2%)
- **Pairs never treated**: 7,041,770 (99.8%)

### Treatment Timing
- Earliest treatment year: 2005
- Median treatment year: 2017
- Latest treatment year: 2020

### Fixed Effects Group Sizes

| FE Type | Groups | Mean Obs/Group | Singletons |
|---------|--------|----------------|------------|
| Gene-Year | 301,728 | 490.9 | 4,767 (1.6%) |
| Disease-Year | 51,135 | 2,896.7 | 0 (0.0%) |
| Gene-Disease (pairs) | 7,053,555 | 21.0 | 0 (0.0%) |

---

## Output Files

| File | Size | Description |
|------|------|-------------|
| `gwas_cleaned.tsv` | 2.3 MB | Cleaned GWAS catalog |
| `patent_with_gwas.parquet` | 82 MB | Patents matched to GWAS |
| `processed_for_spillovers.parquet` | 36 MB | Filtered patents (99% threshold) |
| `spillovers_pre_panel.parquet` | 5.6 MB | Spillover pairs by hop level |
| `full_panel_pre_spillovers.parquet` | 200 MB | Balanced panel before spillovers |
| `full_panel_with_spillovers.parquet` | 252 MB | Final panel with treatment indicators |
