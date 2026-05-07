import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncBusinessLogic1777872061133 implements MigrationInterface {
    name = 'SyncBusinessLogic1777872061133'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`bus_stops\` (\`id\` varchar(36) NOT NULL, \`codigo\` varchar(255) NOT NULL, \`nombre\` varchar(255) NOT NULL, \`latitud\` decimal(10,8) NOT NULL, \`longitud\` decimal(11,8) NOT NULL, \`tipo\` varchar(255) NOT NULL DEFAULT 'regular', UNIQUE INDEX \`IDX_bf00f79143ffd3755ce3825e74\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`nodes\` (\`id\` varchar(36) NOT NULL, \`orden\` int NOT NULL, \`distancia_anterior\` decimal(10,2) NOT NULL DEFAULT '0.00', \`tiempo_estimado\` int NOT NULL DEFAULT '0', \`routeId\` varchar(36) NULL, \`busStopId\` varchar(36) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`routes\` (\`id\` varchar(36) NOT NULL, \`codigo\` varchar(255) NOT NULL, \`nombre\` varchar(255) NOT NULL, \`descripcion\` text NULL, \`tarifa\` decimal(10,2) NOT NULL, UNIQUE INDEX \`IDX_f5320653813fe4cd014b8a6c14\` (\`codigo\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`schedules\` (\`id\` varchar(36) NOT NULL, \`fecha\` date NOT NULL, \`hora_salida\` time NOT NULL, \`tolerancia_minutos\` int NOT NULL DEFAULT '0', \`es_recurrente\` tinyint NOT NULL DEFAULT 0, \`tipo_recurrencia\` varchar(255) NULL, \`estado\` varchar(255) NOT NULL DEFAULT 'programado', \`routeId\` varchar(36) NULL, \`busId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`nodes\` ADD CONSTRAINT \`FK_e47f73dead5333c053f87d3bfef\` FOREIGN KEY (\`routeId\`) REFERENCES \`routes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`nodes\` ADD CONSTRAINT \`FK_676602b6c98452b3ec48b3bf187\` FOREIGN KEY (\`busStopId\`) REFERENCES \`bus_stops\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`schedules\` ADD CONSTRAINT \`FK_796dabf6a5077692672d42e704b\` FOREIGN KEY (\`routeId\`) REFERENCES \`routes\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`schedules\` ADD CONSTRAINT \`FK_d1e417ab02019758bbfa2ba5396\` FOREIGN KEY (\`busId\`) REFERENCES \`buses\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`schedules\` DROP FOREIGN KEY \`FK_d1e417ab02019758bbfa2ba5396\``);
        await queryRunner.query(`ALTER TABLE \`schedules\` DROP FOREIGN KEY \`FK_796dabf6a5077692672d42e704b\``);
        await queryRunner.query(`ALTER TABLE \`nodes\` DROP FOREIGN KEY \`FK_676602b6c98452b3ec48b3bf187\``);
        await queryRunner.query(`ALTER TABLE \`nodes\` DROP FOREIGN KEY \`FK_e47f73dead5333c053f87d3bfef\``);
        await queryRunner.query(`DROP TABLE \`schedules\``);
        await queryRunner.query(`DROP INDEX \`IDX_f5320653813fe4cd014b8a6c14\` ON \`routes\``);
        await queryRunner.query(`DROP TABLE \`routes\``);
        await queryRunner.query(`DROP TABLE \`nodes\``);
        await queryRunner.query(`DROP INDEX \`IDX_bf00f79143ffd3755ce3825e74\` ON \`bus_stops\``);
        await queryRunner.query(`DROP TABLE \`bus_stops\``);
    }

}
