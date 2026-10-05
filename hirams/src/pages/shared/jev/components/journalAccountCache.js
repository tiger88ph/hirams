import JournalAccountAPI from "../../../../api/endpoints/journal-account.api.js";

// Shared caches for the journal account lists used by AccountChainSelect:
// several selectors on screen (From / To) reuse one request instead of each
// downloading the full list, and the JEV view panel can preload them so the
// Add Entry / Edit Entry modal opens without waiting on the network.
const CACHE_MS = 60_000;
const allAccountsCache = { data: null, promise: null, at: 0 };
const parentsCache = { data: null, promise: null, at: 0 };

// Kicks off a request only when nothing is already in flight, and keeps the
// resolved payload around for reuse.
const requestOnce = (cache, run) => {
  if (!cache.promise) {
    cache.at = Date.now();
    cache.promise = run()
      .then((res) => {
        cache.data = res;
        return res;
      })
      .catch((err) => {
        cache.promise = null; // allow a retry on the next call
        throw err;
      });
  }
  return cache.promise;
};

// Stale-while-revalidate: answer immediately from the cached payload and
// refresh it in the background, so opening Add/Edit Entry never waits on the
// network while still picking up new accounts on the next open.
const serve = (cache, run) => {
  if (cache.data) {
    const stale = Date.now() - cache.at > CACHE_MS;
    if (stale && !cache.promise) requestOnce(cache, run).catch(() => {});
    return Promise.resolve(cache.data);
  }
  return requestOnce(cache, run);
};

export const fetchAllAccounts = () =>
  serve(allAccountsCache, () => JournalAccountAPI.getAll());

export const fetchParents = () =>
  serve(parentsCache, () => JournalAccountAPI.getParents());

// Fire-and-forget warm-up: both lists start downloading while the panel
// loads, so by the time Add Entry / Edit Entry is clicked they are already
// sitting in cache.
export const warmAccountCache = () => {
  fetchParents().catch(() => {});
  fetchAllAccounts().catch(() => {});
};
