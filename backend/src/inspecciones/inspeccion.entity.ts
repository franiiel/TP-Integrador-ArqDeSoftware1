import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Obra } from '../obras/obra.entity.js';
import { Usuario } from '../usuarios/usuario.entity.js';

@Entity('inspecciones')
export class Inspeccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  obraId: string;

  @ManyToOne(() => Obra)
  @JoinColumn({ name: 'obra_id' })
  obra: Obra;

  @Column({ type: 'uuid' })
  inspectorId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'inspector_id' })
  inspector: Usuario;

  @Column({ type: 'uuid' })
  supervisorId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Usuario;

  @Column({ type: 'date' })
  fecha: string;

  // Captured on the phone when the acta is drawn up; optional.
  @Column({ type: 'varchar', nullable: true })
  ubicacion: string | null;
}
