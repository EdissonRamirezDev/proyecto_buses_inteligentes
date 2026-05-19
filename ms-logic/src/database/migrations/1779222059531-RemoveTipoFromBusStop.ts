import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTipoFromBusStop1779222059531 implements MigrationInterface {
    name = 'RemoveTipoFromBusStop1779222059531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bus_stops\` DROP COLUMN \`tipo\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bus_stops\` ADD \`tipo\` varchar(255) NOT NULL DEFAULT 'regular'`);
    }

}
