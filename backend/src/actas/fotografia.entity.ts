import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Acta } from './acta.entity.js';

@Entity('fotografias')
export class Fotografia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  actaId: string;

  @ManyToOne('Acta', (acta: Acta) => acta.fotografias)
  @JoinColumn({ name: 'acta_id' })
  acta: Acta;

  @Column({ type: 'varchar' })
  rutaArchivo: string;
}
