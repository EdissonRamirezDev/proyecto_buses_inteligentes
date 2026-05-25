import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Alinea incidentes al esquema del equipo (InitBusesSchema + entidades actuales):
 *   incidents: type, severity, description, date, state
 *   buses_incidents (no incident_buses)
 *   photos: url, uploadedAt, busIncidentId
 *
 * Si ya existe ese esquema (BD del compañero), no hace nada.
 * Si hay datos en esquema viejo, renombra/mapea columnas sin borrar filas.
 */
export class AlignIncidentsSchemaToTeam1779462500000 implements MigrationInterface {
  name = 'AlignIncidentsSchemaToTeam1779462500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const incidentsTable = await queryRunner.getTable('incidents');
    if (!incidentsTable) {
      await this.createTeamIncidentsSchema(queryRunner);
      return;
    }

    const columns = new Set(incidentsTable.columns.map((c) => c.name));
    const hasTeamSchema =
      columns.has('type') &&
      columns.has('severity') &&
      (await queryRunner.hasTable('buses_incidents'));

    if (hasTeamSchema) {
      return;
    }

    const [{ c: incidentRows }] = await queryRunner.query(
      'SELECT COUNT(*) AS c FROM `incidents`',
    );
    const hasData = Number(incidentRows) > 0;

    if (!hasData) {
      await this.replaceEmptyLegacyIncidentsSchema(queryRunner);
      return;
    }

    await this.migrateLegacyIncidentsWithData(queryRunner, columns);
  }

  private async replaceEmptyLegacyIncidentsSchema(
    queryRunner: QueryRunner,
  ): Promise<void> {
    if (await queryRunner.hasTable('photos')) {
      await this.dropForeignKeysOnTable(queryRunner, 'photos');
      await queryRunner.query('DROP TABLE `photos`');
    }

    if (await queryRunner.hasTable('incident_buses')) {
      await this.dropForeignKeysOnTable(queryRunner, 'incident_buses');
      await queryRunner.query('DROP TABLE `incident_buses`');
    }

    if (await queryRunner.hasTable('buses_incidents')) {
      await this.dropForeignKeysOnTable(queryRunner, 'buses_incidents');
      await queryRunner.query('DROP TABLE `buses_incidents`');
    }

    if (await queryRunner.hasTable('incidents')) {
      await this.dropForeignKeysOnTable(queryRunner, 'incidents');
      await queryRunner.query('DROP TABLE `incidents`');
    }

    await this.createTeamIncidentsSchema(queryRunner);
  }

  private async migrateLegacyIncidentsWithData(
    queryRunner: QueryRunner,
    columns: Set<string>,
  ): Promise<void> {
    if (columns.has('categoria') && !columns.has('type')) {
      await queryRunner.query(
        'ALTER TABLE `incidents` CHANGE `categoria` `type` varchar(255) NOT NULL',
      );
    }
    if (columns.has('descripcion') && !columns.has('description')) {
      await queryRunner.query(
        'ALTER TABLE `incidents` CHANGE `descripcion` `description` text NOT NULL',
      );
    }
    if (columns.has('fecha_reporte') && !columns.has('date')) {
      await queryRunner.query(
        'ALTER TABLE `incidents` CHANGE `fecha_reporte` `date` varchar(255) NOT NULL',
      );
    }
    if (columns.has('estado') && !columns.has('state')) {
      await queryRunner.query(
        'ALTER TABLE `incidents` CHANGE `estado` `state` varchar(255) NOT NULL',
      );
    }
    if (!columns.has('severity')) {
      await queryRunner.query(
        'ALTER TABLE `incidents` ADD `severity` varchar(255) NOT NULL DEFAULT \'MEDIO\'',
      );
    }
    if (columns.has('titulo')) {
      await queryRunner.query('ALTER TABLE `incidents` DROP COLUMN `titulo`');
    }

    if (
      (await queryRunner.hasTable('incident_buses')) &&
      !(await queryRunner.hasTable('buses_incidents'))
    ) {
      await queryRunner.query(
        'RENAME TABLE `incident_buses` TO `buses_incidents`',
      );
      const biTable = await queryRunner.getTable('buses_incidents');
      if (biTable?.columns.some((c) => c.name === 'nivel_gravedad')) {
        await queryRunner.query(
          'ALTER TABLE `buses_incidents` DROP COLUMN `nivel_gravedad`',
        );
      }
      if (!biTable?.columns.some((c) => c.name === 'reportDate')) {
        await queryRunner.query(
          'ALTER TABLE `buses_incidents` ADD `reportDate` varchar(255) NOT NULL DEFAULT \'\'',
        );
      }
      if (!biTable?.columns.some((c) => c.name === 'latitude')) {
        await queryRunner.query(
          'ALTER TABLE `buses_incidents` ADD `latitude` int NOT NULL DEFAULT 0',
        );
      }
      if (!biTable?.columns.some((c) => c.name === 'longitude')) {
        await queryRunner.query(
          'ALTER TABLE `buses_incidents` ADD `longitude` int NOT NULL DEFAULT 0',
        );
      }
    } else if (!(await queryRunner.hasTable('buses_incidents'))) {
      await queryRunner.query(
        `CREATE TABLE \`buses_incidents\` (
          \`id\` int NOT NULL AUTO_INCREMENT,
          \`latitude\` int NOT NULL,
          \`longitude\` int NOT NULL,
          \`reportDate\` varchar(255) NOT NULL,
          \`bus_id\` int NULL,
          \`incident_id\` int NULL,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB`,
      );
    }
  }

  private async createTeamIncidentsSchema(
    queryRunner: QueryRunner,
  ): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`incidents\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`type\` varchar(255) NOT NULL,
        \`severity\` varchar(255) NOT NULL,
        \`description\` varchar(255) NOT NULL,
        \`date\` varchar(255) NOT NULL,
        \`state\` varchar(255) NOT NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`buses_incidents\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`latitude\` int NOT NULL,
        \`longitude\` int NOT NULL,
        \`reportDate\` varchar(255) NOT NULL,
        \`bus_id\` int NULL,
        \`incident_id\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `CREATE TABLE \`photos\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`url\` varchar(255) NOT NULL,
        \`uploadedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`busIncidentId\` int NULL,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`,
    );

    await queryRunner.query(
      `ALTER TABLE \`buses_incidents\` ADD CONSTRAINT \`FK_0a1571502ae21700f4451bcbef8\`
       FOREIGN KEY (\`bus_id\`) REFERENCES \`buses\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`buses_incidents\` ADD CONSTRAINT \`FK_10b30869bad4cf06ab4f71bd774\`
       FOREIGN KEY (\`incident_id\`) REFERENCES \`incidents\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`photos\` ADD CONSTRAINT \`FK_d4041a7cd46a738dc63d0aba816\`
       FOREIGN KEY (\`busIncidentId\`) REFERENCES \`buses_incidents\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  private async dropForeignKeysOnTable(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    const fks: { CONSTRAINT_NAME: string }[] = await queryRunner.query(
      `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
         AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
      [tableName],
    );
    for (const fk of fks) {
      await queryRunner.query(
        `ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``,
      );
    }
  }

  public async down(): Promise<void> {
    // Sin revert automático: evitar dejar la BD en esquema español mezclado.
  }
}
