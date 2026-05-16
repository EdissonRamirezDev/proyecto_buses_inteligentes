import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTicketsTable1778188120380 implements MigrationInterface {
    name = 'CreateTicketsTable1778188120380'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tickets\` (\`id\` varchar(36) NOT NULL, \`codigo_qr\` varchar(255) NOT NULL, \`estado\` varchar(255) NOT NULL DEFAULT 'activo', \`precio_pagado\` decimal(10,2) NOT NULL, \`citizenId\` varchar(36) NULL, \`scheduleId\` varchar(36) NULL, UNIQUE INDEX \`IDX_05169035fd544f6a0097e3263b\` (\`codigo_qr\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_84f73183b448dc14893f2a5b496\` FOREIGN KEY (\`citizenId\`) REFERENCES \`citizens\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_12d8d20aac9eb6c412b8bd3f13b\` FOREIGN KEY (\`scheduleId\`) REFERENCES \`schedules\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_12d8d20aac9eb6c412b8bd3f13b\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_84f73183b448dc14893f2a5b496\``);
        await queryRunner.query(`DROP INDEX \`IDX_05169035fd544f6a0097e3263b\` ON \`tickets\``);
        await queryRunner.query(`DROP TABLE \`tickets\``);
    }

}
