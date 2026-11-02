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
import { conflict, notFound } from '../errors.js';
import type { createCategorySchema, createMenuItemSchema, updateMenuItemSchema } from '../schemas/menu.schemas.js';
import type { z } from 'zod';
type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;
type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
export async function createCategory(data: CreateCategoryInput) {
  if (stryMutAct_9fa48("331")) {
    {}
  } else {
    stryCov_9fa48("331");
    try {
      if (stryMutAct_9fa48("332")) {
        {}
      } else {
        stryCov_9fa48("332");
        return await prisma.menuCategory.create(stryMutAct_9fa48("333") ? {} : (stryCov_9fa48("333"), {
          data
        }));
      }
    } catch (err) {
      if (stryMutAct_9fa48("334")) {
        {}
      } else {
        stryCov_9fa48("334");
        if (stryMutAct_9fa48("337") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2002' : stryMutAct_9fa48("336") ? false : stryMutAct_9fa48("335") ? true : (stryCov_9fa48("335", "336", "337"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("339") ? err.code !== 'P2002' : stryMutAct_9fa48("338") ? true : (stryCov_9fa48("338", "339"), err.code === (stryMutAct_9fa48("340") ? "" : (stryCov_9fa48("340"), 'P2002')))))) {
          if (stryMutAct_9fa48("341")) {
            {}
          } else {
            stryCov_9fa48("341");
            throw conflict(stryMutAct_9fa48("342") ? "" : (stryCov_9fa48("342"), 'A category with this name already exists'));
          }
        }
        throw err;
      }
    }
  }
}
export async function listCategories() {
  if (stryMutAct_9fa48("343")) {
    {}
  } else {
    stryCov_9fa48("343");
    return prisma.menuCategory.findMany(stryMutAct_9fa48("344") ? {} : (stryCov_9fa48("344"), {
      orderBy: stryMutAct_9fa48("345") ? {} : (stryCov_9fa48("345"), {
        sortOrder: stryMutAct_9fa48("346") ? "" : (stryCov_9fa48("346"), 'asc')
      })
    }));
  }
}
export async function deleteCategory(id: string): Promise<void> {
  if (stryMutAct_9fa48("347")) {
    {}
  } else {
    stryCov_9fa48("347");
    try {
      if (stryMutAct_9fa48("348")) {
        {}
      } else {
        stryCov_9fa48("348");
        await prisma.menuCategory.delete(stryMutAct_9fa48("349") ? {} : (stryCov_9fa48("349"), {
          where: stryMutAct_9fa48("350") ? {} : (stryCov_9fa48("350"), {
            id
          })
        }));
      }
    } catch (err) {
      if (stryMutAct_9fa48("351")) {
        {}
      } else {
        stryCov_9fa48("351");
        if (stryMutAct_9fa48("354") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2025' : stryMutAct_9fa48("353") ? false : stryMutAct_9fa48("352") ? true : (stryCov_9fa48("352", "353", "354"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("356") ? err.code !== 'P2025' : stryMutAct_9fa48("355") ? true : (stryCov_9fa48("355", "356"), err.code === (stryMutAct_9fa48("357") ? "" : (stryCov_9fa48("357"), 'P2025')))))) {
          if (stryMutAct_9fa48("358")) {
            {}
          } else {
            stryCov_9fa48("358");
            throw notFound(stryMutAct_9fa48("359") ? "" : (stryCov_9fa48("359"), 'Category not found'));
          }
        }
        if (stryMutAct_9fa48("362") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2003' : stryMutAct_9fa48("361") ? false : stryMutAct_9fa48("360") ? true : (stryCov_9fa48("360", "361", "362"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("364") ? err.code !== 'P2003' : stryMutAct_9fa48("363") ? true : (stryCov_9fa48("363", "364"), err.code === (stryMutAct_9fa48("365") ? "" : (stryCov_9fa48("365"), 'P2003')))))) {
          if (stryMutAct_9fa48("366")) {
            {}
          } else {
            stryCov_9fa48("366");
            throw conflict(stryMutAct_9fa48("367") ? "" : (stryCov_9fa48("367"), 'Category contains menu items used by orders'));
          }
        }
        throw err;
      }
    }
  }
}
export async function createMenuItem(data: CreateMenuItemInput) {
  if (stryMutAct_9fa48("368")) {
    {}
  } else {
    stryCov_9fa48("368");
    const category = await prisma.menuCategory.findUnique(stryMutAct_9fa48("369") ? {} : (stryCov_9fa48("369"), {
      where: stryMutAct_9fa48("370") ? {} : (stryCov_9fa48("370"), {
        id: data.categoryId
      })
    }));
    if (stryMutAct_9fa48("373") ? false : stryMutAct_9fa48("372") ? true : stryMutAct_9fa48("371") ? category : (stryCov_9fa48("371", "372", "373"), !category)) throw notFound(stryMutAct_9fa48("374") ? "" : (stryCov_9fa48("374"), 'Menu category not found'));
    const {
      price,
      ...rest
    } = data;
    try {
      if (stryMutAct_9fa48("375")) {
        {}
      } else {
        stryCov_9fa48("375");
        return await prisma.menuItem.create(stryMutAct_9fa48("376") ? {} : (stryCov_9fa48("376"), {
          data: stryMutAct_9fa48("377") ? {} : (stryCov_9fa48("377"), {
            ...rest,
            price: new Prisma.Decimal(price)
          })
        }));
      }
    } catch (err) {
      if (stryMutAct_9fa48("378")) {
        {}
      } else {
        stryCov_9fa48("378");
        if (stryMutAct_9fa48("381") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2003' : stryMutAct_9fa48("380") ? false : stryMutAct_9fa48("379") ? true : (stryCov_9fa48("379", "380", "381"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("383") ? err.code !== 'P2003' : stryMutAct_9fa48("382") ? true : (stryCov_9fa48("382", "383"), err.code === (stryMutAct_9fa48("384") ? "" : (stryCov_9fa48("384"), 'P2003')))))) {
          if (stryMutAct_9fa48("385")) {
            {}
          } else {
            stryCov_9fa48("385");
            throw notFound(stryMutAct_9fa48("386") ? "" : (stryCov_9fa48("386"), 'Menu category not found'));
          }
        }
        throw err;
      }
    }
  }
}
export async function listMenuItems(filters: {
  categoryId?: string;
  availableOnly?: boolean;
}) {
  if (stryMutAct_9fa48("387")) {
    {}
  } else {
    stryCov_9fa48("387");
    return prisma.menuItem.findMany(stryMutAct_9fa48("388") ? {} : (stryCov_9fa48("388"), {
      where: stryMutAct_9fa48("389") ? {} : (stryCov_9fa48("389"), {
        ...(filters.categoryId ? stryMutAct_9fa48("390") ? {} : (stryCov_9fa48("390"), {
          categoryId: filters.categoryId
        }) : {}),
        ...(filters.availableOnly ? stryMutAct_9fa48("391") ? {} : (stryCov_9fa48("391"), {
          isAvailable: stryMutAct_9fa48("392") ? false : (stryCov_9fa48("392"), true)
        }) : {})
      }),
      orderBy: stryMutAct_9fa48("393") ? {} : (stryCov_9fa48("393"), {
        name: stryMutAct_9fa48("394") ? "" : (stryCov_9fa48("394"), 'asc')
      })
    }));
  }
}
export async function listLowStockItems() {
  if (stryMutAct_9fa48("395")) {
    {}
  } else {
    stryCov_9fa48("395");
    const rows = await (stryMutAct_9fa48("396") ? prisma.$queryRaw<Array<{
      id: string;
    }>>`` : (stryCov_9fa48("396"), prisma.$queryRaw<Array<{
      id: string;
    }>>`SELECT id FROM menu_items
    WHERE stock_count IS NOT NULL AND stock_count <= low_stock_threshold`));
    return prisma.menuItem.findMany(stryMutAct_9fa48("397") ? {} : (stryCov_9fa48("397"), {
      where: stryMutAct_9fa48("398") ? {} : (stryCov_9fa48("398"), {
        id: stryMutAct_9fa48("399") ? {} : (stryCov_9fa48("399"), {
          in: rows.map(stryMutAct_9fa48("400") ? () => undefined : (stryCov_9fa48("400"), row => row.id))
        })
      })
    }));
  }
}
export async function updateMenuItem(id: string, data: UpdateMenuItemInput) {
  if (stryMutAct_9fa48("401")) {
    {}
  } else {
    stryCov_9fa48("401");
    try {
      if (stryMutAct_9fa48("402")) {
        {}
      } else {
        stryCov_9fa48("402");
        return await prisma.menuItem.update(stryMutAct_9fa48("403") ? {} : (stryCov_9fa48("403"), {
          where: stryMutAct_9fa48("404") ? {} : (stryCov_9fa48("404"), {
            id
          }),
          data: stryMutAct_9fa48("405") ? {} : (stryCov_9fa48("405"), {
            ...data,
            ...((stryMutAct_9fa48("408") ? data.price === undefined : stryMutAct_9fa48("407") ? false : stryMutAct_9fa48("406") ? true : (stryCov_9fa48("406", "407", "408"), data.price !== undefined)) ? stryMutAct_9fa48("409") ? {} : (stryCov_9fa48("409"), {
              price: new Prisma.Decimal(data.price)
            }) : {})
          })
        }));
      }
    } catch (err) {
      if (stryMutAct_9fa48("410")) {
        {}
      } else {
        stryCov_9fa48("410");
        if (stryMutAct_9fa48("413") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2025' : stryMutAct_9fa48("412") ? false : stryMutAct_9fa48("411") ? true : (stryCov_9fa48("411", "412", "413"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("415") ? err.code !== 'P2025' : stryMutAct_9fa48("414") ? true : (stryCov_9fa48("414", "415"), err.code === (stryMutAct_9fa48("416") ? "" : (stryCov_9fa48("416"), 'P2025')))))) {
          if (stryMutAct_9fa48("417")) {
            {}
          } else {
            stryCov_9fa48("417");
            throw notFound(stryMutAct_9fa48("418") ? "" : (stryCov_9fa48("418"), 'Menu item not found'));
          }
        }
        if (stryMutAct_9fa48("421") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2003' : stryMutAct_9fa48("420") ? false : stryMutAct_9fa48("419") ? true : (stryCov_9fa48("419", "420", "421"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("423") ? err.code !== 'P2003' : stryMutAct_9fa48("422") ? true : (stryCov_9fa48("422", "423"), err.code === (stryMutAct_9fa48("424") ? "" : (stryCov_9fa48("424"), 'P2003')))))) {
          if (stryMutAct_9fa48("425")) {
            {}
          } else {
            stryCov_9fa48("425");
            throw notFound(stryMutAct_9fa48("426") ? "" : (stryCov_9fa48("426"), 'Menu category not found'));
          }
        }
        throw err;
      }
    }
  }
}
export async function deleteMenuItem(id: string): Promise<void> {
  if (stryMutAct_9fa48("427")) {
    {}
  } else {
    stryCov_9fa48("427");
    try {
      if (stryMutAct_9fa48("428")) {
        {}
      } else {
        stryCov_9fa48("428");
        await prisma.menuItem.delete(stryMutAct_9fa48("429") ? {} : (stryCov_9fa48("429"), {
          where: stryMutAct_9fa48("430") ? {} : (stryCov_9fa48("430"), {
            id
          })
        }));
      }
    } catch (err) {
      if (stryMutAct_9fa48("431")) {
        {}
      } else {
        stryCov_9fa48("431");
        if (stryMutAct_9fa48("434") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2025' : stryMutAct_9fa48("433") ? false : stryMutAct_9fa48("432") ? true : (stryCov_9fa48("432", "433", "434"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("436") ? err.code !== 'P2025' : stryMutAct_9fa48("435") ? true : (stryCov_9fa48("435", "436"), err.code === (stryMutAct_9fa48("437") ? "" : (stryCov_9fa48("437"), 'P2025')))))) {
          if (stryMutAct_9fa48("438")) {
            {}
          } else {
            stryCov_9fa48("438");
            throw notFound(stryMutAct_9fa48("439") ? "" : (stryCov_9fa48("439"), 'Menu item not found'));
          }
        }
        if (stryMutAct_9fa48("442") ? err instanceof Prisma.PrismaClientKnownRequestError || err.code === 'P2003' : stryMutAct_9fa48("441") ? false : stryMutAct_9fa48("440") ? true : (stryCov_9fa48("440", "441", "442"), err instanceof Prisma.PrismaClientKnownRequestError && (stryMutAct_9fa48("444") ? err.code !== 'P2003' : stryMutAct_9fa48("443") ? true : (stryCov_9fa48("443", "444"), err.code === (stryMutAct_9fa48("445") ? "" : (stryCov_9fa48("445"), 'P2003')))))) {
          if (stryMutAct_9fa48("446")) {
            {}
          } else {
            stryCov_9fa48("446");
            throw conflict(stryMutAct_9fa48("447") ? "" : (stryCov_9fa48("447"), 'Menu item is used by an order'));
          }
        }
        throw err;
      }
    }
  }
}