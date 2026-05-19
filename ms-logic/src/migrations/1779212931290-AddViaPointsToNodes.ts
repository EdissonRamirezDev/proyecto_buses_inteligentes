import { MigrationInterface, QueryRunner } from "typeorm";

export class AddViaPointsToNodes1779212931290 implements MigrationInterface {
    name = 'AddViaPointsToNodes1779212931290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nodes\` ADD \`via_points\` text NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`nodes\` DROP COLUMN \`via_points\``);
    }

}
