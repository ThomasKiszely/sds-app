# Arbejdsgang

## Branches

| Branch      | Formål                                                    |
|-------------|-----------------------------------------------------------|
| `master`    | Produktion. Railway deployer automatisk ved hvert push.   |
| `develop`   | Integration. Her samles features og testes før release.   |
| `feature/*` | Én feature eller fix. Laves ud fra `develop`.             |

Der pushes aldrig direkte til `master`. Alt kommer ind via pull requests.

## Ny feature

```bash
git switch develop
git pull
git switch -c feature/kort-beskrivelse
# ... kode, commits ...
git push -u origin feature/kort-beskrivelse
gh pr create --base develop
```

Når CI er grøn og en anden har kigget på PR'en, merges den til `develop`.

## Release til produktion

1. Test `develop` lokalt (`npm run dev`) mod en test-database, ikke produktionsdatabasen.
2. Opret en PR fra `develop` til `master`.
3. Når CI er grøn, merges PR'en. Railway deployer derefter `master`.

## Hvad CI tjekker

Workflowet ligger i `.github/workflows/ci.yml` og kører på alle PR'er og pushes til `develop` og `master`.

- **Lint + templates.** ESLint (`eslint.config.js`) fanger syntaksfejl, variabler der bruges uden at være importeret, og ubrugt kode. Derefter kompileres alle `.ejs`-filer, så en fejl i en template stopper PR'en i stedet for at give en 500 i produktion. `npm ci` fejler også her, hvis `package-lock.json` ikke passer til `package.json`.
- **Unit tests.** `vitest run`.
- **Smoke test.** Starter serveren mod en tom MongoDB og tjekker at `/login` svarer 200, og at `/` og `/admin` sender ikke-loggede brugere til login. Fanger fejl som manglende moduler, forkerte requires og crash ved opstart.
- **Sikkerhedsaudit.** `npm audit` på produktionsafhængigheder. Fejler ved sårbarheder med niveau high eller critical.

Kør det samme lokalt før du pusher:

```bash
npm run lint
npm run check:templates
npm run test:run
npm audit --omit=dev --audit-level=high
```

Dependabot åbner ugentligt PR'er mod `develop` med opdaterede pakker.
