import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGroupMemberFields1781456108854 implements MigrationInterface {
    name = 'AddGroupMemberFields1781456108854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`group_logs\` (\`id\` varchar(36) NOT NULL, \`actor_id\` varchar(255) NOT NULL, \`target_id\` varchar(255) NULL, \`action\` enum ('JOINED', 'ADDED', 'REMOVED', 'BLOCKED', 'PROMOTED', 'LEFT') NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`group_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`group_persons\` ADD \`fecha_union\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`group_persons\` ADD \`is_blocked\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`group_logs\` ADD CONSTRAINT \`FK_e3039524a2dfe4d16a89d96121e\` FOREIGN KEY (\`group_id\`) REFERENCES \`groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`group_logs\` DROP FOREIGN KEY \`FK_e3039524a2dfe4d16a89d96121e\``);
        await queryRunner.query(`ALTER TABLE \`group_persons\` DROP COLUMN \`is_blocked\``);
        await queryRunner.query(`ALTER TABLE \`group_persons\` DROP COLUMN \`fecha_union\``);
        await queryRunner.query(`DROP TABLE \`group_logs\``);
    }
}
