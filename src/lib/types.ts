import { Collection } from 'mongodb';

export enum LoginType {
  GitHub = 'GITHUB',
  Google = 'GOOGLE',
}

export interface Viewer {
  _id?: string;
  token?: string;
  avatar?: string;
  didRequest: boolean;
}

// MongoDB
export interface Database {
  users: Collection<User>;
}

export interface User {
  _id: string;
  token: string;
  name: string;
  avatar: string;
  contact: string;
}
