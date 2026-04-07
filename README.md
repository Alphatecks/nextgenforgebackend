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
4. Start development server:
   - `npm run dev`

Default server URL: `http://localhost:4000`

## API Endpoints

- `GET /health` - Health check.
- `POST /api/questionnaires` - Submit a questionnaire.
- `GET /api/questionnaires` - List all submitted questionnaires.

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

## Render + Supabase Environment Variables (JS Client)

Set these on your Render service:

- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` = service role key from Supabase project settings
- `PORT` = (Render provides this automatically, but keeping it set is safe)
