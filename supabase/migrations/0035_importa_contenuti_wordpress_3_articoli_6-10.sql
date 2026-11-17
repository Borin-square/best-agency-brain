-- =====================================================================
-- 0035_importa_contenuti_wordpress_3_articoli_6-10.sql  (parte 3 di 3)
--   Importazione una tantum dei contenuti editoriali da WordPress
--   (17/11/2026): gli altri 5 articoli (serve la parte 1). Testi convertiti in Markdown; i link
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
end
$imp$;

-- Cosa c'è dopo questa parte (attesi a fine importazione: 1, 14, 2, 10).
select
  (select count(*) from public.content_authors)    as autori,
  (select count(*) from public.article_categories) as categorie,
  (select count(*) from public.site_pages)         as pagine,
  (select count(*) from public.articles)           as articoli;
