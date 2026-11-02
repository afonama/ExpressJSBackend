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
import { env } from '../config/env.js';
import { conflict, forbidden, notFound } from '../errors.js';
import type { AuthUser } from '../types/index.js';
type BillAccess = Pick<AuthUser, 'id' | 'role'>;
const billIncludes = (stryMutAct_9fa48("217") ? {} : (stryCov_9fa48("217"), {
  order: stryMutAct_9fa48("218") ? {} : (stryCov_9fa48("218"), {
    include: stryMutAct_9fa48("219") ? {} : (stryCov_9fa48("219"), {
      table: stryMutAct_9fa48("220") ? false : (stryCov_9fa48("220"), true),
      items: stryMutAct_9fa48("221") ? {} : (stryCov_9fa48("221"), {
        include: stryMutAct_9fa48("222") ? {} : (stryCov_9fa48("222"), {
          menuItem: stryMutAct_9fa48("223") ? false : (stryCov_9fa48("223"), true)
        })
      })
    })
  })
})) satisfies Prisma.BillInclude;
export async function createBill(orderId: string) {
  if (stryMutAct_9fa48("224")) {
    {}
  } else {
    stryCov_9fa48("224");
    try {
      if (stryMutAct_9fa48("225")) {
        {}
      } else {
        stryCov_9fa48("225");
        return await prisma.$transaction(async tx => {
          if (stryMutAct_9fa48("226")) {
            {}
          } else {
            stryCov_9fa48("226");
            const order = await tx.order.findUnique(stryMutAct_9fa48("227") ? {} : (stryCov_9fa48("227"), {
              where: stryMutAct_9fa48("228") ? {} : (stryCov_9fa48("228"), {
                id: orderId
              }),
              include: stryMutAct_9fa48("229") ? {} : (stryCov_9fa48("229"), {
                items: stryMutAct_9fa48("230") ? false : (stryCov_9fa48("230"), true)
              })
            }));
            if (stryMutAct_9fa48("233") ? false : stryMutAct_9fa48("232") ? true : stryMutAct_9fa48("231") ? order : (stryCov_9fa48("231", "232", "233"), !order)) throw notFound(stryMutAct_9fa48("234") ? "" : (stryCov_9fa48("234"), 'Order not found'));
            const subtotal = order.items.reduce(stryMutAct_9fa48("235") ? () => undefined : (stryCov_9fa48("235"), (sum, item) => sum.plus(item.unitPrice.mul(item.quantity))), new Prisma.Decimal(0));
            const tax = subtotal.mul(env.taxRate).toDecimalPlaces(2);
            const total = subtotal.plus(tax);
            return tx.bill.create(stryMutAct_9fa48("236") ? {} : (stryCov_9fa48("236"), {
              data: stryMutAct_9fa48("237") ? {} : (stryCov_9fa48("237"), {
                orderId,
                subtotal,
                tax,
                total
              }),
              include: billIncludes
            }));
          }
        });
      }
    } catch (err) {
      if (stryMutAct_9fa48("238")) {
        {}
      } else {
        stryCov_9fa48("238");
        if (stryMutAct_9fa48("241") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2002' : stryMutAct_9fa48("240") ? false : stryMutAct_9fa48("239") ? true : (stryCov_9fa48("239", "240", "241"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("243") ? err.code !== 'P2002' : stryMutAct_9fa48("242") ? true : (stryCov_9fa48("242", "243"), err.code === (stryMutAct_9fa48("244") ? "" : (stryCov_9fa48("244"), 'P2002')))))) {
          if (stryMutAct_9fa48("245")) {
            {}
          } else {
            stryCov_9fa48("245");
            throw conflict(stryMutAct_9fa48("246") ? "" : (stryCov_9fa48("246"), 'A bill already exists for this order'));
          }
        }
        throw err;
      }
    }
  }
}
export async function getBillForOrder(orderId: string, user: BillAccess) {
  if (stryMutAct_9fa48("247")) {
    {}
  } else {
    stryCov_9fa48("247");
    const bill = await prisma.bill.findUnique(stryMutAct_9fa48("248") ? {} : (stryCov_9fa48("248"), {
      where: stryMutAct_9fa48("249") ? {} : (stryCov_9fa48("249"), {
        orderId
      }),
      include: billIncludes
    }));
    if (stryMutAct_9fa48("252") ? false : stryMutAct_9fa48("251") ? true : stryMutAct_9fa48("250") ? bill : (stryCov_9fa48("250", "251", "252"), !bill)) throw notFound(stryMutAct_9fa48("253") ? "" : (stryCov_9fa48("253"), 'Bill not found'));
    if (stryMutAct_9fa48("256") ? user.role === 'customer' || bill.order.customerId !== user.id : stryMutAct_9fa48("255") ? false : stryMutAct_9fa48("254") ? true : (stryCov_9fa48("254", "255", "256"), (stryMutAct_9fa48("258") ? user.role !== 'customer' : stryMutAct_9fa48("257") ? true : (stryCov_9fa48("257", "258"), user.role === (stryMutAct_9fa48("259") ? "" : (stryCov_9fa48("259"), 'customer')))) && (stryMutAct_9fa48("261") ? bill.order.customerId === user.id : stryMutAct_9fa48("260") ? true : (stryCov_9fa48("260", "261"), bill.order.customerId !== user.id)))) {
      if (stryMutAct_9fa48("262")) {
        {}
      } else {
        stryCov_9fa48("262");
        throw forbidden(stryMutAct_9fa48("263") ? "" : (stryCov_9fa48("263"), 'You can only view bills for your own orders'));
      }
    }
    return bill;
  }
}
export async function payBill(id: string) {
  if (stryMutAct_9fa48("264")) {
    {}
  } else {
    stryCov_9fa48("264");
    try {
      if (stryMutAct_9fa48("265")) {
        {}
      } else {
        stryCov_9fa48("265");
        return await prisma.$transaction(async tx => {
          if (stryMutAct_9fa48("266")) {
            {}
          } else {
            stryCov_9fa48("266");
            const bill = await tx.bill.update(stryMutAct_9fa48("267") ? {} : (stryCov_9fa48("267"), {
              where: stryMutAct_9fa48("268") ? {} : (stryCov_9fa48("268"), {
                id
              }),
              data: stryMutAct_9fa48("269") ? {} : (stryCov_9fa48("269"), {
                paid: stryMutAct_9fa48("270") ? false : (stryCov_9fa48("270"), true),
                paidAt: new Date()
              })
            }));
            await tx.order.update(stryMutAct_9fa48("271") ? {} : (stryCov_9fa48("271"), {
              where: stryMutAct_9fa48("272") ? {} : (stryCov_9fa48("272"), {
                id: bill.orderId
              }),
              data: stryMutAct_9fa48("273") ? {} : (stryCov_9fa48("273"), {
                status: stryMutAct_9fa48("274") ? "" : (stryCov_9fa48("274"), 'paid')
              })
            }));
            return tx.bill.findUniqueOrThrow(stryMutAct_9fa48("275") ? {} : (stryCov_9fa48("275"), {
              where: stryMutAct_9fa48("276") ? {} : (stryCov_9fa48("276"), {
                id
              }),
              include: billIncludes
            }));
          }
        });
      }
    } catch (err) {
      if (stryMutAct_9fa48("277")) {
        {}
      } else {
        stryCov_9fa48("277");
        if (stryMutAct_9fa48("280") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2025' : stryMutAct_9fa48("279") ? false : stryMutAct_9fa48("278") ? true : (stryCov_9fa48("278", "279", "280"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("282") ? err.code !== 'P2025' : stryMutAct_9fa48("281") ? true : (stryCov_9fa48("281", "282"), err.code === (stryMutAct_9fa48("283") ? "" : (stryCov_9fa48("283"), 'P2025')))))) {
          if (stryMutAct_9fa48("284")) {
            {}
          } else {
            stryCov_9fa48("284");
            throw notFound(stryMutAct_9fa48("285") ? "" : (stryCov_9fa48("285"), 'Bill not found'));
          }
        }
        throw err;
      }
    }
  }
}