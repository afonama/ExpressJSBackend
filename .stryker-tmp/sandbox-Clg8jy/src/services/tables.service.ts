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
import { randomUUID } from 'crypto';
import { Prisma, type TableStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { conflict, notFound } from '../errors.js';
export async function createTable(data: {
  number: number;
  capacity: number;
}) {
  if (stryMutAct_9fa48("608")) {
    {}
  } else {
    stryCov_9fa48("608");
    try {
      if (stryMutAct_9fa48("609")) {
        {}
      } else {
        stryCov_9fa48("609");
        return await prisma.table.create(stryMutAct_9fa48("610") ? {} : (stryCov_9fa48("610"), {
          data: stryMutAct_9fa48("611") ? {} : (stryCov_9fa48("611"), {
            number: data.number,
            capacity: data.capacity,
            qrCode: randomUUID()
          })
        }));
      }
    } catch (err) {
      if (stryMutAct_9fa48("612")) {
        {}
      } else {
        stryCov_9fa48("612");
        if (stryMutAct_9fa48("615") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2002' : stryMutAct_9fa48("614") ? false : stryMutAct_9fa48("613") ? true : (stryCov_9fa48("613", "614", "615"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("617") ? err.code !== 'P2002' : stryMutAct_9fa48("616") ? true : (stryCov_9fa48("616", "617"), err.code === (stryMutAct_9fa48("618") ? "" : (stryCov_9fa48("618"), 'P2002')))))) {
          if (stryMutAct_9fa48("619")) {
            {}
          } else {
            stryCov_9fa48("619");
            throw conflict(stryMutAct_9fa48("620") ? "" : (stryCov_9fa48("620"), 'Table number already exists'));
          }
        }
        throw err;
      }
    }
  }
}
export async function listTables() {
  if (stryMutAct_9fa48("621")) {
    {}
  } else {
    stryCov_9fa48("621");
    return prisma.table.findMany(stryMutAct_9fa48("622") ? {} : (stryCov_9fa48("622"), {
      orderBy: stryMutAct_9fa48("623") ? {} : (stryCov_9fa48("623"), {
        number: stryMutAct_9fa48("624") ? "" : (stryCov_9fa48("624"), 'asc')
      })
    }));
  }
}
export async function getTableByQrCode(qrCode: string) {
  if (stryMutAct_9fa48("625")) {
    {}
  } else {
    stryCov_9fa48("625");
    const table = await prisma.table.findUnique(stryMutAct_9fa48("626") ? {} : (stryCov_9fa48("626"), {
      where: stryMutAct_9fa48("627") ? {} : (stryCov_9fa48("627"), {
        qrCode
      })
    }));
    if (stryMutAct_9fa48("630") ? false : stryMutAct_9fa48("629") ? true : stryMutAct_9fa48("628") ? table : (stryCov_9fa48("628", "629", "630"), !table)) throw notFound(stryMutAct_9fa48("631") ? "" : (stryCov_9fa48("631"), 'Table not found'));
    return table;
  }
}
export async function updateTable(id: string, data: {
  capacity?: number;
  status?: TableStatus;
  expectedStatus?: TableStatus;
}) {
  if (stryMutAct_9fa48("632")) {
    {}
  } else {
    stryCov_9fa48("632");
    if (stryMutAct_9fa48("635") ? data.status === undefined : stryMutAct_9fa48("634") ? false : stryMutAct_9fa48("633") ? true : (stryCov_9fa48("633", "634", "635"), data.status !== undefined)) {
      if (stryMutAct_9fa48("636")) {
        {}
      } else {
        stryCov_9fa48("636");
        const {
          expectedStatus,
          ...updates
        } = data;
        const result = await prisma.table.updateMany(stryMutAct_9fa48("637") ? {} : (stryCov_9fa48("637"), {
          where: stryMutAct_9fa48("638") ? {} : (stryCov_9fa48("638"), {
            id,
            status: expectedStatus
          }),
          data: updates
        }));
        if (stryMutAct_9fa48("641") ? result.count !== 0 : stryMutAct_9fa48("640") ? false : stryMutAct_9fa48("639") ? true : (stryCov_9fa48("639", "640", "641"), result.count === 0)) {
          if (stryMutAct_9fa48("642")) {
            {}
          } else {
            stryCov_9fa48("642");
            const table = await prisma.table.findUnique(stryMutAct_9fa48("643") ? {} : (stryCov_9fa48("643"), {
              where: stryMutAct_9fa48("644") ? {} : (stryCov_9fa48("644"), {
                id
              }),
              select: stryMutAct_9fa48("645") ? {} : (stryCov_9fa48("645"), {
                id: stryMutAct_9fa48("646") ? false : (stryCov_9fa48("646"), true)
              })
            }));
            if (stryMutAct_9fa48("649") ? false : stryMutAct_9fa48("648") ? true : stryMutAct_9fa48("647") ? table : (stryCov_9fa48("647", "648", "649"), !table)) throw notFound(stryMutAct_9fa48("650") ? "" : (stryCov_9fa48("650"), 'Table not found'));
            throw conflict(stryMutAct_9fa48("651") ? "" : (stryCov_9fa48("651"), 'Table status changed; reload the table before retrying'));
          }
        }
        return prisma.table.findUniqueOrThrow(stryMutAct_9fa48("652") ? {} : (stryCov_9fa48("652"), {
          where: stryMutAct_9fa48("653") ? {} : (stryCov_9fa48("653"), {
            id
          })
        }));
      }
    }
    const {
      expectedStatus: _expectedStatus,
      ...updates
    } = data;
    try {
      if (stryMutAct_9fa48("654")) {
        {}
      } else {
        stryCov_9fa48("654");
        return await prisma.table.update(stryMutAct_9fa48("655") ? {} : (stryCov_9fa48("655"), {
          where: stryMutAct_9fa48("656") ? {} : (stryCov_9fa48("656"), {
            id
          }),
          data: updates
        }));
      }
    } catch (err) {
      if (stryMutAct_9fa48("657")) {
        {}
      } else {
        stryCov_9fa48("657");
        if (stryMutAct_9fa48("660") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2025' : stryMutAct_9fa48("659") ? false : stryMutAct_9fa48("658") ? true : (stryCov_9fa48("658", "659", "660"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("662") ? err.code !== 'P2025' : stryMutAct_9fa48("661") ? true : (stryCov_9fa48("661", "662"), err.code === (stryMutAct_9fa48("663") ? "" : (stryCov_9fa48("663"), 'P2025')))))) {
          if (stryMutAct_9fa48("664")) {
            {}
          } else {
            stryCov_9fa48("664");
            throw notFound(stryMutAct_9fa48("665") ? "" : (stryCov_9fa48("665"), 'Table not found'));
          }
        }
        throw err;
      }
    }
  }
}
export async function deleteTable(id: string): Promise<void> {
  if (stryMutAct_9fa48("666")) {
    {}
  } else {
    stryCov_9fa48("666");
    try {
      if (stryMutAct_9fa48("667")) {
        {}
      } else {
        stryCov_9fa48("667");
        await prisma.table.delete(stryMutAct_9fa48("668") ? {} : (stryCov_9fa48("668"), {
          where: stryMutAct_9fa48("669") ? {} : (stryCov_9fa48("669"), {
            id
          })
        }));
      }
    } catch (err) {
      if (stryMutAct_9fa48("670")) {
        {}
      } else {
        stryCov_9fa48("670");
        if (stryMutAct_9fa48("673") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2025' : stryMutAct_9fa48("672") ? false : stryMutAct_9fa48("671") ? true : (stryCov_9fa48("671", "672", "673"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("675") ? err.code !== 'P2025' : stryMutAct_9fa48("674") ? true : (stryCov_9fa48("674", "675"), err.code === (stryMutAct_9fa48("676") ? "" : (stryCov_9fa48("676"), 'P2025')))))) {
          if (stryMutAct_9fa48("677")) {
            {}
          } else {
            stryCov_9fa48("677");
            throw notFound(stryMutAct_9fa48("678") ? "" : (stryCov_9fa48("678"), 'Table not found'));
          }
        }
        throw err;
      }
    }
  }
}