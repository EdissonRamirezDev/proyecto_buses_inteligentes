import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCitizensTable1778186819075 implements MigrationInterface {
    name = 'CreateCitizensTable1778186819075'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`citizens\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NULL, \`nombres\` varchar(255) NOT NULL, \`apellidos\` varchar(255) NOT NULL, \`telefono\` varchar(255) NULL, \`direccion\` varchar(255) NULL, \`saldo\` decimal(10,2) NOT NULL DEFAULT '0.00', PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`citizens\``);
    }

}
