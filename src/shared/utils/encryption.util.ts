import * as crypto from 'crypto';
import { ENV_KEY } from 'src/shared/constants';

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EncryptionUtil {
  private readonly algorithm = 'aes-256-cbc';
  private readonly key: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyString = this.configService.get<string>(ENV_KEY.ENCRYPTION_KEY);
    if (!keyString) {
      throw new Error('ENCRYPTION_KEY is not defined in environment variables');
    }
    // Ensure key is 32 bytes. If source string is shorter/longer, hashing it is a safer way to ensure length.
    // Or assume user provides 32-char string. For safety here, we hash it to sha256 (32 bytes).
    this.key = crypto.createHash('sha256').update(keyString).digest();
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  }

  decrypt(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
