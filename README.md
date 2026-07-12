# 🌍 EcoSphere — Enterprise ESG Management Platform

EcoSphere is a comprehensive **Environmental, Social, and Governance (ESG)** management platform designed to help organizations track, report, and gamify their sustainability goals. Built for the modern enterprise, it combines robust analytics with employee engagement to drive real-world impact.

<img width="1918" height="897" alt="image" src="https://github.com/user-attachments/assets/c9067b88-bf01-46f3-b7a8-21c480faf8bf" />

---

## 🚀 Live Demo
- **Frontend:** [https://ecosphere-esg-platform.vercel.app](https://ecosphere-esg-platform.vercel.app)
- **Backend API:** [https://ecosphere-backend-xxxx.onrender.com](https://ecosphere-backend-xxxx.onrender.com)

### 🔑 Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| **System Admin** | `admin@ecosphere.com` | `Admin@123` |
| **Department Head** | `priya.sharma@ecosphere.com` | `Password@123` |
| **Employee** | `neha.gupta@ecosphere.com` | `Password@123` |

---

## 🛠️ Tech Stack & Architecture

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Node.js, Express, TypeScript, Zod validation
- **Database:** PostgreSQL (hosted on **Neon**)
- **ORM:** Prisma
- **Deployment:** Vercel (Frontend), Render (Backend)

---

## 🌟 Key Features

### 🌱 Environmental Tracking
- **Carbon Accounting:** Automate CO₂ emission calculations across fleet, manufacturing, and expenses.
- **Goal Management:** Set, track, and visualize department-level environmental targets.

### 🤝 Social & Employee Engagement
- **CSR Initiatives:** Organize and track participation in community and social responsibility activities.
- **Gamification Engine:** Employees earn XP and unlock badges for sustainability efforts.
- **Rewards Catalog:** Built with a safe, concurrency-locked redemption system (eliminating "lost updates" on limited stock).

### 🏛️ Governance & Compliance
- **Audit Trails:** Schedule and manage ESG compliance audits.
- **Policy Management:** Distribute and track employee acknowledgments for core corporate policies.
- **Dynamic Scoring:** Real-time computation of E, S, and G scores across departments.

---

## ⚙️ Core Engineering Highlights

### 🔒 Race-Condition Safe Reward Redemption
The reward redemption process utilizes Prisma's row-level locking (`FOR UPDATE`) to ensure transactional integrity when stock is limited, preventing concurrent overdrafts.

```typescript
// backend/src/utils/rewards.ts
prisma.$transaction(async (tx) => {
  const [reward] = await tx.$queryRaw<any[]>`SELECT * FROM "Reward" WHERE id = ${rewardId} FOR UPDATE`;
  if (!reward || reward.stock <= 0) throw new Error("Out of stock");
  // Execute points deduction and stock update safely
});
```

### 🏆 Event-Driven Badge System
Badges are intelligently evaluated and awarded automatically whenever employees log CSR activities, finish challenges, or accumulate enough XP, dispatching real-time notifications to the dashboard.

---

## 💻 Local Development Setup

### 1. Database Setup
We use **Neon** for PostgreSQL database hosting.
1. Create a free PostgreSQL instance on [Neon](https://neon.tech).
2. Copy your connection string (ensure it includes `?sslmode=require`).
3. Create `backend/.env` and add:
   ```env
   DATABASE_URL="your-neon-connection-string"
   JWT_SECRET="your-secure-jwt-secret"
   PORT=4000
   ```
<img width="1918" height="1011" alt="image" src="https://github.com/user-attachments/assets/25207e0c-b5d1-43ca-a126-a687e1cb98fc" />

### 2. Backend Initialization
```bash
cd backend
npm install
npx prisma db push
npx tsx prisma/seed.ts  # Seeds demo users, departments, and transactions
npm run dev
```

### 3. Frontend Initialization
In a separate terminal window:
```bash
cd frontend
npm install
# Create .env and set VITE_API_URL=http://localhost:4000/api
npm run dev
```

Visit `http://localhost:5173` to interact with the application.

---

*Sustainable by design. Built for impact.*
