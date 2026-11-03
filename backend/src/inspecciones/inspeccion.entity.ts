import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Expediente } from '../obras/expediente.entity.js';
import { Usuario } from '../usuarios/usuario.entity.js';

@Entity('inspecciones')
export class Inspeccion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  expedienteId: string;

  @ManyToOne(() => Expediente)
  @JoinColumn({ name: 'expediente_id' })
  expediente: Expediente;

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
  fechaProgramada: string;
}
