import merge from 'lodash.merge';

import { bookingResolver } from './Booking';
import { listingResolver } from './Listing';
import { userResolvers } from './User';
import { viewerResolvers } from './Viewer';

export const resolvers = merge(bookingResolver, listingResolver, userResolvers, viewerResolvers);
