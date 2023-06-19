# Supabase Langchain Chatbot Demo

To run this demo, you need to have:

1. An OpenAI account. If you don't have one, you can sign up for free at [openai.com](https://www.openai.com).
2. [Optional] A [Supabase account](https://app.supabase.io/register). Only needed if you want to use the hosted Supabase service.

## Setup

1. Clone this repository

```bash
git clone git@github.com:thorwebdev/langchain-chatbot-demo.git
```

2. Install dependencies

```bash
cd langchain-chatbot-demo
npm install
```

3. Start Supabase

```bash
supabase start
```

5. Create a `.env` file in the root directory of the project and add your API keys:

```
OPENAI_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
API_ROOT="http://localhost:3000"
```

When running Supabase locally you can run `supabase status` to get the local credentials.

6. [Optional] generate types (only needed after making db schema schanges)

```bash
npx supabase gen types typescript --local --schema public > src/types/supabase.ts
```

## Start the development server

```bash
npm run dev
```
