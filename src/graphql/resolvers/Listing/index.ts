import crypto from 'crypto';

import { IResolvers } from 'apollo-server-express';
import { Request } from 'express';

import {
  HostListingArgs,
  HostListingInput,
  ListingArgs,
  ListingsArgs,
  ListingsData,
  ListingsFilter,
  ListingsQuery,
  Order,
} from './types';

import { Cloudinary, OpenStreetMap } from '../../../lib/api';
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
        const listing = (await db.listings.findOne({ id })) as Listing;
        if (!listing) {
          throw new Error('listing not found');
        }

        const viewer = await authorize(db, req);
        if (viewer && viewer.id === listing.host) {
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

        let order: Order | null = null;

        if (filter) {
          if (filter === ListingsFilter.PRICE_LOW_TO_HIGH) {
            order = { price: 'ASC' };
          } else {
            order = { price: 'DESC' };
          }
        }

        const count = await db.listings.count(query);
        const listings = await db.listings.find({
          where: { ...query },
          order: { ...order },
          skip: page > 0 ? (page - 1) * limit : 0,
          take: limit,
        });

        data.total = count;
        data.result = listings;

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

        const imageUrl = await Cloudinary.upload(input.image);

        const newListing: Listing = {
          ...input,
          id: crypto.randomBytes(16).toString('hex'),
          image: imageUrl,
          host: viewer.id,
          address: `${city}, ${state}, ${country}`,
          country,
          state,
          city,
          bookings: [],
          bookingsIndex: {},
        };

        const insertedListing = await db.listings.create(newListing).save();

        viewer.listings.push(insertedListing.id);
        await viewer.save();

        return insertedListing;
      } catch (error) {
        throw new Error(`Failed to host listing: ${error}`);
      }
    },
  },
  Listing: {
    host: async (listing: Listing, _args: undefined, { db }: { db: Database }): Promise<User> => {
      const host = await db.users.findOne({ id: listing.host });
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

        const bookings = await db.bookings.findByIds(listing.bookings, {
          skip: page > 0 ? (page - 1) * limit : 0,
          take: limit,
        });

        data.total = listing.bookings.length;
        data.result = bookings;

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
