import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdvisorsTable1781583469781 implements MigrationInterface {
    name = 'AddAdvisorsTable1781583469781'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`advisors\` (\`id\` varchar(36) NOT NULL, \`nombre\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_9c2610a7f664b53eb62b8aaa9a\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_9c2610a7f664b53eb62b8aaa9a\` ON \`advisors\``);
        await queryRunner.query(`DROP TABLE \`advisors\``);
    }

}
