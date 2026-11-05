import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { Acta } from './acta.entity.js';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  actaId: string;

  @OneToOne('Acta', (acta: Acta) => acta.notificacion)
  @JoinColumn({ name: 'acta_id' })
  acta: Acta;

  @Column({ type: 'date' })
  fechaEmision: string;

  @Column({ type: 'varchar' })
  destinatario: string;

  @Column({ type: 'varchar' })
  medio: string;
}
