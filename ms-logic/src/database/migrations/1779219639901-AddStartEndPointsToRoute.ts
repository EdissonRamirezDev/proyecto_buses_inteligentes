import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStartEndPointsToRoute1779219639901 implements MigrationInterface {
    name = 'AddStartEndPointsToRoute1779219639901'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`routes\` ADD \`inicio_lat\` decimal(10,8) NULL`);
        await queryRunner.query(`ALTER TABLE \`routes\` ADD \`inicio_lng\` decimal(11,8) NULL`);
        await queryRunner.query(`ALTER TABLE \`routes\` ADD \`inicio_nombre\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`routes\` ADD \`fin_lat\` decimal(10,8) NULL`);
        await queryRunner.query(`ALTER TABLE \`routes\` ADD \`fin_lng\` decimal(11,8) NULL`);
        await queryRunner.query(`ALTER TABLE \`routes\` ADD \`fin_nombre\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`routes\` DROP COLUMN \`fin_nombre\``);
        await queryRunner.query(`ALTER TABLE \`routes\` DROP COLUMN \`fin_lng\``);
        await queryRunner.query(`ALTER TABLE \`routes\` DROP COLUMN \`fin_lat\``);
        await queryRunner.query(`ALTER TABLE \`routes\` DROP COLUMN \`inicio_nombre\``);
        await queryRunner.query(`ALTER TABLE \`routes\` DROP COLUMN \`inicio_lng\``);
        await queryRunner.query(`ALTER TABLE \`routes\` DROP COLUMN \`inicio_lat\``);
    }

}
