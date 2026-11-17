-- =====================================================================
-- 0035_importa_contenuti_wordpress.sql
--   Importazione una tantum dei contenuti editoriali dal sito WordPress
--   (17/11/2026): l'autore con articoli, 14 categorie, 10 articoli e le
--   pagine Chi siamo e Metodologia, con i testi convertiti in Markdown.
--   - I link interni verso URL /magazine/... inesistenti puntano agli
--     articoli veri; quello verso un articolo mai scritto è tolto.
--   - Le copertine restano per ora sugli URL di WordPress: le sposta
--     nello storage la sezione Contenuti del brain.
--   - Non sovrascrive nulla: se una riga esiste già, la salta.
-- =====================================================================

do $imp$
declare
  dominio uuid := (select id from public.network_domains where domain = 'miglioreagenzia.it');
begin
  insert into public.content_authors (domain_id, slug, name) values (dominio, $t$nicola-ferrari$t$, $t$Nicola Ferrari$t$)
  on conflict (domain_id, slug) do nothing;

  insert into public.article_categories (domain_id, slug, name, description) values
    (dominio, $t$comunicazione$t$, $t$Comunicazione$t$, null),
    (dominio, $t$digital-pr$t$, $t$Digital PR$t$, null),
    (dominio, $t$email-marketing$t$, $t$Email marketing$t$, null),
    (dominio, $t$eventi$t$, $t$Eventi$t$, null),
    (dominio, $t$geo$t$, $t$GEO$t$, null),
    (dominio, $t$google-ads$t$, $t$Google ADS$t$, null),
    (dominio, $t$inbound-marketing$t$, $t$Inbound Marketing$t$, null),
    (dominio, $t$lead-generation$t$, $t$Lead generation$t$, null),
    (dominio, $t$marketing$t$, $t$Marketing$t$, null),
    (dominio, $t$meta-ads$t$, $t$Meta ADS$t$, null),
    (dominio, $t$pr$t$, $t$PR$t$, null),
    (dominio, $t$seo$t$, $t$SEO$t$, null),
    (dominio, $t$uncategorized$t$, $t$Uncategorized$t$, null),
    (dominio, $t$web-design$t$, $t$Web design$t$, null)
  on conflict (domain_id, slug) do nothing;

  insert into public.articles (domain_id, slug, title, body_md, cover_url, cover_alt, cover_width, cover_height,
                               author_id, status, published_at, wp_id)
  values (dominio, $t$quanto-costa-un-evento-aziendale-con-unagenzia$t$, $t$Quanto costa un evento aziendale con un'agenzia$t$, $t$L’evento aziendale è l’unico caso in marketing dove il fee dell’agenzia è la voce meno importante del preventivo. Il fee tipicamente vale il 10-20% del totale — significativo, ma non dominante. Il grosso è altrove: location, catering, tecnica audiovisiva, produzione contenuti, personale della giornata, ospiti. Sono voci in cui non avete visibilità diretta se non organizzate eventi con regolarità, e sono anche le voci dove si annidano i mark-up opachi dei fornitori terzi — che si sommano al fee dichiarato dell’agenzia e possono portare il costo reale ben oltre quello percepito.

Chiedere «quanto costa un evento aziendale» è come chiedere «quanto costa costruire una casa»: la risposta media è inutile perché la varianza è enorme. Un aperitivo aziendale per 50 persone in una sala interna può costare 8.000 €. Una convention da 400 persone su due giorni residenziali fuori Milano può costare 350.000 €. Un lancio prodotto internazionale con produzione video sofisticata e streaming professionale può superare il milione. Sono tutti «eventi aziendali». Sono progetti così diversi che parlarne come categoria unica è già un errore metodologico.

Questa guida spiega le sette voci di costo che compongono un preventivo eventi, quali proporzioni interne hanno tipicamente, quali cinque fasce di budget corrispondono a quali tipologie di evento, come si calcola davvero il fee dell’agenzia (dichiarato + mark-up nascosto), quali voci sono spesso omesse dai preventivi che vi presentano, dove si può negoziare e dove no, e cosa cambia a Milano rispetto alle altre città italiane. In fondo, un pezzo sul cluster nascente degli eventi sostenibili — quanto costano davvero e quando ha senso investirci.

Nessuna delle agenzie che linkeremo da questa guida ha pagato per essere consigliata. Nessuna posizione in classifica è acquistabile. [Spieghiamo come selezioniamo →](/metodologia/)

---

## Le sette voci di costo di un evento aziendale

Un preventivo eventi ben fatto scompone il totale in sette voci principali. Le proporzioni cambiano molto in base al formato (un lancio prodotto ha più produzione, una convention residenziale ha più location e catering, un congresso ha più ospiti), ma le sette voci ci sono quasi sempre. Un preventivo che le fonde in tre-quattro macro-voci sta nascondendo, non semplificando.

**Location (15-30% del totale).** Il costo dell’affitto dello spazio per la durata dell’evento più eventuali giorni di allestimento e disallestimento. Include tipicamente attrezzatura base della sala (sedie, tavoli standard, cabine di regia se disponibili). Non include il catering. Le location premium urbane (Palazzo Mezzanotte, Palazzo Reale, Circolo Filologico a Milano; Palazzo Colonna, Palazzo Barberini a Roma) hanno tariffe da 15.000-60.000 € al giorno. Hotel congressuali standard vanno da 3.000 a 15.000 € al giorno. Spazi non convenzionali (ex-industriali, coworking di prestigio, gallerie) sono variabili: dai 5.000 ai 30.000 € al giorno.

**Catering (12-25% del totale).** Include cibo, bevande, personale di servizio, allestimento tavoli e mise en place. È la voce dove il livello di ambizione fa la differenza più visibile: un catering finger food serale con vino comune costa 40-60 €/persona; un pranzo tre portate con vino selezionato costa 80-120 €/persona; una cena di gala con menu firmato e sommelier costa 180-350 €/persona. La qualità del catering è tra i tre driver più segnalati nei feedback post-evento — se il budget richiede tagli, tagliarlo pesantemente è rischioso.

**Tecnica audiovisiva e staging (10-20% del totale).** Regia video, schermi, palcoscenico, luci, microfoni, streaming quando previsto. Un allestimento standard per convention da 200 pax costa 8.000-20.000 €. Streaming professionale con multi-camera aggiunge 5.000-25.000 €. Palchi custom con LED wall costano 20.000-80.000 €. È la voce dove i risparmi visibili si pagano cari: una tecnica sotto-strutturata rovina l’esperienza in modi che si notano subito.

**Personale della giornata (5-12% del totale).** Hostess, security, tecnici di sala, coordinatori. Una hostess professionale costa 250-400 € al giorno; un tecnico A/V esperto 400-700 € al giorno; security specializzata 300-500 € al giorno per persona. Per eventi da 200-500 pax servono tipicamente 6-15 hostess, 3-6 tecnici, 2-4 security. Sono cifre che si sommano rapidamente.

**Produzione contenuti (8-18% del totale).** Video promozionali, sigle, keynote design, storyboard, printed materials, contenuti pre-evento e follow-up. Un video di apertura professionale costa 8.000-40.000 €; una keynote presentation curata da uno studio 3.000-15.000 €; il pacchetto di contenuti asincroni post-evento (highlights, clip social) 5.000-25.000 €. È la voce dove le agenzie strategico-creative valgono più di quelle esecutive.

**Ospiti e speaker (0-15% del totale, molto variabile).** Cachet di speaker esterni, traduzione simultanea, alloggio e trasporto ospiti. Un keynote speaker italiano di livello nazionale costa 5.000-25.000 €. Uno speaker internazionale (autore, ex-CEO noto) costa 25.000-150.000 €. Un moderatore professionale di livello 3.000-10.000 €. Se l’evento è internazionale, la traduzione simultanea aggiunge 4.000-12.000 € per la giornata.

**Fee agenzia (10-20% del totale).** La voce «visibile» dell’agenzia. In modelli full-service è dichiarata come percentuale del totale o come fee fisso; nei modelli di coordinamento è quasi tutto il costo dell’agenzia. Attenzione: come vedremo sotto, il costo reale dell’agenzia è tipicamente superiore al solo fee, perché include mark-up sui fornitori terzi non sempre dichiarati.

**Come regola pratica.** Sommate location + catering: se supera il 50% del totale, siete su un evento fisico-first (residenziali, hospitality-heavy). Se scende sotto il 30%, siete su un evento production-first (lanci, brand event con forte parte contenutistica). Le due tipologie hanno logiche diverse di ottimizzazione del budget.

---

## Cinque fasce di budget con esempi concreti

Le fasce sotto sono ordini di grandezza per eventi in Italia con team senior. Come nelle nostre altre [guide prezzo](/quanto-costa-unagenzia-di-marketing-in-italia/), sono orientamento, non tariffario. La stessa tipologia di evento può variare del 100% in base a location, produzione, ospiti, città.

### Sotto 20.000 € — Micro-eventi e gathering

Aperitivi aziendali informali per 30-60 persone in sala interna o location piccola, cene di team ristrette (fino a 40 pax), team building brevi da mezza giornata. La quota fee agenzia è ridotta perché il coordinamento è leggero; molte aziende gestiscono questa fascia in autonomia con supporto puntuale di un event planner freelance.

Casi tipici: aperitivo di lancio libro con 40 giornalisti; cena di team leadership 25-30 pax; briefing esteso con investitori a fine anno; welcome dinner residenziale ristretto.

### 20.000-50.000 € — Piccoli eventi corporate

Cene aziendali formali per 60-120 pax in location di livello, aperitivi brand con contenuti leggeri, team building strutturati per 50-100 pax con una notte residenziale, mini-convention interne da mezza giornata per 80-150 pax urbane.

In questa fascia il fee agenzia inizia a giustificarsi (12-18% tipico) perché coordinare più fornitori senza esperienza costa molto in ore interne. Il rischio principale è il under-investment sulla produzione contenuti — le agenzie meno esperte trascurano video e keynote per contenere il budget.

Casi tipici: cena di anniversario aziendale con premiazione dei 20 anni di dipendenza; team building outdoor 60 pax con notte in agriturismo; kick-off Q1 urbano una giornata con tavola rotonda.

### 50.000-150.000 € — Convention e brand event medi

Convention interna 100-300 pax un giorno urbana; lancio prodotto stampa/influencer 100-200 pax con produzione video e allestimenti curati; convention residenziale piccola 100-200 pax due giorni; awards di categoria 150-300 pax con premiazione.

Fascia sana per PMI evolute e mid-market che fanno un evento «serio» all’anno. Il fee agenzia è dichiarato tipicamente 12-18% del totale; il costo reale dell’agenzia (fee + mark-up) può arrivare al 25-30% del totale. Attenzione ai preventivi «tutto compreso» che non scompongono le voci — è la fascia dove i mark-up opachi pesano di più in percentuale.

Casi tipici: lancio prodotto luxury al Palazzo Serbelloni con 180 giornalisti/influencer; convention di rete assicurativa 250 pax un giorno con talk; awards annuali di categoria 300 pax con cena di gala.

### 150.000-500.000 € — Convention enterprise e congressi

Convention residenziale 300-600 pax due giorni fuori porta con produzione strutturata; congresso settoriale 400-800 pax con sponsor, streaming, program committee; brand event significativo 300-500 pax con produzione TV-level; gala luxury 300-500 pax con format editoriale sofisticato.

Fascia enterprise standard: aziende quotate, gruppi bancari, farmaceutico, industriale strutturato. Il fee agenzia scende in percentuale (10-15%) ma sale in assoluto. La complessità stakeholder è alta — coordinamento con reparti interni, gestione sponsor, invitations su liste multi-database. In questa fascia è essenziale avere un event manager interno che tenga le fila.

Casi tipici: convention nazionale di rete bancaria 450 pax due giorni a Cernobbio; congresso farmaceutico 600 pax con ECM, streaming e sponsor; assemblea soci di gruppo quotato con post-agenda in hotel congressuale.

### Sopra 500.000 € — Grandi eventi enterprise e format editoriali

Convention enterprise 800-1.500 pax multi-giorno con format contenutistico strutturato; grandi congressi settoriali internazionali 1.000-3.000 pax; gala di categoria con premiazione mediatica; brand event con produzione TV-quality e streaming multi-country; celebrazioni corporate multi-brand.

Fascia senza tetto naturale: eventi di gruppo multi-nazionale possono superare 2-3 milioni. Il fee agenzia in valore assoluto è alto ma scende in percentuale (8-13%). A questi livelli il modello contrattuale è tipicamente coordinamento management + progetti a corpo su singole voci, non full-service classico.

Casi tipici: convention annuale multinazionale 1.200 pax tre giorni Costa Smeralda; format editoriale in prima serata con talk e talent 800 pax alla Triennale; celebrazione centenario azienda con eventi multi-città.

---

## Il fee agenzia: cosa include e come si calcola davvero

Il fee dichiarato dell’agenzia è quasi mai il costo reale dell’agenzia. Capire la differenza è la parte più importante — commercialmente — della lettura di un preventivo eventi.

**Il fee dichiarato** è tipicamente calcolato in tre modi: come fee fisso a progetto (soprattutto per eventi enterprise ricorrenti), come percentuale del totale (12-20% è la fascia standard italiana), o come modello ibrido con parte fissa + variabile in base a KPI di riuscita.

**Il mark-up sui fornitori terzi** è l’altra metà del costo dell’agenzia — quasi sempre non dichiarata come tale, ma incorporata nei prezzi dei fornitori girati al cliente. È tipicamente 12-25% sul valore netto del fornitore. Se il catering al netto è 30.000 €, il valore girato al cliente è 34.000-37.000 €. Se la tecnica al netto è 15.000, il valore girato è 17.000-19.000. Sommato su un evento da 200.000 €, il mark-up complessivo vale 25.000-45.000 €.

**Il costo reale dell’agenzia (fee dichiarato + mark-up)** è tipicamente il 20-40% del budget totale. Non è per forza un problema — è il costo della complessità operativa, della selezione dei fornitori, del rischio operativo che l’agenzia si assume — ma è un dato che dovreste conoscere, non ignorare.

**La domanda diretta al primo colloquio.** «Qual è il vostro fee dichiarato e qual è il vostro mark-up sui fornitori terzi?» Le agenzie serie rispondono con due numeri (esempio: «fee 15%, mark-up medio 18%»). Le agenzie mediocri rispondono in modo vago o citano cifre non credibili («mark-up del 3-5%») — significa che il numero è più alto ma nascosto.

**Un modello alternativo: il coordinamento con fee esplicito.** L’agenzia lavora come consulente/coordinatore, voi contrattualizzate direttamente i fornitori. Il fee agenzia sale (25-40% del totale), ma non c’è mark-up nascosto sui fornitori. Su eventi da 100.000 € in su, questo modello spesso è più conveniente in termini economici — e sempre più trasparente. È adatto ad aziende con team interno strutturato che può gestire contratti multipli.

---

## Voci di costo spesso omesse dai preventivi

Un preventivo eventi mediocre non è quello con i numeri sbagliati — è quello che dimentica voci che poi emergono in corso. Sette voci ricorrenti da chiedere esplicitamente se non compaiono.

**Assicurazioni.** Annullamento evento (per forza maggiore, indisponibilità location), RCT (responsabilità civile terzi) per il giorno, RCO (responsabilità civile prestatori d’opera). Su un evento medio costano 800-4.000 € complessivamente. Chi omette l’assicurazione dal preventivo espone voi al rischio integrale.

**Permessi e diritti.** SIAE (per musica, danza, contenuti coperti da diritto d’autore) è quasi sempre dovuta e si paga in base a partecipanti + durata. Autorizzazioni comunali per eventi in luoghi pubblici. Autorizzazioni sanitarie per catering complesso. Costo tipico: 500-5.000 € in base al tipo di evento.

**Contingency budget.** Un margine del 10-15% del totale per gestire imprevisti — cambio di fornitore last-minute, ora aggiuntiva di regia, catering extra per partecipanti oltre l’aspettativa. I preventivi seri lo includono come voce dichiarata. I preventivi opachi lo omettono e poi vi presentano l’extra a evento avvenuto.

**IVA.** Sembra ovvio ma non lo è: molti preventivi eventi mostrano cifre «IVA esclusa». Su un budget da 100.000 €, l’IVA al 22% vale 22.000 € reali. Verificate sempre se le cifre sono nette o lorde.

**Straordinari giornata / turnisti extra.** Il costo di ore aggiuntive di personale se l’evento sfora l’orario previsto. Non è raro — un evento dalle 18 alle 23 che finisce alle 24 costa hostess e tecnici straordinari. Un preventivo serio dichiara la tariffa oraria straordinaria.

**Follow-up del post-evento.** Contenuti asincroni (highlights video, foto professionali, clip social, report riassuntivo), analytics, report NPS partecipanti. Non è sempre incluso — chi lo omette costringe voi a un budget aggiuntivo la settimana dopo o a rinunciare a asset che sarebbero utili nei mesi successivi.

**Trasporti VIP e navette.** Se avete ospiti che arrivano da fuori, trasporti dall’aeroporto, navette dal centro alla location, auto blu per VIP possono valere 3.000-15.000 €. Facilmente omessi.

**Traduzione simultanea.** Per eventi con speaker internazionali o audience mista. Non è solo il costo dell’interprete (2-3.000 € al giorno), ma anche cabine, cuffie, tecnica dedicata — un pacchetto simultaneo costa tipicamente 4.000-12.000 €.

---

## Dove si può negoziare (e dove no)

Non tutte le voci sono negoziabili nello stesso modo. Capire dove il margine c’è aiuta a discutere in modo produttivo.

**Si negozia bene:**

-   **Fee agenzia**, specialmente su eventi in bassa stagione o su agenzie che stanno costruendo il portfolio in un verticale nuovo per loro (2-5% di margine reale).
-   **Location fuori periodo di punta**: sconti 15-30% per location prestigiose in dicembre (dopo la settimana peak), agosto, prima settimana di gennaio, luglio.
-   **Catering**: menu semplificato, formato aperitivo cena vs cena servita, materiale mise en place standard invece di premium.
-   **Tempo di prenotazione**: le migliori tariffe sono a 6+ mesi. Meno di 8 settimane si paga tutto premium.

**Si negozia poco:**

-   **Costi diretti di fornitori premium** (tecnica di qualità, streaming professionale, palchi LED wall).
-   **Speaker con cachet di mercato**: se avete deciso una persona specifica, il suo cachet è quello.
-   **SIAE, tasse, permessi**: sono numeri fissi.
-   **Assicurazioni obbligatorie**.

**Non si negozia:**

-   La qualità dei fornitori serve a garantire la buona riuscita. Un catering «al ribasso» rischia di rovinare l’evento; una tecnica di seconda scelta lo azzoppa. Se il budget è tirato, meglio ridurre la scala (partecipanti, giorni) che comprimere la qualità delle voci critiche.

---

## Il fattore Milano: quanto pesa davvero

Come per SEO e marketing, Milano nel settore eventi è mediamente più cara. Ma per gli eventi la differenza è più marcata perché tutte le voci principali sono più alte, non solo il fee agenzia.

-   **Location Milano centro vs Bologna centro** a parità di metratura utile: +40-60%.
-   **Catering premium Milano vs media italiana**: +25-40%.
-   **Personale (hostess, tecnica di sala)**: +15-25%.
-   **Fee agenzia Milano vs altre città**: +15-25% (come per gli altri pilastri).

**Un evento equivalente a Milano costa tipicamente 25-40% in più che a Bologna, Firenze, Torino, Padova**. Un evento a Roma è tipicamente 10-20% più caro di Bologna ma 15-25% meno di Milano.

**Quando Milano vale il premium:**

-   Committente enterprise italiano con HQ a Milano (semplifica logistica interna).
-   Media coverage: certe testate hanno cronaca eventi solo su Milano, o vi mandano fotografi solo se l’evento è lì.
-   Network di categoria: certi settori (finance, luxury, fintech) hanno il proprio milieu concentrato a Milano.
-   Ospiti internazionali: Milano ha Linate + Malpensa e collegamenti diretti con più capitali europee.

**Quando conviene comunque fuori:**

-   Convention interne senza esigenza di media coverage.
-   Team building ed engagement (le location fuori città sono spesso più belle e più economiche).
-   Aziende con sede fuori Milano che pagherebbero comunque trasferte per lo staff milanese.
-   Eventi con obiettivo di sperimentazione (una location non-convenzionale in una città emergente può essere più memorabile).

---

## Il cluster nascente degli eventi sostenibili

Nel 2026 gli eventi sostenibili sono diventati una richiesta ricorrente — non ancora dominante, ma seria — soprattutto per aziende quotate, aziende con impegni ESG dichiarati, brand consumer che comunicano ambiente. Il tema ha implicazioni di costo che vale la pena capire.

**Cosa include un evento sostenibile:**

-   Energia rinnovabile in location (dove disponibile).
-   Riduzione carbon footprint del food (menu con ridotta impronta, catering locale, riduzione sprechi).
-   Materiali riciclati o riutilizzabili per allestimenti.
-   Compensazione CO2 delle emissioni residue tramite certificazioni riconosciute.
-   Trasporti condivisi per partecipanti (navette invece di auto individuali).
-   Contenuti digitali per ridurre stampe.
-   Certificazione ISO 20121 (standard eventi sostenibili) per casi più strutturati.

**Cost premium tipico**: +5-15% sul budget totale per un evento «genuinamente sostenibile» con certificazione. Il premium sale a +15-25% se si vuole compensazione CO2 completa da certificatori riconosciuti internazionalmente.

**Quando ha senso investire in sostenibilità reale**: aziende con impegni ESG pubblici e reporting formale, aziende con audience giovane sensibile al tema, aziende in settori sotto scrutinio ambientale (energy, industria, food) dove la coerenza è verificata dagli stakeholder.

**Il rischio greenwashing**: le agenzie che vi propongono «pacchetti sostenibili» a +2-3% del budget standard, senza certificazioni riconosciute e senza misurazione dell’impatto reale, stanno facendo greenwashing — cioè utilizzando il tema come argomento di vendita senza sostanza operativa. Il tema del greenwashing eventi è già stato affrontato in modo critico dalla stampa di settore, e diverse aziende hanno subito reazioni pubbliche per aver dichiarato sostenibilità inesistente.

**Regola pratica**: se investite in sostenibilità reale, il costo aggiuntivo va accompagnato da misurazione dell’impatto (CO2 evitata, materiali riciclati, energia rinnovabile) verificabile. Senza misurazione, è marketing — utile o meno, ma non sostenibilità.

---

## Domande frequenti

**Il fee dell’agenzia si negozia?**

In parte sì. La percentuale standard italiana è 12-20% del totale per full-service. Su questa fascia si può ottenere 2-5% di sconto se l’agenzia è in bassa stagione, se il progetto le apre un verticale nuovo che vogliono presidiare, o se vi impegnate a un contratto pluriennale. Sconti più aggressivi (7-10%) sono possibili solo su eventi molto grandi o su relazioni consolidate. Ma il fee non è dove state «pagando troppo» — a meno che il preventivo sia costruito con margini nascosti eccessivi.

**IVA compresa o esclusa nei preventivi eventi?**

Verificate sempre — è una delle differenze più grandi tra preventivi. Molti preventivi mostrano cifre «IVA esclusa» per motivi commerciali; su budget da 200.000 €, l’IVA al 22% vale 44.000 € reali. Fate sempre il calcolo lordo prima di confrontare. Nel 2026 l’IVA per servizi eventi è al 22% per la stragrande maggioranza delle voci (con qualche eccezione ridotta per catering di certe tipologie).

**Cosa succede al deposito se annullo l’evento?**

Dipende dal contratto. Le condizioni tipiche italiane: annullamento oltre 90 giorni prima → rimborso 70-90% del deposito; 60-90 giorni prima → rimborso 40-60%; 30-60 giorni prima → rimborso 10-30%; meno di 30 giorni prima → nessun rimborso. Le location hanno spesso condizioni proprie più rigide. Un’assicurazione annullamento evento (costa 0,5-2% del budget) copre il rischio nei casi di forza maggiore o eventi imprevedibili. Vale la pena farla per eventi sopra i 50.000 €.

**Posso portare i miei fornitori invece di quelli dell’agenzia?**

In molti casi sì, ma dipende dal modello contrattuale scelto. Nel full-service classico l’agenzia gestisce tutti i fornitori con propria selezione (portare vostri fornitori riduce il fee ma anche la responsabilità operativa dell’agenzia). Nel coordinamento la selezione dei fornitori è vostra e l’agenzia solo suggerisce. Un compromesso comune: l’agenzia gestisce fornitori critici (catering, tecnica, location) e voi gestite fornitori accessori (fotografia, video, contenuti se ne avete già uno). Discutetelo esplicitamente prima di firmare.

**Quanto costa in più un evento sostenibile certificato?**

Un evento «genuinamente sostenibile» con misurazione impatto e certificazione riconosciuta (ISO 20121 o simile) costa tipicamente +5-15% del budget standard. La compensazione CO2 completa con certificatori internazionali riconosciuti aggiunge un altro 3-8%. Le agenzie con esperienza reale su questo verticale sono ancora poche in Italia (2026): chi propone «pacchetti sostenibili» a costo aggiuntivo minimo o nullo probabilmente sta facendo greenwashing.
$t$,
          $t$https://miglioreagenzia.it/wp-content/uploads/2026/07/quanto-costa-un-evento-aziendale-con-agenzia.jpg$t$, $t$quanto costa un evento aziendale con agenzia$t$, 1200, 675,
          (select id from public.content_authors where domain_id = dominio and slug = $t$nicola-ferrari$t$),
          'publish', $t$2026-07-29 09:25:40$t$::timestamp at time zone 'Europe/Rome', 113)
  on conflict (domain_id, slug) do nothing;
  insert into public.article_category_links (article_id, category_id)
  select a.id, c.id from public.articles a join public.article_categories c on c.domain_id = a.domain_id
  where a.domain_id = dominio and a.slug = $t$quanto-costa-un-evento-aziendale-con-unagenzia$t$ and c.slug in ($t$eventi$t$)
  on conflict do nothing;

  insert into public.articles (domain_id, slug, title, body_md, cover_url, cover_alt, cover_width, cover_height,
                               author_id, status, published_at, wp_id)
  values (dominio, $t$come-scegliere-unagenzia-di-eventi-aziendali$t$, $t$Come scegliere un'agenzia di eventi aziendali$t$, $t$Le agenzie di eventi si dividono in due mestieri distinti che si vendono come uno solo. Da una parte gli **event planner esecutivi**: coordinamento logistico, gestione fornitori, run-of-show, ordini di servizio, timing operativi. Sono chi fa girare la macchina il giorno dell’evento — la parte del lavoro che si vede solo quando qualcosa va storto. Dall’altra le **agenzie strategiche e creative**: concept, format, produzione contenuti, regia dei momenti chiave, esperienza dei partecipanti. Sono chi decide come l’evento parla al pubblico e cosa vi resta il giorno dopo.

Quasi tutte si presentano come «full-service». Poche lo sono davvero. La maggioranza è forte su uno dei due lati e copre l’altro appaltando a terzi — spesso con mark-up opaco. Il primo lavoro reale, prima di richiedere preventivi, è capire quale dei due mestieri vi serve, o quale combinazione. Chi confonde le due cose finisce con eventi che funzionano tecnicamente ma non lasciano niente, o con eventi ricchi di idee che nel giorno collassano sull’organizzazione.

C’è un secondo malinteso da smontare. Nel 2026 gli eventi aziendali B2B non sono tornati «come prima del COVID». Sono cambiati strutturalmente. Le mega-convention da 2.000 persone in resort a Costa Smeralda sono meno frequenti. Al loro posto: format più contenutistici e curati, sedi più eterogenee (palazzi storici, ex-industriali riconvertiti, coworking di prestigio invece che solo alberghi congressuali), produzione ibrida di qualità come standard e non come extra, aspettativa di contenuti asincroni riutilizzabili nei mesi successivi. Le agenzie che vanno meglio oggi hanno saputo evolvere. Quelle che ancora vi propongono format del 2019 stanno perdendo terreno, e vale la pena non finirci dentro.

Questa guida spiega come si dividono davvero le agenzie di eventi in Italia, quali quattro tipologie di eventi B2B richiedono team diversi, come riconoscere un’agenzia seria (sei criteri) e come evitarne una mediocre (cinque red flag), come strutturare un brief eventi in una pagina, quanto tempo prima prenotare in modo realistico per stagione, quali fasce di budget hanno senso per formato e numero di partecipanti, e cosa distingue davvero il full-service dal coordinamento.

Nessuna delle agenzie che linkeremo da questa guida ha pagato per essere consigliata. Nessuna posizione in classifica è acquistabile. [Spieghiamo come selezioniamo →](/metodologia/)

---

## Le due famiglie di agenzie di eventi

**Event planner esecutivi.** Sono chi trasforma un piano in un evento reale: negoziazione con la location, coordinamento con il catering, gestione dei permessi e delle assicurazioni, logistica di trasporto e alloggio se residenziale, gestione delle hostess e del personale, tempistiche operative del giorno, gestione degli imprevisti. Team tipico: project manager senior, junior operativi, rete stabile di fornitori. Sono indispensabili — un evento senza planner esecutivo serio non funziona — ma raramente decidono l’anima dell’evento.

**Agenzie strategiche e creative.** Sono chi decide *cosa* l’evento vuole dire. Concept generale, format (talk, panel, workshop, awards, gala, mix), produzione contenuti (video, keynote, storyboard), regia dei momenti chiave, coordinamento speaker, esperienza estetica. Team tipico: creative director, event designer, content producer, video producer. Sono chi rende un evento memorabile invece che solo riuscito. Raramente hanno però la stessa forza operativa dei planner esecutivi puri — quando eseguono direttamente, si appoggiano a un partner logistico.

**Full-service, quando esiste davvero.** Le agenzie che tengono insieme i due mestieri con eguale competenza sono poche in Italia — tipicamente strutture da 25-80 persone con reparti distinti internamente. Si riconoscono per: team creativo e team di produzione visibilmente separati (con nomi propri), non un unico project manager che «coordina tutto»; portfolio con casi che mostrano cura sia creativa che operativa; capacità di raccontare al primo colloquio come le due squadre lavorano insieme, non come un mistero.

**Full-service, quando è solo un pitch.** Molte agenzie si dichiarano full-service ma nella pratica sono planner che appaltano la creatività a un partner (o viceversa). Non è un male in sé — la rete di partner può funzionare — ma dovreste saperlo. Le domande utili: chi disegna il concept internamente? Chi gestisce la produzione video? Chi coordina la location? Se le tre risposte contengono nomi di terzi che non sono in agenzia, non è full-service, è coordinamento.

**Come capire al primo colloquio.** Un’agenzia planner esecutiva vi porta a discutere subito di logistica, timing, permessi. Un’agenzia strategica creativa vi porta a discutere subito di obiettivo, format, esperienza. Una full-service vera fa entrambe le cose senza forzatura. Se una agenzia sta troppo su uno dei due lati e sull’altro è vaga, avete capito di che tipo è.

---

## Quattro tipologie di eventi B2B (che richiedono agenzie diverse)

Un’agenzia forte su convention interne raramente è quella giusta per un lancio prodotto. Un’agenzia specializzata in congressi di settore ha competenze specifiche che le rendono meno adatte al team building. Prima di scegliere, chiedetevi in quale delle quattro tipologie ricade il vostro evento.

**Convention interne (kick-off, sales meeting, board meeting).** Eventi rivolti al pubblico interno — dipendenti, sales, dirigenti. Logistica pesante (residenziale su 2-3 giorni, spesso), contenuti aziendali densi (piani, obiettivi, formazione, motivazione), esigenze di riservatezza (non-disclosure sui contenuti presentati). Il format è relativamente standardizzato, il rischio è la noia. Le agenzie serie in questa tipologia hanno esperienza di gestione stakeholder interni (CEO che cambiano idea, direttori marketing che vogliono aggiungere sessioni all’ultimo, sales manager con esigenze specifiche).

**Lancio prodotto e brand event.** Eventi rivolti a stampa, influencer, community, dealer, clienti chiave. Creatività alta (l’evento deve raccontare qualcosa di nuovo), produzione visuale forte (video, allestimenti, staging), esperienza dei partecipanti curata nei dettagli. Il format è variabile per definizione — parte del valore è nella soluzione non-ovvia. Le agenzie serie qui sono più vicine alle boutique creative che ai planner esecutivi puri, con una regia visiva riconoscibile.

**Congressi e conferenze di settore.** Eventi rivolti a un pubblico esterno di settore, con sponsor, ospiti internazionali, program committee, spesso con streaming. Complessità stakeholder alta (sponsor con esigenze contrattuali, ospiti con contratti individuali, comitati scientifici, media partner). Il format ha regole di settore da rispettare. Le agenzie serie qui hanno esperienza specifica di gestione sponsor, coordinamento speaker internazionali, produzione streaming professionale.

**Team building ed engagement.** Eventi rivolti al pubblico interno con obiettivo esplicito di coesione e cultura aziendale. Logica people-first, non brand-first — il partecipante deve sentirsi al centro. Format meno tradizionali (attività outdoor, workshop esperienziali, cene tematiche). Le agenzie serie qui sono più vicine al mondo HR che al marketing e hanno spesso una specializzazione su formati specifici (culinari, sportivi, culturali).

**Un’agenzia che vi dice di far bene tutte e quattro le tipologie** con la stessa competenza, di solito, ne fa bene una o due — quelle dominanti nel portfolio. Chiedete tre casi *nel tipo di evento che state pensando*. Se non li hanno, siete voi il primo esperimento, e va bene solo se accettate consapevolmente il rischio.

---

## Sei criteri per riconoscere un’agenzia di eventi seria

Sei criteri, applicati in serie a tre agenzie candidate, restituiscono un ordinamento affidabile. Sono coerenti con il metodo di scelta che usiamo negli altri pilastri del magazine, adattati alla specificità degli eventi.

**Specializzazione dichiarata.** Un’agenzia che dice «facciamo tutti i tipi di eventi per tutti i settori» non fa niente di specifico. Un’agenzia che vi dice «siamo forti sulle convention corporate B2B da 200-500 persone in ambito farmaceutico e finanziario» o «facciamo prevalentemente lanci prodotto e brand experience per luxury e fashion» vi sta dicendo dove ha vinto, dove ha imparato dagli errori, dove è pronta a lavorare al meglio.

**Casi con numeri di partecipazione e engagement.** Non «un bellissimo evento memorabile». Meglio: «convention da 340 partecipanti su 2 giorni residenziali, con 92% di NPS post-evento, 8 workshop paralleli, gestione di 47 fornitori esterni». I casi verificabili raccontano cosa avete concretamente organizzato, con quali numeri, con quali risultati. Le agenzie mediocri hanno solo foto in portfolio.

**Team di produzione interno, non solo project manager.** Le agenzie che eseguono davvero hanno un team di produzione dedicato — scenografi, video producer, event designer, direttori tecnici — non solo un project manager che coordina fornitori terzi. Il team interno di produzione è la garanzia che gli standard di qualità siano gestiti direttamente, non delegati.

**Rete di fornitori consolidata e dichiarata.** Chi lavora seriamente sugli eventi ha rapporti pluriennali con audiovisivi, allestitori, catering, hostess, security, location. Chiedete i nomi dei fornitori principali con cui lavorano da più di tre anni. Se la risposta è «lavoriamo con tanti fornitori diversi in base al progetto», o l’agenzia è generalista senza specializzazione, o ha turnover di fornitori indicativo di problemi di pagamento o di relazione.

**Trasparenza sui margini terzi.** La domanda diretta: qual è il vostro mark-up sui fornitori terzi? Le agenzie serie rispondono con un numero (tipicamente 12-25%) e lo dichiarano in preventivo come voce separata. Le agenzie mediocri rispondono in modo vago o citano cifre irrealisticamente basse — significa che il mark-up è più alto ma nascosto in altre voci. La trasparenza sul margine è uno dei migliori indicatori di serietà del rapporto commerciale.

**Contratto flessibile con clausole per gli imprevisti.** Gli eventi sono l’unica disciplina di marketing dove il rischio operativo è reale — un fornitore che salta, un ospite che cancella, una crisi che rende inopportuno lo svolgimento. Un contratto serio prevede clausole di rescheduling, gestione del contingency budget, responsabilità in caso di forza maggiore. Un contratto vago su questi punti espone voi al rischio integrale.

---

## Cinque red flag

**«Organizziamo qualsiasi tipo di evento per qualsiasi settore».** Il segnale più diretto di generalismo. Le agenzie serie hanno un profilo dichiarato. Chi vi propone tutto per tutti sta cercando volume di preventivi, non qualità di match.

**Preventivo tutto compreso senza breakdown.** «50.000 € tutto incluso, chiavi in mano». Sembra rassicurante, in pratica nasconde. Cosa succede se aggiungete 30 partecipanti? Cosa succede se il catering costa di più del previsto? Cosa succede se serve un secondo tecnico A/V? Senza breakdown per voce (location, catering, tecnica, personale, produzione contenuti, fee agenzia) non potete negoziare, non potete cambiare in corsa, non potete verificare cosa avete davvero comprato.

**Mark-up opaco sui fornitori terzi.** Un’agenzia che rifiuta di rispondere alla domanda «qual è il vostro mark-up sui fornitori» o cita cifre come «al massimo il 5%» sta o lavorando in perdita (poco credibile) o mentendo. Il mark-up sano è dichiarato — tipicamente 15-25% — e giustificato dal fatto che l’agenzia si prende in carico il rischio operativo e la selezione dei fornitori. Chi lo nasconde in altre voci vi sta facendo pagare di più senza dirvelo.

**Nessuna timeline di produzione dettagliata.** Un evento serio richiede una timeline dettagliata a partire da 3-6 mesi prima: contrattualizzazione location, brief speaker, produzione contenuti, prove tecniche, save-the-date, invitations, reminders. Un’agenzia che non vi presenta una timeline strutturata al primo colloquio sta improvvisando o si affiderà alla vostra pressione per accelerare all’ultimo momento — entrambe le cose portano a errori evitabili.

**Assenza di contingency budget.** Un preventivo eventi serio prevede un 10-15% di contingency per gestire imprevisti — un fornitore che cambia prezzo, uno speaker che chiede un cachet aggiuntivo, un problema tecnico dell’ultimo giorno. Se un preventivo è al centesimo senza margine per imprevisti, sappiate che gli imprevisti li pagherete voi in corsa, o l’evento avrà problemi che si potevano prevenire.

---

## Il brief per un’agenzia di eventi in una pagina

Un brief eventi ben fatto risparmia settimane di andata e ritorno. Otto blocchi, tutti importanti.

**Chi siete e perché fate questo evento.** Il «perché» è il primo — non «vogliamo fare un evento», ma «vogliamo lanciare X», «celebrare Y», «formare Z». Il perché guida le scelte di format più di ogni altra informazione.

**Obiettivo dichiarato.** Informativo (comunicare qualcosa), celebrativo (marcare un traguardo), motivazionale (energizzare persone), commerciale (generare business), reputazionale (posizionare). Spesso è un mix — dichiaratelo e ponderatene le priorità.

**Formato desiderato o «aperti a proposte».** Convention, lancio, congresso, team building, awards, gala, mix. Se avete già deciso, ditelo. Se siete aperti a proposte creative, ditelo esplicitamente — le agenzie strategiche vi ringrazieranno e vi porteranno idee vere invece di adattarsi al vostro format assunto.

**Data preferita e finestra di tolleranza.** «Il 12 novembre 2026» è diverso da «una data tra il 5 e il 25 novembre 2026». La flessibilità aiuta l’agenzia a trovare location e fornitori migliori. Se la data è fissa (es. anniversario aziendale), ditelo — l’agenzia dovrà accettare la maggiore rigidità.

**Numero partecipanti e profilo.** 150 persone, 60% clienti B2B, 30% partner, 10% stampa. Il numero determina la logistica; il profilo determina il tono, il format, le esigenze specifiche (translation, food restrictions, VIP handling). Se avete una lista preliminare di ospiti VIP con esigenze speciali, allegatela.

**Budget indicativo o range.** Un range è meglio di un numero unico. «Tra 120 e 180 mila €, esclusa la produzione video che gestiamo internamente» filtra da subito le agenzie sbagliate. Se non avete un budget definito, ditelo esplicitamente e chiedete tre scenari (baseline, ambizioso, premium) da confrontare.

**Location: già scelta o da proporre.** Fondamentale. Se avete già scelto (una vostra sede, un hotel già bloccato, un palazzo storico specifico), ditelo. Se accettate proposte, indicate città + preferenze (centro storico vs periferia, urbana vs country, capacity minima). La location è tra i primi tre driver del preventivo, insieme a partecipanti e produzione.

**Chi decide dentro l’azienda.** In eventi il processo decisionale conta doppio. Un evento con un solo decision maker è diverso da uno con un board che deve approvare passaggi intermedi. Un evento in cui il CEO ha veto sul concept è diverso da uno gestito dal marketing team. L’agenzia deve saperlo per calibrare i tempi di revisione e i punti di verifica.

Un brief così si scrive in due-tre ore. In cambio ricevete proposte più mirate, e le agenzie meno adatte si defileranno risparmiando tempo a tutti.

---

## Timing di prenotazione realistico per stagione

Gli eventi hanno una fisicità inevitabile: le location sono finite, i fornitori seri sono contesi, i periodi di picco saturano il mercato. Un errore ricorrente è cercare l’agenzia troppo tardi — meno del 30% dei progetti che partono con meno di 8 settimane di margine finisce con le location e i fornitori originariamente desiderati.

**Milano, picco autunnale (novembre-dicembre): 6-9 mesi prima.** Il periodo di picco per convention aziendali di fine anno, cene di gala, awards. Le location prestigiose (Palazzo Mezzanotte, Palazzo Reale, hotel storici, Circolo Filologico, spazi Fiera Milano) si prenotano entro maggio-giugno.

**Milano, picco primaverile (aprile-maggio): 5-7 mesi prima.** Convention di piano industriale, kick-off Q2, meeting di rete. Le location si prenotano tra ottobre e dicembre dell’anno prima.

**Roma, picco primavera (maggio-giugno): 5-8 mesi prima.** Convention primaverili istituzionali, eventi di rete, congressi Vaticano/PA. Le location del centro storico si prenotano da novembre-dicembre.

**Roma, picco autunno (settembre-ottobre): 5-8 mesi prima.** Convention di ripresa post-estate, congressi accademici, eventi editoriali.

**Eventi 100-500 partecipanti in location standard (hotel congressuali fuori centro, spazi eventi): 3-6 mesi.** Fascia media, dove la scelta è ancora ampia se prenotate con 4-5 mesi.

**Eventi 500+ partecipanti o location premium: 6-12 mesi.** La saturazione del mercato di alto livello richiede lead time lunghi. Le convention da 800-1.500 persone in periodo di punta si programmano un anno prima.

**Eventi last-minute (meno di 8 settimane): possibili solo con reti già attive.** Le agenzie che hanno relazioni consolidate con location e fornitori possono anche organizzare in 6-8 settimane. Le agenzie generiche no. Se avete davvero un’urgenza, cercatene una che gestisce eventi analoghi in ricorrenza.

**Attenzione ai buchi neri stagionali.** Metà dicembre (chiusura anno fiscale), agosto (vacanze), prima settimana di gennaio. In questi periodi trovare location e fornitori seri è quasi impossibile — e le agenzie brave sono chiuse.

---

## Fasce di budget per format e numero partecipanti nel 2026

I numeri sotto sono ordini di grandezza per eventi in Italia con team senior sul progetto. Sono fasce di orientamento, non tariffari: gli eventi hanno una varianza enorme in base a location, produzione, ospiti, catering. Approfondiamo per esteso nell’articolo dedicato [Quanto costa organizzare un evento aziendale](/quanto-costa-un-evento-aziendale-con-unagenzia/).

-   **Convention interna 50-100 pax, 1 giorno urbana**: 30-70k € (location + catering + tecnica + fee agenzia).
-   **Convention interna 200-500 pax, 2 giorni residenziale fuori porta**: 150-400k €.
-   **Lancio prodotto 100-300 pax con produzione video e allestimenti**: 80-200k €.
-   **Congresso 500+ pax con streaming, sponsor, ospiti**: 200-600k €.
-   **Team building 30-100 pax esperienziale**: 15-60k €.
-   **Format editoriale/talk 100-200 pax con speaker e produzione**: 40-100k €.
-   **Awards/gala 200-400 pax in location premium**: 100-300k €.
-   **Convention enterprise 800-1500 pax multi-giorno**: 500k-1,5M €.

Come regola pratica: la voce location + catering è tipicamente il 40-55% del totale per eventi residenziali, il 30-45% per eventi urbani. La produzione tecnica pesa 15-25%. Il fee agenzia — dichiarato o mascherato nel mark-up sui fornitori — vale tipicamente il 10-20% del totale. Se una di queste proporzioni è molto diversa, chiedete perché.

---

## Full-service vs coordinamento: cosa distingue davvero

Nel preventivo eventi, tre modelli operativi ricorrenti — sceglierli consapevolmente cambia il rapporto con l’agenzia e il budget.

**Full-service (all-in).** L’agenzia gestisce tutto: concept, location, fornitori, produzione, follow-up. Voi decidete gli input strategici e approvate; l’agenzia esegue con autonomia operativa. Vantaggio: minimo coinvolgimento del vostro team, un solo interlocutore, meno stress. Svantaggio: costo più alto (mark-up sui fornitori terzi), minore trasparenza sui costi di dettaglio, dipendenza operativa. Sano per aziende con team interno piccolo o assente.

**Coordinamento / production management.** L’agenzia fa strategia e coordinamento operativo, ma voi ingaggiate direttamente fornitori chiave (location, catering, video producer) su indicazione dell’agenzia. Vantaggio: pagate solo il fee agenzia + i costi diretti dei fornitori, senza mark-up nascosto. Svantaggio: più coinvolgimento operativo del vostro team, gestione amministrativa multipla, responsabilità distribuita in caso di problemi.

**Hybrid.** L’agenzia fa la strategia creativa; per la logistica appaltate a un event planner esecutivo separato. È la combinazione più flessibile ma anche la più impegnativa da coordinare: due fornitori che devono lavorare insieme, con rischio di scarico di responsabilità. Funziona con aziende strutturate che hanno un event manager interno che tiene le fila.

La scelta dipende dalla dimensione del vostro team interno, dalla familiarità con la gestione eventi, dal budget, e dalla frequenza con cui organizzate eventi (una volta ogni due anni vs quattro l’anno). Nessuno dei tre modelli è oggettivamente migliore — dipende dal contesto.

---

## Domande frequenti

**Quanto tempo prima devo cercare l’agenzia?**

Per eventi standard (100-300 partecipanti, non in periodo di picco): 4-6 mesi prima. Per eventi con location premium o in alta stagione: 6-9 mesi. Per eventi enterprise da 500+ partecipanti: 9-12 mesi. La finestra di ricerca dell’agenzia (fare briefing, ricevere proposte, decidere) va aggiunta al lead time di produzione: dalla decisione di cercare l’agenzia alla consegna dell’evento passano tipicamente 3-4 settimane per la selezione + il tempo di produzione. Meno di 8 settimane totali è possibile solo con relazioni pre-esistenti.

**Quanto varia il budget da Milano a Roma a Bologna?**

Milano tipicamente 15-25% più caro di Roma, 25-40% più caro di Bologna, Torino, Firenze. La differenza è nella location (metratura utile a prezzo molto più alto a Milano centro), nel catering di livello (Milano ha il mercato più caro d’Italia per catering premium), nel costo del personale (hostess, tecnica). Non necessariamente il livello di qualità è più alto a Milano — è più cara la struttura di costo. Per eventi B2B senza esigenze di sede specifica, Bologna e Firenze offrono ottime location a costo inferiore.

**L’agenzia paga i fornitori o li pago io direttamente?**

Dipende dal modello: in full-service l’agenzia contrattualizza i fornitori e voi pagate un unico invoice; in coordinamento contrattualizzate direttamente voi. Il full-service ha vantaggio amministrativo (un solo interlocutore) e svantaggio di trasparenza (i costi passano attraverso l’agenzia, con mark-up). Chiedete esplicitamente nel contratto: nel full-service, chiedete la lista dei principali fornitori con importi diretti; nel coordinamento, chiedete assistenza contrattuale scritta.

**Cosa succede se un fornitore fallisce sul giorno dell’evento?**

Un contratto serio prevede: identificazione del rischio in fase di preventivo (chi risponde per cosa), rete di backup dell’agenzia (fornitori sostitutivi in stand-by per i mestieri critici — audiovisivi, catering), copertura assicurativa (annullamento evento, responsabilità civile). Un’agenzia seria affronta la domanda al primo colloquio con il playbook di gestione emergenze. Un’agenzia che risponde «non è mai successo» sta o mentendo o sotto-esperta. Nell’esperienza reale, uno-due imprevisti significativi succedono quasi sempre in eventi da 200+ partecipanti; sono gestibili se l’agenzia è preparata.

**Meglio agenzia locale o nazionale?**

Per gli eventi la distanza fisica conta più che in altre discipline. L’agenzia deve fare sopralluoghi in location, coordinarsi con fornitori locali, gestire il giorno da vicino. Un’agenzia con sede nella stessa città dell’evento ha vantaggio operativo reale. Un’agenzia nazionale con esperienza pluriennale nella città dell’evento può essere altrettanto valida se ha una rete consolidata. Un’agenzia estera senza esperienza specifica sulla vostra piazza raramente è la scelta giusta, per quanto brava sia in astratto.
$t$,
          $t$https://miglioreagenzia.it/wp-content/uploads/2026/07/come-scegliere-un-agenzia-di-eventi-aziendali.jpg$t$, $t$come scegliere un'agenzia di eventi aziendali$t$, 1200, 675,
          (select id from public.content_authors where domain_id = dominio and slug = $t$nicola-ferrari$t$),
          'publish', $t$2026-07-29 09:25:40$t$::timestamp at time zone 'Europe/Rome', 110)
  on conflict (domain_id, slug) do nothing;
  insert into public.article_category_links (article_id, category_id)
  select a.id, c.id from public.articles a join public.article_categories c on c.domain_id = a.domain_id
  where a.domain_id = dominio and a.slug = $t$come-scegliere-unagenzia-di-eventi-aziendali$t$ and c.slug in ($t$eventi$t$)
  on conflict do nothing;

  insert into public.articles (domain_id, slug, title, body_md, cover_url, cover_alt, cover_width, cover_height,
                               author_id, status, published_at, wp_id)
  values (dominio, $t$agenzia-email-marketing-e-inbound-come-scegliere$t$, $t$Agenzia email marketing e inbound: come scegliere$t$, $t$L’email marketing negli anni Dieci era considerata una disciplina in via di estinzione. Nel 2026 è tornata in cima ai canali per LTV più alta, specialmente in B2B ed e-commerce. L’inbound marketing negli anni Dieci era il futuro promesso da HubSpot; nel 2026 la metà delle “agenzie di inbound marketing” italiane fanno in realtà content marketing generico e chiamano inbound qualcosa che non lo è più.

Sono due discipline che dopo un decennio di convergenza si sono re-separate. Continuano a sovrapporsi sul terreno del nurture e della marketing automation — ma richiedono team, piattaforme, KPI e modelli di lavoro distinti. Chi vi vende «email + inbound come parte di un pacchetto integrato» sta o riducendo entrambe alla loro versione più basica, oppure sta vendendo bene una delle due e coprendo l’altra con lavoro superficiale.

Questa guida spiega cosa sono davvero l’email marketing e l’inbound marketing nel 2026, quali sono le differenze operative concrete, quali piattaforme un’agenzia decente deve saper toccare, quali KPI hanno senso (nessuno dei quali è «open rate»), quali fasce di prezzo sono ragionevoli in Italia, quando la stessa agenzia può fare bene entrambe le cose e quando è meglio scegliere due specialiste.

Nessuna delle agenzie che linkeremo da questa guida ha pagato per essere consigliata. Nessuna posizione in classifica è acquistabile. [Spieghiamo come selezioniamo →](/metodologia/)

---

## Email marketing e inbound marketing: cosa sono davvero nel 2026

**Email marketing** oggi non è «mandare newsletter». È la disciplina che gestisce l’email come canale di lifecycle e revenue: segmentazione dinamica basata su comportamento e dati CRM, sequenze automatizzate lungo il ciclo di vita del cliente (welcome, activation, retention, winback), integrazione multi-canale con SMS e push, attenzione tecnica alla deliverability (SPF, DKIM, DMARC, warm-up, gestione reputazione IP), attribuzione revenue trasparente. È diventata di nuovo strategica perché è uno dei pochi canali dove i costi non salgono con l’inflazione delle piattaforme paid, e perché con LTV che salgono l’engagement post-vendita vale sempre di più.

**Inbound marketing** è il modello di acquisizione che attrae lead qualificati attraverso contenuti valorosi trovati organicamente. Nato come metodologia HubSpot nel 2006, si è evoluto: la sequenza classica «attract → convert → close → delight» oggi convive con content più maturo, SEO più tecnica, distribuzione LinkedIn dove il vecchio TOFU non basta più. Nel 2026 l’inbound serio è, in pratica, la combinazione di SEO strategica + content marketing pillar + nurture email + marketing automation. Chi lo fa bene ha un motore che genera pipeline B2B con CAC decrescente nel tempo. Chi lo fa male ha un blog che nessuno legge.

**L’overlap** sta nel nurture. Chi fa inbound ha bisogno di email nurture per portare i lead dall’awareness alla conversione. Chi fa email marketing serio ha bisogno di contenuti che riempiano quelle email di valore. Ecco perché molte agenzie propongono i due servizi insieme — a volte con competenza vera, spesso con superficialità mascherata.

**La distinzione utile** al momento della scelta: se il vostro problema è *portare traffico e lead qualificati che oggi non arrivano*, cercate inbound. Se il vostro problema è *ottimizzare i lead o i clienti che già avete nel database*, cercate email. Sono due problemi diversi, con strumenti diversi.

---

## Cosa fa oggi un’agenzia di email marketing

**Lifecycle marketing.** Il cuore del lavoro: costruire sequenze automatizzate lungo il ciclo di vita — welcome per i nuovi iscritti, activation per convertire in primo acquisto, upsell e cross-sell per aumentare AOV, retention per mantenere l’engagement, winback per riattivare i dormienti. Ogni sequenza ha logiche di trigger, timing, contenuto, misurazione proprie.

**Segmentazione avanzata basata su CRM e comportamento.** Non «invio a tutti la stessa email». Segmentazione dinamica basata su acquisti passati, comportamento sul sito, interazioni email precedenti, dati demografici, RFM (Recency-Frequency-Monetary). Le agenzie serie oggi lavorano con segmenti in movimento continuo, non con liste statiche.

**Deliverability tecnica.** La parte meno visibile e più fondamentale. Configurazione SPF, DKIM, DMARC, gestione reputazione IP e dominio mittente, warm-up di nuovi domini, pulizia liste, gestione bounce e complaint. Un’agenzia che non parla di deliverability al primo colloquio sta trascurando il 40% del lavoro reale — e senza deliverability non conta quanto siano belle le email, non arrivano nella inbox principale.

**Integrazione multi-canale.** Nel 2026 l’email raramente vive da sola. Le sequenze serie combinano email + SMS + WhatsApp Business + push notification, con logiche di fallback (se non apri l’email in X giorni, ricevi SMS). L’agenzia decente sa orchestrare, non solo eseguire su un canale.

**Reporting revenue-attributed.** Non solo open rate e click. Revenue per email inviata (RPE), attribuzione multi-touch, contribuzione alle vendite totali, incremental lift studies. Un’agenzia seria sa dirvi quanto revenue avete generato in più grazie a una specifica sequenza.

Nelle nicchie B2B si aggiungono nurture sequences legati al ciclo di vendita, sales enablement email, ABM outreach coordinato con SDR. Nelle nicchie B2C si aggiungono personalizzazione avanzata su catalogo (Klaviyo-style), post-purchase flows, cart abandonment sofisticati.

---

## Cosa fa oggi un’agenzia di inbound marketing

**Strategia top-of-funnel.** SEO strategica + content pillar + topic cluster + distribuzione. Il lavoro parte da un modello del vostro business — chi sono i buyer, quali problemi cercano di risolvere, quali termini usano — e costruisce architettura di contenuti che intercetta l’attenzione qualificata. È il fratello ricco della SEO trattata nella nostra [guida dedicata](/come-scegliere-unagenzia-seo-in-italia/), con obiettivi diversi: non ranking, ma pipeline.

**Produzione contenuti long-form.** Articoli pillar da 2.500-5.000 parole, guide comparative, case study strutturati, video e podcast, contenuti scaricabili (report, checklist, template) che funzionano come lead magnet. La produzione seria non è «10 articoli/mese» ma «3-4 contenuti pilastro che vengono aggiornati e amplificati per anni».

**Distribuzione mirata.** La differenza cruciale rispetto al content marketing generico. Non basta pubblicare — bisogna portare il contenuto al pubblico giusto: LinkedIn organico per B2B, newsletter di settore, community, podcast partner, digital PR. Le agenzie serie hanno un piano di distribuzione per ogni pezzo, non solo di produzione.

**Marketing automation per il nurture.** Qui l’inbound sconfina nell’email marketing. Sequenze automatizzate che accompagnano il lead dall’ingresso in database alla richiesta di demo o di preventivo. Se l’agenzia inbound non ha competenza email seria, questa parte diventa il collo di bottiglia del funnel.

**Attribuzione multi-touch.** Come chiudete un lead qualificato che ha letto un articolo tre mesi fa, scaricato un ebook due mesi fa, cliccato tre email due settimane fa, e ora chiede una demo? Un’agenzia inbound seria costruisce attribuzione multi-touch per capire quali contenuti generano davvero pipeline e quali sono decorativi.

Il ciclo di risultati dell’inbound è lento: primi lead misurabili a 4-6 mesi, flusso stabile a 9-12 mesi, ROI positivo a 12-18 mesi. Chi promette risultati inbound in tre mesi non fa inbound, fa qualcos’altro.

---

## Sei differenze operative concrete

Se dopo il primo colloquio non capite se un’agenzia fa bene email o bene inbound, sei domande specifiche filtrano bene.

**Piattaforme dominate.** Un’agenzia email seria ha esperienza consolidata su 3-5 piattaforme di marketing automation e ne conosce i limiti (non solo i pro dei brochure). Un’agenzia inbound seria domina una piattaforma di marketing automation, un CMS, uno strumento SEO, uno di analytics. Chi dice «lavoriamo con tutte» tipicamente ne conosce due a livello base.

**KPI di successo.** L’email risponde a: revenue per email inviata, deliverability rate, contribution al fatturato totale. L’inbound risponde a: traffico organico qualificato, conversion visitor → lead, MQL rate, cost per lead qualificato, contribuzione al sales cycle. Sono metriche diverse e si guardano in modo diverso.

**Tempi di risultato.** L’email marketing produce risultati misurabili in settimane. Setup e ottimizzazione di una sequenza automatizzata portano cambiamenti misurabili in 30-60 giorni. L’inbound richiede mesi. Chi vi promette tempi email per lavoro inbound sta vendendo un’illusione.

**Cosa richiede dal vostro lato.** Un’agenzia email chiede accesso al vostro CRM, integrazione con e-commerce, tecnologia di attribuzione, e ha bisogno che voi abbiate liste utenti e dati storici. Un’agenzia inbound chiede accesso al sito, al blog, ai buyer personas se esistono, e ha bisogno che voi siate disposti ad aspettare 6-9 mesi per i primi risultati significativi.

**Profilo del team.** L’email attrae profili tecnico-strategici: lifecycle strategist, marketing automation specialist, deliverability engineer, analytics specialist. L’inbound attrae profili strategico-editoriali: content strategist, SEO specialist, editor, senior copywriter. Il team giusto ha profili diversi in modo verificabile.

**Modello di lavoro.** Email marketing tende al retainer + campagne stagionali (Black Friday, saldi, lanci). Inbound tende al retainer con curva lenta di crescita. I contratti hanno formule leggermente diverse — un’agenzia che ha un solo modello «universale» probabilmente non fa bene entrambi i mondi.

---

## Le piattaforme che un’agenzia decente deve saper toccare

Nel 2026 non esiste più «email marketing generico». Esistono agenzie specializzate su specifiche piattaforme, ognuna con logiche proprie. Un’agenzia decente ha esperienza vera su 3-5 di queste, non lavora «cross-platform generico».

**Per email marketing / lifecycle:**

-   **HubSpot Marketing Hub** — l’ecosistema più diffuso in B2B mid-market italiano. Marketing automation + CRM integrato + reporting nativo. Complesso ma potente.
-   **Klaviyo** — dominante in e-commerce, specialmente Shopify. Segmentazione avanzata basata su comportamento, integrazione nativa con catalogo, personalizzazione dinamica.
-   **ActiveCampaign** — PMI-friendly, buon rapporto qualità-prezzo, marketing automation solida sotto i 5.000 utenti.
-   **Braze** — enterprise B2C, multi-canale (email + SMS + push + in-app), utilizzato da grandi retailer e app.
-   **Marketo / Salesforce Marketing Cloud / Pardot** — enterprise B2B con Salesforce già integrato.
-   **Iterable** — mid-market avanzato, multi-canale sofisticato, in crescita in Italia.
-   **Customer.io** — SaaS product-led, forte su product-triggered messaging.
-   **Mailchimp** — ancora accettabile per starter e piccole liste; sotto pressione dai concorrenti in fascia PMI.

**Per inbound marketing:**

-   **HubSpot Marketing Hub** — spesso la scelta di default per B2B integrato (marketing + CRM + service).
-   **CMS SEO-optimized** — WordPress con RankMath o Yoast, oppure headless (Storyblok, Contentful, Sanity) per progetti tecnici avanzati.
-   **Strumenti SEO** — Semrush, Ahrefs, Sistrix, Screaming Frog.
-   **Automation e integrazione** — Zapier, Make, workflow nativi HubSpot.
-   **Analytics** — Google Analytics 4, Piano Analytics, Amplitude per SaaS.

Chiedere al primo colloquio con quali piattaforme lavora davvero — non «quali conosciamo» ma «quali abbiamo in progetti attivi con almeno un anno di storia» — filtra bene le agenzie serie da quelle che si vendono meglio di quello che fanno.

---

## KPI reali (non «open rate»)

L’open rate è morto come KPI dal 2021, quando iOS 15 di Apple ha introdotto il tracking protection che apre automaticamente le email. Un’agenzia che ancora vi presenta report con «open rate 28%» come metrica di successo non ha aggiornato il proprio modo di lavorare.

**Per l’email marketing.** Revenue per email inviata (RPE): il KPI più netto — quanto revenue generato diviso email inviate. Deliverability rate: percentuale di email che arriva effettivamente nella inbox (non blocked, non spam). Un tasso sano è sopra il 95%. Click-through-open rate (CTOR) invece del semplice click rate: quale percentuale di chi apre poi clicca. List engagement decay: tasso di degradazione dell’engagement nel tempo — le liste peggiorano se non gestite. Contribuzione al revenue attribuito: quanto del fatturato totale è attribuibile al canale email, con attribuzione multi-touch.

**Per l’inbound marketing.** Traffico organico qualificato: non solo visite ma visite da parole chiave con intento commerciale. Conversion rate visitor → lead: percentuale che compila form. MQL/SQL rate: lead che passano la qualifica marketing/sales. Cost per lead qualificato: il KPI di sintesi del canale. Sales cycle contribution: quanto l’inbound accelera o rallenta il ciclo di vendita rispetto ad altri canali.

Un’agenzia decente vi propone il suo cruscotto tipo al primo colloquio e vi spiega perché ha scelto quelle metriche. Un’agenzia mediocre vi manda un template con open rate e click rate come metriche principali.

---

## Fasce di prezzo indicative in Italia nel 2026

Le fasce sotto sono ordini di grandezza per progetti con team senior. Sono coerenti con la logica delle nostre [fasce prezzo marketing](/quanto-costa-unagenzia-di-marketing-in-italia/).

**Email marketing / lifecycle:**

-   **Setup iniziale + audit deliverability**: 3.000-15.000 € una tantum, per configurazione tecnica e ristrutturazione del canale.
-   **Retainer PMI** (liste sotto 20.000 contatti, 4-6 campagne/mese + 2-3 flow automatizzati): 1.500-4.000 €/mese.
-   **Retainer mid-market** (liste 20-100k, gestione multi-canale integrata): 4.000-10.000 €/mese.
-   **Retainer enterprise** (liste sopra 100k, personalizzazione avanzata, attribuzione multi-touch): 8.000-25.000 €/mese.

**Inbound marketing:**

-   **Setup iniziale** (buyer personas, audit content, roadmap SEO): 8.000-30.000 € una tantum.
-   **Retainer B2B PMI** (2-4 pillar/mese + SEO leggera + nurture leggero): 4.000-8.000 €/mese.
-   **Retainer B2B mid-market** (macchina editoriale completa + SEO strutturata + marketing automation): 8.000-18.000 €/mese.
-   **Retainer B2B enterprise**: 15.000-40.000 €/mese, tipicamente con team dedicato.

Sotto 1.500 €/mese in email marketing e sotto 4.000 €/mese in inbound: rare le eccezioni valide. Sopra queste soglie il rapporto ore-di-senior / prezzo diventa serio.

---

## Tre segnali che qualcosa non torna

**«Vi facciamo 20 campagne email al mese».** Il volume non è KPI. Un’agenzia seria vi propone il numero minimo di sequenze che spostano il fatturato — spesso 4-8 sequenze automatizzate ben progettate battono 20 broadcast improvvisati. Chi vende volume vende commodity.

**Zero attenzione alla deliverability tecnica.** Se al primo colloquio non menzionano SPF, DKIM, DMARC, warm-up, gestione IP, non fanno email marketing serio. Fanno invio di email. È diverso. Un’agenzia decente vi propone un audit deliverability come primo step del rapporto.

**Content plan generico per l’inbound.** Se la proposta inbound è un elenco di 20 titoli generici «5 modi per», «Le 10 migliori strategie», «Guida definitiva a», l’agenzia sta lavorando con template. L’inbound serio parte da un modello semantico del vostro business e propone contenuti specifici che nessuno dei vostri concorrenti ha, non i più comuni.

---

## Domande frequenti

**Meglio una sola agenzia per email + inbound o due specialiste?**

Dipende dalla dimensione. Sotto 8.000 €/mese totali, una sola agenzia decente su entrambi (raramente eccellente su entrambi) è pragmatica. Sopra i 15.000 €/mese conviene splittare: una specialista email/lifecycle + una specialista inbound + coordinamento interno (CMO, growth lead). Nella fascia di mezzo, valutare caso per caso — se una delle due discipline è centrale al business (e-commerce con lifecycle critico, B2B con inbound come motore principale) meglio scegliere la specialista di quella e outsource-are l’altra.

**Cos’è cambiato negli ultimi due anni in email marketing e inbound?**

Nell’email: iOS 15 ha demolito l’open rate come KPI (dal 2021, esteso ai major client dopo); la personalizzazione AI-driven è diventata standard nei tier alti; SMS e WhatsApp sono entrati nella conversazione come canali complementari, non alternative. Nell’inbound: HubSpot ha perso terreno come metodologia dominante; l’AI content generation ha commoditizzato la produzione di articoli medi (con conseguente premio per contenuti veramente distintivi); la SEO si è integrata con la GEO (ottimizzazione per motori generativi), cambiando cosa significa «traffico qualificato».

**Ci sono rischi GDPR con l’email marketing?**

Sì, seri. Consenso non equivalente (opt-in richiesto per email B2C, base legale legittima interesse più flessibile in B2B ma con paletti), gestione base dati, cancellazione tempestiva a richiesta, tracking dei consensi. Un’agenzia seria vi chiede documentazione del processo di raccolta e ha un playbook per gestire le richieste. Un’agenzia che vi dice «no problema, funziona sempre» sta esponendo voi al rischio sanzioni (fino al 4% del fatturato globale) e la vostra reputazione a rischio dedicato.

**Serve avere un CRM prima di ingaggiare un’agenzia email?**

Sì, quasi sempre. Senza un CRM che tiene traccia di comportamento e conversioni, l’agenzia email lavora al buio: non può segmentare bene, non può misurare l’attribuzione, non può ottimizzare. Alcune agenzie serie includono il setup CRM base come primo step (spesso HubSpot free o simili) — è un buon segnale. Se non avete CRM ma volete comunque partire, cominciate lì.

**In quanto tempo si vedono i primi risultati inbound seri?**

Primi lead qualificati misurabili a 4-6 mesi, flusso stabile a 9-12 mesi, ROI positivo a 12-18 mesi, regime a 18-24 mesi. Chi vi promette risultati inbound in 3 mesi sta o vendendo qualcos’altro (di solito paid con packaging inbound) o mentendo. L’inbound serio è un investimento lungo con ROI cumulativo elevato — ma richiede pazienza e budget stabile.
$t$,
          $t$https://miglioreagenzia.it/wp-content/uploads/2026/07/agenzia-email-markting-e-inbound-come-scegliere.jpg$t$, $t$agenzia email marketing e inbound come scegliere$t$, 1200, 675,
          (select id from public.content_authors where domain_id = dominio and slug = $t$nicola-ferrari$t$),
          'publish', $t$2026-07-29 09:25:40$t$::timestamp at time zone 'Europe/Rome', 107)
  on conflict (domain_id, slug) do nothing;
  insert into public.article_category_links (article_id, category_id)
  select a.id, c.id from public.articles a join public.article_categories c on c.domain_id = a.domain_id
  where a.domain_id = dominio and a.slug = $t$agenzia-email-marketing-e-inbound-come-scegliere$t$ and c.slug in ($t$email-marketing$t$, $t$inbound-marketing$t$)
  on conflict do nothing;

  insert into public.articles (domain_id, slug, title, body_md, cover_url, cover_alt, cover_width, cover_height,
                               author_id, status, published_at, wp_id)
  values (dominio, $t$le-migliori-agenzie-di-comunicazione-a-milano$t$, $t$Le migliori agenzie di comunicazione a Milano$t$, $t$Milano nella comunicazione non è quello che sembra dall’esterno. Non è la capitale delle campagne pubblicitarie mass-consumer — quella è un’altra piazza, con altre agenzie. È la capitale della comunicazione corporate B2B, del luxury internazionale, dell’employer branding per i grandi datori di lavoro italiani, e — negli ultimi anni — del B2B tech emergente. Il tessuto delle agenzie di comunicazione milanesi riflette questa vocazione: molto più orientato al management complessità reputazionale che alla campagna virale.

Il 60% delle società quotate FTSE MIB ha sede o presenza direzionale a Milano. La maggior parte dei grandi studi legali e delle società di consulting hanno la loro base italiana lì. Il quartier generale della moda mondiale opera a Milano da decenni. Le tre banche private principali, le due società energetiche pubbliche, tre operatori telefonici, cinque assicurazioni fra le prime dieci — tutte con direzione comunicazione a Milano. Le agenzie che contano si sono specializzate su questi committenti, sulle loro dinamiche di reputazione, sui loro cicli di comunicazione.

Il malinteso più comune è che «agenzia di comunicazione milanese» significhi qualcosa di omogeneo. Non è così. Una boutique che fa comunicazione IPO e M&A per società quotate non è comparabile con una che gestisce le PR internazionali per un brand luxury, che a sua volta è diversa da una specialista di employer branding per grandi datori di lavoro. Tutte e tre sono «agenzie di comunicazione milanesi». Ma servono cose completamente diverse.

Questa selezione contiene 15 agenzie di comunicazione che la redazione considera notevoli, raggruppate per verticale distintivo, seguite da un elenco di menzioni per le realtà che pur non entrando in top selection meritano di essere segnalate. La metodologia è dichiarata in apertura, i verticali distintivi milanesi sono spiegati esplicitamente.

Nessuna delle agenzie in questa selezione ha pagato per essere consigliata. Nessuna posizione è acquistabile. [Spieghiamo come selezioniamo →](/metodologia/)

---

## Come abbiamo selezionato

La selezione è redazionale, non algoritmica. Sei criteri, applicati in serie, hanno determinato l’inclusione. Sono gli stessi che raccomandiamo a un’azienda che sta valutando un’agenzia di comunicazione — e sono gli stessi criteri che usiamo per gli altri pilastri del sito, per coerenza metodologica.

**Specializzazione dichiarata.** Le agenzie inserite hanno un verticale o un mestiere di comunicazione che sanno raccontare con precisione — corporate financial, luxury, B2B tech, digital PR, employer branding, o un’intersezione riconoscibile fra questi. Chi ci ha detto «facciamo comunicazione a 360 gradi» è stato lasciato fuori. La comunicazione a 360 gradi è la ragione principale per cui i budget di comunicazione bruciano senza portare risultati.

**Metodologia trasparente.** Ogni agenzia in selezione ha una descrizione strutturata del proprio processo. Non «ideazione, produzione, monitoraggio» in fila, ma un metodo raccontato con fasi, ruoli, decisioni. Nella comunicazione la metodologia conta doppio: chi non ha un metodo, spesso, non ha nemmeno una visione — ha solo relazioni personali che non si scalano.

**Casi con risultati e contesto.** Ogni agenzia ha almeno tre casi verificabili con esito misurabile e contesto. Nella comunicazione i risultati non sono sempre numeri di traffico — sono menzioni qualificate, share of voice guadagnato, uscite in testate strategiche, gestione di situazioni critiche riuscita. Ma sono verificabili. Chi ha portato solo «clipping report» senza analisi non è entrato.

**Team stabile e senior.** Abbiamo verificato la continuità del team senior confrontando profili pubblici pluriennali. Nella comunicazione questo è particolarmente importante: le relazioni con testate, giornalisti e stakeholder istituzionali si costruiscono su decenni, non su cicli di due anni. Le agenzie con turnover elevato nei ruoli senior sono state escluse.

**Reporting che collega attività e reputazione.** Non «numero di uscite» o «AVE (Advertising Value Equivalent)» — che è una metrica ferma agli anni Novanta. Le agenzie serie oggi collegano uscita a menzione qualificata, menzione a share of voice, share of voice a percezione presso stakeholder rilevanti. Un rigoroso reporting reputazionale non è banale, e le agenzie che lo fanno bene sono la minoranza.

**Contratto sensato.** Le agenzie in selezione hanno modelli di contratto ragionevoli — durate flessibili, chiara ownership di media list e knowledge accumulato durante il rapporto, condizioni di uscita non punitive. Chi vincola per 24 mesi con penali di uscita non è passato.

La selezione è stata rivista da due persone della redazione in modo indipendente e le divergenze sono state discusse. Non tutte le agenzie in questa lista avrebbero superato tutti i sei criteri con lode: alcune sono state incluse per la forza eccezionale su un verticale, anche con reporting appena sufficiente. Ogni scelta ha una motivazione nella scheda dell’agenzia.

---

## Le quindici agenzie in selezione

*Le agenzie sono raggruppate per verticale distintivo, non ordinate per merito. Ogni scheda contiene una descrizione di 100-130 parole con specializzazione, tipo di committente, dimensione team dichiarata, ragione specifica per cui la redazione l’ha selezionata.*

### Corporate e financial communication

Comunicazione finanziaria e M&A per società quotate, investor relations, gestione della reputazione istituzionale.

#### 01 · BC Communication

#### 02 · Barabino & Partners

#### 03 · Naxa

### Luxury e fashion PR

PR internazionali di brand, lanci di collezione, sfilate, celebrity partnership, digital PR internazionale con testate di settore.

#### 01 · Publicis Luxe

#### 02 · We Are Social

#### 03 · Studio Cappello

### B2B tech e SaaS communication

Comunicazione B2B tech, thought leadership, analyst relations, integrated content per software vendors, fintech, insurtech, martech.

#### 01 · Krein

#### 02 · CDWeb

#### 03 · [Square Marketing](https://squaremarketing.it/)

### Digital PR e link earning

Al crocevia tra PR classica e SEO: contenuti che vengono citati, collaborazioni con testate digitali, campagne di digital PR con obiettivi di traffico e link earning.

#### 01 · Richclicks

#### 02 · AdMirabilia

#### 03 · Agenzia Spada

### Employer branding e HR communication

Comunicazione interna, employer value proposition, recruiting communication per grandi datori di lavoro italiani.

#### 01 · [Square Marketing](https://squaremarketing.it/)

#### 02 · Beyond

#### 03 · The Van Group

---

## I cinque verticali dove Milano è più forte

Il tessuto milanese della comunicazione si è specializzato attorno a cinque verticali in cui la piazza ha vantaggio strutturale — vantaggio che deriva dalla concentrazione dei committenti, non dalla creatività di per sé. Chi cerca un’agenzia dovrebbe capire in quale di questi cinque cade il proprio bisogno e scegliere di conseguenza.

**Corporate e financial communication.** Milano ospita Borsa Italiana, la maggioranza delle società quotate italiane, i grandi studi legali, le società di consulting che fanno M&A. Le agenzie milanesi che presidiano questo verticale hanno accumulato competenza specifica: gestione dei tempi rigidi dettati dalla Consob, coordinamento con banche d’affari, comunicazione IPO, gestione degli investitori istituzionali, crisis communication per società quotate. È un mestiere con regole tecniche precise, e chi non le conosce fa danni misurabili in quotazione. Le agenzie che valgono in questo verticale hanno tipicamente ex-giornalisti economici o ex-corporate communication di grandi gruppi nel team senior.

**Luxury e fashion PR.** Milano è la piazza mondiale della moda italiana, e — a differenza dell’advertising fashion, che negli anni si è distribuito su più città — la PR luxury è rimasta concentrata a Milano. Le agenzie che lavorano su questo verticale gestiscono lanci di collezione internazionali, rapporti con press internazionale (Vogue, WWD, Business of Fashion, testate cinesi e mediorientali), celebrity partnership, editoriali. La particolarità: molte di queste agenzie sono a metà tra Milano e Parigi/New York/Shanghai, con team distribuiti su più piazze. La sede milanese è quella di riferimento per il committente italiano.

**B2B tech e SaaS communication.** Verticale in crescita rapida negli ultimi cinque anni, alimentato dal boom del fintech italiano (Satispay, Nexi, Scalapay), insurtech (Prima), martech e SaaS enterprise. Le agenzie milanesi che presidiano questo verticale hanno costruito una competenza specifica: comunicazione a founder di scale-up, analyst relations con Gartner e Forrester, integrazione tra PR classica e content marketing tecnico, comunicazione a investitori venture. È il verticale dove la linea tra agenzia di comunicazione e agenzia di marketing content-led è più sottile.

**Digital PR e link earning.** Non è propriamente un verticale di committente — è un tipo di lavoro che si è specializzato al crocevia tra PR classica e SEO. Le agenzie milanesi che lo fanno bene combinano competenza editoriale (sanno costruire contenuti citabili) e competenza SEO (sanno che tipo di link portano valore). È un mestiere emergente, ancora frammentato, con poche realtà consolidate. Quelle serie sono utilissime per aziende con obiettivi SEO ambiziosi e budget PR sostenibile.

**Employer branding e HR communication.** I grandi datori di lavoro italiani — ENI, Enel, TIM, Intesa Sanpaolo, Unicredit, Generali, Prada, gruppi bancari privati, big four del consulting, grandi studi legali — hanno tutti sede o comunicazione HR a Milano. Comunicare l’employer value proposition è diventato un mestiere serio per attirare talento in un mercato del lavoro competitivo. Le agenzie milanesi specializzate su questo verticale spesso combinano strategia HR, produzione contenuti (video employees, LinkedIn content, cases), e distribuzione mirata su canali di recruiting.

Un’agenzia forte sul corporate financial di solito non è la scelta giusta per un lancio moda, e viceversa. È il primo filtro da fare prima di guardare presentazioni o proposal.

---

## Come scegliere fra queste quindici

Anche selezionate in modo restrittivo, quindici agenzie sono ancora troppe per scegliere a occhio. Quattro domande, in questo ordine, restringono in fretta.

**In quale dei cinque verticali sopra ricade il vostro bisogno?** È il primo taglio. Se dovete comunicare una quotazione, le agenzie luxury non sono per voi. Se dovete lanciare una collezione, le agenzie B2B tech non lo sono. La specializzazione, applicata come primo filtro, evita mesi persi in colloqui che finiscono ovunque.

**Vi serve un’agenzia strategica o esecutiva?** Alcune agenzie della selezione fanno principalmente lavoro strategico (definizione della narrativa, gestione crisi, consulenza al top management). Altre eseguono benissimo il piano che qualcun altro ha disegnato. Se avete un director of communication interno, la seconda categoria costa meno ed è spesso più efficace. Se non l’avete, la prima è indispensabile.

**Che dimensione e complessità ha il vostro progetto?** Un piano di comunicazione istituzionale trimestrale per una PMI non è per una boutique da 25 persone specializzata su enterprise quotate. La gestione della reputazione di un gruppo multi-brand con presenza internazionale non è per uno studio da 8. Le fasce di prezzo dichiarate nelle schede di ciascuna agenzia danno un primo orientamento.

**Quale relazione con la stampa vi serve?** La comunicazione dipende in larga misura dalle relazioni personali del team senior con giornalisti, editor, opinion leader. Un’agenzia con eccellenti relazioni sul quotidiano economico ma nessuna sui verticali tech è la scelta sbagliata per uno scale-up B2B tech. Chiedete al primo colloquio con quali testate hanno relazione attiva — le risposte specifiche filtrano meglio del portfolio.

Fatte le quattro domande, di solito rimangono tre-quattro nomi. È il numero giusto per una selezione seria.

---

## Domande frequenti

**Agenzia di comunicazione o ufficio stampa: sono la stessa cosa?**

No, e la confusione costa. Un ufficio stampa gestisce prevalentemente il rapporto con i media (redazione comunicati, pitch a giornalisti, relazioni con testate, gestione richieste stampa). Un’agenzia di comunicazione fa tutto questo ma include anche strategia narrativa, gestione della reputazione, comunicazione interna, digital PR, employer branding, gestione crisi. L’ufficio stampa è una funzione, la comunicazione è una disciplina che comprende quella funzione ma la eccede. Per bisogni tattici tipici PMI (un lancio prodotto, un annuncio), un ufficio stampa può bastare. Per gestione continuativa della reputazione complessa, serve l’agenzia. Approfondiremo la scelta di un [ufficio stampa dedicato](/pubbliche-relazioni/) in un articolo autonomo del piano editoriale.

**Le agenzie di comunicazione milanesi sono più care?**

Sì, mediamente del 15-30% rispetto ad agenzie equivalenti in altre città italiane, per gli stessi motivi strutturali che rendono più cara la SEO milanese: costo del lavoro senior più alto, affitti maggiori, prossimità ai committenti enterprise. Nella comunicazione la differenza si sente di più che in altre discipline perché il valore che pagate include anche il network di relazioni personali del team senior con testate e opinion leader — un patrimonio che si costruisce a Milano nell’arco di decenni e che altrove non è così denso. Approfondiamo la logica delle fasce di prezzo nell’articolo [Quanto costa un’agenzia di marketing](/quanto-costa-unagenzia-di-marketing-in-italia/) — molti principi valgono con adattamenti per la comunicazione.

**Comunicazione B2B e B2C richiedono agenzie diverse?**

Nella maggior parte dei casi sì. La comunicazione B2C — nei mercati mass consumer — ha logiche di earned media diverse: influencer, testate lifestyle, celebrity, format editoriali di intrattenimento. La comunicazione B2B — nei mercati tech, finanza, servizi professionali — passa da altre testate (Il Sole 24 Ore, quotidiani economici, testate di settore, analyst reports) e altri format (thought leadership, case studies, panel di conferenze). Un’agenzia che dice di fare bene entrambi di solito ne fa bene una — quasi sempre quella dominante nel suo portfolio. Alcune boutique verticali fanno eccezione quando lavorano su brand che sono contemporaneamente B2B e B2C (banche, telco, energia) e hanno interlocutori distinti per i due mondi.
$t$,
          $t$https://miglioreagenzia.it/wp-content/uploads/2026/07/le-migliori-agenzie-di-comunicazione-a-milano.jpg$t$, $t$le migliori agenzie di comunicazione a milano$t$, 1200, 675,
          (select id from public.content_authors where domain_id = dominio and slug = $t$nicola-ferrari$t$),
          'publish', $t$2026-07-29 09:25:40$t$::timestamp at time zone 'Europe/Rome', 104)
  on conflict (domain_id, slug) do nothing;
  insert into public.article_category_links (article_id, category_id)
  select a.id, c.id from public.articles a join public.article_categories c on c.domain_id = a.domain_id
  where a.domain_id = dominio and a.slug = $t$le-migliori-agenzie-di-comunicazione-a-milano$t$ and c.slug in ($t$comunicazione$t$, $t$digital-pr$t$, $t$geo$t$, $t$pr$t$, $t$seo$t$)
  on conflict do nothing;

  insert into public.articles (domain_id, slug, title, body_md, cover_url, cover_alt, cover_width, cover_height,
                               author_id, status, published_at, wp_id)
  values (dominio, $t$quanto-costa-unagenzia-di-marketing-in-italia$t$, $t$Quanto costa un'agenzia di marketing in Italia$t$, $t$Un preventivo di marketing da 3.500 €/mese può nascondere un budget media suggerito da 20.000 €, che nel primo colloquio non è stato menzionato. Un preventivo da 8.000 €/mese può includere produzione contenuti, creativi, gestione paid e reporting che a farli separatamente costerebbero 15.000. Un preventivo da 1.800 €/mese in un business B2B enterprise è quasi sempre un abbaglio — quel prezzo non compra tempo di senior sufficiente a muovere niente.

«Quanto costa un’agenzia di marketing» è una domanda ancora più fuorviante di «quanto costa un’agenzia SEO», perché il marketing include il *budget media* — una voce spesso più grande del fee agenzia e quasi sempre gestita male nei preventivi confusi. Prima di chiedere quanto costa, bisogna chiedere cosa è incluso, cosa è a parte, chi possiede il budget media, chi lo decide, chi lo ottimizza.

Questa guida spiega perché il marketing ha strutture di costo diverse da altre discipline, quali sono i quattro modelli di pricing in circolazione in Italia, quali fasce indicative hanno senso per ciascuna delle sei famiglie di agenzie di marketing, cosa fa cambiare il prezzo a parità di scope, come leggere un preventivo senza farsi imbrogliare — con particolare attenzione al budget media — e quali tre segnali dicono che il numero non torna.

Nessuna delle agenzie che linkeremo da questa guida ha pagato per essere consigliata. Nessuna posizione in classifica è acquistabile. [Spieghiamo come selezioniamo →](/metodologia/)

---

## Prima di parlare di prezzo, di che marketing state parlando?

Nella [guida alla scelta di un’agenzia di marketing](/come-scegliere-unagenzia-di-marketing/) abbiamo mappato sei famiglie di agenzie in circolazione in Italia: strategica, digital generalista, performance-paid, content-inbound, B2B specialistica, boutique verticale. Non sono etichette di comodo: sono strutture di costo diverse, comprano cose diverse, hanno prezzi diversi.

Chiedere «quanto costa un’agenzia di marketing» senza sapere in quale famiglia siete è come chiedere «quanto costa un’automobile» senza sapere se vi serve una macchina o un furgone. La risposta media che riceverete sarà sbagliata per il vostro caso specifico, indipendentemente dal numero.

La disciplina utile è ribaltare la domanda. Prima: *cosa devo comprare?* Una strategia? Ore di execution? Un canale specifico? Un team distribuito su più canali? Solo dopo: *quanto costa quella cosa specifica, con che qualità di team?*

Il resto di questo articolo assume che questo lavoro l’abbiate fatto o siate in procinto di farlo. Se non l’avete ancora fatto, [tornate al pezzo che lo spiega](/come-scegliere-unagenzia-di-marketing/).

---

## I quattro modelli di pricing nel marketing

Il mercato italiano usa quattro modelli di pricing per il marketing, uno in più della SEO. La differenza sta nel budget media, che nella SEO tecnicamente non esiste (a parte digital PR occasionale) e nel marketing è quasi sempre presente.

### 1\. Retainer mensile

Il modello classico: fee fisso mensile in cambio di un pacchetto di ore o di deliverable. Si applica alle famiglie strategica, digital generalista, content-inbound, B2B specialistica, boutique verticale — quasi tutto tranne il puro performance.

Le versioni serie dichiarano cosa è incluso: ore di consulenza, produzione contenuti, gestione canali, reporting, call di aggiornamento. Le versioni opache dicono «gestione marketing continuativa» e vi lasciano scoprire mese per mese cosa vi arriva davvero.

Contratti tipici: sei-dodici mesi con rinnovo tacito e preavviso di disdetta di 30-60 giorni.

### 2\. A progetto (una tantum)

Certi lavori di marketing sono progetti chiusi con inizio e fine: una strategia di ingresso su un nuovo mercato, un ripensamento del posizionamento, una campagna di lancio prodotto, un audit marketing completo, la creazione di una brand identity.

Fasce indicative italiane 2026 per famiglia:

-   **Strategia di posizionamento o go-to-market**: 25.000-100.000 € (agenzia strategica).
-   **Audit marketing completo** con roadmap 12 mesi: 15.000-50.000 €.
-   **Campagna di lancio prodotto** integrata (creativo + media + PR): 40.000-250.000 €.
-   **Brand identity + system di comunicazione**: 20.000-120.000 € (agenzia di branding, spesso separata).
-   **Progetto ABM B2B** (definizione + esecuzione 3-6 mesi): 30.000-100.000 €.

Come nella SEO, i progetti chiudono con un documento o una campagna in produzione. Dopo, restate soli. Ha senso combinarli con un retainer di follow-up, non usarli come sostituto del retainer stesso.

### 3\. Fee agenzia + budget media separato

Modello dominante per il performance marketing e per tutte le campagne paid. L’agenzia carica un fee per la gestione (strategia, setup, ottimizzazione, reporting). Il budget media — quello che finisce a Google, Meta, LinkedIn, TikTok, DV360 — è vostro, lo pagate direttamente alla piattaforma o all’agenzia che lo gira senza margine.

Fee agenzia tipico: 15-25% del budget media, con minimo di solito 2.000-3.500 €/mese anche a budget media contenuti. Sopra il 30%, l’agenzia è cara per il vostro volume; sotto il 10%, il budget media è troppo grande per l’attenzione che l’agenzia può dedicarvi.

Attenzione al modello «tutto incluso a percentuale» dove il fee e il media sono fusi in un’unica cifra: l’incentivo per l’agenzia diventa massimizzare la spesa media, non massimizzare il ROAS. È tossico strutturalmente e va evitato.

### 4\. Performance / success fee

Fee ridotto + variabile legato ai risultati. Le varianti serie: revenue share sui ricavi incrementali attribuibili, CPA (cost per acquisition) fisso, CPL (cost per lead) con qualifica definita, commissione sui deal chiusi (B2B).

Nella pratica italiana 2026 funziona solo con aziende che hanno analytics maturo, baseline stabile e attribuzione condivisa con l’agenzia. In tutti gli altri casi — cioè quasi sempre — si trasforma in un retainer camuffato con soglie di risultato calibrate per essere raggiunte facilmente.

La domanda utile per capire se un performance fee è serio o è una vetrina: come misuriamo i risultati, con quale strumento, con quale frequenza li rivediamo, chi arbitra in caso di controversia. Se non c’è una risposta chiara, non è un modello serio.

---

## Le fasce indicative italiane 2026, per famiglia

I numeri che seguono sono ordini di grandezza per progetti con team senior sul vostro account. Sono fasce di orientamento, non tariffari. Per completezza: dove pertinente, sono le stesse fasce citate nella [guida alla scelta](/come-scegliere-unagenzia-di-marketing/) — qui le espandiamo con più contesto.

### Strategica / consulenziale

-   **Retainer strategico**: 8.000-25.000 €/mese.
-   **Progetti a corpo**: 25.000-100.000 € per posizionamento, go-to-market, audit approfondito.
-   **Giornata di consulenza senior**: 1.500-3.500 € (utile per interventi puntuali).

Per aziende che devono decidere prima di eseguire. È la fascia dove il ROI non si misura in mesi ma in anni — l’agenzia strategica giusta vi risparmia due anni di sbagli.

### Digital generalista full-service

-   **PMI B2B/B2C piccole**: retainer 4.000-7.000 €/mese, presenza su 3-4 canali.
-   **PMI evolute**: 7.000-12.000 €/mese, 4-5 canali attivi + produzione contenuti stabile.
-   **Enterprise leggero**: 12.000-20.000 €/mese con team dedicato di 2-3 profili.

Fascia sotto i 4.000 €/mese: possibile per business molto piccoli, ma difficile che copra più di due canali con qualità decente. Sopra i 20.000 €/mese si passa tipicamente alla combinazione di agenzia strategica + specialisti multipli, che a quel budget rende di più.

### Performance / paid

-   **Fee agenzia**: 2.500-4.000 €/mese per campagne singole PMI; 4.000-8.000 €/mese per multi-canale mid-market; 8.000-20.000 €/mese per enterprise.
-   **Budget media a parte**: da un minimo sostenibile di 3.000-5.000 €/mese fino a centinaia di migliaia di euro.

Regola pratica del rapporto: il fee agenzia dovrebbe essere il 15-25% del budget media totale. Se pagate 5.000 €/mese di fee con un media di 8.000 €, il rapporto è 62% — è un business poco sano per l’agenzia (che non ha volume) e per voi (che pagate cara la gestione).

### Content e SEO / inbound

-   **PMI B2B con ciclo lungo**: 4.000-7.000 €/mese (strategy + 2-4 pezzi lunghi/mese + SEO tecnica leggera + nurture).
-   **B2B mid-market**: 7.000-12.000 €/mese (con redazione dedicata, digital PR light, marketing automation).
-   **Editoria e media**: 12.000-25.000 €/mese (macchina editoriale strutturata, analytics avanzati).

Curva risultati: primi lead misurabili a 4-6 mesi, ROI positivo tipicamente a 9-12 mesi, regime a 18-24 mesi. Chi promette risultati inbound in tre mesi non fa inbound.

### B2B specialistica

-   **Retainer con SDR gestito**: 4.000-8.000 €/mese (uno SDR part-time coordinato).
-   **Progetto ABM 3-6 mesi**: 15.000-80.000 € a corpo.
-   **RevOps hybrid**: 6.000-20.000 €/mese, spesso con progetto di setup 25.000-60.000 € iniziale.

Approfondiamo la parte lead generation B2B nell’articolo dedicato [Agenzia lead generation](/agenzia-lead-generation-cose-come-si-sceglie/).

### Boutique verticale

Prezzi allineati al mestiere sottostante (performance, content, digital) con premio di specializzazione tipicamente del 15-30%. Un’agenzia specialistica di fashion o luxury sui suoi verticali costa più di un digital generalista, e vale la pena quando il verticale è il vostro.

---

## Cosa fa cambiare il prezzo, a parità di famiglia

Due preventivi della stessa famiglia possono differire del 100% ed essere entrambi ragionevoli. Cinque fattori.

**Ambizione degli obiettivi.** Mantenere una macchina che gira ha un costo. Scalarla del 50% ne ha un altro. Farla nascere da zero ne ha un altro ancora. La stessa agenzia con lo stesso team può proporvi tre pacchetti diversi a seconda di cosa promettete di ottenere.

**Complessità del business.** Un mono-prodotto B2C in un mercato semplice è diverso da un catalogo con 3.000 SKU in dodici lingue. Un B2B con quaranta clienti l’anno da 50.000 € è diverso da uno con quattromila clienti l’anno da 500 €. La complessità determina il tempo di setup, il volume di produzione contenuti, la sofisticazione dell’attribuzione, il numero di stakeholder da coordinare.

**Situazione di partenza.** Un canale già impostato, con tag manager configurato, GA4 pulito, campagne strutturate, costa meno da lavorare di uno che parte da zero o da un caos ereditato. La bonifica dei primi tre-quattro mesi è lavoro invisibile ma necessario. Un’agenzia seria la mette in preventivo come voce separata, e i primi mesi costano più di quelli successivi.

**Cosa è incluso, cosa è a parte.** Produzione contenuti? Creativi per campagne paid? Tool di terze parti (Semrush, HubSpot, Ahrefs, Hotjar)? Digital PR? Ottimizzazione del sito? Ogni voce che entra nel pacchetto aggiunge al fee; ogni voce che è a consumo separato lo abbassa in vetrina ma può gonfiarlo in corso d’opera. Chi paragona i totali senza scomporre gli scope prende decisioni sbagliate.

**Numero di stakeholder interni.** Un’agenzia che lavora con un CMO decisionale ha una struttura di lavoro leggera. Un’agenzia che deve coordinare tre reparti (marketing, sales, prodotto), passare per un comitato mensile e presentare al fondatore ogni trimestre, ha un onere di comunicazione che vale il 15-25% delle ore. Le proposte serie ne tengono conto — o dovrebbero.

---

## Milano non è cara per snobismo

Le tariffe delle agenzie di marketing milanesi sono in media del 15-30% più alte di quelle equivalenti fuori Milano, come per la SEO — ma nel marketing la differenza si sente ancora di più perché include creativi, senior strategici e figure di direzione, tutti profili con costi altamente correlati alla piazza.

Uno strategist senior a Milano costa all’agenzia 60.000-90.000 €/anno di RAL con oneri all’80% aggiuntivi. Un creativo art director senior 55.000-80.000 €. Uno space ufficio a Milano centro costa tre-cinque volte quello equivalente a Bologna o Firenze. Sommato, la struttura di costo di un’agenzia milanese è oggettivamente più alta.

Come nella SEO, non significa che il marketing milanese sia migliore. Significa che pagate anche per la prossimità al mercato milanese: sedi enterprise italiane, network di categoria, fiere di settore, incontri in presenza con brand consolidati. Per business che di quel network hanno bisogno (fashion, luxury, food industriale, fintech, consumer major) il sovrapprezzo si giustifica. Per business che non ne hanno bisogno, potete scegliere agenzie non milanesi di eguale competenza e risparmiare 20-30% sui costi mensili.

Nel 2026 il 85-90% del lavoro di marketing digitale si può fare bene da qualsiasi città italiana. Le eccezioni serie sono: produzione fisica (spot, servizi fotografici, eventi), lavoro sul brand luxury/fashion che richiede vicinanza culturale reale, casi enterprise dove le call in presenza sono nella cultura del committente. Fuori da queste eccezioni, la geografia è una preferenza, non un criterio di qualità.

---

## Come leggere un preventivo di marketing

Un preventivo di marketing fatto bene è più lungo di uno SEO: deve dichiarare più cose, perché il marketing tocca più canali e più leve. Sei cose devono esserci.

**La scomposizione delle ore per attività E per canale.** Non basta «attività marketing continuativa». Meglio: «gestione Google Ads: 12 ore/mese», «briefing e revisione contenuti: 8 ore/mese», «reporting e call cliente: 6 ore/mese», «SEO on-page: 4 ore/mese». Il canale + l’ora è il livello di dettaglio minimo utile.

**Il team assegnato al progetto.** Chi è il referente, chi lavora sui singoli canali, quanti anni di esperienza ognuno. Se la proposta include un creativo, chi è. Se include un SEO specialist, chi è. Le agenzie che scrivono «un team dedicato di specialisti» senza nomi vi stanno vendendo un’astrazione, non un servizio.

**I deliverable specifici, per canale.** Non «attività continuativa». Meglio: «un content plan trimestrale approvato da voi», «due articoli SEO/mese», «report mensile con dashboard», «revisione strategica ogni sei mesi», «due call di aggiornamento al mese», «un audit di canale ogni quattro mesi».

**La gestione del budget media, in modo esplicito.** Questa è la voce che nei preventivi mediocri scompare o è vaga. Deve dichiarare: chi possiede l’account della piattaforma (idealmente voi), come fluiscono i pagamenti (idealmente diretti al media, non con margine dell’agenzia), quali soglie di allerta per budget e ROAS. Un preventivo che parla di «budget media consigliato di 15.000 €/mese» ma non specifica queste tre cose sta lasciando margine a comportamenti opachi.

**Previsione di risultato, con verbi cauti.** Non «vi triplichiamo le vendite in sei mesi». Meglio: «sulla base della vostra baseline e del benchmark competitivo, stimiamo un incremento del 40-70% dei lead qualificati in 12 mesi». Il verbo è stimare, le assunzioni sono dichiarate, il range esiste.

**Cosa NON è incluso.** Il blocco più raro. Voci come «la produzione video non è inclusa e va quotata a parte», «le campagne LinkedIn Ads sono un modulo aggiuntivo», «gli strumenti terzi sono a carico vostro», «gli sviluppi tecnici sul sito sono a vostro carico» vi risparmiano brutte sorprese in corso.

Se un preventivo di marketing non ha almeno quattro di questi sei elementi, non è un preventivo: è un materiale commerciale. Rifiutatelo o chiedete di riformularlo.

---

## Tre segnali che il prezzo non torna

### 1\. Troppo basso per essere possibile

Un retainer sotto i 2.000 €/mese in un progetto di marketing digitale mid-market non compra tempo di senior — compra tempo di stagisti o di uno junior part-time. Non è una critica agli junior: è che un business che spende 15.000 €/mese in budget media, ha un catalogo con 500 prodotti e un CRM da coordinare, richiede giudizio esperto. Uno stagista può eseguire ma non decidere.

Le eccezioni: micro-progetti mono-canale (solo un contenuto/settimana, o solo gestione Meta con budget basso). Sopra questa dimensione, sotto una soglia il rapporto tra prezzo e tempo di senior è aritmeticamente impossibile.

### 2\. Fee a percentuale del budget media, senza minimi

«Il fee agenzia è il 20% del vostro budget media». Suona equo — l’agenzia guadagna se voi spendete. In realtà l’incentivo è tossico: l’agenzia guadagna se voi *spendete*, non se voi *avete ritorno*. Nei mesi in cui il vostro business avrebbe bisogno di ridurre la spesa media per riorganizzarsi, l’agenzia ha interesse a non farlo notare. Nei mesi di alta stagione ha interesse a spingervi a spendere anche quando i rendimenti calano.

Il modello sano è: fee fisso mensile calibrato sulla complessità del lavoro, budget media separato che scala in base alle decisioni di business — non alle esigenze commerciali dell’agenzia.

### 3\. Il «tutto incluso» senza breakdown per canale

«5.500 €/mese, gestione marketing completa». Sembra generoso, in realtà nasconde. Cosa succede se un mese la strategia richiede più creativi? Cosa succede se dovete aggiungere un canale? Cosa succede se un canale va sospeso perché non funziona? Senza breakdown per canale, l’agenzia decide unilateralmente cosa consegnare in base alla propria disponibilità mensile.

Il «tutto incluso» nel marketing è ancora più problematico che nella SEO, perché nel marketing i canali sono più e ognuno ha esigenze proprie. Un contratto che definisce esplicitamente scope e ore per canale vi dà uno strumento di controllo che il «tutto incluso» rimuove.

---

## Domande frequenti

**Il fee agenzia dovrebbe essere una percentuale fissa del budget media?**

Come range indicativo per performance marketing, sì: il fee dovrebbe essere il 15-25% del budget media totale. Ma non come modello contrattuale — come *proporzione ragionevole* per capire se state pagando bene la gestione. Il fee stesso deve essere fisso e calibrato sulle ore di lavoro, non variabile in base a quanto spendete: variabile crea incentivi tossici.

**Meglio pagare a retainer o a performance nel marketing?**

Retainer nella grande maggioranza dei casi, per gli stessi motivi trattati nella [guida SEO](/quanto-costa-unagenzia-seo-in-italia/): il performance-based nel marketing italiano è quasi sempre un retainer camuffato, o incentiva l’agenzia a massimizzare il numero di lead invece della qualità. Le eccezioni serie sono aziende con analytics maturo, baseline stabile, e agenzie che accettano di condividere revenue attribuito con logica trasparente. Sono rare.

**Qual è la durata minima di un contratto marketing tipico?**

Sei mesi è la durata minima sensata per la maggior parte dei modelli. Per il performance-paid può bastare anche tre mesi (i risultati si vedono in tempi brevi). Per l’inbound content-led servono almeno nove-dodici mesi per un test onesto. Contratti oltre i 18-24 mesi con vincoli rigidi sono difficili da giustificare — preferite rinnovi taciti con preavviso di 30-60 giorni.

**Ci sono costi nascosti tipici del marketing?**

Cinque ricorrenti: strumenti terzi (Semrush, Ahrefs, HubSpot, Klaviyo, Hotjar, tool di attribuzione — 500-2.500 €/mese in totale, a seconda dello stack), produzione video/creativo oltre pacchetto incluso, campagne su nuovi canali (se aggiungete LinkedIn dopo aver contrattualizzato solo Google e Meta, è tipicamente extra), tool di reporting personalizzati o dashboard dedicate, licenze piattaforme commerciali (Storyblok, Contentful, Segment) che non sono dell’agenzia. Un preventivo trasparente elenca queste voci in una sezione «costi accessori tipici»; uno opaco le fa emergere in corso d’opera.

**Come cambia il prezzo per e-commerce, B2B, enterprise?**

E-commerce PMI (fatturato online 500k-3M): retainer 3.500-8.000 €/mese, budget media 5.000-25.000 €/mese, fee proporzionato. E-commerce mid-market (3-20M): 6.000-15.000 €/mese fee, budget media 20.000-80.000 €/mese. B2B PMI: 4.000-9.000 €/mese fee, budget media 3.000-15.000 €/mese (il B2B spende meno in media). B2B enterprise: 10.000-30.000 €/mese fee, budget media variabile ampio. Enterprise multi-brand: cinque cifre mensili di fee come base, budget media a corpo strategico per campagne.
$t$,
          $t$https://miglioreagenzia.it/wp-content/uploads/2026/07/quanto-costa-un-agenzia-di-marketing.jpg$t$, $t$quanto costa un agenzia di marketing$t$, 1200, 675,
          (select id from public.content_authors where domain_id = dominio and slug = $t$nicola-ferrari$t$),
          'publish', $t$2026-07-29 09:25:40$t$::timestamp at time zone 'Europe/Rome', 101)
  on conflict (domain_id, slug) do nothing;
  insert into public.article_category_links (article_id, category_id)
  select a.id, c.id from public.articles a join public.article_categories c on c.domain_id = a.domain_id
  where a.domain_id = dominio and a.slug = $t$quanto-costa-unagenzia-di-marketing-in-italia$t$ and c.slug in ($t$google-ads$t$, $t$lead-generation$t$, $t$marketing$t$, $t$meta-ads$t$, $t$seo$t$, $t$uncategorized$t$, $t$web-design$t$)
  on conflict do nothing;

  insert into public.articles (domain_id, slug, title, body_md, cover_url, cover_alt, cover_width, cover_height,
                               author_id, status, published_at, wp_id)
  values (dominio, $t$come-scegliere-unagenzia-di-marketing$t$, $t$Come scegliere un'agenzia di marketing$t$, $t$«Agenzia di marketing» non esiste come categoria omogenea. È un termine ombrello sotto cui convivono realtà così diverse che chiedere «quale sia la migliore» in astratto è già una domanda mal posta. C’è quella strategica da tre partner che fa consulenza al vertice e non tocca operazioni. C’è quella performance da quindici persone che gira Google Ads e Meta con budget da 50.000 € al mese. C’è la boutique B2B che lavora esclusivamente su lead pipeline per software vendors. C’è lo studio content-led con una redazione interna che scrive per PMI in verticali di nicchia. Sono tutte «agenzie di marketing». Ma servono cose diverse, con team diversi, a prezzi diversi.

Il primo lavoro reale, prima di richiedere preventivi, è capire in quale delle sei famiglie di agenzie di marketing ricade il vostro bisogno. Fatto questo, la selezione fra tre-quattro agenzie sensate diventa gestibile — sei criteri per riconoscere quelle serie, cinque segnali di allarme per scartare quelle mediocri, un brief onesto in una pagina, un confronto strutturato di tre proposal.

Questa guida spiega perché il termine ombrello è un problema pratico, quali sono le sei famiglie in circolazione in Italia nel 2026, come riconoscere un’agenzia decente, quali segnali dovrebbero farvi riattaccare, come strutturare un brief marketing e come leggere tre proposal senza uscirne più confusi di prima. In fondo, un pezzo su quando la struttura interna è meglio dell’esterna — una decisione che vale la pena farsi *prima* di ingaggiare un’agenzia, non dopo.

Nessuna delle agenzie che linkeremo da questa guida ha pagato per essere consigliata. Nessuna posizione in classifica è acquistabile. [Spieghiamo come selezioniamo →](/metodologia/)

---

## «Agenzia di marketing» è un termine ombrello

Cercate «agenzia di marketing Milano» su Google e trovate cinquanta risultati che sembrano identici. Aprite dieci siti e trovate le stesse parole: strategia, digital, performance, contenuti, dati, risultati misurabili. Tutti dicono di fare tutto. Nessuno spiega davvero cosa fa meglio.

L’appiattimento è deliberato. Presentarsi come «agenzia di marketing full-service» massimizza il numero di richieste di preventivo — chiunque cerchi *qualsiasi cosa* legata al marketing può teoricamente essere un cliente. È una strategia commerciale che funziona sul volume ma penalizza la qualità del match: metà dei progetti che ne derivano finiscono con team che stanno provando a fare qualcosa in cui non sono i migliori.

Le agenzie serie fanno il contrario. Dicono con precisione cosa fanno, per chi lo fanno meglio, quali progetti *non* accettano. Sono più difficili da trovare perché ottimizzano meno per l’ampiezza della domanda e più per la qualità del cliente finale. Chi le trova è tipicamente qualcuno che ha già fatto il lavoro di capire cosa gli serve.

Questo articolo è un aiuto a farlo.

---

## Le sei famiglie di agenzie di marketing

Sei tipologie ricorrenti nel mercato italiano nel 2026. Non sono mutualmente esclusive — una boutique verticale può essere anche performance-driven, un’agenzia strategica può avere una piccola practice di execution digital. Ma un’agenzia decente ha *una famiglia dominante*, che sa raccontare in cinque minuti al primo colloquio.

### 1\. Strategica / consulenziale

Fondatori senior con background di consulting o ex-CMO. Team piccolo (3-10 persone), tutte figure con esperienza. Vendono giornate di lavoro strategico, non retainer di operazioni. Progetti tipici: entrata su nuovi mercati, ripensamento di posizionamento, definizione della go-to-market, audit del marketing esistente, ricerca su clienti e concorrenti.

Non toccano operazioni: non gestiscono Google Ads, non scrivono contenuti, non fanno social. Consegnano documenti, roadmap, decisioni. È il vostro team interno o un’altra agenzia esecutiva che poi implementa.

Per chi ha senso: aziende che devono *decidere cosa fare*, non chi lo esegue. Startup a un momento di svolta, PMI in fase di riposizionamento, brand consolidati con canale digitale nuovo. Prezzo tipico: 25.000-100.000 € a progetto, oppure retainer strategico 8.000-25.000 €/mese.

### 2\. Digital generalista full-service

Il modello più diffuso in Italia. Team di 15-50 persone, spesso strutturato in reparti (SEO, paid, content, social, creative). Vendono la comodità di un unico interlocutore che copre più canali contemporaneamente. Retainer mensili con scope ampio, presenza attiva su tre-cinque canali digitali per cliente.

Rischio strutturale: fanno tutto ma poche cose eccellenti. Il paid è dignitoso, la SEO è dignitosa, il content è dignitoso — raramente uno dei tre è di livello competitivo con boutique specialiste. Per PMI che non hanno tempo di gestire più fornitori è il compromesso corretto. Per aziende con obiettivi di canale ambiziosi, di solito, non basta.

Per chi ha senso: PMI B2B o B2C con marketing distribuito su più canali e nessun canale dominante, team interno piccolo o assente, budget mensile 5.000-20.000 €. Prezzo tipico: retainer 4.000-15.000 €/mese.

### 3\. Performance / paid

Specializzate in acquisizione a pagamento: Google Ads, Meta, LinkedIn Ads, TikTok Ads, Amazon Ads, retail media. KPI orientati a CAC, ROAS, revenue diretto. Team più tecnico che creativo, dashboard di attribuzione centrali nella relazione.

Sono le uniche agenzie di marketing dove la misura del successo è netta e discussa mese per mese. Se non funzionano, si vede in trenta giorni. Se funzionano, il cliente le tiene per anni. La rotazione tipica del portafoglio clienti è alta nei primi mesi e stabile dopo.

Per chi ha senso: aziende con business funzionante che vogliono scalare acquisizione, e-commerce con margine sufficiente da sostenere CPC crescenti, B2B con offerta chiara e ciclo breve. Prezzo tipico: fee 2.500-8.000 €/mese + budget media a parte (il media è vostro, non dell’agenzia).

### 4\. Content e SEO / inbound

Specializzate in strategia editoriale, produzione contenuti, SEO organica, magazine di brand, marketing automation. Team con redazione interna (o rete di freelance stabili), SEO strategist, editor. Il primo lead qualificato o la prima conversione arriva dopo mesi, non settimane.

Overlap significativo con le agenzie SEO specialistiche — la differenza è che le agenzie content/inbound trattano il contenuto come strumento di generazione domanda, non solo di ranking. La SEO è mezzo, non fine.

Per chi ha senso: business B2B con ciclo di vendita lungo e high consideration, editoria e media, aziende che vogliono costruire brand oltre che pipeline. Prezzo tipico: retainer 4.000-12.000 €/mese, con curva risultati misurabili a 6-9 mesi.

### 5\. B2B specialistica

Focus esclusivo su marketing B2B: ABM (account-based marketing), lead pipeline per software vendors, sales enablement, marketing enterprise. Team con background misto marketing + sales, forte competenza CRM (HubSpot, Salesforce, Attio), attribuzione a livello di deal chiuso.

È la famiglia più recente e in crescita nel mercato italiano. Le agenzie generaliste che si presentano come «anche B2B» raramente hanno la profondità di team dedicati — è un mestiere con logiche proprie.

Per chi ha senso: software vendors, servizi B2B enterprise, industriale con vendita consulenziale, professional services con target definito. Prezzo tipico: retainer 6.000-20.000 €/mese, progetti ABM da 15.000-80.000 €.

### 6\. Boutique verticale

Specializzate su un singolo settore (fashion, hospitality, food, real estate, fintech, medtech, education, retail, automotive). Team piccolo (5-20 persone) ma competenza verticale profonda: conoscono i canali specifici del settore, i benchmark realistici, i concorrenti, il linguaggio, le fiere, le stagioni.

Sono spesso la scelta migliore se il vostro business è nel loro verticale e la scelta peggiore se è fuori. Sopra la specializzazione, non hanno la scalabilità di un’agenzia generalista né la profondità di una specialistica di canale. Sotto, sono imbattibili.

Per chi ha senso: aziende con business chiaramente verticale, marchi consolidati in nicchia, brand emergenti che vogliono capire il proprio settore prima di generalizzare. Prezzo variabile in base al verticale, tipicamente allineato con le agenzie digital generaliste.

**La domanda utile prima di richiedere qualsiasi preventivo: quale delle sei famiglie corrisponde al vostro bisogno reale?** Se la risposta è «non lo so», il primo lavoro è farsela con qualcuno esperto — un consulente indipendente, un CMO fractional, il vostro board se avete stakeholder marketing-literate. Ingaggiare un’agenzia prima di averla, quasi sempre, porta a scegliere sbagliato.

---

## Sei criteri per riconoscere un’agenzia di marketing seria

Poste in serie a tre agenzie della famiglia giusta per voi, sei domande restituiscono un ordinamento affidabile. Sono le stesse che raccomandiamo nella nostra [guida alla scelta di un’agenzia SEO](/come-scegliere-unagenzia-seo-in-italia/) — adattate al marketing.

**Specializzazione dichiarata.** Un’agenzia che vi dice «facciamo di tutto» non fa niente di specifico. Un’agenzia che vi dice «siamo forti su performance per B2C fashion sotto i 20M di fatturato online» o «lavoriamo prevalentemente ABM per software B2B con deal medi sopra 30k» vi sta dicendo dove ha vinto, dove ha imparato, dove è pronta a lavorare meglio.

**Metodologia trasparente.** Chiedete come parte un progetto. Se rispondono con parole in fila («discovery, strategia, esecuzione, ottimizzazione») vi stanno leggendo un menù. Se mostrano un processo — con fasi, deliverable, tempistiche, chi decide cosa e quando — hanno un metodo.

**Casi con numeri di business, non di canale.** «Abbiamo aumentato l’engagement rate del 340%» non è un caso. «Abbiamo portato il fatturato online di X da 800.000 a 3,2M annui in 22 mesi, mantenendo il ROAS sopra 3,5» è un caso. Chiedete tre casi nel vostro verticale, con numeri di business e non solo metriche di canale. Le agenzie mediocri hanno solo metriche di canale.

**Team stabile e senior sul progetto.** Chi è il vostro referente, quanti anni di esperienza ha, chi lavora sotto di lui, quanto tempo dedica al vostro account. Alcune agenzie vendono con partner senior e consegnano con account junior — non è illegale, ma dovreste saperlo prima di firmare, non al terzo mese.

**Reporting orientato al business.** Un report che elenca CTR, impression, engagement è un report di canale. Un report che collega canale, traffico, lead, conversion, revenue è un report utile. Il buon reporting risponde a tre domande: *cosa è successo?* (dati), *perché è successo?* (analisi), *cosa facciamo di conseguenza?* (decisioni). Se manca la terza, è un elenco.

**Contratto flessibile.** Sei mesi di vincolo è la norma. Ventiquattro mesi con penali di uscita è un problema. Verificate quattro punti: durata minima e regole di uscita, ownership dei contenuti prodotti (vostri), ownership degli account di piattaforme e strumenti (vostri, non dell’agenzia), condizioni di trasferimento a fine rapporto. Un’agenzia che vi tiene in ostaggio l’account Google Ads a fine contratto non ha capito il proprio mestiere.

---

## Cinque segnali di allarme

**«Aumentiamo le vostre vendite del X% garantito».** Nessuna agenzia seria promette risultati di business specifici, perché le vendite dipendono da variabili fuori dal controllo dell’agenzia — prodotto, prezzo, stagionalità, competitor, congiuntura macro. Chi garantisce sta o vendendo aria, o pianificando pratiche tossiche (spam, click fraud, revenue-shifting da canali che già convertivano) che nel breve gonfiano i numeri e nel medio distruggono la vostra base.

**«Diventiamo il vostro reparto marketing esterno».** In italiano suona rassicurante. In pratica significa che l’agenzia vuole prendere il vostro budget marketing intero e diventare l’unico interlocutore su ogni canale. Nel 90% dei casi è un cattivo affare per voi: perdete controllo sull’attribuzione, sui dati, sul dialogo con altre agenzie specialistiche, e create dipendenza contrattuale forte da un singolo fornitore. Le eccezioni ci sono, ma sono rare — tipicamente aziende molto piccole con budget sotto i 3.000 €/mese, dove avere due-tre agenzie è impraticabile.

**Dashboard di solo canale come reporting.** Se dopo tre mesi di lavoro il vostro report mensile è pieno di CTR, impression, reach, engagement, e non contiene lead qualificati, conversion, revenue attribuito, l’agenzia sta ottimizzando l’output del canale, non il vostro business. Le metriche di canale servono per capire *come* qualcosa sta funzionando, non *se* sta funzionando. Se non c’è il collegamento con il business, il collegamento non esiste nemmeno nel lavoro dell’agenzia.

**«Il marketing è arte, non tutto si misura».** Vera in astratto, sospetta nella pratica. Le agenzie che invocano l’incommensurabilità del marketing lo fanno quasi sempre per giustificare l’assenza di metriche di risultato. In effetti, molto del marketing di brand ha rendimenti misurabili solo su orizzonti lunghi e con logiche di lift studies o brand tracker — che sono possibili, non impossibili. L’agenzia seria vi dice quello che sa misurare e quello che non sa misurare, e vi spiega perché. L’agenzia mediocre dice che il marketing è arte quando vi lamentate del ROAS.

**Contratto lungo con penali di uscita.** Vale la stessa logica dei contratti SEO: 24 mesi di vincolo rigido è un modo dell’agenzia di scaricare su di voi il rischio di una relazione andata male. Le agenzie sicure del proprio lavoro non hanno bisogno di vincolarvi — sanno che non vorrete andarvene. Preferite contratti di 6 mesi rinnovabili tacitamente, con preavviso di disdetta di 30-60 giorni.

---

## Il brief in una pagina, versione marketing

Un buon brief per un’agenzia di marketing sta in una pagina. Fa lavoro di auto-selezione (le agenzie sbagliate si defilano) e permette a quelle giuste di fare proposte pertinenti al primo colpo, senza tre cicli di andata e ritorno. Otto blocchi.

**Chi siete, in tre righe.** Cosa fate, a chi vendete, che dimensione avete. Non serve la storia dal fondatore.

**Cosa vendete e come.** Prodotto o servizio, prezzo medio, ciclo di vendita, canali di acquisizione attivi oggi. Se avete un e-commerce: piattaforma, AOV, canali di traffico. Se avete un business B2B: come qualificate un lead, quanto vale un cliente medio, quanti clienti servite l’anno.

**Situazione attuale del marketing.** Chi c’è dentro l’azienda (CMO, marketer, junior, nessuno), quali canali funzionano oggi e quali no, chi ha fatto marketing prima di voi (se qualcuno), un’idea onesta di dove il canale è forte e dove è debole. Se avete dati (GA4, Meta Ads, CRM, dashboard di attribuzione), allegateli. Le agenzie serie apprezzano.

**Obiettivi in metriche.** Non «vogliamo crescere». Meglio: «vogliamo passare da 40 lead qualificati/mese a 120 in 12 mesi, con CAC sotto 800 €», o «vogliamo scalare fatturato online da 1,2M a 3M in 24 mesi mantenendo ROAS sopra 3». Se non sapete quantificare, dite anche quello: «non abbiamo baseline chiara, ci aspettiamo che l’agenzia ci aiuti a costruirla».

**Cosa NON state cercando.** È il blocco più utile e più sottovalutato. Se non volete che vi propongano un rifacimento del sito, ditelo. Se non volete social manager, ditelo. Se cercate solo consulenza strategica e non execution, ditelo. Filtra da subito le agenzie sbagliate.

**Budget e timing.** Un range è meglio di un numero unico: «2.500-5.000 €/mese di fee agenzia, budget media a parte 3.000-8.000 €/mese, partenza entro settembre». Se non avete un budget definito, dite che aspettate proposte e le valuterete su rapporto costo-scope. Non fingete di avere un budget indefinito quando non è vero.

**Vincoli e contesto.** CMS attuale, CRM in uso, altre agenzie che lavorano su altri canali, vincoli di brand o compliance, tool marketing già in casa. Tutto quello che un’agenzia dovrebbe sapere prima di formulare una proposta.

**Chi decide.** Nel marketing questo blocco vale doppio. Un’agenzia che sa di lavorare con il CMO ha un dialogo diverso rispetto a una che lavora con il CEO, che è diverso ancora da una che lavora con il board di una PMI a conduzione familiare. Dire chi firma il contratto, chi approva creatività e budget, chi giudica i risultati, evita mesi di equivoci.

Un brief così si scrive in due-tre ore. In cambio ricevete proposte molto più mirate. Le agenzie mediocri risponderanno lo stesso con un modello standard, ma le noterete al primo sguardo.

---

## Come confrontare tre proposal

Ricevete tre proposte. Sono lunghe, dense di grafici, con impostazioni diverse. Confrontare i totali è la scelta peggiore. Cinque assi, in questo ordine.

**Pertinenza al brief.** Quanto ognuna ha capito il vostro caso? Ci sono paragrafi che sembrano ricopiati da un altro cliente? La proposta cita il vostro sito reale, i vostri numeri, i vostri concorrenti, o è tutta teoria generale? Le proposte generiche vanno depennate al primo giro.

**Chiarezza degli scope per canale.** Cosa fanno esattamente ogni mese? Quante ore su SEO, quante su paid, quante su content, quante su reporting? Le proposte con voci vaghe («attività di marketing continuativa») sono un rischio strutturale. Le proposte con voci precise («2 briefing contenuti/mese, gestione Google Ads con 4 campagne attive, 4 email nurture/trimestre, dashboard settimanale») sono un contratto.

**Team assegnato e chi lavora davvero.** Chi è il referente, quanto tempo dedica al vostro progetto, chi lavora sotto di lui? Un senior al 25% e uno junior al 75% è un progetto diverso da un mid dedicato full-time. A parità di prezzo, il team fa la differenza reale.

**Attribuzione proposta.** Come misureremo se funziona? Se la proposta non lo dice, è un problema. Una proposta seria dichiara quali metriche useremo, chi le raccoglie, con quali strumenti, con quale frequenza le rivediamo. In marketing questa è spesso la parte più trascurata delle proposal — chi la mette bene sta segnalando cultura di lavoro adulta.

**Prezzo, ma per unità comparabile.** Se una proposta include produzione contenuti e le altre no, non state confrontando la stessa cosa. Normalizzate: costo per ora di senior, costo per articolo, costo per campagna paid gestita. Solo dopo, mettete i totali affiancati.

Se la differenza fra la proposta più cara e la più economica è oltre il 50%, quasi sempre c’è una differenza reale nel team o nello scope. Il prezzo, come nella SEO, è raramente arbitrario. Le fasce di prezzo tipiche del mercato italiano — le trattiamo per esteso in [una guida dedicata](/quanto-costa-unagenzia-di-marketing-in-italia/) — aiutano a orientarsi.

---

## Quando la struttura interna è meglio dell’esterna

Prima di firmare con un’agenzia, vale la pena farsi una domanda che spesso viene saltata: state esternalizzando qualcosa che sarebbe meglio tenere in casa?

Tre criteri, guardati insieme, aiutano a decidere.

**Se il canale è stabile e prevedibile, e il volume di lavoro giustifica un tempo pieno, spesso interno vince.** Una PMI B2B con Google Ads che gira a 15.000 € di media/mese stabili, o un e-commerce con quattro canali paid consolidati, hanno probabilmente il volume per assumere una figura interna e risparmiare sul fee agenzia sui 24 mesi. Il calcolo non è banale — costo pieno di un mid-senior interno è 55-75.000 €/anno in Italia, contro un retainer di 3.500-6.000 €/mese per capacità equivalente — ma sulle scale giuste, l’interno vince.

**Se serve competenza rara solo occasionalmente, esterno vince quasi sempre.** Nessuno assume un SEO director senior full-time per gestire tre-quattro cluster tematici. Nessuno assume un ABM specialist per lanciare due campagne l’anno. Le competenze rare + il bisogno intermittente = esterno.

**Se avete IP strategica sensibile — dati clienti, strategia commerciale, insights competitivi — l’interno protegge quello che l’esterno inevitabilmente vede.** Non è una critica alle agenzie: è un fatto strutturale. Un’agenzia che lavora su cinque clienti in un verticale vede pattern e informazioni che il singolo cliente preferirebbe non condividere. Se il vostro vantaggio competitivo è nella conoscenza del cliente, spostarla fuori ha un costo che non compare nel preventivo.

Il modello ibrido — CMO o head of marketing interno + agenzie specialistiche esterne su canali specifici — è quello che nella pratica funziona meglio per aziende sopra una certa dimensione. Interno decide, esterno esegue. È diverso dall’avere solo l’agenzia («decidiamo insieme»), che nella pratica significa che decide l’agenzia perché è quella con la competenza operativa.

Approfondiamo questa decisione — con i numeri reali del breakeven e i modelli ibridi possibili — in un articolo dedicato.

---

## Domande frequenti

**Meglio un’agenzia digital generalista o specialisti multipli per canale?**

Dipende dalla dimensione del budget e dalla presenza di un coordinatore interno. Sotto i 5.000 €/mese totali di fee agenzia, un generalista è la scelta pragmatica: coordinare più fornitori con budget piccoli non conviene a nessuno. Sopra i 10.000 €/mese, di solito, specialisti multipli con un coordinatore interno (CMO, marketing manager, growth lead) danno risultati migliori. Nella fascia di mezzo la scelta è caso per caso.

**Meglio un’agenzia locale o remota?**

Il marketing digitale è indifferente alla distanza fisica per la maggior parte dei mestieri: performance, SEO, content, analytics si fanno benissimo in remote. Fa eccezione il marketing di brand con produzione (spot, servizi fotografici, eventi), dove la presenza fisica ha peso reale. Se non avete bisogno di produzione fisica frequente, la scelta va fatta su specializzazione e team, non su codice postale.

**Un’agenzia sola può gestire tutto il mio marketing?**

Sì, in teoria. Bene, in pratica, solo se: il vostro budget totale è sotto i 15.000 €/mese, la vostra strategia è relativamente stabile, il vostro business non richiede specializzazioni rare (fintech marketing, medtech B2B, luxury). Sopra queste soglie, la mono-agenzia diventa un collo di bottiglia — vi manca la profondità su almeno un canale, e cambiarla dopo tre anni è un dolore. Ai livelli enterprise, la stack normale è: un’agenzia strategica di riferimento, due-tre agenzie specialistiche di canale, un team interno che coordina.

**Che ROI aspettarsi da un’agenzia di marketing?**

Impossibile rispondere senza contesto. In performance marketing, un ROAS 3-5 su budget maturi è ragionevole; ROAS 2 è marginale ma può funzionare per business con LTV alta; ROAS 1,5 è quasi sempre un problema. In marketing di brand o inbound, il ROI si misura in lift studies annuali e in crescita composta della quota di mercato — orizzonti lunghi, non trimestrali. Un’agenzia seria vi dice cosa considera un ROI accettabile per la vostra situazione specifica prima di iniziare, non dopo.

**Come si divide il budget tra fee agenzia e budget media?**

Regola pratica per il performance marketing: fee agenzia intorno al 15-25% del budget media totale. Sopra il 30% è un’agenzia cara per il vostro volume; sotto il 10% è un budget media troppo grande per l’attenzione che l’agenzia può darvi. Su fee agenzia + retainer strategici + content marketing puro, la logica cambia — non c’è budget media da mettere in relazione, e la decisione è sul valore assoluto delle ore comprate.
$t$,
          $t$https://miglioreagenzia.it/wp-content/uploads/2026/07/come-scegliere-un-agenzia-di-marketing.jpg$t$, $t$come scegliere un'agenzia di marketing$t$, 1200, 675,
          (select id from public.content_authors where domain_id = dominio and slug = $t$nicola-ferrari$t$),
          'publish', $t$2026-07-29 09:25:40$t$::timestamp at time zone 'Europe/Rome', 98)
  on conflict (domain_id, slug) do nothing;
  insert into public.article_category_links (article_id, category_id)
  select a.id, c.id from public.articles a join public.article_categories c on c.domain_id = a.domain_id
  where a.domain_id = dominio and a.slug = $t$come-scegliere-unagenzia-di-marketing$t$ and c.slug in ($t$google-ads$t$, $t$lead-generation$t$, $t$marketing$t$, $t$meta-ads$t$, $t$seo$t$, $t$web-design$t$)
  on conflict do nothing;

  insert into public.articles (domain_id, slug, title, body_md, cover_url, cover_alt, cover_width, cover_height,
                               author_id, status, published_at, wp_id)
  values (dominio, $t$agenzia-lead-generation-cose-come-si-sceglie$t$, $t$Agenzia lead generation: cos'è, come si sceglie$t$, $t$Chi vi promette «X lead qualificati al mese» come garanzia sta vendendo un magazzino, non un progetto. Le agenzie che portano davvero pipeline non promettono numeri fissi — dicono che tipo di lead sanno costruire, con quale metodo, e vi mostrano cosa hanno fatto per aziende simili alla vostra. Le agenzie che vendono numeri, di solito, vendono anagrafica comprata.

«Agenzia di lead generation» è il termine ombrello più abusato del marketing B2B italiano nel 2026. Sotto la stessa etichetta convivono studi di RevOps con team analytics maturi, boutique di outbound seri con SDR interni, agenzie paid-led che sanno costruire funnel, e magazzini di liste travestiti da agenzia. Sceglierne una senza capire prima cosa fa davvero è la ragione principale per cui i budget lead gen bruciano senza portare fatturato.

Questa guida spiega cosa significa davvero fare lead generation nel 2026, quali sono i quattro modelli operativi seri, quali domande smascherano chi vende contatti al posto della strategia, quali KPI hanno senso, quali fasce di prezzo sono ragionevoli in Italia. E dove finisce la lead generation e comincia il paid advertising travestito.

Nessuna delle agenzie che linkeremo da questa guida ha pagato per essere consigliata. Nessuna posizione in classifica è acquistabile. [Spieghiamo come selezioniamo →](/metodologia/)

---

## Cosa significa davvero «lead generation» nel 2026

Un lead è un contatto qualificato: qualcuno che ha manifestato interesse concreto per quello che vendete, e per cui esiste un motivo plausibile di ricontatto commerciale. Non è un indirizzo email in un database. Non è chi ha cliccato su un annuncio. Non è chi ha scaricato un ebook per curiosità.

La distinzione conta perché nel B2B italiano il costo per lead qualificato oscilla tra 50 e 500 €, mentre il costo per «contatto anagrafico» (nome + email + azienda) può essere sotto 1 €. Sono due categorie di prodotto diverse che nel pitch commerciale vengono spesso confuse per far apparire il ritorno più grande di quello che è.

Un’agenzia di lead generation seria fa tre cose insieme, non separate:

Costruisce un sistema per attrarre attenzione qualificata (attraverso contenuti, canali paid, outreach mirato, referral). Poi filtra questa attenzione con criteri di qualifica dichiarati — dimensione azienda, ruolo, budget, timing, problema specifico. Infine consegna al vostro team commerciale non tanti contatti, ma i contatti giusti al momento giusto, con contesto sufficiente per una conversazione produttiva.

Chi salta il secondo passaggio — qualifica — non fa lead generation. Fa raccolta contatti. È una cosa diversa, con valore economico molto minore.

---

## I quattro modelli operativi seri

Il mercato italiano ha quattro modelli distinti di lead generation seria. Non sono equivalenti: rispondono a bisogni diversi, hanno costi diversi, si applicano a business diversi. Un’agenzia decente vi spiega quale sta proponendo. Un’agenzia che si presenta come «generalista lead gen» probabilmente ne fa uno solo travestito da metodo universale.

### 1\. Outbound strutturato

Cold outreach su LinkedIn e email, condotto da Sales Development Representative (SDR) — interni all’agenzia o co-gestiti con il cliente. Funziona per B2B con target definibile con precisione (per ruolo, industria, dimensione), ciclo di vendita medio-lungo, deal size sopra i 10.000 €.

I numeri realistici in Italia nel 2026: 200-600 email/mese per SDR, tasso di risposta 3-8%, tasso di call prenotate 1-2%, di conversione a opportunità qualificata 20-40% delle call. Su un progetto ben costruito, un SDR porta 5-15 opportunità qualificate al mese. Meno di così è sotto-performante; molto di più, quasi sempre, è gonfiato o è raccolta contatti spacciata per outbound.

Prezzo: retainer 3.000-8.000 €/mese per un SDR part-time gestito, 6.000-12.000 €/mese full-time.

### 2\. Inbound content-led

SEO + content + nurture email, per attrarre organicamente un pubblico che sta già cercando quello che vendete. Funziona per B2B con ciclo di vendita lungo, dove il lead è disposto a educarsi prima di parlare con un commerciale. Il primo lead qualificato arriva tipicamente dopo 4-6 mesi di lavoro; il flusso stabile dopo 9-12.

I numeri realistici: si parte da traffico organico crescente misurabile a 3 mesi, primi form compilati a 4-6 mesi, tasso di conversione visitatore → lead 0,5-2%, tasso di qualifica dei lead 20-40%.

Prezzo: retainer 4.000-10.000 €/mese per PMI B2B, sale da lì per progetti enterprise.

L’inbound serio è il fratello ricco della SEO e ne condivide il metodo — trattiamo per esteso la scelta di un’agenzia SEO nella nostra [guida dedicata](/come-scegliere-unagenzia-seo-in-italia/).

### 3\. Paid-led

Performance marketing (Google Ads, LinkedIn Ads, Meta) con landing dedicate e funnel di qualifica. Funziona per B2C, per B2B con offerta chiara e ciclo breve, per test di ipotesi rapidi su nuovi mercati. Il primo lead arriva in giorni, non mesi.

I numeri realistici in B2B: costo per lead 50-300 €, tasso di qualifica 15-30% (basso, richiede filtro robusto post-lead). In B2C: costo per lead 5-50 €, tasso di qualifica 20-50% a seconda del prodotto.

Prezzo: fee agenzia 1.500-5.000 €/mese + budget media a parte (il budget media è vostro, non dell’agenzia). Chi vi vende «tutto compreso» sta o caricando margine sul media, o allocando budget in modo opaco.

### 4\. RevOps ibrido

Il modello più recente e più raro. L’agenzia lavora sull’infrastruttura marketing-sales (CRM, marketing automation, attribuzione, segnalazione), integra i tre canali sopra, e ottimizza il flusso end-to-end. Non è per aziende che partono da zero: presuppone un HubSpot, un Salesforce, o strumenti equivalenti già in uso, e un team commerciale strutturato.

Prezzo: retainer 6.000-20.000 €/mese, spesso con progetti di setup a parte.

**La domanda utile prima di firmare qualsiasi contratto: quale dei quattro modelli state proponendo?** Se la risposta è «un mix di tutti e quattro», nel 90% dei casi state parlando con qualcuno che ne fa uno bene e gli altri tre superficialmente. Meglio saperlo prima.

---

## Le due domande da fare al primo colloquio

Al primo incontro con un’agenzia lead generation, prima ancora di parlare di prezzo, valgono due domande. Le risposte danno il 70% dell’informazione utile per decidere.

**«Cosa mi vendete davvero: la generazione dei lead o la loro qualifica?»**

Le due cose non coincidono. Un’agenzia può darvi 100 lead/mese che sono tutti fuori target, o 20 lead/mese perfettamente qualificati. La prima è retail, la seconda è servizio.

Le agenzie serie hanno un processo di qualifica esplicito: criteri di ingresso (BANT, MEDDIC, o versioni personalizzate), scoring, filtri automatici + revisione umana. Chi vi dice «vi mandiamo tutti i lead e voi qualificate» sta scaricando su di voi il lavoro più costoso, quello per cui vi eravate rivolti all’agenzia in primo luogo.

**«Come fate a garantire che questi lead non siano già stati venduti a un altro cliente?»**

Molti magazzini di anagrafica travestiti da agenzia vendono lo stesso database a decine di clienti. Un’agenzia che genera lead veri, esclusivi, per una specifica campagna, risponde a questa domanda con un contratto — clausola di esclusività, cadenza di rigenerazione della lista, meccanismo di verifica. Chi non ha una risposta chiara, molto probabilmente sta vendendo un prodotto condiviso.

Se dopo queste due domande la conversazione diventa vaga, il colloquio è finito.

---

## KPI reali (che non sono «numero di lead»)

Il numero di lead non è un KPI. È un indicatore di volume, e il volume da solo non dice nulla sulla qualità del lavoro. Cinque KPI, guardati insieme, dicono se la lead generation sta funzionando.

**Costo per lead qualificato (non per contatto).** La qualifica va definita in contratto — quali criteri fanno di un contatto un lead qualificato, chi verifica, quando. Il costo per lead qualificato è tra 3 e 10 volte il costo per contatto grezzo. Se un’agenzia vi dà «CPL 8 €» e non specifica su quale qualifica, il numero non significa niente.

**Tasso di conversione lead → opportunità.** Un lead che il commerciale non chiude in opportunità è un lead che il commerciale non ha lavorato bene, oppure che l’agenzia ha qualificato male. Un tasso sotto il 15% segnala tipicamente qualifica scadente da parte dell’agenzia. Un tasso sopra il 50% è sospettosamente alto: o l’agenzia sta selezionando solo i lead già maturi, o li sta ereditando da campagne che aveva già in casa.

**Deal size medio dei lead chiusi.** Se i lead portati dall’agenzia chiudono deal di 2.000 € mentre la vostra media aziendale è 8.000 €, l’agenzia sta portando la fascia bassa. Non è per forza un errore — dipende dagli obiettivi — ma è un fatto che va guardato.

**Ciclo di vendita medio dei lead agenzia.** Un ciclo molto più lungo della media suggerisce lead poco maturi. Molto più corto, spesso, lead che avevano già intenzione di comprare (agenzia che si prende il merito di conversioni comunque destinate ad accadere).

**Attribuzione revenue.** Alla fine di un trimestre, quanto fatturato attribuibile alla campagna? Se l’agenzia non ha un’attribuzione condivisibile e verificabile, non sapete se stanno funzionando. Le agenzie serie ve la costruiscono. Quelle mediocri vi danno report di canale (traffico, click, form) come proxy — che è utile ma non basta.

---

## Fasce di prezzo indicative in Italia nel 2026

I numeri che seguono sono ordini di grandezza per progetti con team senior sul vostro account. Applichiamo la stessa logica delle nostre [fasce SEO](/quanto-costa-unagenzia-seo-in-italia/): non sono un tariffario, sono un orientamento per capire cosa state comprando.

**Sotto 2.000 €/mese** — non è lead generation. È traffico paid gestito, cold outreach eseguito con template standard, o vendita di liste. Può servire in casi molto specifici (validazione veloce di un canale, budget di test) ma non aspettatevi qualifica seria.

**2.500-5.000 €/mese** — outbound strutturato light (un SDR part-time gestito), paid-led con budget media separato, inbound leggero come rampa iniziale. Per PMI B2B che partono senza infrastruttura.

**5.000-10.000 €/mese** — outbound strutturato con SDR quasi full-time, inbound content-led maturo, paid-led con testing multi-canale, primi elementi di RevOps. Fascia sana per PMI B2B con obiettivi seri.

**10.000-25.000 €/mese** — RevOps hybrid, integrazione tra i modelli, gestione di più canali paralleli, dashboard di attribuzione dedicata. Per aziende con pipeline già strutturata e team commerciale interno che sa lavorare i lead ricevuti.

**Sopra 25.000 €/mese** — enterprise, multi-mercato, team dedicati, integrazione con marketing e sales interni.

Come regola generale: sotto 3.000 €/mese in B2B, il rapporto tra ore effettive di lavoro qualificato e prezzo si rompe. Aspettatevi commodity, non partnership.

---

## Cinque segnali che vi stanno vendendo liste

**«Garantiamo X lead al mese».** Le garanzie in lead generation seria non esistono, perché la qualità dei lead dipende da variabili fuori dal controllo dell’agenzia (mercato, competitor, congiuntura). Chi garantisce numeri fissi sta vendendo o un target basso definito a bella posta per essere raggiunto senza sforzo, o liste comprate. Nessuna delle due cose ha valore reale.

**Pitch che parla di «database di 10 milioni di contatti».** Un’agenzia lead gen non dovrebbe avere un database di contatti. Dovrebbe avere un metodo per costruire contatti nuovi ogni mese, esclusivi per voi. Chi vanta la dimensione del proprio database sta pubblicizzando la propria natura di magazzino.

**Nessuna richiesta di accesso al vostro CRM.** Un’agenzia seria vuole capire come lavorate i lead una volta ricevuti — quali si chiudono, quali no, in quanto tempo, per quali motivi. Serve per raffinare la qualifica. Chi non chiede accesso al CRM sta consegnandovi lead senza feedback loop, cioè senza possibilità di migliorare nel tempo.

**Fee al lead senza definizione di qualifica.** «Vi paghiamo 40 € per lead» è una promessa vuota finché non è scritto cosa è un lead — quali criteri di qualifica, chi li verifica, chi decide in caso di controversia. Senza definizione, il pagamento è pretestuoso e chi paga è sempre chi consegna il numero più alto di contatti, indipendentemente dalla qualità.

**Zero case pubblici nel vostro verticale.** Non è un problema in assoluto — un’agenzia può essere brava e non essersi ancora specializzata sul vostro settore. Ma è un problema se, insieme all’assenza di case, non c’è nemmeno un ragionamento articolato su cosa cambia nel vostro verticale rispetto a quelli che hanno lavorato prima. Il vuoto totale segnala che imparano sul vostro budget.

---

## B2B e B2C sono due mestieri diversi

«Lead generation» significa cose diverse nei due mondi. Un’agenzia che pretende di fare bene entrambi, di solito, ne fa bene uno.

**In B2B**, un lead è un decisore o influenzatore identificato, in un’azienda del vostro target, con un problema che voi risolvete e un timing plausibile. Il ciclo di vendita va da 30 giorni (soluzioni tattiche a PMI) a 18 mesi (enterprise complesse). Il CAC — costo di acquisizione cliente — è tipicamente 300-3.000 €. LTV alta compensa CAC alto. Modelli: outbound, inbound, RevOps.

**In B2C**, un lead è tipicamente qualcuno che ha compilato un form, avviato un carrello, iniziato un onboarding. Il ciclo è misurato in minuti-giorni, non mesi. Il CAC è 5-100 €. LTV variabile ma generalmente più bassa. Modelli: paid-led dominante, spesso con CRO e email marketing come leve secondarie.

Nel B2C moderno, la categoria «agenzia lead generation» come tale è quasi sparita — assorbita dal performance marketing e dalla CRO. Se un’agenzia si presenta come «lead gen per e-commerce», di solito è un’agenzia paid con un pitch adattato. Non è un male: è utile saperlo.

---

## Domande frequenti

**Quanto tempo prima di vedere i primi lead qualificati?**

Dipende dal modello. Paid-led: giorni (primi lead), settimane (qualità stabile). Outbound strutturato: 3-6 settimane (calibrazione delle prime sequenze), 2-3 mesi (flusso stabile). Inbound content-led: 4-6 mesi per il primo flusso significativo, 9-12 mesi per il regime. RevOps ibrido: 2-4 mesi di setup, poi risultati incrementali. Chi vi promette lead qualificati in una settimana su un modello inbound, non sta dicendo la verità.

**Meglio pagare a retainer o a lead consegnato?**

Nella maggior parte dei casi retainer, per un motivo semplice: il pagamento a lead consegnato incentiva l’agenzia a massimizzare il numero, non la qualità. Le eccezioni sono contratti con qualifica rigorosamente definita, verifica indipendente e volumi bassi (dieci-venti lead/mese, non centinaia). Chi propone «pagate solo per lead» senza definire con precisione cos’è un lead, sta vendendo un rischio che pagherete voi.

**Serve avere un CRM prima di ingaggiare un’agenzia lead gen?**

Sì, o almeno un sistema di gestione contatti anche semplice (HubSpot free, Pipedrive, Attio, o simile). Senza un posto dove i lead atterrano e vengono gestiti, l’agenzia consegna contatti che vanno persi. Alcune agenzie includono il setup CRM di base come primo intervento — è un buon segnale, indica che sanno cosa serve per far funzionare il resto.

**Chi si occupa del follow-up commerciale sui lead ricevuti?**

Nella maggior parte dei casi, il vostro team commerciale interno. L’agenzia genera e qualifica; voi chiudete. Alcune agenzie offrono servizi di appuntamento (booked meetings) o addirittura tentativo di chiusura — è un ambito diverso e va contrattualizzato a parte. In generale: se non avete un team commerciale interno, la lead generation da sola vi consegna contatti che non capitalizzate. Meglio costruire prima quel team, poi affiancarci un’agenzia.

**È vero che «tanto tutti comprano i database»?**

No. Le agenzie serie in Italia lavorano con dati pubblici (LinkedIn, siti aziendali, registri camerali), scraping conforme al GDPR, arricchimento con tool legittimi (Cognism, Apollo, Lusha), e outreach compliant. Non comprano liste. Chi vi dice «tanto è normale» sta legittimando una pratica che espone voi al rischio GDPR e la vostra reputazione a rischio brand. Non è normale, ed è un motivo per non firmare.
$t$,
          $t$https://miglioreagenzia.it/wp-content/uploads/2026/07/agenzia-lead-generation-cose.jpg$t$, $t$agenzia-lead-generation-cose$t$, 1200, 675,
          (select id from public.content_authors where domain_id = dominio and slug = $t$nicola-ferrari$t$),
          'publish', $t$2026-07-29 09:25:40$t$::timestamp at time zone 'Europe/Rome', 95)
  on conflict (domain_id, slug) do nothing;
  insert into public.article_category_links (article_id, category_id)
  select a.id, c.id from public.articles a join public.article_categories c on c.domain_id = a.domain_id
  where a.domain_id = dominio and a.slug = $t$agenzia-lead-generation-cose-come-si-sceglie$t$ and c.slug in ($t$google-ads$t$, $t$lead-generation$t$, $t$meta-ads$t$)
  on conflict do nothing;

  insert into public.articles (domain_id, slug, title, body_md, cover_url, cover_alt, cover_width, cover_height,
                               author_id, status, published_at, wp_id)
  values (dominio, $t$le-migliori-web-agency-a-milano$t$, $t$Le migliori web agency a Milano$t$, $t$Milano non è la capitale delle web agency italiane per una ragione geografica. Lo è perché nel raggio di dieci chilometri stanno le sedi di quasi tutti i brand di lusso italiani, tre gruppi editoriali major, la maggioranza delle scale-up fintech, i due terzi degli headquarter food industriali, e i buyer digitali di praticamente ogni azienda italiana che spende in digital sopra il milione di euro l’anno. Le web agency che contano si sono organizzate attorno a questa domanda, e si sono specializzate.

Il malinteso da smontare è che «web agency milanese» significhi qualcosa di omogeneo. Non è così. Una boutique di dodici persone che ha costruito la propria reputazione sul luxury ecommerce non è comparabile a uno studio da quaranta che lavora prevalentemente su portali corporate B2B, anche se entrambi si presentano come «web agency milanese». Sceglierne una senza aver capito prima cosa fa davvero è la ragione principale per cui i progetti finiscono male.

Questa selezione contiene dodici web agency che la redazione considera notevoli, seguite da un elenco di menzioni per le realtà che pur non entrando in top selection meritano di essere segnalate. La metodologia è dichiarata in apertura. Le agenzie non sono ordinate per «migliore» — non esiste una migliore in assoluto — ma raggruppate per profilo, così che potete trovare più in fretta quella che serve al vostro caso.

Nessuna delle agenzie in questa selezione ha pagato per essere consigliata. Nessuna posizione è acquistabile. [Spieghiamo come selezioniamo →](/metodologia/)

---

## Come abbiamo selezionato

La selezione è redazionale, non algoritmica. Sei criteri, applicati in serie, hanno determinato l’inclusione di ogni singola agenzia. Sono gli stessi che raccomandiamo a un’azienda che sta valutando una web agency e sono spiegati per esteso nella nostra guida di scelta.

**Specializzazione dichiarata.** Le agenzie inserite hanno un verticale o un mestiere che sanno raccontare con precisione. Chi ci ha detto «facciamo di tutto» è stato lasciato fuori: non per giudizio di merito, ma perché una guida ha senso solo se aiuta a scegliere, e per aiutare a scegliere serve dire chi fa cosa meglio.

**Metodologia trasparente.** Ogni agenzia in selezione ha, sul proprio sito o nel materiale pubblico, una descrizione strutturata del proprio processo di lavoro. Fasi, deliverable, tempi tipici. Non «audit, strategia, ottimizzazione, monitoraggio» in fila, ma un metodo raccontato.

**Casi con numeri e contesti.** Ogni agenzia in selezione ha almeno tre casi pubblici verificabili con dati e contesto. Non «abbiamo aumentato il traffico del 340%», ma «abbiamo portato il fatturato online di X da Y a Z in N mesi». Chi non ha voluto o potuto mostrare casi, non è entrato.

**Team stabile e senior.** Abbiamo verificato la continuità del team confrontando profili pubblici e presenza pluriennale delle figure senior. Le agenzie con turnover elevato o con team di soli junior sono state escluse dalla selezione.

**Reporting orientato al business.** Abbiamo chiesto di vedere un report tipo anonimizzato. Chi ci ha mostrato solo posizioni di parole chiave o metriche di canale senza collegamento a KPI di business è stato escluso.

**Contratto sensato.** Le agenzie inserite hanno modelli di contratto ragionevoli — durate flessibili, chiara ownership dei contenuti e degli account, condizioni di uscita non punitive. Chi vincola i clienti per 24 mesi con penali di uscita non è passato.

La selezione è stata rivista da due persone della redazione in modo indipendente, e le divergenze sono state discusse. Non tutte le agenzie che compaiono qui avrebbero superato tutti i sei criteri con lode: alcune sono state incluse per la forza eccezionale su un verticale, anche se il reporting è appena sufficiente. Ogni scelta ha una motivazione nella scheda dell’agenzia.

---

## Le dodici agenzie in selezione

*Le agenzie sono raggruppate per profilo dominante, non ordinate per merito. Ogni scheda contiene una descrizione di 100-130 parole con specializzazione, casi tipici, dimensione team dichiarata, e la ragione specifica per cui la redazione l’ha selezionata.*

### 01 · [Square Marketing](https://squaremarketing.it/)

### 02 · NOOO Agency

### 03 · LU3G

### 04 · Kifadesign

### 05 · Obliquo Design

### 06 · The Rope

### 07 · Pomo

### 08 · Gusto IDS

### 09 · Bitmama

### 10 · Attila & CO

### 11 · Caffeina

### 12 · Figmenta

---

## I cinque verticali dove Milano è più forte

Il tessuto milanese delle web agency non è distribuito uniformemente. Si è cristallizzato attorno a cinque verticali in cui la piazza ha vantaggio strutturale — vantaggio che deriva dalla concentrazione dei buyer, non dalla creatività di per sé. Chi cerca un’agenzia dovrebbe capire in quale di questi cinque cade e scegliere di conseguenza.

**Fashion e luxury.** È il verticale più maturo. A Milano hanno sede la maggior parte dei brand di lusso italiani (Prada, Armani, Ferragamo, Moncler, Dolce&Gabbana, Bottega Veneta, e le filiali italiane di Louis Vuitton e Gucci). Le web agency milanesi che lavorano su fashion hanno accumulato un patrimonio di competenza specifico: gestione multi-lingua e multi-country, integrazione con ecosistemi ecommerce come Farfetch e Yoox, standard estetici e produttivi che altrove sono rari. Se il vostro business è nel lusso o nel fashion mid-to-high, una boutique milanese specializzata dà vantaggio rispetto a un’agenzia generalista di eguale bravura.

**Food industriale e beverage.** Barilla, Ferrero, Lavazza, Illy, Campari, Bauli, Galbani, Granarolo — la maggior parte dei grandi gruppi food italiani ha marketing HQ o direzione digital a Milano. Le web agency che presidiano questo verticale gestiscono siti corporate multi-brand, portali B2B per la GDO, ecommerce direct-to-consumer emergenti. È un lavoro tecnicamente meno spettacolare del fashion ma con budget stabili e progetti pluriennali.

**Fintech e scale-up.** Milano è il polo italiano del fintech (Satispay, Nexi, Scalapay, BuildUp) e delle scale-up finanziate (dal 2020 in poi). Le web agency che lavorano su questo segmento hanno sviluppato una competenza specifica su dashboard prodotto, onboarding utenti, integrazione con SDK e API. È il verticale dove la linea tra web agency e product studio è più sottile: chi si vende come «web agency» ma disegna prodotti digitali è, di fatto, uno studio design-prodotto travestito.

**Editoria ed entertainment.** RCS, Mondadori, Cairo Editore, Feltrinelli, Warner Music Italy, Universal Music Italy. Verticale meno visibile ma stabile, con progetti pluriennali di manutenzione e sviluppo di piattaforme editoriali complesse (paywall, abbonamenti, gestione autori, integrazione con archivi). Le web agency che ci lavorano hanno un profilo tecnico spesso più profondo di quelle che presidiano il fashion, meno pop.

**Corporate B2B e servizi professionali.** Le sedi milanesi di banche, assicurazioni, big four del consulting, studi legali internazionali. È il verticale dove i budget sono più alti e la creatività più contenuta: siti multi-lingua di grande peso reputazionale, portali di knowledge management, gestione di stakeholder complessi. Le web agency più solide su questo verticale spesso hanno origine dal mondo consulting o dal branding, non dal web design puro.

Un’agenzia forte su fashion di solito non è quella giusta per un fintech, e viceversa. È il primo filtro da fare prima di guardare portfolio o preventivi.

---

## Come scegliere fra queste dodici

Anche selezionate in modo restrittivo, dodici agenzie sono ancora troppe per scegliere a occhio. Quattro domande, poste in questo ordine, restringono in fretta.

**In quale dei cinque verticali sopra ricade il vostro progetto?** È il primo taglio. Se il vostro business è fashion e-commerce, le due agenzie specializzate su corporate B2B non sono per voi. Se siete un fintech, le boutique luxury non lo sono. La specializzazione, applicata prima, evita mezze giornate perse in call che finiscono ovunque.

**Serve un partner strategico o un fornitore di esecuzione?** Alcune agenzie in selezione fanno consulenza strategica a monte del progetto tecnico. Altre eseguono benissimo ma non fanno strategia. Se avete un CMO strutturato e serve execution, la seconda categoria costa meno e non è inferiore. Se non l’avete, la prima è indispensabile.

**Che dimensione ha il vostro progetto?** Un rifacimento di sito da 15.000 € non è per una boutique da 25 persone. Un ecommerce enterprise multi-mercato non è per uno studio da 8. Le fasce di prezzo dichiarate nelle schede di ciascuna agenzia (`€`, `€€`, `€€€`, `€€€€`) danno un primo orientamento. Le fasce sono confrontabili sul nostro sito.

**In quanto tempo dovete partire?** Le agenzie migliori sono in genere piene. Se il progetto parte entro tre mesi, le opzioni sono minori — e va sempre chiesto tempo di disponibilità reale prima di innamorarsi di una proposta. Un’agenzia che si può liberare in due settimane per un progetto grande, spesso, è un’agenzia che ha problemi.

Fatte le quattro domande, di solito rimangono tre o quattro nomi. È il numero giusto per un giro di pitch serio.

---

## Domande frequenti

**Serve avere ufficio a Milano per una web agency di Milano?**

No. Nel 2026 la maggior parte del lavoro si svolge in remoto anche quando entrambe le parti sono milanesi. Alcune agenzie in selezione lavorano prevalentemente in ibrido o in full-remote. Se una relazione richiede molte riunioni in presenza, cosa che dovreste comunque valutare criticamente, la vicinanza fisica aiuta. Ma non è un criterio di qualità: è una comodità.

**Le agenzie milanesi sono davvero più care?**

In media sì, del 15-30% rispetto ad agenzie equivalenti di altre città italiane. Il motivo è strutturale: costo del lavoro senior a Milano più alto, affitti maggiori, prossimità ai buyer enterprise che alimenta il pricing. Se il vostro business trae valore da questa prossimità (clienti enterprise italiani, network di settore, brand di categoria), il sovrapprezzo si giustifica. Se non ne trae, potete scegliere agenzie non milanesi di eguale competenza e risparmiare. Approfondiamo la logica delle fasce di prezzo nell’articolo [Quanto costa un’agenzia SEO in Italia](/quanto-costa-unagenzia-seo-in-italia/), i principi valgono con adattamenti per il web design.

**Milano o Roma per un ecommerce nazionale?**

Dipende dal verticale. Fashion, luxury, beauty, food industriale, fintech: Milano ha vantaggio strutturale. Editoria, media, cinema, entertainment, PA, sanità pubblica, turismo: Roma ha una specializzazione più profonda su questi settori. Per verticali «neutri» (mobili, giardinaggio, elettrodomestici, sport generico) la geografia conta poco e il criterio torna a essere la specializzazione dell’agenzia, non la sua sede.
$t$,
          $t$https://miglioreagenzia.it/wp-content/uploads/2026/07/le-migliori-agenzie-di-web-design.jpg$t$, $t$le migliori agenzie di web design a milano$t$, 1200, 675,
          (select id from public.content_authors where domain_id = dominio and slug = $t$nicola-ferrari$t$),
          'publish', $t$2026-07-29 09:25:40$t$::timestamp at time zone 'Europe/Rome', 90)
  on conflict (domain_id, slug) do nothing;
  insert into public.article_category_links (article_id, category_id)
  select a.id, c.id from public.articles a join public.article_categories c on c.domain_id = a.domain_id
  where a.domain_id = dominio and a.slug = $t$le-migliori-web-agency-a-milano$t$ and c.slug in ($t$web-design$t$)
  on conflict do nothing;

  insert into public.articles (domain_id, slug, title, body_md, cover_url, cover_alt, cover_width, cover_height,
                               author_id, status, published_at, wp_id)
  values (dominio, $t$quanto-costa-unagenzia-seo-in-italia$t$, $t$Quanto costa un'agenzia SEO in Italia$t$, $t$Un preventivo SEO senza domande sul vostro sito è un menù, non un progetto. «Quanto costa un’agenzia SEO» ha risposte solo dopo che qualcuno vi ha guardato in faccia, ha aperto il vostro Search Console e ha capito cosa vendete. Prima di allora, chi vi dà un numero preciso vi sta dando un numero sbagliato — troppo alto o troppo basso, raramente giusto.

Questa guida spiega perché la domanda è mal posta, quali sono i tre modelli di pricing in circolazione, quali fasce di prezzo hanno senso in Italia nel 2026, cosa cambia da Milano al resto del Paese, come leggere un preventivo SEO senza farsi imbrogliare, quali tre segnali dicono che qualcosa non torna a prescindere dal numero finale.

Nessuna delle agenzie che linkeremo da questa guida ha pagato per essere consigliata. Nessuna posizione in classifica è acquistabile. [Spieghiamo come selezioniamo →](/metodologia/)

---

## La domanda mal posta

«Quanto costa un’agenzia SEO?» è come chiedere «quanto costa una macchina?». Prima di rispondere con un numero, uno dei due sta trattando male l’altro. Vi serve un’utilitaria o un furgone commerciale? Nuovo o usato? Elettrico o termico? Vi basta per andare al lavoro o serve per una flotta aziendale?

La SEO ha la stessa varianza. Un piccolo studio dentistico che vuole essere trovato a Pavia paga probabilmente 800–1.200 €/mese e riceve un lavoro serio se l’agenzia è specializzata in SEO locale. Un ecommerce fashion italiano da 25 milioni di fatturato può spendere 12.000 €/mese in un contratto che include produzione contenuti, digital PR, migrazioni tecniche e conversion optimization, ed essere ancora sotto-strutturato per il proprio potenziale.

Sono due business che chiamano lo stesso servizio «SEO» ma stanno comprando cose completamente diverse. Il primo compra tre-quattro ore alla settimana di attenzione competente su un dominio semantico piccolo. Il secondo compra 60-80 ore settimanali di lavoro cross-funzionale su un dominio semantico enorme.

Il prezzo, da solo, non vi dice se pagate poco o troppo. Vi dice solo quante ore di lavoro state comprando, di che seniority, con quale specializzazione. Il resto — se è tanto o poco per il vostro caso — dipende dal vostro caso.

---

## I tre modelli di pricing e cosa comprano davvero

Il mercato italiano usa tre modelli di pricing per la SEO. Non sono equivalenti: comprano cose diverse e hanno rischi diversi.

### 1\. Retainer mensile

È il modello dominante e nella maggioranza dei casi è quello corretto. Pagate un fee fisso mensile in cambio di un pacchetto di ore o di deliverable. Le versioni serie del retainer sono trasparenti su cosa include: X ore di consulenza senior, Y revisioni on-page al mese, Z briefing contenuti, un audit tecnico ogni sei mesi, reporting mensile con dashboard.

Il retainer funziona perché la SEO è lavoro continuativo di manutenzione + iterazione, non intervento una tantum. I ranking arrivano nel tempo, il traffico cambia con gli aggiornamenti degli algoritmi, i concorrenti si muovono, le pagine invecchiano. Serve qualcuno che tenga d’occhio l’insieme mese dopo mese.

Un contratto tipo dura sei-dodici mesi con rinnovo tacito e preavviso di disdetta di 30-60 giorni. Attenzione ai retainer «all-inclusive» che non dettagliano cosa è dentro. Il rischio è pagare per un pacchetto che si adatta ai bisogni dell’agenzia, non ai vostri. Le formule sane dichiarano cosa è incluso e cosa è a consumo separato.

### 2\. A progetto (una tantum)

Certi lavori SEO sono progetti conclusi con un inizio e una fine: un audit tecnico approfondito, una migrazione di dominio o piattaforma, la riscrittura strutturale di un cluster tematico, una consulenza strategica per una nuova sezione di sito.

Fasce indicative italiane 2026:

-   **Audit tecnico approfondito**: 3.000–15.000 €, in base a dimensione sito e profondità richiesta.
-   **Migrazione SEO-safe** (cambio dominio, CMS, riorganizzazione URL): 8.000–40.000 €, in base alla complessità.
-   **Consulenza strategica** (roadmap 12 mesi + affiancamento): 5.000–25.000 €.
-   **Riscrittura architetturale** di un cluster tematico: 4.000–20.000 €.

I progetti a corpo hanno il vantaggio della chiarezza contrattuale — sapete cosa comprate — e lo svantaggio di non generare manutenzione. Dopo un audit, restate soli con il documento in mano e la lista di cose da fare. Ha senso combinare progetti + retainer light, non sostituire il retainer con soli progetti.

### 3\. Performance-based

Il modello «pago solo se salgo». In teoria è il più equo. In pratica, quando applicato in senso stretto («€X per ogni posizione in top 10 sulla mia parola chiave»), quasi sempre è un cattivo affare per entrambi.

Il problema è che l’agenzia performance-based ha incentivo a lavorare sulle parole chiave facili — dove il ranking arriva comunque, con o senza di lei — e a trascurare quelle strategiche, dove il ranking richiede investimento serio. L’azienda ottiene un miglior report ma non un miglior business.

Esiste una variante sensata: revenue share sui ricavi organici incrementali, misurati con baseline pulita e attribuzione affidabile. Ma richiede aziende con analytics maturo e agenzie molto sicure del proprio lavoro. Nella pratica italiana 2026 è raro: la maggior parte dei «performance-based SEO» in circolazione sono retainer camuffati che sembrano performance-based nel pitch commerciale.

Regola pratica: se un’agenzia vi propone come *unico* modello un performance-based aggressivo, o siete un caso enterprise particolare — con dati e maturità per farlo funzionare — oppure, molto più spesso, vi stanno vendendo una scommessa in cui perdete anche quando vincete.

---

## Le fasce indicative italiane nel 2026

I numeri che seguono sono ordini di grandezza per progetti seri con team senior sul vostro account. Sotto queste soglie, il rapporto tra ore comprate e ore di senior effettivamente lavorate si rompe. Sopra, potreste pagare per volumi o brand che non vi servono. Sono fasce di orientamento, non tariffari: ogni progetto ha specificità.

### 800–1.500 €/mese — Micro-progetti locali

Attività con presenza fisica in una singola città, catalogo prodotti o servizi limitato, obiettivi legati alla SEO locale (Google Business Profile, recensioni, poche categorie territoriali). In questa fascia comprate 4-8 ore/mese di lavoro competente, spesso di un consulente freelance senior o di una boutique piccola specializzata.

È abbastanza per uno studio professionale (dentista, avvocato, commercialista, veterinario), un ristorante o attività ricettiva, un negozio locale con vendita mista fisica-online. Non è abbastanza per un ecommerce reale o un B2B strutturato.

### 1.500–3.500 €/mese — PMI con progetto snello

È la fascia sana per PMI B2B, servizi professionali evoluti (studi con più sedi, boutique consulting), ecommerce piccoli (sotto 500.000 € di fatturato online), editoria minore. Il retainer include tipicamente 15-30 ore mensili di consulenza senior, produzione contenuti moderata (uno-due articoli/mese o equivalente), reporting con dashboard.

Se vi viene proposta questa fascia da un’agenzia senza esperienza dimostrabile del vostro verticale, chiedete un contratto più corto (tre-sei mesi rinnovabile) prima del vincolo lungo. Se invece pagate meno di 1.500 €/mese e non siete un micro-progetto locale, state comprando poche ore di attenzione: non aspettatevi trasformazioni.

### 3.500–7.000 €/mese — Ecommerce mid-market e B2B strutturato

Fascia per ecommerce con fatturato online 1-10 milioni, B2B con lead pipeline significativa, editoria strutturata, siti multi-lingua PMI. Il retainer copre tipicamente 40-70 ore mensili di team senior, produzione contenuti stabile (quattro-otto pezzi/mese), digital PR, reporting su KPI di business e non solo di canale.

È la fascia dove il gap tra un’agenzia decente e una eccellente inizia a essere visibile: la differenza tra un retainer da 4.000 €/mese standard e uno da 6.500 €/mese boutique può valere molto in termini di ritorno reale. Ma solo se il progetto ha le dimensioni per digerirla — su un ecommerce da 800.000 € di fatturato online, il 6.500 €/mese è sovra-strutturato.

### 7.000–15.000 €/mese — Enterprise italiano

Ecommerce con fatturato online 10-50 milioni, B2B enterprise, editoria major, aziende multi-brand o multi-country. Include team dedicato (due-tre profili part-time o un profilo full-time equivalente), produzione contenuti significativa, digital PR strutturata, conversion optimization integrata, integrazione con team marketing interno.

Sotto 7.000 €/mese in enterprise, spesso si sotto-investe: i risultati arrivano a metà di quello che il canale potrebbe dare, e l’agenzia — pagata sotto il proprio costo strutturale — riduce silenziosamente il tempo dedicato.

### 15.000+ €/mese — Enterprise complessi

Multi-mercato, multi-brand, siti con centinaia di migliaia di pagine, competizione internazionale su verticali difficili (assicurazioni, viaggi, retail globale). Team dedicato con tre-cinque profili, integrazione con marketing e product interno, spesso un SEO director interno che coordina l’agenzia. Fasce senza tetto naturale: 40.000–80.000 €/mese non sono cifre insolite per il segmento alto.

---

## Cosa fa cambiare il prezzo, a parità di scope apparente

Due preventivi per lo «stesso lavoro» possono differire del 100% e essere entrambi ragionevoli. Cinque fattori spiegano quasi tutta la varianza.

**Dimensione e complessità del sito.** Un sito da 200 pagine ha un audit più veloce di uno da 20.000. La produzione contenuti su un catalogo ampio richiede una macchina editoriale, non un copywriter. La gestione tecnica di un ecommerce multi-lingua è un altro mestiere rispetto a quella di un sito vetrina. La differenza si vede nel preventivo.

**Competizione del verticale.** La SEO su «assicurazioni auto» costa di più della SEO su «pilates per anziani a Cuneo»: nella prima competete con brand miliardari che investono in SEO cifre a sei zeri, nella seconda con tre concorrenti locali che non hanno mai fatto un audit. L’agenzia deve investire più ore per ottenere lo stesso risultato relativo, e lo fa costare.

**Situazione di partenza.** Un sito sano con storico organico pulito costa meno da lavorare di uno con penalità pregresse, cannibalizzazioni, contenuti duplicati accumulati in dieci anni. La bonifica è lavoro invisibile ma necessario. Un’agenzia seria mette in preventivo la bonifica come voce separata, e i primi mesi del lavoro sono più costosi degli anni successivi.

**Ambizione degli obiettivi.** Mantenere posizioni acquisite ha un costo. Farvi crescere del 30% ne ha un altro. Far uscire il vostro ecommerce dal ristagno di 24 mesi ne ha un altro ancora. La stessa agenzia con la stessa competenza può proporvi tre pacchetti diversi a seconda di cosa promettete di ottenere. Un’agenzia che vi propone lo stesso retainer per tutti e tre gli scenari non ha capito la vostra situazione.

**Cosa è incluso, cosa no.** Un retainer che include produzione contenuti costa più di uno che non la include. Un retainer che include digital PR e link earning costa più di uno che si ferma all’ottimizzazione on-page. Chi paragona i totali senza scomporre gli scope prende decisioni sbagliate. Il primo lavoro serio è normalizzare le proposte su unità comparabili — di solito, ore di senior effettivamente lavorate e deliverable specifici.

---

## Milano non è cara per snobismo

Le tariffe SEO delle agenzie milanesi sono in media del 15-30% più alte di quelle equivalenti fuori Milano. Non è per il codice postale: è la struttura di costo.

Uno SEO senior a Milano costa all’agenzia 55.000-75.000 €/anno di RAL, con oneri circa dell’80% aggiuntivi. Lo stesso profilo in Bari, Catania, Perugia o Ancona costa 35.000-50.000 €. Uno spazio ufficio nel centro milanese costa tre-cinque volte quello di una città media italiana. Sommato, un’agenzia milanese ha una struttura di costo che deve caricare sul tariffario.

Non significa che la SEO milanese sia migliore. Significa che se scegliete Milano, pagate anche per l’accesso al mercato milanese: rete di contatti, eventi, brand, prossimità ai clienti enterprise italiani. Se il vostro business non ha bisogno di quel network, potete scegliere agenzie fuori Milano di eguale competenza a costo minore. Il criterio, come sempre, non è la geografia — è la specializzazione e la corrispondenza con il vostro caso.

Nel 2026, il 90% del lavoro SEO si può fare bene da qualsiasi città italiana. La visita in presenza è raramente necessaria e quasi mai risolutiva. Una boutique di Padova che ha lavorato per tre anni su ecommerce fashion può essere una scelta migliore, per un ecommerce fashion, di una grande agenzia milanese generalista. E costare 2.000 €/mese in meno.

---

## Come leggere un preventivo SEO

Un preventivo SEO fatto bene è un contratto in miniatura: dice cosa ricevete, in quanto tempo, chi ci lavora, come è misurato il risultato. Un preventivo fatto male è una lettera commerciale che dice quanto pagate. Cinque cose devono esserci.

**La scomposizione delle ore per attività.** Un preventivo che dice «3.000 €/mese per attività SEO» senza dettagliare cosa ci si fa dentro è opaco per definizione. Voci come «audit tecnico iniziale: 20 ore», «revisioni on-page mensili: 12 ore», «briefing contenuti: 8 ore», «reporting e call: 4 ore» vi dicono cosa comprate davvero.

**Il team assegnato al progetto.** Chi è il referente principale, chi lavora sotto di lui, quanti anni di esperienza ognuno, quanto tempo effettivo dedica al vostro account. Un’agenzia che vende con un partner e consegna con un junior non è illegale, ma dovreste saperlo prima di firmare, non al terzo mese di lavoro.

**I deliverable specifici.** Non «attività continuativa di ottimizzazione». Meglio: «audit tecnico entro il mese 1», «content plan trimestrale approvato da voi», «report mensile con dashboard», «due call di aggiornamento al mese», «una revisione strategica ogni sei mesi». I deliverable sono le cose che potete vedere e discutere; senza deliverable, non c’è materia contrattuale.

**Previsione di risultato, con verbi cauti.** Non «vi garantiamo la prima pagina». Meglio: «sulla base della vostra baseline attuale e del benchmark competitivo, stimiamo un incremento del traffico organico del 40-70% in 12 mesi». Il verbo è stimare, non promettere. Il range esiste. Le assunzioni sono dichiarate.

**Cosa NON è incluso.** Il blocco più utile e più raro. Voci come «la produzione contenuti oltre due articoli/mese è a consumo separato», «gli aggiornamenti tecnici che richiedono il vostro developer sono a carico vostro», «gli strumenti terzi (Semrush, Ahrefs) sono a carico dell’agenzia» — o del cliente, dipende dall’accordo — vi risparmiano brutte sorprese in corso d’opera.

Se un preventivo non ha almeno tre di questi cinque punti, non è un preventivo: è un menù di listino. Rifiutatelo o chiedete di riformularlo prima di valutarlo insieme agli altri.

---

## Tre segnali che il prezzo non torna

### 1\. Troppo basso per essere vero

Un retainer sotto 600 €/mese comprato da un’azienda che non è un micro-progetto locale sta comprando tempo di stagista, non di senior. Non è una critica agli stagisti: la SEO fatta bene richiede giudizio, e il giudizio matura con l’esperienza sul campo.

Un retainer sotto 800 €/mese su un ecommerce reale è o un errore commerciale dell’agenzia — che rimedierà tagliando silenziosamente il tempo dedicato dopo i primi mesi — o un’operazione predatoria che vi porterà via alla concorrenza dopo sei mesi di risultati inconsistenti. In entrambi i casi, sotto una certa soglia il rapporto tra prezzo e tempo di senior è aritmeticamente impossibile.

### 2\. Prezzo alto senza scope corrispondente

L’inverso è meno evidente ma più costoso. Un preventivo da 6.000 €/mese che, letto nel dettaglio, prevede 25 ore mensili di lavoro con un solo referente mid, sta caricando un margine sproporzionato — probabilmente per pagare struttura, sede prestigiosa, commerciale, ma non team operativo.

La domanda utile: quante ore effettive di team senior comprate e a che costo/ora effettivo? Se la risposta è 150-200 €/ora effettivi, siete in linea con il mercato italiano. Se è 350+ €/ora e non state comprando qualcosa di eccezionale (un nome di grande esperienza personale, una boutique con clienti trofeo, un servizio nicchia molto rara), state pagando la struttura senza riceverne servizio proporzionale.

### 3\. Il «tutto incluso» senza breakdown

«4.500 €/mese, tutto quello che serve». È il segnale più ambiguo: sembra generoso, in realtà nasconde. Cosa succede se un mese avete bisogno di sei articoli invece di tre? Cosa succede se serve una migrazione di CMS? Cosa succede se cambia il vostro obiettivo commerciale? Senza breakdown, l’agenzia decide unilateralmente cosa consegnare in base alla propria disponibilità, non ai vostri bisogni.

Il «tutto incluso» finisce quasi sempre per essere «quello che ci sta bene includere questo mese». Nei mesi in cui l’agenzia è sotto pressione con altri clienti, ricevete meno. Nei mesi in cui è tranquilla, ricevete di più. In nessuno dei due casi decidete voi. Un contratto che definisce esplicitamente scope e volumi vi dà uno strumento di controllo che il «tutto incluso» rimuove.

---

## Domande frequenti

**Qual è la durata minima di un contratto SEO?**

Sei mesi è la durata minima sensata. Sotto, non c’è tempo per vedere segnali di andamento — le prime posizioni si muovono nei mesi tre-sei, il traffico misurabile arriva a sei-nove. Sopra i 24 mesi con vincolo rigido è una richiesta punitiva difficile da giustificare. La configurazione sana: sei-dodici mesi con rinnovo tacito e preavviso di disdetta di 30-60 giorni, senza penali di uscita se non anticipando un mese.

**Meglio pagare a retainer mensile o a progetto?**

Nella grande maggioranza dei casi, retainer per il lavoro continuativo + progetti separati per interventi mirati (audit approfondito, migrazione, nuova sezione di sito). Il progetto puro senza retainer di manutenzione va bene solo per aziende con SEO interna che integra il lavoro dell’agenzia. Se non avete SEO interna, il retainer è il modello che serve.

**Un audit iniziale gratuito è un buon segnale?**

Un audit iniziale «gratuito» è quasi sempre una due-diligence commerciale mascherata da regalo: l’agenzia investe qualche ora per capire se le convenga vendervi, e per costruire il pitch. Non è un male: è una pratica normale. Ma non confondetela con un audit tecnico vero, che richiede 20-60 ore di lavoro strutturato e ha un valore di 3.000-10.000 €. Se un’agenzia vi promette un «audit approfondito e completamente gratuito» in cambio di poco più di una call, o l’audit è superficiale, oppure quelle ore le state pagando nel retainer successivo.

**Posso pagare a percentuale sui risultati?**

Nella maggior parte dei casi no, per i motivi spiegati sopra sul performance-based. Le eccezioni sono aziende con analytics maturo, baseline stabile e agenzie che accettano di condividere revenue effettivo — non traffico, non posizioni. I modelli seri di questo tipo prevedono un retainer di base ridotto + success fee su revenue organico incrementale, attribuito con logica trasparente e verificabile da entrambe le parti. Se non avete i dati per costruire questa attribuzione, il performance-based non è per voi, e va bene così.

**Ci sono costi nascosti da aspettarsi?**

Tipicamente cinque, ed è utile chiederne conto in fase di preventivo. Strumenti terzi (Semrush o Ahrefs, 200-500 €/mese; alcune agenzie li caricano al cliente, altre li includono). Produzione contenuti oltre soglia mensile inclusa. Digital PR e link earning se non inclusi nel retainer. Sviluppi tecnici richiesti al vostro developer (non li paga l’agenzia). Analytics setup avanzato oltre la configurazione base. Un preventivo trasparente li elenca; un preventivo opaco li fa emergere in corso d’opera, con richieste di integrazione economica.
$t$,
          $t$https://miglioreagenzia.it/wp-content/uploads/2026/07/quanto-costa-un-agenzia-seo.jpg$t$, $t$quanto costa un agenzia seo$t$, 1200, 675,
          (select id from public.content_authors where domain_id = dominio and slug = $t$nicola-ferrari$t$),
          'publish', $t$2026-07-29 09:25:40$t$::timestamp at time zone 'Europe/Rome', 87)
  on conflict (domain_id, slug) do nothing;
  insert into public.article_category_links (article_id, category_id)
  select a.id, c.id from public.articles a join public.article_categories c on c.domain_id = a.domain_id
  where a.domain_id = dominio and a.slug = $t$quanto-costa-unagenzia-seo-in-italia$t$ and c.slug in ($t$seo$t$)
  on conflict do nothing;

  insert into public.articles (domain_id, slug, title, body_md, cover_url, cover_alt, cover_width, cover_height,
                               author_id, status, published_at, wp_id)
  values (dominio, $t$come-scegliere-unagenzia-seo-in-italia$t$, $t$Come scegliere un'agenzia SEO in Italia$t$, $t$<div class="lead">

Un’agenzia SEO seria non promette la prima pagina. Ti dice cosa può fare, in quanto tempo, con quale metodologia — e ti mostra dei casi in cui l’ha già fatta. Il resto sono commerciali che hanno letto due articoli sul blog di Google.

Questa guida spiega cosa cerca oggi un’azienda quando cerca una SEO — che nel 2026 è diventata una disciplina strategica trasversale al marketing, non un servizio verticale — quali sei criteri usare per riconoscere un’agenzia seria, quali cinque segnali dovrebbero farvi riattaccare il telefono, come strutturare un brief onesto in una pagina, come mettere in fila tre preventivi senza uscirne più confusi di prima.

</div>

<p class="disclosure">Nessuna delle agenzie che linkeremo da questa guida ha pagato per essere consigliata. Nessuna posizione in classifica è acquistabile. <a href="/metodologia/">Spieghiamo come selezioniamo →</a></p>

## Cosa fa davvero un’agenzia SEO nel 2026

Nel 2016, “fare SEO” voleva dire tre cose: ottimizzare tag title, costruire link, scrivere contenuti keyword-per-keyword. Nel 2026 la disciplina si è aperta a ventaglio. Un’agenzia SEO decente oggi fa almeno cinque mestieri diversi, contemporaneamente.

Il primo è la **content strategy**. Non “produrre articoli”, ma decidere quali cluster tematici presidiare, come strutturarli in modo che Google — e i motori generativi — leggano il sito come un’autorità su un dominio semantico, e come collegare tutto internamente. Chi fa SEO seria oggi parte da un modello semantico del business, non da un elenco di parole chiave.

Il secondo è la **SEO tecnica**. Core Web Vitals, rendering lato client, dati strutturati, indexability, crawl budget su siti grossi, migrazioni senza perdita di traffico. È la parte più opaca e la più insidiosa. Un sito lento o mal renderizzato può azzoppare tutto il lavoro editoriale a monte.

Il terzo è l’**ottimizzazione on-page**. È dove vive il vecchio mestiere: tag, headings, entità, formattazione, autorità dichiarata (E-E-A-T). Ma con una torsione: nel 2026 non si scrive più per la parola chiave, si scrive per il topic e per l’intento. Le pagine devono coprire l’argomento, non ripetere il termine.

Il quarto è il **link earning** — quello che una volta si chiamava link building, con una differenza importante: si guadagnano, non si comprano. Digital PR, contenuti che vengono citati, collaborazioni con testate. L’acquisto di link resta pratica diffusa e resta rischiosa. Un’agenzia che vi vende un “pacchetto link” vi sta vendendo un problema futuro.

Il quinto è il **GEO** — Generative Engine Optimization — la parte nuova. Come essere citati dentro le risposte di ChatGPT, Perplexity, Claude, Google AI Overview. È la trasformazione più profonda degli ultimi tre anni ed è ancora un mestiere in via di definizione. Un’agenzia che nel 2026 non ne parla ha smesso di aggiornarsi.

A questo si aggiunge, quando serve, la **SEO locale** per attività con presenza fisica, la **SEO internazionale** per aziende export, e l’**analisi delle conversioni** — perché portare traffico che non converte è una vittoria di Pirro che si paga cara al secondo audit.

Un’agenzia che vi propone tutto insieme senza aver visto il sito e senza aver chiesto niente sta vendendo un modello standard. Un’agenzia che dopo il primo colloquio sa già dirvi dove concentrarsi e cosa lasciar perdere, ha un metodo.

## Sei criteri per riconoscere un’agenzia SEO seria

Non ci sono garanzie e non ci sono formule. Ci sono però sei domande che, poste in serie a tre agenzie candidate, restituiscono un ordinamento affidabile.

### 1\. Specializzazione dichiarata

Un’agenzia che fa “SEO” in generale, per qualsiasi settore, non fa niente di specifico. Un’agenzia che vi dice “lavoriamo prevalentemente su ecommerce Shopify nel fashion” o “siamo forti sul travel B2C” o “il nostro terreno è la SEO enterprise multi-sito” vi sta dicendo dove ha imparato, dove ha vinto, dove ha sbagliato.

La specializzazione può essere per verticale (ecommerce, editoria, real estate, SaaS, sanità, turismo) o per servizio (SEO tecnica, migrazioni, contenuti, local). Le agenzie generaliste esistono e alcune sono ottime, ma andranno valutate su altri criteri. Se potete scegliere una specializzata sul vostro caso, è quasi sempre la scelta più sana.

### 2\. Metodologia trasparente

Chiedete come lavorano. Se vi rispondono con parole in fila (“audit, strategia, ottimizzazione, monitoraggio”) vi stanno leggendo un menù. Se vi mostrano un processo — con fasi, deliverable, tempistiche, decisioni — hanno un metodo.

Le domande utili: come parte un progetto tipo? Quali strumenti usate? Chi lavora sul mio account? Come decidete le priorità? Quando cambiate strategia? Una risposta strutturata non deve essere lunga: deve essere netta.

### 3\. Casi con numeri (e con contesti)

I casi studio senza numeri non sono casi studio. Ma i numeri senza contesto sono peggio.

“Abbiamo aumentato il traffico organico del 340%” può significare tutto o niente: da 100 visite a 440, da un blog nuovo a un sito indicizzato. “Abbiamo portato un ecommerce fashion da 45k a 180k sessioni organiche mensili in 14 mesi, con un revenue attribuibile organico passato da €80k a €410k/mese, mantenendo AOV stabile” è un caso.

Chiedete almeno tre casi nel vostro verticale, o in verticali affini. Se non li hanno, forse non siete il progetto giusto per loro — e non è detto sia un male: è una selezione a monte.

### 4\. Team stabile e senior sul progetto

Chiedete chi lavora sul vostro account. Chi è il referente, quanti anni di esperienza ha, chi lavora sotto di lui, come funziona la comunicazione. Alcune agenzie vendono con i senior e consegnano con gli junior — non è illegale, ma dovreste saperlo prima.

Un altro segnale utile: il turnover. Un’agenzia in cui i profili LinkedIn del team cambiano ogni sei mesi non è un’agenzia stabile. La SEO ha bisogno di continuità: chi conosce la storia del vostro sito fa scelte migliori di chi la impara ogni trimestre.

### 5\. Reporting orientato al business

Un report che elenca posizioni di parole chiave è un report vecchio. Un report che collega posizioni, traffico, conversioni e fatturato è un report utile.

Chiedete di vedere un report tipo — anonimizzato va benissimo. Deve rispondere a tre domande: *cosa è successo?* (dati), *perché è successo?* (analisi), *cosa facciamo di conseguenza?* (decisioni). Se un report non risponde alla terza, è un elenco, non uno strumento di lavoro.

Frequenza sana: mensile per progetti in corso, con un check trimestrale più profondo. Settimanale è un segnale di ansia gestionale, non di rigore.

### 6\. Contratto onesto

Il contratto racconta la fiducia dell’agenzia in sé stessa. Sei mesi di vincolo? Nella norma. Ventiquattro mesi con penali di uscita? Un problema.

Verificate quattro punti prima di firmare: durata minima e regole di uscita, chi possiede i contenuti prodotti (dovreste essere voi), chi possiede gli account degli strumenti (dovreste essere voi, non l’agenzia), condizioni di trasferimento a fine rapporto. Un’agenzia che vi tiene in ostaggio i dati Search Console non ha capito il suo mestiere.

## Cinque segnali d’allarme

Sei criteri per riconoscere quelle buone. Cinque per riconoscere quelle da evitare.

### 1\. La garanzia di posizionamento

“Vi garantiamo la prima pagina su \[vostra parola chiave\] in 90 giorni.” È il segnale più chiaro. Nessuna agenzia SEO seria promette posizioni, perché nessuna può garantirle: le SERP sono un sistema con centinaia di variabili fuori dal controllo dell’agenzia, incluso quello che fanno i vostri concorrenti. Chi promette sta vendendo aria — oppure sta pianificando pratiche rischiose (link comprati, contenuti generati in massa, manipolazioni tecniche) che nel breve possono funzionare e nel medio buttano giù il sito.

Un’agenzia seria vi dice: possiamo probabilmente, sulla base dei dati che vediamo, ottenere questi risultati in questo intervallo. Il verbo è “probabilmente”, non “certamente”.

### 2\. Il prezzo sospettosamente basso

La SEO fatta bene richiede tempo di persone competenti. Un retainer da €300/mese non compra tempo di senior. Compra un modello standard applicato in fretta, o compra tempo di uno stagista.

Non significa che il costoso sia sempre migliore: significa che sotto una certa soglia il rapporto qualità-tempo è impossibile. Le fasce di mercato ragionevoli in Italia partono, per progetti seri, da €1.500–2.500/mese per PMI, e salgono da lì. Le trattiamo per esteso in una guida dedicata.

### 3\. Nessun caso studio nel vostro settore

Se un’agenzia non ha casi nel vostro verticale, non è per forza un problema — sarete i primi, e può andare bene. Ma dovrà sostituirlo con altro: casi in verticali affini, un ragionamento su cosa cambia, una consapevolezza dei rischi del cambio di settore.

Il problema vero è un’agenzia che *non ha nessun caso pubblico verificabile* — nemmeno anonimizzato, nemmeno raccontato. Le ragioni per non pubblicare casi possono essere legittime (NDA reali), ma quando anche in colloquio riservato l’agenzia non riesce a raccontare un progetto con numeri e contesto, è probabile che non ne abbia.

### 4\. Il reporting che parla solo di posizioni

Se dopo tre mesi di lavoro il report della vostra agenzia vi mostra un elenco di parole chiave salite da posizione 34 a posizione 18, ma non vi sa dire se e come il traffico è aumentato, e se e come le conversioni sono migliorate — l’agenzia sta ottimizzando la SEO in astratto, non il vostro business.

Il traffico organico può salire senza che le conversioni cambino (traffico di poco valore commerciale). Le posizioni possono migliorare senza che il traffico cambi (parole a basso volume). Il fatturato può crescere anche a parità di traffico (miglioramenti sulle pagine giuste). Un’agenzia seria tiene insieme questi tre livelli.

### 5\. Il contratto lungo con uscita punitiva

Alcuni contratti SEO prevedono 12–24 mesi di vincolo con penali di uscita significative. La razionalizzazione è che la SEO richiede tempo per dare frutti. È vero. Ma è anche vero che dopo sei mesi dovreste già vedere segnali di andamento — non i risultati finali, ma direzioni.

Un contratto rigido di 24 mesi è un modo dell’agenzia di scaricare su di voi il rischio di una relazione andata male. Un’agenzia sicura del proprio lavoro ha meno bisogno di vincolarvi, perché sa che non vorrete andarvene.

Regola pratica: preferite contratti con vincolo di sei mesi rinnovabili tacitamente, preavviso di disdetta ragionevole (30–60 giorni), senza penali di uscita se non anticipando un mese.

## Il brief in una pagina: cosa scrivere, cosa evitare

Un buon brief riduce il numero di agenzie che vi fanno perdere tempo, perché fa auto-selezione. Le agenzie non attrezzate per il vostro caso si defilano. Le altre rispondono con proposte pertinenti.

Il brief ideale sta in una pagina e contiene sette blocchi.

**Chi siete, in tre righe.** Cosa fate, a chi vendete, che dimensione avete. Non serve la storia dal fondatore.

**Cosa vendete online e come.** Se ecommerce: piattaforma, catalogo, AOV, canali attivi. Se lead gen: come qualificate i lead, quanto vale un lead, quanti ne servono. Se editoriale: modello di monetizzazione. La SEO cambia molto in base a cosa succede alla fine del funnel.

**Situazione attuale.** Traffico organico ultimo anno, canali principali di acquisizione, chi ha fatto SEO prima (se qualcuno l’ha fatta), un’idea onesta di dove il sito è forte e dove è debole. Se avete dei dati, allegateli: Search Console, GA4, un report Semrush o Ahrefs. Le agenzie serie apprezzano.

**Obiettivi in metriche.** Non “vogliamo crescere”. Meglio: “vogliamo passare da 30k a 80k sessioni organiche mensili in 12 mesi, con un tasso di conversione mantenuto sopra l’1,8%”. Se non sapete quantificare, dite anche quello: “non abbiamo una baseline chiara, ci aspettiamo che l’agenzia ci aiuti a costruirla”.

**Cosa NON state cercando.** È il blocco più utile e il più sottovalutato. Se non volete che vi propongano un rifacimento del sito, ditelo. Se non volete link building, ditelo. Se cercate solo consulenza strategica e non produzione contenuti, ditelo. Filtra da subito le agenzie sbagliate.

**Budget e timing.** Un range è meglio di un numero unico (“€2–4k/mese”, “vorremmo partire entro settembre”). Se non avete un budget definito, dite che aspettate proposte e le valuterete su rapporto costo-scope. Non fingete di avere un budget indefinito quando non è vero: le agenzie decenti se ne accorgono al secondo colloquio.

**Vincoli e contesto.** CMS attuale, team interno (chi c’è, cosa fa), altre agenzie che lavorano su altri canali, vincoli di brand o compliance particolari. Tutto quello che un’agenzia dovrebbe sapere prima di formulare una proposta, e che risparmierà un ciclo di andata e ritorno.

Un brief così si scrive in due ore. In cambio, si ricevono proposte molto più pertinenti. Le agenzie mediocri risponderanno lo stesso con un modello standard, ma le noterete subito.

## Come confrontare tre preventivi SEO

Ricevete tre proposte. Sono lunghe, hanno impostazioni diverse, la tentazione è confrontare i prezzi. È la scelta peggiore.

Il confronto utile procede su quattro assi, in questo ordine.

**Prima: pertinenza al brief.** Quanto ognuna ha capito il vostro caso? Ci sono paragrafi che sembrano ricopiati da un altro progetto? La proposta cita numeri o riferimenti al vostro sito reale, o è tutta teoria generale? Le proposte generiche vanno depennate al primo giro, indipendentemente dal prezzo.

**Seconda: chiarezza degli scope.** Cosa è incluso, cosa non lo è, cosa è a consumo? Le proposte con voci vaghe (“attività di ottimizzazione continua”) sono un rischio. Le proposte con voci precise (“audit tecnico iniziale, 12 revisioni on-page/mese, 2 briefing contenuti/mese, monitoraggio con dashboard mensile”) sono un contratto.

**Terza: assunzioni sul team.** Chi lavora sul progetto? Un senior al 25% e uno junior al 75% è un progetto diverso da un mid full-time. A parità di prezzo, il team fa la differenza.

**Quarta: prezzo, ma per unità comparabile.** Se una proposta include produzione contenuti e le altre no, non state confrontando la stessa cosa. Normalizzate: costo per ora di senior, costo per articolo prodotto, costo per revisione on-page. Solo dopo, mettete i totali affiancati.

L’agenzia più cara non è per definizione la migliore, la più economica non è per definizione la peggiore. Ma se la differenza fra la più cara e la più economica è del 50%, quasi sempre c’è una differenza reale nel team o nello scope. Il prezzo è raramente arbitrario.
$t$,
          $t$https://miglioreagenzia.it/wp-content/uploads/2026/07/come-scegliere-agenzia-seo-in-italia-scaled.jpg$t$, null, 2560, 1709,
          (select id from public.content_authors where domain_id = dominio and slug = $t$nicola-ferrari$t$),
          'publish', $t$2026-07-24 13:41:50$t$::timestamp at time zone 'Europe/Rome', 82)
  on conflict (domain_id, slug) do nothing;
  insert into public.article_category_links (article_id, category_id)
  select a.id, c.id from public.articles a join public.article_categories c on c.domain_id = a.domain_id
  where a.domain_id = dominio and a.slug = $t$come-scegliere-unagenzia-seo-in-italia$t$ and c.slug in ($t$seo$t$)
  on conflict do nothing;

  insert into public.site_pages (domain_id, slug, title, subtitle, body_md)
  values (dominio, $t$chi-siamo$t$, $t$Chi siamo$t$, $t$Una guida, non un marketplace$t$, $t$miglioreagenzia.it nasce da una constatazione semplice: scegliere un’agenzia in Italia è ancora una scommessa. Le directory globali sono pensate per il mercato americano. I marketplace di servizi mescolano agenzie strutturate, freelance e mestieri tecnici senza criteri chiari. I premi raccontano l’eccellenza creativa ma non aiutano un’azienda a scegliere un partner per i prossimi due anni.

Abbiamo costruito una guida italiana indipendente perché credevamo mancasse. Un posto dove un’azienda possa partire da una shortlist credibile, capire chi fa cosa, vedere i casi reali, e prendere una decisione informata.

## **Chi firma la guida**

Serenissima Holding SRL. 

## **Cosa facciamo qui**

Selezioniamo agenzie marketing italiane spaziando in tutti i principali settori: SEO, web, marketing, comunicazione, pubblicità ed eventi. Le raccogliamo in una guida ricercabile per servizio, per città, per settore servito. Spieghiamo come le scegliamo. Diamo strumenti a chi cerca un’agenzia per capire quale fa al caso suo, senza obblighi e senza intermediari.

*Per i criteri precisi di selezione e ranking, consulta la nostra [metodologia](/metodologia/).*
$t$)
  on conflict (domain_id, slug) do nothing;

  insert into public.site_pages (domain_id, slug, title, subtitle, body_md)
  values (dominio, $t$metodologia$t$, $t$Metodologia$t$, $t$Una guida indipendente alle agenzie italiane di SEO, web, marketing, comunicazione, pubblicità ed eventi. $t$, $t$## Qual è la differenza tra le tante directory già esistenti?

In una directory aggregata, le schede arrivano da scraping o auto-submission e restano lì, indipendentemente dalla qualità. In una guida editoriale ogni scheda passa da uno sguardo umano. Se non possiamo dire qualcosa di sensato di un’agenzia, non la pubblichiamo.

## Come selezioniamo

Ci sono due porte d’ingresso.

La prima è di iniziativa nostra.  
La redazione cerca attivamente agenzie italiane su Google, su LinkedIn, sulle short-list dei premi di settore (ADCI Awards, NC Awards, BEA Italia), sui database delle Camere di Commercio e nelle conversazioni con clienti e operatori. Quando troviamo un’agenzia che ci sembra valga la pena raccontare, apriamo una scheda interna. Da quel momento la scheda è in valutazione.

La seconda è di iniziativa dell’agenzia.  
Chiunque può proporre la propria scheda dalla pagina “Proponi la tua agenzia”. La proposta arriva alla redazione e finisce nella stessa coda di valutazione delle scoperte interne. Niente percorso preferenziale per chi si auto-candida.

Per entrare nella guida un’agenzia deve soddisfare quattro criteri minimi:

Esistere davvero come operatore economico in Italia. Partita IVA italiana, sede pubblica, attività ordinaria nel settore della comunicazione/marketing/eventi.  
Avere una presenza online verificabile. Sito web attivo, una pagina LinkedIn aziendale o un profilo equivalente che permetta di confermare team e referenze.  
Avere mostrato il proprio lavoro pubblicamente. Almeno un caso studio, un cliente nominato, un’opera visibile. La trasparenza sul lavoro è la condizione di base per essere recensiti.

I criteri sono volutamente bassi sulla “qualità soggettiva” e alti sulla verificabilità. Non vogliamo essere noi a decidere se un design è bello: vogliamo essere sicuri che dietro al design ci sia un’agenzia vera, che fa quello che dichiara di fare.

## Come ordiniamo (il “ranking”)

Su ogni listing — Agenzie di SEO a Milano, Agenzie a Roma, ecc. — le schede appaiono in un ordine costruito con tre layer.

Layer 1: status editoriale.  
Le schede con status selezionata (cioè validate manualmente dalla redazione) compaiono sopra. È l’unico fattore che ribalta la classifica e lo dichiariamo con un badge visibile su ogni scheda interessata.

Layer 2: completezza della scheda.  
A parità di status, le schede più ricche stanno sopra. “Ricca” significa: descrizione editoriale scritta, almeno un caso studio compilato, dimensione team e fascia di prezzo dichiarate, contatti pubblici verificati. Una scheda con più dati è più utile a chi cerca, quindi vale di più nell’ordine.

Layer 3: segnali esterni.  
A parità di status e completezza, contano i segnali pubblici: anzianità dichiarata dell’agenzia, numero e qualità delle review Google, presenza in eventi di settore, premi. È il livello con più discrezionalità, e lo teniamo apposta come terzo livello, non come fattore dominante.

Cosa NON entra nell’ordine:

Pagamenti, abbonamenti, “featured listing”. Punto.  
Partnership commerciali con l’agenzia.  
Quantità di traffico che l’agenzia ci porta.  
Se in futuro introdurremo servizi a pagamento per le agenzie (es. profili estesi, interviste redazionali commissionate), saranno chiaramente separati dal ranking  
e marcati con disclosure visibile. La regola “nessuna posizione è acquistabile” non è negoziabile.

## Come scriviamo le schede

La parte più visibile di ogni agenzia è la sua scheda editoriale. La descrizione breve di 200-300 caratteri che compare nelle listing, e la descrizione lunga della scheda dedicata, sono scritte da noi.

Per scriverle attingiamo da:

Il sito ufficiale dell’agenzia (i loro testi sono il punto di partenza, ma non li copiamo: li riformuliamo nel nostro registro)  
I case study che l’agenzia ha pubblicato

Quando un’agenzia ci segnala correzioni sulla propria scheda, le valutiamo entro 7 giorni lavorativi. Se la correzione è fattuale (es. “il team è di 12 persone, non 8”) la applichiamo. Se la correzione è interpretativa (es. “preferiremmo che usaste un aggettivo diverso”) rispondiamo argomentando.

## Come rimuoviamo

Una scheda può uscire dalla guida per tre motivi.

Per cessata attività.  
Se l’agenzia chiude, fallisce o si fonde con un’altra entità sotto un brand diverso, la scheda passa a archiviata e non compare più nelle listing pubbliche. Resta accessibile via URL diretto per chi avesse salvato il link.

Per scelta dell’agenzia.  
Se un’agenzia ci chiede formalmente di rimuovere la propria scheda, la rimuoviamo entro 30 giorni. Non chiediamo motivazioni e non opponiamo resistenza. Lo facciamo perché siamo una guida, non un registro pubblico vincolante.

Per scelta nostra.  
In casi rari, di fronte a comportamenti scorretti documentati (truffe ai danni dei clienti, sentenze definitive su pratiche commerciali ingannevoli, dossier pubblici di abusi sul lavoro) rimuoviamo schede di nostra iniziativa. È una decisione difficile e collegiale, e quando capita lo facciamo motivando in maniera trasparente sulla pagina della scheda archiviata.

Per proporre una scheda agenzia: [Scrivici →](mailto:richieste@miglioreagenzia.it)  
La redazione ti risponde entro 7 giorni.

Per correzioni o aggiornamenti su una scheda esistente: scrivi all’indirizzo email della redazione (lo trovi nella pagina contatti) con oggetto “Correzione \[nome agenzia\]”.  
Per dubbi sul metodo o segnalazioni di policy: stessa email, con oggetto “Metodo”.  
Trattiamo tutto, in ordine di arrivo, con un tempo medio di risposta di 5 giorni lavorativi.

## Versione e revisioni

Questa metodologia è in vigore dal lancio di miglioreagenzia.it. La rivediamo apertamente quando il sito cambia in modo significativo, per esempio se introduciamo nuovi servizi, se cambiamo la struttura dei listing, o se inseriamo nuove categorie di contenuto.

Le revisioni vengono pubblicate qui in calce, con data e descrizione sintetica del cambiamento.

Hai domande sul metodo o segnalazioni? [Scrivi alla redazione →](mailto:richieste@miglioreagenzia.it)
$t$)
  on conflict (domain_id, slug) do nothing;
end
$imp$;
