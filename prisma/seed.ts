import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Saathi Sneha Care EMR...')

  // Organization
  let org = await prisma.organization.findFirst({ where: { name: 'Saathi Sneha Care' } })
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name:       'Saathi Sneha Care',
        nameNepali: 'साथी स्नेह केयर',
        phone:      '+977-1-4000000',
        email:      'info@saathisnehacare.com',
        isActive:   true,
      },
    })
  }
  console.log('✓ Organization:', org.name)

  // Branch (uses orgId, not organizationId)
  let branch = await prisma.branch.findFirst({ where: { orgId: org.id, name: 'Kathmandu Central' } })
  if (!branch) {
    branch = await prisma.branch.create({
      data: {
        orgId:      org.id,
        name:       'Kathmandu Central',
        nameNepali: 'काठमाडौं केन्द्रीय',
        phone:      '+977-1-4000001',
        province:   'bagmati',
        district:   'Kathmandu',
        isActive:   true,
      },
    })
  }
  console.log('✓ Branch:', branch.name)

  // Admin user (uses orgId)
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@saathisnehacare.com' },
    update: {},
    create: {
      orgId:    org.id,
      branchId: branch.id,
      role:     'admin',
      firstName: 'Admin',
      lastName:  'Saathi',
      email:     'admin@saathisnehacare.com',
      phone:     '+977-98-00000000',
      isActive:  true,
    },
  })

  // Nurse
  const nurse = await prisma.user.upsert({
    where:  { email: 'nurse.sita@saathisnehacare.com' },
    update: {},
    create: {
      orgId:           org.id,
      branchId:        branch.id,
      role:            'nurse',
      firstName:       'Sita',
      lastName:        'Sharma',
      firstNameNepali: 'सीता',
      lastNameNepali:  'शर्मा',
      email:           'nurse.sita@saathisnehacare.com',
      phone:           '+977-98-11111111',
      isActive:        true,
    },
  })

  // Doctor (role = 'provider')
  const doctor = await prisma.user.upsert({
    where:  { email: 'dr.ram@saathisnehacare.com' },
    update: {},
    create: {
      orgId:    org.id,
      branchId: branch.id,
      role:     'provider',
      firstName: 'Ram',
      lastName:  'Bahadur',
      email:     'dr.ram@saathisnehacare.com',
      phone:     '+977-98-22222222',
      isActive:  true,
    },
  })

  // Additional admin: Operations Manager
  await prisma.user.upsert({
    where:  { email: 'priya.admin@saathisnehacare.com' },
    update: {},
    create: {
      orgId:           org.id,
      branchId:        branch.id,
      role:            'admin',
      firstName:       'Priya',
      lastName:        'Maharjan',
      firstNameNepali: 'प्रिया',
      lastNameNepali:  'महर्जन',
      email:           'priya.admin@saathisnehacare.com',
      phone:           '+977-98-33333333',
      isActive:        true,
    },
  })

  // Additional admin: Finance & Billing Manager
  await prisma.user.upsert({
    where:  { email: 'suresh.admin@saathisnehacare.com' },
    update: {},
    create: {
      orgId:           org.id,
      branchId:        branch.id,
      role:            'admin',
      firstName:       'Suresh',
      lastName:        'Khatri',
      firstNameNepali: 'सुरेश',
      lastNameNepali:  'खत्री',
      email:           'suresh.admin@saathisnehacare.com',
      phone:           '+977-98-44444444',
      isActive:        true,
    },
  })

  // Lab technicians — one per lab company
  const labTechData = [
    { email: 'roshan.lab@saathisnehacare.com',  phone: '+977-98-60000001', firstName: 'Roshan',  lastName: 'Tamang',   firstNameNepali: 'रोशन',  lastNameNepali: 'तामाङ' },
    { email: 'sunita.lab@saathisnehacare.com',  phone: '+977-98-60000002', firstName: 'Sunita',  lastName: 'Gurung',   firstNameNepali: 'सुनिता', lastNameNepali: 'गुरुङ' },
    { email: 'bikram.lab@saathisnehacare.com',  phone: '+977-98-60000003', firstName: 'Bikram',  lastName: 'Karki',    firstNameNepali: 'बिक्रम', lastNameNepali: 'कार्की' },
    { email: 'manisha.lab@saathisnehacare.com', phone: '+977-98-60000004', firstName: 'Manisha', lastName: 'Shrestha', firstNameNepali: 'मनिषा', lastNameNepali: 'श्रेष्ठ' },
    { email: 'dipesh.lab@saathisnehacare.com',  phone: '+977-98-60000005', firstName: 'Dipesh',  lastName: 'Basnet',   firstNameNepali: 'दिपेश', lastNameNepali: 'बस्नेत' },
  ]

  for (const lt of labTechData) {
    await prisma.user.upsert({
      where:  { email: lt.email },
      update: {},
      create: { orgId: org.id, branchId: branch.id, role: 'lab_tech', isActive: true, ...lt },
    })
  }

  console.log('✓ Users: 3 admins, 5 lab techs, 1 nurse, 1 provider')
  void admin

  // Demo patient (uses orgId)
  const patient = await prisma.patient.upsert({
    where:  { mrn: 'NHH-0000001' },
    update: {},
    create: {
      orgId:           org.id,
      branchId:        branch.id,
      primaryNurseId:  nurse.id,
      primaryDoctorId: doctor.id,
      mrn:             'NHH-0000001',
      firstName:       'Maya',
      lastName:        'Thapa',
      firstNameNepali: 'माया',
      lastNameNepali:  'थापा',
      dateOfBirth:     new Date('1948-03-15'),
      gender:          'female',
      phone:           '+977-98-55555555',
      bloodGroup:      'B+',
      province:        'bagmati',
      district:        'Kathmandu',
      municipality:    'Kathmandu Metropolitan',
      wardNo:          10,
      tole:            'Baneshwor, House 15',
      allergies:       ['Penicillin', 'Sulfa drugs'],
      chronicConditions: ['Hypertension', 'Type 2 Diabetes'],
      insuranceScheme: 'sehat_bima',
      emergencyContactName:     'Raj Thapa',
      emergencyContactPhone:    '+1-555-123-4567',
      emergencyContactRelation: 'Son (USA)',
    },
  })
  console.log('✓ Demo patient: Maya Thapa (MRN: NHH-0000001)')

  // Family member (uses fullName, isPrimaryContact, canReceiveUpdates)
  await prisma.patientFamilyMember.upsert({
    where:  { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id:               '00000000-0000-0000-0000-000000000001',
      patientId:        patient.id,
      fullName:         'Raj Thapa',
      relationship:     'Son',
      phone:            '+1-555-123-4567',
      country:          'USA',
      isPrimaryContact: true,
      canReceiveUpdates: true,
    },
  })

  await prisma.patientFamilyMember.upsert({
    where:  { id: '00000000-0000-0000-0000-000000000011' },
    update: {},
    create: {
      id:               '00000000-0000-0000-0000-000000000011',
      patientId:        patient.id,
      fullName:         'Priya Thapa',
      relationship:     'Daughter-in-law',
      phone:            '+1-555-987-6543',
      country:          'USA',
      isPrimaryContact: false,
      canReceiveUpdates: true,
    },
  })

  // Diagnoses (uses icdCode, diagnosedAt)
  await prisma.patientDiagnosis.upsert({
    where:  { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id:          '00000000-0000-0000-0000-000000000002',
      patientId:   patient.id,
      icdCode:     'I10',
      description: 'Essential (primary) hypertension',
      isPrimary:   true,
      diagnosedAt: new Date('2020-01-10'),
    },
  })

  await prisma.patientDiagnosis.upsert({
    where:  { id: '00000000-0000-0000-0000-000000000003' },
    update: {},
    create: {
      id:          '00000000-0000-0000-0000-000000000003',
      patientId:   patient.id,
      icdCode:     'E11',
      description: 'Type 2 diabetes mellitus',
      isPrimary:   false,
      diagnosedAt: new Date('2021-06-05'),
    },
  })

  await prisma.patientDiagnosis.upsert({
    where:  { id: '00000000-0000-0000-0000-000000000012' },
    update: {},
    create: {
      id:          '00000000-0000-0000-0000-000000000012',
      patientId:   patient.id,
      icdCode:     'M81.0',
      description: 'Osteoporosis without current pathological fracture',
      isPrimary:   false,
      diagnosedAt: new Date('2022-09-01'),
    },
  })
  console.log('✓ Demo diagnoses: hypertension, type 2 diabetes, osteoporosis')

  // Visit (uses orgId, nurseId, providerId, scheduledAt)
  const scheduledAt  = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const scheduledEnd = new Date(scheduledAt.getTime() + 60 * 60 * 1000)

  const existingVisit = await prisma.visit.findFirst({ where: { patientId: patient.id } })
  if (!existingVisit) {
    const visit = await prisma.visit.create({
      data: {
        orgId:       org.id,
        branchId:    branch.id,
        patientId:   patient.id,
        nurseId:     nurse.id,
        providerId:  doctor.id,
        serviceCode: 'wellness_check',
        serviceCategory: 'scheduled',
        visitType:   'wellness_check',
        scheduledAt,
        scheduledEnd,
        durationMin: 60,
        notes:       'Routine BP and glucose check. Patient reported mild dizziness last week.',
      },
    })

    await prisma.visitTask.create({
      data: { visitId: visit.id, taskName: 'Wellness Check',       status: 'pending', sortOrder: 0 },
    })
    await prisma.visitTask.create({
      data: { visitId: visit.id, taskName: 'Medication Management', status: 'pending', sortOrder: 1 },
    })
    console.log('✓ Demo visit scheduled for tomorrow with 2 tasks')
  } else {
    console.log('✓ Demo visit already exists — skipping')
  }

  // Service catalog (uses nameEn, nameNp, descriptionEn, defaultDurationMin)
  const services = [
    { code: 'wellness_check',             category: 'scheduled',  nameEn: 'Wellness Check',             nameNp: 'स्वास्थ्य जाँच',           descriptionEn: 'Routine health monitoring visit',          defaultDurationMin: 45, requiresNurse: true },
    { code: 'chronic_disease_monitoring', category: 'scheduled',  nameEn: 'Chronic Disease Monitoring', nameNp: 'दीर्घ रोग निगरानी',          descriptionEn: 'Monitoring of chronic conditions',         defaultDurationMin: 60, requiresNurse: true },
    { code: 'medication_management',      category: 'scheduled',  nameEn: 'Medication Management',      nameNp: 'औषधि व्यवस्थापन',           descriptionEn: 'Medication review and compliance',         defaultDurationMin: 30, requiresNurse: true },
    { code: 'doctor_consultation',        category: 'scheduled',  nameEn: 'Doctor Consultation',        nameNp: 'चिकित्सक परामर्श',          descriptionEn: 'Virtual or in-person doctor consult',      defaultDurationMin: 30, requiresProvider: true },
    { code: 'lab_coordination',           category: 'scheduled',  nameEn: 'Lab Coordination',           nameNp: 'प्रयोगशाला समन्वय',         descriptionEn: 'Lab test collection and coordination',     defaultDurationMin: 45, requiresNurse: true },
    { code: 'physiotherapy',              category: 'scheduled',  nameEn: 'Physiotherapy',              nameNp: 'फिजियोथेरापी',              descriptionEn: 'Physical therapy session',                 defaultDurationMin: 60, requiresNurse: true },
    { code: 'post_hospital_care',         category: 'scheduled',  nameEn: 'Post-Hospital Care',         nameNp: 'अस्पताल पश्चात हेरचाह',     descriptionEn: 'Recovery care after discharge',            defaultDurationMin: 60, requiresNurse: true },
    { code: 'hospital_escort',            category: 'scheduled',  nameEn: 'Hospital Escort',            nameNp: 'अस्पताल सहयात्रा',          descriptionEn: 'Escort patient to hospital appointment',   defaultDurationMin: 120, requiresNurse: true },
    { code: 'caregiver_support',          category: 'scheduled',  nameEn: 'Caregiver Support',          nameNp: 'हेरचाहकर्ता सहयोग',        descriptionEn: 'Support and training for caregivers',      defaultDurationMin: 60, requiresNurse: true },
    { code: 'mental_wellness_check',      category: 'scheduled',  nameEn: 'Mental Wellness Check',      nameNp: 'मानसिक स्वास्थ्य जाँच',    descriptionEn: 'Mental health assessment visit',           defaultDurationMin: 45, requiresProvider: true },
    { code: 'urgent_nurse_visit',         category: 'on_demand',  nameEn: 'Urgent Nurse Visit',         nameNp: 'अत्यावश्यक नर्स भ्रमण',    descriptionEn: 'Same-day urgent nurse assessment',         defaultDurationMin: 45, requiresNurse: true, isSameDay: true },
    { code: 'doctor_on_call',             category: 'on_demand',  nameEn: 'Doctor On Call',             nameNp: 'अनुरोधमा चिकित्सक',        descriptionEn: 'On-demand doctor consultation',            defaultDurationMin: 30, requiresProvider: true, isSameDay: true },
    { code: 'ambulance_coordination',     category: 'on_demand',  nameEn: 'Ambulance Coordination',     nameNp: 'एम्बुलेन्स समन्वय',         descriptionEn: 'Emergency ambulance coordination',         defaultDurationMin: 30, isSameDay: true },
    { code: 'hospital_admission_support', category: 'on_demand',  nameEn: 'Hospital Admission Support', nameNp: 'अस्पताल भर्ना सहयोग',      descriptionEn: 'Support during hospital admission',        defaultDurationMin: 60, isSameDay: true },
    { code: 'medicine_delivery',          category: 'on_demand',  nameEn: 'Medicine Delivery',          nameNp: 'औषधि डेलिभरी',              descriptionEn: 'Home delivery of prescribed medicines',    defaultDurationMin: 30, isSameDay: true },
    { code: 'family_video_update',        category: 'on_demand',  nameEn: 'Family Video Update',        nameNp: 'परिवार भिडियो अपडेट',       descriptionEn: 'Video call update with overseas family',   defaultDurationMin: 20, isSameDay: true },
  ] as const

  for (const s of services) {
    await prisma.serviceCatalog.upsert({
      where:  { code: s.code },
      update: { nameEn: s.nameEn, nameNp: s.nameNp },
      create: {
        code:               s.code,
        category:           s.category as 'scheduled' | 'on_demand',
        nameEn:             s.nameEn,
        nameNp:             s.nameNp,
        descriptionEn:      s.descriptionEn,
        defaultDurationMin: s.defaultDurationMin,
        isSameDay:          ('isSameDay'       in s) ? (s as never as { isSameDay:       boolean }).isSameDay       : false,
        requiresNurse:      ('requiresNurse'    in s) ? (s as never as { requiresNurse:    boolean }).requiresNurse    : false,
        requiresProvider:   ('requiresProvider' in s) ? (s as never as { requiresProvider: boolean }).requiresProvider : false,
      },
    })
  }
  console.log('✓ Service catalog: 16 services seeded')

  // ── Clinical data ────────────────────────────────────────────────────────────

  // Medications
  const medsData = [
    { name: 'Amlodipine', dose: '5 mg',  frequency: 'Once daily',     indication: 'Hypertension',     prescriber: 'Dr. Ram Bahadur', status: 'active',     isActive: true,  isBeersFlagged: false },
    { name: 'Metformin',  dose: '500 mg', frequency: 'Twice daily',    indication: 'Type 2 Diabetes',  prescriber: 'Dr. Ram Bahadur', status: 'active',     isActive: true,  isBeersFlagged: false },
    { name: 'Aspirin',    dose: '81 mg',  frequency: 'Once daily',     indication: 'Cardioprotection', prescriber: 'Dr. Ram Bahadur', status: 'active',     isActive: true,  isBeersFlagged: false },
    { name: 'Diazepam',   dose: '5 mg',   frequency: 'PRN (anxiety)',  indication: 'Anxiety',          prescriber: 'Dr. Ram Bahadur', status: 'deprescribe', isActive: true,  isBeersFlagged: true, beersNote: 'Beers 2023: benzodiazepines increase fall/fracture risk in older adults' },
    { name: 'Atorvastatin', dose: '20 mg', frequency: 'Once daily at night', indication: 'Dyslipidemia', prescriber: 'Dr. Ram Bahadur', status: 'active', isActive: true, isBeersFlagged: false },
  ]

  for (const med of medsData) {
    const exists = await prisma.patientMedication.findFirst({ where: { patientId: patient.id, name: med.name } })
    if (!exists) {
      await prisma.patientMedication.create({ data: { patientId: patient.id, startDate: new Date('2023-01-01'), ...med } })
    }
  }
  console.log('✓ Medications seeded (5 meds, 1 Beers flagged)')

  // Lab results
  const labsData = [
    { panelDate: new Date('2026-05-15'), category: 'metabolic',   testName: 'HbA1c',          result: '7.8',  unit: '%',      referenceMin: '4.0', referenceMax: '5.6', flag: 'high',   priorResult: '8.2',  trend: 'improving' },
    { panelDate: new Date('2026-05-15'), category: 'metabolic',   testName: 'Fasting Glucose', result: '142',  unit: 'mg/dL',  referenceMin: '70',  referenceMax: '99',  flag: 'high',   priorResult: '158',  trend: 'improving' },
    { panelDate: new Date('2026-05-15'), category: 'metabolic',   testName: 'Creatinine',      result: '1.1',  unit: 'mg/dL',  referenceMin: '0.5', referenceMax: '1.1', flag: null,     priorResult: '1.0',  trend: 'stable' },
    { panelDate: new Date('2026-05-15'), category: 'metabolic',   testName: 'eGFR',            result: '62',   unit: 'mL/min', referenceMin: '60',  referenceMax: null,  flag: null,     priorResult: '65',   trend: 'stable' },
    { panelDate: new Date('2026-05-15'), category: 'lipids',      testName: 'LDL',             result: '118',  unit: 'mg/dL',  referenceMin: null,  referenceMax: '100', flag: 'high',   priorResult: '135',  trend: 'improving' },
    { panelDate: new Date('2026-05-15'), category: 'lipids',      testName: 'HDL',             result: '48',   unit: 'mg/dL',  referenceMin: '50',  referenceMax: null,  flag: 'low',    priorResult: '45',   trend: 'improving' },
    { panelDate: new Date('2026-05-15'), category: 'vitamins',    testName: 'Vitamin D',       result: '18',   unit: 'ng/mL',  referenceMin: '30',  referenceMax: '100', flag: 'low',    priorResult: '14',   trend: 'improving' },
    { panelDate: new Date('2026-05-15'), category: 'blood_count', testName: 'Hemoglobin',      result: '11.8', unit: 'g/dL',   referenceMin: '12',  referenceMax: '16',  flag: 'low',    priorResult: '11.5', trend: 'improving' },
  ]

  for (const lab of labsData) {
    const exists = await prisma.patientLabResult.findFirst({ where: { patientId: patient.id, testName: lab.testName, panelDate: lab.panelDate } })
    if (!exists) await prisma.patientLabResult.create({ data: { patientId: patient.id, ...lab } })
  }
  console.log('✓ Lab results seeded (8 results)')

  // Vaccinations
  const vaxData = [
    { vaccineName: 'Influenza',                  givenDate: new Date('2025-10-01'), nextDueDate: new Date('2026-10-01'), status: 'up_to_date' },
    { vaccineName: 'Pneumococcal (PCV13)',        givenDate: new Date('2023-03-15'), nextDueDate: null,                  status: 'up_to_date' },
    { vaccineName: 'Pneumococcal (PPSV23)',       givenDate: null,                   nextDueDate: new Date('2026-07-01'), status: 'due' },
    { vaccineName: 'Shingles (Shingrix) Dose 1', givenDate: new Date('2025-01-10'), nextDueDate: new Date('2025-03-10'), status: 'up_to_date' },
    { vaccineName: 'Shingles (Shingrix) Dose 2', givenDate: null,                   nextDueDate: new Date('2025-03-10'), status: 'overdue' },
    { vaccineName: 'COVID-19 (Booster)',          givenDate: new Date('2024-10-10'), nextDueDate: new Date('2026-10-01'), status: 'up_to_date' },
    { vaccineName: 'Tdap',                        givenDate: new Date('2020-05-01'), nextDueDate: new Date('2030-05-01'), status: 'up_to_date' },
  ]

  for (const vax of vaxData) {
    const exists = await prisma.patientVaccination.findFirst({ where: { patientId: patient.id, vaccineName: vax.vaccineName } })
    if (!exists) await prisma.patientVaccination.create({ data: { patientId: patient.id, ...vax } })
  }
  console.log('✓ Vaccinations seeded (7 vaccines)')

  // Referrals
  const refData = [
    { specialty: 'Cardiology',    reason: 'Hypertension uncontrolled on 2 agents; rule out secondary cause', provider: 'Shahid Gangalal National Heart Centre', referralDate: new Date('2026-06-01'), appointmentDate: new Date('2026-07-10'), status: 'scheduled' },
    { specialty: 'Ophthalmology', reason: 'Annual diabetic retinopathy screening',                           provider: 'Tilganga Eye Centre',                  referralDate: new Date('2026-05-20'), appointmentDate: null,                  status: 'pending' },
    { specialty: 'Physiotherapy', reason: 'Gait training, TUG 18s; reduce fall risk',                       provider: 'Sahayata Physio Unit',                 referralDate: new Date('2026-06-10'), appointmentDate: new Date('2026-06-20'), status: 'scheduled' },
  ]

  for (const ref of refData) {
    const exists = await prisma.patientReferral.findFirst({ where: { patientId: patient.id, specialty: ref.specialty } })
    if (!exists) await prisma.patientReferral.create({ data: { patientId: patient.id, ...ref } })
  }
  console.log('✓ Referrals seeded (3 referrals)')

  // Clinical alerts
  const alertsData = [
    { severity: 'warn', title: 'Beers Criteria Medication',  description: 'Diazepam prescribed — consider deprescribing (fall risk in elderly)' },
    { severity: 'warn', title: 'Shingrix Dose 2 Overdue',    description: 'Second dose of Shingrix (shingles) vaccine is overdue since March 2025' },
    { severity: 'info', title: 'LDL Above Target',           description: 'LDL 118 mg/dL; target <100 for diabetic patient. Review statin dose.' },
    { severity: 'info', title: 'Low Vitamin D',              description: 'Vitamin D 18 ng/mL. Supplement and recheck in 3 months.' },
  ]

  for (const al of alertsData) {
    const exists = await prisma.clinicalAlert.findFirst({ where: { patientId: patient.id, title: al.title, isResolved: false } })
    if (!exists) await prisma.clinicalAlert.create({ data: { patientId: patient.id, ...al } })
  }
  console.log('✓ Clinical alerts seeded (4 alerts)')

  // Care plan goals
  const goalsData = [
    { goal: 'Maintain HbA1c below 7.5%', detail: 'Recheck in 3 months; dietary counseling ongoing',      status: 'active',   priority: 1 },
    { goal: 'Reduce fall risk',           detail: 'Physiotherapy 2x/week + home hazard reduction',        status: 'active',   priority: 2 },
    { goal: 'Deprescribe Diazepam',       detail: 'Taper over 6 weeks with anxiety monitoring',           status: 'active',   priority: 3 },
    { goal: 'Optimize BP control',        detail: 'Target <130/80; cardiology review pending',             status: 'active',   priority: 4 },
    { goal: 'Vitamin D supplementation',  detail: 'Cholecalciferol 2000 IU daily; recheck in 3 months',  status: 'achieved', priority: 5 },
  ]

  for (const g of goalsData) {
    const exists = await prisma.carePlanGoal.findFirst({ where: { patientId: patient.id, goal: g.goal } })
    if (!exists) await prisma.carePlanGoal.create({ data: { patientId: patient.id, ...g } })
  }
  console.log('✓ Care plan goals seeded (5 goals)')

  // CGA assessment
  const cgaExists = await prisma.cGAAssessment.findFirst({ where: { patientId: patient.id } })
  if (!cgaExists) {
    await prisma.cGAAssessment.create({
      data: {
        patientId:       patient.id,
        assessedById:    doctor.id,
        assessedAt:      new Date('2026-06-01'),
        mocaScore:       24,
        gdsScore:        6,
        camPositive:     false,
        tugSeconds:      18.2,
        fallsLast6m:     1,
        adlScore:        5,
        iadlScore:       6,
        homeHazards:     3,
        bpSystolic:      148,
        bpDiastolic:     88,
        orthoDropMmhg:   14,
        bmi:             26.1,
        primaryGoal:     "Remain independent at home; attend grandchildren's events",
        livingSituation: 'Lives with spouse, son in USA',
        advanceCarePlan: 'to_discuss',
        mnaNutrition:    10,
        visionNotes:     'Reading glasses; no diabetic retinopathy on last exam (2024)',
        hearingNotes:    'Mild bilateral hearing loss; no aids',
        continenceNotes: 'Occasional urgency, managed with pelvic floor exercises',
        notes:           'Mild cognitive impairment on MoCA (24/30). Moderate fall risk (TUG 18s, 1 fall last 6 months). BP uncontrolled. Mood moderately depressed (GDS 6). Primary goal is home independence.',
      },
    })
  }
  console.log('✓ CGA assessment seeded')

  // ── Subscription plans ───────────────────────────────────────────────────────
  const plans = [
    {
      code: 'care_connect', name: 'Care Connect', nameNepali: 'केयर कनेक्ट',
      description: 'Essential care coordination for healthy, independent parents.',
      bestFor: 'Healthy parents who need a safety net and regular check-ins.',
      features: ['App access & family dashboard', 'Dedicated care manager', 'Monthly phone wellness check', 'Emergency health profile', '24/7 helpline access'],
      priceMinNpr: 21, priceMaxNpr: 36, visitsPerMonth: 0, sortOrder: 1,
    },
    {
      code: 'wellness_plus', name: 'Wellness Plus', nameNepali: 'वेलनेस प्लस',
      description: 'Regular nurse monitoring with family reports.',
      bestFor: 'Parents who need routine health monitoring and family peace of mind.',
      features: ['Everything in Care Connect', '2 nurse visits per month', 'Vitals monitoring & trending', 'Monthly family health report', 'Medication reminder support'],
      priceMinNpr: 50, priceMaxNpr: 71, visitsPerMonth: 2, sortOrder: 2,
    },
    {
      code: 'chronic_care', name: 'Chronic Care', nameNepali: 'क्रोनिक केयर',
      description: 'Intensive management for diabetes, hypertension, and heart patients.',
      bestFor: 'Patients with diabetes, blood pressure, or heart conditions.',
      features: ['Weekly vitals monitoring', 'Medicine coordination & refills', 'Monthly doctor review', 'Lab coordination & result tracking', 'Nutrition & diet guidance', 'Monthly family report'],
      priceMinNpr: 107, priceMaxNpr: 179, visitsPerMonth: 4, sortOrder: 3,
    },
    {
      code: 'recovery_care', name: 'Recovery Care', nameNepali: 'रिकभरी केयर',
      description: 'Intensive post-surgery and post-hospital recovery support.',
      bestFor: 'Post-surgery or post-hospital discharge patients needing recovery care.',
      features: ['Daily or alternate-day nurse visits', 'Wound care & dressing', 'Physiotherapy coordination', 'Dedicated recovery plan', 'Hospital liaison support', 'Weekly family video updates'],
      priceMinNpr: 214, priceMaxNpr: 429, visitsPerMonth: 12, sortOrder: 4,
    },
    {
      code: 'premium_companion', name: 'Premium Companion', nameNepali: 'प्रिमियम कम्पेनियन',
      description: 'High-touch care for frail elderly or patients needing daily support.',
      bestFor: 'Frail elderly or patients needing daily caregiver support and high-touch management.',
      features: ['Daily caregiver support visits', 'Hospital escort & admission support', 'Priority care management', 'Medicine delivery', 'Family video updates (weekly)', 'Dedicated care manager on-call'],
      priceMinNpr: 357, priceMaxNpr: 714, visitsPerMonth: 20, sortOrder: 5,
    },
  ]

  for (const plan of plans) {
    const exists = await prisma.subscriptionPlan.findUnique({ where: { code: plan.code } })
    if (!exists) {
      await prisma.subscriptionPlan.create({ data: plan })
    } else {
      await prisma.subscriptionPlan.update({ where: { code: plan.code }, data: { priceMinNpr: plan.priceMinNpr, priceMaxNpr: plan.priceMaxNpr, features: plan.features } })
    }
  }
  console.log('✓ Subscription plans seeded (5 plans)')

  // ── Patient subscription (Maya on Chronic Care, paid by son in USA) ──────────
  const chronicPlan = await prisma.subscriptionPlan.findUniqueOrThrow({ where: { code: 'chronic_care' } })

  let patientSub = await prisma.patientSubscription.findFirst({ where: { patientId: patient.id, status: 'active' } })
  if (!patientSub) {
    patientSub = await prisma.patientSubscription.create({
      data: {
        patientId:   patient.id,
        planId:      chronicPlan.id,
        status:      'active',
        priceNpr:    143,
        startDate:   new Date('2026-01-01'),
        renewalDate: new Date('2026-07-01'),
        payerType:   'family_overseas',
        payerName:   'Raj Thapa',
        payerPhone:  '+1-555-123-4567',
        notes:       'Paid monthly via Stripe by son in USA. Converted from Care Connect in Jan 2026.',
      },
    })
  }
  console.log('✓ Patient subscription: Maya Thapa on Chronic Care ($143/month)')

  // ── Demo invoices ─────────────────────────────────────────────────────────────
  const existingInvoice = await prisma.invoice.findFirst({ where: { patientId: patient.id } })
  if (!existingInvoice) {
    // June 2026 subscription invoice — PAID
    const inv1 = await prisma.invoice.create({
      data: {
        orgId:          org.id,
        patientId:      patient.id,
        subscriptionId: patientSub.id,
        invoiceNo:      'INV-202606-0001',
        invoiceDate:    new Date('2026-06-01'),
        dueDate:        new Date('2026-06-07'),
        status:         'paid',
        payerType:      'family_overseas',
        subtotalNpr:    143,
        totalNpr:       143,
        paidNpr:        143,
        notes:          'Monthly subscription — June 2026',
        lineItems: {
          create: [
            { description: 'Chronic Care Plan — June 2026', category: 'subscription', qty: 1, unitPriceNpr: 143, totalNpr: 143 },
          ],
        },
      },
    })
    await prisma.payment.create({
      data: {
        invoiceId:   inv1.id,
        amountNpr:   143,
        method:      'stripe',
        payerType:   'family_overseas',
        payerName:   'Raj Thapa',
        referenceNo: 'ch_stripe_june2026',
        paidAt:      new Date('2026-06-03'),
        notes:       'Auto-charged via Stripe',
      },
    })

    // June 2026 — extra lab services invoice — PARTIAL
    const inv2 = await prisma.invoice.create({
      data: {
        orgId:       org.id,
        patientId:   patient.id,
        invoiceNo:   'INV-202606-0002',
        invoiceDate: new Date('2026-06-15'),
        dueDate:     new Date('2026-06-22'),
        status:      'partial',
        payerType:   'family_overseas',
        subtotalNpr: 39,
        totalNpr:    39,
        paidNpr:     21,
        notes:       'Additional services — June 2026',
        lineItems: {
          create: [
            { description: 'HbA1c + Fasting Glucose + Lipid panel', category: 'lab',           qty: 1, unitPriceNpr: 25, totalNpr: 25 },
            { description: 'Physiotherapy session (2 sessions)',      category: 'procedure',     qty: 2, unitPriceNpr: 7, totalNpr: 14 },
          ],
        },
      },
    })
    await prisma.payment.create({
      data: {
        invoiceId:   inv2.id,
        amountNpr:   21,
        method:      'esewa',
        payerType:   'patient_local',
        payerName:   'Krishna Thapa (spouse)',
        referenceNo: 'ESW-2026-98765',
        paidAt:      new Date('2026-06-16'),
        notes:       'Partial payment by spouse on-site via eSewa',
      },
    })

    // July 2026 subscription invoice — SENT/UPCOMING
    await prisma.invoice.create({
      data: {
        orgId:          org.id,
        patientId:      patient.id,
        subscriptionId: patientSub.id,
        invoiceNo:      'INV-202607-0001',
        invoiceDate:    new Date('2026-07-01'),
        dueDate:        new Date('2026-07-07'),
        status:         'sent',
        payerType:      'family_overseas',
        subtotalNpr:    143,
        totalNpr:       143,
        paidNpr:        0,
        notes:          'Monthly subscription — July 2026',
        lineItems: {
          create: [
            { description: 'Chronic Care Plan — July 2026', category: 'subscription', qty: 1, unitPriceNpr: 143, totalNpr: 143 },
          ],
        },
      },
    })
    console.log('✓ Demo invoices seeded (3 invoices: 1 paid, 1 partial, 1 sent)')
  } else {
    console.log('✓ Demo invoices already exist — skipping')
  }

  // ── Lab companies ─────────────────────────────────────────────────────────────
  const labCompanyData = [
    { name: 'Kathmandu Medical Laboratory', phone: '01-4445566', email: 'info@ktmlab.com.np',       address: 'Putalisadak, Kathmandu',      contactPerson: 'Dr. Ramesh Shrestha' },
    { name: 'Nepal Diagnostic Centre',      phone: '01-4221133', email: 'contact@nepaldiag.com.np', address: 'Lazimpat, Kathmandu',          contactPerson: 'Sita Paudel' },
    { name: 'Sunrise Pathology Lab',        phone: '061-523344', email: 'sunrise@pathlab.com.np',   address: 'Lakeside, Pokhara',            contactPerson: 'Bikash Adhikari' },
    { name: 'Himalayan Clinical Lab',       phone: '021-471122', email: 'himalayan@clinlab.com.np', address: 'Mahendrapath, Biratnagar',     contactPerson: 'Anita Rai' },
    { name: 'Everest Diagnostics & Imaging', phone: '01-5550088', email: 'everest@diagnostics.com.np', address: 'Baneshwor, Kathmandu',     contactPerson: 'Dr. Suresh Koirala' },
  ]

  const labCompanies: Array<{ id: string; name: string }> = []
  for (const lc of labCompanyData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = prisma as any
    const existing = await db.labCompany.findFirst({ where: { name: lc.name } }) as { id: string; name: string } | null
    if (existing) {
      labCompanies.push(existing)
    } else {
      const created = await db.labCompany.create({ data: lc }) as { id: string; name: string }
      labCompanies.push(created)
    }
  }
  console.log(`✓ Lab companies seeded (${labCompanies.length})`)

  // ── Completed visits for lab work ─────────────────────────────────────────────
  // 5 past completed visits — one per lab company
  const visitDefs = [
    { daysAgo: 60, panel: 'Metabolic Panel (HbA1c, FBS, Creatinine, eGFR)',  labIdx: 0, labResults: [
      { testName: 'HbA1c',          category: 'metabolic',   unit: '%',      refMin: '4.0', refMax: '5.6', result: '7.4', flag: 'high',   trend: 'improving',  prior: '7.8' },
      { testName: 'Fasting Glucose', category: 'metabolic',  unit: 'mg/dL',  refMin: '70',  refMax: '99',  result: '132', flag: 'high',   trend: 'improving',  prior: '142' },
      { testName: 'Creatinine',      category: 'metabolic',  unit: 'mg/dL',  refMin: '0.6', refMax: '1.2', result: '1.0', flag: 'normal', trend: 'stable',     prior: '1.1' },
      { testName: 'eGFR',            category: 'metabolic',  unit: 'mL/min', refMin: '60',  refMax: null,  result: '65',  flag: 'normal', trend: 'stable',     prior: '62'  },
    ]},
    { daysAgo: 45, panel: 'Complete Blood Count',                               labIdx: 1, labResults: [
      { testName: 'Hemoglobin',   category: 'blood_count', unit: 'g/dL',    refMin: '12.0', refMax: '16.0', result: '12.2', flag: 'normal', trend: 'improving', prior: '11.8' },
      { testName: 'WBC Count',    category: 'blood_count', unit: '10³/µL',  refMin: '4.5',  refMax: '11.0', result: '7.1',  flag: 'normal', trend: 'stable',    prior: '6.8'  },
      { testName: 'Platelet Count', category: 'blood_count', unit: '10³/µL', refMin: '150', refMax: '400',  result: '245',  flag: 'normal', trend: 'stable',    prior: '220'  },
      { testName: 'MCV',          category: 'blood_count', unit: 'fL',      refMin: '80',   refMax: '100',  result: '78',   flag: 'low',    trend: 'worsening', prior: '82'   },
    ]},
    { daysAgo: 30, panel: 'Lipid Profile',                                      labIdx: 2, labResults: [
      { testName: 'Total Cholesterol', category: 'lipids', unit: 'mg/dL', refMin: '0',  refMax: '200', result: '198', flag: 'normal', trend: 'improving', prior: '242' },
      { testName: 'LDL Cholesterol',   category: 'lipids', unit: 'mg/dL', refMin: '0',  refMax: '100', result: '108', flag: 'high',   trend: 'improving', prior: '118' },
      { testName: 'HDL Cholesterol',   category: 'lipids', unit: 'mg/dL', refMin: '50', refMax: '999', result: '51',  flag: 'normal', trend: 'improving', prior: '48'  },
      { testName: 'Triglycerides',     category: 'lipids', unit: 'mg/dL', refMin: '0',  refMax: '150', result: '142', flag: 'normal', trend: 'improving', prior: '180' },
    ]},
    { daysAgo: 20, panel: 'Vitamin & Bone Panel',                               labIdx: 3, labResults: [
      { testName: 'Vitamin D (25-OH)', category: 'vitamins', unit: 'ng/mL', refMin: '30',  refMax: '100', result: '22',  flag: 'low',    trend: 'improving', prior: '18'  },
      { testName: 'Vitamin B12',       category: 'vitamins', unit: 'pg/mL', refMin: '200', refMax: '900', result: '420', flag: 'normal', trend: 'stable',    prior: '410' },
      { testName: 'Serum Calcium',     category: 'vitamins', unit: 'mg/dL', refMin: '8.5', refMax: '10.2', result: '9.2', flag: 'normal', trend: 'stable',   prior: '9.0' },
      { testName: 'Serum Iron',        category: 'vitamins', unit: 'µg/dL', refMin: '60',  refMax: '170', result: '55',  flag: 'low',    trend: 'worsening', prior: '70'  },
    ]},
    { daysAgo: 7,  panel: 'Thyroid Function Test',                              labIdx: 4, labResults: [
      { testName: 'TSH',     category: 'metabolic', unit: 'mIU/L', refMin: '0.4', refMax: '4.0', result: '3.2', flag: 'normal', trend: 'stable',    prior: '2.8'  },
      { testName: 'Free T4', category: 'metabolic', unit: 'ng/dL', refMin: '0.8', refMax: '1.8', result: '1.3', flag: 'normal', trend: 'stable',    prior: '1.2'  },
      { testName: 'Free T3', category: 'metabolic', unit: 'pg/mL', refMin: '2.3', refMax: '4.2', result: '2.1', flag: 'low',    trend: 'worsening', prior: '2.5'  },
    ]},
  ]

  let labVisitCount = 0
  let labResultCount = 0

  for (const vDef of visitDefs) {
    const scheduledAt  = new Date(); scheduledAt.setDate(scheduledAt.getDate() - vDef.daysAgo)
    const scheduledEnd = new Date(scheduledAt.getTime() + 60 * 60 * 1000)
    const company      = labCompanies[vDef.labIdx]

    // Upsert by patient + scheduled time (avoid duplicates on re-run)
    let labVisit = await prisma.visit.findFirst({ where: { patientId: patient.id, scheduledAt, notes: { contains: vDef.panel } } })
    if (!labVisit) {
      labVisit = await prisma.visit.create({
        data: {
          orgId:       org.id,
          branchId:    branch.id,
          patientId:   patient.id,
          nurseId:     nurse.id,
          providerId:  doctor.id,
          serviceCode: 'lab_coordination',
          serviceCategory: 'scheduled',
          visitType:   'lab_coordination',
          scheduledAt,
          scheduledEnd,
          checkedInAt: scheduledAt,
          completedAt: scheduledEnd,
          durationMin: 60,
          status:      'completed',
          notes:       `${vDef.panel} — sent to ${company.name}`,
        },
      })
      labVisitCount++
    }

    for (const r of vDef.labResults) {
      const exists = await prisma.patientLabResult.findFirst({
        where: { patientId: patient.id, visitId: labVisit.id, testName: r.testName },
      })
      if (!exists) {
        await prisma.patientLabResult.create({
          data: {
            patientId:    patient.id,
            visitId:      labVisit.id,
            labCompanyId: company.id,
            panelDate:    scheduledAt,
            category:     r.category,
            testName:     r.testName,
            result:       r.result,
            unit:         r.unit,
            referenceMin: r.refMin,
            referenceMax: r.refMax ?? null,
            flag:         r.flag,
            priorResult:  r.prior,
            trend:        r.trend,
            notes:        `Lab: ${company.name}`,
          },
        })
        labResultCount++
      }
    }
    console.log(`  ${company.name}: ${vDef.panel}`)
  }
  console.log(`✓ Lab visits seeded: ${labVisitCount} visits, ${labResultCount} results across 5 lab companies`)

  console.log('\n✅ Seed complete!')
  console.log(`   Org ID:    ${org.id}`)
  console.log(`   Branch ID: ${branch.id}`)
  console.log(`\n   Add to .env.local:`)
  console.log(`   NEXT_PUBLIC_ORG_ID=${org.id}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
