-- =====================================================================
-- 0032_skill_seo.sql
--   Testi delle pagine competenza del sito (/{competenza}/ e combo).
--   - seo_definition: come si chiamano le agenzie della competenza, con
--     articolo e "migliori", in minuscolo ("le migliori agenzie SEO",
--     "le migliori web agency"). Il sito la usa per H1 e title:
--     "Le migliori agenzie SEO a Milano". Va scritta a mano perché
--     articolo e posizione della parola non si deducono dall'etichetta.
--   - Riempie seo_definition (parole chiave del live, solo ritoccate) e faq (dal tema
--     WordPress, inc/faq-competenze.php) solo dove sono vuote: un testo
--     già scritto nel brain non viene toccato.
--   - Aggiunge seo_definition alla vista site.skills.
-- descrizione e faq esistono già (0024). Le FAQ delle competenze sono
-- [{domanda, risposta}], diverse da quelle delle agenzie ([{q, a}]).
-- =====================================================================

alter table public.agency_skills
  add column if not exists seo_definition text;

do $$
declare
  dominio uuid := (select id from public.network_domains where domain = 'miglioreagenzia.it');
begin
  update public.agency_skills s
  set seo_definition = v.def
  from (values
    ('seo',                    'le migliori agenzie SEO'),
    ('marketing',              'le migliori agenzie di marketing'),
    ('pubblicita',             'le migliori agenzie di pubblicità'),
    ('fotografia',             'le migliori agenzie di fotografia'),
    ('comunicazione',          'le migliori agenzie di comunicazione'),
    ('web-agency',             'le migliori web agency'),
    ('social-media',           'le migliori agenzie di social media'),
    ('lead-generation',        'le migliori agenzie di lead generation'),
    ('e-commerce',             'le migliori agenzie e-commerce'),
    ('grafica',                'le migliori agenzie di grafica'),
    ('pubbliche-relazioni',    'le migliori agenzie di pubbliche relazioni'),
    ('e-mail-marketing',       'le migliori agenzie di email marketing'),
    ('strategia-di-contenuto', 'le migliori agenzie di strategia di contenuto'),
    ('video',                  'le migliori agenzie di video'),
    ('branding',               'le migliori agenzie di branding'),
    ('google-ads',             'le migliori agenzie Google Ads'),
    ('influencer-marketing',   'le migliori agenzie di influencer marketing'),
    ('amazon-marketing',       'le migliori agenzie di Amazon marketing'),
    ('digital-pr',             'le migliori agenzie di digital PR'),
    ('eventi',                 'le migliori agenzie di eventi'),
    ('shopify',                'le migliori agenzie Shopify'),
    ('magento',                'le migliori agenzie Magento'),
    ('wordpress',              'le migliori agenzie WordPress'),
    ('woocommerce',            'le migliori agenzie WooCommerce'),
    ('prestashop',             'le migliori agenzie PrestaShop')
  ) as v(slug, def)
  where s.domain_id = dominio and s.slug = v.slug
    and nullif(btrim(s.seo_definition), '') is null;

  update public.agency_skills s
  set faq = v.faq
  from (values
    ('amazon-marketing', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di Amazon Marketing?",
        "risposta": "Si occupa di far vendere il tuo catalogo su Amazon. Lavora sulle schede prodotto (titoli, immagini, A+ Content), sulla pubblicità interna (Sponsored Products, Brands e Display) e sul controllo di prezzi, scorte e recensioni. Alcune gestiscono anche l'apertura dell'account e la logistica FBA."
    },
    {
        "domanda": "Quando conviene affidarsi a un'agenzia per vendere su Amazon?",
        "risposta": "Quando vendi già su Amazon e le vendite non crescono come il budget. Oppure quando parti da zero e non vuoi imparare a tue spese regole dell'account, categorie e inserzioni. Con pochi prodotti e un budget minimo, un freelance o un lavoro interno spesso bastano."
    },
    {
        "domanda": "Quanto costa un'agenzia di Amazon Marketing?",
        "risposta": "Dipende dal modello. C'è chi chiede un canone mensile fisso, chi una percentuale sul venduto o sulla spesa pubblicitaria, chi li combina. Il budget pubblicitario è una voce a parte e va ad Amazon, non all'agenzia. Chiedi sempre cosa è incluso e su cosa si calcola la percentuale."
    },
    {
        "domanda": "Come si sceglie un'agenzia di Amazon Marketing?",
        "risposta": "Chiedi quali categorie ha seguito e con quali risultati. Chiedi chi gestisce l'account e come ti riporta i dati: vendite, ACoS, quota di vendite organiche. Diffida di chi promette posizionamenti garantiti: nessuno controlla gli algoritmi di Amazon."
    },
    {
        "domanda": "Quanto tempo serve per vedere risultati su Amazon?",
        "risposta": "Le campagne pubblicitarie producono dati utili in poche settimane. Per vedere l'effetto di schede ottimizzate sul posizionamento organico servono in genere alcuni mesi. Stagionalità e concorrenza di categoria contano più di quanto sembri."
    },
    {
        "domanda": "Come trovo un'agenzia di Amazon Marketing su miglioreagenzia.it?",
        "risposta": "Apri la guida Amazon Marketing e, se vuoi un'agenzia vicina, scegli la tua città. Le agenzie sono ordinate con una formula pubblica, spiegata nella pagina Metodologia. Nella scheda trovi servizi, fascia di prezzo e, dove ci sono, i case study verificati. Leggi se tra i servizi compaiono la gestione dell'account e l'advertising su Amazon, e se ci sono casi della tua categoria. Poi scrivi a due o tre agenzie con lo stesso brief."
    }
]$faq$::jsonb),
    ('branding', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di branding?",
        "risposta": "Costruisce e definisce l'identità di un marchio: posizionamento, nome, valori, tono di voce, logo e sistema visivo. Il risultato è un insieme di regole (il brand book) che rende coerente tutto ciò che l'azienda comunica. Non è solo grafica: parte dal perché, poi arriva al come appare."
    },
    {
        "domanda": "Quando serve un progetto di branding?",
        "risposta": "Quando nasci e devi darti un'identità. Quando cresci e il marchio non ti rappresenta più. Quando cambi mercato o ti fondi con un'altra azienda. Quando clienti e dipendenti raccontano l'azienda in modi diversi. Un logo rifatto da solo, di rado, risolve un problema di brand."
    },
    {
        "domanda": "Quanto costa un progetto di branding?",
        "risposta": "Dipende da quanto si lavora a monte. Un logo con poche applicazioni costa molto meno di un progetto con ricerca, strategia, naming e manuale d'uso. Di solito il prezzo è a progetto, spesso diviso per fasi. Chiedi cosa ricevi alla fine: file, linee guida, revisioni, diritti d'uso."
    },
    {
        "domanda": "Come si sceglie un'agenzia di branding?",
        "risposta": "Guarda i progetti già fatti e chiedi di raccontare il percorso, non solo il risultato. Chi sa spiegare perché ha preso certe scelte di solito lavora con metodo. Verifica se conosce il tuo settore e chiedi chi lavorerà davvero al tuo progetto."
    },
    {
        "domanda": "Quanto tempo richiede un progetto di branding?",
        "risposta": "Una nuova identità richiede in genere da qualche settimana a diversi mesi, in base a quanto è articolato il lavoro. I ritardi arrivano quasi sempre dalle approvazioni, non dal design. Concorda subito chi decide e in quanti passaggi."
    },
    {
        "domanda": "Come trovo un'agenzia di branding su miglioreagenzia.it?",
        "risposta": "Parti dalla guida Branding, anche per città. Trovi solo agenzie con una sede fisica. L'ordine segue una formula pubblica: pesano servizi, vicinanza, recensioni Google, completezza della scheda e un livello a pagamento che vale al massimo il 10%. Le posizioni in evidenza sono segnalate. Guarda i progetti raccontati nella scheda e se l'agenzia ha lavorato in settori vicini al tuo."
    }
]$faq$::jsonb),
    ('comunicazione', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di comunicazione?",
        "risposta": "Decide cosa dire, a chi e dove. Mette insieme messaggi, canali e contenuti: ufficio stampa, social, sito, eventi, materiali istituzionali. Rispetto a un'agenzia solo digitale ha uno sguardo più ampio sull'azienda, non su un singolo canale."
    },
    {
        "domanda": "Quando serve un'agenzia di comunicazione?",
        "risposta": "Quando l'azienda ha cose da dire ma manca un filo che le tenga insieme. Quando cambi struttura, lanci un prodotto o devi gestire un momento delicato, come una fusione o una crisi. Se ti serve solo gestire i social, un'agenzia più specifica può bastare."
    },
    {
        "domanda": "Quanto costa un'agenzia di comunicazione?",
        "risposta": "Spesso c'è un canone mensile per le attività continuative, più progetti a parte per lanci e campagne. Il costo dipende da quante persone lavorano al tuo caso e da quanti canali presidiano. Chiedi un perimetro chiaro delle attività e cosa resta fuori canone."
    },
    {
        "domanda": "Come si sceglie un'agenzia di comunicazione?",
        "risposta": "Cerca un'agenzia che parta da obiettivi e destinatari, non dai canali. Chiedi un esempio di piano di comunicazione e come ne ha misurato l'effetto. Chiedi quale referente ti seguirà e ogni quanto vi sentirete."
    },
    {
        "domanda": "Dopo quanto tempo si vedono i risultati della comunicazione?",
        "risposta": "La comunicazione lavora sulla durata. Il piano si imposta in poche settimane, ma per cambiare notorietà e reputazione servono mesi. Fissa indicatori intermedi, come menzioni, visite e richieste, per non aspettare un anno prima di capire se funziona."
    },
    {
        "domanda": "Come trovo un'agenzia di comunicazione su miglioreagenzia.it?",
        "risposta": "Nella guida Comunicazione trovi le agenzie, anche per città. Ogni scheda mostra cosa fa l'agenzia, la fascia di prezzo e, quando ci sono, i case study verificati. Le posizioni seguono una formula pubblica e quelle in evidenza sono segnalate. Se ti serve una visione d'insieme, leggi le schede che indicano più servizi di comunicazione insieme. Confronta almeno due o tre schede prima di scrivere."
    }
]$faq$::jsonb),
    ('digital-pr', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di digital PR?",
        "risposta": "Porta il tuo marchio su testate e siti autorevoli con contenuti che meritano di essere pubblicati: dati originali, ricerche, commenti di esperti, storie. Il risultato sono articoli e link che aumentano notorietà e peso del sito nei motori di ricerca."
    },
    {
        "domanda": "Quando conviene investire in digital PR e in cosa differiscono dalle PR tradizionali?",
        "risposta": "Le PR tradizionali puntano alla presenza sui media. Le digital PR misurano anche il link che arriva al tuo sito e l'effetto sul posizionamento. Le due cose si sovrappongono e molte agenzie fanno entrambe. Conviene se hai qualcosa da raccontare e un sito da far crescere."
    },
    {
        "domanda": "Quanto costa un'agenzia di digital PR?",
        "risposta": "Canone mensile o progetto, in base al numero di campagne e di uscite cercate. Diffida di chi vende link a prezzo fisso: una pubblicazione guadagnata su una buona testata non si compra a listino. Chiedi come scelgono le testate e cosa succede se la campagna non ottiene uscite."
    },
    {
        "domanda": "Come si sceglie un'agenzia di digital PR?",
        "risposta": "Chiedi esempi di campagne, con le testate ottenute e i link verificabili. Controlla che le testate siano pertinenti al tuo settore e non siti nati per vendere link. Chiedi come lavorano sulla storia da raccontare: è la parte più difficile."
    },
    {
        "domanda": "Quanto tempo serve per vedere risultati con le digital PR?",
        "risposta": "Una campagna richiede qualche settimana tra ideazione, preparazione e contatto con i giornalisti. Le uscite arrivano nei mesi successivi e l'effetto sul posizionamento è graduale. Non è un canale per risultati immediati."
    },
    {
        "domanda": "Come trovo un'agenzia di digital PR su miglioreagenzia.it?",
        "risposta": "Apri la guida Digital PR e, se vuoi un'agenzia vicina, scegli la tua città. Le agenzie sono ordinate con una formula pubblica, spiegata nella pagina Metodologia. Nella scheda trovi servizi, fascia di prezzo e, dove ci sono, i case study verificati. Cerca nei case study le testate ottenute e controlla che siano coerenti con il tuo settore. Poi scrivi a due o tre agenzie con lo stesso brief."
    }
]$faq$::jsonb),
    ('e-commerce', $faq$[
    {
        "domanda": "Cosa fa un'agenzia e-commerce?",
        "risposta": "Aiuta a costruire e far crescere un negozio online: sviluppo o migrazione del sito, scelta della piattaforma, catalogo, pagamenti e spedizioni. Poi lavora su traffico (SEO, advertising, email) e conversioni. Alcune fanno tutto, altre solo una parte."
    },
    {
        "domanda": "Quando serve un'agenzia e-commerce?",
        "risposta": "Quando apri un negozio online, cambi piattaforma o hai visite ma poche vendite. Se il problema è solo portare traffico, a volte serve più un'agenzia di advertising o di SEO che una e-commerce a tutto tondo."
    },
    {
        "domanda": "Quanto costa un'agenzia e-commerce?",
        "risposta": "Ci sono due voci diverse: la realizzazione o il rifacimento del negozio, a progetto, e la gestione continuativa, a canone o con una quota sulla spesa pubblicitaria. Il costo cambia con piattaforma, numero di prodotti e integrazioni con gestionale e magazzino. Canoni e commissioni di piattaforma e pagamenti restano a parte."
    },
    {
        "domanda": "Come si sceglie un'agenzia e-commerce?",
        "risposta": "Chiedi quali piattaforme usa e perché ne consiglia una per te. Chiedi risultati in termini di fatturato e tasso di conversione, non solo di traffico. Verifica chi si occupa dell'assistenza tecnica dopo il lancio."
    },
    {
        "domanda": "Quanto tempo serve per avviare un negozio online?",
        "risposta": "Un negozio nuovo richiede in genere da uno a diversi mesi, in base a catalogo e integrazioni. Dopo il lancio servono altri mesi per portare traffico e migliorare le conversioni. Il primo trimestre è di solito di apprendimento."
    },
    {
        "domanda": "Come trovo un'agenzia di e-commerce su miglioreagenzia.it?",
        "risposta": "Parti dalla guida E-commerce, anche per città. Trovi solo agenzie con una sede fisica. L'ordine segue una formula pubblica: pesano servizi, vicinanza, recensioni Google, completezza della scheda e un livello a pagamento che vale al massimo il 10%. Le posizioni in evidenza sono segnalate. Leggi se l'agenzia indica la piattaforma che usi o vuoi usare, e cerca case study con numeri di vendita."
    }
]$faq$::jsonb),
    ('e-mail-marketing', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di email marketing?",
        "risposta": "Gestisce la comunicazione via email con contatti e clienti: newsletter, campagne promozionali, automazioni (benvenuto, carrello abbandonato, riattivazione), segmentazione e analisi dei risultati. Spesso configura anche la piattaforma di invio."
    },
    {
        "domanda": "Quando conviene affidarsi a un'agenzia di email marketing?",
        "risposta": "Quando hai un database di contatti e lo usi poco o male. Quando vendi online e vuoi recuperare carrelli abbandonati e far tornare i clienti. Se non hai ancora contatti, prima serve un modo per raccoglierli, e un'agenzia può aiutarti a impostarlo."
    },
    {
        "domanda": "Quanto costa un'agenzia di email marketing?",
        "risposta": "Di solito un canone mensile, in base a numero di invii, automazioni e contenuti da produrre, oppure un progetto per l'impostazione iniziale. La piattaforma di invio ha un costo a parte, che cresce con il numero di contatti."
    },
    {
        "domanda": "Come si sceglie un'agenzia di email marketing?",
        "risposta": "Chiedi come garantisce che le email arrivino nella posta in arrivo (la deliverability) e come gestisce consenso e GDPR. Chiedi con quali piattaforme lavora e se ti lascia l'accesso all'account. Chiedi quali metriche guarda oltre al tasso di apertura, che da solo dice poco."
    },
    {
        "domanda": "Quanto tempo serve per vedere i risultati dell'email marketing?",
        "risposta": "L'impostazione richiede qualche settimana, tra piattaforma, template e prime automazioni. I risultati delle campagne si leggono già dai primi invii. Le automazioni, una volta attive, lavorano da sole e rendono nel tempo."
    },
    {
        "domanda": "Come trovo un'agenzia di email marketing su miglioreagenzia.it?",
        "risposta": "Nella guida Email Marketing trovi le agenzie, anche per città. Ogni scheda mostra cosa fa l'agenzia, la fascia di prezzo e, quando ci sono, i case study verificati. Le posizioni seguono una formula pubblica e quelle in evidenza sono segnalate. Leggi se tra i servizi compaiono automazioni e gestione della piattaforma di invio che usi. Confronta almeno due o tre schede prima di scrivere."
    }
]$faq$::jsonb),
    ('eventi', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di eventi?",
        "risposta": "Idea, organizza e gestisce eventi: convention, lanci di prodotto, fiere, eventi aziendali, serate, congressi. Si occupa di location, fornitori, allestimenti, programma, logistica e comunicazione, e gestisce la giornata dell'evento."
    },
    {
        "domanda": "Quando serve un'agenzia di eventi?",
        "risposta": "Quando l'evento ha un obiettivo (far conoscere, fidelizzare, vendere) e il tuo team non ha tempo o esperienza per gestirlo. Più l'evento è grande o delicato, con molti ospiti, permessi e sicurezza, più conviene chi ci ha già lavorato."
    },
    {
        "domanda": "Quanto costa un'agenzia di eventi?",
        "risposta": "Dipende da numero di ospiti, location, durata, allestimento e servizi. L'agenzia presenta di solito un preventivo con le voci dei fornitori e il proprio compenso, a forfait o in percentuale sul budget. Chiedi che sia dettagliato e come vengono gestiti gli imprevisti di costo."
    },
    {
        "domanda": "Come si sceglie un'agenzia di eventi?",
        "risposta": "Chiedi eventi simili al tuo per dimensione e tipo. Chiedi chi sarà sul posto il giorno dell'evento e che piano B ha per meteo e imprevisti. Controlla assicurazioni, permessi e rapporti con i fornitori della zona."
    },
    {
        "domanda": "Quanto tempo prima bisogna organizzare un evento?",
        "risposta": "Per un evento di medie dimensioni si parte di solito due o tre mesi prima, per uno grande molto di più. Le location migliori si prenotano con largo anticipo. Un evento in due settimane si può fare, ma le scelte si riducono."
    },
    {
        "domanda": "Come trovo un'agenzia di eventi su miglioreagenzia.it?",
        "risposta": "Apri la guida Eventi e, se vuoi un'agenzia vicina, scegli la tua città. Le agenzie sono ordinate con una formula pubblica, spiegata nella pagina Metodologia. Nella scheda trovi servizi, fascia di prezzo e, dove ci sono, i case study verificati. Scegli la città dell'evento: conta conoscere location e fornitori del posto. Poi scrivi a due o tre agenzie con lo stesso brief."
    }
]$faq$::jsonb),
    ('fotografia', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di fotografia?",
        "risposta": "Produce fotografie per uso commerciale: prodotto, ritratti aziendali, ambienti, eventi, food, moda, still life. Gestisce idea, set, luci, scatto, post-produzione e consegna nei formati che servono per sito, e-commerce e social."
    },
    {
        "domanda": "Quando conviene affidarsi a un'agenzia di fotografia?",
        "risposta": "Quando le foto fanno parte di ciò che vendi: un e-commerce, un ristorante, un hotel, un brand di moda. Un'immagine curata fa differenza su sito, schede prodotto e annunci. Per scatti occasionali un fotografo freelance può bastare."
    },
    {
        "domanda": "Quanto costa un servizio fotografico aziendale?",
        "risposta": "Si paga a giornata, a progetto o a numero di immagini, come accade spesso per l'e-commerce. Pesano ore di scatto, post-produzione, modelli, location e diritti d'uso. Chiedi cosa comprende il prezzo: quante foto finite, quante revisioni, per quanto tempo e dove puoi usarle."
    },
    {
        "domanda": "Come si sceglie un'agenzia di fotografia?",
        "risposta": "Guarda il portfolio nel tuo ambito, non in generale: chi fotografa food lavora in modo diverso da chi fa moda. Chiedi tempi di consegna, se la post-produzione è inclusa e quale licenza d'uso ricevi. Un set pilota riduce il rischio."
    },
    {
        "domanda": "Quanto tempo serve per un servizio fotografico?",
        "risposta": "Lo scatto richiede da poche ore a qualche giorno. La consegna delle immagini finite richiede in genere da qualche giorno a un paio di settimane. Con molti prodotti conviene concordare la consegna a lotti."
    },
    {
        "domanda": "Come trovo un'agenzia di fotografia su miglioreagenzia.it?",
        "risposta": "Parti dalla guida Fotografia, anche per città. Trovi solo agenzie con una sede fisica. L'ordine segue una formula pubblica: pesano servizi, vicinanza, recensioni Google, completezza della scheda e un livello a pagamento che vale al massimo il 10%. Le posizioni in evidenza sono segnalate. Guarda gli ambiti in cui lavora (prodotto, ritratto, food) e scegli quello del tuo progetto."
    }
]$faq$::jsonb),
    ('google-ads', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di Google Ads?",
        "risposta": "Crea e gestisce campagne a pagamento su Google: ricerca, Shopping, Performance Max, YouTube, Display. Imposta keyword, annunci e pagine di destinazione, controlla il budget e ottimizza in base ai risultati."
    },
    {
        "domanda": "Quando conviene investire in Google Ads?",
        "risposta": "Quando vuoi intercettare chi sta già cercando ciò che offri e hai un sito pronto a convertire. Se il sito è lento o confuso, le campagne portano visite che non diventano richieste. Prima si sistema quello, poi si accende la spesa."
    },
    {
        "domanda": "Quanto costa un'agenzia di Google Ads?",
        "risposta": "Le voci sono due e distinte: il budget che Google addebita per i click e il compenso dell'agenzia. Il compenso può essere a canone fisso, a percentuale sulla spesa o misto. Il budget resta tuo: verifica che l'account sia intestato a te."
    },
    {
        "domanda": "Come si sceglie un'agenzia di Google Ads?",
        "risposta": "Chiedi come misura i risultati: richieste, vendite, costo per acquisizione, non solo click. Chiedi l'accesso all'account e report leggibili. Diffida di chi promette il primo posto o non sa spiegare cosa ha cambiato nelle ultime campagne."
    },
    {
        "domanda": "Quanto tempo serve per vedere risultati con Google Ads?",
        "risposta": "Le campagne partono in pochi giorni dopo l'impostazione. Le prime settimane servono a raccogliere dati e il rendimento si stabilizza in uno o due mesi. Con budget molto bassi serve più tempo per avere dati utili."
    },
    {
        "domanda": "Come trovo un'agenzia di Google Ads su miglioreagenzia.it?",
        "risposta": "Nella guida Google Ads trovi le agenzie, anche per città. Ogni scheda mostra cosa fa l'agenzia, la fascia di prezzo e, quando ci sono, i case study verificati. Le posizioni seguono una formula pubblica e quelle in evidenza sono segnalate. Verifica che tra i servizi ci sia la gestione delle campagne e cerca case study con risultati misurati. Confronta almeno due o tre schede prima di scrivere."
    }
]$faq$::jsonb),
    ('grafica', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di grafica?",
        "risposta": "Progetta materiali visivi: logo, brochure, cataloghi, packaging, presentazioni, grafica per social e sito, materiali per eventi. Traduce un messaggio in immagini, impaginati e file pronti per la stampa o per il web."
    },
    {
        "domanda": "Quando conviene affidarsi a un'agenzia di grafica?",
        "risposta": "Quando i materiali non sembrano parte della stessa azienda, o quando devi produrne molti e coerenti, tra cataloghi, brochure e social. Per un'esigenza singola un freelance è spesso la scelta più semplice. Un'agenzia ha senso con volumi e continuità."
    },
    {
        "domanda": "Quanto costa un'agenzia di grafica?",
        "risposta": "A progetto per lavori definiti, come un catalogo o un packaging, a ore o a canone per attività continuative. Il costo cambia con complessità, numero di formati, revisioni previste e cessione dei diritti. Chiedi cosa è incluso e in che formati ricevi i file."
    },
    {
        "domanda": "Come si sceglie un'agenzia di grafica?",
        "risposta": "Guarda lavori simili al tuo. Chiedi come gestisce le revisioni e quante ne sono incluse. Chiedi se ricevi i file aperti e modificabili o solo quelli definitivi: meglio saperlo prima."
    },
    {
        "domanda": "Quanto tempo serve per un lavoro di grafica?",
        "risposta": "Un materiale singolo richiede in genere da qualche giorno a due o tre settimane. Un'identità completa o un packaging richiedono di più. Il tempo lo allungano le revisioni e le approvazioni interne più del lavoro in sé."
    },
    {
        "domanda": "Come trovo un'agenzia di grafica su miglioreagenzia.it?",
        "risposta": "Apri la guida Grafica e, se vuoi un'agenzia vicina, scegli la tua città. Le agenzie sono ordinate con una formula pubblica, spiegata nella pagina Metodologia. Nella scheda trovi servizi, fascia di prezzo e, dove ci sono, i case study verificati. Controlla gli ambiti in cui lavora (editoria, packaging, digitale) e i progetti mostrati. Poi scrivi a due o tre agenzie con lo stesso brief."
    }
]$faq$::jsonb),
    ('influencer-marketing', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di influencer marketing?",
        "risposta": "Seleziona i creator giusti per il tuo marchio, imposta la collaborazione (contenuti, compensi, calendario), coordina le pubblicazioni e misura i risultati. Si occupa anche di contratti e delle regole sulla trasparenza della pubblicità."
    },
    {
        "domanda": "Quando conviene fare influencer marketing?",
        "risposta": "Quando il tuo pubblico passa molto tempo sui social e si fida dei creator più che dei marchi. Funziona con un obiettivo chiaro (conoscenza, prove prodotto, vendite) e un prodotto che si presta a essere raccontato. Un'agenzia fa risparmiare tempo nella selezione e nelle trattative."
    },
    {
        "domanda": "Quanto costa un'agenzia di influencer marketing?",
        "risposta": "Le voci sono due: il compenso dei creator, che dipende da seguito, tipo di contenuto e diritti d'uso, e il compenso dell'agenzia, a canone, a progetto o in percentuale sul budget creator. Chiedi che siano separati, così sai quanto va davvero ai creator."
    },
    {
        "domanda": "Come si sceglie un'agenzia di influencer marketing?",
        "risposta": "Chiedi come sceglie i creator: audience reale, qualità dell'interazione, coerenza con il tuo marchio, non solo il numero di follower. Chiedi come verifica i follower falsi e come gestisce l'obbligo di segnalare i contenuti pubblicitari."
    },
    {
        "domanda": "Quanto tempo serve per una campagna con influencer?",
        "risposta": "Selezione e accordi richiedono qualche settimana. Le pubblicazioni di una campagna durano da alcuni giorni a qualche settimana. Una collaborazione continuativa con gli stessi creator funziona meglio di una sola uscita."
    },
    {
        "domanda": "Come trovo un'agenzia di influencer marketing su miglioreagenzia.it?",
        "risposta": "Parti dalla guida Influencer Marketing, anche per città. Trovi solo agenzie con una sede fisica. L'ordine segue una formula pubblica: pesano servizi, vicinanza, recensioni Google, completezza della scheda e un livello a pagamento che vale al massimo il 10%. Le posizioni in evidenza sono segnalate. Cerca campagne raccontate nel tuo settore e leggi quali piattaforme social segue l'agenzia."
    }
]$faq$::jsonb),
    ('lead-generation', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di lead generation?",
        "risposta": "Porta all'azienda contatti commerciali in target: persone o imprese che hanno mostrato interesse. Combina canali (advertising, SEO, landing page, form, email) e li collega a un processo che fa arrivare il contatto a chi vende. Spesso integra il CRM."
    },
    {
        "domanda": "Quando serve un'agenzia di lead generation?",
        "risposta": "Quando vendi servizi o prodotti con una trattativa (B2B, formazione, immobiliare, servizi professionali) e ti servono richieste regolari. Serve anche rispondere ai contatti in fretta: il collo di bottiglia è spesso lì, non nel numero."
    },
    {
        "domanda": "Quanto costa un'agenzia di lead generation?",
        "risposta": "Alcune agenzie chiedono un canone, altre un costo a contatto o a risultato. Il budget pubblicitario è a parte. Il costo a contatto è un indicatore utile ma non basta: conta quanti contatti diventano clienti. Chiedi come viene definito un «contatto valido»."
    },
    {
        "domanda": "Come si sceglie un'agenzia di lead generation?",
        "risposta": "Chiedi cosa considera un contatto di qualità e come lo misura. Chiedi come si integra con il tuo CRM e con chi vende. Diffida di chi garantisce un numero fisso di contatti senza conoscere il tuo mercato."
    },
    {
        "domanda": "Dopo quanto tempo arrivano i primi contatti?",
        "risposta": "Le prime campagne portano contatti in poche settimane. Per capirne la qualità e ottimizzare servono uno o due cicli di vendita, e di più se la trattativa è lunga."
    },
    {
        "domanda": "Come trovo un'agenzia di lead generation su miglioreagenzia.it?",
        "risposta": "Nella guida Lead generation trovi le agenzie, anche per città. Ogni scheda mostra cosa fa l'agenzia, la fascia di prezzo e, quando ci sono, i case study verificati. Le posizioni seguono una formula pubblica e quelle in evidenza sono segnalate. Cerca case study con risultati in contatti e vendite, non solo in visite. Confronta almeno due o tre schede prima di scrivere."
    }
]$faq$::jsonb),
    ('marketing', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di marketing?",
        "risposta": "Aiuta l'azienda a decidere dove investire per ottenere clienti: analisi del mercato, posizionamento, piano, scelta dei canali e coordinamento delle attività. A seconda dell'agenzia, esegue anche in prima persona (advertising, SEO, contenuti, email) o coordina altri specialisti."
    },
    {
        "domanda": "Quando serve un'agenzia di marketing?",
        "risposta": "Quando fai tante cose senza un piano, o non sai quali funzionano. Quando entri in un nuovo mercato o lanci un prodotto. Se ti serve una singola attività, come le campagne a pagamento, può essere più efficace un'agenzia specializzata."
    },
    {
        "domanda": "Quanto costa un'agenzia di marketing?",
        "risposta": "Di solito un canone mensile per le attività continuative, con un progetto iniziale a parte per strategia e impostazione. Il prezzo dipende dal numero di canali e dal livello di coinvolgimento. Il budget pubblicitario è separato. Chiedi cosa comprende il canone e ogni quanto si rivede."
    },
    {
        "domanda": "Come si sceglie un'agenzia di marketing?",
        "risposta": "Cerca un'agenzia che ti faccia domande sul business prima di parlare di canali. Chiedi come misurerete i risultati e con quali numeri: richieste, vendite, costo per cliente, non solo visite e follower. Chiedi chi ti seguirà ogni giorno."
    },
    {
        "domanda": "Dopo quanto tempo si vedono i risultati del marketing?",
        "risposta": "Un piano si imposta in poche settimane. I primi segnali arrivano dopo uno o due mesi, i risultati stabili in tre-sei, a seconda dei canali. Concorda fin dall'inizio le scadenze di verifica."
    },
    {
        "domanda": "Come trovo un'agenzia di marketing su miglioreagenzia.it?",
        "risposta": "Apri la guida Marketing e, se vuoi un'agenzia vicina, scegli la tua città. Le agenzie sono ordinate con una formula pubblica, spiegata nella pagina Metodologia. Nella scheda trovi servizi, fascia di prezzo e, dove ci sono, i case study verificati. Se non sai ancora di cosa hai bisogno, parti da qui e leggi i servizi indicati da ogni agenzia. Poi scrivi a due o tre agenzie con lo stesso brief."
    }
]$faq$::jsonb),
    ('prestashop', $faq$[
    {
        "domanda": "Cosa fa un'agenzia PrestaShop?",
        "risposta": "Sviluppa, personalizza e mantiene negozi online su PrestaShop, la piattaforma e-commerce open source. Si occupa di installazione, tema, moduli, integrazioni (gestionale, corrieri, pagamenti), migrazioni, aggiornamenti e assistenza."
    },
    {
        "domanda": "Quando serve un'agenzia PrestaShop?",
        "risposta": "Quando hai già un negozio PrestaShop da aggiornare o far funzionare meglio, o quando l'hai scelto per le sue caratteristiche. Se devi ancora scegliere la piattaforma, un'agenzia che lavora con più tecnologie ti darà un parere meno di parte."
    },
    {
        "domanda": "Quanto costa un negozio PrestaShop con un'agenzia?",
        "risposta": "A progetto per realizzazione o migrazione, a ore o a canone per manutenzione e assistenza. Pesano moduli a pagamento, personalizzazioni e integrazioni. Il software è gratuito, ma moduli, tema e hosting hanno un costo."
    },
    {
        "domanda": "Come si sceglie un'agenzia PrestaShop?",
        "risposta": "Chiedi con quale versione lavora e come gestisce gli aggiornamenti: è il punto in cui i negozi si rompono. Chiedi se il codice resta tuo e documentato. Chiedi cosa succede se un modulo non è più mantenuto."
    },
    {
        "domanda": "Quanto tempo serve per realizzare un negozio PrestaShop?",
        "risposta": "Un negozio nuovo richiede in genere da uno a tre mesi. Una migrazione dipende da catalogo e personalizzazioni. Gli aggiornamenti di versione vanno pianificati e testati prima di andare online."
    },
    {
        "domanda": "Come trovo un'agenzia di PrestaShop su miglioreagenzia.it?",
        "risposta": "Parti dalla guida Prestashop, anche per città. Trovi solo agenzie con una sede fisica. L'ordine segue una formula pubblica: pesano servizi, vicinanza, recensioni Google, completezza della scheda e un livello a pagamento che vale al massimo il 10%. Le posizioni in evidenza sono segnalate. Verifica che PrestaShop sia indicato tra i servizi: non tutte le agenzie web lo seguono."
    }
]$faq$::jsonb),
    ('pubbliche-relazioni', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di pubbliche relazioni?",
        "risposta": "Cura i rapporti tra l'azienda e chi ne parla: giornalisti, media, istituzioni, comunità. Scrive comunicati, organizza conferenze stampa e interviste, prepara i portavoce e gestisce la reputazione, anche nei momenti difficili."
    },
    {
        "domanda": "Quando servono le pubbliche relazioni?",
        "risposta": "Quando hai una notizia da far uscire, come un lancio, un'acquisizione o una nomina. Quando vuoi costruire autorevolezza. Quando devi gestire una situazione che può danneggiare l'immagine. Funzionano se c'è qualcosa di interessante da raccontare, non solo da dire."
    },
    {
        "domanda": "Quanto costa un'agenzia di pubbliche relazioni?",
        "risposta": "Quasi sempre un canone mensile per l'ufficio stampa continuativo, oppure un compenso a progetto per un lancio. Pesano il numero di attività e il livello di preparazione. Sospetta chi promette uscite garantite: la pubblicazione la decide il giornalista."
    },
    {
        "domanda": "Come si sceglie un'agenzia di pubbliche relazioni?",
        "risposta": "Chiedi con quali testate e giornalisti ha rapporti nel tuo settore, e esempi di uscite recenti. Chiedi come prepara una notizia e come lavora in caso di crisi. Verifica se i rapporti sono diretti o passano da intermediari."
    },
    {
        "domanda": "Dopo quanto tempo si vedono i risultati delle pubbliche relazioni?",
        "risposta": "Una relazione con i media si costruisce nel tempo. Le prime uscite possono arrivare in poche settimane se c'è una notizia forte. Per cambiare la percezione del marchio servono mesi di lavoro costante."
    },
    {
        "domanda": "Come trovo un'agenzia di pubbliche relazioni su miglioreagenzia.it?",
        "risposta": "Nella guida Pubbliche Relazioni trovi le agenzie, anche per città. Ogni scheda mostra cosa fa l'agenzia, la fascia di prezzo e, quando ci sono, i case study verificati. Le posizioni seguono una formula pubblica e quelle in evidenza sono segnalate. Cerca le agenzie che indicano ufficio stampa e relazioni con i media tra i servizi. Confronta almeno due o tre schede prima di scrivere."
    }
]$faq$::jsonb),
    ('pubblicita', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di pubblicità?",
        "risposta": "Idea e realizza campagne per far conoscere un prodotto o un marchio, e le pianifica sui mezzi: digitale, social, stampa, radio, affissioni, TV. Sceglie dove investire il budget, produce i messaggi e misura cosa ritorna."
    },
    {
        "domanda": "Quando serve un'agenzia di pubblicità?",
        "risposta": "Quando hai un obiettivo di conoscenza o di vendita e un budget da investire, e vuoi un piano che lo spenda dove serve. Un'agenzia evita errori nell'acquisto degli spazi e nei messaggi. Con un budget molto contenuto, meglio concentrarlo su un solo canale."
    },
    {
        "domanda": "Quanto costa un'agenzia di pubblicità?",
        "risposta": "Le voci sono due: il budget media, cioè ciò che paghi per gli spazi e va ai mezzi, e il compenso dell'agenzia, a canone, a progetto o in percentuale sull'investimento. Chiedi che siano separati e che il dettaglio degli acquisti sia visibile."
    },
    {
        "domanda": "Come si sceglie un'agenzia di pubblicità?",
        "risposta": "Chiedi campagne già fatte, per quali obiettivi e con quali risultati. Chiedi come decide la ripartizione tra i canali e come la corregge in corsa. Guarda se sa fare l'idea oltre che la pianificazione."
    },
    {
        "domanda": "Quanto tempo serve per una campagna pubblicitaria?",
        "risposta": "Ideazione e produzione richiedono in genere qualche settimana. La campagna dura quanto il periodo pianificato. I risultati online si leggono subito, per la notorietà servono settimane o mesi di esposizione."
    },
    {
        "domanda": "Come trovo un'agenzia di pubblicità su miglioreagenzia.it?",
        "risposta": "Apri la guida Pubblicità e, se vuoi un'agenzia vicina, scegli la tua città. Le agenzie sono ordinate con una formula pubblica, spiegata nella pagina Metodologia. Nella scheda trovi servizi, fascia di prezzo e, dove ci sono, i case study verificati. Guarda se l'agenzia indica sia ideazione sia pianificazione dei mezzi. Poi scrivi a due o tre agenzie con lo stesso brief."
    }
]$faq$::jsonb),
    ('seo', $faq$[
    {
        "domanda": "Cosa fa un'agenzia SEO?",
        "risposta": "Lavora perché il tuo sito compaia nei risultati di ricerca per le parole che usano i tuoi clienti. Analizza keyword e concorrenza, sistema gli aspetti tecnici, migliora struttura e testi delle pagine, produce contenuti e cura i link da altri siti. Sempre più spesso lavora anche per comparire nelle risposte dei motori basati su IA."
    },
    {
        "domanda": "Quando serve un'agenzia SEO?",
        "risposta": "Quando i clienti ti cercano online e non ti trovano. Quando il sito non è costruito attorno a come si cerca. Conviene partire presto, perché i risultati si accumulano. Se il sito è da rifare, coinvolgi la SEO prima della realizzazione, non dopo."
    },
    {
        "domanda": "Quanto costa un'agenzia SEO?",
        "risposta": "Quasi sempre un canone mensile, a volte con un audit iniziale a progetto. Il prezzo dipende da dimensione del sito, concorrenza e attività incluse: tecnica, contenuti, link. Diffida di chi propone un prezzo fisso senza aver guardato il sito."
    },
    {
        "domanda": "Come si sceglie un'agenzia SEO?",
        "risposta": "Chiedi esempi di crescita di traffico e di richieste, non solo di posizioni. Chiedi come lavora su contenuti e link. Diffida delle garanzie di primo posto e di chi non spiega cosa fa: la SEO seria si documenta."
    },
    {
        "domanda": "Dopo quanto tempo la SEO dà risultati?",
        "risposta": "In genere servono da tre a sei mesi per vedere i primi risultati stabili, e di più nei settori competitivi. Gli interventi tecnici possono dare effetti prima. È un investimento che si accumula, non un click."
    },
    {
        "domanda": "Come trovo un'agenzia di SEO su miglioreagenzia.it?",
        "risposta": "Parti dalla guida SEO, anche per città. Trovi solo agenzie con una sede fisica. L'ordine segue una formula pubblica: pesano servizi, vicinanza, recensioni Google, completezza della scheda e un livello a pagamento che vale al massimo il 10%. Le posizioni in evidenza sono segnalate. Controlla se l'agenzia indica SEO tecnica e contenuti, e se ha case study con crescita del traffico."
    }
]$faq$::jsonb),
    ('shopify', $faq$[
    {
        "domanda": "Cosa fa un'agenzia Shopify?",
        "risposta": "Realizza e gestisce negozi online su Shopify: configurazione, tema e personalizzazioni, app, catalogo, pagamenti, spedizioni, migrazione da altre piattaforme. Molte seguono anche le vendite dopo il lancio, con advertising, email e ottimizzazione delle conversioni."
    },
    {
        "domanda": "Quando serve un'agenzia Shopify?",
        "risposta": "Quando vuoi aprire un negozio senza gestire server e aggiornamenti, o migrare da un'altra piattaforma. Serve soprattutto se il catalogo è ampio, se vendi in più paesi o se vuoi un'esperienza d'acquisto su misura. Per un negozio semplice si può partire da un tema pronto."
    },
    {
        "domanda": "Quanto costa un negozio Shopify con un'agenzia?",
        "risposta": "A progetto per la realizzazione, a canone per la gestione. Poi ci sono i costi di Shopify, con abbonamento mensile e commissioni sulle transazioni, e delle app a pagamento. Chiedi l'elenco di tutti i costi ricorrenti, non solo il preventivo dell'agenzia."
    },
    {
        "domanda": "Come si sceglie un'agenzia Shopify?",
        "risposta": "Guarda negozi realizzati e provali da telefono, controllando velocità e usabilità. Chiedi se lavora con temi personalizzati o preconfezionati e come li mantiene aggiornati. Chiedi quante app serviranno: troppe rallentano il sito."
    },
    {
        "domanda": "Quanto tempo serve per aprire un negozio Shopify?",
        "risposta": "Un negozio su tema pronto si lancia in poche settimane. Un progetto con personalizzazioni e migrazione richiede uno o più mesi. Dedica tempo ai contenuti, come foto e descrizioni: sono spesso quelli a far slittare il lancio."
    },
    {
        "domanda": "Come trovo un'agenzia di Shopify su miglioreagenzia.it?",
        "risposta": "Nella guida Shopify trovi le agenzie, anche per città. Ogni scheda mostra cosa fa l'agenzia, la fascia di prezzo e, quando ci sono, i case study verificati. Le posizioni seguono una formula pubblica e quelle in evidenza sono segnalate. Controlla che Shopify sia citato tra i servizi e guarda i negozi realizzati. Confronta almeno due o tre schede prima di scrivere."
    }
]$faq$::jsonb),
    ('social-media', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di social media?",
        "risposta": "Gestisce la presenza dell'azienda sui social: strategia, calendario editoriale, creazione dei contenuti, pubblicazione, risposte a commenti e messaggi, report. Molte seguono anche le campagne a pagamento sui social."
    },
    {
        "domanda": "Quando conviene affidare i social a un'agenzia?",
        "risposta": "Quando vuoi essere presente con continuità e non hai chi se ne occupi. Prima decidi su quali canali: non servono tutti, servono quelli dove c'è il tuo pubblico. Se hai già una persona interna, l'agenzia può affiancarla con strategia e contenuti."
    },
    {
        "domanda": "Quanto costa un'agenzia di social media?",
        "risposta": "Un canone mensile, in base a numero di canali, post al mese, formati (foto, video, Reel) e servizi come community management e campagne. Il budget delle inserzioni è separato. Chiedi cosa è compreso: frequenza di pubblicazione, revisioni, video."
    },
    {
        "domanda": "Come si sceglie un'agenzia di social media?",
        "risposta": "Guarda i profili che gestisce e il tono che usa. Chiedi come misura i risultati: oltre a like e follower, guarda richieste, visite e vendite. Chiedi chi risponde ai commenti e come vengono gestite le critiche."
    },
    {
        "domanda": "Quanto tempo serve per far crescere i social di un'azienda?",
        "risposta": "Il piano si imposta in due o tre settimane. Per far crescere una pagina in modo solido servono mesi di pubblicazione regolare. Le campagne a pagamento accelerano, ma non sostituiscono il lavoro sui contenuti."
    },
    {
        "domanda": "Come trovo un'agenzia di social media su miglioreagenzia.it?",
        "risposta": "Apri la guida Social Media e, se vuoi un'agenzia vicina, scegli la tua città. Le agenzie sono ordinate con una formula pubblica, spiegata nella pagina Metodologia. Nella scheda trovi servizi, fascia di prezzo e, dove ci sono, i case study verificati. Guarda i canali gestiti e se la produzione dei contenuti è compresa nei servizi. Poi scrivi a due o tre agenzie con lo stesso brief."
    }
]$faq$::jsonb),
    ('strategia-di-contenuto', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di strategia di contenuto?",
        "risposta": "Definisce quali contenuti produrre, per chi, con quale obiettivo e su quali canali. Parte da pubblico e ricerche (anche di keyword), imposta temi, formati e calendario, e decide come misurare il rendimento. Può includere la produzione, oppure lasciarla a te o ad altri."
    },
    {
        "domanda": "Quando serve una strategia di contenuto?",
        "risposta": "Quando pubblichi senza capire cosa funziona. Quando vuoi che blog e video portino richieste e non solo visite. Quando più persone producono contenuti con stili diversi."
    },
    {
        "domanda": "Quanto costa una strategia di contenuto?",
        "risposta": "Spesso un progetto iniziale per definire la strategia, seguito da un canone se l'agenzia gestisce anche la produzione. Dipende dal numero di temi, dai canali e dal volume. Chiedi se la strategia è un documento che puoi usare da solo o una consulenza continuativa."
    },
    {
        "domanda": "Come si sceglie un'agenzia di strategia di contenuto?",
        "risposta": "Chiedi un esempio di strategia con obiettivi e risultati misurati. Chiedi come sceglie i temi, se con dati e ricerche o a intuito, e come collega i contenuti a un risultato per l'azienda. Verifica che sappia anche scrivere, non solo pianificare."
    },
    {
        "domanda": "Dopo quanto tempo i contenuti iniziano a rendere?",
        "risposta": "La strategia si definisce in poche settimane. I contenuti iniziano a rendere dopo alcuni mesi, soprattutto se puntano al posizionamento sui motori di ricerca. Una revisione ogni trimestre aiuta a correggere la rotta."
    },
    {
        "domanda": "Come trovo un'agenzia di strategia di contenuto su miglioreagenzia.it?",
        "risposta": "Parti dalla guida Strategia di contenuto, anche per città. Trovi solo agenzie con una sede fisica. L'ordine segue una formula pubblica: pesano servizi, vicinanza, recensioni Google, completezza della scheda e un livello a pagamento che vale al massimo il 10%. Le posizioni in evidenza sono segnalate. Cerca le agenzie che indicano sia strategia sia produzione dei contenuti."
    }
]$faq$::jsonb),
    ('video', $faq$[
    {
        "domanda": "Cosa fa un'agenzia di video?",
        "risposta": "Produce video per l'azienda: spot, video aziendali e istituzionali, contenuti per social, interviste, video prodotto, animazioni. Segue idea, sceneggiatura, riprese, montaggio, colore, audio e consegna nei formati giusti."
    },
    {
        "domanda": "Quando serve un video aziendale?",
        "risposta": "Quando devi spiegare un prodotto, raccontare l'azienda o fare pubblicità con un mezzo che cattura più di una foto. Il video funziona se ha un obiettivo chiaro e un luogo dove essere visto. Un video senza distribuzione resta fermo su un disco."
    },
    {
        "domanda": "Quanto costa un video aziendale?",
        "risposta": "Si paga a progetto, in base a durata, giorni di ripresa, troupe, location, attori, musiche e post-produzione. Un video semplice con una persona e una camera costa molto meno di uno spot con più giorni di set. Chiedi cosa comprende il preventivo e che diritti hai su musiche e riprese."
    },
    {
        "domanda": "Come si sceglie un'agenzia di video?",
        "risposta": "Guarda lavori dello stesso tipo e durata. Chiedi chi scrive, chi gira e chi monta, e se è la squadra che vedi nel portfolio. Chiedi quante revisioni sono incluse e come si gestisce il materiale grezzo."
    },
    {
        "domanda": "Quanto tempo serve per realizzare un video aziendale?",
        "risposta": "Un video aziendale richiede in genere da quattro a otto settimane tra idea, riprese e montaggio. Un contenuto per i social può essere molto più rapido. Le approvazioni interne sono la causa principale dei ritardi."
    },
    {
        "domanda": "Come trovo un'agenzia di video su miglioreagenzia.it?",
        "risposta": "Nella guida Video trovi le agenzie, anche per città. Ogni scheda mostra cosa fa l'agenzia, la fascia di prezzo e, quando ci sono, i case study verificati. Le posizioni seguono una formula pubblica e quelle in evidenza sono segnalate. Guarda i formati prodotti (spot, video aziendali, social) e scegli quello del tuo progetto. Confronta almeno due o tre schede prima di scrivere."
    }
]$faq$::jsonb),
    ('web-agency', $faq$[
    {
        "domanda": "Cosa fa una web agency?",
        "risposta": "Progetta e sviluppa siti e applicazioni web: struttura, grafica, sviluppo, contenuti, SEO di base, e-commerce, integrazioni e manutenzione. Molte seguono anche hosting, sicurezza e aggiornamenti dopo il lancio."
    },
    {
        "domanda": "Quando serve una web agency?",
        "risposta": "Quando devi aprire un sito, quando quello attuale è lento, datato o difficile da aggiornare, o quando serve una funzione che manca, come prenotazioni, area riservata o e-commerce. Se il sito funziona e basta ritoccarlo, un intervento mirato costa meno di un rifacimento."
    },
    {
        "domanda": "Quanto costa una web agency?",
        "risposta": "A progetto per realizzare il sito, poi un canone per manutenzione, hosting e assistenza. Dipende da numero di pagine, funzioni, integrazioni, contenuti da produrre e piattaforma. Chiedi i costi ricorrenti di dominio, hosting e licenze, e a chi sono intestati."
    },
    {
        "domanda": "Come si sceglie una web agency?",
        "risposta": "Guarda siti realizzati e provali da telefono. Chiedi quale tecnologia usa e perché, e se il sito sarà tuo, con accessi, codice e dominio. Chiedi come lavora sulla SEO durante lo sviluppo e cosa succede dopo la consegna."
    },
    {
        "domanda": "Quanto tempo serve per realizzare un sito web?",
        "risposta": "Un sito vetrina richiede in genere da alcune settimane a un paio di mesi, uno più complesso di più. I ritardi arrivano di solito dai contenuti, testi e foto, che l'azienda deve consegnare. Concorda scadenze anche per quelli."
    },
    {
        "domanda": "Come trovo una web agency su miglioreagenzia.it?",
        "risposta": "Apri la guida Web agency e, se vuoi un'agenzia vicina, scegli la tua città. Le agenzie sono ordinate con una formula pubblica, spiegata nella pagina Metodologia. Nella scheda trovi servizi, fascia di prezzo e, dove ci sono, i case study verificati. Leggi le tecnologie indicate e guarda i progetti mostrati. Poi scrivi a due o tre agenzie con lo stesso brief."
    }
]$faq$::jsonb),
    ('wordpress', $faq$[
    {
        "domanda": "Cosa fa un'agenzia WordPress?",
        "risposta": "Realizza e gestisce siti WordPress: tema e personalizzazioni, plugin, contenuti, velocità, sicurezza, aggiornamenti, migrazioni, e-commerce con WooCommerce. Si occupa anche di manutenzione, backup e assistenza."
    },
    {
        "domanda": "Quando serve un'agenzia WordPress?",
        "risposta": "Quando vuoi un sito che puoi aggiornare da solo senza programmare. Quando il tuo WordPress è lento, bloccato dagli aggiornamenti o colpito da malware. Anche per migrare da un'altra piattaforma o costruire un sito su misura."
    },
    {
        "domanda": "Quanto costa un sito WordPress con un'agenzia?",
        "risposta": "A progetto per realizzare o rifare il sito, a canone per manutenzione e assistenza. WordPress è gratuito, ma tema e plugin premium, hosting e licenze hanno costi che si rinnovano. Chiedi quali sono compresi e a chi sono intestate le licenze."
    },
    {
        "domanda": "Come si sceglie un'agenzia WordPress?",
        "risposta": "Chiedi come gestisce aggiornamenti, backup e sicurezza, e in quanto tempo interviene se qualcosa si rompe. Chiedi quale tema e quali plugin usa e perché. Verifica che il sito sia veloce e che gli accessi restino tuoi."
    },
    {
        "domanda": "Quanto tempo serve per realizzare un sito WordPress?",
        "risposta": "Un sito vetrina richiede in genere da alcune settimane a due mesi. Una migrazione o un sito con molte funzioni richiede di più. La manutenzione continua dopo il lancio: un sito non aggiornato diventa un rischio."
    },
    {
        "domanda": "Come trovo un'agenzia di WordPress su miglioreagenzia.it?",
        "risposta": "Parti dalla guida WordPress, anche per città. Trovi solo agenzie con una sede fisica. L'ordine segue una formula pubblica: pesano servizi, vicinanza, recensioni Google, completezza della scheda e un livello a pagamento che vale al massimo il 10%. Le posizioni in evidenza sono segnalate. Verifica che WordPress sia indicato tra i servizi e se l'agenzia offre anche manutenzione."
    }
]$faq$::jsonb)
  ) as v(slug, faq)
  where s.domain_id = dominio and s.slug = v.slug
    and coalesce(s.faq, '[]'::jsonb) = '[]'::jsonb;
end
$$;

-- ---- Vista per il sito -------------------------------------------------
-- La colonna nuova va in fondo: create or replace view non può cambiare
-- l'ordine di quelle esistenti. I grant della vista restano.
create or replace view site.skills as
select domain_id, slug, label, sort_order, query_modifier, descrizione, faq, guide_correlate,
       seo_definition
from public.agency_skills;
