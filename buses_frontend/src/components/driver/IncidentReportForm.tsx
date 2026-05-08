import React, { useState } from 'react';
import Button from '../common/Button';
import * as incidentService from '../../services/incidentService';
import type { IncidentType, IncidentSeverity } from '../../types/incident.types';

interface IncidentReportFormProps {
  busId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

const IncidentReportForm: React.FC<IncidentReportFormProps> = ({ busId, onSuccess, onCancel }) => {
  const [type, setType] = useState<IncidentType>('MECANICO');
  const [severity, setSeverity] = useState<IncidentSeverity>('BAJO');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      if (selectedFiles.length + photos.length > 5) {
        alert('Máximo 5 fotografías permitidas');
        return;
      }
      setPhotos([...photos, ...selectedFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // 1. Obtener ubicación GPS
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }).catch(() => null);

      const latitude = position?.coords.latitude || 0;
      const longitude = position?.coords.longitude || 0;

      // 2. Crear el incidente general
      const incident = await incidentService.createIncident({
        type,
        severity,
        description,
        date: new Date().toISOString(),
        state: 'ABIERTO'
      });

      if (!incident.id) throw new Error('Error al crear el incidente');

      // 3. Asociar incidente con el bus
      const busIncident = await incidentService.createBusesIncident({
        latitude,
        longitude,
        reportDate: new Date().toISOString(),
        busId,
        incidentId: incident.id
      });

      if (!busIncident.id) throw new Error('Error al asociar el incidente al bus');

      // 4. "Subir" fotos (aquí simularemos enviando una URL ficticia por cada archivo)
      // En una implementación real, primero se subirían a S3/Cloudinary y se obtendría la URL
      for (const photo of photos) {
        await incidentService.createPhoto({
          url: `https://fake-storage.com/photos/${photo.name}`,
          busIncidentId: busIncident.id
        });
      }

      onSuccess();
    } catch (err) {
      setError('Error al enviar el reporte. Por favor intente de nuevo.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tipo de Incidente
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as IncidentType)}
          className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
          required
        >
          <option value="MECANICO">Falla Mecánica</option>
          <option value="ACCIDENTE">Accidente</option>
          <option value="RETRASO">Retraso en Ruta</option>
          <option value="OTRO">Otro</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Nivel de Gravedad
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['BAJO', 'MEDIO', 'ALTA', 'CRITICA'] as IncidentSeverity[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeverity(s)}
              className={`
                px-3 py-2 text-xs font-semibold rounded-lg border transition-all
                ${severity === s 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}
              `}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Descripción del Incidente
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describa brevemente lo ocurrido..."
          className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Evidencia Fotográfica (Máx. 5)
        </label>
        <div className="mt-1 flex flex-wrap gap-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative w-20 h-20 group">
              <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                <img 
                  src={URL.createObjectURL(photo)} 
                  alt="preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          
          {photos.length < 5 && (
            <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-[10px] text-gray-500 mt-1">Añadir</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={handlePhotoChange} 
              />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={onCancel}
          type="button"
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          type="submit"
          isLoading={isSubmitting}
        >
          Enviar Reporte
        </Button>
      </div>
    </form>
  );
};

export default IncidentReportForm;
