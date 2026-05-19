import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInicioViaPointsToRoute1779220567978 implements MigrationInterface {
    name = 'AddInicioViaPointsToRoute1779220567978'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`routes\` ADD \`inicio_via_points\` text NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`routes\` DROP COLUMN \`inicio_via_points\``);
    }

}
