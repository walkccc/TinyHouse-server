import { IResolvers } from 'apollo-server-express';
import { Request } from 'express';
import { ObjectId } from 'mongodb';

import { ListingArgs, ListingsArgs, ListingsFilter } from './types';

import { Booking, Database, Listing, PagingArgs, PagingData, User } from '../../../lib/types';
import { authorize } from '../../../lib/utils';

export const listingResolver: IResolvers = {
  Query: {
    listing: async (
      _root: undefined,
      { id }: ListingArgs,
      { db, req }: { db: Database; req: Request }
    ): Promise<Listing> => {
      try {
        const listing = await db.listings.findOne({ _id: new ObjectId(id) });
        if (!listing) {
          throw new Error('listing not found');
        }

        const viewer = await authorize(db, req);
        if (viewer && viewer._id === listing.host) {
          listing.authorized = true;
        }

        return listing;
      } catch (error) {
        throw new Error(`Failed to query listing: ${error}`);
      }
    },
    listings: async (
      _root: undefined,
      { filter, limit, page }: ListingsArgs,
      { db }: { db: Database }
    ): Promise<PagingData<Listing>> => {
      try {
        const data: PagingData<Listing> = {
          total: 0,
          result: [],
        };

        const cursor = await db.listings
          .find({})
          .sort({ price: filter === ListingsFilter.PRICE_LOW_TO_HIGH ? 1 : -1 })
          .skip(page > 0 ? (page - 1) * limit : 0)
          .limit(limit);

        data.total = await cursor.count();
        data.result = await cursor.toArray();

        return data;
      } catch (error) {
        throw new Error(`Failed to query listings: ${error}`);
      }
    },
  },
  Listing: {
    id: (listing: Listing): string => {
      return listing._id.toHexString();
    },
    host: async (listing: Listing, _args: undefined, { db }: { db: Database }): Promise<User> => {
      const host = await db.users.findOne({ _id: listing.host });
      if (!host) {
        throw new Error('host not found');
      }
      return host;
    },
    bookings: async (
      listing: Listing,
      { limit, page }: PagingArgs,
      { db }: { db: Database }
    ): Promise<PagingData<Booking> | null> => {
      try {
        if (!listing.authorized) {
          return null;
        }

        const data: PagingData<Booking> = {
          total: 0,
          result: [],
        };

        const cursor = await db.bookings
          .find({
            _id: { $in: listing.bookings },
          })
          .skip(page > 0 ? (page - 1) * limit : 0)
          .limit(limit);

        data.total = await cursor.count();
        data.result = await cursor.toArray();

        return data;
      } catch (error) {
        throw new Error(`Failed to query listing bookings: ${error}`);
      }
    },
    bookingsIndex: (listing: Listing): string => {
      return JSON.stringify(listing.bookingsIndex);
    },
  },
};
