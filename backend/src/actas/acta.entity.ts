import {
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
import { Usuario } from '../usuarios/usuario.entity.js';
import { Fotografia } from './fotografia.entity.js';
import { Medida } from './medida.entity.js';
import { ResultadoItem } from './resultado-item.entity.js';
import { UnidadPlazo } from './unidad-plazo.enum.js';

export enum EstadoActa {
  PENDIENTE_ASOCIACION = 'PENDIENTE_ASOCIACION',
  ASOCIADA = 'ASOCIADA',
  RECTIFICADA = 'RECTIFICADA',
  ANULADA = 'ANULADA',
}

@Entity('actas')
export class Acta {
  // Generated on the phone: makes resending the same acta idempotent.
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  numero: string;

  @Column({ type: 'uuid' })
  inspeccionId: string;

  @OneToOne(() => Inspeccion)
  @JoinColumn({ name: 'inspeccion_id' })
  inspeccion: Inspeccion;

  @Column({ type: 'uuid' })
  inspectorId: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'inspector_id' })
  inspector: Usuario;

  @Column({ type: 'timestamptz' })
  fechaHoraLabrado: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  fechaHoraRecepcion: Date;

  // pg returns numeric as string to avoid losing precision.
  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  latitud: string | null;

  @Column({ type: 'numeric', precision: 9, scale: 6, nullable: true })
  longitud: string | null;

  @Column({ type: 'text' })
  observaciones: string;

  @Column({ type: 'varchar' })
  organismoDescargo: string;

  @Column({ type: 'int' })
  plazoDescargoCantidad: number;

  @Column({ type: 'enum', enum: UnidadPlazo })
  plazoDescargoUnidad: UnidadPlazo;

  @Column({ type: 'varchar' })
  notificadoNombre: string;

  @Column({ type: 'varchar' })
  notificadoDni: string;

  @Column({ type: 'boolean' })
  notificadoFirmo: boolean;

  @Column({
    type: 'enum',
    enum: EstadoActa,
    default: EstadoActa.PENDIENTE_ASOCIACION,
  })
  estado: EstadoActa;

  @OneToMany(() => ResultadoItem, (resultado) => resultado.acta, {
    cascade: ['insert'],
  })
  resultadosItems: ResultadoItem[];

  @OneToMany(() => Fotografia, (foto) => foto.acta, { cascade: ['insert'] })
  fotografias: Fotografia[];

  @OneToMany(() => Medida, (medida) => medida.acta, { cascade: ['insert'] })
  medidas: Medida[];
}
