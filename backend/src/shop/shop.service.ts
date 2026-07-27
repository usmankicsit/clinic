import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { Repository } from 'typeorm';
import { UpdateShopDto } from './dto/shop.dto';
import { ShopSettings } from './shop-settings.entity';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(ShopSettings)
    private readonly shopRepo: Repository<ShopSettings>,
  ) {}

  async get() {
    let settings = await this.shopRepo.findOne({ where: {} });
    if (!settings) {
      settings = await this.shopRepo.save(
        this.shopRepo.create({
          name: 'Bait Al Shifa Natural Herbs',
          taxPercent: 0,
          currency: 'PKR',
          phone: '+92 336 3887222',
          whatsapp: '+923363887222',
          address: '1103A, Mall of Islamabad, Blue Area, Islamabad 44000',
          logoUrl: '/uploads/logo.png',
          aboutText:
            'From Pakistan to Dubai, Oman, and Saudi Arabia, Bait Al Shifa Natural Herbs has earned the trust of millions through premium herbal solutions, international recognition, and a commitment to quality, authenticity, and natural wellness.',
        }),
      );
    }
    return settings;
  }

  async update(dto: UpdateShopDto) {
    const settings = await this.get();
    Object.assign(settings, dto);
    return this.shopRepo.save(settings);
  }

  async setLogo(logoUrl: string) {
    const settings = await this.get();
    this.deleteLocalUpload(settings.logoUrl);
    settings.logoUrl = logoUrl;
    return this.shopRepo.save(settings);
  }

  async removeLogo() {
    const settings = await this.get();
    this.deleteLocalUpload(settings.logoUrl);
    settings.logoUrl = null;
    return this.shopRepo.save(settings);
  }

  private deleteLocalUpload(imageUrl: string | null | undefined) {
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) return;
    const filename = imageUrl.replace('/uploads/', '');
    const fullPath = join(process.cwd(), 'uploads', filename);
    if (existsSync(fullPath)) {
      try {
        unlinkSync(fullPath);
      } catch {
        /* ignore */
      }
    }
  }
}
