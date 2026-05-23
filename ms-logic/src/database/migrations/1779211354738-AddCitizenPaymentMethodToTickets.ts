import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCitizenPaymentMethodToTickets1779211354738 implements MigrationInterface {
    name = 'AddCitizenPaymentMethodToTickets1779211354738'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`addresses\` (\`id\` varchar(36) NOT NULL, \`direccion\` varchar(255) NOT NULL, \`ciudad\` varchar(255) NULL, \`citizen_id\` varchar(36) NULL, UNIQUE INDEX \`REL_fee49481c42760e42ccf6fb5fd\` (\`citizen_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD \`citizenPaymentMethodId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`addresses\` ADD CONSTRAINT \`FK_fee49481c42760e42ccf6fb5fdb\` FOREIGN KEY (\`citizen_id\`) REFERENCES \`citizens\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`tickets\` ADD CONSTRAINT \`FK_dc4cac3cca2b24c6303c67bbcbb\` FOREIGN KEY (\`citizenPaymentMethodId\`) REFERENCES \`citizen_payment_methods\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP FOREIGN KEY \`FK_dc4cac3cca2b24c6303c67bbcbb\``);
        await queryRunner.query(`ALTER TABLE \`addresses\` DROP FOREIGN KEY \`FK_fee49481c42760e42ccf6fb5fdb\``);
        await queryRunner.query(`ALTER TABLE \`tickets\` DROP COLUMN \`citizenPaymentMethodId\``);
        await queryRunner.query(`DROP INDEX \`REL_fee49481c42760e42ccf6fb5fd\` ON \`addresses\``);
        await queryRunner.query(`DROP TABLE \`addresses\``);
    }

}
