import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCitizenBirthDate1778901064346 implements MigrationInterface {
    name = 'AddCitizenBirthDate1778901064346'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`citizens\` ADD \`fecha_nacimiento\` date NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`citizens\` DROP COLUMN \`fecha_nacimiento\``);
    }

}
