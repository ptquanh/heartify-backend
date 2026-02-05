import { HttpResponse } from 'mvc-common-toolkit';

import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import {
  ApiOperationError,
  ApiOperationSuccess,
} from '@shared/decorators/api-response';
import { RequestUser } from '@shared/decorators/request-user';
import { AuthGuard } from '@shared/guards/auth.guard';
import { ApplyRateLimiting } from '@shared/interceptors/rate-limiting.interceptor';
import { UserAuthProfile } from '@shared/interfaces';

import { UserProfile } from './entities/user-profile.entity';
import { User } from './entities/user.entity';
import { UpdateUserProfileDTO } from './user.dto';
import { UserService } from './user.service';

@ApiBearerAuth()
@ApiTags('User')
@Controller('users')
@UseGuards(AuthGuard)
@ApiOperationError()
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get My Profile',
    description: 'Retrieve current user profile',
  })
  @ApiOperationSuccess(User)
  async getProfile(
    @RequestUser() user: UserAuthProfile,
  ): Promise<HttpResponse> {
    return this.service.getProfile(user.id);
  }

  @Put('profile')
  @ApiOperation({
    summary: 'Update Profile',
    description:
      'Update user profile details (dob, gender, measurements, etc.)',
  })
  @ApplyRateLimiting(5)
  @ApiOperationSuccess(UserProfile)
  async updateProfile(
    @RequestUser() user: UserAuthProfile,
    @Body() dto: UpdateUserProfileDTO,
  ): Promise<HttpResponse> {
    return this.service.updateProfile(user.id, dto);
  }
}
