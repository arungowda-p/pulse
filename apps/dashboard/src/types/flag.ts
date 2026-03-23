export interface Project {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
  allowedOrigins?: string[];
}

export interface ProjectWithCounts extends Project {
  _count: { flags: number; environments: number };
}

export interface Environment {
  id: string;
  name: string;
  slug: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  environmentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Flag {
  id: string;
  key: string;
  name: string;
  description: string;
  on: boolean;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Override {
  clientId: string;
  on: boolean;
}

export interface EnvOverride {
  environmentId: string;
  on: boolean;
}

export interface FlagWithOverrides extends Flag {
  overrides: Override[];
  envOverrides: EnvOverride[];
}

export type Role = 'ADMIN' | 'PROJECT_ADMIN' | 'CLIENT_ADMIN';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export interface UserRecord extends AuthUser {
  createdAt: string;
  updatedAt: string;
}
