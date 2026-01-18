import { Module } from '@nestjs/common';

import { UserSocialAccountModule } from '@modules/user-social-account/user-social-account.module';
import { UserModule } from '@modules/user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [UserModule, UserSocialAccountModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
