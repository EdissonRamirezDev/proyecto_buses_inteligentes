import { MigrationInterface, QueryRunner } from "typeorm";

export class UXImprovements1778180338612 implements MigrationInterface {
    name = 'UXImprovements1778180338612'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bus_stops\` ADD \`sentido\` varchar(255) NOT NULL DEFAULT 'N/A'`);
        await queryRunner.query(`ALTER TABLE \`routes\` ADD \`color_hex\` varchar(255) NOT NULL DEFAULT '#3b82f6'`);
        await queryRunner.query(`ALTER TABLE \`routes\` ADD \`is_active\` tinyint NOT NULL DEFAULT 1`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`routes\` DROP COLUMN \`is_active\``);
        await queryRunner.query(`ALTER TABLE \`routes\` DROP COLUMN \`color_hex\``);
        await queryRunner.query(`ALTER TABLE \`bus_stops\` DROP COLUMN \`sentido\``);
    }

}
