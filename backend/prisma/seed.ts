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

  // ─── Step 11: Carbon Transactions ─────────────────
  console.log('🏭 Creating carbon transactions...');

  await prisma.carbonTransaction.create({ data: { sourceType: 'PURCHASE', sourceRefId: 'PO-2026-001', emissionFactorId: ef1.id, quantity: 5000, co2Calculated: 2100, departmentId: opsDept.id, date: new Date('2026-04-15') } });
  await prisma.carbonTransaction.create({ data: { sourceType: 'FLEET', sourceRefId: 'FL-2026-012', emissionFactorId: ef2.id, quantity: 800, co2Calculated: 2144, departmentId: opsDept.id, date: new Date('2026-05-10') } });
  await prisma.carbonTransaction.create({ data: { sourceType: 'EXPENSE', sourceRefId: 'EXP-2026-045', emissionFactorId: ef3.id, quantity: 12000, co2Calculated: 3060, departmentId: engDept.id, date: new Date('2026-05-20') } });
  await prisma.carbonTransaction.create({ data: { sourceType: 'MANUFACTURING', sourceRefId: 'MFG-2026-007', emissionFactorId: ef4.id, quantity: 2500, co2Calculated: 1450, departmentId: engDept.id, date: new Date('2026-06-01') } });
  await prisma.carbonTransaction.create({ data: { sourceType: 'PURCHASE', sourceRefId: 'PO-2026-018', emissionFactorId: ef5.id, quantity: 1500, co2Calculated: 516, departmentId: opsDept.id, date: new Date('2026-06-15') } });
  await prisma.carbonTransaction.create({ data: { sourceType: 'FLEET', sourceRefId: 'FL-2026-025', emissionFactorId: ef2.id, quantity: 350, co2Calculated: 938, departmentId: engDept.id, date: new Date('2026-07-02') } });

  console.log('   ✅ 6 carbon transactions\n');

  // ─── Step 12: Environmental Goals ─────────────────
  console.log('🎯 Creating environmental goals...');

  await prisma.environmentalGoal.create({ data: { departmentId: opsDept.id, metricName: 'Carbon Reduction (tonnes CO₂)', targetValue: 1000, currentValue: 650, periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-12-31') } });
  await prisma.environmentalGoal.create({ data: { departmentId: engDept.id, metricName: 'Energy Efficiency (kWh saved)', targetValue: 5000, currentValue: 3200, periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-12-31') } });
  await prisma.environmentalGoal.create({ data: { departmentId: opsDept.id, metricName: 'Water Conservation (m³)', targetValue: 200, currentValue: 180, periodStart: new Date('2026-06-01'), periodEnd: new Date('2026-12-31') } });

  console.log('   ✅ 3 environmental goals\n');

  // ─── Step 13: CSR Activities + Participations ─────
  console.log('🤝 Creating CSR activities...');

  const csr1 = await prisma.csrActivity.create({ data: { title: 'Beach Cleanup Drive', categoryId: csrCat2.id, description: 'Organized a beach cleanup at Juhu Beach, collected 200+ kg of waste.', date: new Date('2026-05-15'), departmentId: opsDept.id } });
  const csr2 = await prisma.csrActivity.create({ data: { title: 'Rural School Teaching Program', categoryId: csrCat3.id, description: 'Weekend teaching program for underprivileged children in rural areas.', date: new Date('2026-06-01'), departmentId: engDept.id } });
  const csr3 = await prisma.csrActivity.create({ data: { title: 'Blood Donation Camp', categoryId: csrCat1.id, description: 'Annual blood donation camp organized in collaboration with Red Cross.', date: new Date('2026-06-20'), departmentId: opsDept.id } });

  // Participations
  await prisma.employeeParticipation.create({ data: { employeeId: emp1.id, activityId: csr1.id, proofUrl: 'https://drive.google.com/proof1', approvalStatus: 'APPROVED', pointsEarned: 25, completionDate: new Date('2026-05-15') } });
  await prisma.employeeParticipation.create({ data: { employeeId: emp3.id, activityId: csr1.id, proofUrl: 'https://drive.google.com/proof2', approvalStatus: 'APPROVED', pointsEarned: 25, completionDate: new Date('2026-05-15') } });
  await prisma.employeeParticipation.create({ data: { employeeId: emp4.id, activityId: csr2.id, proofUrl: 'https://drive.google.com/proof3', approvalStatus: 'APPROVED', pointsEarned: 30, completionDate: new Date('2026-06-01') } });
  await prisma.employeeParticipation.create({ data: { employeeId: emp5.id, activityId: csr2.id, approvalStatus: 'PENDING' } });
  await prisma.employeeParticipation.create({ data: { employeeId: emp2.id, activityId: csr3.id, proofUrl: 'https://drive.google.com/proof4', approvalStatus: 'APPROVED', pointsEarned: 20, completionDate: new Date('2026-06-20') } });
  await prisma.employeeParticipation.create({ data: { employeeId: emp7.id, activityId: csr3.id, approvalStatus: 'PENDING' } });

  console.log('   ✅ 3 CSR activities with 6 participations\n');

  // ─── Step 14: Challenges + Participations ─────────
  console.log('🏆 Creating challenges...');

  const ch1 = await prisma.challenge.create({ data: { title: 'Zero Waste Week', categoryId: chalCat2.id, description: 'Go an entire week generating zero landfill waste. Document your journey!', xp: 100, difficulty: 'Medium', evidenceRequired: true, deadline: new Date('2026-09-30'), status: 'ACTIVE' } });
  const ch2 = await prisma.challenge.create({ data: { title: 'Cycle to Work Month', categoryId: chalCat3.id, description: 'Use a bicycle or walk to work for an entire month to reduce transport emissions.', xp: 200, difficulty: 'Hard', evidenceRequired: true, deadline: new Date('2026-08-31'), status: 'COMPLETED' } });
  const ch3 = await prisma.challenge.create({ data: { title: 'Smart Energy Audit', categoryId: chalCat1.id, description: 'Perform a personal energy audit of your workspace and suggest 3 improvements.', xp: 50, difficulty: 'Easy', evidenceRequired: false, deadline: new Date('2026-12-31'), status: 'DRAFT' } });

  // Participations for active challenge
  await prisma.challengeParticipation.create({ data: { challengeId: ch1.id, employeeId: emp1.id, progress: 60, approvalStatus: 'PENDING' } });
  await prisma.challengeParticipation.create({ data: { challengeId: ch1.id, employeeId: emp4.id, progress: 100, proofUrl: 'https://drive.google.com/ch-proof1', approvalStatus: 'PENDING' } });
  await prisma.challengeParticipation.create({ data: { challengeId: ch2.id, employeeId: emp3.id, progress: 100, proofUrl: 'https://drive.google.com/ch-proof2', approvalStatus: 'APPROVED', xpAwarded: 200 } });

  console.log('   ✅ 3 challenges with 3 participations\n');

  // ─── Step 15: Audits + Compliance Issues ──────────
  console.log('🔍 Creating audits and compliance issues...');

  const audit1 = await prisma.audit.create({ data: { scope: 'Q2 Environmental Compliance Review', departmentId: opsDept.id, date: new Date('2026-06-15'), auditorId: opsHead.id, status: 'COMPLETED' } });
  const audit2 = await prisma.audit.create({ data: { scope: 'H1 Social Governance Audit', departmentId: engDept.id, date: new Date('2026-07-01'), auditorId: engHead.id, status: 'SCHEDULED' } });

  await prisma.complianceIssue.create({ data: { auditId: audit1.id, severity: 'HIGH', description: 'Emission data reporting delayed by more than 15 days for 3 consecutive months.', ownerId: emp1.id, dueDate: new Date('2026-07-15'), status: 'IN_PROGRESS' } });
  await prisma.complianceIssue.create({ data: { auditId: audit1.id, severity: 'MEDIUM', description: 'Missing documentation for fleet diesel consumption in April.', ownerId: emp2.id, dueDate: new Date('2026-07-30'), status: 'OPEN' } });
  // Overdue issue
  await prisma.complianceIssue.create({ data: { auditId: audit1.id, severity: 'CRITICAL', description: 'Hazardous waste disposal procedure not following updated EPA guidelines.', ownerId: emp3.id, dueDate: new Date('2026-06-01'), status: 'OPEN' } });

  console.log('   ✅ 2 audits with 3 compliance issues\n');

  // ─── Step 16: Department Scores ───────────────────
  console.log('📊 Creating department scores...');

  await prisma.departmentScore.create({ data: { departmentId: opsDept.id, period: '2026-Q2', envScore: 82, socialScore: 74, govScore: 85, totalScore: 80.3 } });
  await prisma.departmentScore.create({ data: { departmentId: engDept.id, period: '2026-Q2', envScore: 78, socialScore: 80, govScore: 72, totalScore: 76.8 } });

  console.log('   ✅ 2 department scores\n');

  // ─── Step 17: Award Badges ────────────────────────
  console.log('🏅 Awarding badges...');

  await prisma.employeeBadge.create({ data: { employeeId: emp3.id, badgeId: badge2.id } }); // Neha 500XP => Green Warrior
  await prisma.employeeBadge.create({ data: { employeeId: emp1.id, badgeId: badge1.id } }); // Ananya 1 CSR => First Step

  console.log('   ✅ 2 badge awards\n');

  // ─── Step 18: Notifications ───────────────────────
  console.log('🔔 Creating notifications...');

  await prisma.notification.create({ data: { employeeId: emp3.id, type: 'BADGE_AWARDED', message: 'Congratulations! You\'ve earned the "Green Warrior" badge.' } });
  await prisma.notification.create({ data: { employeeId: emp1.id, type: 'BADGE_AWARDED', message: 'Congratulations! You\'ve earned the "First Step" badge.' } });
  await prisma.notification.create({ data: { employeeId: emp1.id, type: 'CSR_APPROVAL', message: 'Your participation in "Beach Cleanup Drive" has been approved! +25 points.' } });
  await prisma.notification.create({ data: { employeeId: emp5.id, type: 'CSR_PENDING', message: 'Your participation in "Rural School Teaching Program" is pending review.' } });

  console.log('   ✅ 4 notifications\n');

  // ─── Step 19: Policy Acknowledgements ─────────────
  console.log('📝 Creating policy acknowledgements...');

  await prisma.policyAcknowledgement.create({ data: { policyId: policy1.id, employeeId: admin.id } });
  await prisma.policyAcknowledgement.create({ data: { policyId: policy1.id, employeeId: opsHead.id } });
  await prisma.policyAcknowledgement.create({ data: { policyId: policy2.id, employeeId: admin.id } });
  await prisma.policyAcknowledgement.create({ data: { policyId: policy1.id, employeeId: emp3.id } });

  console.log('   ✅ 4 policy acknowledgements\n');

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
  console.log(`   • 4 Badges + 2 Awards`);
  console.log(`   • 3 Rewards`);
  console.log(`   • 2 ESG Policies + 4 Acknowledgements`);
  console.log(`   • 6 Carbon Transactions`);
  console.log(`   • 3 Environmental Goals`);
  console.log(`   • 3 CSR Activities + 6 Participations`);
  console.log(`   • 3 Challenges + 3 Participations`);
  console.log(`   • 2 Audits + 3 Compliance Issues`);
  console.log(`   • 2 Department Scores`);
  console.log(`   • 4 Notifications`);
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
