import { Listing, ListingType, PagingData } from '../../../lib/types';

export enum ListingsFilter {
  PRICE_LOW_TO_HIGH = 'PRICE_LOW_TO_HIGH',
  PRICE_HIGH_TO_LOW = 'PRICE_HIGH_TO_LOW',
}

export interface ListingArgs {
  id: string;
}

export interface ListingsArgs {
  location: string | null;
  filter: ListingsFilter;
  limit: number;
  page: number;
}

export interface ListingsData extends PagingData<Listing> {
  region: string | null;
}

export interface ListingsQuery {
  country?: string;
  state?: string;
  city?: string;
}

export interface HostListingInput {
  title: string;
  description: string;
  image: string;
  type: ListingType;
  address: string;
  price: number;
  numOfGuests: number;
}

export interface HostListingArgs {
  input: HostListingInput;
}

export interface Order {
  price: 1 | 'ASC' | 'DESC' | -1 | undefined;
}
