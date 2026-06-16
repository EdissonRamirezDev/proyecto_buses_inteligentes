import { IsNotEmpty, IsNumber, IsString, IsIn } from 'class-validator';

export class SubscribeAlertDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  routeId: string;

  @IsString()
  @IsNotEmpty()
  busStopId: string;

  @IsNumber()
  @IsIn([5, 10, 15])
  minutesAdvance: number;
}
