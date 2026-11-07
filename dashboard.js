/* =========================================================
   dashboard.js — Dashboard stats and recent contacts
   ========================================================= */

const Dashboard = (() => {

    /** Render the dashboard stats and recent contacts table. */
    function render() {
        const session = Auth.getSession();
        const isAdmin = Auth.isAdmin();
        const stats = Contacts.getStats(isAdmin ? null : session.userId);

        document.getElementById('stat-total').textContent = stats.total;
        document.getElementById('stat-pending').textContent = stats.pending;
        document.getElementById('stat-progress').textContent = stats.inProgress;
        document.getElementById('stat-resolved').textContent = stats.resolved;

        // Recent contacts (last 5)
        const recent = Contacts.getFiltered({
            userId: isAdmin ? null : session.userId,
        }).slice(0, 5);

        const container = document.getElementById('recent-contacts');
        if (recent.length === 0) {
            container.innerHTML = '<p class="empty-state">No contacts yet. <a href="#" data-page="add-contact" class="nav-link">Add one now</a>.</p>';
            return;
        }

        container.innerHTML = buildContactTable(recent, { showOwner: isAdmin });
    }

    return { render };
})();
