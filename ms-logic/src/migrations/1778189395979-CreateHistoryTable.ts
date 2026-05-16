import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateHistoryTable1778189395979 implements MigrationInterface {
    name = 'CreateHistoryTable1778189395979'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`history\` (\`id\` varchar(36) NOT NULL, \`fecha_hora\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`ticketId\` varchar(36) NULL, \`nodeId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`history\` ADD CONSTRAINT \`FK_95723cc52650b084ce4dce9898c\` FOREIGN KEY (\`ticketId\`) REFERENCES \`tickets\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`history\` ADD CONSTRAINT \`FK_a7d27ff18def736fe9cfff3745c\` FOREIGN KEY (\`nodeId\`) REFERENCES \`nodes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`history\` DROP FOREIGN KEY \`FK_a7d27ff18def736fe9cfff3745c\``);
        await queryRunner.query(`ALTER TABLE \`history\` DROP FOREIGN KEY \`FK_95723cc52650b084ce4dce9898c\``);
        await queryRunner.query(`DROP TABLE \`history\``);
    }

}
