import { MigrationInterface, QueryRunner } from "typeorm";

export class AddWalletAndPaymentMethods1778901341321 implements MigrationInterface {
    name = 'AddWalletAndPaymentMethods1778901341321'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`wallet_transactions\` (\`id\` varchar(36) NOT NULL, \`monto\` decimal(10,2) NOT NULL, \`tipo\` enum ('RECARGA', 'COMPRA_BOLETO', 'REEMBOLSO') NOT NULL, \`referencia_externa\` varchar(255) NULL, \`fecha_transaccion\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`citizenId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`payment_methods\` (\`id\` varchar(36) NOT NULL, \`nombre\` varchar(255) NOT NULL, \`descripcion\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`citizen_payment_methods\` (\`id\` varchar(36) NOT NULL, \`identificador_instrumento\` varchar(255) NULL, \`is_active\` tinyint NOT NULL DEFAULT 1, \`citizen_id\` varchar(36) NULL, \`payment_method_id\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`fecha_nacimiento\``);
        await queryRunner.query(`ALTER TABLE \`history\` DROP COLUMN \`tipo_validacion\``);
        await queryRunner.query(`ALTER TABLE \`citizens\` ADD \`fecha_nacimiento\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`history\` ADD \`tipo_validacion\` enum ('ENTRADA', 'SALIDA') NOT NULL DEFAULT 'ENTRADA'`);
        await queryRunner.query(`ALTER TABLE \`wallet_transactions\` ADD CONSTRAINT \`FK_41f6be73e58f19f006d6978cc55\` FOREIGN KEY (\`citizenId\`) REFERENCES \`citizens\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`citizen_payment_methods\` ADD CONSTRAINT \`FK_d5d576d619c3e6a9ff47708d37b\` FOREIGN KEY (\`citizen_id\`) REFERENCES \`citizens\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`citizen_payment_methods\` ADD CONSTRAINT \`FK_77127fdff457647b00e37a29c9c\` FOREIGN KEY (\`payment_method_id\`) REFERENCES \`payment_methods\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`citizen_payment_methods\` DROP FOREIGN KEY \`FK_77127fdff457647b00e37a29c9c\``);
        await queryRunner.query(`ALTER TABLE \`citizen_payment_methods\` DROP FOREIGN KEY \`FK_d5d576d619c3e6a9ff47708d37b\``);
        await queryRunner.query(`ALTER TABLE \`wallet_transactions\` DROP FOREIGN KEY \`FK_41f6be73e58f19f006d6978cc55\``);
        await queryRunner.query(`ALTER TABLE \`history\` DROP COLUMN \`tipo_validacion\``);
        await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`fecha_nacimiento\``);
        await queryRunner.query(`ALTER TABLE \`history\` ADD \`tipo_validacion\` enum ('ENTRADA', 'SALIDA') NOT NULL DEFAULT 'ENTRADA'`);
        await queryRunner.query(`ALTER TABLE \`citizens\` ADD \`fecha_nacimiento\` date NULL`);
        await queryRunner.query(`DROP TABLE \`citizen_payment_methods\``);
        await queryRunner.query(`DROP TABLE \`payment_methods\``);
        await queryRunner.query(`DROP TABLE \`wallet_transactions\``);
    }

}
