import * as crypto from 'crypto';

export class CryptoHelper {
  public static generateFilterHash(data: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
}
