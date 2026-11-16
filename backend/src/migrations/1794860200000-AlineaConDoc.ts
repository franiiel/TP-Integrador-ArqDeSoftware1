import { MigrationInterface, QueryRunner } from 'typeorm';

// Aligns the schema with the DER of the architecture document. Renames keep the
// data; tipo_acta gets ORIGINAL by recreating the enum, because a value added
// with ADD VALUE can't be used in the same transaction.
export class AlineaConDoc1794860200000 implements MigrationInterface {
  name = 'AlineaConDoc1794860200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "notificaciones"`);
    await queryRunner.query(`DROP TABLE "numeradores_acta"`);

    await queryRunner.query(
      `ALTER TABLE "fotografias" RENAME COLUMN "ruta_archivo" TO "ref_archivo"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fotografias" ADD "hash_sha256" character varying NOT NULL`,
    );

    await queryRunner.query(
      `ALTER TABLE "actas" RENAME COLUMN "fecha_hora_recepcion" TO "fecha_recepcion"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" DROP CONSTRAINT "ck_actas_origen"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" DROP CONSTRAINT "FK_41a6bf37addc52055481c397c91"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" RENAME COLUMN "acta_original_id" TO "acta_antecedente_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ADD CONSTRAINT "FK_e5a0c7b203ad12fea919279ae47" FOREIGN KEY ("acta_antecedente_id") REFERENCES "actas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."actas_tipo_acta_enum_new" AS ENUM('ORIGINAL', 'RECTIFICACION', 'ANULACION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ALTER COLUMN "tipo_acta" TYPE "public"."actas_tipo_acta_enum_new" USING COALESCE("tipo_acta"::text, 'ORIGINAL')::"public"."actas_tipo_acta_enum_new"`,
    );
    await queryRunner.query(`DROP TYPE "public"."actas_tipo_acta_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."actas_tipo_acta_enum_new" RENAME TO "actas_tipo_acta_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ALTER COLUMN "tipo_acta" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ADD CONSTRAINT "ck_actas_origen" CHECK ((tipo_acta = 'ORIGINAL') = (acta_antecedente_id IS NULL)
  AND (tipo_acta = 'ORIGINAL') = (inspeccion_id IS NOT NULL))`,
    );

    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" DROP CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5"`,
    );

    await queryRunner.query(
      `ALTER TABLE "actas" DROP CONSTRAINT "ck_actas_origen"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ALTER COLUMN "tipo_acta" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."actas_tipo_acta_enum_old" AS ENUM('RECTIFICACION', 'ANULACION')`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ALTER COLUMN "tipo_acta" TYPE "public"."actas_tipo_acta_enum_old" USING NULLIF("tipo_acta"::text, 'ORIGINAL')::"public"."actas_tipo_acta_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."actas_tipo_acta_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."actas_tipo_acta_enum_old" RENAME TO "actas_tipo_acta_enum"`,
    );

    await queryRunner.query(
      `ALTER TABLE "actas" DROP CONSTRAINT "FK_e5a0c7b203ad12fea919279ae47"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" RENAME COLUMN "acta_antecedente_id" TO "acta_original_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ADD CONSTRAINT "FK_41a6bf37addc52055481c397c91" FOREIGN KEY ("acta_original_id") REFERENCES "actas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" ADD CONSTRAINT "ck_actas_origen" CHECK ((tipo_acta IS NULL) = (acta_original_id IS NULL)
  AND (tipo_acta IS NULL) = (inspeccion_id IS NOT NULL))`,
    );
    await queryRunner.query(
      `ALTER TABLE "actas" RENAME COLUMN "fecha_recepcion" TO "fecha_hora_recepcion"`,
    );

    await queryRunner.query(`ALTER TABLE "fotografias" DROP COLUMN "hash_sha256"`);
    await queryRunner.query(
      `ALTER TABLE "fotografias" RENAME COLUMN "ref_archivo" TO "ruta_archivo"`,
    );

    // The dropped tables come back empty: their rows are not recoverable.
    await queryRunner.query(
      `CREATE TABLE "numeradores_acta" ("anio" integer NOT NULL, "ultimo_numero" integer NOT NULL, CONSTRAINT "PK_bf39eb6a59a7bb121195005670e" PRIMARY KEY ("anio"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "notificaciones" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "acta_id" uuid NOT NULL, "fecha_emision" date NOT NULL, "destinatario" character varying NOT NULL, "medio" character varying NOT NULL, CONSTRAINT "REL_9673d4713245d06370047412be" UNIQUE ("acta_id"), CONSTRAINT "PK_a9d32a419ff58b53a38b5ef85d4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "notificaciones" ADD CONSTRAINT "FK_9673d4713245d06370047412be6" FOREIGN KEY ("acta_id") REFERENCES "actas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
