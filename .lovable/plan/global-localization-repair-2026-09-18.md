# Global localization repair

## Goal
Make the selected language the single source of truth for all visible interface text. Changing it must update every mounted screen immediately, with English used only as a fallback when a translation is genuinely unavailable.

## Implementation
1. **Consolidate the translation catalogue**
   - Keep one typed translation-key catalogue and one dictionary per supported language.
   - Remove the separate partial screen-translation fallback structure that can leave mixed-language screens.
   - Add complete keys for navigation, posting steps, inbox, chat, listing editing, reporting, moderation, validation, notifications, accessibility labels, and shared statuses.
   - Preserve property and transaction values as stable data identifiers, mapping them to translated labels only when rendered.

2. **Use the global language context everywhere**
   - Keep the existing app-level provider as the sole language state owner.
   - Ensure language changes update the context immediately and persist for future visits.
   - Replace visible hardcoded strings in all app routes and feature components with translated keys, including toast messages, placeholders, empty states, dialog text, image labels, and accessibility text.

3. **Repair the requested flows**
   - Post wizard: Home, every step title and counter, property/transaction labels, location guidance, details fields, photo requirements, Add, Back, Next, and Publish.
   - Inbox: title, description, loading/empty states, Browse listings, participant fallback, and chat panel text.
   - Categories: Apartment, House/Villa, Chalet, Commercial Shop, Building Land, Agricultural Land, Sale, and Rent always resolve from the active dictionary.

4. **Cover remaining application screens**
   - Localize listing interactions, edit-ad screen, report dialog, authentication notices, admin/moderation controls, notification text, and global error/not-found screens so no user-facing area remains fixed in English or another language.

## Validation
- Run the TypeScript checks.
- Search the full UI source again for unlocalized visible strings.
- Use the live app to switch between English, French, and Bulgarian and verify the home page, Inbox, and all five post steps update without reload or mixed-language text.
