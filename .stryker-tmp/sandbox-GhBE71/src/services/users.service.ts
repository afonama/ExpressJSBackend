// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { conflict, notFound } from '../errors.js';
import type { createStaffUserSchema } from '../schemas/users.schemas.js';
import type { z } from 'zod';
type CreateStaffUserInput = z.infer<typeof createStaffUserSchema>;
const BCRYPT_ROUNDS = 10;
function publicUser<T extends {
  hashedPassword: string;
}>(user: T): Omit<T, 'hashedPassword'> {
  if (stryMutAct_9fa48("679")) {
    {}
  } else {
    stryCov_9fa48("679");
    const {
      hashedPassword: _hashedPassword,
      ...safeUser
    } = user;
    return safeUser;
  }
}
export async function createStaffUser(input: CreateStaffUserInput) {
  if (stryMutAct_9fa48("680")) {
    {}
  } else {
    stryCov_9fa48("680");
    const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    try {
      if (stryMutAct_9fa48("681")) {
        {}
      } else {
        stryCov_9fa48("681");
        const user = await prisma.user.create(stryMutAct_9fa48("682") ? {} : (stryCov_9fa48("682"), {
          data: stryMutAct_9fa48("683") ? {} : (stryCov_9fa48("683"), {
            email: input.email,
            hashedPassword,
            name: input.name,
            role: input.role
          })
        }));
        return publicUser(user);
      }
    } catch (err) {
      if (stryMutAct_9fa48("684")) {
        {}
      } else {
        stryCov_9fa48("684");
        if (stryMutAct_9fa48("687") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2002' : stryMutAct_9fa48("686") ? false : stryMutAct_9fa48("685") ? true : (stryCov_9fa48("685", "686", "687"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("689") ? err.code !== 'P2002' : stryMutAct_9fa48("688") ? true : (stryCov_9fa48("688", "689"), err.code === (stryMutAct_9fa48("690") ? "" : (stryCov_9fa48("690"), 'P2002')))))) {
          if (stryMutAct_9fa48("691")) {
            {}
          } else {
            stryCov_9fa48("691");
            throw conflict(stryMutAct_9fa48("692") ? "" : (stryCov_9fa48("692"), 'An account with this email already exists'));
          }
        }
        throw err;
      }
    }
  }
}
export async function listStaffUsers() {
  if (stryMutAct_9fa48("693")) {
    {}
  } else {
    stryCov_9fa48("693");
    const users = await prisma.user.findMany(stryMutAct_9fa48("694") ? {} : (stryCov_9fa48("694"), {
      where: stryMutAct_9fa48("695") ? {} : (stryCov_9fa48("695"), {
        role: stryMutAct_9fa48("696") ? {} : (stryCov_9fa48("696"), {
          in: stryMutAct_9fa48("697") ? [] : (stryCov_9fa48("697"), [stryMutAct_9fa48("698") ? "" : (stryCov_9fa48("698"), 'admin'), stryMutAct_9fa48("699") ? "" : (stryCov_9fa48("699"), 'waiter')])
        })
      }),
      orderBy: stryMutAct_9fa48("700") ? {} : (stryCov_9fa48("700"), {
        createdAt: stryMutAct_9fa48("701") ? "" : (stryCov_9fa48("701"), 'asc')
      })
    }));
    return users.map(publicUser);
  }
}
export async function deactivateUser(id: string) {
  if (stryMutAct_9fa48("702")) {
    {}
  } else {
    stryCov_9fa48("702");
    return setUserActive(id, stryMutAct_9fa48("703") ? true : (stryCov_9fa48("703"), false));
  }
}
export async function activateUser(id: string) {
  if (stryMutAct_9fa48("704")) {
    {}
  } else {
    stryCov_9fa48("704");
    return setUserActive(id, stryMutAct_9fa48("705") ? false : (stryCov_9fa48("705"), true));
  }
}
async function setUserActive(id: string, isActive: boolean) {
  if (stryMutAct_9fa48("706")) {
    {}
  } else {
    stryCov_9fa48("706");
    try {
      if (stryMutAct_9fa48("707")) {
        {}
      } else {
        stryCov_9fa48("707");
        const user = await prisma.user.update(stryMutAct_9fa48("708") ? {} : (stryCov_9fa48("708"), {
          where: stryMutAct_9fa48("709") ? {} : (stryCov_9fa48("709"), {
            id
          }),
          data: stryMutAct_9fa48("710") ? {} : (stryCov_9fa48("710"), {
            isActive
          })
        }));
        return publicUser(user);
      }
    } catch (err) {
      if (stryMutAct_9fa48("711")) {
        {}
      } else {
        stryCov_9fa48("711");
        if (stryMutAct_9fa48("714") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2025' : stryMutAct_9fa48("713") ? false : stryMutAct_9fa48("712") ? true : (stryCov_9fa48("712", "713", "714"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("716") ? err.code !== 'P2025' : stryMutAct_9fa48("715") ? true : (stryCov_9fa48("715", "716"), err.code === (stryMutAct_9fa48("717") ? "" : (stryCov_9fa48("717"), 'P2025')))))) {
          if (stryMutAct_9fa48("718")) {
            {}
          } else {
            stryCov_9fa48("718");
            throw notFound(stryMutAct_9fa48("719") ? "" : (stryCov_9fa48("719"), 'User not found'));
          }
        }
        throw err;
      }
    }
  }
}