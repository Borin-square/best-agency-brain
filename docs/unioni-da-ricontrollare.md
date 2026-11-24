# Unioni automatiche da ricontrollare

Estratto il 24/11/2026 dal DB (sola lettura). Sono le unioni fatte dall'`agency-quality-check` in cui
l'agenzia che veniva dal sito WordPress (con `wp_id`) è finita nel cestino. In 10 casi ha vinto una
draft creata dallo scouter, negli altri 4 la vincente non esiste più.

Le schede si aprono nel brain all'indirizzo `/agenzie/<id>`. Nessun dato è perso: le perdenti sono
nel cestino con tutti i campi.

## Come sono nati

Tra il 3 e il 4 settembre lo scouter ha cercato su Google parole chiave tipo "influencer marketing
chieti" e ha inserito come nuove draft agenzie che c'erano già. Le draft hanno quasi sempre dati
peggiori:

- **città presa dalla parola chiave**, non dalla sede (Feelstudio "milano", Madmedia "udine", Social
  Needs "chieti");
- **sito = landing page interna**, non la home (`studiocappello.it/noi/migliore-agenzia-seo-trento-bolzano`);
- **titolo preso dalla pagina** ("Social", "Agenzia marketing Salerno").

Avendo più campi pieni (appena arricchite), nell'unione hanno vinto loro.

## A. Doppioni veri: ha vinto la scheda sbagliata (10)

Proposta per tutti: ripubblicare la perdente, cestinare la draft, copiare dalla draft nella perdente
solo i dati che mancano e sono giusti (es. la P.IVA di E26).

| # | Perdente (era su WP) | Città | Vincente (draft) | Città draft | Note |
|---|---|---|---|---|---|
| 1 | **VEZ** · `eb7d72c6-5a52-428d-8c69-e058e1ad8adb` · wp 237 | ancona | VEZ Comunicazione · `209d92cc-3c27-4443-98c2-cbd499dba5da` | ancona | Il titolo giusto è forse "VEZ Comunicazione": da tenere quello |
| 2 | **Arezzo Digitale** · `81e97503-13a1-433b-a585-2099740bf689` · wp 1719 | arezzo | Arezzo Digitale · `4b0505a8-fd0e-4627-a843-68df697bffc5` | arezzo | Identiche |
| 3 | **E26** · `e906d37d-dd18-4b4a-9287-e88bb905c648` · wp 1134 | napoli | E26 · `a4921266-8f69-4be4-8082-08c6b8daa3bb` | napoli | La draft ha la P.IVA (05967251215), la perdente no |
| 4 | **Immagina Group** · `39a9d613-2eb6-47d1-9ede-9bb1f2e4dcdc` · wp 1348 | roma | Immagina Group · `57313c60-1684-4246-95f0-6dfb68b1f9cd` | roma | Draft con sito = pagina "valle-d-aosta" |
| 5 | **Social Needs** · `b092832d-4071-484e-a5d6-4b35a4783bba` · wp 1906 | — | Social Needs · `babc3900-f835-4f2e-9161-b3f371955e19` | chieti (keyword) | Città da verificare: la perdente non ce l'ha |
| 6 | **Wearemad Media** · `55acf885-de8d-48eb-bf45-a9b270a9bc78` · wp 1654 | venezia | Madmedia · `4a130776-a016-4d0e-916c-26ce4bd3d76f` | udine (keyword) | |
| 7 | **Agenzia Influencer Marketing** · `b19c33dc-60b3-4634-83bf-f1814d0d6b8e` · wp 1571 | venezia | Feelstudio · `ee3c446a-c4f8-4941-98d6-d8cf7852ff2f` | milano (keyword) | Il titolo giusto è "Feelstudio", non quello della perdente |
| 8 | **MAYANprojects** · `06d199c7-335e-4bfb-8bd3-9b11f063cd1b` · wp 1246 | pescara | "Social" · `e4daf77f-dfcd-41b4-8e5e-480b60aace5d` | chieti (keyword) | La draft è la pagina /social del loro sito |
| 9 | **Data** · `d9b2dd41-f50b-40ae-b8e7-25b3cd2d4227` · wp 1315 | roma | Studio Cappello · `ff7008cd-9879-4975-b1d2-590bd17fe080` | venezia | Il titolo "Data" su WP è sbagliato: l'agenzia è Studio Cappello. Città da verificare (nessuna delle due è sicura) |
| 10 | **Partner meravigliä** · `ad5fa493-fe9c-4113-a21c-b17b9a0aeb63` · wp 1471 | torino | "Agenzia marketing Salerno" · `f910ff56-2c0d-43ab-874b-4ddc51373c57` | salerno | `partner.meraviglialab.com` sembra una rete di partner, non un'agenzia: decidere se va tenuta |

## B. La vincente non esiste più (4)

La vincente è stata cancellata dal DB (non cestinata) dopo l'unione: chi l'ha fatto e perché non
risulta.

| # | Perdente | Città | Origine | Proposta |
|---|---|---|---|---|
| 11 | **Gust Comunicazione** · `ec1e20d1-e17f-47e7-88d0-dd2b04324d60` · wp 1091 | monza-e-della-brianza | WP | Ripubblicare (sistemando il titolo, oggi contiene il dominio tra parentesi) |
| 12 | **Merchandising** · `650fa5fe-a0d2-4dfa-94ab-1a3fdcc5f8dc` · wp 901 | milano | WP | Sito `trade-srl.eu`: verificare che sia un'agenzia prima di ripubblicarla |
| 13 | Kolsquare · `aeeeabb2-82de-4857-85c1-acaab0a87da1` | tortolì | scouter | Piattaforma, non agenzia: **lasciare nel cestino** |
| 14 | SeedingUp · `68069018-788d-4ae8-bf7d-6786e65cda13` | lanusei | scouter | Piattaforma, non agenzia: **lasciare nel cestino** |

## Fatto

- 24/11/2026: **#9 Data → Studio Cappello** (`/agenzia/studio-cappello/`), **#7 Agenzia Influencer
  Marketing → Feelstudio** (`/agenzia/feelstudio/`), **#11 Gust Comunicazione**
  (`/agenzia/gust-comunicazione/`). Ripubblicate con slug nuovo, vecchio URL in 301, draft doppioni
  nel cestino. Verificato su `site.agency_redirects` e `site.agencies`. Da controllare ancora: la
  città di Studio Cappello (oggi "roma").

## Cosa succede allo slug quando si ripubblica (verificato sui trigger reali)

- Rimettere `publish_status = publish` (anche dalla scheda) genera `public_slug` una volta sola: è
  lo slug WordPress senza il `-{wp_id}` finale (`vez-237` → `vez`), cioè l'URL del live. Nessuno dei
  12 slug è oggi occupato da un'altra agenzia.
- Se lo slug ha un 410 in `agency_redirects`, la ripubblicazione lo toglie da sola: la pagina torna
  200.
- `public_slug` dopo non si cambia più. Il titolo non conta: "Data" rinominata "Studio Cappello"
  resta su `/data/`. Se si vuole un URL diverso va scritto `public_slug` **prima** di pubblicare
  (con una query: dalla scheda non si modifica). Casi: Data, Agenzia Influencer Marketing (Feelstudio),
  Gust Comunicazione.

7 di queste erano sul live e sono state cancellate il 6/11 perché nel cestino su Supabase (cioè per
effetto di queste unioni), e oggi hanno un 410: Arezzo Digitale, Data, Gust Comunicazione, Immagina
Group, MAYANprojects, Merchandising, Wearemad Media. Le altre 5 (VEZ, E26, Social Needs, Agenzia
Influencer Marketing, Partner meravigliä) non risultano né tra le cancellate né tra le schede del live.

Con il quality-check in pausa non c'è rischio che le riunisca.
