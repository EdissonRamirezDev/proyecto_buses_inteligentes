import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMassAlertFields1781414784942 implements MigrationInterface {
    name = 'AddMassAlertFields1781414784942'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`is_mass_alert\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`is_urgent\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`scheduled_for\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`mass_alert_scope\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`mass_alert_scope\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`scheduled_for\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`is_urgent\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`is_mass_alert\``);
    }

}
