import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTicketCreatedAt1778190151570 implements MigrationInterface {
    name = 'AddTicketCreatedAt1778190151570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD \`fecha_compra\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP COLUMN \`fecha_compra\``);
    }

}
