import { Readable } from 'node:stream';

export interface StoredObjectReference {
  bucket: string;
  key: string;
}

export interface StoredObjectStream {
  body: Readable;
  contentLength?: number;
  contentType?: string;
  originalName?: string;
}
