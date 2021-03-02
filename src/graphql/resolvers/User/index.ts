import { IResolvers } from 'apollo-server-express';
import { Request } from 'express';

import { UserArgs } from './types';

import { Booking, Database, Listing, PagingArgs, PagingData, User } from '../../../lib/types';
import { authorize } from '../../../lib/utils';

export const userResolvers: IResolvers = {
  Query: {
    user: async (
      _root: undefined,
      { id }: UserArgs,
      { db, req }: { db: Database; req: Request }
    ): Promise<User> => {
      try {
        const user = (await db.users.findOne({ id })) as User;
        if (!user) {
          throw new Error('user not found');
        }

        const viewer = await authorize(db, req);
        if (viewer && viewer.id === user.id) {
          user.authorized = true;
        }

        return user;
      } catch (error) {
        throw new Error(`Failed to query user ${error}`);
      }
    },
  },
  User: {
    hasWallet: (user: User): boolean => {
      return Boolean(user.walletId);
    },
    income: (user: User): number | null => {
      return user.authorized ? user.income : null;
    },
    listings: async (
      user: User,
      { limit, page }: PagingArgs,
      { db }: { db: Database }
    ): Promise<PagingData<Listing> | null> => {
      try {
        const data: PagingData<Listing> = {
          total: 0,
          result: [],
        };

        const listings = await db.listings.findByIds(user.listings, {
          skip: page > 0 ? (page - 1) * limit : 0,
          take: limit,
        });

        data.total = user.listings.length;
        data.result = listings;

        return data;
      } catch (error) {
        throw new Error(`Failed to query user listings: ${error}`);
      }
    },
    bookings: async (
      user: User,
      { limit, page }: PagingArgs,
      { db }: { db: Database }
    ): Promise<PagingData<Booking> | null> => {
      try {
        if (!user.authorized) {
          return null;
        }

        const data: PagingData<Booking> = {
          total: 0,
          result: [],
        };

        const bookings = await db.bookings.findByIds(user.bookings, {
          skip: page > 0 ? (page - 1) * limit : 0,
          take: limit,
        });

        data.total = user.bookings.length;
        data.result = bookings;

        return data;
      } catch (error) {
        throw new Error(`Failed to query user bookings: ${error}`);
      }
    },
  },
};
