import { Injectable, NotFoundException, Res } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Image } from './entities/image.entity';
import { Brackets, In, Like, Repository } from 'typeorm';
import { AuthUser, Roles } from 'src/core/types/global.types';
import { AccountsService } from 'src/accounts/accounts.service';
import { QueryDto } from 'src/core/dto/query.dto';
import paginatedData from 'src/core/utils/paginatedData';
import path from 'path';
import fs from 'fs';
import { Response } from 'express';
import { imageSelectColumns } from './entities/image-select-cols.config';
import axios from 'axios';
import sharp from 'sharp';
import { applySelectColumns } from 'src/core/utils/apply-select-cols';
import { getImageMetadata } from 'src/core/utils/getImageMetadata';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image) private imagesRepository: Repository<Image>,
    private readonly accountService: AccountsService
  ) { }

  async upload(createImageDto: CreateImageDto, currentUser: AuthUser) {
    const account = await this.accountService.findOne(currentUser.accountId);

    for (const uploadImage of createImageDto.images) {
      const metaData = await getImageMetadata(uploadImage);

      const newImage = this.imagesRepository.create({
        ...metaData,
        name: createImageDto.name || metaData.originalName,
        uploadedBy: account
      })

      await this.imagesRepository.save(newImage);
    }

    return {
      message: 'Image(s) Uploaded',
      count: createImageDto.images.length,
    }
  }

  async findAll(queryDto: QueryDto, currentUser: AuthUser) {
    const queryBuilder = this.imagesRepository.createQueryBuilder('image');

    queryBuilder
      .orderBy('image.createdAt', 'DESC')
      .skip(queryDto.skip)
      .take(queryDto.take)
      .leftJoin('image.uploadedBy', 'uploadedBy')
      .where(new Brackets(qb => {
        currentUser.role !== Roles.ADMIN && qb.where({ uploadedBy: { id: currentUser.accountId } })
      }))

    applySelectColumns(queryBuilder, imageSelectColumns, 'image');

    return paginatedData(queryDto, queryBuilder);
  }

  async findAllByIds(ids: string[]) {
    return await this.imagesRepository.find({
      where: {
        id: In(ids)
      }
    })
  }

  async findOne(id: string, currentUser?: AuthUser) {
    const existingImage = await this.imagesRepository.findOne({
      where: {
        id,
        uploadedBy: {
          id: currentUser?.accountId
        }
      },
    });
    if (!existingImage) throw new NotFoundException('Image not found');

    return existingImage
  }

  async serveImage(filename: string, @Res() res: Response) {
    const imagePath = path.join(process.cwd(), 'public', filename);

    fs.stat(imagePath, (err, stats) => {
      if (err) {
        if (err.code === 'ENOENT') {
          throw new NotFoundException('Image not found');
        } else {
          throw new Error(err.message);
        }
      }

      // Set appropriate headers
      res.setHeader('Content-Type', 'image/' + path.extname(filename).substring(1));
      res.setHeader('Content-Length', stats.size);

      // Stream the file to the response
      const readStream = fs.createReadStream(imagePath);
      readStream.pipe(res);
    });
  }

  async saveImageFromUrl(url: string) {
    // Fetch the image from the URL
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data);

    // Analyze the image with sharp
    const metadata = await sharp(imageBuffer).metadata();

    const image = this.imagesRepository.create({
      url,
      memeType: metadata.format,
      format: metadata.format,
      space: metadata.space,
      height: metadata.height,
      width: metadata.width,
      size: metadata.size,
      originalName: url.split('/').pop() || 'unknown', // Extract the file name from URL
    });

    return await this.imagesRepository.save(image);
  }

  async update(id: string, updateImageDto: UpdateImageDto, currentUser: AuthUser) {
    const existing = await this.findOne(id, currentUser?.role !== 'admin' ? currentUser : undefined);

    // update image name only
    existing.name = updateImageDto.name;

    const savedImage = await this.imagesRepository.save(existing);

    return {
      message: 'Image updated',
      image: {
        url: savedImage.url,
        id: savedImage.id
      }
    }
  }

  async remove(id: string, currentUser: AuthUser) {
    const existing = await this.findOne(id, currentUser);
    await this.imagesRepository.remove(existing);
    return {
      message: 'Image deleted successfully'
    }
  }
}
