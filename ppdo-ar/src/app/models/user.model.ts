import {Division} from './project.model';

export type UserRole = 'ROLE_SUPERADMIN' | 'ROLE_ADMIN' | 'ROLE_USER' | 'ROLE_EDITOR' | 'ROLE_VIEWER' | 'ROLE_MANAGER';

/** Human-readable role name, e.g. ROLE_SUPERADMIN -> "Super Admin". */
export function roleLabel(role: string | null | undefined): string {
  switch (role) {
    case 'ROLE_SUPERADMIN': return 'Super Admin';
    case 'ROLE_ADMIN': return 'Admin';
    case 'ROLE_USER': return 'User';
    case null:
    case undefined:
    case '': return 'User';
    default: {
      const name = role.replace(/^ROLE_/, '').toLowerCase();
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  }
}

export interface User {
  id: number;
  firstName: string;
  middleName?: string; // Optional
  lastName: string;
  email: string;
  username: string;
  division?: Division;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}
