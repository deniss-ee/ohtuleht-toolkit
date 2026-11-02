// The new-employee guide (from the handbook "Uue töötaja käsiraamat"). One language: Estonian, like the handbook.
// This file is PUBLIC (the repository and the site are public), so it must never hold anything secret:
//  - names of people, personal e-mail addresses and phone numbers, passwords, Wi-Fi password, contract links and amounts
//    are written as [[key]]. The site shows a grey placeholder for them; the real value comes from the private backend after sign-in (docs/GUIDE.md).
//  - **text** is highlighted in brand red. [label](https://address) is a link.
// Screenshot captions (shot.caption) are notes for whoever takes the picture, so they are in English.

export type ShotRatio = "16:9" | "4:3" | "1:1";

export interface Step {
  title: string;
  text?: string;
  chips?: string[]; // a row of small labels (for example the names of magazines)
  tip?: string; // a one-line friendly note
  warn?: string; // a one-line careful note
  links?: { label: string; href: string }[];
  shot?: { id: string; caption: string; ratio?: ShotRatio };
  people?: { role: string; unit?: string; key: string }[]; // a role with the name behind a placeholder
}

export interface Topic {
  id: string;
  title: string;
  text: string; // one line on the start page
  icon: "hand" | "door" | "gift" | "users" | "laptop" | "life-buoy";
  steps: Step[];
}

// The things to do on the first days: a checklist on the start page (ticks are kept in the browser).
export const FIRST_DAYS: { id: string; text: string; topic: string }[] = [
  { id: "card", text: "Võta IT-osakonnast uksekaart ja aktiveeri see", topic: "esimene-paev" },
  { id: "login", text: "Logi arvutisse ja vaheta parool", topic: "arvuti-ja-kontod" },
  { id: "mail", text: "Ava e-post ja seadista mitmikautentimine", topic: "arvuti-ja-kontod" },
  { id: "intranet", text: "Tutvu intranetiga, rubriik „Oluline info töötajale“", topic: "esimene-paev" },
  { id: "onedrive", text: "Aktiveeri OneDrive ja logi sisse", topic: "arvuti-ja-kontod" },
  { id: "teams", text: "Leia Teamsist kolleegi kontakt", topic: "esimene-paev" },
];

export const TOPICS: Topic[] = [
  {
    id: "tere-tulemast",
    title: "Tere tulemast",
    text: "Kes me oleme, mida teeme ja kus asume.",
    icon: "hand",
    steps: [
      { title: "Kes me oleme", text: "**Õhtuleht Kirjastus** on Eesti üks suuremaid meediaettevõtteid. Anname välja Eesti suurima tiraažiga päevalehe **Õhtuleht** ning kirjastame alljärgnevaid **ajakirju**, **ristsõnu** ja **ristsõnakogumikke**." },
      { title: "Ajakirjad", chips: ["Tiiu", "Naisteleht", "Naisteleht 55+", "Avesta", "Teleleht"] },
      { title: "Ristsõnad", chips: ["Ristik", "Megaristik", "Miniristik", "Meistriristik", "Ripsik", "Tiiu Ristsõnad", "Õhtulehe Ristsõnad", "Meluristik", "Naistelehe Ristsõnad", "Sudoku"] },
      { title: "Ristsõnakogumikud", chips: ["Lihtsad Ristsõnad", "Taip", "Kullafond", "Taskuristsõnad"] },
      {
        title: "Veebiportaalid ja meeskond",
        text: "Meile kuuluvad ka veebiportaalid: **ohtuleht.ee** ja **tellimine.ee**. Meie meeskonnas töötab ligi 180 tippajakirjanikku ja valdkonna asjatundjat.",
        links: [
          { label: "ohtuleht.ee", href: "https://www.ohtuleht.ee" },
          { label: "tellimine.ee", href: "https://tellimine.ee" },
        ],
      },
      { title: "Tallinna kontor", text: "**Narva mnt 13, Tallinn**", shot: { id: "kaart-tallinn", caption: "Google Maps: Narva mnt 13, Tallinn, red pin in the centre, zoom so the crossing is visible.", ratio: "16:9" } },
      { title: "Tartu kontor", text: "**Küütri 14, Tartu**", shot: { id: "kaart-tartu", caption: "Google Maps: Küütri 14, Tartu, red pin in the centre, the river visible on the right.", ratio: "16:9" } },
      { title: "Ekspress Grupp", text: "AS Õhtuleht Kirjastus kuulub AS Ekspress Grupile.", links: [{ label: "Ekspress Grupi kohta", href: "https://egrupp.ee/grupist/ekspress-grupp" }] },
    ],
  },
  {
    id: "esimene-paev",
    title: "Esimene päev",
    text: "Uksekaart, intranet ja kolleegide kontaktid.",
    icon: "door",
    steps: [
      { title: "Uksekaart", text: "Uksekaardi saab **IT-osakonnast**. Soovi korral võib uksekaardina kasutada ka pressikaarti. Aktiveerimiseks pöördu IT-osakonda.", tip: "Töövälisel ajal ja nädalavahetustel pääseb majja keskmisest hooviuksest, kaardilugeja asub uksest paremal.", shot: { id: "uksekaart-lugeja", caption: "Photo: the card reader to the right of the central courtyard door (Narva mnt 13).", ratio: "4:3" } },
      { title: "Meie intranet", text: "Siit leiad kõik vajaliku info, sealhulgas ka blanketid ja kolleegide telefoninumbrid.", links: [{ label: "ohtuleht.sharepoint.com", href: "https://ohtuleht.sharepoint.com" }], shot: { id: "intranet-avaleht", caption: "Screenshot: the intranet front page (SharePoint), with the menu visible. Blur or crop any names.", ratio: "16:9" } },
      { title: "Tutvu rubriigiga", text: "Tutvu intranetis kindlasti rubriigiga **„Oluline info töötajale ja töötajate hüved“**.", shot: { id: "intranet-oluline-info", caption: "Screenshot: the intranet section 'Oluline info töötajale ja töötajate hüved'.", ratio: "16:9" } },
      { title: "Kolleegi kontakt Teamsis", text: "Teine hea koht, kust leida kaastöötaja kontakt, on **Teams**. Vajuta lihtsalt inimese nimele ning leiad sealt nii meiliaadressi kui telefoninumbri.", shot: { id: "teams-kontakt", caption: "Screenshot: a colleague's contact card in Teams (Overview tab). Use a test colleague or blur name, e-mail and phone.", ratio: "4:3" } },
    ],
  },
  {
    id: "huved",
    title: "Hüved ja toetused",
    text: "Digitellimus, soodustused, toetused ja muu oluline lühidalt.",
    icon: "gift",
    steps: [
      { title: "Digitellimus", text: "Tasuta meie väljaannete digitellimus. Kui soovid digipaketi lugemisõigust jagada 4 sõbra või pereliikmega, tuleb teha töö-meiliaadressiga digitellimus hinnaga **[[huve-digipakett-hind]]**.", links: [{ label: "Digitellimus (leping)", href: "[[huve-digitellimus-link]]" }, { label: "Digipakett", href: "[[huve-digipakett-link]]" }] },
      { title: "Väljaannete soodustus", text: "Meie ja Delfi Meedia väljaannete soodustus: perioodiliste väljaannete tellimustele kehtib soodustus **[[huve-soodustus]]** (ei kehti PML-ile ja kampaaniahinnale).", tip: "Delfi Meedia väljaannete soodustuse saamiseks kirjuta, et töötad Õhtuleht Kirjastuses." },
      { title: "Kuhu kirjutada", text: "Meie väljaandeid saad tellida aadressil **[[huve-tellimine-email]]**. Delfi Meedia väljaandeid aadressil **[[huve-delfi-email]]**." },
      { title: "Bolt", text: "Tööülesannete täitmiseks on võimalik kasutada Bolti taksoteenust ning tõuke- ja jalgrattaid." },
      { title: "Haiguspäevad", text: "Haiguspäevade hüvitamine alates teisest haiguspäevast **[[huve-haigus-protsent]]** töötasust." },
      { title: "Pressikaart", text: "Pressikaardi saab **büroojuhilt**. Vajalik dokumendifoto, mille teeb meie oma fotograaf.", shot: { id: "pressikaart", caption: "Photo or mock-up of a press card (blur the name and number).", ratio: "4:3" } },
      { title: "Autorikülg", text: "Kui tulid tööle toimetusse, siis lepi **video- ja fototoimetuse juhiga** kokku pildistamise aeg autorikülje jaoks. Kirjuta paarilauseline enesekirjeldus ja saada see **[[huve-autorikulg-kontakt]]**.", links: [{ label: "Näide autorikülje kohta", href: "https://www.ohtuleht.ee/autorid" }], shot: { id: "autorikulg", caption: "Screenshot: an author page on ohtuleht.ee (use the /autorid page of a colleague who agreed).", ratio: "16:9" } },
      { title: "Toetused tähtajatu töölepinguga töötajatele", text: "Kehtivad vaid tähtajatu töölepinguga töötajatele (kes ei ole suvereporterid, töötajate asendajad jm).", warn: "Summad on siin kohatäitjatega; täpsed summad on sisselogituna.", chips: ["Lapse sünnitoetus [[huve-synnitoetus]]", "I klassi õpilase lapsevanemale toetus [[huve-oppilastoetus]]", "Lisapuhkus (5 tööpäeva): kui puhkusele mineku hetkeks on tööstaaži vähemalt 1 aasta", "Matusetoetus [[huve-matusetoetus]]", "Nägemisvahendite soetamine [[huve-nagemine]]", "Stebby [[huve-stebby]] kuus"] },
    ],
  },
  {
    id: "kes-on-kes",
    title: "Kes on kes",
    text: "Ettevõtte ja osakondade struktuur.",
    icon: "users",
    steps: [
      { title: "Õhtuleht Kirjastuse struktuur", people: [{ role: "Juhtkonna esimees ja Õhtulehe peatoimetaja", key: "ps-juht" }, { role: "Levi- ja turundusdirektor", key: "ps-levi" }, { role: "Finantsjuht, juhtkonna liige", key: "ps-finants" }, { role: "Reklaamidirektor", key: "ps-reklaam" }, { role: "IT juht", key: "ps-it" }], shot: { id: "struktuur-kirjastus", caption: "Optional: a clean image of the company structure chart (no photos).", ratio: "4:3" } },
      { title: "Väljaannete peatoimetajad", people: [{ role: "Naisteleht, Naisteleht 55+, Avesta: tegevtoimetaja", key: "ps-naisteleht" }, { role: "Ristsõnakogumikud, Meistriristik, Sudoku, Õhtulehe Ristsõnad: peatoimetaja", key: "ps-rist1" }, { role: "Teleleht: peatoimetaja", key: "ps-teleleht" }, { role: "Tiiu: peatoimetaja", key: "ps-tiiu" }, { role: "Miniristik, Ripsik, Ristik, Megaristik, Naistelehe Ristsõnad, Meluristik, Tiiu Ristsõnad: peatoimetaja", key: "ps-rist2" }] },
      { title: "Õhtulehe struktuur", people: [{ role: "Tegevtoimetaja", key: "ol-tegev" }, { role: "Uudistetoimetus (uuriv)", unit: "uuriva toimetuse juht", key: "ol-uuriv" }, { role: "Uudistetoimetus (päevauudised)", unit: "päevauudiste juht", key: "ol-paev" }, { role: "Arvamustoimetus", unit: "juhataja", key: "ol-arvamus" }, { role: "Meelelahutustoimetus", unit: "juht", key: "ol-meelelahutus" }, { role: "Paberleht ja laupäevalehe toimetus", unit: "juhataja", key: "ol-paber" }, { role: "Sporditoimetus", unit: "juhataja", key: "ol-sport" }, { role: "Video- ja fototoimetus", unit: "juhataja asendaja", key: "ol-video" }, { role: "Noorteoimetus", unit: "noorteportaali projektijuht", key: "ol-noored" }] },
      { title: "Reklaamiosakond", people: [{ role: "Reklaamidirektor", key: "rk-direktor" }, { role: "Veebireklaami müügijuht", unit: "ohtuleht.ee", key: "rk-veeb" }, { role: "Printmeedia müügijuht", key: "rk-print" }, { role: "Erilahenduste loovjuht", key: "rk-loov" }, { role: "Teostusgrupi juht", key: "rk-teostus" }] },
      { title: "Levi- ja turundusosakond", people: [{ role: "Levi- ja turundusdirektor", key: "lt-direktor" }, { role: "Digiturunduse tiimijuht", unit: "ohtuleht.ee, sotsiaalmeedia", key: "lt-digi" }, { role: "Turundusjuht", unit: "Õhtuleht paber ja ajakirjad", key: "lt-turundus" }, { role: "Andmetöötluse tiimijuht", key: "lt-andmed" }, { role: "Müügijuht", unit: "jaemüük", key: "lt-muuk" }, { role: "Tootmisjuht", key: "lt-tootmine" }, { role: "Telemarketingi ja tellimiskeskuse juht", key: "lt-tellimus" }] },
      { title: "IT-osakond", people: [{ role: "IT juht", key: "it-juht" }, { role: "Veebiarendaja", key: "it-dev1" }, { role: "Veebiarendaja", key: "it-dev2" }, { role: "Büroojuht", key: "it-buroo" }] },
    ],
  },
  {
    id: "arvuti-ja-kontod",
    title: "Arvuti ja kontod",
    text: "Sisselogimine, parool, e-post, failid ja Wifi.",
    icon: "laptop",
    steps: [
      { title: "Kasutajanimi", text: "**eesnim(ed)** + **3 tähte perekonnanimest** + @oleht.ee", tip: "Täpse kasutajanime ütleb IT-osakond." },
      { title: "Algparool", text: "Esmasel sisselogimisel kasuta parooli **[[arvuti-algparool]]**. Parool tuleb vahetada kas esmasel arvutisse logimisel või aadressil parool.ohtuleht.ee.", warn: "Algparooli ei jaga me avalikult: see on sisselogituna näha.", links: [{ label: "parool.ohtuleht.ee", href: "https://parool.ohtuleht.ee" }], shot: { id: "parool-vahetus", caption: "Screenshot: the password change page (parool.ohtuleht.ee), empty fields.", ratio: "4:3" } },
      { title: "Hea parool", text: "Vähemalt **12 tähemärki**, sisaldab suur- ja väiketähti ning numbrit (või sümbolit). Ei tohi kasutada ees- ja perekonnanime, sünniaega ega muud kergesti ära arvatavat.", tip: "Hea parool võiks olla lihtsasti meelde jäetav, aga raskesti ära arvatav." },
      { title: "Parooli vahetus", text: "Konto parooli peab vahetama vähemalt 2 aasta möödudes või kui on kahtlus, et see võib olla lekkinud. Oma parooli ei tohi jagada kolleegiga ega kellegi kolmandaga. Töökoha arvutis saab vahetada klahvikombinatsiooniga **Ctrl+Alt+Del** valides „Muuda parooli“.", warn: "Parooli ei jaga mitte kunagi, ka mitte IT-le." },
      { title: "E-post", text: "Meiliaadress: **eesnimi.perekonnanimi@ohtuleht.ee**. Veebimeil: outlook.office365.com.", links: [{ label: "Veebimeil", href: "https://outlook.office365.com" }], tip: "Esmakordsel kasutamisel käivitub mitmikautentimise seadistamine. Tuleb seadistada kas mobiiltelefoni number või paigaldada telefoni spetsiaalne autentimisrakendus.", shot: { id: "mfa-seadistus", caption: "Screenshot: the Microsoft 'More information required' / authenticator setup screen. Blur any numbers.", ratio: "4:3" } },
      { title: "OneDrive", text: "Pilvesalvestusruum. Aktiveeri arvuti läbi OneDrive rakenduse. Soovitav sisse logida ning seadistada dokumentide, piltide ja töölaua varukoopiate tegemiseks.", warn: "Kindlasti tutvu dokumentidega: ohtuleht.sharepoint.com, Uuele töötajale.", shot: { id: "onedrive", caption: "Screenshot: the OneDrive backup settings (documents, pictures, desktop ticked).", ratio: "4:3" } },
      { title: "Pildipank ja CMS", text: "**Pildipank:** pildipank.ohtuleht.ee. **CMS, Õhtulehe sisuhaldus:** leigar.ohtuleht.ee.", links: [{ label: "Pildipank", href: "https://pildipank.ohtuleht.ee" }, { label: "CMS", href: "https://leigar.ohtuleht.ee" }] },
      { title: "Wifi", text: "Võrk: **[[arvuti-wifi-nimi]]**, parool **[[arvuti-wifi-parool]]**.", warn: "Wifi parooli ei näita me avalikult." },
      { title: "Mobiil", text: "Soovi korral võib võtta ettevõtte nimele. Kui on tegu Telia lepinguga, saab loovutada iseteenindus kaudu. Samuti kompenseerib ettevõte vajadusel töötajale kuni **[[arvuti-mobiil-summa]]** maksva mobiilitelefoni.", links: [{ label: "Telia iseteenindus", href: "https://iseteenindus.telia.ee/iseteenindus/mobiil/uv" }] },
      { title: "Õhtuleht.ee stiiliraamat", text: "Õhtuleht.ee veebi vormistusreeglid.", links: [{ label: "Stiiliraamat", href: "https://ohtuleht.sharepoint.com/SitePages/Ohtuleht.ee-stiiliraamat.aspx" }] },
    ],
  },
  {
    id: "it-tugi",
    title: "IT-tugi ja tarkvara",
    text: "Kust abi saab ja mida arvutisse tohib paigaldada.",
    icon: "life-buoy",
    steps: [
      { title: "Kes aitab", text: "IT-tuge osutab **Delfi meeskond**.", people: [{ role: "IT-tugi", key: "tugi-1" }, { role: "IT-tugi", key: "tugi-2" }, { role: "IT-tugi", key: "tugi-3" }, { role: "IT-tugi", key: "tugi-4" }, { role: "IT-tugi", key: "tugi-5" }] },
      { title: "Kontaktid", text: "E-post **[[tugi-email]]**, telefon **[[tugi-telefon]]**." },
      { title: "Kasutajaportaal", text: "Kirjuta IT-le kasutajaportaalis.", links: [{ label: "Kasutajaportaal", href: "https://egrupp.atlassian.net/servicedesk/customer/portals" }], shot: { id: "kasutajaportaal", caption: "Screenshot: the IT service desk portal start page.", ratio: "16:9" } },
      { title: "Kaugabi", text: "Kaugabi osutatakse **TeamViewer**i abil. Käivitamiseks on ikoon arvuti töölaual.", shot: { id: "teamviewer-ikoon", caption: "Screenshot: the desktop with the TeamViewer icon circled.", ratio: "16:9" } },
      { title: "Lubatud tarkvara", text: "Oma arvutisse tohib paigaldada:", chips: ["VideoLAN VLC", "LibreOffice", "Google Chrome", "Firefox", "ID-kaardi tarkvara RIA Open-EID", "FileZilla", "Acrobat Reader", "7-Zip", "Cisco AnyConnect"] },
      { title: "Software Center", text: "Programmide paigaldamiseks on arvutis tarkvara **„Software Center“**. Muude programmide paigaldamiseks pöördu IT-toe poole.", shot: { id: "software-center", caption: "Screenshot: the Software Center window with the list of programs.", ratio: "16:9" } },
    ],
  },
];

// Every [[key]] used above: what it is, so the private values can be filled in (docs/GUIDE.md lists them).
export const SECRET_KEYS = (() => {
  const keys = new Set<string>();
  const scan = (s?: string) => s?.replace(/\[\[([\w-]+)\]\]/g, (_, k: string) => (keys.add(k), ""));
  for (const t of TOPICS)
    for (const s of t.steps) {
      scan(s.text);
      scan(s.tip);
      scan(s.warn);
      s.chips?.forEach(scan);
      s.links?.forEach((l) => scan(l.href));
      s.people?.forEach((p) => keys.add(p.key));
    }
  return [...keys];
})();
