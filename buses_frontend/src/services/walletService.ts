import { httpBusiness } from './http';
import type { Citizen } from '../types/citizen.types';

export interface WalletTransaction {
  id: string;
  monto: number;
  tipo: 'RECARGA' | 'COMPRA_BOLETO' | 'REEMBOLSO';
  referencia_externa?: string;
  fecha_transaccion: string;
}

export const rechargeWallet = async (
  citizenId: string,
  monto: number,
  referencia: string,
  metodoPago?: string,
): Promise<Citizen> => {
  const response = await httpBusiness.post<Citizen>(`/citizens/${citizenId}/recharge`, {
    monto,
    referencia,
    metodoPago,
  });
  return response.data;
};

export const getTransactions = async (citizenId: string): Promise<WalletTransaction[]> => {
  const response = await httpBusiness.get<WalletTransaction[]>(`/citizens/${citizenId}/transactions`);
  return response.data;
};
