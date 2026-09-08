import {
  ClassSerializerInterceptor,
  Controller,
  Body,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';

import { AppService } from './app.service';
import { Public } from './modules/auth/public.decorator';
import { UploadInterceptor } from './shared/interceptors/file-upload.interceptor';
import { OcrService } from './shared/services/ocr.service';
import { Throttle } from '@nestjs/throttler';
import { MimeTypeFileValidator } from './shared/validators/mime-type-file.validator';
import { StorageService } from './shared/services/storage.service';
import { TRANSIENT_BUCKET } from './shared/constants/storage.constants';
import { AuthenticatedRequest } from './modules/auth/types/express';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly ocrService: OcrService,
    private readonly storageService: StorageService,
  ) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('uploads/profile-staging')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseInterceptors(UploadInterceptor('file'), ClassSerializerInterceptor)
  async uploadProfileStaging(
    @Req() request: AuthenticatedRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new MimeTypeFileValidator({
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    const key = this.storageService.createProfileStagingKey(
      request.user.sub,
      file.originalname,
    );
    await this.storageService.upload(TRANSIENT_BUCKET, key, file);
    return {
      url: `/api/uploads/profile-staging/${key.split('/').pop()}`,
    };
  }

  @Get('uploads/profile-staging/:uploadId')
  async getProfileStaging(
    @Req() request: AuthenticatedRequest,
    @Param('uploadId') uploadId: string,
    @Res() response: Response,
  ) {
    const reference = this.storageService.toReference(
      TRANSIENT_BUCKET,
      `profile-staging/users/${request.user.sub}/${uploadId}`,
    );
    return this.streamStoredObject(reference, response);
  }

  @Post('extract/text')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @UseInterceptors(UploadInterceptor('file'), ClassSerializerInterceptor)
  extractText(
    @Req() request: AuthenticatedRequest,
    @Body('documentType') documentType: string | undefined,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new MimeTypeFileValidator({
            allowedMimeTypes: [
              'image/png',
              'image/jpeg',
              'image/jpg',
              'image/pjpeg',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.ocrService.uploadAndQueue(file, request.user.sub, documentType);
  }

  @Public()
  @Get('extract/text/status')
  getOcrStatus() {
    return this.ocrService.getServiceStatus();
  }

  @Get('extract/text/:jobId')
  async getResult(@Param('jobId') jobId: string) {
    const result = await this.ocrService.getJobResult(jobId);
    return { jobId, result };
  }

  private async streamStoredObject(reference: string, response: Response) {
    const object = await this.storageService.get(reference);
    if (object.contentType) response.type(object.contentType);
    if (object.contentLength !== undefined) {
      response.setHeader('Content-Length', String(object.contentLength));
    }
    object.body.pipe(response);
  }
}
