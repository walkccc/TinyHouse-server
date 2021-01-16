import { IResolvers } from 'apollo-server-express';
import { Request } from 'express';
import { ObjectId } from 'mongodb';

import {
  HostListingArgs,
  HostListingInput,
  ListingArgs,
  ListingsArgs,
  ListingsData,
  ListingsFilter,
  ListingsQuery,
} from './types';

import { OpenStreetMap } from '../../../lib/api';
import {
  Booking,
  Database,
  Listing,
  ListingType,
  PagingArgs,
  PagingData,
  User,
} from '../../../lib/types';
import { authorize } from '../../../lib/utils';

const verifyHostListingInput = ({ title, description, type, price }: HostListingInput): void => {
  if (title.length > 100) {
    throw new Error('Listing title must < 100 characters.');
  }

  if (description.length > 5000) {
    throw new Error('Listing description must < 5000 characters.');
  }

  if (type !== ListingType.Apartment && type !== ListingType.House) {
    throw new Error('Listing type must be either Apartment or House.');
  }

  if (price < 0) {
    throw new Error('Listing price must be greater than 0.');
  }
};

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
      { location, filter, limit, page }: ListingsArgs,
      { db }: { db: Database }
    ): Promise<ListingsData> => {
      try {
        const data: ListingsData = {
          region: null,
          total: 0,
          result: [],
        };
        const query: ListingsQuery = {};

        if (location) {
          const { country, state, city } = await OpenStreetMap.geocode(location);

          if (city) query.city = city;
          if (state) query.state = state;
          if (country) {
            query.country = country;
          } else {
            throw new Error('country not found');
          }

          const cityText = city ? `${city}, ` : '';
          const stateText = state ? `${state}, ` : '';
          data.region = `${cityText}${stateText}${country}`;
        }

        const cursor = await db.listings
          .find(query)
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
  Mutation: {
    hostListing: async (
      _root: undefined,
      { input }: HostListingArgs,
      { db, req }: { db: Database; req: Request }
    ): Promise<Listing> => {
      try {
        verifyHostListingInput(input);

        const viewer = await authorize(db, req);
        if (!viewer) {
          throw new Error('viewer not found');
        }

        const { country, state, city } = await OpenStreetMap.geocode(input.address);
        if (!country || !state || !city) {
          throw new Error('invalid address input');
        }

        const insertResult = await db.listings.insertOne({
          ...input,
          _id: new ObjectId(),
          host: viewer._id,
          address: `${city}, ${state}, ${country}`,
          country,
          state,
          city,
          bookings: [],
          bookingsIndex: {},
        });

        const insertedListing: Listing = insertResult.ops[0];

        await db.users.updateOne(
          { _id: viewer._id },
          {
            $push: { listings: insertedListing._id },
          }
        );

        return insertedListing;
      } catch (error) {
        throw new Error(`Failed to host listing: ${error}`);
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
