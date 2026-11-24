# Aree, città e regioni: cosa sistemare

Estratto il 24/11/2026 dal DB (sola lettura), solo agenzie **pubblicate** (1.495).

## Come funziona

- Il sito legge **solo** `agency_areas` (agenzia ↔ provincia o regione), che il trigger
  `agencies_allinea_aree` ricava dal testo libero `agencies.aree` (es. `Lombardia>Milano`). Per
  correggere l'area di un'agenzia si corregge `aree`: il resto si aggiorna da solo.
- `citta` e `regioni` sono testi usati solo nel brain (filtri, agenti): il sito non li legge.
- Chi scrive `aree`: l'agency-updater dall'indirizzo di Google (solo indirizzi italiani nel formato
  `CAP Comune PROV`), la scheda agenzia (testo libero, senza controllo), l'import CSV.

## Il quadro

| Situazione | Agenzie |
|---|---|
| Area riconosciuta, coerente | ~1.400 |
| **Senza area** (non compaiono in nessun archivio di città o regione) | **72** |
| Area incoerente o da verificare | 4 |
| Coordinate lontane dall'area (> 50 km) | 14 |
| `citta`/`regioni` scritti in modo diverso dall'area (solo brain, cosmetico) | 33 |

## 1. Senza area: indirizzo italiano che l'agente non sa leggere (23)

L'indirizzo c'è ma senza la sigla della provincia o con un a capo, quindi il resolver lo salta. Area
proposta da confermare:

| Agenzia | Indirizzo | Area proposta |
|---|---|---|
| Adc Marketing | Cesena, Emilia Romagna | Emilia-Romagna>Forlì-Cesena |
| BZ *(titolo da correggere, sito doc.bz.it)* | Via Talvera 2, 39100 Bolzano | Trentino-Alto Adige>Bolzano |
| Creativa | Via Galileo Galilei 11, Biella | Piemonte>Biella |
| DDF Influencer Agency | Via delle Baleari 228, 00121 Ostia (RM) | Lazio>Roma |
| Deklasrl | 87036 Rende (CS) | Calabria>Cosenza |
| Digital Agency Contat | 64032 Atri (TE) | Abruzzo>Teramo |
| Freelandia | Cagliari, Sardegna | Sardegna>Cagliari |
| GIAMP | Piazzale Marconi 2 Belluno | Veneto>Belluno *(la draft dello scouter diceva Cuneo: verificare)* |
| HUD | Via Magra 36, 04100 Latina | Lazio>Latina |
| Indirizzo *(titolo da correggere, sito filgrafica.com)* | Via 25 Aprile 34, 52100 Arezzo | Toscana>Arezzo |
| Lars | Trading Center, 39100 Bolzano | Trentino-Alto Adige>Bolzano |
| Livingstonweb | 26100 Cremona | Lombardia>Cremona |
| memphremagog | Via Santa Croce 84, 55100 LU | Toscana>Lucca |
| MY Marketing Lab | Sassuolo, Italia | Emilia-Romagna>Modena |
| ON Web | Viale Castracani 371, Lucca | Toscana>Lucca |
| Point | 59100 Prato (PO) | Toscana>Prato |
| RES | Via Chiodo 81, 19121 La Spezia | Liguria>La Spezia |
| Siti Premium | Cagliari | Sardegna>Cagliari |
| Web Agency Sardegna | Via Dettori 3, 09020 Samatzai | Sardegna>Sud Sardegna |
| WebSardinia | Sassari, Sardegna | Sardegna>Sassari |
| Wide Open Comunicazione | Circonvallazione Ragusa 33, Teramo | Abruzzo>Teramo |
| Wineuropa | 52037 Sansepolcro (AR) | Toscana>Arezzo |
| Zenzero Talentagency | 20123 Milano (MI) | Lombardia>Milano |

## 2. Senza area: sede all'estero (13)

Non esiste un'area per loro: oggi sono pubblicate ma fuori da ogni archivio geografico. **Decisione
da prendere**: tenerle (senza area), toglierle, o creare un'area estera (es. Canton Ticino).

- Svizzera (Ticino): Ander Group, Chili Adv, Gsite, Madball, Organica, Parisiva, SANDSTUDIO, SAYANA
  (+ Evemilano, che ha `Svizzera > Lugano`)
- Francia: Naboo, Prestashop
- San Marino: Prestalia
- Stati Uniti: IDA *(nel brain ha città "milano")*
- Messico: Performics Home

## 3. Senza area e probabilmente non agenzie (da valutare prima dell'area)

Titolo o sito non da agenzia italiana: **Asti** (formability.eu, indirizzo "Ragusa, Asti"),
**Playtime Power** (sproutsocial.com), **web.dev** (sito di Google), **Trasparenza**
(criterionglobal.com), **Freelogo Design**, **Prestashop** (software), **Readybooks**, **Storetasker
Resources**, **Americaneagle**, **Ispring**, **Cagliari** (titolo = città), **Brand Experience**
(growersagency.com), **Shopify Agency** (charleagency.com).

## 4. Senza area e senza indirizzo (resto dei 35)

Da cercare sul sito dell'agenzia: A Leads, A2area, Assembo, Capera, Care, Corporate Design, Creative
Webagency FG, Esse Tre Web, Excited, EXE Lab, Graffio Pubblicità, Kleisma, Lasinossi, Liquify,
Marketing Strategy, Medi Agency Digital, Nereida, ROMI Company, SaphìraCommunication, Then, To Get,
Web Designer Olbia, Web Inarpro.

## 5. Area incoerente

| Agenzia | `aree` oggi | Problema | Proposta |
|---|---|---|---|
| Zero Digital E | `Lombardia > Abruzzo` | Due regioni, nessuna città | Abruzzo>Teramo (la draft dello scouter indicava Castellalto, TE): verificare |
| Evemilano | `Svizzera > Lugano` | Estero | Vedi punto 2 |
| Lavder | `Toscana>Pistoia, Lazio>Roma` | Due città | Ok se ha davvero due sedi |
| Easy Digital Agency | `Lazio>Roma Toscana>Firenze` | Due città | Ok se ha davvero due sedi |

## 6. Coordinate lontane dall'area (> 50 km dal centro della provincia)

| Agenzia | Area | Distanza | Indirizzo Google | Probabile errore |
|---|---|---|---|---|
| We Are Social | Milano | 6.497 km | Corso S. Gottardo, Milano | Coordinate (area giusta) |
| Relevance | Milano | 988 km | Londra | Area o sede da verificare |
| RT studio | Palermo | 960 km | Bedano, Svizzera | Area o sede da verificare |
| The Strategy | Milano | 307 km | San Marino | Area o sede da verificare |
| Lavder | Pistoia, Roma | 262 km | Pistoia | Effetto delle due sedi |
| Adacto | Milano *(bloccata a mano)* | 239 km | Empoli (FI) | Probabile sede Milano messa apposta: verificare |
| Bee Social | Venezia | 172 km | San Marino | Area o sede da verificare |
| Comark | Reggio Emilia | 138 km | Correggio (RE) | Coordinate |
| Comunicarekairos, Mind Design, Manualipc, Dolomitesweb, MW Communication, Tagliente Staff | — | 54-90 km | comuni della stessa provincia | Nessuno (province grandi) |

## 7. Cosmetico: `citta` e `regioni` (solo brain)

33 agenzie hanno `citta`/`regioni` scritti in modo diverso dall'area riconosciuta (`Milano` invece di
`milano`, `monza-e-brianza` invece di `monza-e-della-brianza`, `Bolzano > Trentino alto adige`).
Il sito non li usa: si possono riallineare in blocco all'area con una query.

## Da sistemare nel codice (dopo la pulizia)

- Il resolver dell'updater legge solo `CAP Comune PROV`: aggiungere il riconoscimento del nome del
  comune/provincia senza sigla (gli stessi alias di `areas`).
- La scheda agenzia fa scrivere `aree` come testo libero: sostituire con una scelta dalla lista
  delle aree, così non nascono casi come `Lombardia > Abruzzo`.
