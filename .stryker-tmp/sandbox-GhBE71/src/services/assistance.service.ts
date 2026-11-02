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
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound } from '../errors.js';
import type { createAssistanceSchema } from '../schemas/assistance.schemas.js';
import type { z } from 'zod';
type CreateAssistanceInput = z.infer<typeof createAssistanceSchema>;
export async function createAssistanceRequest(input: CreateAssistanceInput) {
  if (stryMutAct_9fa48("45")) {
    {}
  } else {
    stryCov_9fa48("45");
    const table = await prisma.table.findUnique(stryMutAct_9fa48("46") ? {} : (stryCov_9fa48("46"), {
      where: stryMutAct_9fa48("47") ? {} : (stryCov_9fa48("47"), {
        id: input.tableId
      })
    }));
    if (stryMutAct_9fa48("50") ? false : stryMutAct_9fa48("49") ? true : stryMutAct_9fa48("48") ? table : (stryCov_9fa48("48", "49", "50"), !table)) throw notFound(stryMutAct_9fa48("51") ? "" : (stryCov_9fa48("51"), 'Table not found'));
    return prisma.assistanceRequest.create(stryMutAct_9fa48("52") ? {} : (stryCov_9fa48("52"), {
      data: stryMutAct_9fa48("53") ? {} : (stryCov_9fa48("53"), {
        tableId: input.tableId,
        type: input.type,
        status: stryMutAct_9fa48("54") ? "" : (stryCov_9fa48("54"), 'pending')
      })
    }));
  }
}
export async function listAssistanceRequests(pendingOnly: boolean | undefined) {
  if (stryMutAct_9fa48("55")) {
    {}
  } else {
    stryCov_9fa48("55");
    return prisma.assistanceRequest.findMany(stryMutAct_9fa48("56") ? {} : (stryCov_9fa48("56"), {
      where: (stryMutAct_9fa48("59") ? pendingOnly === false : stryMutAct_9fa48("58") ? false : stryMutAct_9fa48("57") ? true : (stryCov_9fa48("57", "58", "59"), pendingOnly !== (stryMutAct_9fa48("60") ? true : (stryCov_9fa48("60"), false)))) ? stryMutAct_9fa48("61") ? {} : (stryCov_9fa48("61"), {
        status: stryMutAct_9fa48("62") ? "" : (stryCov_9fa48("62"), 'pending')
      }) : {},
      include: stryMutAct_9fa48("63") ? {} : (stryCov_9fa48("63"), {
        table: stryMutAct_9fa48("64") ? false : (stryCov_9fa48("64"), true)
      }),
      orderBy: stryMutAct_9fa48("65") ? {} : (stryCov_9fa48("65"), {
        createdAt: stryMutAct_9fa48("66") ? "" : (stryCov_9fa48("66"), 'desc')
      })
    }));
  }
}
export async function resolveAssistanceRequest(id: string) {
  if (stryMutAct_9fa48("67")) {
    {}
  } else {
    stryCov_9fa48("67");
    try {
      if (stryMutAct_9fa48("68")) {
        {}
      } else {
        stryCov_9fa48("68");
        return await prisma.assistanceRequest.update(stryMutAct_9fa48("69") ? {} : (stryCov_9fa48("69"), {
          where: stryMutAct_9fa48("70") ? {} : (stryCov_9fa48("70"), {
            id
          }),
          data: stryMutAct_9fa48("71") ? {} : (stryCov_9fa48("71"), {
            status: stryMutAct_9fa48("72") ? "" : (stryCov_9fa48("72"), 'resolved'),
            resolvedAt: new Date()
          }),
          include: stryMutAct_9fa48("73") ? {} : (stryCov_9fa48("73"), {
            table: stryMutAct_9fa48("74") ? false : (stryCov_9fa48("74"), true)
          })
        }));
      }
    } catch (err) {
      if (stryMutAct_9fa48("75")) {
        {}
      } else {
        stryCov_9fa48("75");
        if (stryMutAct_9fa48("78") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2025' : stryMutAct_9fa48("77") ? false : stryMutAct_9fa48("76") ? true : (stryCov_9fa48("76", "77", "78"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("80") ? err.code !== 'P2025' : stryMutAct_9fa48("79") ? true : (stryCov_9fa48("79", "80"), err.code === (stryMutAct_9fa48("81") ? "" : (stryCov_9fa48("81"), 'P2025')))))) {
          if (stryMutAct_9fa48("82")) {
            {}
          } else {
            stryCov_9fa48("82");
            throw notFound(stryMutAct_9fa48("83") ? "" : (stryCov_9fa48("83"), 'Assistance request not found'));
          }
        }
        throw err;
      }
    }
  }
}