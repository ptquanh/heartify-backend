import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, UserProfile])],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
