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

  // Id of the expediente in the municipal system; the rest is fetched via SOAP.
  @Column({ type: 'int', unique: true })
  identificadorExterno: number;

  @Column({ type: 'uuid' })
  obraId: string;

  @OneToOne(() => Obra)
  @JoinColumn({ name: 'obra_id' })
  obra: Obra;
}
