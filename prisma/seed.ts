import bcrypt from "bcryptjs";
import { AmbulanceType, Role, UserStatus } from "../src/generated/prisma/enums";
import { prisma } from "../src/app/lib/prisma";

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Seed Super Admin
  const superAdminEmail = "haniful@gmail.com";
  const superAdminPassword = "haniful123";

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

    const superAdmin = await prisma.user.create({
      data: {
        name: "Haniful Islam",
        email: superAdminEmail,
        password: hashedPassword,
        phone: "+8801700000000",
        role: Role.SUPER_ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        needPasswordChange: false,
        admin: {
          create: {
            name: "Haniful Islam",
            email: superAdminEmail,
            orgEmail: "admin@pulseroute.com",
            contactNumber: "+8801700000000",
            department: "Platform Administration",
          },
        },
      },
    });

    console.log(`✅ Super Admin created successfully: ${superAdmin.email}`);
  } else {
    console.log(`ℹ️ Super Admin already exists: ${existingSuperAdmin.email}`);
  }

  // 2. Seed Pricing Configurations for each Ambulance Type
  const defaultPricing = [
    {
      ambulanceType: AmbulanceType.BASIC,
      baseFare: 500.0,
      perKmRate: 30.0,
      perMinuteRate: 2.0,
      platformCommissionRate: 0.12,
      nightSurgeMultiplier: 1.2,
      emergencySurgeMultiplier: 1.0,
      minFare: 500.0,
      cancellationFee: 100.0,
    },
    {
      ambulanceType: AmbulanceType.AC,
      baseFare: 800.0,
      perKmRate: 45.0,
      perMinuteRate: 3.0,
      platformCommissionRate: 0.12,
      nightSurgeMultiplier: 1.25,
      emergencySurgeMultiplier: 1.0,
      minFare: 800.0,
      cancellationFee: 150.0,
    },
    {
      ambulanceType: AmbulanceType.ICU,
      baseFare: 2000.0,
      perKmRate: 80.0,
      perMinuteRate: 5.0,
      platformCommissionRate: 0.15,
      nightSurgeMultiplier: 1.3,
      emergencySurgeMultiplier: 1.1,
      minFare: 2000.0,
      cancellationFee: 300.0,
    },
    {
      ambulanceType: AmbulanceType.FREEZER,
      baseFare: 1500.0,
      perKmRate: 60.0,
      perMinuteRate: 4.0,
      platformCommissionRate: 0.12,
      nightSurgeMultiplier: 1.2,
      emergencySurgeMultiplier: 1.0,
      minFare: 1500.0,
      cancellationFee: 200.0,
    },
    {
      ambulanceType: AmbulanceType.NEONATAL,
      baseFare: 2500.0,
      perKmRate: 90.0,
      perMinuteRate: 5.0,
      platformCommissionRate: 0.15,
      nightSurgeMultiplier: 1.3,
      emergencySurgeMultiplier: 1.1,
      minFare: 2500.0,
      cancellationFee: 350.0,
    },
  ];

  for (const price of defaultPricing) {
    await prisma.pricingConfig.upsert({
      where: { ambulanceType: price.ambulanceType },
      update: {},
      create: price,
    });
  }
  console.log("✅ Ambulance pricing configs seeded.");

  // 3. Seed Platform System Settings
  const settings = [
    {
      key: "EMERGENCY_HOTLINE",
      value: "999",
      description: "National emergency ambulance dispatch hotline",
    },
    {
      key: "SEARCH_RADIUS_KM",
      value: "10",
      description: "Default search radius in km for nearby ambulances",
    },
    {
      key: "OFFER_EXPIRY_SECONDS",
      value: "45",
      description: "Dispatch offer expiry timeout in seconds for drivers",
    },
    {
      key: "DEFAULT_COMMISSION_RATE",
      value: "0.12",
      description: "Default platform commission rate (12%)",
    },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("✅ System settings seeded.");

  // 4. Seed Verified Active Test Driver
  const driverEmail = "kamal.driver@example.com";
  const driverPassword = "password123";
  const existingDriverUser = await prisma.user.findUnique({
    where: { email: driverEmail },
  });

  if (!existingDriverUser) {
    const hashedPassword = await bcrypt.hash(driverPassword, 10);
    const driverUser = await prisma.user.create({
      data: {
        name: "Kamal Hossain",
        email: driverEmail,
        password: hashedPassword,
        phone: "+8801811223344",
        role: Role.DRIVER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      },
    });

    const driver = await prisma.driver.create({
      data: {
        userId: driverUser.id,
        name: "Kamal Hossain",
        email: driverEmail,
        contactNumber: "+8801811223344",
        licenseNumber: "DL-DHAKA-2024-9988",
        licenseExpiry: new Date("2028-12-31"),
        experienceYears: 6,
        verificationStatus: "APPROVED",
        dutyStatus: "ONLINE",
        currentLatitude: 23.7465,
        currentLongitude: 90.3752,
        rating: 4.9,
      },
    });

    const vehicle = await prisma.vehicle.create({
      data: {
        driverId: driver.id,
        vehicleNumber: "DHAKA-METRO-CHA-11-2233",
        ambulanceType: AmbulanceType.ICU,
        model: "Toyota HiAce Grandia Ambulance",
        manufacturer: "Toyota",
        year: 2023,
        hasOxygen: true,
        hasVentilator: true,
        hasDefibrillator: true,
        hasSuctionMachine: true,
        verificationStatus: "APPROVED",
        isActive: true,
      },
    });

    await prisma.driver.update({
      where: { id: driver.id },
      data: { currentVehicleId: vehicle.id },
    });

    await prisma.driverWallet.create({
      data: {
        driverId: driver.id,
        balance: 15000.0,
        currency: "BDT",
      },
    });

    console.log(`✅ Approved test Driver seeded: ${driverEmail} (Password: ${driverPassword})`);
  } else {
    // Ensure existing test driver is online and approved
    await prisma.driver.updateMany({
      where: { email: driverEmail },
      data: {
        verificationStatus: "APPROVED",
        dutyStatus: "ONLINE",
        currentLatitude: 23.7465,
        currentLongitude: 90.3752,
      },
    });
    console.log(`ℹ️ Test Driver updated to APPROVED and ONLINE: ${driverEmail}`);
  }

  // 5. Seed Test Patient User
  const patientEmail = "patient@pulseroute.com";
  const patientPassword = "password123";
  const existingPatient = await prisma.user.findUnique({
    where: { email: patientEmail },
  });

  if (!existingPatient) {
    const hashedPassword = await bcrypt.hash(patientPassword, 10);
    await prisma.user.create({
      data: {
        name: "Rahim Ahmed",
        email: patientEmail,
        password: hashedPassword,
        phone: "+8801711223344",
        role: Role.USER,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        patient: {
          create: {
            name: "Rahim Ahmed",
            email: patientEmail,
            contactNumber: "+8801711223344",
            address: "House 12, Road 5, Dhanmondi, Dhaka",
            emergencyContactNumber: "+8801711223355",
            bloodGroup: "O+",
          },
        },
      },
    });
    console.log(`✅ Test Patient seeded: ${patientEmail} (Password: ${patientPassword})`);
  }

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
