import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIncidentsModule1778901587849 implements MigrationInterface {
    name = 'AddIncidentsModule1778901587849'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`photos\` (\`id\` varchar(36) NOT NULL, \`url_imagen\` varchar(255) NOT NULL, \`fecha_captura\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`incidentBusId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`incident_buses\` (\`id\` varchar(36) NOT NULL, \`nivel_gravedad\` int NULL, \`incident_id\` varchar(36) NULL, \`bus_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`incidents\` (\`id\` varchar(36) NOT NULL, \`titulo\` varchar(255) NOT NULL, \`descripcion\` text NOT NULL, \`categoria\` enum ('MECANICO', 'ACCIDENTE', 'CONGESTION', 'PASAJERO', 'OTRO') NOT NULL, \`estado\` enum ('REPORTADO', 'EN_REVISION', 'RESUELTO') NOT NULL DEFAULT 'REPORTADO', \`fecha_reporte\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`shiftId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`companies\` (\`id\` varchar(36) NOT NULL, \`nombre\` varchar(255) NOT NULL, \`nit\` varchar(255) NULL, \`telefono\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`gps_devices\` (\`id\` varchar(36) NOT NULL, \`codigo_serial\` varchar(255) NOT NULL, \`ultima_latitud\` decimal(10,8) NULL, \`ultima_longitud\` decimal(11,8) NULL, \`ultima_actualizacion\` timestamp NULL, \`busId\` int NULL, UNIQUE INDEX \`REL_770dce13e2d3289769b3906811\` (\`busId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`fecha_nacimiento\``);
        await queryRunner.query(`ALTER TABLE \`history\` DROP COLUMN \`tipo_validacion\``);
        await queryRunner.query(`ALTER TABLE \`citizens\` ADD \`fecha_nacimiento\` date NULL`);
        await queryRunner.query(`ALTER TABLE \`history\` ADD \`tipo_validacion\` enum ('ENTRADA', 'SALIDA') NOT NULL DEFAULT 'ENTRADA'`);
        await queryRunner.query(`ALTER TABLE \`buses\` ADD \`companyId\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`photos\` ADD CONSTRAINT \`FK_c4378c1c1eab6436e1caa24e16c\` FOREIGN KEY (\`incidentBusId\`) REFERENCES \`incident_buses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`incident_buses\` ADD CONSTRAINT \`FK_74c3ca8b06bffffa53bc7c8b906\` FOREIGN KEY (\`incident_id\`) REFERENCES \`incidents\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`incident_buses\` ADD CONSTRAINT \`FK_2bf1d637915803940d6aa0de14f\` FOREIGN KEY (\`bus_id\`) REFERENCES \`buses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`incidents\` ADD CONSTRAINT \`FK_9f6cf18c1ee9707aa626bb8e1c0\` FOREIGN KEY (\`shiftId\`) REFERENCES \`shifts\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`gps_devices\` ADD CONSTRAINT \`FK_770dce13e2d3289769b39068111\` FOREIGN KEY (\`busId\`) REFERENCES \`buses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`buses\` ADD CONSTRAINT \`FK_9c95dd427817f6ad645263473f6\` FOREIGN KEY (\`companyId\`) REFERENCES \`companies\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`buses\` DROP FOREIGN KEY \`FK_9c95dd427817f6ad645263473f6\``);
        await queryRunner.query(`ALTER TABLE \`gps_devices\` DROP FOREIGN KEY \`FK_770dce13e2d3289769b39068111\``);
        await queryRunner.query(`ALTER TABLE \`incidents\` DROP FOREIGN KEY \`FK_9f6cf18c1ee9707aa626bb8e1c0\``);
        await queryRunner.query(`ALTER TABLE \`incident_buses\` DROP FOREIGN KEY \`FK_2bf1d637915803940d6aa0de14f\``);
        await queryRunner.query(`ALTER TABLE \`incident_buses\` DROP FOREIGN KEY \`FK_74c3ca8b06bffffa53bc7c8b906\``);
        await queryRunner.query(`ALTER TABLE \`photos\` DROP FOREIGN KEY \`FK_c4378c1c1eab6436e1caa24e16c\``);
        await queryRunner.query(`ALTER TABLE \`buses\` DROP COLUMN \`companyId\``);
        await queryRunner.query(`ALTER TABLE \`history\` DROP COLUMN \`tipo_validacion\``);
        await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`fecha_nacimiento\``);
        await queryRunner.query(`ALTER TABLE \`history\` ADD \`tipo_validacion\` enum ('ENTRADA', 'SALIDA') NOT NULL DEFAULT 'ENTRADA'`);
        await queryRunner.query(`ALTER TABLE \`citizens\` ADD \`fecha_nacimiento\` date NULL`);
        await queryRunner.query(`DROP INDEX \`REL_770dce13e2d3289769b3906811\` ON \`gps_devices\``);
        await queryRunner.query(`DROP TABLE \`gps_devices\``);
        await queryRunner.query(`DROP TABLE \`companies\``);
        await queryRunner.query(`DROP TABLE \`incidents\``);
        await queryRunner.query(`DROP TABLE \`incident_buses\``);
        await queryRunner.query(`DROP TABLE \`photos\``);
    }

}
