import React from 'react';
import DashboardLayout from '../shared/DashboardLayout';
import ClientForm from '../../components/crm/ClientForm';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../ui/button';

const ClientEdit = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <Button
            onClick={() => navigate(`/receptionist/clients/${clientId}`)}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
        </div>
        <ClientForm mode="edit" />
      </div>
    </DashboardLayout>
  );
};

export default ClientEdit;
