# NextForge Questionnaire Backend

Node.js + Express backend that accepts and stores NextGenForge enrollment questionnaires.

## Setup

1. Install dependencies:
   - `npm install`
2. Create environment file:
   - `cp .env.example .env`
3. Set database connection:
   - Add `SUPABASE_URL` to `.env`
   - Add `SUPABASE_SERVICE_ROLE_KEY` to `.env`
   - Add `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY` to `.env`
   - Add `PAYSTACK_WEBHOOK_SECRET` to `.env` (or reuse secret key)
   - Set `APP_BASE_URL` for payment callback URLs
4. Start development server:
   - `npm run dev`

Default server URL: `http://localhost:4000`

## API Endpoints

- `GET /health` - Health check.
- `POST /api/questionnaires` - Submit a questionnaire.
- `GET /api/questionnaires` - List all submitted questionnaires.
- `GET /api/questionnaires/check-email?email=john@example.com` - Check whether an email already submitted.
- `POST /api/payments/initialize-card` - Initialize hosted/tokenized card payment with Paystack.
- `POST /api/payments/initialize-transfer` - Create dynamic virtual account details for transfer.
- `GET /api/payments/:reference` - Fetch and verify payment status by reference.
- `POST /api/payments/webhook` - Paystack webhook endpoint (signature-verified).

## Submit Payload

```json
{
  "email": "john@example.com",
  "fullName": "John Doe",
  "whatsappNumber": "+123456789",
  "expectations": "I want to build production AI apps",
  "whySelected": "I can commit and I execute fast",
  "referredBy": "Jane",
  "proficiencyLevel": "intermediate",
  "activeEnrollment": true,
  "trainedOnAgenticPlatform": "yes",
  "dailyCommitHours": "2hrs",
  "paymentOption": "full",
  "source": "landing_page"
}
```

## Allowed Enum Values

- `proficiencyLevel`: `beginner`, `intermediate`, `expert`
- `trainedOnAgenticPlatform`: `yes`, `no`, `maybe`
- `dailyCommitHours`: `1hr`, `2hrs`, `2hr+`
- `paymentOption`: `full`, `installment`, `team_of_three`

## Notes

- Submissions are stored in Supabase Postgres (`questionnaires` table).
- Use `data/questionnaires.sql` in Supabase SQL Editor to create/update the table schema.
- Use `data/payments.sql` in Supabase SQL Editor to create/update payment tracking schema.

## Render + Supabase Environment Variables (JS Client)

Set these on your Render service:

- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = service role key from Supabase project settings
- `PAYSTACK_SECRET_KEY` = Paystack secret key
- `PAYSTACK_PUBLIC_KEY` = Paystack public key (for frontend integration)
- `PAYSTACK_WEBHOOK_SECRET` = Paystack webhook verification secret (fallbacks to secret key)
- `APP_BASE_URL` = backend public URL used in callbacks
- `EMAIL_ONBOARDING_URL` = onboarding/join link inserted in success email
- `RESEND_API_KEY` = Resend API key
- `EMAIL_FROM` = sender email address
- `EMAIL_FROM_NAME` = sender display name
- `PORT` = (Render provides this automatically, but keeping it set is safe)

After questionnaire submission, backend checks if the same email already has a successful payment.
If yes, it sends the approval email from `src/email-templates/congratulations-approval/` and injects
`recipientName` using the registered user's saved `fullName`.

## Payment API Payloads

### Initialize Card Payment

`POST /api/payments/initialize-card`

```json
{
  "email": "john@example.com",
  "amount": 10000,
  "currency": "NGN",
  "callbackUrl": "https://your-frontend.com/payment/callback",
  "questionnaireId": "optional-questionnaire-id",
  "metadata": {
    "plan": "full"
  }
}
```

### Initialize Transfer Payment

`POST /api/payments/initialize-transfer`

```json
{
  "email": "john@example.com",
  "amount": 10000,
  "currency": "NGN",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+2348012345678",
  "preferredBank": "wema-bank",
  "questionnaireId": "optional-questionnaire-id",
  "metadata": {
    "plan": "installment"
  }
}
```

## Manual Curl Tests

Initialize card payment:

```bash
curl -X POST "http://localhost:4000/api/payments/initialize-card" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"john@example.com",
    "amount":10000,
    "currency":"NGN",
    "callbackUrl":"https://example.com/callback"
  }'
```

Initialize transfer payment (returns virtual account details):

```bash
curl -X POST "http://localhost:4000/api/payments/initialize-transfer" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"john@example.com",
    "amount":10000,
    "currency":"NGN",
    "firstName":"John",
    "lastName":"Doe",
    "phone":"+2348012345678",
    "preferredBank":"wema-bank"
  }'
```

Fetch payment status:

```bash
curl "http://localhost:4000/api/payments/<reference>"
```

Webhook URL to register in Paystack dashboard:

```text
https://nextgenforgebackend.onrender.com/api/payments/webhook
```
