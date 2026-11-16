import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Inspeccion } from '../inspecciones/inspeccion.entity.js';
import { Expediente } from '../inspecciones/expediente.entity.js';
import { Fotografia } from './fotografia.entity.js';

export enum EstadoActa {
  PENDIENTE_ASOCIACION = 'PENDIENTE_ASOCIACION',
  ASOCIADA = 'ASOCIADA',
}

export enum TipoMedida {
  NINGUNA = 'NINGUNA',
  INTIMACION = 'INTIMACION',
  CLAUSURA = 'CLAUSURA',
}

export enum TipoActa {
  ORIGINAL = 'ORIGINAL',
  RECTIFICACION = 'RECTIFICACION',
  ANULACION = 'ANULACION',
}

// An original acta comes from an inspeccion; a rectification or annulment
// comes from a previous acta (its antecedente) instead.
@Check(
  'ck_actas_origen',
  `(tipo_acta = 'ORIGINAL') = (acta_antecedente_id IS NULL)
  AND (tipo_acta = 'ORIGINAL') = (inspeccion_id IS NOT NULL)`,
)
@Entity('actas')
export class Acta {
  // Generated on the phone: makes resending the same acta idempotent.
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  numero: string;

  @Column({ type: 'uuid', nullable: true })
  inspeccionId: string | null;

  @OneToOne(() => Inspeccion)
  @JoinColumn({ name: 'inspeccion_id' })
  inspeccion: Inspeccion | null;

  @Column({ type: 'uuid' })
  expedienteId: string;

  @ManyToOne(() => Expediente)
  @JoinColumn({ name: 'expediente_id' })
  expediente: Expediente;

  // Legal date: taken from the phone when the acta is drawn up.
  @Column({ type: 'timestamptz' })
  fechaEmision: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  fechaRecepcion: Date;

  @Column({ type: 'text' })
  observaciones: string;

  @Column({ type: 'enum', enum: TipoMedida })
  tipoMedida: TipoMedida;

  @Column({ type: 'enum', enum: TipoActa })
  tipoActa: TipoActa;

  @Column({ type: 'uuid', nullable: true })
  actaAntecedenteId: string | null;

  @ManyToOne(() => Acta)
  @JoinColumn({ name: 'acta_antecedente_id' })
  actaAntecedente: Acta | null;

  @Column({
    type: 'enum',
    enum: EstadoActa,
    default: EstadoActa.PENDIENTE_ASOCIACION,
  })
  estado: EstadoActa;

  @OneToMany(() => Fotografia, (foto) => foto.acta, { cascade: ['insert'] })
  fotografias: Fotografia[];
}
