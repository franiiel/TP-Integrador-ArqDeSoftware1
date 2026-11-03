import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('articulos_normativos')
export class ArticuloNormativo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  ordenanza: string;

  @Column({ type: 'varchar' })
  numeroArticulo: string;

  @Column({ type: 'text' })
  descripcion: string;
}
