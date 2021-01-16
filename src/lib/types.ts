import { Collection, ObjectId } from 'mongodb';

export enum LoginType {
  GitHub = 'GITHUB',
  Google = 'GOOGLE',
}

export enum ListingType {
  Apartment = 'APARTMENT',
  House = 'HOUSE',
}

export interface Viewer {
  _id?: string;
  token?: string;
  avatar?: string;
  walletId?: string;
  didRequest: boolean;
}

// MongoDB
export interface Database {
  users: Collection<User>;
  listings: Collection<Listing>;
  bookings: Collection<Booking>;
}

export interface User {
  _id: string;
  token: string;
  name: string;
  avatar: string;
  contact: string;
  walletId?: string;
  income: number;
  listings: ObjectId[];
  bookings: ObjectId[];
  authorized?: boolean;
}

export interface Listing {
  _id: ObjectId;
  title: string;
  description: string;
  image: string;
  host: string; // user._id
  type: ListingType;
  address: string;
  country: string;
  state: string;
  city: string;
  bookings: ObjectId[];
  bookingsIndex: BookingsIndex;
  price: number;
  numOfGuests: number;
  authorized?: boolean;
}

export interface Booking {
  _id: ObjectId;
  listing: ObjectId;
  tenant: string; // user._id
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
