import { GuestDataError } from "@/features/guests/data/errors";
import {
  createDemoStore,
  createEmptyStore,
  createMemoryRepository,
  type GuestStore,
} from "@/features/guests/data/memory-repository";
import type { GuestRepository } from "@/features/guests/data/repository";
import type { RouteContext } from "@/features/guests/domain/route-context";

const MAX_STORES = 80;

function storeMap() {
  const globalStore = globalThis as typeof globalThis & {
    __edenidaGuestStores?: Map<string, GuestStore>;
  };
  if (!globalStore.__edenidaGuestStores) {
    globalStore.__edenidaGuestStores = new Map();
  }
  return globalStore.__edenidaGuestStores;
}

export function resetGuestStores() {
  storeMap().clear();
}

function errorRepository(): GuestRepository {
  const fail = () => {
    throw new GuestDataError();
  };
  return {
    getWedding: async () => fail(),
    listGuests: async () => fail(),
    getGuest: async () => fail(),
    saveGuest: async () => fail(),
    deleteGuest: async () => fail(),
    listHouseholds: async () => fail(),
    saveHousehold: async () => fail(),
    getRsvpDashboard: async () => fail(),
    getPublicRsvp: async () => fail(),
    submitPublicRsvp: async () => fail(),
    getRsvpConfirmation: async () => fail(),
  };
}

export function getGuestRepository(ctx: RouteContext): GuestRepository {
  if (ctx.scenario === "error") return errorRepository();
  const key = `${ctx.scenario}:${ctx.sessionId}`;
  const stores = storeMap();
  let store = stores.get(key);
  if (!store) {
    if (stores.size >= MAX_STORES) {
      const oldest = stores.keys().next().value;
      if (oldest) stores.delete(oldest);
    }
    store = ctx.scenario === "empty" ? createEmptyStore() : createDemoStore();
    stores.set(key, store);
  }
  return createMemoryRepository(store);
}
