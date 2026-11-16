import type { UserRole } from '@/types/auth';

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

export function getRoleLabel(role: UserRole): string {
  return roleLabels[role];
}
