// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // ساخت admin
  const adminPassword = await bcrypt.hash('Admin@1234', 10);
  await prisma.user.upsert({
    where: { phone: '0000000000' },
    update: {},
    create: {
      name: 'Administrator',
      phone: '0000000000',
      email: 'admin@bartar.local',
      password: adminPassword,
      role: 'admin'
    }
  });

  // خدمات نمونه
  const services = [
    { name: 'تعمیر موبایل', iconUrl: '/icons/mobile.svg' },
    { name: 'تعمیر لپتاپ', iconUrl: '/icons/laptop.svg' },
    { name: 'تعمیر لوازم خانگی', iconUrl: '/icons/home-appliance.svg' }
  ];
  for (const s of services) {
    await prisma.service.upsert({
      where: { name: s.name },
      update: {},
      create: s
    });
  }

  // برندها نمونه
  const brands = [
    { name: 'Apple', iconUrl: '/brands/apple.svg' },
    { name: 'Samsung', iconUrl: '/brands/samsung.svg' },
    { name: 'Xiaomi', iconUrl: '/brands/xiaomi.svg' }
  ];
  for (const b of brands) {
    await prisma.brand.upsert({
      where: { name: b.name },
      update: {},
      create: b
    });
  }

  // بنر نمونه
  await prisma.banner.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'تخفیف تعمیرات ویژه',
      imageUrl: '/banners/banner1.jpg',
      linkUrl: '',
      active: true
    }
  });

  console.log('Seed finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
