import { LoginType } from '../../../lib/types';

export interface LogInViaThirdPartyResponse {
  _id: string;
  name: string;
  avatar: string;
  contact: string;
}

export interface LogInArgs {
  input: {
    code: string;
    loginType: LoginType;
  } | null;
}
