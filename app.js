/* =========================================================
   app.js — Application entry point, routing, event wiring
   ========================================================= */

// ────────── Utility helpers (global) ──────────

/** Escape HTML to prevent XSS in rendered content. */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

/** Format ISO date string to a readable date. */
function formatDate(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** CSS class for a status string. */
function statusClass(status) {
    switch (status) {
        case 'Pending':     return 'status-pending';
        case 'In Progress': return 'status-in-progress';
        case 'Resolved':    return 'status-resolved';
        default:            return '';
    }
}

/** Show a toast notification. */
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.classList.remove('hidden');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.add('hidden'), 3000);
}

/** Show confirm dialog. Returns a promise that resolves true/false. */
function confirmAction(title, message) {
    return new Promise(resolve => {
        const overlay = document.getElementById('confirm-dialog');
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-message').textContent = message;
        overlay.classList.remove('hidden');

        const yesBtn = document.getElementById('confirm-yes');
        const noBtn = document.getElementById('confirm-no');

        function cleanup() {
            overlay.classList.add('hidden');
            yesBtn.removeEventListener('click', onYes);
            noBtn.removeEventListener('click', onNo);
        }
        function onYes() { cleanup(); resolve(true); }
        function onNo()  { cleanup(); resolve(false); }

        yesBtn.addEventListener('click', onYes);
        noBtn.addEventListener('click', onNo);
    });
}

/**
 * Build an HTML table for a list of contacts.
 * @param {Array} contacts
 * @param {Object} opts - { showOwner: bool, showCheckbox: bool }
 */
function buildContactTable(contacts, opts = {}) {
    let html = '<table class="data-table"><thead><tr>';
    if (opts.showCheckbox) {
        html += '<th><input type="checkbox" id="select-all-cb" class="row-checkbox"></th>';
    }
    html += '<th>Name</th><th>Email</th><th>Phone</th><th>Category</th><th>Status</th>';
    if (opts.showOwner) html += '<th>Owner</th>';
    html += '<th>Date</th><th>Actions</th></tr></thead><tbody>';

    contacts.forEach(c => {
        const ownerUser = opts.showOwner ? Storage.getById(Storage.KEYS.USERS, c.userId) : null;
        html += '<tr>';
        if (opts.showCheckbox) {
            html += `<td data-label="Select"><input type="checkbox" class="row-checkbox" data-id="${c.id}"></td>`;
        }
        html += `
            <td data-label="Name">${escapeHtml(c.firstName)} ${escapeHtml(c.lastName)}</td>
            <td data-label="Email">${escapeHtml(c.email)}</td>
            <td data-label="Phone">${escapeHtml(c.phone)}</td>
            <td data-label="Category">${escapeHtml(c.category)}</td>
            <td data-label="Status"><span class="status-badge ${statusClass(c.status)}">${c.status}</span></td>`;
        if (opts.showOwner) {
            html += `<td data-label="Owner">${ownerUser ? escapeHtml(ownerUser.name) : 'Unknown'}</td>`;
        }
        html += `
            <td data-label="Date">${formatDate(c.createdAt)}</td>
            <td data-label="Actions">
                <div class="actions">
                    <button class="btn btn-primary btn-sm action-view" data-id="${c.id}">View</button>
                    <button class="btn btn-outline btn-sm action-edit" data-id="${c.id}">Edit</button>
                    <button class="btn btn-danger btn-sm action-delete" data-id="${c.id}">Delete</button>
                </div>
            </td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    return html;
}

// ────────── Page Navigation ──────────

let currentContactId = null; // tracks which contact is being viewed/edited

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    // Show target
    const target = document.getElementById('page-' + pageName);
    if (target) target.classList.remove('hidden');

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageName);
    });

    // Page-specific init
    switch (pageName) {
        case 'dashboard':
            Dashboard.render();
            break;
        case 'contacts':
            renderContactsList();
            break;
        case 'add-contact':
            resetContactForm();
            break;
        case 'profile':
            loadProfile();
            break;
        case 'admin':
            if (!Auth.isAdmin()) { showPage('dashboard'); return; }
            Admin.renderContacts();
            Admin.renderUsers();
            break;
    }
}

// ────────── Contact List Page ──────────

function renderContactsList() {
    const session = Auth.getSession();
    const search = document.getElementById('search-input').value;
    const status = document.getElementById('filter-status').value;
    const category = document.getElementById('filter-category').value;

    const contacts = Contacts.getFiltered({
        userId: Auth.isAdmin() ? null : session.userId,
        search,
        status,
        category,
    });

    const container = document.getElementById('contacts-list');
    if (contacts.length === 0) {
        container.innerHTML = '<p class="empty-state">No contacts found.</p>';
        return;
    }

    container.innerHTML = buildContactTable(contacts, { showOwner: Auth.isAdmin() });
}

// ────────── Contact Form (Add/Edit) ──────────

function resetContactForm() {
    const form = document.getElementById('contact-form');
    form.reset();
    document.getElementById('contact-id').value = '';
    document.getElementById('contact-form-title').textContent = 'Add New Contact';
    document.getElementById('contact-submit-btn').textContent = 'Submit Contact';
    document.getElementById('msg-char-count').textContent = '0';
    Validate.clearErrors(form);
}

function loadContactIntoForm(id) {
    const contact = Contacts.getById(id);
    if (!contact) return;
    document.getElementById('contact-id').value = contact.id;
    document.getElementById('contact-first-name').value = contact.firstName;
    document.getElementById('contact-last-name').value = contact.lastName;
    document.getElementById('contact-email').value = contact.email;
    document.getElementById('contact-phone').value = contact.phone;
    document.getElementById('contact-category').value = contact.category;
    document.getElementById('contact-status').value = contact.status;
    document.getElementById('contact-message').value = contact.message || '';
    document.getElementById('msg-char-count').textContent = (contact.message || '').length;
    document.getElementById('contact-form-title').textContent = 'Edit Contact';
    document.getElementById('contact-submit-btn').textContent = 'Update Contact';
    showPage('add-contact');
}

function validateContactForm() {
    const form = document.getElementById('contact-form');
    Validate.clearErrors(form);
    let valid = true;

    const fields = [
        { id: 'contact-first-name', checks: [v => Validate.required(v, 'First name'), v => Validate.maxLength(v, 50, 'First name')] },
        { id: 'contact-last-name',  checks: [v => Validate.required(v, 'Last name'), v => Validate.maxLength(v, 50, 'Last name')] },
        { id: 'contact-email',      checks: [v => Validate.required(v, 'Email'), v => Validate.email(v)] },
        { id: 'contact-phone',      checks: [v => Validate.required(v, 'Phone'), v => Validate.phone(v)] },
    ];

    fields.forEach(f => {
        const value = document.getElementById(f.id).value.trim();
        const result = Validate.run(value, f.checks);
        if (!result.valid) {
            Validate.showError(f.id, result.message);
            valid = false;
        }
    });

    return valid;
}

function submitContactForm() {
    if (!validateContactForm()) return;

    const id = document.getElementById('contact-id').value;
    const data = {
        firstName: document.getElementById('contact-first-name').value,
        lastName: document.getElementById('contact-last-name').value,
        email: document.getElementById('contact-email').value,
        phone: document.getElementById('contact-phone').value,
        category: document.getElementById('contact-category').value,
        status: document.getElementById('contact-status').value,
        message: document.getElementById('contact-message').value,
    };

    if (id) {
        Contacts.update(id, data);
        showToast('Contact updated successfully!', 'success');
    } else {
        Contacts.create(data);
        showToast('Contact created successfully!', 'success');
    }

    showPage('contacts');
}

// ────────── View Contact Detail ──────────

function showContactDetail(id) {
    const contact = Contacts.getById(id);
    if (!contact) { showToast('Contact not found.', 'error'); return; }

    currentContactId = id;
    document.getElementById('view-contact-name').textContent = contact.firstName + ' ' + contact.lastName;
    document.getElementById('view-contact-email').textContent = contact.email;
    document.getElementById('view-contact-phone').textContent = contact.phone;
    document.getElementById('view-contact-category').textContent = contact.category;

    const statusEl = document.getElementById('view-contact-status');
    statusEl.textContent = contact.status;
    statusEl.className = 'status-badge ' + statusClass(contact.status);

    document.getElementById('view-contact-message').textContent = contact.message || '—';
    document.getElementById('view-contact-created').textContent = formatDate(contact.createdAt);
    document.getElementById('view-contact-updated').textContent = formatDate(contact.updatedAt);

    // Hide all pages, show detail
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-view-contact').classList.remove('hidden');
}

// ────────── Profile Page ──────────

function loadProfile() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    document.getElementById('profile-name').value = user.name;
    document.getElementById('profile-email').value = user.email;
    document.getElementById('profile-phone').value = user.phone || '';
    document.getElementById('profile-bio').value = user.bio || '';
    document.getElementById('profile-role').textContent = user.role;
}

function submitProfileForm() {
    const name = document.getElementById('profile-name').value.trim();
    const form = document.getElementById('profile-form');
    Validate.clearErrors(form);

    const nameCheck = Validate.run(name, [
        v => Validate.required(v, 'Name'),
        v => Validate.minLength(v, 2, 'Name'),
    ]);
    if (!nameCheck.valid) {
        Validate.showError('profile-name', nameCheck.message);
        return;
    }

    Auth.updateProfile({
        name,
        phone: document.getElementById('profile-phone').value.trim(),
        bio: document.getElementById('profile-bio').value.trim(),
    });

    // Update sidebar username
    document.getElementById('current-user-name').textContent = name;
    showToast('Profile updated!', 'success');
}

// ────────── Auth Forms ──────────

function validateLoginForm() {
    const form = document.getElementById('login-form');
    Validate.clearErrors(form);
    let valid = true;

    const email = document.getElementById('login-email').value.trim();
    const pw = document.getElementById('login-password').value;

    const emailResult = Validate.run(email, [v => Validate.required(v, 'Email'), v => Validate.email(v)]);
    if (!emailResult.valid) { Validate.showError('login-email', emailResult.message); valid = false; }

    const pwResult = Validate.required(pw, 'Password');
    if (!pwResult.valid) { Validate.showError('login-password', pwResult.message); valid = false; }

    return valid;
}

function validateRegisterForm() {
    const form = document.getElementById('register-form');
    Validate.clearErrors(form);
    let valid = true;

    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const pw = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    const checks = [
        { id: 'reg-name', result: Validate.run(name, [v => Validate.required(v, 'Name'), v => Validate.minLength(v, 2, 'Name')]) },
        { id: 'reg-email', result: Validate.run(email, [v => Validate.required(v, 'Email'), v => Validate.email(v)]) },
        { id: 'reg-password', result: Validate.run(pw, [v => Validate.required(v, 'Password'), v => Validate.minLength(v, 6, 'Password')]) },
        { id: 'reg-confirm', result: Validate.passwordsMatch(pw, confirm) },
    ];

    checks.forEach(c => {
        if (!c.result.valid) {
            Validate.showError(c.id, c.result.message);
            valid = false;
        }
    });

    return valid;
}

// ────────── Event Binding ──────────

document.addEventListener('DOMContentLoaded', () => {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    // ----- Check if already logged in -----
    if (Auth.isLoggedIn()) {
        enterApp();
    }

    // ----- Auth: Toggle login/register -----
    document.getElementById('show-register').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
    });

    document.getElementById('show-login').addEventListener('click', e => {
        e.preventDefault();
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
    });

    // ----- Login submit -----
    document.getElementById('login-form').addEventListener('submit', e => {
        e.preventDefault();
        if (!validateLoginForm()) return;

        const result = Auth.login(
            document.getElementById('login-email').value,
            document.getElementById('login-password').value
        );

        if (result.success) {
            showToast(result.message, 'success');
            enterApp();
        } else {
            showToast(result.message, 'error');
        }
    });

    // ----- Register submit -----
    document.getElementById('register-form').addEventListener('submit', e => {
        e.preventDefault();
        if (!validateRegisterForm()) return;

        const result = Auth.register({
            name: document.getElementById('reg-name').value.trim(),
            email: document.getElementById('reg-email').value.trim(),
            password: document.getElementById('reg-password').value,
            role: document.getElementById('reg-admin').checked ? 'admin' : 'user',
        });

        if (result.success) {
            showToast(result.message, 'success');
            // Auto-login after registration
            Auth.login(result.user.email, result.user.password);
            enterApp();
        } else {
            showToast(result.message, 'error');
        }
    });

    // ----- Logout -----
    document.getElementById('logout-btn').addEventListener('click', () => {
        Auth.logout();
        appContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        // Reset forms
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        document.getElementById('register-form').classList.add('hidden');
        document.getElementById('login-form').classList.remove('hidden');
        showToast('Logged out.', 'info');
    });

    // ----- Sidebar navigation -----
    document.body.addEventListener('click', e => {
        const link = e.target.closest('[data-page]');
        if (link) {
            e.preventDefault();
            showPage(link.dataset.page);
            // Close mobile menu
            document.querySelector('.nav-links').classList.remove('open');
        }
    });

    // ----- Mobile sidebar toggle -----
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        document.querySelector('.nav-links').classList.toggle('open');
    });

    // ----- Contact form submit -----
    document.getElementById('contact-form').addEventListener('submit', e => {
        e.preventDefault();
        submitContactForm();
    });

    // ----- Contact form cancel -----
    document.getElementById('contact-cancel-btn').addEventListener('click', () => {
        showPage('contacts');
    });

    // ----- Character counter for message textarea -----
    document.getElementById('contact-message').addEventListener('input', e => {
        document.getElementById('msg-char-count').textContent = e.target.value.length;
    });

    // ----- Profile form submit -----
    document.getElementById('profile-form').addEventListener('submit', e => {
        e.preventDefault();
        submitProfileForm();
    });

    // ----- Contact list: search & filter (debounced) -----
    let searchTimeout = null;
    document.getElementById('search-input').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(renderContactsList, 300);
    });
    document.getElementById('filter-status').addEventListener('change', renderContactsList);
    document.getElementById('filter-category').addEventListener('change', renderContactsList);

    // ----- Admin search & filter -----
    document.getElementById('admin-search-input').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            Admin.renderContacts(
                document.getElementById('admin-search-input').value,
                document.getElementById('admin-filter-status').value
            );
        }, 300);
    });
    document.getElementById('admin-filter-status').addEventListener('change', () => {
        Admin.renderContacts(
            document.getElementById('admin-search-input').value,
            document.getElementById('admin-filter-status').value
        );
    });

    // ----- Admin delete selected -----
    document.getElementById('admin-delete-selected').addEventListener('click', async () => {
        const yes = await confirmAction('Delete Contacts', 'Delete all selected contacts? This cannot be undone.');
        if (yes) Admin.deleteSelected();
    });

    // ----- Admin tabs -----
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById(btn.dataset.tab).classList.remove('hidden');
        });
    });

    // ----- Delegated click handlers for table action buttons -----
    document.body.addEventListener('click', async e => {
        const viewBtn = e.target.closest('.action-view');
        const editBtn = e.target.closest('.action-edit');
        const deleteBtn = e.target.closest('.action-delete');

        if (viewBtn) {
            showContactDetail(viewBtn.dataset.id);
        } else if (editBtn) {
            loadContactIntoForm(editBtn.dataset.id);
        } else if (deleteBtn) {
            const yes = await confirmAction('Delete Contact', 'Are you sure you want to delete this contact?');
            if (yes) {
                Contacts.remove(deleteBtn.dataset.id);
                showToast('Contact deleted.', 'success');
                // Refresh whichever list is visible
                if (!document.getElementById('page-admin').classList.contains('hidden')) {
                    Admin.renderContacts(
                        document.getElementById('admin-search-input').value,
                        document.getElementById('admin-filter-status').value
                    );
                } else {
                    renderContactsList();
                }
            }
        }
    });

    // ----- Select-all checkbox (admin) -----
    document.body.addEventListener('change', e => {
        if (e.target.id === 'select-all-cb') {
            const checked = e.target.checked;
            document.querySelectorAll('#admin-contacts-list .row-checkbox').forEach(cb => {
                if (cb.id !== 'select-all-cb') cb.checked = checked;
            });
        }
    });

    // ----- View Contact: Edit / Delete / Back -----
    document.getElementById('edit-contact-btn').addEventListener('click', () => {
        if (currentContactId) loadContactIntoForm(currentContactId);
    });

    document.getElementById('delete-contact-btn').addEventListener('click', async () => {
        if (!currentContactId) return;
        const yes = await confirmAction('Delete Contact', 'Are you sure you want to delete this contact?');
        if (yes) {
            Contacts.remove(currentContactId);
            showToast('Contact deleted.', 'success');
            showPage('contacts');
        }
    });

    document.getElementById('back-contacts-btn').addEventListener('click', () => {
        showPage('contacts');
    });

    // ----- Enter app -----
    function enterApp() {
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');

        const session = Auth.getSession();
        document.getElementById('current-user-name').textContent = session.name;

        // Show/hide admin nav
        if (Auth.isAdmin()) {
            document.getElementById('admin-nav').classList.remove('hidden');
        } else {
            document.getElementById('admin-nav').classList.add('hidden');
        }

        showPage('dashboard');
    }
});
