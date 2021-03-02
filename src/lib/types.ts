import { Repository } from 'typeorm';

import { BookingEntity, ListingEntity, UserEntity } from '../database/entity';

export enum LoginType {
  GitHub = 'GITHUB',
  Google = 'GOOGLE',
}

export enum ListingType {
  Apartment = 'APARTMENT',
  House = 'HOUSE',
}

export interface Viewer {
  id?: string;
  token?: string;
  avatar?: string;
  walletId?: string | null;
  didRequest: boolean;
}

// PostgreSQL
export interface Database {
  users: Repository<UserEntity>;
  listings: Repository<ListingEntity>;
  bookings: Repository<BookingEntity>;
}

export interface User {
  id: string;
  token: string;
  name: string;
  avatar: string;
  contact: string;
  walletId?: string | null;
  income: number;
  listings: string[];
  bookings: string[];
  authorized?: boolean;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  image: string;
  host: string; // user.id
  type: ListingType;
  address: string;
  country: string;
  state: string;
  city: string;
  bookings: string[];
  bookingsIndex: BookingsIndex;
  price: number;
  numOfGuests: number;
  authorized?: boolean;
}

export interface Booking {
  id: string;
  listing: string;
  tenant: string; // user.id
  checkIn: string; // date in string
  checkOut: string; // date in string
}

export interface BookingsIndex {
  [key: string]: BookingsIndexYear;
}

export interface BookingsIndexYear {
  [key: string]: BookingsIndexMonth;
}

export interface BookingsIndexMonth {
  [key: string]: boolean;
}

export interface PagingArgs {
  limit: number;
  page: number;
}

export interface PagingData<T> {
  total: number;
  result: T[];
}
