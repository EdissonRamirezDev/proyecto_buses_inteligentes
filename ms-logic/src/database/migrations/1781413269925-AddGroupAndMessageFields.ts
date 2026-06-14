import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupAndMessageFields1781413269925 implements MigrationInterface {
    name = 'AddGroupAndMessageFields1781413269925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`latitud\` decimal(10,7) NULL`);
        await queryRunner.query(`ALTER TABLE \`messages\` ADD \`longitud\` decimal(10,7) NULL`);
        await queryRunner.query(`ALTER TABLE \`groups\` ADD \`is_public\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`groups\` ADD \`icon\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`group_persons\` ADD \`is_admin\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`group_persons\` DROP COLUMN \`is_admin\``);
        await queryRunner.query(`ALTER TABLE \`groups\` DROP COLUMN \`icon\``);
        await queryRunner.query(`ALTER TABLE \`groups\` DROP COLUMN \`is_public\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`longitud\``);
        await queryRunner.query(`ALTER TABLE \`messages\` DROP COLUMN \`latitud\``);
    }
}
