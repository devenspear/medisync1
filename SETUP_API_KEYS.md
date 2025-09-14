# 🔑 API Keys Setup Guide for MediSync

## Required API Keys for Full Functionality

### 1. **OpenAI GPT-4 API** 🤖
**Purpose:** Generate personalized meditation scripts

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create new API key
3. Copy the key (starts with `sk-`)
4. Update `.env.local`:
   ```env
   OPENAI_API_KEY=sk-your-actual-openai-key-here
   ```
**Cost:** ~$0.03 per 1K tokens (GPT-4)

---

### 2. **ElevenLabs Voice API** 🎙️
**Purpose:** High-quality AI voice synthesis for meditation guidance

#### Step 1: Get API Key
1. Go to [ElevenLabs](https://elevenlabs.io)
2. Sign up/login
3. Go to Profile → API Keys
4. Copy your API key
5. Update `.env.local`:
   ```env
   ELEVENLABS_API_KEY=your-elevenlabs-api-key-here
   ```

#### Step 2: Get Voice IDs
1. Go to [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
2. Select 4 voices (2 male, 2 female) suitable for meditation
3. Copy their Voice IDs
4. Update `lib/voiceSynthesis.ts` with real Voice IDs:

**Recommended Voices:**
- **Female Calm**: Sarah, Aria, or similar soothing female voices
- **Female Gentle**: Grace, Luna, or similar nurturing voices
- **Male Warm**: Adam, Sam, or similar reassuring male voices
- **Male Meditative**: Daniel, Chris, or similar calm male voices

**Current placeholders to replace:**
```typescript
'female-1': { id: 'EXAVITQu4vr4xnSDxMaL' } // Replace with real ID
'female-2': { id: 'AZnzlk1XvdvUeBnXmlld' } // Replace with real ID
'male-1': { id: 'VR6AewLTigWG4xSOukaG' }   // Replace with real ID
'male-2': { id: 'ErXwobaYiN019PkySvjV' }   // Replace with real ID
```

**Cost:** $5/month starter plan (30K characters)

---

### 3. **Stripe Payment API** 💳
**Purpose:** Premium subscription payments ($9.99/month, $79.99/year)

#### Step 1: Get Stripe Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Get your Publishable and Secret keys
3. Update `.env.local`:
   ```env
   STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
   ```

#### Step 2: Create Price IDs
1. In Stripe Dashboard → Products
2. Create "MediSync Premium" product
3. Add two prices:
   - Monthly: $9.99/month recurring
   - Yearly: $79.99/year recurring
4. Copy the Price IDs
5. Update `.env.local`:
   ```env
   STRIPE_MONTHLY_PRICE_ID=price_your-monthly-price-id
   STRIPE_YEARLY_PRICE_ID=price_your-yearly-price-id
   ```

#### Step 3: Set up Webhook
1. Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/payment/webhook`
3. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, etc.
4. Copy webhook secret
5. Update `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
   ```

---

## 🚀 Testing API Connections

### Test OpenAI:
```bash
curl -H "Authorization: Bearer YOUR_OPENAI_KEY" \
https://api.openai.com/v1/models
```

### Test ElevenLabs:
```bash
curl -H "xi-api-key: YOUR_ELEVENLABS_KEY" \
https://api.elevenlabs.io/v1/voices
```

### Test Stripe:
```bash
curl -u sk_test_YOUR_STRIPE_KEY: \
https://api.stripe.com/v1/products
```

---

## 💰 Cost Estimation (Monthly)

| **Service** | **Free Tier** | **Estimated Usage** | **Monthly Cost** |
|---|---|---|---|
| **OpenAI GPT-4** | $5 credit | ~1000 scripts/month | ~$30 |
| **ElevenLabs** | 10K chars/month | ~60K chars/month | ~$5-22 |
| **Stripe** | No fee | 2.9% + 30¢/transaction | ~Revenue based |
| **Vercel** | Hobby free | Pro usage | $20 |
| **Total** | | | **~$55-72/month** |

---

## 🔧 Environment Variables Summary

Your complete `.env.local` should look like:
```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-actual-openai-key-here

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_MONTHLY_PRICE_ID=price_your-monthly-price-id
STRIPE_YEARLY_PRICE_ID=price_your-yearly-price-id

# Authentication
JWT_SECRET=medisync-super-secret-jwt-key-change-in-production

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Vercel Postgres (auto-populated on deploy)
POSTGRES_URL="auto-populated-by-vercel"
```

Once these are configured, MediSync will have full functionality! 🎯