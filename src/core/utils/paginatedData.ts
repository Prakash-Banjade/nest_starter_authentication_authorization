import { SelectQueryBuilder } from "typeorm";
import { PageOptionsDto } from "../dto/pageOptions.dto";
import { PageMetaDto } from "../dto/pageMeta.dto";
import { PageDto } from "../dto/page.dto.";

export default async function paginatedData<T>(
    pageOptionsDto: PageOptionsDto,
    queryBuilder: SelectQueryBuilder<T>
) {
    const itemCount = await queryBuilder.getCount();
    const { entities } = await queryBuilder.getRawAndEntities();

    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    return new PageDto(entities, pageMetaDto);
}