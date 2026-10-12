# Account layout and plan scrolling

- [x] Move Delete Account to the header opposite Home, preserving confirmation.
- [x] Place the trial countdown fully below the header within the content area.
- [x] Enable contained native scrolling in both plan dialogs without touch restrictions.
- [x] Verify signed-in account layout and plan scrolling.

# Eurozone global theme

- [x] Replace green theme tokens with EU royal blue and star gold in light and dark themes.
- [x] Update selection accents, listing badges and contrasting text where needed.
- [x] Verify the updated colors and interactions on desktop and mobile.

# Stripe premium subscriptions

- [x] Enable built-in Stripe payments.
- [x] Make pricing tier rows wrap cleanly with large phone text sizes.
- [x] Confirm business logic: ads return at period end on cancel, prorated immediate plan changes, grace period on failed payments.
- [x] Create the three recurring Euro prices and connect Subscribe Now to secure checkout.
- [x] Synchronize premium status from payment notifications with localized return confirmation.
- [x] Add paid-user subscription management in all 22 languages.
- [x] Test pricing rules.
- [ ] Real test purchase end-to-end (needs the user to run a test card in the preview).

- [x] Play Store review guard: Android app container (?mode=app, WV user agent, window.Android, android-app referrer) hides Stripe checkout on the plans screen and shows a localized "visit our website" notice with a Copy Website Link button (22 languages); web users keep normal checkout.
