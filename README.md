# Super League

Een website voor een FIFA-competitie van Niels en Tim met 10 clubs. Elk team speelt een keer tegen elk ander team: 9 speelrondes en 45 wedstrijden.

De site toont:

- de eerstvolgende wedstrijd, met de invoer van de uitslag en de doelpuntenmakers;
- de stand, met de regels van de Eredivisie;
- het volledige speelschema;
- de topscorers;
- de statistieken, waaronder de onderlinge stand van Niels en Tim.

## Wie speelt met welk team

Een dobbelsteen bepaalt per wedstrijd wie thuis speelt. Bij de uitslag kies je wie met het thuisteam speelde: Niels (N) of Tim (T). De andere persoon speelde met het uitteam. De keuze is verplicht.

Het speelschema toont de letters onder de score. De statistieken gebruiken de keuze voor de onderlinge stand.

Een uitslag van voor deze functie heeft geen speler. Die wedstrijd telt niet mee bij Niels tegen Tim. Open de wedstrijd in het speelschema en vul de keuze aan.

## Techniek

- Next.js (App Router) met een statische export
- React en TypeScript
- CSS Modules, mobile first
- TanStack Table v9
- Vitest
- GitHub Pages via GitHub Actions

## Lokaal starten

```bash
npm install
npm run dev
```

Open daarna `http://localhost:3000`.

De site start in de lokale modus. De uitslagen staan dan alleen in de browser (localStorage).

Andere opdrachten:

| Opdracht | Doel |
|---|---|
| `npm run test` | Test de logica van het speelschema, de stand, de topscorers en de statistieken. |
| `npm run lint` | Controleer de code met ESLint. |
| `npm run build` | Maak de statische site in de map `out/`. |

## Publiceren op GitHub Pages

1. Maak een publieke repo op GitHub en push deze code naar de branch `main`.
2. Ga in de repo naar **Settings → Pages**. Zet **Source** op **GitHub Actions**.
3. De workflow `.github/workflows/deploy.yml` bouwt en publiceert de site bij elke push naar `main`.

De workflow geeft de naam van de repo aan de build. De site gebruikt daarna de GitHub-modus.

## Uitslagen opslaan (GitHub-modus)

De uitslagen staan in `data/results.json` in de repo. De site leest dit bestand via de GitHub API. Iedereen ziet dezelfde stand.

Je hebt een token nodig om uitslagen op te slaan:

1. Maak een [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new).
2. Kies bij **Repository access** alleen deze repo.
3. Geef bij **Permissions** het recht **Contents: Read and write**.
4. Open de site, kies **Beheer** en voer het token in.

Het token blijft in de browser van dat apparaat. Het token komt niet in de repo en niet in de build.

Elke uitslag is een commit op `data/results.json`. De workflow negeert wijzigingen in de map `data/`. Een nieuwe uitslag start dus geen nieuwe build.

Zonder token is de site alleen-lezen.

## Gegevens aanpassen

| Bestand | Inhoud |
|---|---|
| `src/data/teams.ts` | De clubs en de clubkleuren. |
| `src/data/coaches.ts` | De namen bij de letters N en T. |
| `src/data/squads.ts` | De selecties (bron: sofifa.com, FC27, update 1 oktober 2026). |
| `src/data/logos.ts` | Koppelt elke club aan een logo in `src/assets/logos/`. |
| `src/assets/logos/` | De clublogo’s als SVG. De bestandsnaam is de club-ID. |
| `src/lib/schedule.ts` | Het speelschema. |
| `src/lib/standings.ts` | De standbepaling. |
| `src/lib/stats.ts` | De berekening van de statistieken. |

Let op: de volgorde van de clubs in `teams.ts` bepaalt het speelschema en de wedstrijd-ID's. Wijzig deze volgorde niet na de eerste uitslag.

## Clublogo’s

De logo’s komen van [football-logos.cc](https://football-logos.cc/). De bestanden staan in de repo. De site laadt ze dus niet van die server.

De logo’s zijn eigendom van de clubs. Football-logos.cc staat gebruik toe voor informatieve, redactionele en fanprojecten. Gebruik voor winst is niet toegestaan, en de site mag geen verbinding met de clubs suggereren. Houd deze competitie daarom non-commercieel.

Een logo vervangen:

1. Download de SVG van de logopagina op football-logos.cc.
2. Zet het bestand in `src/assets/logos/` met de club-ID als naam, bijvoorbeeld `ars.svg`.

## Standbepaling

Een winst geeft 3 punten, een gelijkspel 1 punt en een verlies 0 punten. De volgorde is:

1. punten
2. doelsaldo
3. doelpunten voor
4. onderling resultaat
5. clubnaam

## Bekend punt

Een build op Windows geeft de bestanden voor het vooraf laden van pagina's een verkeerde naam. De browser meldt dan twee 404-fouten in de console. De navigatie werkt wel. Een build op Linux (GitHub Actions) heeft dit probleem niet.
