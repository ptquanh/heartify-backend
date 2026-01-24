import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CloudinaryService } from './cloudinary.service';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Cloudinary')
@ApiBearerAuth()
@Controller('cloudinary')
export class CloudinaryController {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @ApiOperation({
    summary: 'Get signed upload params for Cloudinary',
  })
  // @UseGuards(JwtAuthGuard) // bật khi có auth
  @Get('sign-upload')
  signUpload(
    @Query('folder') folder?: string,
  ) {
    return this.cloudinaryService.signUpload(
      folder || 'uploads',
    );
  }
}
