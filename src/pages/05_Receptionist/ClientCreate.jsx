import React from 'react';
import DashboardLayout from '../shared/DashboardLayout';
import ClientForm from '../../components/crm/ClientForm';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';

const ClientCreate = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/receptionist/clients')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
        </div>
        <ClientForm mode="create" />
      </div>
    </DashboardLayout>
  );
};

export default ClientCreate;
