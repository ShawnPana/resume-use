declare module 'pdf2json' {
  export default class PDFParser {
    constructor(context?: any, needRawText?: number);
    on(event: 'pdfParser_dataError', callback: (errData: any) => void): void;
    on(event: 'pdfParser_dataReady', callback: (pdfData: any) => void): void;
    parseBuffer(buffer: Buffer): void;
    loadPDF(path: string, verbosity?: number): void;
  }
}