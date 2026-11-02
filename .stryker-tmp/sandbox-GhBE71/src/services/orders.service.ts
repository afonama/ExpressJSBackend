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
import { OrderStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { badRequest, conflict, forbidden, notFound } from '../errors.js';
import type { AuthUser } from '../types/index.js';
import type { orderItemInputSchema } from '../schemas/orders.schemas.js';
import type { z } from 'zod';
type OrderItemInput = z.infer<typeof orderItemInputSchema>;
type OrderAccess = Pick<AuthUser, 'id' | 'role'>;
const orderIncludes = (stryMutAct_9fa48("448") ? {} : (stryCov_9fa48("448"), {
  table: stryMutAct_9fa48("449") ? false : (stryCov_9fa48("449"), true),
  items: stryMutAct_9fa48("450") ? {} : (stryCov_9fa48("450"), {
    include: stryMutAct_9fa48("451") ? {} : (stryCov_9fa48("451"), {
      menuItem: stryMutAct_9fa48("452") ? false : (stryCov_9fa48("452"), true)
    })
  }),
  bill: stryMutAct_9fa48("453") ? false : (stryCov_9fa48("453"), true)
})) satisfies Prisma.OrderInclude;
export async function createOrder(input: {
  tableId: string;
  items: OrderItemInput[];
}, user: OrderAccess) {
  if (stryMutAct_9fa48("454")) {
    {}
  } else {
    stryCov_9fa48("454");
    return prisma.$transaction(async tx => {
      if (stryMutAct_9fa48("455")) {
        {}
      } else {
        stryCov_9fa48("455");
        const table = await tx.table.findUnique(stryMutAct_9fa48("456") ? {} : (stryCov_9fa48("456"), {
          where: stryMutAct_9fa48("457") ? {} : (stryCov_9fa48("457"), {
            id: input.tableId
          })
        }));
        if (stryMutAct_9fa48("460") ? false : stryMutAct_9fa48("459") ? true : stryMutAct_9fa48("458") ? table : (stryCov_9fa48("458", "459", "460"), !table)) throw notFound(stryMutAct_9fa48("461") ? "" : (stryCov_9fa48("461"), 'Table not found'));
        const order = await tx.order.create(stryMutAct_9fa48("462") ? {} : (stryCov_9fa48("462"), {
          data: stryMutAct_9fa48("463") ? {} : (stryCov_9fa48("463"), {
            tableId: input.tableId,
            ...((stryMutAct_9fa48("466") ? user.role !== 'customer' : stryMutAct_9fa48("465") ? false : stryMutAct_9fa48("464") ? true : (stryCov_9fa48("464", "465", "466"), user.role === (stryMutAct_9fa48("467") ? "" : (stryCov_9fa48("467"), 'customer')))) ? stryMutAct_9fa48("468") ? {} : (stryCov_9fa48("468"), {
              customerId: user.id
            }) : {}),
            ...((stryMutAct_9fa48("471") ? user.role !== 'waiter' : stryMutAct_9fa48("470") ? false : stryMutAct_9fa48("469") ? true : (stryCov_9fa48("469", "470", "471"), user.role === (stryMutAct_9fa48("472") ? "" : (stryCov_9fa48("472"), 'waiter')))) ? stryMutAct_9fa48("473") ? {} : (stryCov_9fa48("473"), {
              waiterId: user.id
            }) : {})
          })
        }));
        await addItemsWithStockLock(tx, order.id, input.items);
        await tx.table.update(stryMutAct_9fa48("474") ? {} : (stryCov_9fa48("474"), {
          where: stryMutAct_9fa48("475") ? {} : (stryCov_9fa48("475"), {
            id: input.tableId
          }),
          data: stryMutAct_9fa48("476") ? {} : (stryCov_9fa48("476"), {
            status: stryMutAct_9fa48("477") ? "" : (stryCov_9fa48("477"), 'occupied')
          })
        }));
        return tx.order.findUniqueOrThrow(stryMutAct_9fa48("478") ? {} : (stryCov_9fa48("478"), {
          where: stryMutAct_9fa48("479") ? {} : (stryCov_9fa48("479"), {
            id: order.id
          }),
          include: orderIncludes
        }));
      }
    });
  }
}
export async function listOrders(filters: {
  tableId?: string;
  activeOnly?: boolean;
}, user: OrderAccess) {
  if (stryMutAct_9fa48("480")) {
    {}
  } else {
    stryCov_9fa48("480");
    return prisma.order.findMany(stryMutAct_9fa48("481") ? {} : (stryCov_9fa48("481"), {
      where: stryMutAct_9fa48("482") ? {} : (stryCov_9fa48("482"), {
        ...((stryMutAct_9fa48("485") ? user.role !== 'customer' : stryMutAct_9fa48("484") ? false : stryMutAct_9fa48("483") ? true : (stryCov_9fa48("483", "484", "485"), user.role === (stryMutAct_9fa48("486") ? "" : (stryCov_9fa48("486"), 'customer')))) ? stryMutAct_9fa48("487") ? {} : (stryCov_9fa48("487"), {
          customerId: user.id
        }) : {}),
        ...(filters.tableId ? stryMutAct_9fa48("488") ? {} : (stryCov_9fa48("488"), {
          tableId: filters.tableId
        }) : {}),
        ...(filters.activeOnly ? stryMutAct_9fa48("489") ? {} : (stryCov_9fa48("489"), {
          status: stryMutAct_9fa48("490") ? {} : (stryCov_9fa48("490"), {
            notIn: stryMutAct_9fa48("491") ? [] : (stryCov_9fa48("491"), [stryMutAct_9fa48("492") ? "" : (stryCov_9fa48("492"), 'paid'), stryMutAct_9fa48("493") ? "" : (stryCov_9fa48("493"), 'cancelled')])
          })
        }) : {})
      }),
      include: orderIncludes,
      orderBy: stryMutAct_9fa48("494") ? {} : (stryCov_9fa48("494"), {
        createdAt: stryMutAct_9fa48("495") ? "" : (stryCov_9fa48("495"), 'desc')
      })
    }));
  }
}
export async function getOrder(id: string, user: OrderAccess) {
  if (stryMutAct_9fa48("496")) {
    {}
  } else {
    stryCov_9fa48("496");
    const order = await prisma.order.findUnique(stryMutAct_9fa48("497") ? {} : (stryCov_9fa48("497"), {
      where: stryMutAct_9fa48("498") ? {} : (stryCov_9fa48("498"), {
        id
      }),
      include: orderIncludes
    }));
    if (stryMutAct_9fa48("501") ? false : stryMutAct_9fa48("500") ? true : stryMutAct_9fa48("499") ? order : (stryCov_9fa48("499", "500", "501"), !order)) throw notFound(stryMutAct_9fa48("502") ? "" : (stryCov_9fa48("502"), 'Order not found'));
    if (stryMutAct_9fa48("505") ? user.role === 'customer' || order.customerId !== user.id : stryMutAct_9fa48("504") ? false : stryMutAct_9fa48("503") ? true : (stryCov_9fa48("503", "504", "505"), (stryMutAct_9fa48("507") ? user.role !== 'customer' : stryMutAct_9fa48("506") ? true : (stryCov_9fa48("506", "507"), user.role === (stryMutAct_9fa48("508") ? "" : (stryCov_9fa48("508"), 'customer')))) && (stryMutAct_9fa48("510") ? order.customerId === user.id : stryMutAct_9fa48("509") ? true : (stryCov_9fa48("509", "510"), order.customerId !== user.id)))) {
      if (stryMutAct_9fa48("511")) {
        {}
      } else {
        stryCov_9fa48("511");
        throw forbidden(stryMutAct_9fa48("512") ? "" : (stryCov_9fa48("512"), 'You can only view your own orders'));
      }
    }
    return order;
  }
}
export async function addOrderItems(id: string, items: OrderItemInput[], user: OrderAccess) {
  if (stryMutAct_9fa48("513")) {
    {}
  } else {
    stryCov_9fa48("513");
    return prisma.$transaction(async tx => {
      if (stryMutAct_9fa48("514")) {
        {}
      } else {
        stryCov_9fa48("514");
        const lockedOrders = await (stryMutAct_9fa48("515") ? tx.$queryRaw<Array<{
          id: string;
        }>>`` : (stryCov_9fa48("515"), tx.$queryRaw<Array<{
          id: string;
        }>>`
      SELECT id FROM orders WHERE id = ${id}::uuid FOR UPDATE
    `));
        if (stryMutAct_9fa48("518") ? lockedOrders.length !== 0 : stryMutAct_9fa48("517") ? false : stryMutAct_9fa48("516") ? true : (stryCov_9fa48("516", "517", "518"), lockedOrders.length === 0)) throw notFound(stryMutAct_9fa48("519") ? "" : (stryCov_9fa48("519"), 'Order not found'));
        const order = await tx.order.findUnique(stryMutAct_9fa48("520") ? {} : (stryCov_9fa48("520"), {
          where: stryMutAct_9fa48("521") ? {} : (stryCov_9fa48("521"), {
            id
          })
        }));
        if (stryMutAct_9fa48("524") ? false : stryMutAct_9fa48("523") ? true : stryMutAct_9fa48("522") ? order : (stryCov_9fa48("522", "523", "524"), !order)) throw notFound(stryMutAct_9fa48("525") ? "" : (stryCov_9fa48("525"), 'Order not found'));
        if (stryMutAct_9fa48("528") ? user.role === 'customer' || order.customerId !== user.id : stryMutAct_9fa48("527") ? false : stryMutAct_9fa48("526") ? true : (stryCov_9fa48("526", "527", "528"), (stryMutAct_9fa48("530") ? user.role !== 'customer' : stryMutAct_9fa48("529") ? true : (stryCov_9fa48("529", "530"), user.role === (stryMutAct_9fa48("531") ? "" : (stryCov_9fa48("531"), 'customer')))) && (stryMutAct_9fa48("533") ? order.customerId === user.id : stryMutAct_9fa48("532") ? true : (stryCov_9fa48("532", "533"), order.customerId !== user.id)))) {
          if (stryMutAct_9fa48("534")) {
            {}
          } else {
            stryCov_9fa48("534");
            throw forbidden(stryMutAct_9fa48("535") ? "" : (stryCov_9fa48("535"), 'You can only modify your own orders'));
          }
        }
        if (stryMutAct_9fa48("538") ? order.status === 'paid' && order.status === 'cancelled' : stryMutAct_9fa48("537") ? false : stryMutAct_9fa48("536") ? true : (stryCov_9fa48("536", "537", "538"), (stryMutAct_9fa48("540") ? order.status !== 'paid' : stryMutAct_9fa48("539") ? false : (stryCov_9fa48("539", "540"), order.status === (stryMutAct_9fa48("541") ? "" : (stryCov_9fa48("541"), 'paid')))) || (stryMutAct_9fa48("543") ? order.status !== 'cancelled' : stryMutAct_9fa48("542") ? false : (stryCov_9fa48("542", "543"), order.status === (stryMutAct_9fa48("544") ? "" : (stryCov_9fa48("544"), 'cancelled')))))) {
          if (stryMutAct_9fa48("545")) {
            {}
          } else {
            stryCov_9fa48("545");
            throw badRequest(stryMutAct_9fa48("546") ? "" : (stryCov_9fa48("546"), 'Cannot add items to a paid or cancelled order'));
          }
        }
        await addItemsWithStockLock(tx, id, items);
        return tx.order.findUniqueOrThrow(stryMutAct_9fa48("547") ? {} : (stryCov_9fa48("547"), {
          where: stryMutAct_9fa48("548") ? {} : (stryCov_9fa48("548"), {
            id
          }),
          include: orderIncludes
        }));
      }
    });
  }
}
export async function updateOrderStatus(id: string, status: OrderStatus, expectedStatus: OrderStatus) {
  if (stryMutAct_9fa48("549")) {
    {}
  } else {
    stryCov_9fa48("549");
    const updated = await prisma.order.updateMany(stryMutAct_9fa48("550") ? {} : (stryCov_9fa48("550"), {
      where: stryMutAct_9fa48("551") ? {} : (stryCov_9fa48("551"), {
        id,
        status: expectedStatus
      }),
      data: stryMutAct_9fa48("552") ? {} : (stryCov_9fa48("552"), {
        status
      })
    }));
    if (stryMutAct_9fa48("555") ? updated.count !== 0 : stryMutAct_9fa48("554") ? false : stryMutAct_9fa48("553") ? true : (stryCov_9fa48("553", "554", "555"), updated.count === 0)) {
      if (stryMutAct_9fa48("556")) {
        {}
      } else {
        stryCov_9fa48("556");
        const order = await prisma.order.findUnique(stryMutAct_9fa48("557") ? {} : (stryCov_9fa48("557"), {
          where: stryMutAct_9fa48("558") ? {} : (stryCov_9fa48("558"), {
            id
          }),
          select: stryMutAct_9fa48("559") ? {} : (stryCov_9fa48("559"), {
            id: stryMutAct_9fa48("560") ? false : (stryCov_9fa48("560"), true)
          })
        }));
        if (stryMutAct_9fa48("563") ? false : stryMutAct_9fa48("562") ? true : stryMutAct_9fa48("561") ? order : (stryCov_9fa48("561", "562", "563"), !order)) throw notFound(stryMutAct_9fa48("564") ? "" : (stryCov_9fa48("564"), 'Order not found'));
        throw conflict(stryMutAct_9fa48("565") ? "" : (stryCov_9fa48("565"), 'Order status changed; reload the order before retrying'));
      }
    }
    return prisma.order.findUniqueOrThrow(stryMutAct_9fa48("566") ? {} : (stryCov_9fa48("566"), {
      where: stryMutAct_9fa48("567") ? {} : (stryCov_9fa48("567"), {
        id
      }),
      include: orderIncludes
    }));
  }
}
async function addItemsWithStockLock(tx: Prisma.TransactionClient, orderId: string, items: OrderItemInput[]): Promise<void> {
  if (stryMutAct_9fa48("568")) {
    {}
  } else {
    stryCov_9fa48("568");
    const orderedItems = stryMutAct_9fa48("569") ? [...items] : (stryCov_9fa48("569"), (stryMutAct_9fa48("570") ? [] : (stryCov_9fa48("570"), [...items])).sort(stryMutAct_9fa48("571") ? () => undefined : (stryCov_9fa48("571"), (a, b) => a.menuItemId.localeCompare(b.menuItemId))));
    for (const requestedItem of orderedItems) {
      if (stryMutAct_9fa48("572")) {
        {}
      } else {
        stryCov_9fa48("572");
        const lockedItems = await (stryMutAct_9fa48("573") ? tx.$queryRaw<Array<{
          id: string;
        }>>`` : (stryCov_9fa48("573"), tx.$queryRaw<Array<{
          id: string;
        }>>`
      SELECT id FROM menu_items WHERE id = ${requestedItem.menuItemId}::uuid FOR UPDATE
    `));
        if (stryMutAct_9fa48("576") ? lockedItems.length !== 0 : stryMutAct_9fa48("575") ? false : stryMutAct_9fa48("574") ? true : (stryCov_9fa48("574", "575", "576"), lockedItems.length === 0)) throw notFound(stryMutAct_9fa48("577") ? "" : (stryCov_9fa48("577"), 'Menu item not found'));
        const menuItem = await tx.menuItem.findUnique(stryMutAct_9fa48("578") ? {} : (stryCov_9fa48("578"), {
          where: stryMutAct_9fa48("579") ? {} : (stryCov_9fa48("579"), {
            id: requestedItem.menuItemId
          })
        }));
        if (stryMutAct_9fa48("582") ? false : stryMutAct_9fa48("581") ? true : stryMutAct_9fa48("580") ? menuItem : (stryCov_9fa48("580", "581", "582"), !menuItem)) throw notFound(stryMutAct_9fa48("583") ? "" : (stryCov_9fa48("583"), 'Menu item not found'));
        if (stryMutAct_9fa48("586") ? false : stryMutAct_9fa48("585") ? true : stryMutAct_9fa48("584") ? menuItem.isAvailable : (stryCov_9fa48("584", "585", "586"), !menuItem.isAvailable)) throw badRequest(stryMutAct_9fa48("587") ? `` : (stryCov_9fa48("587"), `Menu item "${menuItem.name}" is unavailable`));
        if (stryMutAct_9fa48("590") ? menuItem.stockCount !== null || menuItem.stockCount < requestedItem.quantity : stryMutAct_9fa48("589") ? false : stryMutAct_9fa48("588") ? true : (stryCov_9fa48("588", "589", "590"), (stryMutAct_9fa48("592") ? menuItem.stockCount === null : stryMutAct_9fa48("591") ? true : (stryCov_9fa48("591", "592"), menuItem.stockCount !== null)) && (stryMutAct_9fa48("595") ? menuItem.stockCount >= requestedItem.quantity : stryMutAct_9fa48("594") ? menuItem.stockCount <= requestedItem.quantity : stryMutAct_9fa48("593") ? true : (stryCov_9fa48("593", "594", "595"), menuItem.stockCount < requestedItem.quantity)))) {
          if (stryMutAct_9fa48("596")) {
            {}
          } else {
            stryCov_9fa48("596");
            throw badRequest(stryMutAct_9fa48("597") ? `` : (stryCov_9fa48("597"), `Insufficient stock for menu item "${menuItem.name}"`));
          }
        }
        if (stryMutAct_9fa48("600") ? menuItem.stockCount === null : stryMutAct_9fa48("599") ? false : stryMutAct_9fa48("598") ? true : (stryCov_9fa48("598", "599", "600"), menuItem.stockCount !== null)) {
          if (stryMutAct_9fa48("601")) {
            {}
          } else {
            stryCov_9fa48("601");
            await tx.menuItem.update(stryMutAct_9fa48("602") ? {} : (stryCov_9fa48("602"), {
              where: stryMutAct_9fa48("603") ? {} : (stryCov_9fa48("603"), {
                id: menuItem.id
              }),
              data: stryMutAct_9fa48("604") ? {} : (stryCov_9fa48("604"), {
                stockCount: stryMutAct_9fa48("605") ? {} : (stryCov_9fa48("605"), {
                  decrement: requestedItem.quantity
                })
              })
            }));
          }
        }
        await tx.orderItem.create(stryMutAct_9fa48("606") ? {} : (stryCov_9fa48("606"), {
          data: stryMutAct_9fa48("607") ? {} : (stryCov_9fa48("607"), {
            orderId,
            menuItemId: menuItem.id,
            quantity: requestedItem.quantity,
            notes: requestedItem.notes,
            unitPrice: menuItem.price
          })
        }));
      }
    }
  }
}