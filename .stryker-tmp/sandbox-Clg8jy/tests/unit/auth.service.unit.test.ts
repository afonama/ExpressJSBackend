// @ts-nocheck
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';
import { signRefreshToken } from '../../src/lib/jwt.js';
import * as authService from '../../src/services/auth.service.js';
import { logger } from '../../src/lib/logger.js';
import { mockPrisma, resetPrismaMock } from './prisma.mock.js';

const user = {
  id: '00000000-0000-4000-8000-000000000001',
  email: 'customer@example.test',
  name: 'Customer',
  role: 'customer',
  isActive: true,
  hashedPassword: '$2b$04$test-hash',
  createdAt: new Date('2025-01-01T00:00:00Z')
};

describe('auth service unit tests', () => {
  beforeEach(resetPrismaMock);

  it('hashes the password and creates a customer account during signup', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(user);
    const result = await authService.signupCustomer({
      email: user.email,
      password: 'Password123!',
      name: user.name
    });

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: user.email, name: user.name, role: 'customer' })
    });
    const hashedPassword = mockPrisma.user.create.mock.calls[0]?.[0].data.hashedPassword as string;
    expect(hashedPassword).not.toBe('Password123!');
    expect(await bcrypt.compare('Password123!', hashedPassword)).toBe(true);
    expect(result.user).toEqual({ id: user.id, email: user.email, name: user.name, role: 'customer' });
    expect(result.accessToken).toEqual(expect.any(String));
    expect(result.refreshToken).toEqual(expect.any(String));
  });

  it('rejects duplicate signup emails', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(user);
    await expect(
      authService.signupCustomer({ email: user.email, password: 'Password123!', name: user.name })
    ).rejects.toMatchObject({ status: 409 });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
  });

  it('authenticates a valid active user and rejects missing, inactive, and wrong-password users', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(user);
    const hashedPassword = await bcrypt.hash('Password123!', 4);
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, hashedPassword });
    expect((await authService.login({ email: user.email, password: 'Password123!' })).user.id).toBe(user.id);

    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(authService.login({ email: user.email, password: 'Password123!' })).rejects.toMatchObject({ status: 401 });
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, isActive: false, hashedPassword });
    await expect(authService.login({ email: user.email, password: 'Password123!' })).rejects.toMatchObject({ status: 401 });
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, hashedPassword });
    await expect(authService.login({ email: user.email, password: 'incorrect' })).rejects.toMatchObject({ status: 401 });
  });

  it('refreshes valid sessions and rejects invalid tokens or deactivated users', async () => {
    const familyId = '00000000-0000-4000-8000-000000000002';
    const refreshToken = signRefreshToken(user.id, 'customer', familyId);
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<unknown>) =>
      callback(mockPrisma)
    );
    mockPrisma.$queryRaw.mockResolvedValue([{
      tokenHash,
      familyId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      revokedAt: null
    }]);
    mockPrisma.user.findUnique.mockResolvedValue(user);
    const rotated = await authService.refresh(refreshToken);
    expect(rotated.user.id).toBe(user.id);
    expect(rotated.refreshToken).not.toBe(refreshToken);
    await expect(authService.refresh('malformed')).rejects.toMatchObject({ status: 401 });

    mockPrisma.$queryRaw.mockResolvedValue([{
      tokenHash,
      familyId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
      revokedAt: null
    }]);
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, isActive: false });
    await expect(authService.refresh(refreshToken)).rejects.toMatchObject({ status: 403 });
  });

  it('revokes and logs all user sessions when a rotated refresh token is reused', async () => {
    const familyId = '00000000-0000-4000-8000-000000000003';
    const refreshToken = signRefreshToken(user.id, 'customer', familyId);
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    mockPrisma.$transaction.mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<unknown>) =>
      callback(mockPrisma)
    );
    mockPrisma.$queryRaw.mockResolvedValue([{
      tokenHash,
      familyId,
      userId: user.id,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
      revokedAt: null
    }]);
    mockPrisma.refreshToken.updateMany.mockResolvedValue({ count: 2 });
    const securityEvent = jest.spyOn(logger, 'warn').mockImplementation(() => logger);

    await expect(authService.refresh(refreshToken)).rejects.toMatchObject({ status: 401 });
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    });
    expect(securityEvent).toHaveBeenCalledWith(
      { userId: user.id, familyId },
      'Refresh token reuse detected; token family revoked'
    );
    securityEvent.mockRestore();
  });

  it('revokes a session family on logout and safely ignores invalid refresh tokens', async () => {
    const familyId = '00000000-0000-4000-8000-000000000004';
    await authService.logout(signRefreshToken(user.id, 'customer', familyId));
    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { familyId, revokedAt: null },
      data: { revokedAt: expect.any(Date) }
    });
    mockPrisma.refreshToken.updateMany.mockClear();
    await expect(authService.logout('not-a-refresh-token')).resolves.toBeUndefined();
    expect(mockPrisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it('returns only public profile fields and rejects missing or inactive users', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(user);
    expect(await authService.getUserById(user.id)).toEqual({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: true,
      createdAt: user.createdAt
    });
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(authService.getUserById(user.id)).rejects.toMatchObject({ status: 401 });
    mockPrisma.user.findUnique.mockResolvedValue({ ...user, isActive: false });
    await expect(authService.getUserById(user.id)).rejects.toMatchObject({ status: 401 });
  });
});
