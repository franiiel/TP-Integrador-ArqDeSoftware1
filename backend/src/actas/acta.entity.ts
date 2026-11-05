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
import { Expediente } from '../obras/expediente.entity.js';
import { Fotografia } from './fotografia.entity.js';
import { Notificacion } from './notificacion.entity.js';

export enum EstadoActa {
  PENDIENTE_ASOCIACION = 'PENDIENTE_ASOCIACION',
  ASOCIADA = 'ASOCIADA',
}

export enum TipoMedida {
  NINGUNA = 'NINGUNA',
  INTIMACION = 'INTIMACION',
  CLAUSURA = 'CLAUSURA',
}

export enum TipoRelacion {
  RECTIFICACION = 'RECTIFICACION',
  ANULACION = 'ANULACION',
}

// An original acta comes from an inspeccion; a rectification or annulment
// comes from a previous acta instead.
@Check(
  'ck_actas_origen',
  `(tipo_acta IS NULL) = (acta_original_id IS NULL)
  AND (tipo_acta IS NULL) = (inspeccion_id IS NOT NULL)`,
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
  fechaHoraRecepcion: Date;

  @Column({ type: 'text' })
  observaciones: string;

  @Column({ type: 'enum', enum: TipoMedida })
  tipoMedida: TipoMedida;

  @Column({ type: 'enum', enum: TipoRelacion, nullable: true })
  tipoActa: TipoRelacion | null;

  @Column({ type: 'uuid', nullable: true })
  actaOriginalId: string | null;

  @ManyToOne(() => Acta)
  @JoinColumn({ name: 'acta_original_id' })
  actaOriginal: Acta | null;

  @Column({
    type: 'enum',
    enum: EstadoActa,
    default: EstadoActa.PENDIENTE_ASOCIACION,
  })
  estado: EstadoActa;

  @OneToMany(() => Fotografia, (foto) => foto.acta, { cascade: ['insert'] })
  fotografias: Fotografia[];

  @OneToOne(() => Notificacion, (notificacion) => notificacion.acta, {
    cascade: ['insert'],
  })
  notificacion: Notificacion;
}
