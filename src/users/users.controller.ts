import { Controller, Get, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FormDataRequest, MemoryStoredFile } from 'nestjs-form-data';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { ChekcAbilities } from 'src/core/decorators/abilities.decorator';
import { Action, AuthUser } from 'src/core/types/global.types';
import { ApiPaginatedResponse } from 'src/core/decorators/apiPaginatedResponse.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersQueryDto } from './dto/user-query.dto';
import { CurrentUser } from 'src/core/decorators/user.decorator';

@ApiBearerAuth()
@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }

  // Users are created from auth/register

  @Get()
  @ApiPaginatedResponse(CreateUserDto)
  @ChekcAbilities({ action: Action.READ, subject: 'all' })
  findAll(@Query() queryDto: UsersQueryDto) {
    return this.usersService.findAll(queryDto);
  }

  @Get('me')
  getMyInfo(@CurrentUser() currentUser: AuthUser) {
    return this.usersService.myDetails(currentUser);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @FormDataRequest({ storage: MemoryStoredFile })
  @Patch()
  @ApiConsumes('multipart/form-data')
  update(@Body() updateUserDto: UpdateUserDto, @CurrentUser() currentUser: AuthUser) {
    return this.usersService.update(updateUserDto, currentUser);
  }

  @Delete(':id')
  @ChekcAbilities({ action: Action.DELETE, subject: 'all' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

