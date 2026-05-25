import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as companyService from '../../services/companyService';
import type { Company } from '../../services/companyService';
import Button from '../../components/common/Button';
import AdminHeader from '../../components/common/AdminHeader';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';

type View = 'list' | 'form';

const CompaniesPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('list');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');

  const loadCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await companyService.getCompanies();
      setCompanies(data);
    } catch {
      setError('Error al cargar las empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCreate = () => {
    setCompanyToEdit(null);
    setName('');
    setNit('');
    setPhone('');
    setEmail('');
    setAddress('');
    setFormError('');
    setView('form');
  };

  const handleEdit = (company: Company) => {
    setCompanyToEdit(company);
    setName(company.name || '');
    setNit(company.nit || '');
    setPhone(company.phone || '');
    setEmail(company.email || '');
    setAddress(company.address || '');
    setFormError('');
    setView('form');
  };

  const handleCancel = () => {
    setView('list');
    setCompanyToEdit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const data = { name, nit, phone, email, address };
      if (companyToEdit?.id) {
        await companyService.updateCompany(companyToEdit.id, data);
      } else {
        await companyService.createCompany(data);
      }
      await loadCompanies();
      setView('list');
      setCompanyToEdit(null);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar la empresa. Asegúrate de que el NIT sea único.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, companyName: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la empresa "${companyName}"? Se eliminarán los buses y conductores asociados.`)) {
      return;
    }
    try {
      await companyService.deleteCompany(id);
      await loadCompanies();
    } catch {
      setError('Error al eliminar la empresa.');
    }
  };

  const filteredCompanies = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (c.name?.toLowerCase().includes(q) || c.nit?.toLowerCase().includes(q));
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminHeader 
          title={view === 'form' ? (companyToEdit ? 'Editando Empresa' : 'Nueva Empresa') : 'Gestión de Empresas'}
          subtitle={view === 'form' ? 'Completa los datos de la empresa administradora de buses' : 'Administra las empresas afiliadas al sistema de transporte'}
          showBack={view === 'form'}
          onBack={handleCancel}
          action={view === 'list' && (
            <Button
              onClick={handleCreate}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Nueva Empresa
            </Button>
          )}
        />

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {view === 'list' ? (
            <>
              {/* Buscador */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <Input
                  placeholder="Buscar por nombre o NIT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                  leftIcon={
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {filteredCompanies.length} empresa{filteredCompanies.length !== 1 ? 's' : ''} encontrada{filteredCompanies.length !== 1 ? 's' : ''}
                </span>
              </div>

              {loading ? (
                <LoadingSpinner text="Cargando empresas..." />
              ) : filteredCompanies.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No se encontraron empresas para el término de búsqueda.' : 'No hay empresas registradas en el sistema.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Empresa</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">NIT</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Teléfono</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Email</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Dirección</th>
                        <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-32">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredCompanies.map((company) => (
                        <tr key={company.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs shrink-0">
                                {company.name?.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{company.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-mono">{company.nit}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{company.phone || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{company.email || '—'}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 truncate max-w-xs">{company.address || '—'}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/admin/companies/operations?companyId=${company.id}`)
                                }
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 px-2 py-1 rounded border border-emerald-600/30"
                                title="Asignar buses, conductores y ver turnos"
                              >
                                Operar
                              </button>
                              <button 
                                onClick={() => handleEdit(company)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Editar"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => company.id && handleDelete(company.id, company.name)}
                                className="p-1.5 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Eliminar"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                {companyToEdit ? `Editando: ${companyToEdit.name}` : 'Registrar nueva empresa'}
              </h2>

              {formError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Nombre de la Empresa"
                  placeholder="Ej: Transportes Inteligentes S.A.S."
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <Input
                  label="NIT / Identificación"
                  placeholder="Ej: 900.123.456-7"
                  required
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                />
                <Input
                  label="Teléfono de Contacto"
                  placeholder="Ej: +57 300 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Input
                  label="Correo Electrónico"
                  type="email"
                  placeholder="Ej: contacto@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <div className="md:col-span-2">
                  <Input
                    label="Dirección Principal"
                    placeholder="Ej: Calle 100 # 15 - 20, Oficina 401"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" isLoading={saving}>
                    {companyToEdit ? 'Actualizar Empresa' : 'Registrar Empresa'}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;
