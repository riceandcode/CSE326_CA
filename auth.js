/* =========================================================
   auth.js — Registration, Login, Logout, Session guards
   ========================================================= */

const Auth = (() => {
    const { KEYS } = Storage;

    /** Register a new user. Returns { success, message } */
    function register({ name, email, password, role }) {
        const users = Storage.getAll(KEYS.USERS);

        // Check duplicate email
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, message: 'An account with this email already exists.' };
        }

        const user = {
            id: Storage.generateId(),
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,                       // Client-side only — no hashing
            role: role || 'user',
            phone: '',
            bio: '',
            createdAt: new Date().toISOString(),
        };

        users.push(user);
        Storage.save(KEYS.USERS, users);

        return { success: true, message: 'Registration successful!', user };
    }

    /** Login. Returns { success, message, user? } */
    function login(email, password) {
        const users = Storage.getAll(KEYS.USERS);
        const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

        if (!user) {
            return { success: false, message: 'No account found with this email.' };
        }
        if (user.password !== password) {
            return { success: false, message: 'Incorrect password.' };
        }

        // Save session
        Storage.setSession({ userId: user.id, name: user.name, email: user.email, role: user.role });
        return { success: true, message: 'Login successful!', user };
    }

    /** Logout — clear session. */
    function logout() {
        Storage.clearSession();
    }

    /** Get current session or null. */
    function getSession() {
        return Storage.getSession();
    }

    /** Check if session exists and is valid. */
    function isLoggedIn() {
        const session = getSession();
        if (!session) return false;
        // Verify user still exists
        const user = Storage.getById(KEYS.USERS, session.userId);
        return !!user;
    }

    /** Check if current user is admin. */
    function isAdmin() {
        const session = getSession();
        return session && session.role === 'admin';
    }

    /** Get full user object for the logged-in user. */
    function getCurrentUser() {
        const session = getSession();
        if (!session) return null;
        return Storage.getById(KEYS.USERS, session.userId);
    }

    /** Update the current user's profile fields. */
    function updateProfile(updates) {
        const session = getSession();
        if (!session) return null;
        const user = Storage.update(KEYS.USERS, session.userId, updates);
        if (user) {
            // Refresh session name
            Storage.setSession({ ...session, name: user.name });
        }
        return user;
    }

    return { register, login, logout, getSession, isLoggedIn, isAdmin, getCurrentUser, updateProfile };
})();
