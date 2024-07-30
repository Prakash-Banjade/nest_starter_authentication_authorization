import path from 'path';
import fs from 'fs';
import { MemoryStoredFile } from 'nestjs-form-data';
import sharp from 'sharp';
import { generateSlug } from './generateSlug';

export interface ImageMetadata {
    width: number;
    height: number;
    memeType: string;
    size: number;
    url: string;
    format: string;
    space: string;
    originalName: string;
}

export async function getImageMetadata(memoryStoredFile: MemoryStoredFile) {
    // Use process.cwd() to get the root directory of the project, else nestjs will use the dist folder if you use __dirname
    const uploadDir = path.join(process.cwd(), 'public');
    const fileNameSlug = generateSlug(memoryStoredFile.originalName, true);

    let metadata: ImageMetadata = {
        width: 0,
        height: 0,
        memeType: memoryStoredFile.mimetype,
        size: memoryStoredFile.size,
        url: process.env.BACKEND_URL + '/api/upload/images/get-image/' + fileNameSlug + '.',
        format: '',
        space: '',
        originalName: memoryStoredFile.originalName
    }

    const md = await sharp(memoryStoredFile.buffer).metadata()
    metadata.width = md.width;
    metadata.height = md.height;
    metadata.format = md.format;
    metadata.space = md.space;
    metadata.url += md.format


    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileNameSlug + '.' + md.format);

    // Save the file to the file system
    fs.writeFile(filePath, memoryStoredFile.buffer, (err) => {
        if (err) {
            console.error('Error saving file:', err);
            throw err;
        } else {
            console.log('File saved successfully:', filePath);
        }
    });


    return metadata;
}
