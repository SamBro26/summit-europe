# Rebuild asynchronously loaded location selectors

## Outcome
- Serve the complete uploaded JSON as a browser-readable asset.
- Load it once when the location selector mounts and retain the complete parsed array in local state.
- Populate every country, every nested region, and every nested municipality from that state.
- Recompute all visible labels whenever the global language changes, using `names[language] || names.en`.
- Preserve ISO country values and canonical English region/city values so existing listings and filters remain compatible.
- Keep region and city locked until their parent selection is made, and clear dependent selections when a parent changes.

## Validation
- Confirm the fetched asset contains all 25 countries, 31 regions, and 37 municipalities present in the upload.
- Verify representative countries including Andorra, Austria, Belgium, and Ireland.
- Verify Greek uses English fallback for those entries because their uploaded `names` objects do not contain `el`.
- Check the live selector flow and language switching in the browser.
