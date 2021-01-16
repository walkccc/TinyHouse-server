import node_geocoder from 'node-geocoder';

const options: node_geocoder.OpenStreetMapOptions = {
  provider: 'openstreetmap',
};
const geoCoder = node_geocoder(options);

interface GeocodeResult {
  country?: string;
  state?: string;
  city?: string;
}

export const OpenStreetMap = {
  geocode: async (location: string): Promise<GeocodeResult> => {
    const res = await geoCoder.geocode(location);
    const { country, state, city } = res[0];
    return { country, state, city };
  },
};
