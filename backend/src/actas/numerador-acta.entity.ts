import { Column, Entity, PrimaryColumn } from 'typeorm';

// One row per year, locked while assigning the next correlative number.
@Entity('numeradores_acta')
export class NumeradorActa {
  @PrimaryColumn({ type: 'int' })
  anio: number;

  @Column({ type: 'int' })
  ultimoNumero: number;
}
