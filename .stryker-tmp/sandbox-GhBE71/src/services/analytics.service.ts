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
export async function getSummary() {
  if (stryMutAct_9fa48("0")) {
    {}
  } else {
    stryCov_9fa48("0");
    const [revenue, orderCount, average] = await Promise.all(stryMutAct_9fa48("1") ? [] : (stryCov_9fa48("1"), [prisma.bill.aggregate(stryMutAct_9fa48("2") ? {} : (stryCov_9fa48("2"), {
      where: stryMutAct_9fa48("3") ? {} : (stryCov_9fa48("3"), {
        paid: stryMutAct_9fa48("4") ? false : (stryCov_9fa48("4"), true)
      }),
      _sum: stryMutAct_9fa48("5") ? {} : (stryCov_9fa48("5"), {
        total: stryMutAct_9fa48("6") ? false : (stryCov_9fa48("6"), true)
      })
    })), prisma.order.count(), prisma.bill.aggregate(stryMutAct_9fa48("7") ? {} : (stryCov_9fa48("7"), {
      where: stryMutAct_9fa48("8") ? {} : (stryCov_9fa48("8"), {
        paid: stryMutAct_9fa48("9") ? false : (stryCov_9fa48("9"), true)
      }),
      _avg: stryMutAct_9fa48("10") ? {} : (stryCov_9fa48("10"), {
        total: stryMutAct_9fa48("11") ? false : (stryCov_9fa48("11"), true)
      })
    }))]));
    return stryMutAct_9fa48("12") ? {} : (stryCov_9fa48("12"), {
      totalRevenue: stryMutAct_9fa48("13") ? revenue._sum.total?.toFixed(2) && '0.00' : (stryCov_9fa48("13"), (stryMutAct_9fa48("14") ? revenue._sum.total.toFixed(2) : (stryCov_9fa48("14"), revenue._sum.total?.toFixed(2))) ?? (stryMutAct_9fa48("15") ? "" : (stryCov_9fa48("15"), '0.00'))),
      totalOrderCount: orderCount,
      averageOrderValue: stryMutAct_9fa48("16") ? average._avg.total?.toFixed(2) && '0.00' : (stryCov_9fa48("16"), (stryMutAct_9fa48("17") ? average._avg.total.toFixed(2) : (stryCov_9fa48("17"), average._avg.total?.toFixed(2))) ?? (stryMutAct_9fa48("18") ? "" : (stryCov_9fa48("18"), '0.00')))
    });
  }
}
export async function getSales(days = 7) {
  if (stryMutAct_9fa48("19")) {
    {}
  } else {
    stryCov_9fa48("19");
    const rows = await (stryMutAct_9fa48("20") ? prisma.$queryRaw<Array<{
      day: string;
      revenue: Prisma.Decimal;
    }>>`` : (stryCov_9fa48("20"), prisma.$queryRaw<Array<{
      day: string;
      revenue: Prisma.Decimal;
    }>>`
    SELECT to_char(date_trunc('day', paid_at), 'YYYY-MM-DD') AS day,
           SUM(total) AS revenue
    FROM bills
    WHERE paid = TRUE
      AND paid_at >= NOW() - (${days}::int * INTERVAL '1 day')
    GROUP BY date_trunc('day', paid_at)
    ORDER BY date_trunc('day', paid_at)
  `));
    return rows.map(stryMutAct_9fa48("21") ? () => undefined : (stryCov_9fa48("21"), row => stryMutAct_9fa48("22") ? {} : (stryCov_9fa48("22"), {
      day: row.day,
      revenue: row.revenue.toFixed(2)
    })));
  }
}
export async function getTopItems(limit = 10) {
  if (stryMutAct_9fa48("23")) {
    {}
  } else {
    stryCov_9fa48("23");
    const quantities = await prisma.orderItem.groupBy(stryMutAct_9fa48("24") ? {} : (stryCov_9fa48("24"), {
      by: stryMutAct_9fa48("25") ? [] : (stryCov_9fa48("25"), [stryMutAct_9fa48("26") ? "" : (stryCov_9fa48("26"), 'menuItemId')]),
      _sum: stryMutAct_9fa48("27") ? {} : (stryCov_9fa48("27"), {
        quantity: stryMutAct_9fa48("28") ? false : (stryCov_9fa48("28"), true)
      }),
      orderBy: stryMutAct_9fa48("29") ? {} : (stryCov_9fa48("29"), {
        _sum: stryMutAct_9fa48("30") ? {} : (stryCov_9fa48("30"), {
          quantity: stryMutAct_9fa48("31") ? "" : (stryCov_9fa48("31"), 'desc')
        })
      }),
      take: limit
    }));
    const menuItems = await prisma.menuItem.findMany(stryMutAct_9fa48("32") ? {} : (stryCov_9fa48("32"), {
      where: stryMutAct_9fa48("33") ? {} : (stryCov_9fa48("33"), {
        id: stryMutAct_9fa48("34") ? {} : (stryCov_9fa48("34"), {
          in: quantities.map(stryMutAct_9fa48("35") ? () => undefined : (stryCov_9fa48("35"), row => row.menuItemId))
        })
      })
    }));
    const menuItemById = new Map(menuItems.map(stryMutAct_9fa48("36") ? () => undefined : (stryCov_9fa48("36"), item => stryMutAct_9fa48("37") ? [] : (stryCov_9fa48("37"), [item.id, item]))));
    return quantities.flatMap(row => {
      if (stryMutAct_9fa48("38")) {
        {}
      } else {
        stryCov_9fa48("38");
        const menuItem = menuItemById.get(row.menuItemId);
        return menuItem ? stryMutAct_9fa48("39") ? [] : (stryCov_9fa48("39"), [stryMutAct_9fa48("40") ? {} : (stryCov_9fa48("40"), {
          menuItem,
          quantitySold: stryMutAct_9fa48("41") ? row._sum.quantity && 0 : (stryCov_9fa48("41"), row._sum.quantity ?? 0)
        })]) : stryMutAct_9fa48("42") ? ["Stryker was here"] : (stryCov_9fa48("42"), []);
      }
    });
  }
}
export async function getPeakHours() {
  if (stryMutAct_9fa48("43")) {
    {}
  } else {
    stryCov_9fa48("43");
    return stryMutAct_9fa48("44") ? prisma.$queryRaw<Array<{
      hour: number;
      orderCount: number;
    }>>`` : (stryCov_9fa48("44"), prisma.$queryRaw<Array<{
      hour: number;
      orderCount: number;
    }>>`
    SELECT EXTRACT(HOUR FROM created_at)::int AS hour, COUNT(*)::int AS "orderCount"
    FROM orders
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY EXTRACT(HOUR FROM created_at)
  `);
  }
}