import { MigrationInterface, QueryRunner } from "typeorm";

export class PersonRelations1779462358201 implements MigrationInterface {
    name = 'PersonRelations1779462358201'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`persons\` (\`id\` varchar(36) NOT NULL, \`userId\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`lastName\` varchar(255) NOT NULL, \`email\` varchar(255) NULL, \`phone\` varchar(255) NULL, UNIQUE INDEX \`IDX_e180e344d1f7b97f74b8137ace\` (\`userId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS \`business_administrators\` (\`id\` varchar(36) NOT NULL, \`person_id\` varchar(36) NULL, \`company_id\` int NULL, UNIQUE INDEX \`REL_753c1af7dd9cda58115db43a4f\` (\`person_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        
        // Remove email from drivers if it exists
        const driverCols = await queryRunner.query(`SHOW COLUMNS FROM \`drivers\``);
        if (driverCols.some(col => col.Field === 'email')) await queryRunner.query(`ALTER TABLE \`drivers\` DROP COLUMN \`email\``);
        if (driverCols.some(col => col.Field === 'last_name')) await queryRunner.query(`ALTER TABLE \`drivers\` DROP COLUMN \`last_name\``);
        if (driverCols.some(col => col.Field === 'name')) await queryRunner.query(`ALTER TABLE \`drivers\` DROP COLUMN \`name\``);
        if (driverCols.some(col => col.Field === 'phone')) await queryRunner.query(`ALTER TABLE \`drivers\` DROP COLUMN \`phone\``);
        
        if (!driverCols.some(col => col.Field === 'person_id')) {
            await queryRunner.query(`ALTER TABLE \`drivers\` ADD \`person_id\` varchar(36) NULL`);
            await queryRunner.query(`ALTER TABLE \`drivers\` ADD UNIQUE INDEX \`IDX_23268c10cda226c6db64ee1f84\` (\`person_id\`)`);
            await queryRunner.query(`ALTER TABLE \`drivers\` ADD CONSTRAINT \`FK_23268c10cda226c6db64ee1f84b\` FOREIGN KEY (\`person_id\`) REFERENCES \`persons\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        }

        const citizenCols = await queryRunner.query(`SHOW COLUMNS FROM \`citizens\``);
        if (citizenCols.some(col => col.Field === 'userId')) await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`userId\``);
        if (citizenCols.some(col => col.Field === 'nombres')) await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`nombres\``);
        if (citizenCols.some(col => col.Field === 'apellidos')) await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`apellidos\``);
        if (citizenCols.some(col => col.Field === 'telefono')) await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`telefono\``);
        
        if (!citizenCols.some(col => col.Field === 'person_id')) {
            await queryRunner.query(`ALTER TABLE \`citizens\` ADD \`person_id\` varchar(36) NULL`);
            await queryRunner.query(`ALTER TABLE \`citizens\` ADD UNIQUE INDEX \`REL_495d85264dc235cadb3a26b9b0\` (\`person_id\`)`);
            await queryRunner.query(`ALTER TABLE \`citizens\` ADD CONSTRAINT \`FK_495d85264dc235cadb3a26b9b0f\` FOREIGN KEY (\`person_id\`) REFERENCES \`persons\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        }

        const baFks: { CONSTRAINT_NAME: string }[] = await queryRunner.query(
            `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_administrators' AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
        );
        const baFkNames = new Set(baFks.map((fk) => fk.CONSTRAINT_NAME));

        if (!baFkNames.has('FK_753c1af7dd9cda58115db43a4f7')) {
            await queryRunner.query(`ALTER TABLE \`business_administrators\` ADD CONSTRAINT \`FK_753c1af7dd9cda58115db43a4f7\` FOREIGN KEY (\`person_id\`) REFERENCES \`persons\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        }
        if (!baFkNames.has('FK_6713dded60b74ba45c7d4b7a7b8')) {
            await queryRunner.query(`ALTER TABLE \`business_administrators\` ADD CONSTRAINT \`FK_6713dded60b74ba45c7d4b7a7b8\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop constraints and tables
        await queryRunner.query(`ALTER TABLE \`business_administrators\` DROP FOREIGN KEY \`FK_6713dded60b74ba45c7d4b7a7b8\``);
        await queryRunner.query(`ALTER TABLE \`business_administrators\` DROP FOREIGN KEY \`FK_753c1af7dd9cda58115db43a4f7\``);
        await queryRunner.query(`ALTER TABLE \`citizens\` DROP FOREIGN KEY \`FK_495d85264dc235cadb3a26b9b0f\``);
        await queryRunner.query(`ALTER TABLE \`drivers\` DROP FOREIGN KEY \`FK_23268c10cda226c6db64ee1f84b\``);
        await queryRunner.query(`DROP TABLE \`business_administrators\``);
        await queryRunner.query(`DROP TABLE \`persons\``);
    }

}
