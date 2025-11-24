export const LIFE_AREAS = {
  faith: {
    name: 'Faith',
    color: '#8B5CF6',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-500',
  },
  finance: {
    name: 'Finance',
    color: '#10B981',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-500',
  },
  fitness: {
    name: 'Fitness',
    color: '#F59E0B',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    textColor: 'text-orange-500',
  },
  family: {
    name: 'Family',
    color: '#EC4899',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    textColor: 'text-pink-500',
  },
  fortress: {
    name: 'Fortress',
    color: '#6366F1',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    textColor: 'text-indigo-500',
  },
  fulfillment: {
    name: 'Fulfillment',
    color: '#14B8A6',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    textColor: 'text-teal-500',
  },
  frivolous: {
    name: 'Frivolous',
    color: '#EAB308',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-500',
  },
  uncategorized: {
    name: 'Uncategorized',
    color: '#6B7280',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-500',
  },
} as const;

export const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

export const formatTimeSlot = (time: string | null): string => {
  if (!time) return '';
  const hour = parseInt(time.split(':')[0]);
  if (hour === 12) return '12 PM';
  if (hour > 12) return `${hour - 12} PM`;
  if (hour === 0) return '12 AM';
  return `${hour} AM`;
};

export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};
