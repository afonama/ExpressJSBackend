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
import { createHash, randomUUID } from 'node:crypto';
import { Role, REFRESH_TTL_SECONDS, isRole, signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt.js';
import { prisma } from '../lib/prisma.js';
import { SignupInput, LoginInput } from '../schemas/auth.schemas.js';
import { conflict, forbidden, unauthorized } from '../errors.js';
import { logger } from '../lib/logger.js';
const BCRYPT_ROUNDS = 10;
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
  };
}
function hashToken(token: string): string {
  if (stryMutAct_9fa48("84")) {
    {}
  } else {
    stryCov_9fa48("84");
    return createHash(stryMutAct_9fa48("85") ? "" : (stryCov_9fa48("85"), 'sha256')).update(token).digest(stryMutAct_9fa48("86") ? "" : (stryCov_9fa48("86"), 'hex'));
  }
}
async function issueTokens(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}, familyId = randomUUID()): Promise<TokenPair> {
  if (stryMutAct_9fa48("87")) {
    {}
  } else {
    stryCov_9fa48("87");
    if (stryMutAct_9fa48("90") ? false : stryMutAct_9fa48("89") ? true : stryMutAct_9fa48("88") ? isRole(user.role) : (stryCov_9fa48("88", "89", "90"), !isRole(user.role))) throw new Error(stryMutAct_9fa48("92") ? `` : (stryCov_9fa48("92"), `Invalid role: ${user.role}`));
    const refreshToken = signRefreshToken(user.id, user.role, familyId);
    await prisma.refreshToken.create(stryMutAct_9fa48("93") ? {} : (stryCov_9fa48("93"), {
      data: stryMutAct_9fa48("94") ? {} : (stryCov_9fa48("94"), {
        tokenHash: hashToken(refreshToken),
        familyId,
        userId: user.id,
        expiresAt: new Date(stryMutAct_9fa48("95") ? Date.now() - REFRESH_TTL_SECONDS * 1000 : (stryCov_9fa48("95"), Date.now() + (stryMutAct_9fa48("96") ? REFRESH_TTL_SECONDS / 1000 : (stryCov_9fa48("96"), REFRESH_TTL_SECONDS * 1000))))
      })
    }));
    return stryMutAct_9fa48("97") ? {} : (stryCov_9fa48("97"), {
      accessToken: signAccessToken(user.id, user.role, familyId),
      refreshToken,
      user: stryMutAct_9fa48("98") ? {} : (stryCov_9fa48("98"), {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      })
    });
  }
}
export async function signupCustomer(input: SignupInput): Promise<TokenPair> {
  if (stryMutAct_9fa48("99")) {
    {}
  } else {
    stryCov_9fa48("99");
    const existing = await prisma.user.findUnique(stryMutAct_9fa48("100") ? {} : (stryCov_9fa48("100"), {
      where: stryMutAct_9fa48("101") ? {} : (stryCov_9fa48("101"), {
        email: input.email
      })
    }));
    if (stryMutAct_9fa48("103") ? false : stryMutAct_9fa48("102") ? true : (stryCov_9fa48("102", "103"), existing)) throw conflict(stryMutAct_9fa48("104") ? "" : (stryCov_9fa48("104"), 'An account with this email already exists'));
    const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await prisma.user.create(stryMutAct_9fa48("105") ? {} : (stryCov_9fa48("105"), {
      data: stryMutAct_9fa48("106") ? {} : (stryCov_9fa48("106"), {
        email: input.email,
        hashedPassword,
        name: input.name,
        role: stryMutAct_9fa48("107") ? "" : (stryCov_9fa48("107"), 'customer')
      })
    }));
    return issueTokens(user);
  }
}
export async function login(input: LoginInput): Promise<TokenPair> {
  if (stryMutAct_9fa48("108")) {
    {}
  } else {
    stryCov_9fa48("108");
    const user = await prisma.user.findUnique(stryMutAct_9fa48("109") ? {} : (stryCov_9fa48("109"), {
      where: stryMutAct_9fa48("110") ? {} : (stryCov_9fa48("110"), {
        email: input.email
      })
    }));
    if (stryMutAct_9fa48("113") ? !user && !user.isActive : stryMutAct_9fa48("112") ? false : stryMutAct_9fa48("111") ? true : (stryCov_9fa48("111", "112", "113"), (stryMutAct_9fa48("114") ? user : (stryCov_9fa48("114"), !user)) || (stryMutAct_9fa48("115") ? user.isActive : (stryCov_9fa48("115"), !user.isActive)))) {
      if (stryMutAct_9fa48("116")) {
        {}
      } else {
        stryCov_9fa48("116");
        throw unauthorized(stryMutAct_9fa48("117") ? "" : (stryCov_9fa48("117"), 'Invalid email or password'));
      }
    }
    const match = await bcrypt.compare(input.password, user.hashedPassword);
    if (stryMutAct_9fa48("120") ? false : stryMutAct_9fa48("119") ? true : stryMutAct_9fa48("118") ? match : (stryCov_9fa48("118", "119", "120"), !match)) {
      if (stryMutAct_9fa48("121")) {
        {}
      } else {
        stryCov_9fa48("121");
        throw unauthorized(stryMutAct_9fa48("122") ? "" : (stryCov_9fa48("122"), 'Invalid email or password'));
      }
    }
    return issueTokens(user);
  }
}
export async function refresh(token: string): Promise<TokenPair> {
  if (stryMutAct_9fa48("123")) {
    {}
  } else {
    stryCov_9fa48("123");
    let payload;
    try {
      if (stryMutAct_9fa48("124")) {
        {}
      } else {
        stryCov_9fa48("124");
        payload = verifyRefreshToken(token);
      }
    } catch {
      if (stryMutAct_9fa48("125")) {
        {}
      } else {
        stryCov_9fa48("125");
        throw unauthorized(stryMutAct_9fa48("126") ? "" : (stryCov_9fa48("126"), 'Invalid or expired refresh token'));
      }
    }
    if (stryMutAct_9fa48("129") ? false : stryMutAct_9fa48("128") ? true : stryMutAct_9fa48("127") ? payload.familyId : (stryCov_9fa48("127", "128", "129"), !payload.familyId)) throw unauthorized(stryMutAct_9fa48("130") ? "" : (stryCov_9fa48("130"), 'Invalid or expired refresh token'));
    const tokenHash = hashToken(token);
    const outcome = await prisma.$transaction(async tx => {
      if (stryMutAct_9fa48("131")) {
        {}
      } else {
        stryCov_9fa48("131");
        const records = await (stryMutAct_9fa48("132") ? tx.$queryRaw<Array<{
          tokenHash: string;
          familyId: string;
          userId: string;
          expiresAt: Date;
          usedAt: Date | null;
          revokedAt: Date | null;
        }>>`` : (stryCov_9fa48("132"), tx.$queryRaw<Array<{
          tokenHash: string;
          familyId: string;
          userId: string;
          expiresAt: Date;
          usedAt: Date | null;
          revokedAt: Date | null;
        }>>`
      SELECT token_hash AS "tokenHash", family_id AS "familyId", user_id AS "userId",
             expires_at AS "expiresAt", used_at AS "usedAt", revoked_at AS "revokedAt"
      FROM refresh_tokens
      WHERE token_hash = ${tokenHash}
      FOR UPDATE
    `));
        const storedToken = records[0];
        if (stryMutAct_9fa48("135") ? (!storedToken || storedToken.userId !== payload.sub) && storedToken.familyId !== payload.familyId : stryMutAct_9fa48("134") ? false : stryMutAct_9fa48("133") ? true : (stryCov_9fa48("133", "134", "135"), (stryMutAct_9fa48("137") ? !storedToken && storedToken.userId !== payload.sub : stryMutAct_9fa48("136") ? false : (stryCov_9fa48("136", "137"), (stryMutAct_9fa48("138") ? storedToken : (stryCov_9fa48("138"), !storedToken)) || (stryMutAct_9fa48("140") ? storedToken.userId === payload.sub : stryMutAct_9fa48("139") ? false : (stryCov_9fa48("139", "140"), storedToken.userId !== payload.sub)))) || (stryMutAct_9fa48("142") ? storedToken.familyId === payload.familyId : stryMutAct_9fa48("141") ? false : (stryCov_9fa48("141", "142"), storedToken.familyId !== payload.familyId)))) {
          if (stryMutAct_9fa48("143")) {
            {}
          } else {
            stryCov_9fa48("143");
            return stryMutAct_9fa48("144") ? {} : (stryCov_9fa48("144"), {
              type: 'invalid' as const
            });
          }
        }
        if (stryMutAct_9fa48("147") ? storedToken.usedAt && storedToken.revokedAt : stryMutAct_9fa48("146") ? false : stryMutAct_9fa48("145") ? true : (stryCov_9fa48("145", "146", "147"), storedToken.usedAt || storedToken.revokedAt)) {
          if (stryMutAct_9fa48("148")) {
            {}
          } else {
            stryCov_9fa48("148");
            await tx.refreshToken.updateMany(stryMutAct_9fa48("149") ? {} : (stryCov_9fa48("149"), {
              where: stryMutAct_9fa48("150") ? {} : (stryCov_9fa48("150"), {
                userId: storedToken.userId,
                revokedAt: null
              }),
              data: stryMutAct_9fa48("151") ? {} : (stryCov_9fa48("151"), {
                revokedAt: new Date()
              })
            }));
            return stryMutAct_9fa48("152") ? {} : (stryCov_9fa48("152"), {
              type: 'replay' as const,
              userId: storedToken.userId,
              familyId: storedToken.familyId
            });
          }
        }
        if (stryMutAct_9fa48("156") ? storedToken.expiresAt > new Date() : stryMutAct_9fa48("155") ? storedToken.expiresAt < new Date() : stryMutAct_9fa48("154") ? false : stryMutAct_9fa48("153") ? true : (stryCov_9fa48("153", "154", "155", "156"), storedToken.expiresAt <= new Date())) return stryMutAct_9fa48("157") ? {} : (stryCov_9fa48("157"), {
          type: 'invalid' as const
        });
        const user = await tx.user.findUnique(stryMutAct_9fa48("158") ? {} : (stryCov_9fa48("158"), {
          where: stryMutAct_9fa48("159") ? {} : (stryCov_9fa48("159"), {
            id: storedToken.userId
          })
        }));
        if (stryMutAct_9fa48("162") ? !user && !user.isActive : stryMutAct_9fa48("161") ? false : stryMutAct_9fa48("160") ? true : (stryCov_9fa48("160", "161", "162"), (stryMutAct_9fa48("163") ? user : (stryCov_9fa48("163"), !user)) || (stryMutAct_9fa48("164") ? user.isActive : (stryCov_9fa48("164"), !user.isActive)))) return stryMutAct_9fa48("165") ? {} : (stryCov_9fa48("165"), {
          type: 'inactive' as const
        });
        const replacement = signRefreshToken(user.id, user.role, storedToken.familyId);
        const replacementHash = hashToken(replacement);
        const now = new Date();
        await tx.refreshToken.create(stryMutAct_9fa48("166") ? {} : (stryCov_9fa48("166"), {
          data: stryMutAct_9fa48("167") ? {} : (stryCov_9fa48("167"), {
            tokenHash: replacementHash,
            familyId: storedToken.familyId,
            userId: user.id,
            expiresAt: new Date(stryMutAct_9fa48("168") ? now.getTime() - REFRESH_TTL_SECONDS * 1000 : (stryCov_9fa48("168"), now.getTime() + (stryMutAct_9fa48("169") ? REFRESH_TTL_SECONDS / 1000 : (stryCov_9fa48("169"), REFRESH_TTL_SECONDS * 1000))))
          })
        }));
        await tx.refreshToken.update(stryMutAct_9fa48("170") ? {} : (stryCov_9fa48("170"), {
          where: stryMutAct_9fa48("171") ? {} : (stryCov_9fa48("171"), {
            tokenHash
          }),
          data: stryMutAct_9fa48("172") ? {} : (stryCov_9fa48("172"), {
            usedAt: now,
            replacedByHash: replacementHash
          })
        }));
        return stryMutAct_9fa48("173") ? {} : (stryCov_9fa48("173"), {
          type: 'success' as const,
          tokens: stryMutAct_9fa48("174") ? {} : (stryCov_9fa48("174"), {
            accessToken: signAccessToken(user.id, user.role, storedToken.familyId),
            refreshToken: replacement,
            user: stryMutAct_9fa48("175") ? {} : (stryCov_9fa48("175"), {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            })
          })
        });
      }
    });
    if (stryMutAct_9fa48("178") ? outcome.type !== 'replay' : stryMutAct_9fa48("177") ? false : stryMutAct_9fa48("176") ? true : (stryCov_9fa48("176", "177", "178"), outcome.type === (stryMutAct_9fa48("179") ? "" : (stryCov_9fa48("179"), 'replay')))) {
      if (stryMutAct_9fa48("180")) {
        {}
      } else {
        stryCov_9fa48("180");
        logger.warn(stryMutAct_9fa48("182") ? {} : (stryCov_9fa48("182"), {
          userId: outcome.userId,
          familyId: outcome.familyId
        }), stryMutAct_9fa48("183") ? "" : (stryCov_9fa48("183"), 'Refresh token reuse detected; token family revoked'));
        throw unauthorized(stryMutAct_9fa48("184") ? "" : (stryCov_9fa48("184"), 'Refresh token reuse detected; session revoked'));
      }
    }
    if (stryMutAct_9fa48("187") ? outcome.type !== 'inactive' : stryMutAct_9fa48("186") ? false : stryMutAct_9fa48("185") ? true : (stryCov_9fa48("185", "186", "187"), outcome.type === (stryMutAct_9fa48("188") ? "" : (stryCov_9fa48("188"), 'inactive')))) throw forbidden(stryMutAct_9fa48("189") ? "" : (stryCov_9fa48("189"), 'Account is deactivated'));
    if (stryMutAct_9fa48("192") ? outcome.type !== 'invalid' : stryMutAct_9fa48("191") ? false : stryMutAct_9fa48("190") ? true : (stryCov_9fa48("190", "191", "192"), outcome.type === (stryMutAct_9fa48("193") ? "" : (stryCov_9fa48("193"), 'invalid')))) throw unauthorized(stryMutAct_9fa48("194") ? "" : (stryCov_9fa48("194"), 'Invalid or expired refresh token'));
    return outcome.tokens;
  }
}
export async function logout(token?: string): Promise<void> {
  if (stryMutAct_9fa48("195")) {
    {}
  } else {
    stryCov_9fa48("195");
    if (stryMutAct_9fa48("198") ? false : stryMutAct_9fa48("197") ? true : stryMutAct_9fa48("196") ? token : (stryCov_9fa48("196", "197", "198"), !token)) return;
    let payload;
    try {
      if (stryMutAct_9fa48("199")) {
        {}
      } else {
        stryCov_9fa48("199");
        payload = verifyRefreshToken(token);
      }
    } catch {
      if (stryMutAct_9fa48("200")) {
        {}
      } else {
        stryCov_9fa48("200");
        return;
      }
    }
    if (stryMutAct_9fa48("202") ? false : stryMutAct_9fa48("201") ? true : (stryCov_9fa48("201", "202"), payload.familyId)) {
      if (stryMutAct_9fa48("203")) {
        {}
      } else {
        stryCov_9fa48("203");
        await prisma.refreshToken.updateMany(stryMutAct_9fa48("204") ? {} : (stryCov_9fa48("204"), {
          where: stryMutAct_9fa48("205") ? {} : (stryCov_9fa48("205"), {
            familyId: payload.familyId,
            revokedAt: null
          }),
          data: stryMutAct_9fa48("206") ? {} : (stryCov_9fa48("206"), {
            revokedAt: new Date()
          })
        }));
      }
    }
  }
}
export async function getUserById(id: string) {
  if (stryMutAct_9fa48("207")) {
    {}
  } else {
    stryCov_9fa48("207");
    const user = await prisma.user.findUnique(stryMutAct_9fa48("208") ? {} : (stryCov_9fa48("208"), {
      where: stryMutAct_9fa48("209") ? {} : (stryCov_9fa48("209"), {
        id
      })
    }));
    if (stryMutAct_9fa48("212") ? !user && !user.isActive : stryMutAct_9fa48("211") ? false : stryMutAct_9fa48("210") ? true : (stryCov_9fa48("210", "211", "212"), (stryMutAct_9fa48("213") ? user : (stryCov_9fa48("213"), !user)) || (stryMutAct_9fa48("214") ? user.isActive : (stryCov_9fa48("214"), !user.isActive)))) throw unauthorized(stryMutAct_9fa48("215") ? "" : (stryCov_9fa48("215"), 'Account not found'));
    return stryMutAct_9fa48("216") ? {} : (stryCov_9fa48("216"), {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    });
  }
}