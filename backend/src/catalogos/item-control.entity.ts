import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('items_control')
export class ItemControl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  descripcion: string;
}
