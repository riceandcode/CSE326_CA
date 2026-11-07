/* =========================================================
   contacts.js — Contact CRUD, search, filter, status
   ========================================================= */

const Contacts = (() => {
    const { KEYS } = Storage;

    /** Create a new contact. */
    function create(data) {
        const session = Auth.getSession();
        const contact = {
            userId: session.userId,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.trim().toLowerCase(),
            phone: data.phone.trim(),
            category: data.category || 'General',
            status: data.status || 'Pending',
            message: (data.message || '').trim(),
        };
        return Storage.add(KEYS.CONTACTS, contact);
    }

    /** Update an existing contact by id. */
    function update(id, data) {
        return Storage.update(KEYS.CONTACTS, id, {
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            email: data.email.trim().toLowerCase(),
            phone: data.phone.trim(),
            category: data.category,
            status: data.status,
            message: (data.message || '').trim(),
        });
    }

    /** Delete a contact by id. */
    function remove(id) {
        return Storage.remove(KEYS.CONTACTS, id);
    }

    /** Delete multiple contacts. */
    function removeMany(ids) {
        Storage.removeMany(KEYS.CONTACTS, ids);
    }

    /** Update only the status of a contact. */
    function updateStatus(id, status) {
        return Storage.update(KEYS.CONTACTS, id, { status });
    }

    /** Get a single contact. */
    function getById(id) {
        return Storage.getById(KEYS.CONTACTS, id);
    }

    /**
     * Get contacts with optional filters.
     * @param {Object} opts
     * @param {string} opts.userId   - Filter by owner (omit for all)
     * @param {string} opts.search   - Search in name/email/phone
     * @param {string} opts.status   - 'Pending' | 'In Progress' | 'Resolved' | 'all'
     * @param {string} opts.category - 'General' | 'Support' | 'Sales' | 'Feedback' | 'all'
     */
    function getFiltered(opts = {}) {
        let contacts = Storage.getAll(KEYS.CONTACTS);

        // Owner filter
        if (opts.userId) {
            contacts = contacts.filter(c => c.userId === opts.userId);
        }

        // Status filter
        if (opts.status && opts.status !== 'all') {
            contacts = contacts.filter(c => c.status === opts.status);
        }

        // Category filter
        if (opts.category && opts.category !== 'all') {
            contacts = contacts.filter(c => c.category === opts.category);
        }

        // Search
        if (opts.search) {
            const q = opts.search.toLowerCase();
            contacts = contacts.filter(c =>
                (c.firstName + ' ' + c.lastName).toLowerCase().includes(q) ||
                c.email.toLowerCase().includes(q) ||
                c.phone.includes(q)
            );
        }

        // Sort newest first
        contacts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return contacts;
    }

    /** Get counts by status for a userId (or all if omitted). */
    function getStats(userId) {
        let contacts = Storage.getAll(KEYS.CONTACTS);
        if (userId) {
            contacts = contacts.filter(c => c.userId === userId);
        }
        return {
            total: contacts.length,
            pending: contacts.filter(c => c.status === 'Pending').length,
            inProgress: contacts.filter(c => c.status === 'In Progress').length,
            resolved: contacts.filter(c => c.status === 'Resolved').length,
        };
    }

    return { create, update, remove, removeMany, updateStatus, getById, getFiltered, getStats };
})();
