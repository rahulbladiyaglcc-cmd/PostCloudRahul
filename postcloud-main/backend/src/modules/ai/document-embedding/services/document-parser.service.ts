import { Injectable } from '@nestjs/common';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { OcrService } from '../../../../shared/services/ocr.service';
import { ExtractedDocumentPage } from '../interfaces/extracted-document-page.interface';
import { StorageService } from '../../../../shared/services/storage.service';
import { TRANSIENT_BUCKET } from '../../../../shared/constants/storage.constants';

const MAX_SCANNED_PDF_PAGES = 10;
const MIN_MEANINGFUL_TEXT_LENGTH = 30;

type UnpdfModule = typeof import('unpdf');
type PdfDocument = Awaited<ReturnType<UnpdfModule['getDocumentProxy']>>;

@Injectable()
export class DocumentParserService {
  private unpdfModulePromise?: Promise<UnpdfModule>;

  constructor(
    private readonly ocrService: OcrService,
    private readonly storageService: StorageService,
  ) { }

  async extract(storageReference: string): Promise<ExtractedDocumentPage[]> {
    const parsed = this.storageService.parseReference(storageReference);
    if (!parsed) {
      throw new Error('Invalid stored document reference');
    }
    const extension = extname(parsed.key).toLowerCase();

    if (extension === '.pdf') {
      return this.parsePdf(storageReference);
    }
    // if its a direct image file, we can directly send it to OCR without going through the PDF parsing logic
    if (['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tif', '.tiff'].includes(extension)) {
      return [
        {
          pageNumber: 1,
          text: await this.ocrService.extractImageText(storageReference),
        },
      ];
    }

    throw new Error('Unsupported document type');
  }

  private async parsePdf(storageReference: string): Promise<ExtractedDocumentPage[]> {
    const unpdf = await this.loadUnpdfModule();
    const storedObject = await this.storageService.get(storageReference);
    const chunks: Buffer[] = [];
    for await (const chunk of storedObject.body) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const pdfBuffer = new Uint8Array(Buffer.concat(chunks));
    const pdf = await unpdf.getDocumentProxy(pdfBuffer);

    try {
      const pages = await this.parsePdfEmbeddedText(pdf, unpdf);
      if (this.hasMeaningfulText(pages)) {
        return pages;
      }

      this.ensureScannedPdfPageLimit(pdf.numPages);
      return this.parseScannedPdfToText(pdf, unpdf);
    } finally {
      await pdf.destroy();
    }
  }

  private async parsePdfEmbeddedText(
    pdf: PdfDocument,
    unpdf: UnpdfModule,
  ): Promise<ExtractedDocumentPage[]> {
    const result = await unpdf.extractText(pdf);

    return result.text.map((text, index) => ({
      pageNumber: index + 1,
      text: this.normalizeText(text),
    }));
  }

  private async parseScannedPdfToText(
    pdf: PdfDocument,
    unpdf: UnpdfModule,
  ): Promise<ExtractedDocumentPage[]> {
    const ocrPages: ExtractedDocumentPage[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const image = await unpdf.renderPageAsImage(pdf, pageNumber, {
        canvasImport: () => import('@napi-rs/canvas'),
        scale: 2,
      });
      const key = `document-pages/${randomUUID()}-${pageNumber}.png`;
      let reference: string | undefined;

      try {
        reference = await this.storageService.uploadBuffer(
          TRANSIENT_BUCKET,
          key,
          new Uint8Array(image),
          'image/png',
        );
        ocrPages.push({
          pageNumber,
          text: this.normalizeText(
            await this.ocrService.extractImageText(reference, true),
          ),
        });
      } finally {
        await this.storageService.delete(reference).catch(() => undefined);
      }
    }

    return ocrPages;
  }

  private ensureScannedPdfPageLimit(pageCount: number): void {
    if (pageCount > MAX_SCANNED_PDF_PAGES) {
      throw new Error(
        `Scanned PDFs are limited to ${MAX_SCANNED_PDF_PAGES} pages`,
      );
    }
  }

  private loadUnpdfModule(): Promise<UnpdfModule> {
    this.unpdfModulePromise ??= import('unpdf').then(async (unpdf) => {
      await unpdf.definePDFJSModule(
        () => import('pdfjs-dist/legacy/build/pdf.mjs'),
      );

      return unpdf;
    });

    return this.unpdfModulePromise;
  }

  private hasMeaningfulText(pages: ExtractedDocumentPage[]): boolean {
    return pages
      .map((page) => page.text)
      .join('')
      .replace(/[^A-Za-z0-9]/g, '').length >= MIN_MEANINGFUL_TEXT_LENGTH;
  }

  private normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}
