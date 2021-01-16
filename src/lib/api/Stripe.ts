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
  charge: async (amount: number, source: string, stripeAccount: string): Promise<void> => {
    const res = await stripe.charges.create(
      {
        amount,
        currency: 'usd',
        source,
        application_fee_amount: Math.round(amount * 0.05),
      },
      { stripeAccount }
    );

    if (res.status !== 'succeeded') {
      throw new Error('failed to created charge with Stripe.');
    }
  },
};
