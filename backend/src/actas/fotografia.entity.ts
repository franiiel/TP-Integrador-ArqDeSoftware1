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

  // Path of the file in FOTOS_DIR: photos live outside the database.
  @Column({ type: 'varchar' })
  refArchivo: string;

  // Lets anyone check later that the photo was not altered.
  @Column({ type: 'varchar' })
  hashSha256: string;
}
