import { IResolvers } from 'apollo-server-express';

import { Booking, Database, Listing } from '../../../lib/types';

export const bookingResolver: IResolvers = {
  Booking: {
    id: (booking: Booking): string => {
      return booking._id.toHexString();
    },
    listing: (
      booking: Booking,
      _args: undefined,
      { db }: { db: Database }
    ): Promise<Listing | null> => {
      return db.listings.findOne({ _id: booking.listing });
    },
  },
};
