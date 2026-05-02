import { MigrationInterface, QueryRunner } from "typeorm";

export class InitShiftBusDriverSchema1777498882434 implements MigrationInterface {
    name = 'InitShiftBusDriverSchema1777498882434'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`buses\` (\`id\` int NOT NULL AUTO_INCREMENT, \`placa\` varchar(255) NOT NULL, \`modelo\` varchar(255) NOT NULL, \`capacidad\` int NOT NULL, \`estado\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`drivers\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`last_name\` varchar(255) NOT NULL, \`license\` varchar(255) NOT NULL, \`phone\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`shifts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`fecha_inicio\` datetime NOT NULL, \`fecha_fin\` datetime NOT NULL, \`estado\` varchar(255) NOT NULL, \`bus_id\` int NULL, \`driver_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`shifts\` ADD CONSTRAINT \`FK_0c1955fa18b1811a884c7599e7f\` FOREIGN KEY (\`bus_id\`) REFERENCES \`buses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shifts\` ADD CONSTRAINT \`FK_66f293515d51551bf0c492c5ef5\` FOREIGN KEY (\`driver_id\`) REFERENCES \`drivers\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`shifts\` DROP FOREIGN KEY \`FK_66f293515d51551bf0c492c5ef5\``);
        await queryRunner.query(`ALTER TABLE \`shifts\` DROP FOREIGN KEY \`FK_0c1955fa18b1811a884c7599e7f\``);
        await queryRunner.query(`DROP TABLE \`shifts\``);
        await queryRunner.query(`DROP TABLE \`drivers\``);
        await queryRunner.query(`DROP TABLE \`buses\``);
    }

}
