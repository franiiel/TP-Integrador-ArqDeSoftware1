import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('obras')
export class Obra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  direccion: string;

  @Column({ type: 'varchar' })
  propietario: string;

  @Column({ type: 'varchar' })
  profesionalResponsable: string;
}
