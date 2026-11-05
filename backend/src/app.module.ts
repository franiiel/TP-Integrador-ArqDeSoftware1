import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { dataSourceOptions } from './data-source.js';
import { InspeccionesModule } from './inspecciones/inspecciones.module.js';
import { UsuariosModule } from './usuarios/usuarios.module.js';

@Module({
  imports: [
    // Each module registers its own entities (forFeature); the glob in
    // dataSourceOptions is only for the TypeORM CLI.
    TypeOrmModule.forRoot({
      ...dataSourceOptions,
      entities: [],
      autoLoadEntities: true,
    }),
    AuthModule,
    UsuariosModule,
    InspeccionesModule,
  ],
})
export class AppModule {}
