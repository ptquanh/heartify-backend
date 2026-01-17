import { IsEmail, IsOptional } from 'class-validator';

import {
  OnlyTextAndNumbers,
  TrimAndLowercase,
} from '@shared/decorators/sanitize-input';

export class VerifyUniquenessUserDTO {
  @IsOptional()
  @IsEmail()
  @TrimAndLowercase()
  email: string;

  @IsOptional()
  @OnlyTextAndNumbers({
    includeWhitespaces: false,
    onlyASCII: true,
    throwOnError: true,
    allowedSymbols: false,
  })
  @TrimAndLowercase()
  username: string;
}
