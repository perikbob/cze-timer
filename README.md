# Uren – PWA

Bestanden in deze map horen bij elkaar en moeten samen online staan:

- `index.html` – de app
- `manifest.webmanifest` – naam, icoon en weergave als app
- `sw.js` – service worker voor offline gebruik
- `fonts/`, `icons/` – lettertype en app-iconen (lokaal, geen externe verzoeken)

## 1. Online zetten

Installeren als app en offline gebruik werken alleen vanaf een **https**-adres; vanuit een los bestand niet.
Zet de hele map als statische website online, bijvoorbeeld:

- **GitHub Pages** – repository aanmaken, map uploaden, Settings → Pages → branch `main`, map `/`.
- **Azure Static Web Apps** – past bij een Microsoft-omgeving; met Entra ID-login beperk je de toegang tot eigen accounts.
- Elke andere statische host (Netlify, Cloudflare Pages, interne webserver).

Deel daarna het adres van `index.html`.

## 2. Installeren op de telefoon

- **iPhone/iPad**: open het adres in Safari → Delen → *Zet op beginscherm*. Doe dit vóór je gaat boeken: de app op het beginscherm heeft eigen opslag, wat je in Safari boekt komt daar niet in (of: backup maken in Safari, terugzetten in de app).
- **Android**: Chrome biedt *Installeren* / *Toevoegen aan startscherm* aan, of gebruik de knop onder Types → Gegevens en opslag.

## 3. Waar de uren staan

- Op het toestel zelf, niet op een server. Twee kopieën: localStorage en een IndexedDB-spiegel; bij het starten wint de nieuwste, dus het wegvallen van één kopie kost geen uren.
- Als geïnstalleerde app ruimt de browser de opslag niet automatisch op. In gewoon Safari wordt opslag van sites die 7 dagen niet gebruikt zijn wél gewist; de app op het beginscherm valt daar buiten. Op Android vraagt de app *persistent storage* aan; het paneel Gegevens en opslag laat zien of dat gelukt is.
- Wat de opslag op het toestel wél verwijdert: de app verwijderen, op iOS *Wis geschiedenis en websitegegevens*, op Android de sitegegevens van het domein wissen, of een kwijtgeraakt toestel. Daartegen beschermt alleen een bestand buiten de app-opslag.

### Het bestand

- **Bewaar naar bestand** (Types → Gegevens en opslag, en de regel onder het boekpaneel) zet alle uren als `uren-datum.json` via het deelmenu in Bestanden/iCloud Drive (iPhone) of Drive, OneDrive of Downloads (Android). Dat bestand staat buiten de app en blijft dus staan als de app verwijderd wordt.
- De app telt de boekingen die nog niet in een bestand staan en toont dat onder het boekpaneel; staan er boekingen van gisteren of eerder nog niet in, dan kleurt die regel rood. Eén tik lost het op.
- **Android** schrijft bovendien bij de eerste boeking van de dag automatisch `uren-datum.json` naar Downloads (één bestand per dag, met alle uren tot dat moment). Op iPhone bestaat geen manier om zonder tik een bestand weg te schrijven; daar is de ene tik per dag het minimum.
- **Bestand terugzetten** leest zo'n bestand weer in, ook op een ander toestel. Neem altijd het nieuwste bestand (de datum staat in de naam).

Een webapp kan op een telefoon geen bestand ongemerkt lezen en overschrijven; die API bestaat alleen in Chrome/Edge op desktop. Een oplossing die op alle toestellen zonder enige tik werkt, vraagt om een server.

## 4. Nieuwe versie uitrollen

Vervang `index.html` (en eventueel de andere bestanden). Wijzig je een bestand uit `fonts/` of `icons/`, verhoog dan `VERSION` in `sw.js`. Gebruikers zien *Nieuwe versie klaar* en krijgen de nieuwe versie bij de volgende start van de app.

## Beperkingen van deze PoC

- Geen synchronisatie tussen toestellen; overstappen gaat via backup.
- Notities kunnen persoonsgegevens bevatten en staan onversleuteld op het toestel. Voor productie hoort hier een backend met inlog en centrale opslag achter.
