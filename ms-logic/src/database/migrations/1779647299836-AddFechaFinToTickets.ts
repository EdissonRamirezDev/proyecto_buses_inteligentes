import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFechaFinToTickets1779647299836 implements MigrationInterface {
    name = 'AddFechaFinToTickets1779647299836'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD \`fecha_fin\` timestamp NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP COLUMN \`fecha_fin\``);
    }

}
