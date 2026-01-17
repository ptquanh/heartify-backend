import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserSocialAccount } from './user-social-account.entity';
import { UserSocialAccountService } from './user-social-account.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSocialAccount])],
  providers: [UserSocialAccountService],
  exports: [UserSocialAccountService],
})
export class UserSocialAccountModule {}
