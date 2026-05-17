import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHistoryValidationType1778901208657 implements MigrationInterface {
    name = 'AddHistoryValidationType1778901208657'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`fecha_nacimiento\``);
        await queryRunner.query(`ALTER TABLE \`citizens\` ADD \`fecha_nacimiento\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`history\` ADD \`tipo_validacion\` enum ('ENTRADA', 'SALIDA') NOT NULL DEFAULT 'ENTRADA'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`history\` DROP COLUMN \`tipo_validacion\``);
        await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`fecha_nacimiento\``);
        await queryRunner.query(`ALTER TABLE \`citizens\` ADD \`fecha_nacimiento\` date NULL`);
    }

}
