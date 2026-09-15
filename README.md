# Uren – PWA

Bestanden in deze map horen bij elkaar en moeten samen online staan:

- `index.html` – de app
- `manifest.webmanifest` – naam, icoon en weergave als app
- `sw.js` – service worker voor offline gebruik
- `fonts/`, `icons/` – lettertype, app-iconen en `logo.png` (lokaal, geen externe verzoeken)

## 1. Online zetten

Installeren als app en offline gebruik werken alleen vanaf een **https**-adres; vanuit een los bestand niet.
Zet de hele map als statische website online, bijvoorbeeld:

- **GitHub Pages** – repository aanmaken, map uploaden, Settings → Pages → branch `main`, map `/`.
- **Azure Static Web Apps** – past bij een Microsoft-omgeving; met Entra ID-login beperk je de toegang tot eigen accounts.
- Elke andere statische host (Netlify, Cloudflare Pages, interne webserver).

Deel daarna het adres van `index.html`.

## 2. Installeren op de telefoon

- **iPhone/iPad**: open het adres in Safari → Delen → *Zet op beginscherm*. Doe dit vóór je gaat boeken: de app op het beginscherm heeft eigen opslag, wat je in Safari boekt komt daar niet in (of: backup maken in Safari, terugzetten in de app).
- **Android**: Chrome biedt *Installeren* / *Toevoegen aan startscherm* aan, of gebruik de knop onder Instellingen (tandwiel) → Gegevens en opslag.

## Boeken en timer

- Handmatig: type kiezen, tijd via 15/30/45/60 of − en +, Boeken. Er is geen standaardtype: elke boeking is een bewuste keuze.
- Timer: de ronde knop bovenin het boekpaneel. Type eerst kiezen en dan starten, of starten en het type bij het stoppen kiezen (of tussendoor aantikken). Stoppen rondt de gelopen tijd naar boven af op hele minuten en daarna naar boven op het kwartier (minimaal 0:15, maximaal 24:00), en boekt direct als er een type gekozen is. De timer loopt door als de app gesloten wordt.

## 3. Waar de uren staan

- Op het toestel zelf, niet op een server. Twee kopieën: localStorage en een IndexedDB-spiegel; bij het starten wint de nieuwste, dus het wegvallen van één kopie kost geen uren.
- Als geïnstalleerde app ruimt de browser de opslag niet automatisch op. In gewoon Safari wordt opslag van sites die 7 dagen niet gebruikt zijn wél gewist; de app op het beginscherm valt daar buiten. Op Android vraagt de app *persistent storage* aan; het paneel Gegevens en opslag laat zien of dat gelukt is.
- Wat de opslag op het toestel wél verwijdert: de app verwijderen, op iOS *Wis geschiedenis en websitegegevens*, op Android de sitegegevens van het domein wissen, of een kwijtgeraakt toestel. Daartegen beschermt alleen een bestand buiten de app-opslag.

### Het urenbestand (Android)

- Chrome op Android (versie 132 en nieuwer, januari 2025) laat een webapp één bestand aanmaken of kiezen en daarna steeds opnieuw beschrijven. Uren gebruikt dat: bij de eerste start vraagt een balk bovenaan om **Bestand aanmaken** (kies bijvoorbeeld Downloads, naam `uren.json`). Daarna schrijft de app na elke boeking, wijziging of verwijdering de complete stand in datzelfde bestand. Geen nieuwe bestanden, geen downloadmeldingen.
- Chrome kan bij de eerste boeking na het openen van de app één keer vragen of Uren het bestand mag bewerken; sta dat toe.
- Het bestand staat buiten de app-opslag. Wordt de app verwijderd of komt er een nieuw toestel, dan kies je bij de eerste start **Bestaand bestand kiezen**, wijst `uren.json` aan en alles staat er weer.
- Lukt het schrijven niet (bestand verwijderd, toestemming geweigerd), dan wordt de balk bovenaan rood met het aantal boekingen dat nog niet in het bestand staat, en een knop om het opnieuw te proberen of een ander bestand te koppelen. De uren zelf staan intussen gewoon in de app-opslag.
- Onder Instellingen (tandwiel) → Gegevens en opslag zie je welk bestand gekoppeld is, en kun je een ander bestand koppelen of loskoppelen.

### iPhone

Safari heeft deze mogelijkheid niet en Apple heeft aangegeven die niet te gaan bouwen. Op iPhone is **Bewaar naar bestand** (deelmenu → Bewaar in Bestanden) de weg naar een kopie buiten de app; de app telt hoeveel boekingen nog niet in een bestand staan en toont dat onder het boekpaneel. Het bestand heet altijd `uren.json`: kies steeds dezelfde map (bijvoorbeeld OneDrive of iCloud Drive in Bestanden) en tik op *Vervangen* als iOS dat vraagt, dan is er één bestand dat altijd de laatste stand bevat. **Bestand terugzetten** leest zo'n bestand weer in.

### Kopieën op het toestel

Elke dag bij de eerste start, en vóór elk terugzetten, bewaart de app een kopie van de boekingen en types in IndexedDB, twee weken lang. Onder Instellingen (tandwiel) → Gegevens en opslag staan ze met een knop *Terugzetten*. Dit is een ongedaan-maken voor vergissingen (verkeerde bewerking, verkeerd bestand teruggezet), geen bescherming tegen verlies van het toestel.

### Het bestand

`uren.json` bevat de complete stand: `entries` (boekingen met `created` en, na bewerking, `updated` als tijdstempel), `types` (met `created`/`updated`), `savedAt`, en `exportedAt` plus de app-versie waarmee het is weggeschreven. De CSV-export bevat per boeking ook de kolommen *Aangemaakt* en *Gewijzigd*.

## 4. Nieuwe versie uitrollen

Vervang `index.html` (en eventueel de andere bestanden). Verhoog `APP_VERSION` in `index.html` (zichtbaar onder Gegevens en opslag en in het urenbestand) en `VERSION` in `sw.js`. Gebruikers zien *Nieuwe versie klaar* en krijgen de nieuwe versie bij de volgende start van de app.

## Beperkingen van deze PoC

- Geen synchronisatie tussen toestellen; overstappen gaat via backup.
- Notities kunnen persoonsgegevens bevatten en staan onversleuteld op het toestel. Voor productie hoort hier een backend met inlog en centrale opslag achter.
