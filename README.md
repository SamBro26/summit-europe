# EuroHome Finder

Act as an expert Senior Full-Stack Developer and Software Architect. I need you to build a pan-European Real Estate Platform targeting all countries in the Eurozone (countries using the Euro € currency) named "FindMe RealEstate" The system must support Web and Mobile layouts with a highly modular, clean, and internationalized architecture.

 

Please implement Phase 1 (The Onboarding and Foundational Layout) with the following specifications:

 

1. Onboarding Flow (First-time Users Only):

   - Implement an elegant animated Splash Screen showing the "FindMe RealEstate" brand identity.

   - Immediately after the Splash Screen, display a Welcome Language Selection Page asking the user to choose their preferred language. The system must support all official Eurozone languages, formatted nicely in a scrollable grid list: English, French, German, Italian, Spanish, Portuguese, Dutch, Greek, Irish, Finnish, Estonian, Latvian, Lithuanian, Maltese, Slovak, Slovenian, Bulgarian, Swedish, Turkish, Luxembourgish, Catalan and Croatian.

   - Use LocalStorage/State management logic so this language screen ONLY appears on the very first install/visit. For subsequent visits, the app must automatically remember the saved language and redirect straight to the Home Screen unless the user changes it manually in settings.

 

2. Dynamic Eurozone Hierarchical Location Filter:

   - On the Home Screen, implement a top-level mandatory dropdown listing all Eurozone countries (France, Germany, Spain, Italy, Belgium, Netherlands, Ireland, Portugal, Austria, Greece, Cyprus, Estonia, Finland, Latvia, Lithuania, Luxembourg, Malta, Slovakia, Slovenia, Croatia, Bulgaria, Andorra, Monaco, San Marino, Vatican city).

   - The location filter must be strictly hierarchical: The user MUST select the Country first. Once the Country is selected, dynamically unlock the subsequent sub-filters: Region/State -> City/Municipality.

   - For preview testing, hardcode dynamic major sub-regions and cities for: France (e.g., Île-de-France -> Paris, Lyon), Germany (e.g., Bavaria -> Munich, Berlin), and Spain (e.g., Catalonia -> Barcelona, Madrid). For all other countries, use a smart dynamic placeholder layout.

 

3. Dual-Market Tabs: Include tabs separating "Offered Properties" (Supply) and "Search Requests" (Demand) matching the base architecture.

 

Please build this entire onboarding sequence, the multi-language grid selection, and foundational country-filter layer first, and show me the active preview before we proceed to ad listing wizard and chat

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://summit-europe.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c9d7a131-d994-45a9-98a8-7af6ce2f637d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
