import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const categorySeeds = [
  { name: 'Office Supplies', description: 'Everyday consumables and stationery.' },
  { name: 'Electronics', description: 'Computer accessories and workplace technology.' },
  { name: 'Furniture', description: 'Desks, seating and storage for the office.' },
  { name: 'Cleaning Supplies', description: 'Janitorial products and surface care.' },
  { name: 'Packaging', description: 'Shipping and warehouse packing materials.' },
];

const supplierSeeds = [
  {
    name: 'Northwind Traders',
    contactName: 'Daniel Reyes',
    email: 'orders@northwind.example',
    phone: '+1 503 555 0142',
    address: '1420 Harbor Way, Portland, OR',
    notes: 'Preferred furniture supplier. Net 30 terms.',
  },
  {
    name: 'Acme Wholesale',
    contactName: 'Priya Shah',
    email: 'sales@acme.example',
    phone: '+1 415 555 0198',
    address: '88 Market Street, San Francisco, CA',
    notes: 'Office consumables and bulk stationery.',
  },
  {
    name: 'GreenLine Supplies',
    contactName: 'Marcus Cole',
    email: 'hello@greenline.example',
    phone: '+1 617 555 0117',
    address: '27 Elm Avenue, Boston, MA',
    notes: 'Eco-friendly cleaning products.',
  },
  {
    name: 'TechSource Distribution',
    contactName: 'Elena Fischer',
    email: 'accounts@techsource.example',
    phone: '+1 206 555 0164',
    address: '900 Innovation Drive, Seattle, WA',
    notes: 'Electronics distributor with weekly deliveries.',
  },
  {
    name: 'Metro Packaging',
    contactName: 'Jonah Brooks',
    email: 'support@metropack.example',
    phone: '+1 312 555 0133',
    address: '410 Industrial Road, Chicago, IL',
    notes: 'Boxes, tape and protective packaging.',
  },
];

const warehouseSeeds = [
  {
    name: 'Main Warehouse',
    code: 'MAIN',
    address: '1200 Distribution Way',
    city: 'Portland, OR',
  },
  {
    name: 'East Distribution Center',
    code: 'EAST',
    address: '44 Commerce Parkway',
    city: 'Boston, MA',
  },
];

interface ProductSeed {
  sku: string;
  name: string;
  description: string;
  category: string;
  supplier: string;
  unit: string;
  costPrice: string;
  sellingPrice: string;
  minStock: number;
  inventory: Record<string, number>;
}

const productSeeds: ProductSeed[] = [
  {
    sku: 'SKU-1001',
    name: 'A4 Copy Paper',
    description: '500 sheets, 80 gsm, bright white.',
    category: 'Office Supplies',
    supplier: 'Acme Wholesale',
    unit: 'ream',
    costPrice: '3.25',
    sellingPrice: '5.99',
    minStock: 40,
    inventory: { MAIN: 120, EAST: 30 },
  },
  {
    sku: 'SKU-1002',
    name: 'Gel Pens, Black (12-pack)',
    description: 'Quick-dry black gel pens for everyday writing.',
    category: 'Office Supplies',
    supplier: 'Acme Wholesale',
    unit: 'pack',
    costPrice: '4.10',
    sellingPrice: '7.49',
    minStock: 25,
    inventory: { MAIN: 18, EAST: 6 },
  },
  {
    sku: 'SKU-2001',
    name: 'Wireless Mouse',
    description: 'Ergonomic wireless mouse with USB receiver.',
    category: 'Electronics',
    supplier: 'TechSource Distribution',
    unit: 'pcs',
    costPrice: '12.50',
    sellingPrice: '24.99',
    minStock: 15,
    inventory: { MAIN: 40, EAST: 12 },
  },
  {
    sku: 'SKU-2002',
    name: 'USB-C Cable 2m',
    description: 'Braided USB-C charging and data cable.',
    category: 'Electronics',
    supplier: 'TechSource Distribution',
    unit: 'pcs',
    costPrice: '4.80',
    sellingPrice: '12.99',
    minStock: 30,
    inventory: { MAIN: 65, EAST: 20 },
  },
  {
    sku: 'SKU-2003',
    name: '27-inch Monitor',
    description: 'QHD IPS monitor with adjustable stand.',
    category: 'Electronics',
    supplier: 'TechSource Distribution',
    unit: 'pcs',
    costPrice: '165.00',
    sellingPrice: '279.00',
    minStock: 5,
    inventory: { MAIN: 8, EAST: 3 },
  },
  {
    sku: 'SKU-3001',
    name: 'Ergonomic Office Chair',
    description: 'Adjustable lumbar support and breathable mesh back.',
    category: 'Furniture',
    supplier: 'Northwind Traders',
    unit: 'pcs',
    costPrice: '89.00',
    sellingPrice: '179.00',
    minStock: 4,
    inventory: { MAIN: 6, EAST: 2 },
  },
  {
    sku: 'SKU-3002',
    name: 'Standing Desk',
    description: 'Electric sit-stand desk with memory presets.',
    category: 'Furniture',
    supplier: 'Northwind Traders',
    unit: 'pcs',
    costPrice: '210.00',
    sellingPrice: '399.00',
    minStock: 3,
    inventory: { MAIN: 4, EAST: 1 },
  },
  {
    sku: 'SKU-3003',
    name: 'Filing Cabinet',
    description: 'Three-drawer locking cabinet in graphite.',
    category: 'Furniture',
    supplier: 'Northwind Traders',
    unit: 'pcs',
    costPrice: '75.00',
    sellingPrice: '149.00',
    minStock: 5,
    inventory: { MAIN: 3, EAST: 0 },
  },
  {
    sku: 'SKU-4001',
    name: 'Multi-Surface Cleaner',
    description: 'Plant-based cleaner for desks and shared surfaces.',
    category: 'Cleaning Supplies',
    supplier: 'GreenLine Supplies',
    unit: 'bottle',
    costPrice: '2.10',
    sellingPrice: '4.99',
    minStock: 20,
    inventory: { MAIN: 45, EAST: 15 },
  },
  {
    sku: 'SKU-4002',
    name: 'Microfiber Cloths (10-pack)',
    description: 'Reusable lint-free cloths for daily cleaning.',
    category: 'Cleaning Supplies',
    supplier: 'GreenLine Supplies',
    unit: 'pack',
    costPrice: '5.60',
    sellingPrice: '11.99',
    minStock: 15,
    inventory: { MAIN: 22, EAST: 10 },
  },
  {
    sku: 'SKU-5001',
    name: 'Shipping Boxes, Medium (25-pack)',
    description: 'Double-wall corrugated boxes for general shipping.',
    category: 'Packaging',
    supplier: 'Metro Packaging',
    unit: 'pack',
    costPrice: '18.00',
    sellingPrice: '32.00',
    minStock: 10,
    inventory: { MAIN: 30, EAST: 8 },
  },
  {
    sku: 'SKU-5002',
    name: 'Packing Tape, Clear',
    description: 'Heavy-duty clear packing tape, 50 m roll.',
    category: 'Packaging',
    supplier: 'Metro Packaging',
    unit: 'roll',
    costPrice: '1.25',
    sellingPrice: '3.49',
    minStock: 50,
    inventory: { MAIN: 90, EAST: 25 },
  },
];

async function seedAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? 'admin@stockflow.dev').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const name = process.env.SEED_ADMIN_NAME ?? 'Olivia Bennett';
  const rounds = Number(process.env.BCRYPT_ROUNDS ?? 12);

  const passwordHash = await bcrypt.hash(password, rounds);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: Role.ADMIN },
    create: { name, email, passwordHash, role: Role.ADMIN },
  });

  console.log(`Seeded demo administrator: ${user.email}`);
  console.log(`Password: ${password} (change before deploying)`);
}

async function seedCatalog() {
  const categories = new Map<string, string>();
  for (const seed of categorySeeds) {
    const category = await prisma.category.upsert({
      where: { name: seed.name },
      update: { description: seed.description },
      create: seed,
    });
    categories.set(seed.name, category.id);
  }

  const suppliers = new Map<string, string>();
  for (const seed of supplierSeeds) {
    const existing = await prisma.supplier.findFirst({ where: { name: seed.name } });
    const supplier = existing
      ? await prisma.supplier.update({ where: { id: existing.id }, data: seed })
      : await prisma.supplier.create({ data: seed });
    suppliers.set(seed.name, supplier.id);
  }

  const warehouses = new Map<string, string>();
  for (const seed of warehouseSeeds) {
    const warehouse = await prisma.warehouse.upsert({
      where: { code: seed.code },
      update: { name: seed.name, address: seed.address, city: seed.city },
      create: seed,
    });
    warehouses.set(seed.code, warehouse.id);
  }

  for (const seed of productSeeds) {
    const categoryId = categories.get(seed.category);
    const supplierId = suppliers.get(seed.supplier);

    if (!categoryId || !supplierId) {
      throw new Error(`Missing catalog reference for ${seed.sku}`);
    }

    const product = await prisma.product.upsert({
      where: { sku: seed.sku },
      update: {
        name: seed.name,
        description: seed.description,
        categoryId,
        supplierId,
        unit: seed.unit,
        costPrice: seed.costPrice,
        sellingPrice: seed.sellingPrice,
        minStock: seed.minStock,
      },
      create: {
        sku: seed.sku,
        name: seed.name,
        description: seed.description,
        categoryId,
        supplierId,
        unit: seed.unit,
        costPrice: seed.costPrice,
        sellingPrice: seed.sellingPrice,
        minStock: seed.minStock,
      },
    });

    for (const [warehouseCode, quantity] of Object.entries(seed.inventory)) {
      const warehouseId = warehouses.get(warehouseCode);
      if (!warehouseId) {
        throw new Error(`Unknown warehouse ${warehouseCode} for ${seed.sku}`);
      }

      await prisma.inventory.upsert({
        where: { productId_warehouseId: { productId: product.id, warehouseId } },
        update: { quantity },
        create: { productId: product.id, warehouseId, quantity },
      });
    }
  }

  console.log(
    `Seeded catalog: ${categorySeeds.length} categories, ${supplierSeeds.length} suppliers, ` +
      `${warehouseSeeds.length} warehouses, ${productSeeds.length} products.`,
  );
}

async function main() {
  await seedAdmin();
  await seedCatalog();
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
