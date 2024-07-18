import { Controller, Get, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FormDataRequest, MemoryStoredFile } from 'nestjs-form-data';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { ChekcAbilities } from 'src/core/decorators/abilities.decorator';
import { Action } from 'src/core/types/global.types';
import { ApiPaginatedResponse } from 'src/core/decorators/apiPaginatedResponse.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersQueryDto } from './dto/user-query.dto';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly abilityFactory: CaslAbilityFactory
  ) { }

  // Users are created from auth/register

  @Get()
  @ApiPaginatedResponse(CreateUserDto)
  findAll(@Query() queryDto: UsersQueryDto) {
    return this.usersService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @FormDataRequest({ storage: MemoryStoredFile })
  @Patch(':id')
  @ApiConsumes('multipart/form-data')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
