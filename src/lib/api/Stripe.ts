import Stripe from 'stripe';

const stripe = new Stripe(`${process.env.STRIPE_SECRET_KEY}`, {
  apiVersion: '2020-08-27',
});

export const MyStripe = {
  connect: async (code: string): Promise<Stripe.OAuthToken> => {
    return stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });
  },
};
