import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...\n');

  // ─── Step 1: Clear all tables in correct order ────
  // Deletes must respect foreign key constraints.
  // Child tables (those with FK references) must be deleted before parent tables.
  console.log('🗑️  Clearing existing data...');
  await prisma.notification.deleteMany();
  await prisma.rewardRedemption.deleteMany();
  await prisma.employeeBadge.deleteMany();
  await prisma.policyAcknowledgement.deleteMany();
  await prisma.complianceIssue.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.departmentScore.deleteMany();
  await prisma.challengeParticipation.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.employeeParticipation.deleteMany();
  await prisma.csrActivity.deleteMany();
  await prisma.carbonTransaction.deleteMany();
  await prisma.environmentalGoal.deleteMany();
  await prisma.emissionFactor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.eSGPolicy.deleteMany();
  await prisma.eSGConfig.deleteMany();
  // Must nullify department heads before deleting employees (circular FK)
  await prisma.department.updateMany({ data: { headId: null } });
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  console.log('   ✅ All tables cleared.\n');

  // ─── Step 2: Create default ESG Config ────────────
  console.log('⚙️  Creating ESG Config...');
  const esgConfig = await prisma.eSGConfig.create({
    data: {
      envWeight: 0.4,
      socialWeight: 0.3,
      govWeight: 0.3,
      autoEmissionCalcEnabled: false,
      evidenceRequiredEnabled: true,
      badgeAutoAwardEnabled: true,
    },
  });
  console.log(`   ✅ ESG Config created (id: ${esgConfig.id})\n`);

  // ─── Step 3: Create departments ───────────────────
  console.log('🏢 Creating departments...');
  const opsDept = await prisma.department.create({
    data: {
      name: 'Operations',
      code: 'OPS',
      employeeCount: 0,
      status: 'ACTIVE',
    },
  });

  const engDept = await prisma.department.create({
    data: {
      name: 'Engineering',
      code: 'ENG',
      parentId: opsDept.id, // Engineering is a child of Operations
      employeeCount: 0,
      status: 'ACTIVE',
    },
  });
  console.log(`   ✅ Operations (id: ${opsDept.id})`);
  console.log(`   ✅ Engineering (id: ${engDept.id}, parent: Operations)\n`);

  // ─── Step 4: Create employees ─────────────────────
  console.log('👥 Creating employees...');

  // Hash passwords — admin gets a different password
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const defaultPasswordHash = await bcrypt.hash('Password@123', 10);

  // 1 ADMIN
  const admin = await prisma.employee.create({
    data: {
      name: 'System Admin',
      email: 'admin@ecosphere.com',
      passwordHash: adminPasswordHash,
      departmentId: opsDept.id,
      role: 'ADMIN',
      xp: 0,
      pointsBalance: 500,
      status: 'ACTIVE',
    },
  });
  console.log(`   ✅ ADMIN: ${admin.email}`);

  // 2 DEPT_HEADs (one per department)
  const opsHead = await prisma.employee.create({
    data: {
      name: 'Priya Sharma',
      email: 'priya.sharma@ecosphere.com',
      passwordHash: defaultPasswordHash,
      departmentId: opsDept.id,
      role: 'DEPT_HEAD',
      xp: 250,
      pointsBalance: 150,
      status: 'ACTIVE',
    },
  });
  console.log(`   ✅ DEPT_HEAD (OPS): ${opsHead.email}`);

  const engHead = await prisma.employee.create({
    data: {
      name: 'Rahul Verma',
      email: 'rahul.verma@ecosphere.com',
      passwordHash: defaultPasswordHash,
      departmentId: engDept.id,
      role: 'DEPT_HEAD',
      xp: 300,
      pointsBalance: 200,
      status: 'ACTIVE',
    },
  });
  console.log(`   ✅ DEPT_HEAD (ENG): ${engHead.email}`);

  // 7 EMPLOYEEs spread across departments
  const emp1 = await prisma.employee.create({
    data: {
      name: 'Ananya Patel',
      email: 'ananya.patel@ecosphere.com',
      passwordHash: defaultPasswordHash,
      departmentId: opsDept.id,
      role: 'EMPLOYEE',
      xp: 120,
      pointsBalance: 80,
      status: 'ACTIVE',
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      name: 'Vikram Singh',
      email: 'vikram.singh@ecosphere.com',
      passwordHash: defaultPasswordHash,
      departmentId: opsDept.id,
      role: 'EMPLOYEE',
      xp: 75,
      pointsBalance: 45,
      status: 'ACTIVE',
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      name: 'Neha Gupta',
      email: 'neha.gupta@ecosphere.com',
      passwordHash: defaultPasswordHash,
      departmentId: opsDept.id,
      role: 'EMPLOYEE',
      xp: 500,
      pointsBalance: 300,
      status: 'ACTIVE',
    },
  });

  const emp4 = await prisma.employee.create({
    data: {
      name: 'Arjun Nair',
      email: 'arjun.nair@ecosphere.com',
      passwordHash: defaultPasswordHash,
      departmentId: engDept.id,
      role: 'EMPLOYEE',
      xp: 200,
      pointsBalance: 120,
      status: 'ACTIVE',
    },
  });

  const emp5 = await prisma.employee.create({
    data: {
      name: 'Kavitha Rajan',
      email: 'kavitha.rajan@ecosphere.com',
      passwordHash: defaultPasswordHash,
      departmentId: engDept.id,
      role: 'EMPLOYEE',
      xp: 95,
      pointsBalance: 60,
      status: 'ACTIVE',
    },
  });

  const emp6 = await prisma.employee.create({
    data: {
      name: 'Suresh Kumar',
      email: 'suresh.kumar@ecosphere.com',
      passwordHash: defaultPasswordHash,
      departmentId: engDept.id,
      role: 'EMPLOYEE',
      xp: 50,
      pointsBalance: 30,
      status: 'ACTIVE',
    },
  });

  const emp7 = await prisma.employee.create({
    data: {
      name: 'Divya Menon',
      email: 'divya.menon@ecosphere.com',
      passwordHash: defaultPasswordHash,
      departmentId: engDept.id,
      role: 'EMPLOYEE',
      xp: 180,
      pointsBalance: 100,
      status: 'ACTIVE',
    },
  });

  console.log(`   ✅ 7 employees created: ${emp1.email}, ${emp2.email}, ${emp3.email}, ${emp4.email}, ${emp5.email}, ${emp6.email}, ${emp7.email}\n`);

  // ─── Step 5: Update department heads & employee counts ──
  console.log('🔗 Assigning department heads...');
  await prisma.department.update({
    where: { id: opsDept.id },
    data: {
      headId: opsHead.id,
      employeeCount: 4, // admin + opsHead + emp1 + emp2 + emp3 = 5, but admin is separate; counting: opsHead, emp1, emp2, emp3, admin = 5
    },
  });
  // Operations has: admin, opsHead, emp1, emp2, emp3 = 5 employees
  await prisma.department.update({
    where: { id: opsDept.id },
    data: { employeeCount: 5 },
  });

  await prisma.department.update({
    where: { id: engDept.id },
    data: {
      headId: engHead.id,
      employeeCount: 5, // engHead + emp4 + emp5 + emp6 + emp7 = 5 employees
    },
  });
  console.log(`   ✅ Operations head: ${opsHead.name}`);
  console.log(`   ✅ Engineering head: ${engHead.name}\n`);

  // ─── Step 6: Create categories ────────────────────
  console.log('📂 Creating categories...');

  // 3 CSR categories
  const csrCat1 = await prisma.category.create({
    data: { name: 'Community Service', type: 'CSR', status: 'ACTIVE' },
  });
  const csrCat2 = await prisma.category.create({
    data: { name: 'Environmental Cleanup', type: 'CSR', status: 'ACTIVE' },
  });
  const csrCat3 = await prisma.category.create({
    data: { name: 'Education & Mentorship', type: 'CSR', status: 'ACTIVE' },
  });

  // 3 CHALLENGE categories
  const chalCat1 = await prisma.category.create({
    data: { name: 'Energy Saving', type: 'CHALLENGE', status: 'ACTIVE' },
  });
  const chalCat2 = await prisma.category.create({
    data: { name: 'Waste Reduction', type: 'CHALLENGE', status: 'ACTIVE' },
  });
  const chalCat3 = await prisma.category.create({
    data: { name: 'Sustainable Transport', type: 'CHALLENGE', status: 'ACTIVE' },
  });

  console.log(`   ✅ CSR categories: ${csrCat1.name}, ${csrCat2.name}, ${csrCat3.name}`);
  console.log(`   ✅ Challenge categories: ${chalCat1.name}, ${chalCat2.name}, ${chalCat3.name}\n`);

  // ─── Step 7: Create emission factors ──────────────
  console.log('🏭 Creating emission factors...');

  const ef1 = await prisma.emissionFactor.create({
    data: { activityType: 'Electricity', unit: 'kWh', co2PerUnit: 0.42, status: 'ACTIVE' },
  });
  const ef2 = await prisma.emissionFactor.create({
    data: { activityType: 'Diesel Fuel', unit: 'litre', co2PerUnit: 2.68, status: 'ACTIVE' },
  });
  const ef3 = await prisma.emissionFactor.create({
    data: { activityType: 'Business Travel (Air)', unit: 'km', co2PerUnit: 0.255, status: 'ACTIVE' },
  });
  const ef4 = await prisma.emissionFactor.create({
    data: { activityType: 'Waste to Landfill', unit: 'kg', co2PerUnit: 0.58, status: 'ACTIVE' },
  });
  const ef5 = await prisma.emissionFactor.create({
    data: { activityType: 'Water Consumption', unit: 'cubic_m', co2PerUnit: 0.344, status: 'ACTIVE' },
  });

  console.log(`   ✅ 5 emission factors: ${ef1.activityType}, ${ef2.activityType}, ${ef3.activityType}, ${ef4.activityType}, ${ef5.activityType}\n`);

  // ─── Step 8: Create badges ────────────────────────
  console.log('🏅 Creating badges...');

  const badge1 = await prisma.badge.create({
    data: {
      name: 'First Step',
      description: 'Complete your first CSR activity',
      unlockRuleType: 'CSR_COUNT',
      unlockRuleValue: 1,
      icon: '🌱',
    },
  });
  const badge2 = await prisma.badge.create({
    data: {
      name: 'Green Warrior',
      description: 'Accumulate 500 XP through eco-friendly actions',
      unlockRuleType: 'XP_THRESHOLD',
      unlockRuleValue: 500,
      icon: '⚔️',
    },
  });
  const badge3 = await prisma.badge.create({
    data: {
      name: 'Community Champion',
      description: 'Complete 5 CSR activities',
      unlockRuleType: 'CSR_COUNT',
      unlockRuleValue: 5,
      icon: '🏆',
    },
  });
  const badge4 = await prisma.badge.create({
    data: {
      name: 'Challenge Master',
      description: 'Complete 10 sustainability challenges',
      unlockRuleType: 'CHALLENGE_COUNT',
      unlockRuleValue: 10,
      icon: '🎯',
    },
  });

  console.log(`   ✅ 4 badges: ${badge1.name}, ${badge2.name}, ${badge3.name}, ${badge4.name}\n`);

  // ─── Step 9: Create rewards ───────────────────────
  console.log('🎁 Creating rewards...');

  const reward1 = await prisma.reward.create({
    data: {
      name: 'Coffee Voucher',
      description: 'A voucher for a free coffee at the office cafe',
      pointsRequired: 50,
      stock: 100,
      status: 'ACTIVE',
    },
  });
  const reward2 = await prisma.reward.create({
    data: {
      name: 'Extra Day Off',
      description: 'Earn an extra day of paid leave',
      pointsRequired: 200,
      stock: 20,
      status: 'ACTIVE',
    },
  });
  const reward3 = await prisma.reward.create({
    data: {
      name: 'Eco Kit',
      description: 'A sustainable living starter kit with reusable items',
      pointsRequired: 100,
      stock: 50,
      status: 'ACTIVE',
    },
  });

  console.log(`   ✅ 3 rewards: ${reward1.name} (${reward1.pointsRequired}pts), ${reward2.name} (${reward2.pointsRequired}pts), ${reward3.name} (${reward3.pointsRequired}pts)\n`);

  // ─── Step 10: Create ESG Policies ─────────────────
  console.log('📜 Creating ESG Policies...');

  const policy1 = await prisma.eSGPolicy.create({
    data: {
      title: 'Carbon Neutrality Commitment',
      body: `EcoSphere is committed to achieving carbon neutrality by 2030. All departments must track their carbon emissions through the platform and work toward reducing their environmental footprint. Key requirements include:

1. Monthly reporting of all carbon-generating activities
2. Setting and meeting quarterly reduction targets
3. Participation in at least one carbon offset initiative per year
4. Proper documentation of emission sources and mitigation efforts

Failure to comply may result in departmental review and remediation plans.`,
      version: 1,
      status: 'ACTIVE',
    },
  });

  const policy2 = await prisma.eSGPolicy.create({
    data: {
      title: 'Employee Sustainability Code of Conduct',
      body: `All employees are expected to contribute to EcoSphere's sustainability goals. This code of conduct outlines the minimum expectations:

1. Minimize waste generation in all work activities
2. Use digital alternatives to paper wherever possible
3. Report any environmental compliance concerns promptly
4. Participate in at least one CSR activity per quarter
5. Complete mandatory sustainability training within 30 days of onboarding

Employees who demonstrate exceptional sustainability leadership may be recognized through our badge and reward system.`,
      version: 1,
      status: 'ACTIVE',
    },
  });

  console.log(`   ✅ 2 policies: "${policy1.title}", "${policy2.title}"\n`);

  // ─── Summary ──────────────────────────────────────
  console.log('═══════════════════════════════════════════');
  console.log('🌍 Seed completed successfully!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   • 1 ESG Config`);
  console.log(`   • 2 Departments (Operations → Engineering)`);
  console.log(`   • 10 Employees (1 Admin, 2 Dept Heads, 7 Employees)`);
  console.log(`   • 6 Categories (3 CSR, 3 Challenge)`);
  console.log(`   • 5 Emission Factors`);
  console.log(`   • 4 Badges`);
  console.log(`   • 3 Rewards`);
  console.log(`   • 2 ESG Policies`);
  console.log('');
  console.log('🔑 Login credentials:');
  console.log('   Admin:     admin@ecosphere.com / Admin@123');
  console.log('   Others:    <email> / Password@123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
