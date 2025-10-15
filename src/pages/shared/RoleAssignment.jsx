import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';
import { ROLES, getRoleDisplayName, getAllRoles } from '../../utils/roles';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

const RoleAssignment = ({ userId, userRoles = [], onUpdate }) => {
  const { userData } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState(userRoles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleToggle = (role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      await userService.assignMultipleRoles(userId, selectedRoles, userData.role);
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Assign Roles</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      <div className="space-y-3">
        {getAllRoles().map(role => (
          <label key={role} className="flex items-center">
            <input
              type="checkbox"
              checked={selectedRoles.includes(role)}
              onChange={() => handleRoleToggle(role)}
              className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
            />
            <span className="ml-3 text-sm text-gray-700">
              {getRoleDisplayName(role)}
            </span>
          </label>
        ))}
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => setSelectedRoles(userRoles)}
        >
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading || selectedRoles.length === 0}
        >
          {loading ? 'Saving...' : 'Save Roles'}
        </Button>
      </div>
    </Card>
  );
};

export default RoleAssignment;

