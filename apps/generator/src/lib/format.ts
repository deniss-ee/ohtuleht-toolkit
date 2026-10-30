// Human size of a file: "420 KB" or "1.9 MB".
export const formatSize = (bytes: number) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

// Date stamp for the names of generated files, in the style of the existing banner folders: "30oct26".
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
export const dateStamp = (d = new Date()) => `${String(d.getDate()).padStart(2, "0")}${MONTHS[d.getMonth()]}${String(d.getFullYear()).slice(2)}`;

// Every banner and other generated file gets the date in its name, just before the extension: "campaign_1250x400_30oct26.zip".
export const stampedName = (stem: string, ext: string) => `${stem}_${dateStamp()}.${ext}`;
