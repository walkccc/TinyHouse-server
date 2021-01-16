import merge from 'lodash.merge';

import { listingResolver } from './Listing';
import { userResolvers } from './User';
import { viewerResolvers } from './Viewer';

export const resolvers = merge(listingResolver, userResolvers, viewerResolvers);
