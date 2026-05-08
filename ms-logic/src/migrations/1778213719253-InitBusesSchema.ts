import { MigrationInterface, QueryRunner } from "typeorm";

export class InitBusesSchema1778213719253 implements MigrationInterface {
    name = 'InitBusesSchema1778213719253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`gps\` (\`id\` int NOT NULL AUTO_INCREMENT, \`latitude\` decimal(10,7) NULL, \`longitude\` decimal(10,7) NULL, \`busId\` int NULL, UNIQUE INDEX \`REL_3ee73b40fa14ab3a700b131318\` (\`busId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`incidents\` (\`id\` int NOT NULL AUTO_INCREMENT, \`type\` varchar(255) NOT NULL, \`severity\` varchar(255) NOT NULL, \`description\` varchar(255) NOT NULL, \`date\` varchar(255) NOT NULL, \`state\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`photos\` (\`id\` int NOT NULL AUTO_INCREMENT, \`url\` varchar(255) NOT NULL, \`uploadedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`busIncidentId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`buses_incidents\` (\`id\` int NOT NULL AUTO_INCREMENT, \`latitude\` int NOT NULL, \`longitude\` int NOT NULL, \`reportDate\` varchar(255) NOT NULL, \`bus_id\` int NULL, \`incident_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`drivers\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`last_name\` varchar(255) NOT NULL, \`license\` varchar(255) NOT NULL, \`phone\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`status\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`company_drivers\` (\`id\` int NOT NULL AUTO_INCREMENT, \`assignedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, \`status\` enum ('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE', \`companyId\` int NULL, \`driverId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`companies\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`nit\` varchar(255) NOT NULL, \`phone\` varchar(255) NULL, \`email\` varchar(255) NULL, \`address\` varchar(255) NULL, \`logo\` varchar(255) NULL, UNIQUE INDEX \`IDX_ed61d4dcafb6fe0f595f5e0cbd\` (\`nit\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`buses\` (\`id\` int NOT NULL AUTO_INCREMENT, \`placa\` varchar(255) NOT NULL, \`modelo\` varchar(255) NOT NULL, \`capacidad\` int NOT NULL, \`estado\` varchar(255) NOT NULL, \`companyId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`shifts\` (\`id\` int NOT NULL AUTO_INCREMENT, \`fecha_inicio\` datetime NOT NULL, \`fecha_fin\` datetime NOT NULL, \`estado\` varchar(255) NOT NULL, \`bus_id\` int NULL, \`driver_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`DROP INDEX \`REL_3ee73b40fa14ab3a700b131318\` ON \`gps\``);
        await queryRunner.query(`ALTER TABLE \`gps\` DROP COLUMN \`busId\``);
        await queryRunner.query(`ALTER TABLE \`gps\` ADD \`busId\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`gps\` ADD UNIQUE INDEX \`IDX_3ee73b40fa14ab3a700b131318\` (\`busId\`)`);
        await queryRunner.query(`ALTER TABLE \`gps\` ADD \`bus_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`gps\` ADD UNIQUE INDEX \`IDX_8f4db1f562e86ccd755281edc6\` (\`bus_id\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_3ee73b40fa14ab3a700b131318\` ON \`gps\` (\`busId\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_8f4db1f562e86ccd755281edc6\` ON \`gps\` (\`bus_id\`)`);
        await queryRunner.query(`ALTER TABLE \`gps\` ADD CONSTRAINT \`FK_3ee73b40fa14ab3a700b1313189\` FOREIGN KEY (\`busId\`) REFERENCES \`buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`photos\` ADD CONSTRAINT \`FK_d4041a7cd46a738dc63d0aba816\` FOREIGN KEY (\`busIncidentId\`) REFERENCES \`buses_incidents\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`buses_incidents\` ADD CONSTRAINT \`FK_0a1571502ae21700f4451bcbef8\` FOREIGN KEY (\`bus_id\`) REFERENCES \`buses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`buses_incidents\` ADD CONSTRAINT \`FK_10b30869bad4cf06ab4f71bd774\` FOREIGN KEY (\`incident_id\`) REFERENCES \`incidents\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`company_drivers\` ADD CONSTRAINT \`FK_5afa61b61a8b25c52632795bb51\` FOREIGN KEY (\`companyId\`) REFERENCES \`companies\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`company_drivers\` ADD CONSTRAINT \`FK_62c4971754c23115ddf7ba84ce2\` FOREIGN KEY (\`driverId\`) REFERENCES \`drivers\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`buses\` ADD CONSTRAINT \`FK_9c95dd427817f6ad645263473f6\` FOREIGN KEY (\`companyId\`) REFERENCES \`companies\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shifts\` ADD CONSTRAINT \`FK_0c1955fa18b1811a884c7599e7f\` FOREIGN KEY (\`bus_id\`) REFERENCES \`buses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`shifts\` ADD CONSTRAINT \`FK_66f293515d51551bf0c492c5ef5\` FOREIGN KEY (\`driver_id\`) REFERENCES \`drivers\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`gps\` ADD CONSTRAINT \`FK_8f4db1f562e86ccd755281edc60\` FOREIGN KEY (\`bus_id\`) REFERENCES \`buses\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`gps\` DROP FOREIGN KEY \`FK_8f4db1f562e86ccd755281edc60\``);
        await queryRunner.query(`ALTER TABLE \`shifts\` DROP FOREIGN KEY \`FK_66f293515d51551bf0c492c5ef5\``);
        await queryRunner.query(`ALTER TABLE \`shifts\` DROP FOREIGN KEY \`FK_0c1955fa18b1811a884c7599e7f\``);
        await queryRunner.query(`ALTER TABLE \`buses\` DROP FOREIGN KEY \`FK_9c95dd427817f6ad645263473f6\``);
        await queryRunner.query(`ALTER TABLE \`company_drivers\` DROP FOREIGN KEY \`FK_62c4971754c23115ddf7ba84ce2\``);
        await queryRunner.query(`ALTER TABLE \`company_drivers\` DROP FOREIGN KEY \`FK_5afa61b61a8b25c52632795bb51\``);
        await queryRunner.query(`ALTER TABLE \`buses_incidents\` DROP FOREIGN KEY \`FK_10b30869bad4cf06ab4f71bd774\``);
        await queryRunner.query(`ALTER TABLE \`buses_incidents\` DROP FOREIGN KEY \`FK_0a1571502ae21700f4451bcbef8\``);
        await queryRunner.query(`ALTER TABLE \`photos\` DROP FOREIGN KEY \`FK_d4041a7cd46a738dc63d0aba816\``);
        await queryRunner.query(`ALTER TABLE \`gps\` DROP FOREIGN KEY \`FK_3ee73b40fa14ab3a700b1313189\``);
        await queryRunner.query(`DROP INDEX \`REL_8f4db1f562e86ccd755281edc6\` ON \`gps\``);
        await queryRunner.query(`DROP INDEX \`REL_3ee73b40fa14ab3a700b131318\` ON \`gps\``);
        await queryRunner.query(`ALTER TABLE \`gps\` DROP INDEX \`IDX_8f4db1f562e86ccd755281edc6\``);
        await queryRunner.query(`ALTER TABLE \`gps\` DROP COLUMN \`bus_id\``);
        await queryRunner.query(`ALTER TABLE \`gps\` DROP INDEX \`IDX_3ee73b40fa14ab3a700b131318\``);
        await queryRunner.query(`ALTER TABLE \`gps\` DROP COLUMN \`busId\``);
        await queryRunner.query(`ALTER TABLE \`gps\` ADD \`busId\` int NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_3ee73b40fa14ab3a700b131318\` ON \`gps\` (\`busId\`)`);
        await queryRunner.query(`DROP TABLE \`shifts\``);
        await queryRunner.query(`DROP TABLE \`buses\``);
        await queryRunner.query(`DROP INDEX \`IDX_ed61d4dcafb6fe0f595f5e0cbd\` ON \`companies\``);
        await queryRunner.query(`DROP TABLE \`companies\``);
        await queryRunner.query(`DROP TABLE \`company_drivers\``);
        await queryRunner.query(`DROP TABLE \`drivers\``);
        await queryRunner.query(`DROP TABLE \`buses_incidents\``);
        await queryRunner.query(`DROP TABLE \`photos\``);
        await queryRunner.query(`DROP TABLE \`incidents\``);
        await queryRunner.query(`DROP INDEX \`REL_3ee73b40fa14ab3a700b131318\` ON \`gps\``);
        await queryRunner.query(`DROP TABLE \`gps\``);
    }

}
