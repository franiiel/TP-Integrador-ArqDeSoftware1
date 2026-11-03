import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ItemControl } from '../catalogos/item-control.entity.js';
import type { Acta } from './acta.entity.js';

export enum ResultadoControl {
  CUMPLE = 'CUMPLE',
  NO_CUMPLE = 'NO_CUMPLE',
  NO_APLICA = 'NO_APLICA',
}

@Entity('resultados_item')
export class ResultadoItem {
  @PrimaryColumn('uuid')
  actaId: string;

  @ManyToOne('Acta', (acta: Acta) => acta.resultadosItems)
  @JoinColumn({ name: 'acta_id' })
  acta: Acta;

  @PrimaryColumn('uuid')
  itemControlId: string;

  @ManyToOne(() => ItemControl)
  @JoinColumn({ name: 'item_control_id' })
  itemControl: ItemControl;

  @Column({ type: 'enum', enum: ResultadoControl })
  resultado: ResultadoControl;
}
