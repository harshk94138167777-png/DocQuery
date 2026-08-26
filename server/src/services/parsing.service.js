const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const { parse: csvParse } = require('csv-parse/sync');

class ParsingService {
  static async parse(filePath, fileType) {
    switch (fileType) {
      case 'pdf': return this.parsePDF(filePath);
      case 'docx': return this.parseDOCX(filePath);
      case 'csv': return this.parseCSV(filePath);
      case 'txt': case 'md': return this.parseText(filePath);
      default: throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  static async parsePDF(filePath) {
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return { text: data.text, pageCount: data.numpages, wordCount: data.text.split(/\s+/).filter(Boolean).length, metadata: { author: data.info?.Author || null, title: data.info?.Title || null } };
  }

  static async parseDOCX(filePath) {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value, pageCount: null, wordCount: result.value.split(/\s+/).filter(Boolean).length, metadata: { author: null, title: null } };
  }

  static async parseCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = csvParse(content, { columns: true, skip_empty_lines: true });
    const text = records.map((row) => Object.entries(row).map(([k, v]) => `${k}: ${v}`).join('; ')).join('\n');
    return { text, pageCount: null, wordCount: text.split(/\s+/).filter(Boolean).length, metadata: { author: null, title: null } };
  }

  static async parseText(filePath) {
    const text = fs.readFileSync(filePath, 'utf-8');
    return { text, pageCount: null, wordCount: text.split(/\s+/).filter(Boolean).length, metadata: { author: null, title: null } };
  }
}

module.exports = { ParsingService };
