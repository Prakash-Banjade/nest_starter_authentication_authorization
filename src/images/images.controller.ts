import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res } from '@nestjs/common';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { AuthUser } from 'src/core/types/global.types';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FormDataRequest } from 'nestjs-form-data';
import { CurrentUser } from 'src/core/decorators/user.decorator';
import { QueryDto } from 'src/core/dto/query.dto';
import { Response } from 'express';
import { Public } from 'src/core/decorators/setPublicRoute.decorator';

@ApiBearerAuth()
@ApiTags('Upload Images')
@Controller('images') // route-path: /upload/images
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) { }

  @Post()
  @FormDataRequest()
  upload(@Body() createImageDto: CreateImageDto, @CurrentUser() currentUser: AuthUser) {
    return this.imagesService.upload(createImageDto, currentUser);
  }

  @Get()
  findAll(@Query() queryDto: QueryDto, @CurrentUser() currentUser: AuthUser) {
    return this.imagesService.findAll(queryDto, currentUser);
  }

  @Public()
  @Get('get-image/:slug')
  getImage(@Param("slug") slug: string, @Res() res: Response, @CurrentUser() currentUser?: AuthUser) {
    return this.imagesService.serveImage(slug, res);
  }

  // @Get(':id')
  // findOne(@Param('id') id: string, @Res() res: Response) {
  //   return this.imagesService.findOne(id);
  // }

  @Patch(':id')
  @FormDataRequest()
  update(@Param('id') id: string, @Body() updateImageDto: UpdateImageDto, @CurrentUser() currentUser: AuthUser) {
    return this.imagesService.update(id, updateImageDto, currentUser);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() currentUser: AuthUser) {
    return this.imagesService.remove(id, currentUser);
  }
}
