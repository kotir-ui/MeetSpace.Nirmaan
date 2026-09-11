/**
 * Utility functions for Meeting Room Booking Status Flow & Badges
 *
 * Status Workflow & Color Logic:
 * 1. Pending Approval -> Amber / Yellow (#D97706, bg: #FFFBEB, border: #FCD34D)
 * 2. Confirmed / Booked -> Blue (#2563EB, bg: #EFF6FF, border: #93C5FD)
 * 3. Ongoing -> Orange / Pulsing Amber (#EA580C, bg: #FFF7ED, border: #FDBA74)
 * 4. Completed -> Green (#16A34A, bg: #F0FDF4, border: #86EFAC)
 * 5. Rejected / Cancelled -> Red (#DC2626, bg: #FEF2F2, border: #FCA5A5)
 */

export const computeDynamicStatus = (booking) => {
  if (!booking) return 'unknown';

  const rawStatus = (booking.status || '').toLowerCase().trim();

  // 1. Rejected or Cancelled
  if (['rejected', 'cancelled'].includes(rawStatus)) {
    return rawStatus;
  }

  // 2. Pending Approval
  if (rawStatus.startsWith('pending')) {
    return 'pending';
  }

  // 3. Time-based transitions for Confirmed / Ongoing / Completed
  if (['confirmed', 'approved', 'completed'].includes(rawStatus)) {
    if (booking.meeting_date && booking.start_time && booking.end_time) {
      try {
        const now = new Date();

        // Standardize meeting date to YYYY-MM-DD
        let dateStr = '';
        if (typeof booking.meeting_date === 'string') {
          dateStr = booking.meeting_date.split('T')[0];
        } else if (booking.meeting_date instanceof Date) {
          dateStr = booking.meeting_date.toISOString().split('T')[0];
        }

        const startStr = booking.start_time.length === 5 ? `${booking.start_time}:00` : booking.start_time;
        const endStr = booking.end_time.length === 5 ? `${booking.end_time}:00` : booking.end_time;

        const startDateTime = new Date(`${dateStr}T${startStr}`);
        const endDateTime = new Date(`${dateStr}T${endStr}`);

        if (!isNaN(startDateTime.getTime()) && !isNaN(endDateTime.getTime())) {
          if (now >= endDateTime) {
            return 'completed';
          }
          if (now >= startDateTime && now < endDateTime) {
            return 'ongoing';
          }
          if (now < startDateTime) {
            return 'confirmed';
          }
        }
      } catch (e) {
        console.error('Error computing dynamic status:', e);
      }
    }

    if (rawStatus === 'completed') return 'completed';
    return 'confirmed';
  }

  return rawStatus || 'unknown';
};

export const getStatusConfig = (bookingOrStatus) => {
  let statusKey = '';
  if (typeof bookingOrStatus === 'object' && bookingOrStatus !== null) {
    statusKey = computeDynamicStatus(bookingOrStatus);
  } else {
    statusKey = (bookingOrStatus || '').toLowerCase().trim();
    if (statusKey.startsWith('pending')) statusKey = 'pending';
  }

  switch (statusKey) {
    case 'pending':
    case 'pending_department_head':
    case 'pending_manager':
    case 'pending_hr':
      return {
        key: 'pending',
        label: 'Pending Approval',
        color: '#D97706', // Yellow / Amber
        bgColor: '#FFFBEB',
        borderColor: '#FCD34D',
        chipColor: 'warning',
      };

    case 'confirmed':
    case 'approved':
    case 'booked':
      return {
        key: 'confirmed',
        label: 'Confirmed',
        color: '#2563EB', // Blue
        bgColor: '#EFF6FF',
        borderColor: '#93C5FD',
        chipColor: 'primary',
      };

    case 'ongoing':
      return {
        key: 'ongoing',
        label: 'Ongoing',
        isPulsing: true,
        color: '#EA580C', // Orange / Pulsing Amber
        bgColor: '#FFF7ED',
        borderColor: '#FDBA74',
        chipColor: 'warning',
      };

    case 'completed':
      return {
        key: 'completed',
        label: 'Completed',
        color: '#16A34A', // Green
        bgColor: '#F0FDF4',
        borderColor: '#86EFAC',
        chipColor: 'success',
      };

    case 'rejected':
      return {
        key: 'rejected',
        label: 'Rejected',
        color: '#DC2626', // Red
        bgColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        chipColor: 'error',
      };

    case 'cancelled':
      return {
        key: 'cancelled',
        label: 'Cancelled',
        color: '#DC2626', // Red
        bgColor: '#FEF2F2',
        borderColor: '#FCA5A5',
        chipColor: 'error',
      };

    default:
      return {
        key: statusKey || 'unknown',
        label: statusKey ? statusKey.replace(/_/g, ' ').toUpperCase() : 'Unknown',
        color: '#6B7280',
        bgColor: '#F3F4F6',
        borderColor: '#E5E7EB',
        chipColor: 'default',
      };
  }
};
