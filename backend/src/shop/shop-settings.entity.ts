import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('shop_settings')
export class ShopSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'Bait Al Shifa Natural Herbs' })
  name: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxPercent: number;

  @Column({ default: 'PKR' })
  currency: string;

  @Column({ default: '+92 336 3887222' })
  phone: string;

  @Column({ default: '+923363887222' })
  whatsapp: string;

  @Column({
    default: '1103A, Mall of Islamabad, Blue Area, Islamabad 44000',
  })
  address: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl: string | null;

  @Column({
    type: 'text',
    default:
      'From Pakistan to Dubai, Oman, and Saudi Arabia, Bait Al Shifa Natural Herbs has earned the trust of millions through premium herbal solutions, international recognition, and a commitment to quality, authenticity, and natural wellness.',
  })
  aboutText: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
