import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Obra } from './obra.entity.js';

@Entity('expedientes')
export class Expediente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  numero: string;

  @Column({ type: 'uuid' })
  obraId: string;

  @OneToOne(() => Obra)
  @JoinColumn({ name: 'obra_id' })
  obra: Obra;
}
