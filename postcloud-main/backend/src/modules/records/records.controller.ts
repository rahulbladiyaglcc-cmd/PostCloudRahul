import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  ParseIntPipe,
  Param,
  ParseFilePipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  MaxFileSizeValidator,
} from '@nestjs/common';
import type { Response } from 'express';
import { StepFiveDto } from './dto/step-five.dto';
import { StepFourDto } from './dto/step-four.dto';
import { StepOneDto } from './dto/step-one.dto';
import { StepSixDto } from './dto/step-six.dto';
import { StepThreeDto } from './dto/step-three.dto';
import { StepTwoDto } from './dto/step-two.dto';
import { RetryDocumentSearchIndexDto } from './dto/retry-document-search-index.dto';
import { RecordsService } from './services/records.service';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { FindRecordsQueryDto } from './dto/find-records-query.dto';
import { UploadInterceptor } from '../../shared/interceptors/file-upload.interceptor';
import { StoredObjectStream } from '../../shared/interfaces/stored-object.interface';
import { MimeTypeFileValidator } from '../../shared/validators/mime-type-file.validator';

@Controller('records')
export class RecordsController {
  constructor(private readonly recordsService: RecordsService) {}

  @Post('step/one')
  @UseInterceptors(ClassSerializerInterceptor)
  createStepOne(@Body() stepOneDto: StepOneDto) {
    return this.recordsService.createStepOne(stepOneDto);
  }

  @Post('step/two/:recordsId')
  createStepTwo(
    @Body() stepTwoDto: StepTwoDto,
    @Param('recordsId', ParseIntPipe) recordsId: number,
  ) {
    return this.recordsService.createStepTwo(stepTwoDto, recordsId);
  }

  @Post('step/three/:recordsId')
  createStepThree(
    @Body() stepThreeDto: StepThreeDto,
    @Param('recordsId', ParseIntPipe) recordsId: number,
  ) {
    return this.recordsService.createStepThree(stepThreeDto, recordsId);
  }

  @Post('step/four/:recordsId')
  createStepFour(
    @Body() stepFourDto: StepFourDto,
    @Param('recordsId', ParseIntPipe) recordsId: number,
  ) {
    return this.recordsService.createStepFour(stepFourDto, recordsId);
  }

  @Post('step/five/:recordsId')
  createStepFive(
    @Body() stepFiveDto: StepFiveDto,
    @Param('recordsId', ParseIntPipe) recordsId: number,
  ) {
    return this.recordsService.createStepFive(stepFiveDto, recordsId);
  }

  @Post('step/six/:recordsId')
  createStepSix(
    @Body() stepSixDto: StepSixDto,
    @Param('recordsId', ParseIntPipe) recordsId: number,
  ) {
    return this.recordsService.createStepSix(stepSixDto, recordsId);
  }

  @Post(':id/documents/upload')
  @UseInterceptors(UploadInterceptor('file'))
  uploadDocument(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }),
          new MimeTypeFileValidator({
            allowedMimeTypes: [
              'application/pdf',
              'image/png',
              'image/jpeg',
              'image/jpg',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ],
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.recordsService.uploadDocument(id, file);
  }

  @Get(':id/profile-image')
  async getProfileImage(
    @Param('id', ParseIntPipe) id: number,
    @Res() response: Response,
  ) {
    return this.streamObject(await this.recordsService.getProfileImage(id), response);
  }

  @Get(':id/document-uploads/:uploadId')
  async getDocumentUpload(
    @Param('id', ParseIntPipe) id: number,
    @Param('uploadId') uploadId: string,
    @Res() response: Response,
  ) {
    return this.streamObject(
      await this.recordsService.getDocumentUpload(id, uploadId),
      response,
    );
  }

  @Get(':id/documents/:documentId/file')
  async getDocumentFile(
    @Param('id', ParseIntPipe) id: number,
    @Param('documentId', ParseIntPipe) documentId: number,
    @Res() response: Response,
  ) {
    return this.streamObject(
      await this.recordsService.getDocumentFile(id, documentId),
      response,
      true,
    );
  }

  @Post('reopen/:id')
  @Roles(UserRole.ADMIN)
  reopen(@Param('id', ParseIntPipe) id: number) {
    return this.recordsService.reopen(id);
  }

  @Post(':id/documents/reembed')
  reembedDocuments(@Param('id', ParseIntPipe) id: number) {
    return this.recordsService.reembedDocuments(id);
  }

  @Post(':id/documents/search-index/retry')
  retryDocumentSearchIndex(
    @Param('id', ParseIntPipe) id: number,
    @Body() retryDto: RetryDocumentSearchIndexDto,
  ) {
    return this.recordsService.retryDocumentSearchIndex(
      id,
      retryDto.documentIds,
    );
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  findAll(@Query() query: FindRecordsQueryDto) {
    return this.recordsService.findAll(
      query.search,
      query.page,
      query.limit,
      query.sortBy,
      query.sortOrder,
      query.status,
    );
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.recordsService.findOnePublic(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.recordsService.remove(id);
  }

  private streamObject(
    object: StoredObjectStream,
    response: Response,
    download = false,
  ) {
    if (object.contentType) response.type(object.contentType);
    if (object.contentLength !== undefined) {
      response.setHeader('Content-Length', String(object.contentLength));
    }
    if (download && object.originalName) {
      response.attachment(object.originalName);
    }
    object.body.pipe(response);
  }
}
