import { FindOptionsSelect } from "typeorm";
import { Image } from "./image.entity";

export const imageSelectColumns: FindOptionsSelect<Image> = {
    id: true,
    url: true,
    width: true,
    height: true,
    size: true,
    format: true,
    space: true,
    originalName: true,
    name: true,
    memeType: true,
    createdAt: true,
    uploadedBy: {
        id: true,
        email: true,
        firstName: true,
        lastName: true
    }
}