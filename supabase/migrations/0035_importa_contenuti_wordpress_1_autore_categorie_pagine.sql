-- =====================================================================
-- 0035_importa_contenuti_wordpress_1_autore_categorie_pagine.sql  (parte 1 di 3)
--   Importazione una tantum dei contenuti editoriali da WordPress
--   (17/11/2026): l'autore con articoli, le categorie e le pagine Chi siamo e Metodologia. Testi convertiti in Markdown; i link
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

-- Cosa c'è dopo questa parte (attesi a fine importazione: 1, 14, 2, 10).
select
  (select count(*) from public.content_authors)    as autori,
  (select count(*) from public.article_categories) as categorie,
  (select count(*) from public.site_pages)         as pagine,
  (select count(*) from public.articles)           as articoli;
