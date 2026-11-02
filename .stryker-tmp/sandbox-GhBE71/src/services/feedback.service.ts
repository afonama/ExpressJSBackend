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
import { conflict, forbidden, notFound } from '../errors.js';
import type { AuthUser } from '../types/index.js';
import type { createFeedbackSchema } from '../schemas/feedback.schemas.js';
import type { z } from 'zod';
type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
type FeedbackAccess = Pick<AuthUser, 'id' | 'role'>;
export async function createFeedback(input: CreateFeedbackInput, user: FeedbackAccess) {
  if (stryMutAct_9fa48("286")) {
    {}
  } else {
    stryCov_9fa48("286");
    const order = await prisma.order.findUnique(stryMutAct_9fa48("287") ? {} : (stryCov_9fa48("287"), {
      where: stryMutAct_9fa48("288") ? {} : (stryCov_9fa48("288"), {
        id: input.orderId
      }),
      select: stryMutAct_9fa48("289") ? {} : (stryCov_9fa48("289"), {
        id: stryMutAct_9fa48("290") ? false : (stryCov_9fa48("290"), true),
        customerId: stryMutAct_9fa48("291") ? false : (stryCov_9fa48("291"), true)
      })
    }));
    if (stryMutAct_9fa48("294") ? false : stryMutAct_9fa48("293") ? true : stryMutAct_9fa48("292") ? order : (stryCov_9fa48("292", "293", "294"), !order)) throw notFound(stryMutAct_9fa48("295") ? "" : (stryCov_9fa48("295"), 'Order not found'));
    if (stryMutAct_9fa48("298") ? user.role === 'customer' || order.customerId !== user.id : stryMutAct_9fa48("297") ? false : stryMutAct_9fa48("296") ? true : (stryCov_9fa48("296", "297", "298"), (stryMutAct_9fa48("300") ? user.role !== 'customer' : stryMutAct_9fa48("299") ? true : (stryCov_9fa48("299", "300"), user.role === (stryMutAct_9fa48("301") ? "" : (stryCov_9fa48("301"), 'customer')))) && (stryMutAct_9fa48("303") ? order.customerId === user.id : stryMutAct_9fa48("302") ? true : (stryCov_9fa48("302", "303"), order.customerId !== user.id)))) {
      if (stryMutAct_9fa48("304")) {
        {}
      } else {
        stryCov_9fa48("304");
        throw forbidden(stryMutAct_9fa48("305") ? "" : (stryCov_9fa48("305"), 'You can only submit feedback for your own orders'));
      }
    }
    try {
      if (stryMutAct_9fa48("306")) {
        {}
      } else {
        stryCov_9fa48("306");
        return await prisma.feedback.create(stryMutAct_9fa48("307") ? {} : (stryCov_9fa48("307"), {
          data: stryMutAct_9fa48("308") ? {} : (stryCov_9fa48("308"), {
            orderId: input.orderId,
            rating: input.rating,
            comment: input.comment
          })
        }));
      }
    } catch (err) {
      if (stryMutAct_9fa48("309")) {
        {}
      } else {
        stryCov_9fa48("309");
        if (stryMutAct_9fa48("311") ? false : stryMutAct_9fa48("310") ? true : (stryCov_9fa48("310", "311"), err instanceof Prisma.PrismaClientKnownRequestError)) {
          if (stryMutAct_9fa48("312")) {
            {}
          } else {
            stryCov_9fa48("312");
            if (stryMutAct_9fa48("315") ? err.code !== 'P2002' : stryMutAct_9fa48("314") ? false : stryMutAct_9fa48("313") ? true : (stryCov_9fa48("313", "314", "315"), err.code === (stryMutAct_9fa48("316") ? "" : (stryCov_9fa48("316"), 'P2002')))) throw conflict(stryMutAct_9fa48("317") ? "" : (stryCov_9fa48("317"), 'Feedback already exists for this order'));
            if (stryMutAct_9fa48("320") ? err.code !== 'P2003' : stryMutAct_9fa48("319") ? false : stryMutAct_9fa48("318") ? true : (stryCov_9fa48("318", "319", "320"), err.code === (stryMutAct_9fa48("321") ? "" : (stryCov_9fa48("321"), 'P2003')))) throw notFound(stryMutAct_9fa48("322") ? "" : (stryCov_9fa48("322"), 'Order not found'));
          }
        }
        throw err;
      }
    }
  }
}
export async function listFeedback() {
  if (stryMutAct_9fa48("323")) {
    {}
  } else {
    stryCov_9fa48("323");
    return prisma.feedback.findMany(stryMutAct_9fa48("324") ? {} : (stryCov_9fa48("324"), {
      include: stryMutAct_9fa48("325") ? {} : (stryCov_9fa48("325"), {
        order: stryMutAct_9fa48("326") ? {} : (stryCov_9fa48("326"), {
          include: stryMutAct_9fa48("327") ? {} : (stryCov_9fa48("327"), {
            table: stryMutAct_9fa48("328") ? false : (stryCov_9fa48("328"), true)
          })
        })
      }),
      orderBy: stryMutAct_9fa48("329") ? {} : (stryCov_9fa48("329"), {
        createdAt: stryMutAct_9fa48("330") ? "" : (stryCov_9fa48("330"), 'desc')
      })
    }));
  }
}