import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum Rol {
  INSPECTOR = 'INSPECTOR',
  SUPERVISOR = 'SUPERVISOR',
  ADMINISTRATIVO = 'ADMINISTRATIVO',
}

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  auth0Id: string;

  @Column({ type: 'varchar' })
  nombre: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'enum', enum: Rol })
  rol: Rol;

  @Column({ type: 'varchar', nullable: true })
  cargo: string | null;

  @Column({ type: 'varchar', nullable: true })
  legajo: string | null;
}
