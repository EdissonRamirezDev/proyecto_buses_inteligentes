import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from '../hooks/useAuth';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'urgent';
}

interface SocketContextType {
  triggerRefresh: number;
}

const SocketContext = createContext<SocketContextType>({ triggerRefresh: 0 });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [triggerRefresh, setTriggerRefresh] = useState(0);

  useEffect(() => {
    if (user && user.id) {
      socketService.connect(user.id);

      const handleNewMessage = () => {
        addToast('Nuevo mensaje', 'Tienes un nuevo mensaje sin leer.', 'info');
        setTriggerRefresh(prev => prev + 1);
      };

      const handleNewMassAlert = (data: any) => {
        addToast(
          data.isUrgent ? 'Alerta Urgente' : 'Alerta del Sistema',
          data.contenido || 'Tienes una nueva alerta masiva.',
          data.isUrgent ? 'urgent' : 'info'
        );
        setTriggerRefresh(prev => prev + 1);
      };

      socketService.on('newMessage', handleNewMessage);
      socketService.on('newMassAlert', handleNewMassAlert);

      return () => {
        socketService.off('newMessage', handleNewMessage);
        socketService.off('newMassAlert', handleNewMassAlert);
        socketService.disconnect();
      };
    }
  }, [user]);

  const addToast = (title: string, message: string, type: 'info' | 'urgent') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <SocketContext.Provider value={{ triggerRefresh }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`p-4 rounded-lg shadow-lg border transition-all transform animate-in slide-in-from-right-8 duration-300 ${
              toast.type === 'urgent'
                ? 'bg-rose-50 border-rose-500 text-rose-900 dark:bg-rose-900/30 dark:border-rose-500 dark:text-rose-100'
                : 'bg-white border-indigo-200 text-slate-800 dark:bg-slate-800 dark:border-indigo-500/30 dark:text-white'
            }`}
            style={{ width: '320px' }}
          >
            <div className="flex justify-between items-start">
              <h4 className="font-bold text-sm mb-1">{toast.title}</h4>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <p className="text-sm opacity-90 line-clamp-2">{toast.message}</p>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
};
