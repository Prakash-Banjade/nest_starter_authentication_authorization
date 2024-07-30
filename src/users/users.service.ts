import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Brackets, IsNull, Not, Or, Repository } from 'typeorm';
import paginatedData from 'src/core/utils/paginatedData';
import { UsersQueryDto } from './dto/user-query.dto';
import { AuthUser } from 'src/core/types/global.types';
import { ImagesService } from 'src/images/images.service';
import { Account } from 'src/accounts/entities/account.entity';
import { Deleted } from 'src/core/dto/query.dto';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(Account) private accountRepo: Repository<Account>,
    private readonly imagesService: ImagesService,
  ) { }

  async findAll(queryDto: UsersQueryDto) {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');
    const deletedAt = queryDto.deleted === Deleted.ONLY ? Not(IsNull()) : queryDto.deleted === Deleted.NONE ? IsNull() : Or(IsNull(), Not(IsNull()));

    queryBuilder
      .orderBy("user.createdAt", queryDto.order)
      .skip(queryDto.skip)
      .take(queryDto.take)
      .withDeleted()
      .where({ deletedAt })
      .leftJoin("user.account", "account")
      .leftJoin("user.profileImage", "profileImage")
      .andWhere(new Brackets(qb => {
        queryDto.role && qb.andWhere('account.role = :role', { role: queryDto.role });
      }))
      .select([
        'account.firstName', 'account.lastName', 'account.email', 'account.role', 'account.isVerified',
        'user.id', 'user.phone', 'user.gender', 'user.dob', 'profileImage.id', 'profileImage.url', 'user.createdAt',
      ])

    return paginatedData(queryDto, queryBuilder);
  }

  async myDetails(currentUser: AuthUser) {
    return await this.findOne(currentUser.userId);
  }

  async findOne(id: string) {
    const existingUser = await this.usersRepository.findOne({
      where: { id },
      relations: {
        account: true,
        profileImage: true,
      },
      select: {
        account: {
          password: false,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isVerified: true,
        },
        profileImage: {
          url: true,
          id: true,
        }
      }
    });
    if (!existingUser) throw new NotFoundException('User not found');

    return existingUser;
  }

  async update(updateUserDto: UpdateUserDto, currentUser: AuthUser) {
    const existingUser = await this.findOne(currentUser.userId);
    const existingAccount = await this.accountRepo.findOneBy({ id: currentUser.accountId });
    if (!existingAccount) throw new InternalServerErrorException('Unable to update the associated profile. Please contact support.');

    const profileImage = ((updateUserDto.profileImageId && existingUser.profileImage?.id !== updateUserDto.profileImageId) || !existingUser.profileImage)
      ? await this.imagesService.findOne(updateUserDto.profileImageId)
      : existingUser.profileImage;

    // update user
    Object.assign(existingUser, {
      ...updateUserDto,
    });

    // assign profile image
    existingUser.profileImage = profileImage;

    await this.usersRepository.save(existingUser);

    Object.assign(existingAccount, {
      firstName: updateUserDto.firstName || existingAccount.firstName,
      lastName: updateUserDto.lastName,
    })

    await this.accountRepo.save(existingAccount);

    return {
      message: 'Profile Updated'
    }
  }

  async remove(id: string) {
    const existingUser = await this.findOne(id);
    await this.usersRepository.softRemove(existingUser);

    return {
      message: 'User removed',
    }
  }
}
