# EcoSphere — ESG Management Platform

An integrated ESG (Environmental, Social, Governance) management platform built for the Odoo Hiring Hackathon.

## Tech Stack
- **Frontend:** Vite + React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Database:** PostgreSQL

## Setup Instructions

### 1. Database Configuration
1. Open `backend/.env` (or rename `backend/.env.example` to `.env` if missing).
2. Set your `DATABASE_URL` to a valid PostgreSQL connection string. Example:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/ecosphere"
   ```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma migrate dev
npm run seed
npm run dev
```

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
The app will be running at [http://localhost:5173](http://localhost:5173).

## Demo Credentials
The `npm run seed` command automatically populates the database with demo departments, config, categories, and employees.

- **Admin Account:** `admin@ecosphere.com` (Password: `Admin@123`)
- **Department Head:** `priya.sharma@ecosphere.com` (Password: `Password@123`)
- **Employee:** `ananya.patel@ecosphere.com` (Password: `Password@123`)

## Architecture & Logic Highlights

### Reward Redemption Locking
The reward redemption process uses a row-locking transaction to prevent race conditions (the "lost update" problem where two users concurrently redeem the last remaining stock of a reward).

```typescript
// From backend/src/utils/rewards.ts
prisma.$transaction(async (tx) => {
  // 1. FOR UPDATE physically locks the row so concurrent requests wait.
  const [reward] = await tx.$queryRaw<any[]>`SELECT * FROM "Reward" WHERE id = ${rewardId} FOR UPDATE`;
  
  if (!reward || reward.stock <= 0) throw new Error("Out of stock");
  // 2. Validate points and deduct stock & balance
  // 3. This guarantees atomic, safe updates even under high concurrency.
});
```

### Automatic Badge Awarding
Badges are automatically awarded whenever a user earns XP, completes a CSR activity, or finishes a challenge. A shared `checkAndAwardBadges(employeeId)` utility re-evaluates the user's standing against the dynamic `Badge` criteria and creates in-app `Notifications` if an unlock rule is met.

### ESG Scoring Engine
Scores are dynamically computed across three dimensions (Env, Social, Gov) factoring in goal completion, activity participation rates, policy acknowledgments, and open compliance issues. This is orchestrated via an on-demand calculation triggered by the Admin on the Dashboard.

