import { 
  checkTimeSlotConflict,
  getAvailableTimeSlots,
  isStylistAvailable,
  getStylistAvailableSlots,
  validateAppointmentBooking 
} from '../appointmentConflicts';

describe('Appointment Conflicts', () => {
  const mockOperatingHours = {
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '09:00', close: '17:00', isOpen: true },
    sunday: { open: '10:00', close: '16:00', isOpen: false }
  };

  const mockExistingAppointments = [
    {
      id: 'apt1',
      branchId: 'branch1',
      appointmentDate: '2024-01-01',
      appointmentTime: '10:00',
      status: 'confirmed',
      serviceStylistPairs: [{ stylistId: 'stylist1', stylistName: 'John' }]
    },
    {
      id: 'apt2',
      branchId: 'branch1',
      appointmentDate: '2024-01-01',
      appointmentTime: '11:00',
      status: 'scheduled',
      serviceStylistPairs: [{ stylistId: 'stylist2', stylistName: 'Jane' }]
    },
    {
      id: 'apt3',
      branchId: 'branch1',
      appointmentDate: '2024-01-01',
      appointmentTime: '12:00',
      status: 'cancelled', // Should not conflict
      serviceStylistPairs: [{ stylistId: 'stylist1', stylistName: 'John' }]
    }
  ];

  describe('checkTimeSlotConflict', () => {
    test('should detect conflict for same time slot', () => {
      const conflict = checkTimeSlotConflict(
        mockExistingAppointments,
        'branch1',
        '2024-01-01',
        '10:00'
      );
      
      expect(conflict.hasConflict).toBe(true);
      expect(conflict.conflicts).toHaveLength(1);
      expect(conflict.conflicts[0].id).toBe('apt1');
    });

    test('should not detect conflict for different time slot', () => {
      const conflict = checkTimeSlotConflict(
        mockExistingAppointments,
        'branch1',
        '2024-01-01',
        '09:00'
      );
      
      expect(conflict.hasConflict).toBe(false);
      expect(conflict.conflicts).toHaveLength(0);
    });

    test('should not detect conflict for cancelled appointments', () => {
      const conflict = checkTimeSlotConflict(
        mockExistingAppointments,
        'branch1',
        '2024-01-01',
        '12:00'
      );
      
      expect(conflict.hasConflict).toBe(false);
    });

    test('should exclude specified appointment from conflict check', () => {
      const conflict = checkTimeSlotConflict(
        mockExistingAppointments,
        'branch1',
        '2024-01-01',
        '10:00',
        null,
        'apt1' // Exclude apt1
      );
      
      expect(conflict.hasConflict).toBe(false);
    });

    test('should detect stylist-specific conflicts', () => {
      const conflict = checkTimeSlotConflict(
        mockExistingAppointments,
        'branch1',
        '2024-01-01',
        '10:00',
        'stylist1' // Same stylist as apt1
      );
      
      expect(conflict.hasConflict).toBe(true);
    });

    test('should not detect conflict for different stylist', () => {
      const conflict = checkTimeSlotConflict(
        mockExistingAppointments,
        'branch1',
        '2024-01-01',
        '10:00',
        'stylist3' // Different stylist
      );
      
      expect(conflict.hasConflict).toBe(false);
    });
  });

  describe('getAvailableTimeSlots', () => {
    test('should return available time slots excluding booked ones', () => {
      const slots = getAvailableTimeSlots(
        mockExistingAppointments,
        mockOperatingHours,
        'branch1',
        '2024-01-01'
      );
      
      expect(slots).not.toContain('10:00'); // Booked
      expect(slots).not.toContain('11:00'); // Booked
      expect(slots).toContain('09:00'); // Available
      expect(slots).toContain('12:00'); // Available (cancelled appointment)
    });

    test('should return empty array for closed days', () => {
      const slots = getAvailableTimeSlots(
        mockExistingAppointments,
        mockOperatingHours,
        'branch1',
        '2024-01-07' // Sunday
      );
      
      expect(slots).toEqual([]);
    });
  });

  describe('isStylistAvailable', () => {
    test('should return false for booked stylist', () => {
      const available = isStylistAvailable(
        mockExistingAppointments,
        'stylist1',
        '2024-01-01',
        '10:00'
      );
      
      expect(available).toBe(false);
    });

    test('should return true for available stylist', () => {
      const available = isStylistAvailable(
        mockExistingAppointments,
        'stylist1',
        '2024-01-01',
        '09:00'
      );
      
      expect(available).toBe(true);
    });
  });

  describe('getStylistAvailableSlots', () => {
    test('should return available slots for specific stylist', () => {
      const slots = getStylistAvailableSlots(
        mockExistingAppointments,
        'stylist1',
        '2024-01-01',
        mockOperatingHours
      );
      
      expect(slots).not.toContain('10:00'); // Booked by stylist1
      expect(slots).toContain('09:00'); // Available
      expect(slots).toContain('11:00'); // Available (different stylist)
    });
  });

  describe('validateAppointmentBooking', () => {
    test('should validate successful booking', () => {
      const appointmentData = {
        branchId: 'branch1',
        appointmentDate: '2024-01-01',
        appointmentTime: '09:00',
        serviceStylistPairs: [{ stylistId: 'stylist1' }]
      };
      
      const result = validateAppointmentBooking(appointmentData, mockExistingAppointments);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect time slot conflicts', () => {
      const appointmentData = {
        branchId: 'branch1',
        appointmentDate: '2024-01-01',
        appointmentTime: '10:00',
        serviceStylistPairs: [{ stylistId: 'stylist1' }]
      };
      
      const result = validateAppointmentBooking(appointmentData, mockExistingAppointments);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Time slot 10:00 is already booked');
    });

    test('should detect stylist conflicts', () => {
      const appointmentData = {
        branchId: 'branch1',
        appointmentDate: '2024-01-01',
        appointmentTime: '10:00',
        serviceStylistPairs: [{ stylistId: 'stylist1', stylistName: 'John' }]
      };
      
      const result = validateAppointmentBooking(appointmentData, mockExistingAppointments);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Stylist John is not available'))).toBe(true);
    });
  });
});
