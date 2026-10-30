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
    adPicture: "Choose the picture for the ad, or switch the ad off.",
    adHref: "Paste the link where the ad should lead (it starts with https://).",
    sliderBackground: "Choose the background picture (1250x400).",
    sliderBackgroundMobile: "Choose the background picture for the mobile banner (600x500).",
    sliderBackgroundHref: "The background link looks wrong (it starts with https://), or leave it empty.",
    sliderMinSlides: (min: number, have: number) => `Add at least ${min} slide pictures (you have ${have}).`,
    sliderSharedHref: "The link for the slides looks wrong (it starts with https://), or leave it empty.",
    sliderSlideHref: (n: number) => `Slide ${n}: the link looks wrong (it starts with https://), or leave it empty.`,
    sliderLayout: (w: number, h: number) => `The slider does not fit on the ${w}x${h} background. Check position, size and the number of slides shown.`,
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
    adPicture: "Vali reklaami pilt või lülita reklaam välja.",
    adHref: "Kleebi link, kuhu reklaam peab viima (algab https://).",
    sliderBackground: "Vali taustapilt (1250x400).",
    sliderBackgroundMobile: "Vali mobiilibänneri taustapilt (600x500).",
    sliderBackgroundHref: "Tausta link tundub vale (algab https://) või jäta see tühjaks.",
    sliderMinSlides: (min: number, have: number) => `Lisa vähemalt ${min} slaidipilti (praegu on ${have}).`,
    sliderSharedHref: "Slaidide link tundub vale (algab https://) või jäta see tühjaks.",
    sliderSlideHref: (n: number) => `Slaid ${n}: link tundub vale (algab https://) või jäta see tühjaks.`,
    sliderLayout: (w: number, h: number) => `Slaider ei mahu ${w}x${h} taustale. Kontrolli asukohta, suurust ja nähtavate slaidide arvu.`,
    barLabel: "Kirjuta ribale tekst.",
    barHref: "Kleebi link, mille riba avab (algab https://).",
  },
};

export const messages = (lang: Lang) => text[lang];
