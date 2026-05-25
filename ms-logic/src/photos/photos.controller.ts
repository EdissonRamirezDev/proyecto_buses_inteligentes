import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  NotFoundException,
} from '@nestjs/common';
import type { Response } from 'express';
import { PhotosService } from './photos.service';
import { CreatePhotoDto } from './dto/create-photo.dto';
import { UpdatePhotoDto } from './dto/update-photo.dto';
import { resolveBusPhotoPath, resolveIncidentPhotoPath } from './photo-file.util';

@Controller('photos')
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  @Post()
  create(@Body() createPhotoDto: CreatePhotoDto) {
    return this.photosService.create(createPhotoDto);
  }

  @Get()
  findAll() {
    return this.photosService.findAll();
  }

  @Get('files/buses/:filename')
  serveBusFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = resolveBusPhotoPath(filename);
      res.sendFile(filePath);
    } catch {
      throw new NotFoundException('Foto no encontrada');
    }
  }

  @Get('files/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    try {
      const filePath = resolveIncidentPhotoPath(filename);
      res.sendFile(filePath);
    } catch {
      throw new NotFoundException('Foto no encontrada');
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.photosService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePhotoDto: UpdatePhotoDto) {
    return this.photosService.update(+id, updatePhotoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.photosService.remove(+id);
  }
}
