import { createConnection } from 'typeorm';

import { BookingEntity, ListingEntity, UserEntity } from './entity';

import { Database } from '../lib/types';

export const connectDatabase = async (): Promise<Database> => {
  const connection = await createConnection();

  return {
    users: connection.getRepository(UserEntity),
    listings: connection.getRepository(ListingEntity),
    bookings: connection.getRepository(BookingEntity),
  };
};
