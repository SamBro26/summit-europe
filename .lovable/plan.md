# Rebuild the dynamic location selector

## Changes
- Replace the fallback-first selector state with an explicit loading state populated only by `fetch('/euro_multilingual.json')`.
- Validate and retain the complete country, region, and municipality arrays returned by the asset.
- Derive each menu directly from the fetched nested objects without slicing, placeholder generation, or static location data.
- Keep stable stored values: country ISO code and English fallback names for regions and municipalities.
- Render every visible label from `names[activeLanguage] || names.en`, so changing the global language immediately recomputes selected labels and menu options.
- Preserve strict Country → Region → City unlocking and clear child selections when a parent changes.
- Show translated loading/empty states without replacing the production data with a partial hardcoded list.

## Verification
- Confirm the browser receives 25 countries, 31 regions, and 37 municipalities from the public JSON asset.
- Exercise France, Germany, Andorra, Belgium, and Italy through all three menus.
- Switch languages while selections are retained and confirm all available translated labels update immediately.
- Check the post form at mobile and desktop sizes and confirm no browser errors.
