# Uren

Uren is een kleine app voor je telefoon waarmee je bijhoudt hoeveel tijd je per dag aan welk soort werk besteedt. Hij is gemaakt voor een pilot van drie maanden in het ziekenhuis. Je uren blijven op je eigen telefoon; er is geen server en geen inlog.

## Wat kun je ermee

- **Boeken.** Kies een type (bijvoorbeeld *Direct patiëntencontact* of *MDO patiëntenzorg*), kies een tijd via 15/30/45/60 of de knoppen − en +, en tik op *Boeken*. Tijd gaat in stappen van een kwartier.
- **Timer.** Tik op de ronde knop bovenin het boekpaneel. Kies het type vooraf, tussendoor of bij het stoppen. Bij stoppen wordt de gelopen tijd naar boven afgerond op het volgende kwartier en direct geboekt. De timer loopt door als je de app sluit.
- **Terugkijken.** Blader per dag met de pijlen, of open *Lijst* voor 7, 30 of 90 dagen met totalen per type. Daar kun je ook een CSV-bestand voor Excel maken.
- **Bewerken.** Tik op een boeking om de tijd of het type aan te passen, of om hem te verwijderen.
- **Offline.** Na de eerste keer openen werkt de app ook zonder internet.

De typen zijn voor iedereen gelijk en worden centraal beheerd. Mis je er een, meld dat bij de beheerder van de pilot.

## Installeren

Installeer Uren als app op je startscherm en gebruik daarna altijd dat icoon. Dat is belangrijk: de app op het startscherm heeft eigen opslag, en de browser ruimt die niet zomaar op.

**Android (Chrome)**

1. Open het adres van Uren in Chrome.
2. Tik in de blauwe balk bovenaan op *Installeren*, of via het menu ⋮ op *App installeren* / *Toevoegen aan startscherm*.
3. Open Uren vanaf het startscherm. Bovenaan staat *Maak het urenbestand aan*: tik op *Bestand aanmaken*, kies de map Downloads en laat de naam `uren.json` staan. Zie hieronder waarom.

**iPhone (Safari)**

1. Open het adres van Uren in Safari.
2. Tik op *Delen* en kies *Zet op beginscherm*.
3. Open Uren vanaf het beginscherm. Doe dit vóór je gaat boeken: wat je in Safari zelf boekt komt niet in de app terecht.

Een uitgebreide handleiding met stappen per telefoon staat in `handleiding.html` op hetzelfde adres.

## Waar je uren staan

Je uren staan op je telefoon, in de opslag van de app. Ze verdwijnen alleen als je de app verwijdert, de websitegegevens wist, of een andere telefoon krijgt. Daarom is er een kopie buiten de app:

- **Android: het urenbestand.** Eén bestand `uren.json`, bijvoorbeeld in Downloads, dat de app zelf bijwerkt. Chrome vraagt daarvoor ongeveer één keer per dag toestemming; sta dat toe. Boekingen die nog niet in het bestand staan zie je onder de dag, met een knop *Nu bijwerken*. Verwijder je de app of krijg je een nieuwe telefoon, dan kies je bij de eerste start *Bestaand bestand kiezen* en staat alles er weer.
- **iPhone: Bewaar naar bestand.** Een iPhone laat de app geen bestand bijhouden. Tik daarom regelmatig, bijvoorbeeld aan het eind van elke werkdag, op *Bewaar naar bestand* en kies *Bewaar in Bestanden*, steeds in dezelfde map (OneDrive of iCloud Drive). Het bestand heet altijd `uren.json`; tik op *Vervangen* als iOS dat vraagt. De app telt hoeveel boekingen nog niet bewaard zijn. *Bestand terugzetten* leest het bestand weer in.
- **Kopieën op de telefoon.** Elke dag bewaart de app zelf een kopie van je boekingen, twee weken lang. Onder het tandwiel kun je die terugzetten als je per ongeluk iets verkeerd hebt gedaan.

Alles hierover staat onder het tandwiel rechtsboven, bij *Gegevens en opslag*.

## Nieuwe versie

Komt er een nieuwe versie, dan zie je eenmalig *Nieuwe versie klaar*. Sluit de app helemaal en open hem opnieuw. Je uren blijven staan.

## Voor de beheerder

- De map hoort in zijn geheel op een **https**-adres te staan (bijvoorbeeld GitHub Pages: repository, Settings → Pages, branch `main`, map `/`). Installeren en offline gebruik werken niet vanaf een los bestand of gewoon http.
- Nieuwe versie uitrollen: vervang de bestanden, verhoog `APP_VERSION` in `index.html` en `VERSION` in `sw.js`.
- Chrome op Android onthoudt de toestemming voor het urenbestand niet tussen starts, ook niet als geïnstalleerde app. De app vraagt het daarom hoogstens één keer per start en alleen als het bestand ouder is dan een dag; jongere boekingen wachten in de app-opslag tot de volgende boeking of *Nu bijwerken*.
- Het urenbestand bevat de complete stand als JSON: boekingen met tijdstempels (`created`, `updated`), typen, en de versie waarmee het is weggeschreven. De CSV-export heeft de kolommen Datum, Type, Notitie, Minuten, Uren, Aangemaakt en Gewijzigd.
- Technische documentatie voor ontwikkelaars staat in `CLAUDE.md`.

## Beperkingen van deze pilotversie

- Geen synchronisatie tussen telefoons; overstappen gaat via het urenbestand of een backup.
- Alles staat onversleuteld op de telefoon. Voor gebruik na de pilot hoort hier een backend met inlog en centrale opslag achter.
