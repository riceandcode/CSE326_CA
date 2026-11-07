/* =========================================================
   admin.js — Admin panel: all contacts + user management
   ========================================================= */

const Admin = (() => {

    /** Render admin contacts list. */
    function renderContacts(search, status) {
        const contacts = Contacts.getFiltered({
            search: search || '',
            status: status || 'all',
        });

        const container = document.getElementById('admin-contacts-list');
        if (contacts.length === 0) {
            container.innerHTML = '<p class="empty-state">No contacts found.</p>';
            return;
        }

        container.innerHTML = buildContactTable(contacts, { showOwner: true, showCheckbox: true });
    }

    /** Render user list. */
    function renderUsers() {
        const users = Storage.getAll(Storage.KEYS.USERS);
        const container = document.getElementById('admin-users-list');

        if (users.length === 0) {
            container.innerHTML = '<p class="empty-state">No users found.</p>';
            return;
        }

        let html = `<table class="data-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Registered</th>
                    <th>Contacts</th>
                </tr>
            </thead><tbody>`;

        users.forEach(user => {
            const contactCount = Contacts.getStats(user.id).total;
            html += `<tr>
                <td data-label="Name">${escapeHtml(user.name)}</td>
                <td data-label="Email">${escapeHtml(user.email)}</td>
                <td data-label="Role"><span class="status-badge ${user.role === 'admin' ? 'status-in-progress' : 'status-pending'}">${user.role}</span></td>
                <td data-label="Registered">${formatDate(user.createdAt)}</td>
                <td data-label="Contacts">${contactCount}</td>
            </tr>`;
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    /** Delete selected contacts (checked checkboxes). */
    function deleteSelected() {
        const checkboxes = document.querySelectorAll('#admin-contacts-list .row-checkbox:checked');
        const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
        if (ids.length === 0) {
            showToast('No contacts selected.', 'info');
            return;
        }
        Contacts.removeMany(ids);
        showToast(`${ids.length} contact(s) deleted.`, 'success');
        const search = document.getElementById('admin-search-input').value;
        const status = document.getElementById('admin-filter-status').value;
        renderContacts(search, status);
    }

    return { renderContacts, renderUsers, deleteSelected };
})();
