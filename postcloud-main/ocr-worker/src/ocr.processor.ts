import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import * as tesseract from 'tesseract.js';
import { promises as fs } from 'node:fs';
import { RedisService } from './redis.service';
import { StorageService } from './storage.service';
import {
  OCR_IDENTITY_EXTRACTION_JOB,
  OCR_IMAGE_TEXT_EXTRACTION_JOB,
} from './queue.constants';

type OcrJobData = {
  storageReference?: string;
  deleteAfterProcessing?: boolean;
  userId?: string;
  documentType?: IdentityDocumentType;
};

type IdentityDocumentType =
  | 'aadhaar'
  | 'voter_id'
  | 'driving_license'
  | 'unknown';

type IdentityDocumentParseResult = {
  documentType: IdentityDocumentType;
  confidence: number;
  fields: {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    aadhaarNumber?: string;
    electionID?: string;
    drivingLicense?: string;
    address?: string;
    pin?: string;
    issueDate?: string;
    validTill?: string;
  };
};

@Processor(process.env.OCR_QUEUE_NAME, { concurrency: 1 })
export class OcrProcessor extends WorkerHost {
  constructor(
    private redisService: RedisService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<OcrJobData>): Promise<any> {
    const { storageReference, deleteAfterProcessing, documentType } = job.data || {};
    const redis = this.redisService.getClient();
    let filePath: string | undefined;

    try {
      if (!storageReference) {
        throw new Error('Missing storage reference in OCR job payload');
      }

      filePath = await this.storageService.downloadToTempFile(storageReference);

      switch (job.name) {
        case OCR_IDENTITY_EXTRACTION_JOB: {
          console.log(`Processing OCR for file: ${filePath}`);
          const {
            data: { text },
          } = await tesseract.recognize(filePath, 'eng');

          const parsed = this.parseIdentityDocument(text, documentType);
          await redis.set(
            `ocr_result:${job.id}`,
            JSON.stringify({
              success: true,
              data: parsed,
            }),
            'EX',
            3600,
          );

          return parsed;
        }
        case OCR_IMAGE_TEXT_EXTRACTION_JOB: {
          console.log(`Processing RAG OCR for file: ${filePath}`);
          const {
            data: { text },
          } = await tesseract.recognize(filePath, 'eng');
          return { text: this.normalizeOcrText(text) };
        }
        default: {
          throw new Error(`Unsupported OCR job name: ${job.name}`);
        }
      }
    } catch (err) {
      console.error(`Error processing job ${job.id}:`, err);
      await redis.set(
        `ocr_result:${job.id}`,
        JSON.stringify({
          success: false,
          error:
            err instanceof Error ? err.message : 'Unexpected OCR worker error',
        }),
        'EX',
        3600,
      );
      return null;
    } finally {
      if (filePath) {
        await fs.unlink(filePath).catch(() => undefined);
      }
      if (deleteAfterProcessing && storageReference) {
        await this.storageService.delete(storageReference).catch((error) => {
          console.error(`Failed to delete transient OCR object for job ${job.id}:`, error);
        });
      }
    }
  }

  parseIdentityDocument(
    rawText: string,
    requestedType?: string,
  ): IdentityDocumentParseResult {
    const text = this.normalizeOcrText(rawText);
    const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
    const documentType =
      this.normalizeDocumentType(requestedType) ?? this.detectDocumentType(text);

    if (documentType === 'aadhaar') {
      return this.parseAadhaar(text, lines);
    }

    if (documentType === 'driving_license') {
      return this.parseDrivingLicense(text, lines);
    }

    if (documentType === 'voter_id') {
      return this.parseVoterId(text, lines);
    }

    return this.parseUnknownIdentityDocument(text, lines);
  }

  private parseAadhaar(
    text: string,
    lines: string[],
  ): IdentityDocumentParseResult {
    const aadhaarNumber = this.extractAadhaarNumber(text);
    const dateOfBirth =
      this.extractDateNearLabel(text, /(dob|date of birth|birth)/i) ??
      this.firstDate(text);
    const gender = this.firstMatch(text, /\b(male|female|transgender)\b/i);
    const name = this.extractName(lines);
    const pin = this.extractPin(text);
    const address = this.extractAddress(lines);

    return {
      documentType: 'aadhaar',
      confidence: this.scoreFields([aadhaarNumber, dateOfBirth, gender, name]),
      fields: {
        name,
        dateOfBirth,
        gender: this.normalizeGender(gender),
        aadhaarNumber,
        address,
        pin,
      },
    };
  }

  private parseVoterId(
    text: string,
    lines: string[],
  ): IdentityDocumentParseResult {
    const electionID = this.extractVoterIdNumber(text);
    const dateOfBirth =
      this.extractDateNearLabel(text, /(dob|date of birth|age as on|birth)/i) ??
      this.firstDate(text);
    const gender = this.firstMatch(text, /\b(male|female|transgender|m|f)\b/i);
    const name =
      this.extractValueAfterLabel(lines, /(elector'?s name|name)/i) ??
      this.extractName(lines);
    const address = this.extractAddress(lines);
    const pin = this.extractPin(text);

    return {
      documentType: 'voter_id',
      confidence: this.scoreFields([electionID, name, dateOfBirth, gender]),
      fields: {
        name,
        dateOfBirth,
        gender: this.normalizeGender(gender),
        electionID,
        address,
        pin,
      },
    };
  }

  private parseDrivingLicense(
    text: string,
    lines: string[],
  ): IdentityDocumentParseResult {
    const drivingLicense = this.extractDrivingLicenseNumber(text);
    const dateOfBirth =
      this.extractDateNearLabel(text, /(dob|date of birth|birth)/i) ??
      this.firstDate(text);
    const name =
      this.extractValueAfterLabel(lines, /(name|holder'?s name)/i) ??
      this.extractName(lines);
    const address = this.extractAddress(lines);
    const pin = this.extractPin(text);
    const issueDate = this.extractDateNearLabel(text, /(issue|doi|issued on)/i);
    const validTill = this.extractDateNearLabel(text, /(valid|validity|valid till|expires)/i);

    return {
      documentType: 'driving_license',
      confidence: this.scoreFields([drivingLicense, name, dateOfBirth]),
      fields: {
        name,
        dateOfBirth,
        drivingLicense,
        address,
        pin,
        issueDate,
        validTill,
      },
    };
  }

  private parseUnknownIdentityDocument(
    text: string,
    lines: string[],
  ): IdentityDocumentParseResult {
    const aadhaarNumber = this.extractAadhaarNumber(text);
    const drivingLicense = this.extractDrivingLicenseNumber(text);
    const electionID = this.extractVoterIdNumber(text);
    const name = this.extractName(lines);
    const dateOfBirth = this.firstDate(text);
    const gender = this.firstMatch(text, /\b(male|female|transgender|m|f)\b/i);

    return {
      documentType: this.detectDocumentType(text),
      confidence: this.scoreFields([
        aadhaarNumber || drivingLicense || electionID,
        name,
        dateOfBirth,
      ]),
      fields: {
        name,
        dateOfBirth,
        gender: this.normalizeGender(gender),
        aadhaarNumber,
        drivingLicense,
        electionID,
        address: this.extractAddress(lines),
        pin: this.extractPin(text),
      },
    };
  }

  private normalizeOcrText(rawText: string): string {
    return rawText
      .replace(/\r/g, '\n')
      .replace(/[|]/g, 'I')
      .replace(/SIO/g, 'S/O')
      .replace(/DIO/g, 'D/O')
      .replace(/WIO/g, 'W/O')
      .replace(/[^\x20-\x7E\n]/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();
  }

  private normalizeDocumentType(
    documentType?: string,
  ): IdentityDocumentType | undefined {
    const normalized = documentType?.toLowerCase().replace(/[\s-]+/g, '_');

    if (!normalized) {
      return undefined;
    }

    if (['aadhaar', 'aadhar', 'adhar'].includes(normalized)) {
      return 'aadhaar';
    }

    if (['voter_id', 'election_id', 'epic', 'id_card'].includes(normalized)) {
      return 'voter_id';
    }

    if (
      ['driving_license', 'driving_licence', 'driver_license', 'dl'].includes(
        normalized,
      )
    ) {
      return 'driving_license';
    }

    return undefined;
  }

  private detectDocumentType(text: string): IdentityDocumentType {
    if (this.extractAadhaarNumber(text) || /aadha+a?r|aadhar|adhar/i.test(text)) {
      return 'aadhaar';
    }

    if (/driving\s+licen[cs]e|transport\s+department|\bDL\s*No/i.test(text)) {
      return 'driving_license';
    }

    if (/election\s+commission|elector|voter|epic/i.test(text)) {
      return 'voter_id';
    }

    return 'unknown';
  }

  private extractName(lines: string[]): string | undefined {
    const blockedWords =
      /government|india|authority|unique|identification|election|commission|transport|department|licen[cs]e|card|dob|birth|male|female|address|valid/i;

    return lines.find((line) => {
      const cleaned = line.replace(/[^A-Za-z ]/g, '').trim();
      return (
        cleaned.length >= 5 &&
        cleaned.length <= 60 &&
        cleaned.split(/\s+/).length >= 2 &&
        /^[A-Za-z ]+$/.test(cleaned) &&
        !blockedWords.test(cleaned)
      );
    });
  }

  private extractValueAfterLabel(
    lines: string[],
    label: RegExp,
  ): string | undefined {
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!label.test(line)) {
        continue;
      }

      const sameLineValue = line.split(/[:\-]/).slice(1).join('-').trim();
      if (sameLineValue) {
        return sameLineValue;
      }

      return lines[index + 1];
    }

    return undefined;
  }

  private extractAddress(lines: string[]): string | undefined {
    const startIndex = lines.findIndex((line) =>
      /(address|house|h\.?\s*no|s\/o|d\/o|w\/o|po\b|post|district|state|village|street)/i.test(
        line,
      ),
    );

    if (startIndex === -1) {
      return undefined;
    }

    return lines
      .slice(startIndex, startIndex + 6)
      .join(', ')
      .replace(/,+/g, ',')
      .replace(/\s+,/g, ',')
      .trim();
  }

  private extractPin(text: string): string | undefined {
    return this.firstMatch(text, /\b\d{6,7}\b/)?.substring(0, 6);
  }

  private extractAadhaarNumber(text: string): string | undefined {
    const normalizedText = text
      .replace(/[Oo]/g, '0')
      .replace(/[Il]/g, '1')
      .replace(/[^\d\n -]/g, ' ');
    const match = this.firstMatch(
      normalizedText,
      /(?:^|[^\d])(\d{4}[\s-]*\d{4}[\s-]*\d{4})(?:[^\d]|$)/,
    );
    const digits = match?.replace(/\D/g, '');

    if (!digits || digits.length !== 12) {
      return undefined;
    }

    return digits;
  }

  private extractDrivingLicenseNumber(text: string): string | undefined {
    return this.firstMatch(
      text,
      /\b[A-Z]{2}[\s-]?\d{2}[\s-]?\d{4}[\s-]?\d{7}\b/i,
    )?.replace(/[\s-]/g, '').toUpperCase();
  }

  private extractVoterIdNumber(text: string): string | undefined {
    return this.firstMatch(text, /\b[A-Z]{3}[\s-]?\d{7}\b/i)
      ?.replace(/[\s-]/g, '')
      .toUpperCase();
  }

  private extractDateNearLabel(text: string, label: RegExp): string | undefined {
    const lines = text.split('\n');
    const datePattern = /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/;

    for (const line of lines) {
      if (label.test(line)) {
        return this.firstMatch(line, datePattern);
      }
    }

    return undefined;
  }

  private firstDate(text: string): string | undefined {
    return this.firstMatch(text, /\b\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}\b/);
  }

  private firstMatch(text: string, regex: RegExp): string | undefined {
    return text.match(regex)?.[0];
  }

  private normalizeGender(gender?: string): string | undefined {
    const normalized = gender?.toLowerCase();

    if (!normalized) {
      return undefined;
    }

    if (normalized === 'm' || normalized === 'male') {
      return 'Male';
    }

    if (normalized === 'f' || normalized === 'female') {
      return 'Female';
    }

    if (normalized === 'transgender') {
      return 'Other';
    }

    return undefined;
  }

  private scoreFields(values: Array<string | undefined>): number {
    const filled = values.filter(Boolean).length;
    return Number((filled / values.length).toFixed(2));
  }
}
