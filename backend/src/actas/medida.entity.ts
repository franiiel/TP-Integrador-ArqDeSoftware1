import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ArticuloNormativo } from '../catalogos/articulo-normativo.entity.js';
import type { Acta } from './acta.entity.js';
import { UnidadPlazo } from './unidad-plazo.enum.js';

export enum TipoMedida {
  INTIMACION = 'INTIMACION',
  CLAUSURA = 'CLAUSURA',
}

export enum TipoClausura {
  TOTAL = 'TOTAL',
  PARCIAL = 'PARCIAL',
}

@Entity('medidas')
@Check(
  'ck_medidas_intimacion',
  `tipo <> 'INTIMACION' OR (
    conducta_a_corregir IS NOT NULL AND plazo_cantidad IS NOT NULL AND plazo_unidad IS NOT NULL
    AND tipo_clausura IS NULL AND sector_clausurado IS NULL AND numero_faja IS NULL
  )`,
)
@Check(
  'ck_medidas_clausura',
  `tipo <> 'CLAUSURA' OR (
    tipo_clausura IS NOT NULL AND numero_faja IS NOT NULL
    AND conducta_a_corregir IS NULL AND plazo_cantidad IS NULL AND plazo_unidad IS NULL
    AND (tipo_clausura = 'PARCIAL') = (sector_clausurado IS NOT NULL)
  )`,
)
export class Medida {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  actaId: string;

  @ManyToOne('Acta', (acta: Acta) => acta.medidas)
  @JoinColumn({ name: 'acta_id' })
  acta: Acta;

  @Column({ type: 'enum', enum: TipoMedida })
  tipo: TipoMedida;

  @Column({ type: 'text' })
  falta: string;

  @Column({ type: 'uuid' })
  articuloId: string;

  @ManyToOne(() => ArticuloNormativo)
  @JoinColumn({ name: 'articulo_id' })
  articulo: ArticuloNormativo;

  @Column({ type: 'text', nullable: true })
  conductaACorregir: string | null;

  @Column({ type: 'int', nullable: true })
  plazoCantidad: number | null;

  @Column({ type: 'enum', enum: UnidadPlazo, nullable: true })
  plazoUnidad: UnidadPlazo | null;

  @Column({ type: 'enum', enum: TipoClausura, nullable: true })
  tipoClausura: TipoClausura | null;

  @Column({ type: 'varchar', nullable: true })
  sectorClausurado: string | null;

  @Column({ type: 'varchar', nullable: true })
  numeroFaja: string | null;
}
