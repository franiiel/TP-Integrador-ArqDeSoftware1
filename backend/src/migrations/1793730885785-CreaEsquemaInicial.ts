import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreaEsquemaInicial1793730885785 implements MigrationInterface {
  name = 'CreaEsquemaInicial1793730885785';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "obras" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "direccion" character varying NOT NULL, "propietario" character varying NOT NULL, "profesional_responsable" character varying NOT NULL, CONSTRAINT "PK_1645460dfba8e8c144ecd8436da" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "expedientes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "numero" character varying NOT NULL, "obra_id" uuid NOT NULL, CONSTRAINT "UQ_40f6ecd8f9797cb1ca71c2988d7" UNIQUE ("numero"), CONSTRAINT "REL_b823d7ff954d4dd1ac84a1ad7c" UNIQUE ("obra_id"), CONSTRAINT "PK_a5ea29a2665df2319ecbb8f4408" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."usuarios_rol_enum" AS ENUM('INSPECTOR', 'SUPERVISOR', 'ADMINISTRATIVO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "auth0_id" character varying NOT NULL, "nombre" character varying NOT NULL, "email" character varying NOT NULL, "rol" "public"."usuarios_rol_enum" NOT NULL, "cargo" character varying, "legajo" character varying, CONSTRAINT "UQ_1023a6b2d5f26f88002090da651" UNIQUE ("auth0_id"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inspecciones" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "expediente_id" uuid NOT NULL, "inspector_id" uuid NOT NULL, "supervisor_id" uuid NOT NULL, "fecha_programada" date NOT NULL, CONSTRAINT "PK_c649c4d2b9d9dce26da6c12de90" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fotografias" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "acta_id" uuid NOT NULL, "ruta_archivo" character varying NOT NULL, "fecha_captura" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_bc80326a39afd067d8fb48208f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "articulos_normativos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "ordenanza" character varying NOT NULL, "numero_articulo" character varying NOT NULL, "descripcion" text NOT NULL, CONSTRAINT "PK_af8b9c7d3ed86f32ca4135ba40d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."medidas_tipo_enum" AS ENUM('INTIMACION', 'CLAUSURA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."medidas_plazo_unidad_enum" AS ENUM('HORAS', 'DIAS_HABILES')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."medidas_tipo_clausura_enum" AS ENUM('TOTAL', 'PARCIAL')`,
    );
    await queryRunner.query(`CREATE TABLE "medidas" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "acta_id" uuid NOT NULL, "tipo" "public"."medidas_tipo_enum" NOT NULL, "falta" text NOT NULL, "articulo_id" uuid NOT NULL, "conducta_a_corregir" text, "plazo_cantidad" integer, "plazo_unidad" "public"."medidas_plazo_unidad_enum", "tipo_clausura" "public"."medidas_tipo_clausura_enum", "sector_clausurado" character varying, "numero_faja" character varying, CONSTRAINT "ck_medidas_clausura" CHECK (tipo <> 'CLAUSURA' OR (
    tipo_clausura IS NOT NULL AND numero_faja IS NOT NULL
    AND conducta_a_corregir IS NULL AND plazo_cantidad IS NULL AND plazo_unidad IS NULL
    AND (tipo_clausura = 'PARCIAL') = (sector_clausurado IS NOT NULL)
  )), CONSTRAINT "ck_medidas_intimacion" CHECK (tipo <> 'INTIMACION' OR (
    conducta_a_corregir IS NOT NULL AND plazo_cantidad IS NOT NULL AND plazo_unidad IS NOT NULL
    AND tipo_clausura IS NULL AND sector_clausurado IS NULL AND numero_faja IS NULL
  )), CONSTRAINT "PK_e48099590030cfd499ff37de2e9" PRIMARY KEY ("id"))`);
    await queryRunner.query(
      `CREATE TABLE "items_control" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "descripcion" character varying NOT NULL, CONSTRAINT "PK_76e753e412b4237e3f54161fdc1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."resultados_item_resultado_enum" AS ENUM('CUMPLE', 'NO_CUMPLE', 'NO_APLICA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "resultados_item" ("acta_id" uuid NOT NULL, "item_control_id" uuid NOT NULL, "resultado" "public"."resultados_item_resultado_enum" NOT NULL, CONSTRAINT "PK_568c2cba6044c5f9750f2735dea" PRIMARY KEY ("acta_id", "item_control_id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."actas_plazo_descargo_unidad_enum" AS ENUM('HORAS', 'DIAS_HABILES')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."actas_estado_enum" AS ENUM('PENDIENTE_ASOCIACION', 'ASOCIADA', 'RECTIFICADA', 'ANULADA')`,
    );
    await queryRunner.query(
      `CREATE TABLE "actas" ("id" uuid NOT NULL, "numero" character varying NOT NULL, "inspeccion_id" uuid NOT NULL, "inspector_id" uuid NOT NULL, "fecha_hora_labrado" TIMESTAMP WITH TIME ZONE NOT NULL, "fecha_hora_recepcion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "latitud" numeric(9,6), "longitud" numeric(9,6), "observaciones" text NOT NULL, "organismo_descargo" character varying NOT NULL, "plazo_descargo_cantidad" integer NOT NULL, "plazo_descargo_unidad" "public"."actas_plazo_descargo_unidad_enum" NOT NULL, "notificado_nombre" character varying NOT NULL, "notificado_dni" character varying NOT NULL, "notificado_firmo" boolean NOT NULL, "estado" "public"."actas_estado_enum" NOT NULL DEFAULT 'PENDIENTE_ASOCIACION', CONSTRAINT "UQ_58d8846871338edea6f0dfcf602" UNIQUE ("numero"), CONSTRAINT "REL_8d962820b2b31824f296798c21" UNIQUE ("inspeccion_id"), CONSTRAINT "PK_ad14a36fb27ce9a7ee5a0418e71" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "numeradores_acta" ("anio" integer NOT NULL, "ultimo_numero" integer NOT NULL, CONSTRAINT "PK_bf39eb6a59a7bb121195005670e" PRIMARY KEY ("anio"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "expedientes" ADD CONSTRAINT "FK_b823d7ff954d4dd1ac84a1ad7c4" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" ADD CONSTRAINT "FK_10b9f6800c3f82e484632ee78aa" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" ADD CONSTRAINT "FK_f4f5a287c93d4907b19745e8ca9" FOREIGN KEY ("inspector_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" ADD CONSTRAINT "FK_6b4aaed01c472ee8e3292cac53f" FOREIGN KEY ("supervisor_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fotografias" ADD CONSTRAINT "FK_63fafca47ec34d7e3310284f244" FOREIGN KEY ("acta_id") REFERENCES "actas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "medidas" ADD CONSTRAINT "FK_a1d74de14f802decf77938c8d33" FOREIGN KEY ("acta_id") REFERENCES "actas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "medidas" ADD CONSTRAINT "FK_3472908ef4ef880f538d471b1d4" FOREIGN KEY ("articulo_id") REFERENCES "articulos_normativos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "resultados_item" ADD CONSTRAINT "FK_afd85d9b5001eccabcc13db6c4b" FOREIGN KEY ("acta_id") REFERENCES "actas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "resultados_item" ADD CONSTRAINT "FK_4b09f40d311b44656e479b22fb4" FOREIGN KEY ("item_control_id") REFERENCES "items_control"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ADD CONSTRAINT "FK_8d962820b2b31824f296798c21f" FOREIGN KEY ("inspeccion_id") REFERENCES "inspecciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ADD CONSTRAINT "FK_ee684e62ba1eb8e116864048072" FOREIGN KEY ("inspector_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "actas" DROP CONSTRAINT "FK_ee684e62ba1eb8e116864048072"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" DROP CONSTRAINT "FK_8d962820b2b31824f296798c21f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resultados_item" DROP CONSTRAINT "FK_4b09f40d311b44656e479b22fb4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "resultados_item" DROP CONSTRAINT "FK_afd85d9b5001eccabcc13db6c4b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "medidas" DROP CONSTRAINT "FK_3472908ef4ef880f538d471b1d4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "medidas" DROP CONSTRAINT "FK_a1d74de14f802decf77938c8d33"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fotografias" DROP CONSTRAINT "FK_63fafca47ec34d7e3310284f244"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" DROP CONSTRAINT "FK_6b4aaed01c472ee8e3292cac53f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" DROP CONSTRAINT "FK_f4f5a287c93d4907b19745e8ca9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" DROP CONSTRAINT "FK_10b9f6800c3f82e484632ee78aa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expedientes" DROP CONSTRAINT "FK_b823d7ff954d4dd1ac84a1ad7c4"`,
    );
    await queryRunner.query(`DROP TABLE "numeradores_acta"`);
    await queryRunner.query(`DROP TABLE "actas"`);
    await queryRunner.query(`DROP TYPE "public"."actas_estado_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."actas_plazo_descargo_unidad_enum"`,
    );
    await queryRunner.query(`DROP TABLE "resultados_item"`);
    await queryRunner.query(
      `DROP TYPE "public"."resultados_item_resultado_enum"`,
    );
    await queryRunner.query(`DROP TABLE "items_control"`);
    await queryRunner.query(`DROP TABLE "medidas"`);
    await queryRunner.query(`DROP TYPE "public"."medidas_tipo_clausura_enum"`);
    await queryRunner.query(`DROP TYPE "public"."medidas_plazo_unidad_enum"`);
    await queryRunner.query(`DROP TYPE "public"."medidas_tipo_enum"`);
    await queryRunner.query(`DROP TABLE "articulos_normativos"`);
    await queryRunner.query(`DROP TABLE "fotografias"`);
    await queryRunner.query(`DROP TABLE "inspecciones"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TYPE "public"."usuarios_rol_enum"`);
    await queryRunner.query(`DROP TABLE "expedientes"`);
    await queryRunner.query(`DROP TABLE "obras"`);
  }
}
