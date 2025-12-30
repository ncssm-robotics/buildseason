import { db } from "./index";
import { vendors } from "./schema";

const FTC_VENDORS = [
  {
    id: "vendor_rev",
    name: "REV Robotics",
    website: "https://www.revrobotics.com",
    avgLeadTimeDays: 5,
    notes: "Primary FTC parts supplier. Control Hub, motors, sensors.",
    isGlobal: true,
  },
  {
    id: "vendor_gobilda",
    name: "goBILDA",
    website: "https://www.gobilda.com",
    avgLeadTimeDays: 5,
    notes: "Channel, motion components, servos. Very popular for FTC.",
    isGlobal: true,
  },
  {
    id: "vendor_andymark",
    name: "AndyMark",
    website: "https://www.andymark.com",
    avgLeadTimeDays: 7,
    notes: "Wheels, batteries, game elements, field perimeter.",
    isGlobal: true,
  },
  {
    id: "vendor_servocity",
    name: "ServoCity",
    website: "https://www.servocity.com",
    avgLeadTimeDays: 5,
    notes: "Actobotics channel system, servos, mounts.",
    isGlobal: true,
  },
  {
    id: "vendor_amazon",
    name: "Amazon",
    website: "https://www.amazon.com",
    avgLeadTimeDays: 2,
    notes: "General supplies, tools, cables, misc electronics.",
    isGlobal: true,
  },
  {
    id: "vendor_mcmaster",
    name: "McMaster-Carr",
    website: "https://www.mcmaster.com",
    avgLeadTimeDays: 2,
    notes: "Hardware, fasteners, bearings, raw materials. Fast shipping.",
    isGlobal: true,
  },
  {
    id: "vendor_digikey",
    name: "DigiKey",
    website: "https://www.digikey.com",
    avgLeadTimeDays: 3,
    notes: "Electronics components, connectors, wiring supplies.",
    isGlobal: true,
  },
  {
    id: "vendor_sparkfun",
    name: "SparkFun",
    website: "https://www.sparkfun.com",
    avgLeadTimeDays: 5,
    notes: "Sensors, breakout boards, educational electronics.",
    isGlobal: true,
  },
  {
    id: "vendor_adafruit",
    name: "Adafruit",
    website: "https://www.adafruit.com",
    avgLeadTimeDays: 5,
    notes: "LEDs, sensors, Raspberry Pi accessories.",
    isGlobal: true,
  },
  {
    id: "vendor_misumi",
    name: "Misumi",
    website: "https://us.misumi-ec.com",
    avgLeadTimeDays: 10,
    notes: "Aluminum extrusion, linear motion, custom parts.",
    isGlobal: true,
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Insert vendors
  for (const vendor of FTC_VENDORS) {
    await db
      .insert(vendors)
      .values(vendor)
      .onConflictDoUpdate({
        target: vendors.id,
        set: {
          name: vendor.name,
          website: vendor.website,
          avgLeadTimeDays: vendor.avgLeadTimeDays,
          notes: vendor.notes,
        },
      });
    console.log(`  ✓ ${vendor.name}`);
  }

  console.log("✅ Seeding complete!");
}

seed().catch(console.error);
