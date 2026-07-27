import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { BlogPost } from '../blogs/blog-post.entity';
import { UserRole } from '../common/enums';
import { Category } from '../categories/category.entity';
import { Inventory } from '../inventory/inventory.entity';
import { Product } from '../products/product.entity';
import { ShopSettings } from '../shop/shop-settings.entity';
import { TeamMember } from '../team/team-member.entity';
import { User } from '../users/user.entity';

const ABOUT_TEXT =
  'From Pakistan to Dubai, Oman, and Saudi Arabia, Bait Al Shifa Natural Herbs has earned the trust of millions through premium herbal solutions, international recognition, and a commitment to quality, authenticity, and natural wellness. For over 300 years we have preserved herbal heritage with Pure Honey, Zafran, Sand Fish, and carefully selected herbs.';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Inventory)
    private readonly inventoryRepo: Repository<Inventory>,
    @InjectRepository(ShopSettings)
    private readonly shopRepo: Repository<ShopSettings>,
    @InjectRepository(BlogPost)
    private readonly blogsRepo: Repository<BlogPost>,
    @InjectRepository(TeamMember)
    private readonly teamRepo: Repository<TeamMember>,
  ) {}

  async onModuleInit() {
    if (this.config.get('SEED_ON_START') !== 'true') return;
    await this.seed();
  }

  async seed() {
    try {
      await this.usersRepo.query(
        `ALTER TABLE users ALTER COLUMN role TYPE varchar(32) USING role::text`,
      );
    } catch {
      /* already varchar or table missing */
    }

    try {
      await this.usersRepo.query(
        `ALTER TABLE orders ALTER COLUMN status TYPE varchar(32) USING status::text`,
      );
    } catch {
      /* already varchar or table missing */
    }

    try {
      await this.usersRepo.query(
        `UPDATE orders SET status = 'DONE' WHERE status IN ('PREPARING', 'READY', 'COMPLETED')`,
      );
    } catch {
      /* ignore if no orders table yet */
    }

    const userCount = await this.usersRepo.count();
    if (userCount === 0) {
      const adminHash = await bcrypt.hash('Admin123!', 10);
      const cashierHash = await bcrypt.hash('Cashier123!', 10);
      const customerHash = await bcrypt.hash('Customer123!', 10);
      await this.usersRepo.save([
        this.usersRepo.create({
          email: 'admin@clinic.health',
          name: 'Clinic Admin',
          role: UserRole.SUPER_ADMIN,
          passwordHash: adminHash,
          isActive: true,
        }),
        this.usersRepo.create({
          email: 'staff@clinic.health',
          name: 'Clinic Staff',
          role: UserRole.CASHIER,
          passwordHash: cashierHash,
          isActive: true,
        }),
        this.usersRepo.create({
          email: 'patient@clinic.health',
          name: 'Demo Patient',
          role: UserRole.CUSTOMER,
          passwordHash: customerHash,
          phone: '+92 336 3887222',
          address: '1103A, Mall of Islamabad, Blue Area',
          city: 'Islamabad',
          isActive: true,
        }),
      ]);
      this.logger.log('Seeded admin, staff, and patient users');
    } else {
      const existingCustomer = await this.usersRepo.findOne({
        where: { email: 'patient@clinic.health' },
      });
      if (!existingCustomer) {
        const customerHash = await bcrypt.hash('Customer123!', 10);
        await this.usersRepo.save(
          this.usersRepo.create({
            email: 'patient@clinic.health',
            name: 'Demo Patient',
            role: UserRole.CUSTOMER,
            passwordHash: customerHash,
            phone: '+92 336 3887222',
            address: '1103A, Mall of Islamabad, Blue Area',
            city: 'Islamabad',
            isActive: true,
          }),
        );
        this.logger.log('Seeded demo patient user');
      }
    }

    if ((await this.shopRepo.count()) === 0) {
      await this.shopRepo.save(
        this.shopRepo.create({
          name: 'Bait Al Shifa Natural Herbs',
          taxPercent: 0,
          currency: 'PKR',
          phone: '+92 336 3887222',
          whatsapp: '+923363887222',
          address: '1103A, Mall of Islamabad, Blue Area, Islamabad 44000',
          logoUrl: '/uploads/logo.png',
          aboutText: ABOUT_TEXT,
        }),
      );
      this.logger.log('Seeded shop settings');
    }

    if ((await this.categoriesRepo.count()) === 0) {
      const honey = await this.categoriesRepo.save(
        this.categoriesRepo.create({
          name: 'Honey Collection',
          sortOrder: 1,
          isActive: true,
        }),
      );
      const joint = await this.categoriesRepo.save(
        this.categoriesRepo.create({
          name: 'Joint Care',
          sortOrder: 2,
          isActive: true,
        }),
      );
      const fertility = await this.categoriesRepo.save(
        this.categoriesRepo.create({
          name: 'Fertility Support',
          sortOrder: 3,
          isActive: true,
        }),
      );
      const wellness = await this.categoriesRepo.save(
        this.categoriesRepo.create({
          name: 'Herbal Wellness',
          sortOrder: 4,
          isActive: true,
        }),
      );
      const premium = await this.categoriesRepo.save(
        this.categoriesRepo.create({
          name: 'Premium Ingredients',
          sortOrder: 5,
          isActive: true,
        }),
      );

      const dosage =
        'Suitable for individuals older than five years. Take 1 tablespoon morning and evening. For any severe medical condition, consult a doctor.';

      const menu: Array<{
        name: string;
        price: number;
        categoryId: string;
        stock: number;
        imageUrl: string;
        description: string;
      }> = [
        {
          name: 'Pure Honey',
          price: 3500,
          categoryId: honey.id,
          stock: 200,
          imageUrl: '/products/product-01.jpg',
          description:
            '100% pure natural honey — Halal certified. Premium taste for every season and every home.',
        },
        {
          name: 'Premium Dry Fruits Honey Mix',
          price: 4500,
          categoryId: honey.id,
          stock: 150,
          imageUrl: '/products/product-03.jpg',
          description:
            'Pure honey blended with premium dry fruits for daily energy and natural wellness.',
        },
        {
          name: 'Majoon-e-Aujaiya',
          price: 2500,
          categoryId: joint.id,
          stock: 200,
          imageUrl: '/products/product-07.jpg',
          description: `Asgandh Nagori, Sumbul Misri, Gudhara, Baeman Safaid, Baeman Surkh, Kachura Mudabbar, Honey. ${dosage}`,
        },
        {
          name: 'Joint Support Herbal Remedy',
          price: 2800,
          categoryId: joint.id,
          stock: 180,
          imageUrl: '/products/product-08.jpg',
          description:
            'Traditional herbal formulation for joint comfort and everyday mobility support.',
        },
        {
          name: 'Back & Disc Support',
          price: 3000,
          categoryId: joint.id,
          stock: 160,
          imageUrl: '/products/product-09.jpg',
          description:
            'Herbal support for back and disc wellness, crafted with premium natural ingredients.',
        },
        {
          name: 'Majoon-e-Nissa',
          price: 2500,
          categoryId: fertility.id,
          stock: 200,
          imageUrl: '/products/product-11.jpg',
          description: `Musli Safaid, Asgandh Nagori, Musli Siyah, Badam, Pista, Akhrot, Shahad. ${dosage} No side effects when used as directed.`,
        },
        {
          name: 'Male Fertility Support',
          price: 3200,
          categoryId: fertility.id,
          stock: 140,
          imageUrl: '/products/product-12.jpg',
          description:
            'Herbal fertility support for men using carefully selected traditional ingredients.',
        },
        {
          name: 'Female Fertility Support',
          price: 3200,
          categoryId: fertility.id,
          stock: 140,
          imageUrl: '/products/product-13.jpg',
          description:
            'Gentle herbal fertility support for women, prepared to premium quality standards.',
        },
        {
          name: 'Safoof-e-Tabkhir',
          price: 2500,
          categoryId: wellness.id,
          stock: 200,
          imageUrl: '/products/product-10.jpg',
          description: `Saunf, Halela Zard, Halela Siyah, Gulab ke pattay, Pudeena Khushk, Ajwain, Namak Siyah, Sana Makki. Useful for digestion, gas, and stomach comfort. ${dosage} No side effects when used as directed.`,
        },
        {
          name: 'Daily Wellness Herbal Mix',
          price: 2200,
          categoryId: wellness.id,
          stock: 190,
          imageUrl: '/products/product-14.jpg',
          description:
            'Everyday herbal wellness blend for general health support of the whole family.',
        },
        {
          name: 'Energy Support Formula',
          price: 2400,
          categoryId: wellness.id,
          stock: 170,
          imageUrl: '/products/product-16.jpg',
          description:
            'Natural energy support formula with premium herbs for vitality and stamina.',
        },
        {
          name: 'General Health Support',
          price: 2100,
          categoryId: wellness.id,
          stock: 200,
          imageUrl: '/products/product-17.jpg',
          description:
            'Balanced herbal formula for overall wellness, immunity, and daily balance.',
        },
        {
          name: 'Zafran (Saffron) Premium',
          price: 5000,
          categoryId: premium.id,
          stock: 80,
          imageUrl: '/products/product-18.jpg',
          description:
            'Premium Zafran (saffron) — a prized natural ingredient used across our herbal range.',
        },
        {
          name: 'Sand Fish Extract',
          price: 4000,
          categoryId: premium.id,
          stock: 90,
          imageUrl: '/products/product-19.jpg',
          description:
            'Carefully prepared Sand Fish extract used in traditional premium herbal formulations.',
        },
        {
          name: 'Premium Herbs Assortment',
          price: 1800,
          categoryId: premium.id,
          stock: 200,
          imageUrl: '/products/product-20.jpg',
          description:
            'Curated assortment of premium herbs selected for authenticity and quality.',
        },
      ];

      for (const item of menu) {
        const product = await this.productsRepo.save(
          this.productsRepo.create({
            name: item.name,
            price: item.price,
            categoryId: item.categoryId,
            imageUrl: item.imageUrl,
            description: item.description,
            isAvailable: true,
          }),
        );
        await this.inventoryRepo.save(
          this.inventoryRepo.create({
            productId: product.id,
            quantity: item.stock,
            lowStockThreshold: 15,
          }),
        );
      }
      this.logger.log('Seeded herbal catalog and inventory');
    } else {
      const defaults: Record<string, { imageUrl: string; price: number }> = {
        'Pure Honey': { imageUrl: '/products/product-01.jpg', price: 3500 },
        'Premium Dry Fruits Honey Mix': {
          imageUrl: '/products/product-03.jpg',
          price: 4500,
        },
        'Majoon-e-Aujaiya': { imageUrl: '/products/product-07.jpg', price: 2500 },
        'Joint Support Herbal Remedy': {
          imageUrl: '/products/product-08.jpg',
          price: 2800,
        },
        'Back & Disc Support': {
          imageUrl: '/products/product-09.jpg',
          price: 3000,
        },
        'Majoon-e-Nissa': { imageUrl: '/products/product-11.jpg', price: 2500 },
        'Male Fertility Support': {
          imageUrl: '/products/product-12.jpg',
          price: 3200,
        },
        'Female Fertility Support': {
          imageUrl: '/products/product-13.jpg',
          price: 3200,
        },
        'Safoof-e-Tabkhir': {
          imageUrl: '/products/product-10.jpg',
          price: 2500,
        },
        'Daily Wellness Herbal Mix': {
          imageUrl: '/products/product-14.jpg',
          price: 2200,
        },
        'Energy Support Formula': {
          imageUrl: '/products/product-16.jpg',
          price: 2400,
        },
        'General Health Support': {
          imageUrl: '/products/product-17.jpg',
          price: 2100,
        },
        'Zafran (Saffron) Premium': {
          imageUrl: '/products/product-18.jpg',
          price: 5000,
        },
        'Sand Fish Extract': {
          imageUrl: '/products/product-19.jpg',
          price: 4000,
        },
        'Premium Herbs Assortment': {
          imageUrl: '/products/product-20.jpg',
          price: 1800,
        },
      };
      const fallback = '/products/product-01.jpg';
      const products = await this.productsRepo.find();
      let synced = 0;
      for (const product of products) {
        const catalog = defaults[product.name];
        let changed = false;
        if (catalog) {
          if (
            !product.imageUrl ||
            product.imageUrl.startsWith('/uploads/products/')
          ) {
            product.imageUrl = catalog.imageUrl;
            changed = true;
          }
          if (Number(product.price) !== catalog.price) {
            product.price = catalog.price;
            changed = true;
          }
        } else if (!product.imageUrl) {
          product.imageUrl = fallback;
          changed = true;
        } else if (product.imageUrl.startsWith('/uploads/products/')) {
          product.imageUrl = product.imageUrl.replace(
            '/uploads/products/',
            '/products/',
          );
          changed = true;
        }
        if (changed) {
          synced += 1;
          await this.productsRepo.save(product);
        }
      }
      if (synced) {
        this.logger.log(`Synced ${synced} catalog products (images/prices)`);
      }
    }

    const dosageNote =
      'Suitable for individuals older than five years. Take 1 tablespoon morning and evening. For any severe medical condition, consult a doctor.';

    const catalogPosts: Array<{
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      coverImageUrl: string;
    }> = [
      {
        title: 'Our Complete Herbal Catalog',
        slug: 'complete-herbal-catalog',
        excerpt:
          'Explore every Bait Al Shifa product — honey, joint care, fertility support, wellness, and premium ingredients.',
        content: `Welcome to the Bait Al Shifa Natural Herbs catalog. Every product is crafted with premium natural ingredients and trusted across Pakistan, Dubai, Oman, and Saudi Arabia.\n\nBrowse categories: Honey Collection, Joint Care, Fertility Support, Herbal Wellness, and Premium Ingredients. Free delivery on orders of Rs. 5,000+ across Pakistan.`,
        coverImageUrl:
          'https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80',
      },
      {
        title: 'Pure Honey — Rs. 3,500',
        slug: 'product-pure-honey',
        excerpt: '100% pure Halal-certified natural honey for every home.',
        content: `Product: Pure Honey\nCategory: Honey Collection\nPrice: Rs. 3,500\nStock: Available\n\n100% pure natural honey — Halal certified. Premium taste for every season and every home. Useful for digestion, seasonal comfort, energy, and daily wellness.\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-01.jpg',
      },
      {
        title: 'Premium Dry Fruits Honey Mix — Rs. 4,500',
        slug: 'product-premium-dry-fruits-honey-mix',
        excerpt: 'Pure honey blended with premium dry fruits for daily energy.',
        content: `Product: Premium Dry Fruits Honey Mix\nCategory: Honey Collection\nPrice: Rs. 4,500\n\nPure honey blended with premium dry fruits for daily energy and natural wellness.\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-03.jpg',
      },
      {
        title: 'Majoon-e-Aujaiya — Rs. 2,500',
        slug: 'product-majoon-e-aujaiya',
        excerpt: 'Traditional joint-care majoon with Asgandh Nagori and honey.',
        content: `Product: Majoon-e-Aujaiya\nCategory: Joint Care\nPrice: Rs. 2,500\nSKU range: BAS herbal formula\n\nIngredients: Asgandh Nagori, Sumbul Misri, Gudhara, Baeman Safaid, Baeman Surkh, Kachura Mudabbar, Honey.\n\n${dosageNote}\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-07.jpg',
      },
      {
        title: 'Joint Support Herbal Remedy — Rs. 2,800',
        slug: 'product-joint-support-herbal-remedy',
        excerpt: 'Herbal support for everyday joint comfort and mobility.',
        content: `Product: Joint Support Herbal Remedy\nCategory: Joint Care\nPrice: Rs. 2,800\n\nTraditional herbal formulation for joint comfort and everyday mobility support.\n\n${dosageNote}\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-08.jpg',
      },
      {
        title: 'Back & Disc Support — Rs. 3,000',
        slug: 'product-back-disc-support',
        excerpt: 'Herbal care formulated for back and disc wellness.',
        content: `Product: Back & Disc Support\nCategory: Joint Care\nPrice: Rs. 3,000\n\nHerbal support for back and disc wellness, crafted with premium natural ingredients.\n\n${dosageNote}\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-09.jpg',
      },
      {
        title: 'Majoon-e-Nissa — Rs. 2,500',
        slug: 'product-majoon-e-nissa',
        excerpt: 'Classic fertility-support majoon with Musli, nuts, and shahad.',
        content: `Product: Majoon-e-Nissa\nCategory: Fertility Support\nPrice: Rs. 2,500\n\nIngredients: Musli Safaid, Asgandh Nagori, Musli Siyah, Badam, Pista, Akhrot, Shahad.\n\n${dosageNote} No side effects when used as directed.\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-11.jpg',
      },
      {
        title: 'Male Fertility Support — Rs. 3,200',
        slug: 'product-male-fertility-support',
        excerpt: 'Herbal fertility support for men with selected traditional herbs.',
        content: `Product: Male Fertility Support\nCategory: Fertility Support\nPrice: Rs. 3,200\n\nHerbal fertility support for men using carefully selected traditional ingredients.\n\n${dosageNote}\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-12.jpg',
      },
      {
        title: 'Female Fertility Support — Rs. 3,200',
        slug: 'product-female-fertility-support',
        excerpt: 'Gentle herbal fertility support prepared to premium standards.',
        content: `Product: Female Fertility Support\nCategory: Fertility Support\nPrice: Rs. 3,200\n\nGentle herbal fertility support for women, prepared to premium quality standards.\n\n${dosageNote}\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-13.jpg',
      },
      {
        title: 'Safoof-e-Tabkhir — Rs. 2,500',
        slug: 'product-safoof-e-tabkhir',
        excerpt: 'Digestive herbal powder for gas, indigestion, and stomach comfort.',
        content: `Product: Safoof-e-Tabkhir\nCategory: Herbal Wellness\nPrice: Rs. 2,500\n\nIngredients: Saunf, Halela Zard, Halela Siyah, Gulab ke pattay, Pudeena Khushk, Ajwain, Namak Siyah, Sana Makki.\n\nUseful for digestion, gas, nausea, and stomach comfort. Patients with high blood pressure may use as directed.\n\n${dosageNote} No side effects when used as directed.\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-10.jpg',
      },
      {
        title: 'Daily Wellness Herbal Mix — Rs. 2,200',
        slug: 'product-daily-wellness-herbal-mix',
        excerpt: 'Everyday herbal blend for whole-family general health support.',
        content: `Product: Daily Wellness Herbal Mix\nCategory: Herbal Wellness\nPrice: Rs. 2,200\n\nEveryday herbal wellness blend for general health support of the whole family.\n\n${dosageNote}\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-14.jpg',
      },
      {
        title: 'Energy Support Formula — Rs. 2,400',
        slug: 'product-energy-support-formula',
        excerpt: 'Natural energy support with premium herbs for vitality.',
        content: `Product: Energy Support Formula\nCategory: Herbal Wellness\nPrice: Rs. 2,400\n\nNatural energy support formula with premium herbs for vitality and stamina.\n\n${dosageNote}\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-16.jpg',
      },
      {
        title: 'General Health Support — Rs. 2,100',
        slug: 'product-general-health-support',
        excerpt: 'Balanced herbal formula for immunity and everyday balance.',
        content: `Product: General Health Support\nCategory: Herbal Wellness\nPrice: Rs. 2,100\n\nBalanced herbal formula for overall wellness, immunity, and daily balance.\n\n${dosageNote}\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-17.jpg',
      },
      {
        title: 'Zafran (Saffron) Premium — Rs. 5,000',
        slug: 'product-zafran-saffron-premium',
        excerpt: 'Premium Zafran used across our herbal formulations.',
        content: `Product: Zafran (Saffron) Premium\nCategory: Premium Ingredients\nPrice: Rs. 5,000\n\nPremium Zafran (saffron) — a prized natural ingredient used across our herbal range.\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-18.jpg',
      },
      {
        title: 'Sand Fish Extract — Rs. 4,000',
        slug: 'product-sand-fish-extract',
        excerpt: 'Traditional Sand Fish extract for premium herbal formulas.',
        content: `Product: Sand Fish Extract\nCategory: Premium Ingredients\nPrice: Rs. 4,000\n\nCarefully prepared Sand Fish extract used in traditional premium herbal formulations.\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-19.jpg',
      },
      {
        title: 'Premium Herbs Assortment — Rs. 1,800',
        slug: 'product-premium-herbs-assortment',
        excerpt: 'Curated premium herbs selected for authenticity and quality.',
        content: `Product: Premium Herbs Assortment\nCategory: Premium Ingredients\nPrice: Rs. 1,800\n\nCurated assortment of premium herbs selected for authenticity and quality.\n\nBrand: Bait Al Shifa Natural Herbs`,
        coverImageUrl: '/products/product-20.jpg',
      },
    ];

    for (const post of catalogPosts) {
      const existing = await this.blogsRepo.findOne({
        where: { slug: post.slug },
      });
      if (existing) {
        existing.title = post.title;
        existing.excerpt = post.excerpt;
        existing.content = post.content;
        existing.coverImageUrl = post.coverImageUrl;
        existing.isPublished = true;
        await this.blogsRepo.save(existing);
      } else {
        await this.blogsRepo.save(
          this.blogsRepo.create({ ...post, isPublished: true }),
        );
      }
    }
    // Remove older coffee/demo posts that are not in the catalog list
    const keepSlugs = catalogPosts.map((p) => p.slug);
    const allBlogs = await this.blogsRepo.find();
    for (const blog of allBlogs) {
      if (!keepSlugs.includes(blog.slug)) {
        await this.blogsRepo.remove(blog);
      }
    }
    this.logger.log(`Synced ${catalogPosts.length} product blog posts`);

    if ((await this.teamRepo.count()) === 0) {
      await this.teamRepo.save([
        this.teamRepo.create({
          name: 'Dr. Ayesha Khan',
          roleTitle: 'Herbal Consultant',
          bio: 'Guides customers on traditional herbal formulations and safe daily use.',
          photoUrl:
            'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=600&q=80',
          sortOrder: 1,
          isActive: true,
        }),
        this.teamRepo.create({
          name: 'Hassan Ali',
          roleTitle: 'Quality Lead',
          bio: 'Oversees ingredient selection, packing standards, and Halal compliance.',
          photoUrl:
            'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=600&q=80',
          sortOrder: 2,
          isActive: true,
        }),
        this.teamRepo.create({
          name: 'Sara Malik',
          roleTitle: 'Wellness Advisor',
          bio: 'Helps families choose honey, fertility, and daily wellness products.',
          photoUrl:
            'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=600&q=80',
          sortOrder: 3,
          isActive: true,
        }),
        this.teamRepo.create({
          name: 'Omar Raza',
          roleTitle: 'Store Manager',
          bio: 'Manages the Mall of Islamabad counter and nationwide order dispatch.',
          photoUrl:
            'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
          sortOrder: 4,
          isActive: true,
        }),
      ]);
      this.logger.log('Seeded team members');
    }
  }
}
