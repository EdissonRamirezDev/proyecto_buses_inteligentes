import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPqrsTable1781584871875 implements MigrationInterface {
    name = 'AddPqrsTable1781584871875'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`pqrs\` (\`id\` varchar(36) NOT NULL, \`radicado\` varchar(255) NULL, \`tipo\` enum ('Petición', 'Queja', 'Reclamo', 'Sugerencia') NOT NULL DEFAULT 'Petición', \`categoria\` enum ('Conductor', 'Bus', 'Ruta', 'Tarjeta', 'Otro') NOT NULL DEFAULT 'Otro', \`descripcion\` varchar(500) NOT NULL, \`email\` varchar(255) NOT NULL, \`fotos\` text NULL, \`estado\` enum ('Recibido', 'En revisión', 'En proceso', 'Resuelto') NOT NULL DEFAULT 'Recibido', \`respuesta\` text NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_422e4aad504067ec2fba5d96cb\` (\`radicado\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_422e4aad504067ec2fba5d96cb\` ON \`pqrs\``);
        await queryRunner.query(`DROP TABLE \`pqrs\``);
    }

}
