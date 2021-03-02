import crypto from 'crypto';

import { IResolvers } from 'apollo-server-express';
import { Request } from 'express';

import { CreateBookingArgs } from './types';

import { ListingEntity, UserEntity } from '../../../database/entity';
import { MyStripe as Stripe } from '../../../lib/api';
import { Booking, BookingsIndex, Database, Listing, User } from '../../../lib/types';
import { authorize } from '../../../lib/utils';

const resolveBookingsIndex = (
  bookingsIndex: BookingsIndex,
  checkInDate: string,
  checkOutDate: string
): BookingsIndex => {
  let dateCursor = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const newBookingsIndex = { ...bookingsIndex };

  while (dateCursor <= checkOut) {
    const y = dateCursor.getUTCFullYear();
    const m = dateCursor.getUTCMonth();
    const d = dateCursor.getUTCDate();

    if (!newBookingsIndex[y]) {
      newBookingsIndex[y] = {};
    }

    if (!newBookingsIndex[y][m]) {
      newBookingsIndex[y][m] = {};
    }

    if (!newBookingsIndex[y][m][d]) {
      newBookingsIndex[y][m][d] = true;
    } else {
      throw new Error("selected dates can't overlap dates that have already been booked");
    }

    dateCursor = new Date(dateCursor.getTime() + 86400000);
  }

  return newBookingsIndex;
};

export const bookingResolver: IResolvers = {
  Mutation: {
    createBooking: async (
      _root: undefined,
      { input }: CreateBookingArgs,
      { db, req }: { db: Database; req: Request }
    ): Promise<Booking> => {
      try {
        const { id, source, checkIn, checkOut } = input;

        // verify a logged in user is making the request
        const viewer = await authorize(db, req);

        if (!viewer) {
          throw new Error('viewer not found');
        }

        // find listing document from database
        const listing = await db.listings.findOne({ id });

        if (!listing) {
          throw new Error('listing not found');
        }

        // check that viewer is not booking his own listing
        if (listing.host === viewer.id) {
          throw new Error("viewer can't book own listing");
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        if (checkOutDate < checkInDate) {
          throw new Error("check out date can't be before check in date");
        }

        // create a new bookingsIndex for listing being booked
        const bookingsIndex = resolveBookingsIndex(listing.bookingsIndex, checkIn, checkOut);

        // get total price to charge
        const totalPrice =
          listing.price * ((checkOutDate.getTime() - checkInDate.getTime()) / 86400000 + 1);

        // get user document of host
        const host = await db.users.findOne({ id: listing.host });

        if (!host || !host.walletId) {
          throw new Error("the host either not found or isn't connected with Stripe");
        }

        // create stripe charge
        await Stripe.charge(totalPrice, source, host.walletId);

        const newBooking: Booking = {
          id: crypto.randomBytes(16).toString('hex'),
          listing: listing.id,
          tenant: viewer.id,
          checkIn,
          checkOut,
        };

        const insertedBooking = await db.bookings.create(newBooking).save();

        host.income = host.income + totalPrice;
        await host.save();

        viewer.bookings.push(insertedBooking.id);
        await viewer.save();

        listing.bookingsIndex = bookingsIndex;
        listing.bookings.push(insertedBooking.id);
        await listing.save();

        return insertedBooking;
      } catch (error) {
        throw new Error(`Failed to create a booking: ${error}`);
      }
    },
  },
  Booking: {
    listing: (
      booking: Booking,
      _args: undefined,
      { db }: { db: Database }
    ): Promise<ListingEntity | undefined> => {
      return db.listings.findOne({ id: booking.listing });
    },
    tenant: (
      booking: Booking,
      _args: undefined,
      { db }: { db: Database }
    ): Promise<UserEntity | undefined> => {
      return db.users.findOne({ id: booking.tenant });
    },
  },
};
