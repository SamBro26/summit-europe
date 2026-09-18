# Rebuild the hierarchical location selectors

## Changes
- Read countries, regions, and municipalities directly from the uploaded JSON asset without placeholder data.
- Keep stable stored values while deriving every visible label from the active global language, with strict English fallback.
- Rebuild Country, Region, and City as reactive selectors that enumerate every matching JSON entry and reset dependent selections correctly.
- Force selected labels and open option lists to refresh immediately after a language change.

## Verification
- Compare rendered option counts with the JSON arrays.
- Test Country → Region → City unlocking and selection.
- Change language with selections present and confirm all labels update without losing the selected location.
