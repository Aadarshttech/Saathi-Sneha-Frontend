/**
 * seed-extra.ts — adds 9 more providers, 9 more nurses, 9 more patients
 * (existing seed already has 1 of each, bringing totals to 10 each)
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // ── Org & branch (must already exist from seed.ts) ──────────────────────────
  const org = await prisma.organization.findFirstOrThrow({ where: { name: 'Saathi Sneha Care' } })
  const branch = await prisma.branch.findFirstOrThrow({ where: { orgId: org.id, name: 'Kathmandu Central' } })
  console.log(`✓ Org: ${org.name}  |  Branch: ${branch.name}`)

  // ── Providers (9 new) ────────────────────────────────────────────────────────
  const providerData = [
    { firstName: 'Anita',   lastName: 'Shrestha',  email: 'dr.anita@saathisnehacare.com',      phone: '+977-98-33001001', gender: 'female' as const, firstNameNepali: 'अनिता',    lastNameNepali: 'श्रेष्ठ' },
    { firstName: 'Bikram',  lastName: 'Karki',     email: 'dr.bikram@saathisnehacare.com',      phone: '+977-98-33001002', gender: 'male'   as const, firstNameNepali: 'विक्रम',   lastNameNepali: 'कार्की' },
    { firstName: 'Sunita',  lastName: 'Rai',       email: 'dr.sunita@saathisnehacare.com',      phone: '+977-98-33001003', gender: 'female' as const, firstNameNepali: 'सुनिता',   lastNameNepali: 'राई' },
    { firstName: 'Rajesh',  lastName: 'Pradhan',   email: 'dr.rajesh@saathisnehacare.com',      phone: '+977-98-33001004', gender: 'male'   as const, firstNameNepali: 'राजेश',    lastNameNepali: 'प्रधान' },
    { firstName: 'Meena',   lastName: 'Gurung',    email: 'dr.meena@saathisnehacare.com',       phone: '+977-98-33001005', gender: 'female' as const, firstNameNepali: 'मीना',     lastNameNepali: 'गुरुङ' },
    { firstName: 'Suresh',  lastName: 'Tamang',    email: 'dr.suresh@saathisnehacare.com',      phone: '+977-98-33001006', gender: 'male'   as const, firstNameNepali: 'सुरेश',    lastNameNepali: 'तामाङ' },
    { firstName: 'Binita',  lastName: 'Adhikari',  email: 'dr.binita@saathisnehacare.com',      phone: '+977-98-33001007', gender: 'female' as const, firstNameNepali: 'बिनिता',   lastNameNepali: 'अधिकारी' },
    { firstName: 'Manoj',   lastName: 'Poudel',    email: 'dr.manoj@saathisnehacare.com',       phone: '+977-98-33001008', gender: 'male'   as const, firstNameNepali: 'मनोज',     lastNameNepali: 'पौडेल' },
    { firstName: 'Sabina',  lastName: 'Maharjan',  email: 'dr.sabina@saathisnehacare.com',      phone: '+977-98-33001009', gender: 'female' as const, firstNameNepali: 'सबिना',    lastNameNepali: 'महर्जन' },
  ]

  const providers = []
  for (const p of providerData) {
    const user = await prisma.user.upsert({
      where:  { email: p.email },
      update: {},
      create: { orgId: org.id, branchId: branch.id, role: 'provider', isActive: true, preferredLanguage: 'ne', ...p },
    })
    providers.push(user)
  }
  console.log(`✓ Providers: ${providers.map(p => `${p.firstName} ${p.lastName}`).join(', ')}`)

  // ── Nurses (9 new) ───────────────────────────────────────────────────────────
  const nurseData = [
    { firstName: 'Rita',       lastName: 'Basnet',    email: 'nurse.rita@saathisnehacare.com',       phone: '+977-98-44001001', gender: 'female' as const, firstNameNepali: 'रिता',       lastNameNepali: 'बस्नेत' },
    { firstName: 'Kamala',     lastName: 'Bhandari',  email: 'nurse.kamala@saathisnehacare.com',     phone: '+977-98-44001002', gender: 'female' as const, firstNameNepali: 'कमला',       lastNameNepali: 'भण्डारी' },
    { firstName: 'Priya',      lastName: 'Thapa',     email: 'nurse.priya@saathisnehacare.com',      phone: '+977-98-44001003', gender: 'female' as const, firstNameNepali: 'प्रिया',     lastNameNepali: 'थापा' },
    { firstName: 'Sangita',    lastName: 'Limbu',     email: 'nurse.sangita@saathisnehacare.com',    phone: '+977-98-44001004', gender: 'female' as const, firstNameNepali: 'सङ्गीता',   lastNameNepali: 'लिम्बु' },
    { firstName: 'Urmila',     lastName: 'Ghimire',   email: 'nurse.urmila@saathisnehacare.com',     phone: '+977-98-44001005', gender: 'female' as const, firstNameNepali: 'उर्मिला',   lastNameNepali: 'घिमिरे' },
    { firstName: 'Nisha',      lastName: 'Subedi',    email: 'nurse.nisha@saathisnehacare.com',      phone: '+977-98-44001006', gender: 'female' as const, firstNameNepali: 'निशा',       lastNameNepali: 'सुवेदी' },
    { firstName: 'Pratiksha',  lastName: 'Koirala',   email: 'nurse.pratiksha@saathisnehacare.com',  phone: '+977-98-44001007', gender: 'female' as const, firstNameNepali: 'प्रतिक्षा', lastNameNepali: 'कोइराला' },
    { firstName: 'Asha',       lastName: 'Dhakal',    email: 'nurse.asha@saathisnehacare.com',       phone: '+977-98-44001008', gender: 'female' as const, firstNameNepali: 'आशा',        lastNameNepali: 'ढकाल' },
    { firstName: 'Bindu',      lastName: 'Chaudhary', email: 'nurse.bindu@saathisnehacare.com',      phone: '+977-98-44001009', gender: 'female' as const, firstNameNepali: 'बिन्दु',    lastNameNepali: 'चौधरी' },
  ]

  const nurses = []
  for (const n of nurseData) {
    const user = await prisma.user.upsert({
      where:  { email: n.email },
      update: {},
      create: { orgId: org.id, branchId: branch.id, role: 'nurse', isActive: true, preferredLanguage: 'ne', ...n },
    })
    nurses.push(user)
  }
  console.log(`✓ Nurses: ${nurses.map(n => `${n.firstName} ${n.lastName}`).join(', ')}`)

  // ── Patients (9 new) ─────────────────────────────────────────────────────────
  // nurses[0..8] and providers[0..8] match index-for-index with patients below
  const patientData = [
    {
      mrn: 'NHH-0000002',
      firstName: 'Ganesh', lastName: 'Regmi', firstNameNepali: 'गणेश', lastNameNepali: 'रेग्मी',
      gender: 'male' as const, dateOfBirth: new Date('1950-07-12'),
      phone: '+977-98-55555556', bloodGroup: 'O+',
      province: 'bagmati' as const, district: 'Lalitpur', municipality: 'Lalitpur Metropolitan', wardNo: 5,
      chronicConditions: ['COPD', 'Hypertension'],
      allergies: ['NSAIDs'],
      insuranceScheme: 'nsia' as const,
      emergencyContactName: 'Rajan Regmi', emergencyContactPhone: '+61-411-222333', emergencyContactRelation: 'Son (Australia)',
    },
    {
      mrn: 'NHH-0000003',
      firstName: 'Laxmi', lastName: 'Magar', firstNameNepali: 'लक्ष्मी', lastNameNepali: 'मगर',
      gender: 'female' as const, dateOfBirth: new Date('1943-02-20'),
      phone: '+977-98-55555557', bloodGroup: 'A+',
      province: 'bagmati' as const, district: 'Bhaktapur', municipality: 'Bhaktapur Municipality', wardNo: 3,
      chronicConditions: ['Dementia', 'Osteoporosis', 'Hypothyroidism'],
      allergies: [] as string[],
      insuranceScheme: 'sehat_bima' as const,
      emergencyContactName: 'Sunita Magar', emergencyContactPhone: '+44-7911-123456', emergencyContactRelation: 'Daughter (UK)',
    },
    {
      mrn: 'NHH-0000004',
      firstName: 'Bishnu', lastName: 'Shrestha', firstNameNepali: 'विष्णु', lastNameNepali: 'श्रेष्ठ',
      gender: 'male' as const, dateOfBirth: new Date('1957-11-03'),
      phone: '+977-98-55555558', bloodGroup: 'B-',
      province: 'bagmati' as const, district: 'Kathmandu', municipality: 'Kathmandu Metropolitan', wardNo: 32,
      chronicConditions: ['Chronic Kidney Disease Stage 3', 'Type 2 Diabetes'],
      allergies: ['Contrast dye'],
      insuranceScheme: 'ssf' as const,
      emergencyContactName: 'Pradeep Shrestha', emergencyContactPhone: '+1-647-555-7890', emergencyContactRelation: 'Son (Canada)',
    },
    {
      mrn: 'NHH-0000005',
      firstName: 'Saraswati', lastName: 'Pokharel', firstNameNepali: 'सरस्वती', lastNameNepali: 'पोखरेल',
      gender: 'female' as const, dateOfBirth: new Date('1954-04-18'),
      phone: '+977-98-55555559', bloodGroup: 'AB+',
      province: 'bagmati' as const, district: 'Kathmandu', municipality: 'Kathmandu Metropolitan', wardNo: 14,
      chronicConditions: ['Heart Failure (HFrEF)', 'Hypertension', 'Atrial Fibrillation'],
      allergies: ['Aspirin'],
      insuranceScheme: 'nsia' as const,
      emergencyContactName: 'Navin Pokharel', emergencyContactPhone: '+1-408-555-3456', emergencyContactRelation: 'Son (USA)',
    },
    {
      mrn: 'NHH-0000006',
      firstName: 'Hari', lastName: 'Tamang', firstNameNepali: 'हरि', lastNameNepali: 'तामाङ',
      gender: 'male' as const, dateOfBirth: new Date('1946-09-25'),
      phone: '+977-98-55555560', bloodGroup: 'O-',
      province: 'bagmati' as const, district: 'Sindhupalchok', municipality: 'Chautara Sangachokgadhi', wardNo: 2,
      chronicConditions: ["Parkinson's Disease", 'Depression', 'Hypertension'],
      allergies: [] as string[],
      insuranceScheme: 'sehat_bima' as const,
      emergencyContactName: 'Kiran Tamang', emergencyContactPhone: '+49-171-5551234', emergencyContactRelation: 'Daughter (Germany)',
    },
    {
      mrn: 'NHH-0000007',
      firstName: 'Goma', lastName: 'Bista', firstNameNepali: 'गोमा', lastNameNepali: 'बिष्ट',
      gender: 'female' as const, dateOfBirth: new Date('1960-12-07'),
      phone: '+977-98-55555561', bloodGroup: 'A-',
      province: 'gandaki' as const, district: 'Kaski', municipality: 'Pokhara Metropolitan', wardNo: 17,
      chronicConditions: ['Post-Stroke (2024)', 'Dysphagia', 'Right Hemiplegia'],
      allergies: ['Codeine'],
      insuranceScheme: 'private' as const,
      emergencyContactName: 'Sanjay Bista', emergencyContactPhone: '+61-423-555678', emergencyContactRelation: 'Husband (Australia)',
    },
    {
      mrn: 'NHH-0000008',
      firstName: 'Krishna', lastName: 'Tiwari', firstNameNepali: 'कृष्ण', lastNameNepali: 'तिवारी',
      gender: 'male' as const, dateOfBirth: new Date('1942-06-30'),
      phone: '+977-98-55555562', bloodGroup: 'B+',
      province: 'bagmati' as const, district: 'Kathmandu', municipality: 'Kathmandu Metropolitan', wardNo: 19,
      chronicConditions: ['Benign Prostatic Hyperplasia', 'Osteoarthritis', 'Falls Risk'],
      allergies: ['Penicillin'],
      insuranceScheme: 'none' as const,
      emergencyContactName: 'Mohan Tiwari', emergencyContactPhone: '+1-510-555-9012', emergencyContactRelation: 'Son (USA)',
    },
    {
      mrn: 'NHH-0000009',
      firstName: 'Parbati', lastName: 'Chhetri', firstNameNepali: 'पार्वती', lastNameNepali: 'क्षेत्री',
      gender: 'female' as const, dateOfBirth: new Date('1949-08-14'),
      phone: '+977-98-55555563', bloodGroup: 'O+',
      province: 'lumbini' as const, district: 'Rupandehi', municipality: 'Butwal Sub-Metropolitan', wardNo: 6,
      chronicConditions: ['COPD (Moderate)', 'Anxiety Disorder', 'Vitamin B12 Deficiency'],
      allergies: ['Sulfa drugs'],
      insuranceScheme: 'sehat_bima' as const,
      emergencyContactName: 'Manisha Chhetri', emergencyContactPhone: '+44-7800-555123', emergencyContactRelation: 'Daughter (UK)',
    },
    {
      mrn: 'NHH-0000010',
      firstName: 'Ram Chandra', lastName: 'Acharya', firstNameNepali: 'रामचन्द्र', lastNameNepali: 'आचार्य',
      gender: 'male' as const, dateOfBirth: new Date('1955-03-22'),
      phone: '+977-98-55555564', bloodGroup: 'AB-',
      province: 'bagmati' as const, district: 'Chitwan', municipality: 'Bharatpur Metropolitan', wardNo: 8,
      chronicConditions: ['Type 2 Diabetes', 'Peripheral Neuropathy', 'CKD Stage 2'],
      allergies: [] as string[],
      insuranceScheme: 'ssf' as const,
      emergencyContactName: 'Deepak Acharya', emergencyContactPhone: '+1-416-555-0123', emergencyContactRelation: 'Son (Canada)',
    },
  ]

  for (let i = 0; i < patientData.length; i++) {
    const pd = patientData[i]
    await prisma.patient.upsert({
      where:  { mrn: pd.mrn },
      update: {},
      create: {
        orgId:           org.id,
        branchId:        branch.id,
        primaryNurseId:  nurses[i].id,
        primaryDoctorId: providers[i].id,
        primaryLanguage: 'ne',
        isActive:        true,
        ...pd,
      },
    })
    console.log(`  ✓ Patient ${pd.mrn}: ${pd.firstName} ${pd.lastName} → Nurse: ${nurses[i].firstName}, Dr: ${providers[i].firstName}`)
  }

  // ── Quick vitals for each new patient ────────────────────────────────────────
  // Use nurse[0] as the recorder (any valid user ID will do)
  const recorderNurse = nurses[0]

  const vitalsTemplate = [
    { bpSys: 158, bpDia: 94,  hr: 78, temp: 36.8, spo2: 94, wt: 72.0 }, // Ganesh (COPD, HTN)
    { bpSys: 122, bpDia: 76,  hr: 68, temp: 36.5, spo2: 97, wt: 55.2 }, // Laxmi (dementia)
    { bpSys: 136, bpDia: 84,  hr: 74, temp: 36.7, spo2: 96, wt: 80.5 }, // Bishnu (CKD, DM)
    { bpSys: 148, bpDia: 90,  hr: 88, temp: 36.6, spo2: 95, wt: 64.3 }, // Saraswati (HF, HTN, AF)
    { bpSys: 144, bpDia: 88,  hr: 72, temp: 36.9, spo2: 96, wt: 68.7 }, // Hari (Parkinson's)
    { bpSys: 126, bpDia: 80,  hr: 82, temp: 36.5, spo2: 98, wt: 58.4 }, // Goma (post-stroke)
    { bpSys: 132, bpDia: 82,  hr: 66, temp: 36.4, spo2: 97, wt: 76.1 }, // Krishna (BPH, OA)
    { bpSys: 140, bpDia: 86,  hr: 76, temp: 37.0, spo2: 93, wt: 61.8 }, // Parbati (COPD)
    { bpSys: 138, bpDia: 86,  hr: 80, temp: 36.6, spo2: 96, wt: 83.2 }, // Ram Chandra (DM, neuro)
  ]

  for (let i = 0; i < patientData.length; i++) {
    const pd = patientData[i]
    const vt = vitalsTemplate[i]
    const patient = await prisma.patient.findUniqueOrThrow({ where: { mrn: pd.mrn } })

    const existingVital = await prisma.vital.findFirst({ where: { patientId: patient.id } })
    if (!existingVital) {
      await prisma.vital.create({
        data: {
          patientId:        patient.id,
          recordedById:     recorderNurse.id,
          recordedAt:       new Date(Date.now() - 3 * 24 * 3600 * 1000), // 3 days ago
          bloodPressureSys: vt.bpSys,
          bloodPressureDia: vt.bpDia,
          heartRate:        vt.hr,
          temperature:      vt.temp,
          oxygenSaturation: vt.spo2,
          weight:           vt.wt,
          isCritical:       vt.spo2 < 94,
        },
      })
    }
  }
  console.log('✓ Vitals seeded for all 9 new patients')

  // ── One scheduled visit per new patient ──────────────────────────────────────
  const serviceCodes = [
    'wellness_check',             // Ganesh
    'wellness_check',             // Laxmi
    'chronic_disease_monitoring', // Bishnu
    'medication_management',      // Saraswati
    'wellness_check',             // Hari
    'physiotherapy',              // Goma
    'wellness_check',             // Krishna
    'chronic_disease_monitoring', // Parbati
    'chronic_disease_monitoring', // Ram Chandra
  ] as const

  for (let i = 0; i < patientData.length; i++) {
    const pd = patientData[i]
    const patient = await prisma.patient.findUniqueOrThrow({ where: { mrn: pd.mrn } })

    const existing = await prisma.visit.findFirst({ where: { patientId: patient.id } })
    if (!existing) {
      const daysOut = 2 + i * 2  // stagger visits: day 2, 4, 6 …
      const scheduledAt  = new Date(Date.now() + daysOut * 24 * 3600 * 1000)
      scheduledAt.setHours(9 + (i % 4) * 2, 0, 0, 0)          // 9am, 11am, 1pm, 3pm rotation
      const scheduledEnd = new Date(scheduledAt.getTime() + 60 * 60 * 1000)

      await prisma.visit.create({
        data: {
          orgId:           org.id,
          branchId:        branch.id,
          patientId:       patient.id,
          nurseId:         nurses[i].id,
          providerId:      providers[i].id,
          serviceCode:     serviceCodes[i],
          serviceCategory: 'scheduled',
          scheduledAt,
          scheduledEnd,
          durationMin:     60,
          status:          'scheduled',
        },
      })
    }
  }
  console.log('✓ Upcoming visits seeded for all 9 new patients')

  console.log('\n✅ Extra seed complete! Totals: 10 providers, 10 nurses, 10 patients')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
