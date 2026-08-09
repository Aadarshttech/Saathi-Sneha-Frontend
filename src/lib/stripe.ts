import Stripe from 'stripe'

// Fail fast at startup if key is missing rather than at first payment attempt
const key = process.env.STRIPE_SECRET_KEY
if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set')

export const stripe = new Stripe(key)

// NPR is a two-decimal currency in Stripe — amount in paisa (NPR * 100)
export const toStripeAmount   = (npr: number): number => Math.round(npr * 100)
export const fromStripeAmount = (paisa: number): number => Math.round(paisa / 100)
