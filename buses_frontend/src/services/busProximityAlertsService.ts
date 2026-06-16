import { httpBusiness } from './http';

export const subscribeToAlert = async (data: { userId: string; routeId: string; busStopId: string; minutesAdvance: number }) => {
  const response = await httpBusiness.post('/bus-proximity-alerts/subscribe', data);
  return response.data;
};

export const unsubscribeFromAlert = async (alertId: string) => {
  const response = await httpBusiness.patch(`/bus-proximity-alerts/unsubscribe/${alertId}`);
  return response.data;
};

export const getActiveAlerts = async (userId: string) => {
  const response = await httpBusiness.get(`/bus-proximity-alerts/active/${userId}`);
  return response.data;
};
