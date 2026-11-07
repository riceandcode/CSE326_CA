/* =========================================================
   validation.js — Shared form validators
   ========================================================= */

const Validate = (() => {

    /** Check that a value is non-empty after trimming. */
    function required(value, fieldName) {
        if (!value || !value.toString().trim()) {
            return { valid: false, message: `${fieldName} is required.` };
        }
        return { valid: true };
    }

    /** Check email format. */
    function email(value) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!re.test(value)) {
            return { valid: false, message: 'Please enter a valid email address.' };
        }
        return { valid: true };
    }

    /** Minimum length. */
    function minLength(value, min, fieldName) {
        if (value.length < min) {
            return { valid: false, message: `${fieldName} must be at least ${min} characters.` };
        }
        return { valid: true };
    }

    /** Maximum length. */
    function maxLength(value, max, fieldName) {
        if (value.length > max) {
            return { valid: false, message: `${fieldName} must be at most ${max} characters.` };
        }
        return { valid: true };
    }

    /** Phone validation (digits, spaces, dashes, parentheses, + allowed). */
    function phone(value) {
        const re = /^[+]?[\d\s()-]{7,20}$/;
        if (!re.test(value)) {
            return { valid: false, message: 'Please enter a valid phone number.' };
        }
        return { valid: true };
    }

    /** Passwords match. */
    function passwordsMatch(pw, confirm) {
        if (pw !== confirm) {
            return { valid: false, message: 'Passwords do not match.' };
        }
        return { valid: true };
    }

    /**
     * Run multiple validations on a value. Returns first failure or { valid: true }.
     * Usage: Validate.run(value, [ v => Validate.required(v, 'Name'), v => Validate.minLength(v, 2, 'Name') ])
     */
    function run(value, validators) {
        for (const fn of validators) {
            const result = fn(value);
            if (!result.valid) return result;
        }
        return { valid: true };
    }

    /**
     * Show/clear inline error for a field.
     * @param {string} inputId - The input element's id
     * @param {string} message - Error message (empty string to clear)
     */
    function showError(inputId, message) {
        const input = document.getElementById(inputId);
        const errorEl = document.getElementById(inputId + '-error');
        if (errorEl) errorEl.textContent = message;
        if (input) {
            if (message) {
                input.classList.add('invalid');
            } else {
                input.classList.remove('invalid');
            }
        }
    }

    /** Clear all error messages inside a form. */
    function clearErrors(formEl) {
        formEl.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
        formEl.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
    }

    return { required, email, minLength, maxLength, phone, passwordsMatch, run, showError, clearErrors };
})();
