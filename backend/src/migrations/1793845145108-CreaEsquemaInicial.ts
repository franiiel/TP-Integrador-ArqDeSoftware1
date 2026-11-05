import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreaEsquemaInicial1793845145108 implements MigrationInterface {
  name = 'CreaEsquemaInicial1793845145108';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "obras" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "direccion" character varying NOT NULL, "propietario" character varying NOT NULL, "responsable" character varying NOT NULL, CONSTRAINT "PK_1645460dfba8e8c144ecd8436da" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."usuarios_rol_enum" AS ENUM('INSPECTOR', 'SUPERVISOR', 'ADMINISTRATIVO')`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "auth0_id" character varying NOT NULL, "nombre" character varying NOT NULL, "email" character varying NOT NULL, "rol" "public"."usuarios_rol_enum" NOT NULL, "cargo" character varying, "legajo" character varying, CONSTRAINT "UQ_1023a6b2d5f26f88002090da651" UNIQUE ("auth0_id"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inspecciones" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "obra_id" uuid NOT NULL, "inspector_id" uuid NOT NULL, "supervisor_id" uuid NOT NULL, "fecha" date NOT NULL, "ubicacion" character varying, CONSTRAINT "PK_c649c4d2b9d9dce26da6c12de90" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "expedientes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "identificador_externo" integer NOT NULL, "obra_id" uuid NOT NULL, CONSTRAINT "UQ_99997c64de5d67ba0b56296b67e" UNIQUE ("identificador_externo"), CONSTRAINT "REL_b823d7ff954d4dd1ac84a1ad7c" UNIQUE ("obra_id"), CONSTRAINT "PK_a5ea29a2665df2319ecbb8f4408" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "fotografias" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "acta_id" uuid NOT NULL, "ruta_archivo" character varying NOT NULL, CONSTRAINT "PK_bc80326a39afd067d8fb48208f9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notificaciones" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "acta_id" uuid NOT NULL, "fecha_emision" date NOT NULL, "destinatario" character varying NOT NULL, "medio" character varying NOT NULL, CONSTRAINT "REL_9673d4713245d06370047412be" UNIQUE ("acta_id"), CONSTRAINT "PK_a9d32a419ff58b53a38b5ef85d4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."actas_tipo_medida_enum" AS ENUM('NINGUNA', 'INTIMACION', 'CLAUSURA')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."actas_tipo_acta_enum" AS ENUM('RECTIFICACION', 'ANULACION')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."actas_estado_enum" AS ENUM('PENDIENTE_ASOCIACION', 'ASOCIADA')`,
    );
    await queryRunner.query(`CREATE TABLE "actas" ("id" uuid NOT NULL, "numero" character varying NOT NULL, "inspeccion_id" uuid, "expediente_id" uuid NOT NULL, "fecha_emision" TIMESTAMP WITH TIME ZONE NOT NULL, "fecha_hora_recepcion" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "observaciones" text NOT NULL, "tipo_medida" "public"."actas_tipo_medida_enum" NOT NULL, "tipo_acta" "public"."actas_tipo_acta_enum", "acta_original_id" uuid, "estado" "public"."actas_estado_enum" NOT NULL DEFAULT 'PENDIENTE_ASOCIACION', CONSTRAINT "UQ_58d8846871338edea6f0dfcf602" UNIQUE ("numero"), CONSTRAINT "REL_8d962820b2b31824f296798c21" UNIQUE ("inspeccion_id"), CONSTRAINT "ck_actas_origen" CHECK ((tipo_acta IS NULL) = (acta_original_id IS NULL)
  AND (tipo_acta IS NULL) = (inspeccion_id IS NOT NULL)), CONSTRAINT "PK_ad14a36fb27ce9a7ee5a0418e71" PRIMARY KEY ("id"))`);
    await queryRunner.query(
      `CREATE TABLE "numeradores_acta" ("anio" integer NOT NULL, "ultimo_numero" integer NOT NULL, CONSTRAINT "PK_bf39eb6a59a7bb121195005670e" PRIMARY KEY ("anio"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" ADD CONSTRAINT "FK_01658bed73e483384446a5b638b" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" ADD CONSTRAINT "FK_f4f5a287c93d4907b19745e8ca9" FOREIGN KEY ("inspector_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" ADD CONSTRAINT "FK_6b4aaed01c472ee8e3292cac53f" FOREIGN KEY ("supervisor_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "expedientes" ADD CONSTRAINT "FK_b823d7ff954d4dd1ac84a1ad7c4" FOREIGN KEY ("obra_id") REFERENCES "obras"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fotografias" ADD CONSTRAINT "FK_63fafca47ec34d7e3310284f244" FOREIGN KEY ("acta_id") REFERENCES "actas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notificaciones" ADD CONSTRAINT "FK_9673d4713245d06370047412be6" FOREIGN KEY ("acta_id") REFERENCES "actas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ADD CONSTRAINT "FK_8d962820b2b31824f296798c21f" FOREIGN KEY ("inspeccion_id") REFERENCES "inspecciones"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ADD CONSTRAINT "FK_080617840a77a01f57e2cb085a1" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ADD CONSTRAINT "FK_41a6bf37addc52055481c397c91" FOREIGN KEY ("acta_original_id") REFERENCES "actas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "actas" DROP CONSTRAINT "FK_41a6bf37addc52055481c397c91"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" DROP CONSTRAINT "FK_080617840a77a01f57e2cb085a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" DROP CONSTRAINT "FK_8d962820b2b31824f296798c21f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notificaciones" DROP CONSTRAINT "FK_9673d4713245d06370047412be6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fotografias" DROP CONSTRAINT "FK_63fafca47ec34d7e3310284f244"`,
    );
    await queryRunner.query(
      `ALTER TABLE "expedientes" DROP CONSTRAINT "FK_b823d7ff954d4dd1ac84a1ad7c4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" DROP CONSTRAINT "FK_6b4aaed01c472ee8e3292cac53f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" DROP CONSTRAINT "FK_f4f5a287c93d4907b19745e8ca9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "inspecciones" DROP CONSTRAINT "FK_01658bed73e483384446a5b638b"`,
    );
    await queryRunner.query(`DROP TABLE "numeradores_acta"`);
    await queryRunner.query(`DROP TABLE "actas"`);
    await queryRunner.query(`DROP TYPE "public"."actas_estado_enum"`);
    await queryRunner.query(`DROP TYPE "public"."actas_tipo_acta_enum"`);
    await queryRunner.query(`DROP TYPE "public"."actas_tipo_medida_enum"`);
    await queryRunner.query(`DROP TABLE "notificaciones"`);
    await queryRunner.query(`DROP TABLE "fotografias"`);
    await queryRunner.query(`DROP TABLE "expedientes"`);
    await queryRunner.query(`DROP TABLE "inspecciones"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TYPE "public"."usuarios_rol_enum"`);
    await queryRunner.query(`DROP TABLE "obras"`);
  }
}
