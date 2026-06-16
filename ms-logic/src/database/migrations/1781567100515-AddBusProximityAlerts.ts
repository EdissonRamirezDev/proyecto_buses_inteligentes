import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBusProximityAlerts1781567100515 implements MigrationInterface {
    name = 'AddBusProximityAlerts1781567100515'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`bus_proximity_alerts\` (\`id\` varchar(36) NOT NULL, \`route_id\` varchar(255) NOT NULL, \`bus_stop_id\` varchar(255) NOT NULL, \`minutes_advance\` int NOT NULL DEFAULT '10', \`is_active\` tinyint NOT NULL DEFAULT 1, \`was_triggered\` tinyint NOT NULL DEFAULT 0, \`triggered_at\` timestamp NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`person_id\` varchar(255) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`bus_proximity_alerts\` ADD CONSTRAINT \`FK_c1c6b4b9a73db04c5271ae4ec18\` FOREIGN KEY (\`person_id\`) REFERENCES \`persons\`(\`userId\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`bus_proximity_alerts\` DROP FOREIGN KEY \`FK_c1c6b4b9a73db04c5271ae4ec18\``);
        await queryRunner.query(`DROP TABLE \`bus_proximity_alerts\``);
    }
}
