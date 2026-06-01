import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const smartphones = await prisma.category.upsert({
    where: { slug: 'smartphones' },
    update: {
      name: 'Smartphones',
      description: 'Mobile phones and smartphone accessories.',
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
      isActive: true,
      isDelete: false,
      deletedAt: null,
    },
    create: {
      name: 'Smartphones',
      slug: 'smartphones',
      description: 'Mobile phones and smartphone accessories.',
      imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9',
    },
  });

  const laptops = await prisma.category.upsert({
    where: { slug: 'laptops' },
    update: {
      name: 'Laptops',
      description: 'Portable computers for work, study, and gaming.',
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
      isActive: true,
      isDelete: false,
      deletedAt: null,
    },
    create: {
      name: 'Laptops',
      slug: 'laptops',
      description: 'Portable computers for work, study, and gaming.',
      imageUrl: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853',
    },
  });

  const products = [
    {
      title: 'iPhone 15',
      slug: 'iphone-15',
      description: 'Apple smartphone with a bright display and fast A16 chip.',
      price: '899.00',
      oldPrice: '999.00',
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569',
      images: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab',
      ],
      stock: 15,
      rating: '4.80',
      categoryId: smartphones.id,
    },
    {
      title: 'Samsung Galaxy S24',
      slug: 'samsung-galaxy-s24',
      description: 'Android flagship smartphone with AMOLED display.',
      price: '799.00',
      oldPrice: '899.00',
      imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf',
      images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf'],
      stock: 20,
      rating: '4.70',
      categoryId: smartphones.id,
    },
    {
      title: 'MacBook Air 13',
      slug: 'macbook-air-13',
      description: 'Lightweight Apple laptop for everyday productivity.',
      price: '1199.00',
      oldPrice: '1299.00',
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8'],
      stock: 10,
      rating: '4.90',
      categoryId: laptops.id,
    },
    {
      title: 'Lenovo ThinkPad X1 Carbon',
      slug: 'lenovo-thinkpad-x1-carbon',
      description: 'Business laptop with a durable body and long battery life.',
      price: '1499.00',
      oldPrice: null,
      imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed',
      images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed'],
      stock: 8,
      rating: '4.60',
      categoryId: laptops.id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        title: product.title,
        description: product.description,
        price: product.price,
        oldPrice: product.oldPrice,
        imageUrl: product.imageUrl,
        images: product.images,
        stock: product.stock,
        rating: product.rating,
        categoryId: product.categoryId,
        isActive: true,
        isDelete: false,
        deletedAt: null,
      },
      create: product,
    });
  }
}

main()
  .then(async () => {
    console.log('Seed completed: categories and products were created.');
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
