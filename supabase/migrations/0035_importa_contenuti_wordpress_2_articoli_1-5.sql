-- =====================================================================
-- 0035_importa_contenuti_wordpress_2_articoli_1-5.sql  (parte 2 di 3)
--   Importazione una tantum dei contenuti editoriali da WordPress
--   (17/11/2026): i primi 5 articoli (serve la parte 1). Testi convertiti in Markdown; i link
--   interni verso URL /magazine/... inesistenti puntano agli articoli veri.
--   Le copertine restano per ora sugli URL di WordPress: le sposta nello
--   storage la sezione Contenuti del brain.
--   Non sovrascrive nulla: se una riga esiste già, la salta.
-- =====================================================================

do $imp$
declare
  dominio uuid := (select id from public.network_domains where domain = 'miglioreagenzia.it');
begin
  if dominio is null then
    raise exception 'Dominio miglioreagenzia.it non trovato in network_domains';
  end if;

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
end
$imp$;

-- Cosa c'è dopo questa parte (attesi a fine importazione: 1, 14, 2, 10).
select
  (select count(*) from public.content_authors)    as autori,
  (select count(*) from public.article_categories) as categorie,
  (select count(*) from public.site_pages)         as pagine,
  (select count(*) from public.articles)           as articoli;
