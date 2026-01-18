import { User } from '@modules/user/user.entity';

import { UserAuthProfile } from '@shared/interfaces';

export const extractUserPublicInfo = (
  user: User,
): UserAuthProfile & { hasPassword: boolean } => {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    hasPassword: !!user.password,
  };
};
