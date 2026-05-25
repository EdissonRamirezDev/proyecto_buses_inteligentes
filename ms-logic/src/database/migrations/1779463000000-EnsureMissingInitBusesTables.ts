import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Crea tablas del esquema InitBusesSchema que falten localmente.
 * Si el compañero ya las tiene, no hace nada (CREATE IF NOT EXISTS / hasTable).
 */
export class EnsureMissingInitBusesTables1779463000000 implements MigrationInterface {
  name = 'EnsureMissingInitBusesTables1779463000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('company_drivers'))) {
      await queryRunner.query(
        `CREATE TABLE \`company_drivers\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`assignedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`status\` enum('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
          \`companyId\` int NULL,
          \`driverId\` int NULL,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`,
      );

      if (await queryRunner.hasTable('companies')) {
        await queryRunner.query(
          `ALTER TABLE \`company_drivers\` ADD CONSTRAINT \`FK_5afa61b61a8b25c52632795bb51\`
           FOREIGN KEY (\`companyId\`) REFERENCES \`companies\`(\`id\`)
           ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
      }

      if (await queryRunner.hasTable('drivers')) {
        await queryRunner.query(
          `ALTER TABLE \`company_drivers\` ADD CONSTRAINT \`FK_62c4971754c23115ddf7ba84ce2\`
           FOREIGN KEY (\`driverId\`) REFERENCES \`drivers\`(\`id\`)
           ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('company_drivers')) {
      const fks: { CONSTRAINT_NAME: string }[] = await queryRunner.query(
        `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'company_drivers'
           AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
      );
      for (const fk of fks) {
        await queryRunner.query(
          `ALTER TABLE \`company_drivers\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``,
        );
      }
      await queryRunner.query('DROP TABLE `company_drivers`');
    }
  }
}
