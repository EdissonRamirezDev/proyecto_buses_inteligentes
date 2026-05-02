import ShiftList from '../../components/admin/ShiftList';
import Button from '../../components/common/Button';
import AdminHeader from '../../components/common/AdminHeader';

const ShiftsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AdminHeader 
          title="Gestión de Programaciones"
          subtitle="Administra los turnos y programaciones de los conductores y buses"
          showBack={false}
          action={
            <Button
              onClick={() => {}}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              Nueva Programación
            </Button>
          }
        />
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          <ShiftList />
        </div>
      </div>
    </div>
  );
};

export default ShiftsPage;
