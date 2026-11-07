/* =========================================================
   storage.js — localStorage abstraction layer
   ========================================================= */

const Storage = (() => {
    const KEYS = {
        USERS: 'cms_users',
        SESSION: 'cms_session',
        CONTACTS: 'cms_contacts',
    };

    /** Get all items from a key (returns array). */
    function getAll(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch {
            return [];
        }
    }

    /** Save an array to a key. */
    function save(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    }

    /** Get a single item from an array key by id. */
    function getById(key, id) {
        return getAll(key).find(item => item.id === id) || null;
    }

    /** Add an item to an array key. Returns the new item with id. */
    function add(key, item) {
        const items = getAll(key);
        item.id = generateId();
        item.createdAt = new Date().toISOString();
        item.updatedAt = item.createdAt;
        items.push(item);
        save(key, items);
        return item;
    }

    /** Update an existing item by id. Returns the updated item or null. */
    function update(key, id, updates) {
        const items = getAll(key);
        const index = items.findIndex(item => item.id === id);
        if (index === -1) return null;
        items[index] = { ...items[index], ...updates, updatedAt: new Date().toISOString() };
        save(key, items);
        return items[index];
    }

    /** Remove an item by id. Returns true if found and removed. */
    function remove(key, id) {
        const items = getAll(key);
        const filtered = items.filter(item => item.id !== id);
        if (filtered.length === items.length) return false;
        save(key, filtered);
        return true;
    }

    /** Remove multiple items by id array. */
    function removeMany(key, ids) {
        const items = getAll(key);
        save(key, items.filter(item => !ids.includes(item.id)));
    }

    /** Generate a unique id. */
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
    }

    /** Session helpers. */
    function getSession() {
        try {
            return JSON.parse(localStorage.getItem(KEYS.SESSION));
        } catch {
            return null;
        }
    }

    function setSession(data) {
        localStorage.setItem(KEYS.SESSION, JSON.stringify(data));
    }

    function clearSession() {
        localStorage.removeItem(KEYS.SESSION);
    }

    return { KEYS, getAll, save, getById, add, update, remove, removeMany, generateId, getSession, setSession, clearSession };
})();
