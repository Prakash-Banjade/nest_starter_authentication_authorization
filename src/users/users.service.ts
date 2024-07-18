import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import paginatedData from 'src/core/utils/paginatedData';
import { UsersQueryDto } from './dto/user-query.dto';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>
  ) { }

  async findAll(queryDto: UsersQueryDto) {
    const queryBuilder = this.queryBuilder();

    queryBuilder
      .orderBy("user.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .select(["user.id", "user.name", "user.email", "user.role", "user.image", "user.createdAt", "user.updatedAt"]);

    return paginatedData(queryDto, queryBuilder);
  }

  async findOne(id: string) {
    const existingUser = await this.usersRepository.findOneBy({ id });
    if (!existingUser) throw new NotFoundException('User not found');

    return existingUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const existingUser = await this.findOne(id);

    // TODO: update logic here
    
    return await this.usersRepository.save(existingUser);
  }

  async remove(id: string) {
    const existingUser = await this.findOne(id);
    await this.usersRepository.softRemove(existingUser);

    return {
      message: 'User removed',
      user: {
        email: existingUser.email,
      }
    }
  }

  private queryBuilder() {
    return this.usersRepository.createQueryBuilder('user');
  }
}
