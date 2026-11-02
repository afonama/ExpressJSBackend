// @ts-nocheck
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import * as users from '../../src/services/users.service.js';
import { mockPrisma, resetPrismaMock } from './prisma.mock.js';

function prismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('test error', { code, clientVersion: 'test' });
}

const staffInput = { email: 'waiter@example.test', password: 'Password123!', name: 'Waiter', role: 'waiter' as const };

describe('users service unit tests', () => {
  beforeEach(resetPrismaMock);

  it('hashes new staff passwords and omits the hash from returned users', async () => {
    mockPrisma.user.create.mockImplementation(async ({ data }) => ({
      id: 'id', ...data, isActive: true, createdAt: new Date()
    }));
    const result = await users.createStaffUser(staffInput);
    expect(result).not.toHaveProperty('hashedPassword');
    const hash = mockPrisma.user.create.mock.calls[0]?.[0].data.hashedPassword as string;
    expect(await bcrypt.compare(staffInput.password, hash)).toBe(true);
    expect(mockPrisma.user.create.mock.calls[0]?.[0].data.role).toBe('waiter');
  });

  it('maps duplicate email errors and filters/sanitizes listed staff', async () => {
    mockPrisma.user.create.mockRejectedValue(prismaError('P2002'));
    await expect(users.createStaffUser(staffInput)).rejects.toMatchObject({ status: 409 });
    mockPrisma.user.findMany.mockResolvedValue([{ id: 'id', hashedPassword: 'secret', role: 'admin' }]);
    const result = await users.listStaffUsers();
    expect(result).toEqual([{ id: 'id', role: 'admin' }]);
    expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
      where: { role: { in: ['admin', 'waiter'] } },
      orderBy: { createdAt: 'asc' }
    });
  });

  it('activates and deactivates users while translating missing-user errors', async () => {
    mockPrisma.user.update.mockResolvedValue({ id: 'id', hashedPassword: 'secret', isActive: false });
    await expect(users.deactivateUser('id')).resolves.toEqual({ id: 'id', isActive: false });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({ where: { id: 'id' }, data: { isActive: false } });
    mockPrisma.user.update.mockResolvedValue({ id: 'id', hashedPassword: 'secret', isActive: true });
    await expect(users.activateUser('id')).resolves.toEqual({ id: 'id', isActive: true });
    mockPrisma.user.update.mockRejectedValue(prismaError('P2025'));
    await expect(users.activateUser('missing')).rejects.toMatchObject({ status: 404 });
  });
});
