import { DataSource } from 'typeorm';
import 'dotenv/config'; // Carga las variables del archivo .env

const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // Para CLI (ts-node) y para runtime compilado (dist)
  entities: ['src/**/*.entity{.ts,.js}', 'dist/**/*.entity.js'],
  // Orden cronológico por timestamp: src/migrations (InitBusesSchema, etc.) + src/database/migrations
  migrations: [
    'src/migrations/*{.ts,.js}',
    'src/database/migrations/*{.ts,.js}',
    'dist/migrations/*.js',
    'dist/database/migrations/*.js',
  ],
  synchronize: true,
});

export default dataSource;