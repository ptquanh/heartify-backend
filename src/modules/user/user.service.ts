import { isEmail } from 'class-validator';
import { OperationResult } from 'mvc-common-toolkit';
import { Repository } from 'typeorm';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ERR_CODE } from '@shared/constants';
import {
  generateConflictResult,
  generateNotFoundResult,
  generateSuccessResult,
} from '@shared/helpers/operation-result.helper';
import { BaseCRUDService } from '@shared/services/base-crud.service';

import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/user.entity';
import { UpdateUserProfileDTO, VerifyUniquenessUserDTO } from './user.dto';

@Injectable()
export class UserService extends BaseCRUDService<User> {
  protected logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    protected repo: Repository<User>,

    @InjectRepository(UserProfile)
    protected profileRepo: Repository<UserProfile>,
  ) {
    super(repo);
  }

  public getAge(dateOfBirth: Date): number {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  public async getProfile(userId: string): Promise<OperationResult<User>> {
    const user = await this.findOne(
      { id: userId },
      { relations: { profile: true } },
    );

    if (!user) {
      return generateNotFoundResult('User not found', ERR_CODE.USER_NOT_FOUND);
    }

    return generateSuccessResult(user);
  }

  public async updateProfile(
    userId: string,
    dto: UpdateUserProfileDTO,
  ): Promise<OperationResult<UserProfile>> {
    const user = await this.findOne(
      { id: userId },
      { relations: { profile: true } },
    );

    if (!user) {
      return generateNotFoundResult('User not found', ERR_CODE.USER_NOT_FOUND);
    }

    let profile = user.profile;

    if (!profile) {
      profile = this.profileRepo.create({
        userId,
      });
    }

    Object.assign(profile, dto);

    const saved = await this.profileRepo.save(profile);

    return generateSuccessResult(saved);
  }

  public async verifyUniquenessUser(
    dto: Partial<VerifyUniquenessUserDTO>,
  ): Promise<OperationResult> {
    const { email, username } = dto;

    if (email) {
      const count = await this.count({ email });

      if (count > 0) {
        return generateConflictResult(
          'Email already exists',
          ERR_CODE.EMAIL_ALREADY_EXISTS,
        );
      }
    }

    if (username) {
      const count = await this.count({ username });

      if (count > 0) {
        return generateConflictResult(
          'Username already exists',
          ERR_CODE.USERNAME_ALREADY_EXISTS,
        );
      }
    }

    return generateSuccessResult();
  }

  public async findUserByEmailOrUsername(usernameOrEmail: string) {
    const filter = isEmail(usernameOrEmail)
      ? { email: usernameOrEmail }
      : { username: usernameOrEmail };

    const user = await this.findOne(filter);

    return user;
  }
}
