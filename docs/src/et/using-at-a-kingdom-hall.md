<!-- markdownlint-disable no-inline-html -->

# M³ kasutamine kuningriigisaalis {#using-m3-at-a-kingdom-hall}

Selles juhendis tutvustatakse teile **Meeting Media Manager (M³)** allalaadimist, installimist ja seadistamist kuningriigisaalis. Järgige neid samme, et tagada meedia sujuv näitamine koguduse koosolekute ajal.

## 1. Lae alla ja installi {#download-and-install}

<script setup>
  import { data } from './../../data/version.data.mts'
</script>

1. Lae alla oma operatsioonisüsteemi jaoks sobiv versioon:
   - **Windows:**
     - Enamiku Windowsi süsteemide jaoks laadige alla <a :href="data.win64">meeting-media-manager-[VERSION]-x64.exe</a>.
     - Vanemate 32-bitiste Windowsi süsteemide puhul laadige alla <a :href="data.win32">meeting-media-manager-[VERSION]-ia32.exe</a>.
     - Kaasaskantava versiooni kasutamiseks lae alla <a :href="data.winPortable">meeting-media-manager-[VERSION]-portable.exe</a>.
   - **macOS:**
     - **M-seeria (Apple Silicon)**: Laadige alla <a :href="data.macArm">meeting-media-manager-[VERSION]-arm64.dmg</a>.
     - **Inteli baasil Mac arvutid**: Download <a :href="data.macIntel">meeting-media-manager-[VERSION]-x64.dmg</a>.
   - **Linux:**
     - Lae alla <a :href="data.linux">meeting-media-manager-[VERSION]-x86_64.AppImage</a>.
2. Kui allalaadimise lingid ei tööta, külastage [M³ allalaadimise lehte](https://github.com/sircharlo/meeting-media-manager/releases/latest) ja laadige õige versioon käsitsi alla.
3. Ava paigaldusprogramm ja järgi ekraanil kuvatavaid juhiseid, et paigaldada M³.
4. Käivita M³.
5. Käi läbi seadistamisviisard.

### macOS ainult: lisasammud rakenduse installimiseks {#additional-steps-for-macos-users}

:::warning Hoiatus

Järgnev juhis on mõeldud macOS kasutajatele.

:::

Apple turvameetmete tõttu on vajalik teha mõned lisasammud, et kasutada M³ rakendust uuemates macOS arvutites.

Kirjuta järgmised kaks käsku "Terminal" rakenduses, et muuta M³-e paigaldamise asukohta:

```bash
codesign --force --deep --sign - "/Applications/Meeting Media Manager.app"
sudo xattr -r -d com.apple.quarantine "/Applications/Meeting Media Manager.app"
```

:::warning Hoiatus

MacOS kasutajana on sul vaja järgida neid kahte sammu iga kord, kui paigaldad või uuendad M³ rakendust.

:::

:::info Selgitus

Esimene käsk nö. allkirjastab rakenduse lähtekoodi. See on vajalik selleks, et vältida M³ tuvastamist tundmatu arendaja pahatahtliku rakendusena.

Teine käsk eemaldab karantiinilipu rakendusest. Karantiinilippu kasutatakse selleks, et hoiatada kasutajaid internetist alla laaditud potentsiaalselt pahatahtlike rakenduste eest.

:::

#### Alternatiivne meetod {#alternative-method-for-macos-users}

Kui teil ei õnnestu pärast kahe eelmise jaotise käsu sisestamist ikka veel M³ käivitada, proovige järgmist:

1. Avage macOS süsteemi **Privacy & Security** seaded.
2. Leidke kirje M³ ja klõpsake nuppu **Open anyway**.
3. Seejärel hoiatatakse teid uuesti ja antakse soovitus „mitte avada seda, kui te ei ole kindel, et see on pärit usaldusväärsest allikast“ Kliki **Open Anyway**.
4. Ilmub veel üks hoiatus, kus peate rakenduse käivitamiseks ennast autentimima.
5. M³ peaks nüüd edukalt käivituma.

Kui teil on pärast kõigi nende sammude järgimist endiselt probleeme, palun [avage probleem GitHubis](https://github.com/sircharlo/meeting-media-manager/issues/new). Anname endast parima, et aidata.

### ainult macOS: Veebisaidi esitluse taaskäivitamine pärast uuendusi {#screen-sharing-issues}

:::warning Hoiatus

Järgnev juhis on mõeldud macOS kasutajatele.

:::

Mõned macOS-i kasutajad on teatanud, et veebisaidi esitlus ei tööta enam pärast M³-i uuenduste paigaldamist.

Kui meediaaken on pärast M³ uuendamist veebilehe esitamisel must, proovige järgmisi samme:

1. Avage macOS süsteemi **Privacy & Security** seaded.
2. Mine **Screen Recording**.
3. Vali nimekirjast M³.
4. Kliki `-` (miinus) nuppu, et see eemaldada.
5. Kliki `+` (pluss) nuppu ja vali M³ "Applications" kaustast.
6. Sul võidakse paluda muudatuse rakendamiseks käivitada M³ uuesti.

Pärast neid samme peaks ekraani jagamine taas ootuspäraselt toimima.

:::tip Nõuanne

Need sammud on vabatahtlikud ja need võib vahele jätta, kui te ei kavatse veebilehe esitlusfunktsiooni kasutada. Teisest küljest, kui te kavatsete kasutada veebisaidi esitlusfunktsiooni, on soovitatav järgida neid samme pärast iga uuendust, et funktsioon toimiks ootuspäraselt.

:::

## 2. Seadistamiseviisard {#configuration-wizard}

### Lisa rakenduse keel {#app-display-language}

Kui käivitate M³'i esimest korda, palutakse teil valida oma eelistatud **rakenduse keel**. Vali keel, mida soovid, et M³ kasutajaliideses kasutataks.

:::tip Nõuanne

See ei pea olema sama keel, milles M³ meediat alla laadib. Meedia allalaadimise keel seadistatakse hilisemas etapis.

:::

### Profiili tüüp {#profile-type}

Järgmine samm on **profiili tüübi** valimine. Kuningriigi saali tavapärase koosoleku jaoks valige **Regulaarne**. Sellega seadistad paljud funktsioonid, mida tavaliselt kasutatakse koguduse koosolekutel.

:::warning Hoiatus

Sa peaksid valima **Muu** ainult siis, kui te lood profiili, mille puhul ei tohiks meediat automaatselt alla laadida. Selle profiili kasutamiseks tuleb meediafailid käsitsi importida. Seda tüüpi profiili kasutatakse peamiselt M³'i kasutamiseks teokraatlikes koolides, kogunemistel, kokkutulekutel ja muudel eriüritustel.

Profiiltüüpi **Muu** kasutatakse harva. \*\*Koguduse koosolekute ajal tavapäraseks kasutamiseks valige palun _Regulaarne_. \*\*

:::

### Automaatne koguduste otsing {#automatic-congregation-lookup}

M³ võib püüda automaatselt leida teie koguduse koosolekute ajakava, keele ja nime.

Selleks kasutage koguduse nime lahtri kõrval olevat nuppu **Koguduse otsing** ja sisestage vähemalt osa koguduse nimest ja linnast.

Kui õige kogudus on leitud ja valitud, täidab M³ eelnevalt kogu olemasoleva teabe, nagu teie koguduse **nimi**, **koosolekute keel** ja **koosolekute päevad ja kellaajad**.

:::info Märkus

See otsing kasutab Jehoova tunnistajate ametliku veebisaidi avalikult kättesaadavaid andmeid.

:::

### Koguduse andmete käsitsi sisestamine {#manual-entry-of-congregation-information}

Kui automaatne otsing ei leia teie kogudust, võite muidugi vajaliku teabe käsitsi sisestada. Viisard võimaldab teil vaadata ja/või sisestada oma koguduse **nimi**, **koosolekute keel** ning **koosolekute päevad ja kellaajad**.

### Laulude videote vahemällu salvestamine {#caching-videos-from-the-songbook}

Sulle antakse ka võimalus **salvestada kõik laulude videod**. See valik laeb eelnevalt alla kõik laulude videod, mis vähendab aega, mis kulub meediakanalite kättesaamiseks koosolekute jaoks tulevikus.

- **Plussid:** Koosolekumeedia on palju kiiremini kättesaadav.
- **Miinused:** Meedia vahemälu suurus suureneb märkimisväärselt, umbes 5 Gb võrra.

:::tip Nõuanne

Kui teie kuningriigi saalis on piisavalt salvestusruumi, on soovitatav **lülitada** see valik tõhususe ja tajutava jõudluse huvides.

:::

### OBS Studio seadistamine (valikuline) {#obs-studio-integration-configuration}

Kui teie kuningriigisaal kasutab **OBS Studio** hübriidkoosolekute edastamiseks Zoomi kaudu, saab M³ selle programmiga automaatselt teha koostööd. Seadistamise ajal saate seadistada koostöö OBS Studio'ga, sisestades järgmised andmed:

- **Port:** Pordi number, mida kasutatakse OBS Studio Websocket pluginaga ühenduse loomiseks.
- **Parool:** Parool, mida kasutatakse OBS Studio Websocket pluginaga ühendamiseks.
- **Stseenid:** OBSi stseenid, mida kasutatakse meediaesitluste ajal. Sul on vaja ühte stseeni, mis jäädvustab meediaakna või ekraani, ja ühte, mis näitab lava.

:::tip Nõuanne

Kui teie kogudus korraldab regulaarselt hübriidkoosolekuid, on **vägagi** soovitatav lubada koostöö OBS Studio'ga.

:::

## 3. Naudi M³ kasutamist {#enjoy-using-m3}

Kui seadistamisviisard on lõpule viidud, on M³ valmis aitama hallata ja esitada koguduse koosolekute meediat. Naudi rakenduse kasutamist! :tada:
