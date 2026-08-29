import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CatalogSeed {
  sku: string;
  name: string;
  aliases: string[];
  unitPrice: number;
  stockQty: number;
}

const items: CatalogSeed[] = [];

function add(sku: string, name: string, unitPrice: number, stockQty: number, aliases: string[] = []) {
  items.push({ sku, name, unitPrice: Math.round(unitPrice), stockQty, aliases: [name, ...aliases] });
}

/** Deterministic (not random) so re-seeding is idempotent - a fixed spread across a cycle, with a zero every 17th item to exercise the out-of-stock flow. */
function stockFor(i: number): number {
  return i % 17 === 0 ? 0 : ((i * 7) % 60) + 5;
}

// --- Solar panels ---------------------------------------------------------
const panelBrands = [
  { code: "INV", brand: "Inverex" },
  { code: "LON", brand: "Longi" },
  { code: "JAS", brand: "JA Solar" },
  { code: "CSI", brand: "Canadian Solar" },
  { code: "JKO", brand: "Jinko Solar" },
];
const panelWatts = [330, 440, 550, 620];
panelBrands.forEach((b, bi) => {
  panelWatts.forEach((w, wi) => {
    const i = bi * panelWatts.length + wi;
    add(
      `SP-${b.code}-${w}W`,
      `${b.brand} ${w}W steel frame solar panel`,
      w * 44 + bi * 300,
      stockFor(i),
      [`${b.brand} ${w}W`, `${w}W ${b.brand} panel`]
    );
  });
});
// Keep the exact PRD-example SKU/name as-is (referenced by earlier demo data and docs).
add("INV-JW-620W", "Inverex Jollywood 620W steel frame solar panel", 27500, 40, [
  "Inverex Jollywood 620W",
  "Jollywood 620W",
  "Inverex 620W steel frame",
]);

// --- Inverters / UPS -------------------------------------------------------
const inverterBrands = ["Inverex", "Growatt", "Solis", "Goodwe"];
const inverterCapacitiesKw = [1, 3, 5, 8];
inverterBrands.forEach((brand, bi) => {
  inverterCapacitiesKw.forEach((kw, ki) => {
    const i = bi * inverterCapacitiesKw.length + ki;
    add(
      `INVT-${brand.slice(0, 3).toUpperCase()}-${kw}KW`,
      `${brand} ${kw}kW hybrid solar inverter`,
      kw * 18000 + bi * 2000,
      stockFor(i),
      [`${brand} ${kw}kW inverter`, `${kw}kw ${brand}`]
    );
  });
});

// --- Batteries --------------------------------------------------------------
const batteryBrands = [
  { code: "OSK", brand: "Osaka", type: "Lead Acid" },
  { code: "AGS", brand: "AGS", type: "Lead Acid" },
  { code: "PHX", brand: "Phoenix", type: "Lithium LiFePO4" },
  { code: "ITL", brand: "ITEL", type: "Lithium LiFePO4" },
];
const batteryAh = [100, 150, 200, 220];
batteryBrands.forEach((b, bi) => {
  batteryAh.forEach((ah, ai) => {
    const i = bi * batteryAh.length + ai;
    const isLithium = b.type.startsWith("Lithium");
    add(
      `BAT-${b.code}-${ah}AH`,
      `${b.brand} ${ah}Ah ${b.type} battery`,
      ah * (isLithium ? 950 : 350) + bi * 500,
      stockFor(i),
      [`${b.brand} ${ah}Ah`, `${ah}AH ${b.brand}`]
    );
  });
});
// Matches the PRD's "out of stock" sample conversation exactly.
add("BAT-ITL-25V-100AH", "ITEL Lithium 25.6V 100AH IP20 battery", 145000, 0, [
  "Lithium 25.6V 100AH ITEL IP20",
  "ITEL 25.6V 100AH",
]);

// --- LED lighting -------------------------------------------------------
const ledBrands = ["Philips", "Osram", "Ring", "Nexon"];
const ledWatts = [9, 12, 18, 24];
ledBrands.forEach((brand, bi) => {
  ledWatts.forEach((w, wi) => {
    const i = bi * ledWatts.length + wi;
    add(`LED-${brand.slice(0, 3).toUpperCase()}-${w}W`, `${brand} ${w}W LED bulb`, w * 45 + bi * 40, stockFor(i), [
      `${brand} ${w}W bulb`,
      `${w}W LED bulb`,
      `${w} watt LED bulb`,
    ]);
  });
});

// --- CCTV cameras -------------------------------------------------------
const cctvBrands = ["Dahua", "Hikvision", "CP Plus"];
const cctvModels = [
  { code: "2MP-IND", desc: "2MP indoor dome camera" },
  { code: "2MP-OUT", desc: "2MP outdoor bullet camera" },
  { code: "4MP-OUT", desc: "4MP outdoor bullet camera" },
  { code: "4K-OUT", desc: "4K outdoor IP camera" },
];
cctvBrands.forEach((brand, bi) => {
  cctvModels.forEach((m, mi) => {
    const i = bi * cctvModels.length + mi;
    add(`CAM-${brand.slice(0, 3).toUpperCase()}-${m.code}`, `${brand} ${m.desc}`, 8500 + mi * 6000 + bi * 1000, stockFor(i), [
      `${brand} ${m.desc}`,
      `${brand} IPC ${m.code}`,
    ]);
  });
});

// --- Cables & wires -------------------------------------------------------
const cableBrands = ["Pak Elektron", "Newage", "Fast Cables"];
const cableGauges = ["1.5mm", "2.5mm", "4mm", "6mm"];
cableBrands.forEach((brand, bi) => {
  cableGauges.forEach((gauge, gi) => {
    const i = bi * cableGauges.length + gi;
    add(
      `WIRE-${brand.slice(0, 3).toUpperCase()}-${gauge}`,
      `${brand} ${gauge} copper wire cable (100m reel)`,
      parseFloat(gauge) * 220 + bi * 100,
      stockFor(i),
      [`${gauge} copper wire`, `${brand} ${gauge} cable`, "copper wire cable"]
    );
  });
});

// --- Circuit breakers / MCBs -------------------------------------------------------
const mcbRatings = [
  { amp: 16, pole: "single" },
  { amp: 20, pole: "single" },
  { amp: 32, pole: "single" },
  { amp: 40, pole: "single" },
  { amp: 63, pole: "single" },
  { amp: 16, pole: "triple" },
  { amp: 32, pole: "triple" },
  { amp: 63, pole: "triple" },
  { amp: 100, pole: "triple" },
  { amp: 20, pole: "double" },
];
mcbRatings.forEach((r, i) => {
  add(
    `MCB-${r.amp}A-${r.pole.toUpperCase()}`,
    `${r.amp}A ${r.pole} pole MCB circuit breaker`,
    r.amp * 45 + (r.pole === "triple" ? 1500 : r.pole === "double" ? 400 : 0),
    stockFor(i),
    [`${r.amp}A MCB`, `MCB ${r.amp}A ${r.pole} pole`, `${r.amp} amp breaker`]
  );
});

// --- Switches & sockets -------------------------------------------------------
const switchItems = [
  { name: "1-gang 1-way switch", price: 220 },
  { name: "2-gang 1-way switch", price: 320 },
  { name: "1-gang 2-way switch", price: 280 },
  { name: "5A universal socket", price: 250 },
  { name: "13A universal socket", price: 380 },
  { name: "USB charging socket", price: 950 },
  { name: "dimmer switch", price: 850 },
  { name: "fan speed regulator switch", price: 420 },
];
switchItems.forEach((s, i) => {
  add(`SW-${i + 1}`, s.name.replace(/^\w/, (c) => c.toUpperCase()), s.price, stockFor(i), [s.name]);
});

// --- Extension boards -------------------------------------------------------
[
  { sockets: 4, price: 850 },
  { sockets: 6, price: 1150 },
  { sockets: 8, price: 1450 },
  { sockets: 4, price: 1600, note: "with surge protector" },
  { sockets: 6, price: 1950, note: "with surge protector" },
].forEach((e, i) => {
  const name = `${e.sockets}-socket extension board${e.note ? " " + e.note : ""}`;
  add(`EXT-${i + 1}`, name.replace(/^\w/, (c) => c.toUpperCase()), e.price, stockFor(i), [name]);
});

// --- Voltage stabilizers -------------------------------------------------------
[1, 2, 3, 5, 10].forEach((kva, i) => {
  add(`STB-${kva}KVA`, `${kva}kVA automatic voltage stabilizer`, kva * 8500, stockFor(i), [`${kva} kva stabilizer`]);
});

// --- Distribution boards -------------------------------------------------------
[4, 8, 12, 18].forEach((ways, i) => {
  add(`DB-${ways}W`, `${ways}-way distribution board`, ways * 650, stockFor(i), [`${ways} way DB`, `${ways}-way DB box`]);
});

// --- Fans -------------------------------------------------------
[
  { name: "56-inch ceiling fan", price: 4200 },
  { name: "48-inch ceiling fan", price: 3600 },
  { name: "exhaust fan 8 inch", price: 2200 },
  { name: "exhaust fan 10 inch", price: 2800 },
  { name: "pedestal fan 18 inch", price: 3400 },
].forEach((f, i) => {
  add(`FAN-${i + 1}`, f.name.replace(/^\w/, (c) => c.toUpperCase()), f.price, stockFor(i), [f.name]);
});

// --- Junction boxes / connectors -------------------------------------------------------
[
  { name: "4x4 junction box", price: 90 },
  { name: "waterproof junction box", price: 320 },
  { name: "wago connector 3-way", price: 65 },
  { name: "wire nut connectors (pack of 100)", price: 450 },
].forEach((j, i) => {
  add(`JB-${i + 1}`, j.name.replace(/^\w/, (c) => c.toUpperCase()), j.price, stockFor(i), [j.name]);
});

// --- Misc tools -------------------------------------------------------
[
  { name: "digital multimeter", price: 2200 },
  { name: "voltage tester pen", price: 180 },
  { name: "wire stripper tool", price: 650 },
  { name: "crimping tool", price: 1400 },
  { name: "clamp meter", price: 3800 },
].forEach((t, i) => {
  add(`TOOL-${i + 1}`, t.name.replace(/^\w/, (c) => c.toUpperCase()), t.price, stockFor(i), [t.name]);
});

// --- Acrylic / signage (kept from the original seed, referenced by earlier demo flows) ---
add("ACR-3MM-12x18", "3mm acrylic sheet 12x18", 0.92, 5000, ["3mm acrylic sheet 12x18", "acrylic 12x18 3mm"]);

async function main() {
  for (const item of items) {
    await prisma.catalog.upsert({
      where: { sku: item.sku },
      update: { name: item.name, aliases: item.aliases, unitPrice: item.unitPrice, stockQty: item.stockQty },
      create: item,
    });
  }
  console.log(`Seeded ${items.length} catalog items.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
