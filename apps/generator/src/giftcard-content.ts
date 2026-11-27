// Texts and starting points of the Gift card tool. The words on the card are Estonian, like the text of the banners, so they are
// here and not in the English / Estonian interface files. Change a sentence here and every card follows.
import type { CardCopy } from "@ohtuleht/templates";

// {email} and {date} are filled in from the form; those values are the ones that stand out on the card.
// The secret code has its own box on the card, with codeLabel above it.
export const COPY: CardCopy = {
  label: "KINKEKAART",
  codeLabel: "SALAKOOD",
  // the printed card: the order goes to an e-mail address; the address and the code are left out when they are empty.
  // (The picture for e-mail has no sentences: only the logo, how long and the code; the rest is in the letter.)
  print: {
    order: "Kinkekaardi tellimuse vormistamiseks palun saada andmed",
    withCode: " ja salakood",
    toEmail: " e-postile {email}",
    valid: "Kinkekaart kehtib kuni {date}",
  },
};

// Quick ways to write the second line of the header.
export const PERIODS = ["kolme kuu tellimus", "kuue kuu tellimus", "aastane tellimus"];
export const DEFAULT_PERIOD = "kuue kuu tellimus";

// The first line of the header that goes with each title (a starting point: the person can change it).
// Ids are the ones in packages/brand/titles.json.
export const HEADERS: Record<string, string> = {
  ohtuleht: "Õhtulehe digipaketi",
  "ol-ristsonad": "Õhtulehe ristsõnad",
  naisteleht: "Ajakirja Naisteleht",
  "naisteleht-55": "Ajakirja Naisteleht 55+",
  "naistelehe-ristsonad": "Naistelehe ristsõnad",
  teleleht: "Ajakirja Teleleht",
  tiiu: "Ajakirja Tiiu",
  "tiiu-ristsonad": "Tiiu ristsõnad",
  avesta: "Ajakirja Avesta",
  ristik: "Ristsõnaajakirja Ristik",
  miniristik: "Ristsõnaajakirja Miniristik",
  megaristik: "Ristsõnaajakirja Megaristik",
  meistriristik: "Ristsõnaajakirja Meistriristik",
  meluristik: "Ristsõnaajakirja Meluristik",
  sudoku: "Ristiku Sudoku",
  ripsik: "Ristsõnaajakirja Ripsik",
};

export const suggestHeader = (titleId: string, titleName: string, period = DEFAULT_PERIOD) => `${HEADERS[titleId] ?? titleName}\n${period}`;
