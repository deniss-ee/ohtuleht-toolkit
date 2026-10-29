// Problem texts shown in the generator, in the languages of the interface.
export type Lang = "en" | "et";

const text = {
  en: {
    campaign: "Give the campaign a name.",
    minArticles: (min: number, have: number) => `Add at least ${min} articles (you have ${have}).`,
    title: (n: number) => `Article ${n}: write the title.`,
    url: (n: number) => `Article ${n}: paste the article link (it starts with https://).`,
    image: (n: number) => `Article ${n}: paste the picture address (it starts with https://).`,
    color: (n: number) => `Article ${n}: the label colour looks wrong.`,
    headerHref: "Paste the link where the header should lead (it starts with https://).",
    headerPicture: "Choose a header picture, or switch the header to a solid colour.",
    barLabel: "Write the text for the bar.",
    barHref: "Paste the link the bar should open (it starts with https://).",
  },
  et: {
    campaign: "Pane kampaaniale nimi.",
    minArticles: (min: number, have: number) => `Lisa vähemalt ${min} artiklit (praegu on ${have}).`,
    title: (n: number) => `Artikkel ${n}: kirjuta pealkiri.`,
    url: (n: number) => `Artikkel ${n}: kleebi artikli link (algab https://).`,
    image: (n: number) => `Artikkel ${n}: kleebi pildi aadress (algab https://).`,
    color: (n: number) => `Artikkel ${n}: sildi värv tundub vale.`,
    headerHref: "Kleebi link, kuhu päis peab viima (algab https://).",
    headerPicture: "Vali päise pilt või lülita päis ühevärviliseks.",
    barLabel: "Kirjuta ribale tekst.",
    barHref: "Kleebi link, mille riba avab (algab https://).",
  },
};

export const messages = (lang: Lang) => text[lang];
