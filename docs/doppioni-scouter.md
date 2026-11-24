# Doppioni creati dallo scouter

Estratto il 24/11/2026 dal DB (sola lettura). Delle 220 agenzie inserite dall'`agency-scouter`, 62
avevano un dominio già presente nel DB: sono doppioni di agenzie che esistevano già.

**Causa.** Per scartare i doppioni lo scouter carica le agenzie esistenti in una sola richiesta
([dedup.ts:24-28](../src/lib/agents/agency-scouter/dedup.ts#L24-L28)), ma Supabase ne restituisce al
massimo 1.000. Al 3 settembre le agenzie erano 1.538: lo scouter non vedeva circa un terzo del DB.
Finché non è corretto (caricare a pagine da 1.000, come fa il quality-check) lo scouter non va
lanciato.

Gli ID sono abbreviati ai primi 8 caratteri; le schede si aprono nel brain su `/agenzie/<id completo>`
(l'elenco completo degli ID è nella query in fondo).

**Fatto il 24/11/2026:** cestinate le 26 draft del gruppo A (tutte tranne Dexa Agency, Toplevelsrls,
Tivitti, Zero Digital E, Brain Computing, GIAMP, da guardare a mano), chiuse 207 issue collegate.

**Città della draft.** Lo scouter la prende dalla pagina trovata su Google, spesso una landing per
una città diversa dalla sede ("migliore agenzia SEO Trento"): non è affidabile, ma quando è diversa
da quella della pubblicata è un buon segnale per ricontrollarla.

## A. Doppione ancora aperto: draft dello scouter accanto alla pubblicata (32)

Nessuna unione è mai avvenuta. La pubblicata ha l'URL del sito; la draft non è visibile da nessuna parte.

| # | Dominio | Pubblicata (resta) | Città | Draft dello scouter (da cestinare) | Città draft | Da guardare |
|---|---|---|---|---|---|---|
| 1 | add-design.it | '+ADD DESIGN · `c5527cda` | catania | ADD DESIGN · `06bf4e12` | catania |  |
| 2 | happyminds.it | HappyMinds · `bcb4ae22` | ravenna | HappyMinds · `0aec5604` | ravenna |  |
| 3 | agenziaspada.com | Agenzia Spada · `fbcaa6f8` | milano | Spada Media Group · `21ac545f` | milano |  |
| 4 | tincx.com | ▷ Webagentur Südtirol · `cc725bdf` | Bolzano | tincx · `27781845` | bolzano |  |
| 5 | giamp.info | GIAMP · `f9b66ae3` | — | GIAMP · `27bfae61` | cuneo | **pubblicata senza città** |
| 6 | graphicprint24.it | Graphicprint24 · `6fe00876` | frosinone | Graphicprint24 · `2cf26d48` | frosinone |  |
| 7 | rienzi.agency | Rienzi · `6108037b` | varese | Rienzi Comunica · `42474ebd` | varese |  |
| 8 | dexanet.com | Dexa Agency · `257a3a10` | brescia | Dexa · `445bc30b` | venezia | **città diversa** |
| 9 | exceedsrl.com | Exceedsrl · `207f79eb` | palermo | eXceed Srl · `481e69fe` | palermo |  |
| 10 | fattoriacreativa.it | Fattoria Creativa · `eb0ba893` | perugia | Fattoria Creativa · `498f32ee` | perugia |  |
| 11 | bizionist.it | Bizionist · `f736eb5c` | pistoia | Bizionist · `5a10efef` | pistoia |  |
| 12 | onviewstudio.com | Onview Studio · `a8bc95c5` | reggio-calabria | Onviewstudio · `5b8696fa` | reggio-calabria |  |
| 13 | reasoluzioni.it | Reasoluzioni · `bb54f564` | roma | Rea Soluzioni · `6324aab2` | roma |  |
| 14 | yumalab.it | YUMA Lab · `bbcd45b4` | torino | YUMA LAB · `6327a410` | torino |  |
| 15 | chiocchettiwebsolutions.it | Chiocchetti Web Solutions · `b1ce0e63` | salerno | Chiocchetti Web Solutions · `835b32ca` | salerno |  |
| 16 | htt.it | HTT · `b1579fa6` | pisa | HT&T Consulting · `8b22d695` | pisa |  |
| 17 | mcnagency.it | MCN Agency · `0542d21f` | palermo | MCN Agency · `8d9820ab` | palermo |  |
| 18 | toplevelsrls.com | Toplevelsrls · `9ca4d7dc` | venezia | Top Level · `8de1f9fd` | teramo | **città diversa** |
| 19 | daveslanestudio.com | Dave Slane · `c2fd639b` | napoli | Dave Slane · `a1a15b16` | napoli |  |
| 20 | tivitti.com | Tivitti · `6f7c05bf` | palermo | Tivitti · `a2294816` | modena | **città diversa** |
| 21 | zerodigitale.it | Zero Digital E · `a9f0f88f` | milano | Agenzia Social Media Teramo · `afcbeba7` | castellalto | **città diversa** |
| 22 | reversohub.it | Reversohub · `c39f6d51` | latina | Reverso Marketing Hub · `bf28aca3` | latina |  |
| 23 | manada.it | Manada · `7efd36a6` | udine | Manada · `bfee175f` | udine |  |
| 24 | webprojectgroup.it | Web Project Group · `941c68b7` | padova | Social ADS Padova · `cdfe93b3` | padova |  |
| 25 | kreativasrl.com | Kreativasrl · `d7281cd9` | vicenza | Kreativa · `d1481a06` | vicenza |  |
| 26 | braincomputing.com | Brain Computing S.p.A. · `7c836561` | roma | Agenzia Social Media Marketing Barletta-Andria-Trani · `d3340d8a` | barletta | **città diversa** |
| 27 | nousws.it | Nousws · `4ca8a64b` | vibo-valentia | NwS agenzia digitale · `e28a91bb` | vibo-valentia |  |
| 28 | andiamonline.it | Andiamonline · `1dd4340f` | pescara | AndiamOnline · `e6637520` | pescara |  |
| 29 | linkness.com | Linkness · `3a67ef45` | venezia | Linkness · `e839907b` | venezia |  |
| 30 | innexco.it | Innexco · `fbd9f06f` | treviso | Innexco · `f66ca3b0` | treviso |  |
| 31 | xonex.it | Xonex · `b39bdfb9` | roma | Xonex · `f684c17d` | roma |  |
| 32 | fromlu.com | Fromlu · `8700c737` | lucca | Studio Fromlu · `f9c91d41` | lucca |  |

## B. Unione sbagliata: la pubblicata è finita nel cestino (9)

Sono i casi già in [unioni-da-ricontrollare.md](unioni-da-ricontrollare.md), più A-Channel (che non veniva da WordPress).

| # | Dominio | Nel cestino (era l'originale) | Città | Draft vincente | Città draft |
|---|---|---|---|---|---|
| 1 | vezcomunicazione.it | VEZ · `eb7d72c6` · wp 237 | ancona | VEZ Comunicazione · `209d92cc` | ancona |
| 2 | wearemadmedia.com | Wearemad Media · `55acf885` · wp 1654 | venezia | Madmedia · `4a130776` | udine |
| 3 | arezzodigitale.it | Arezzo Digitale · `81e97503` · wp 1719 | arezzo | Arezzo Digitale · `4b0505a8` | arezzo |
| 4 | immagina.group | Immagina Group · `39a9d613` · wp 1348 | roma | Immagina Group · `57313c60` | roma |
| 5 | e26.it | E26 · `e906d37d` · wp 1134 | napoli | E26 · `a4921266` | napoli |
| 6 | socialneeds.it | Social Needs · `b092832d` · wp 1906 | — | Social Needs · `babc3900` | chieti |
| 7 | achannel.it | A-Channel · `bd91e6fe` | trani | A-Channel · `da4fafec` | enna |
| 8 | mayanprojects.it | MAYANprojects · `06d199c7` · wp 1246 | pescara | Social · `e4daf77f` | chieti |
| 9 | partner.meraviglialab.com | Partner meravigliä · `ad5fa493` · wp 1471 | torino | Agenzia marketing Salerno · `f910ff56` | salerno |

## C. Già a posto: la draft dello scouter è nel cestino, la pubblicata è online (21)

Niente da fare sul doppione. Dove la città della pubblicata non torna con quella della draft vale la pena guardarla.

| # | Dominio | Pubblicata | Città | Draft cestinata | Città draft | Come |
|---|---|---|---|---|---|---|
| 1 | netcoming.it | Netcoming · `21c36d7a` | bari | Netcoming · `05c71926` | bari | a mano |
| 2 | company-makeup.it | Company Makeup · `fdc23c76` | la-spezia | Company Makeup Web Agency · `0c3530ff` | la spezia | unione automatica |
| 3 | kynetic.it | Kynetic · `7c70e88f` | salerno | Kynetic · `131b93bd` | salerno | unione automatica |
| 4 | valeriaalinei.it | Valeriaalinei · `82184e8d` | napoli | Valeria Alinei · `1a342ae8` | napoli | unione automatica |
| 5 | frescodigitale.it | Frescodigitale · `cac4adf9` | arezzo | Fresco Digitale · `33049185` | arezzo | unione automatica |
| 6 | influencermarketingroma.it | Influencer Marketing Roma · `a4cd8b4e` | venezia | ercini studio · `362b790e` | roma ⚠ | unione automatica |
| 7 | wearedeep.digital | Deep Digital · `7c3a4cfd` | vicenza | Deep Digital · `6b6a2651` | vicenza | unione automatica |
| 8 | minfluencer.it | Micro Influencer · `b2cab5a8` | parma | Minfluencer · `7da6163a` | venezia ⚠ | unione automatica |
| 9 | meetodo.it | Meetodo · `e89a07ce` | venezia | MEETODO · `a7783d6f` | venezia | unione automatica |
| 10 | evomarketing.it | EVO Marketing · `abd95dd7` | sassari | Evomarketing · `b1be3ec4` | Olbia ⚠ | unione automatica |
| 11 | idainfluencer.com | IDA · `49fc198a` | milano | IDA · `b26527af` | milano | unione automatica |
| 12 | kom.online | KOM · `30920b3c` | padova | Kompetitive · `b3770e54` | barletta ⚠ | unione automatica |
| 13 | hicweb.net | HicWeb di Olbia · `815d6521` | roma | HicWeb · `c61433d0` | olbia ⚠ | unione automatica |
| 14 | publikimage.it | Publik Image · `c5e359b7` | ravenna | Publik Image · `d0c2c8f1` | ravenna | unione automatica |
| 15 | studiart.it | Studiart · `d2d70837` | piacenza | Studiart · `d726b847` | piacenza | unione automatica |
| 16 | bridgeadv.net | Bridge Adv · `fb3bb32f` | caserta | Bridgeadv · `d924ce78` | caserta | unione automatica |
| 17 | officinedigitaliitaliane.it | Officine Digitali Italiane · `86086f4c` | bergamo | Officine Digitali Italiane · `e1005d89` | bergamo | a mano |
| 18 | conceptio.it | Conceptio · `745e3393` | lucca | Conceptio · `e1ea5698` | novara ⚠ | unione automatica |
| 19 | treeweb.it | TreeWeb · `1f4d2e91` | avellino | TreeWeb · `e4e01d07` | avellino | unione automatica |
| 20 | feelstudio.it | Feelstudio · `b19c33dc` | venezia | Feelstudio · `ee3c446a` | milano ⚠ | unione automatica |
| 21 | studiocappello.it | Studio Cappello · `d9b2dd41` | roma | Studio Cappello · `ff7008cd` | venezia ⚠ | unione automatica |

## Query per rigenerare l'elenco

```sql
with base as (
  select id, title, citta, publish_status, created_at, note_curatore,
         lower(regexp_replace(regexp_replace(sito_web,'^https?://(www\.)?',''),'/.*$','')) dom
  from agencies
)
select s.dom, s.id draft_id, s.title draft, s.publish_status draft_stato,
       o.id originale_id, o.title originale, o.publish_status originale_stato
from base s
join base o on o.dom = s.dom and o.id <> s.id and o.created_at < s.created_at
where s.note_curatore like 'Scoutato da%'
order by s.publish_status, o.publish_status, s.dom;
```
