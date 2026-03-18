import { prisma } from './prisma';
import type { Client } from '../types/flag';

function serialize(row: {
  id: string;
  name: string;
  environmentId: string;
  createdAt: Date;
  updatedAt: Date;
}): Client {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getClients(environmentId: string): Promise<Client[]> {
  const rows = await prisma.client.findMany({
    where: { environmentId },
    orderBy: { name: 'asc' },
  });
  return rows.map(serialize);
}

export async function createClient(
  environmentId: string,
  data: { name: string },
): Promise<Client | { error: string; status: number }> {
  const name = (data.name || '').trim();
  if (!name) return { error: 'Client name is required', status: 400 };

  const env = await prisma.environment.findUnique({
    where: { id: environmentId },
    select: { id: true },
  });
  if (!env) return { error: 'Environment not found', status: 404 };

  const existing = await prisma.client.findUnique({
    where: { environmentId_name: { environmentId, name } },
  });
  if (existing)
    return {
      error: 'Client name already exists in this environment',
      status: 409,
    };

  const row = await prisma.client.create({
    data: { name, environmentId },
  });
  return serialize(row);
}

export async function updateClient(
  clientId: string,
  data: { name?: string },
): Promise<Client | null> {
  try {
    const row = await prisma.client.update({
      where: { id: clientId },
      data: {
        ...(typeof data.name === 'string' && { name: data.name }),
      },
    });
    return serialize(row);
  } catch {
    return null;
  }
}

export async function deleteClient(clientId: string): Promise<boolean> {
  try {
    await prisma.client.delete({ where: { id: clientId } });
    return true;
  } catch {
    return false;
  }
}
