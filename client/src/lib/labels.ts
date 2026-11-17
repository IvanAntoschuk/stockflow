import type { UserRole } from '@/types/auth';
import type { StockMovementType } from '@/types/inventory';

const roleLabels: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  STAFF: 'Staff',
};

const movementLabels: Record<StockMovementType, string> = {
  RECEIPT: 'Stock receipt',
  ISSUE: 'Stock issue',
  ADJUSTMENT: 'Adjustment',
  TRANSFER_IN: 'Transfer in',
  TRANSFER_OUT: 'Transfer out',
};

export function getRoleLabel(role: UserRole): string {
  return roleLabels[role];
}

export function getMovementLabel(type: StockMovementType): string {
  return movementLabels[type];
}
