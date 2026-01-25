import { isEmail } from 'class-validator';
import { OperationResult } from 'mvc-common-toolkit';
import { Repository } from 'typeorm';

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { ERR_CODE } from '@shared/constants';
import {
  generateConflictResult,
  generateSuccessResult,
} from '@shared/helpers/operation-result.helper';
import { BaseCRUDService } from '@shared/services/base-crud.service';

import { User } from './entities/user.entity';
import { VerifyUniquenessUserDTO } from './user.dto';

@Injectable()
export class UserService extends BaseCRUDService<User> {
  protected logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    protected repo: Repository<User>,
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

  public async verifyUniquenessUser(
    dto: Partial<VerifyUniquenessUserDTO>,
  ): Promise<OperationResult> {
    const { email, username } = dto;

    if (email) {
      const existsEmail = await this.findOne({ email });

      if (existsEmail) {
        return generateConflictResult(
          'Email already exists',
          ERR_CODE.EMAIL_ALREADY_EXISTS,
        );
      }
    }

    if (username) {
      const existsUsername = await this.findOne({ username });

      if (existsUsername) {
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
