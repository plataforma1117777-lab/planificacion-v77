const fs = require('fs');
const PizZip = require('pizzip');

const content = fs.readFileSync('secundaria_2.docx', 'binary');
const zip = new PizZip(content);
const xml = zip.file('word/document.xml').asText();

// A regex that matches {{...}} potentially spanning across multiple XML tags
// Docxtemplater variables are strictly {{ ... }} but MS Word injects <w:t> tags in between.
// A simpler way is to strip all tags to see the raw text.
const rawText = xml.replace(/<[^>]+>/g, '');
const matches = rawText.match(/\{\{.*?\}\}/g);

console.log("MARKERS FOUND IN sec 2:", Array.from(new Set(matches)));
