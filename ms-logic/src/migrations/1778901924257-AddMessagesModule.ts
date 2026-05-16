import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessagesModule1778901924257 implements MigrationInterface {
    name = 'AddMessagesModule1778901924257'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`buses\` DROP FOREIGN KEY \`FK_9c95dd427817f6ad645263473f6\``);
        await queryRunner.query(`CREATE TABLE \`messages\` (\`id\` varchar(36) NOT NULL, \`contenido\` text NOT NULL, \`fecha_envio\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`emisor_id\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`message_recipient_persons\` (\`id\` varchar(36) NOT NULL, \`destinatario_id\` varchar(255) NOT NULL, \`leido\` tinyint NOT NULL DEFAULT 0, \`fecha_lectura\` timestamp NULL, \`message_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`groups\` (\`id\` varchar(36) NOT NULL, \`nombre\` varchar(255) NOT NULL, \`descripcion\` varchar(255) NULL, \`fecha_creacion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`message_recipient_groups\` (\`id\` varchar(36) NOT NULL, \`message_id\` varchar(36) NULL, \`group_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`group_persons\` (\`id\` varchar(36) NOT NULL, \`person_id\` varchar(255) NOT NULL, \`group_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`fecha_nacimiento\``);
        await queryRunner.query(`ALTER TABLE \`history\` DROP COLUMN \`tipo_validacion\``);
        await queryRunner.query(`ALTER TABLE \`buses\` DROP COLUMN \`companyId\``);
        await queryRunner.query(`ALTER TABLE \`citizens\` ADD \`fecha_nacimiento\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`history\` ADD \`tipo_validacion\` enum ('ENTRADA', 'SALIDA') NOT NULL DEFAULT 'ENTRADA'`);
        await queryRunner.query(`ALTER TABLE \`buses\` ADD \`companyId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`buses\` ADD CONSTRAINT \`FK_9c95dd427817f6ad645263473f6\` FOREIGN KEY (\`companyId\`) REFERENCES \`companies\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message_recipient_persons\` ADD CONSTRAINT \`FK_a9bc839f896e76b4f31b1892bf4\` FOREIGN KEY (\`message_id\`) REFERENCES \`messages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message_recipient_groups\` ADD CONSTRAINT \`FK_30ac320d2dda0ab52104ab3817a\` FOREIGN KEY (\`message_id\`) REFERENCES \`messages\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`message_recipient_groups\` ADD CONSTRAINT \`FK_c64b7d08f8122cb0a86bee5c85f\` FOREIGN KEY (\`group_id\`) REFERENCES \`groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`group_persons\` ADD CONSTRAINT \`FK_cfad52523463a9517008836eabf\` FOREIGN KEY (\`group_id\`) REFERENCES \`groups\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`group_persons\` DROP FOREIGN KEY \`FK_cfad52523463a9517008836eabf\``);
        await queryRunner.query(`ALTER TABLE \`message_recipient_groups\` DROP FOREIGN KEY \`FK_c64b7d08f8122cb0a86bee5c85f\``);
        await queryRunner.query(`ALTER TABLE \`message_recipient_groups\` DROP FOREIGN KEY \`FK_30ac320d2dda0ab52104ab3817a\``);
        await queryRunner.query(`ALTER TABLE \`message_recipient_persons\` DROP FOREIGN KEY \`FK_a9bc839f896e76b4f31b1892bf4\``);
        await queryRunner.query(`ALTER TABLE \`buses\` DROP FOREIGN KEY \`FK_9c95dd427817f6ad645263473f6\``);
        await queryRunner.query(`ALTER TABLE \`buses\` DROP COLUMN \`companyId\``);
        await queryRunner.query(`ALTER TABLE \`history\` DROP COLUMN \`tipo_validacion\``);
        await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`fecha_nacimiento\``);
        await queryRunner.query(`ALTER TABLE \`buses\` ADD \`companyId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`history\` ADD \`tipo_validacion\` enum ('ENTRADA', 'SALIDA') NOT NULL DEFAULT 'ENTRADA'`);
        await queryRunner.query(`ALTER TABLE \`citizens\` ADD \`fecha_nacimiento\` date NULL`);
        await queryRunner.query(`DROP TABLE \`group_persons\``);
        await queryRunner.query(`DROP TABLE \`message_recipient_groups\``);
        await queryRunner.query(`DROP TABLE \`groups\``);
        await queryRunner.query(`DROP TABLE \`message_recipient_persons\``);
        await queryRunner.query(`DROP TABLE \`messages\``);
        await queryRunner.query(`ALTER TABLE \`buses\` ADD CONSTRAINT \`FK_9c95dd427817f6ad645263473f6\` FOREIGN KEY (\`companyId\`) REFERENCES \`companies\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
