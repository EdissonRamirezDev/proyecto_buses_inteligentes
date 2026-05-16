import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusesModule } from './buses/buses.module';
import { RoutesModule } from './routes/routes.module';
import { CompaniesModule } from './companies/companies.module';
import { DriversModule } from './drivers/drivers.module';
import { ShiftsModule } from './shifts/shifts.module';
import { GpsModule } from './gps/gps.module';
import { IncidentsModule } from './incidents/incidents.module';
import { BusesIncidentsModule } from './buses_incidents/buses_incidents.module';
import { PhotosModule } from './photos/photos.module';
import { BusStopsModule } from './bus-stops/bus-stops.module';
import { NodesModule } from './nodes/nodes.module';
import { SchedulesModule } from './schedules/schedules.module';
import { CitizensModule } from './citizens/citizens.module';
import { TicketsModule } from './tickets/tickets.module';
import { HistoryModule } from './history/history.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASS'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Usaremos migraciones
      }),
    }),
    BusesModule,
    RoutesModule,
    CompaniesModule,
    DriversModule,
    ShiftsModule,
    GpsModule,
    IncidentsModule,
    BusesIncidentsModule,
    PhotosModule,
    BusStopsModule,
    NodesModule,
    SchedulesModule,
    CitizensModule,
    TicketsModule,
    HistoryModule,
  ],
})
export class AppModule {}