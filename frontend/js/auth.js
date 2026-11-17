(function (window) {
    'use strict';

    var TOKEN_KEY = 'civicevents.token';
    var USER_KEY = 'civicevents.user';
    var LOGIN_TIME_KEY = 'civicevents.loginTime';
    var SESSION_LENGTH = 60 * 60 * 1000;

    function getToken() {
        var token = window.sessionStorage.getItem(TOKEN_KEY);

        if (token) {
            return token;
        }

        return window.localStorage.getItem(TOKEN_KEY);
    }

    function getUser() {
        var raw = window.sessionStorage.getItem(USER_KEY);

        if (!raw) {
            raw = window.localStorage.getItem(USER_KEY);
        }

        if (!raw) {
            return null;
        }

        try {
            return JSON.parse(raw);
        } catch (error) {
            return null;
        }
    }

    function saveSession(user, token, remember) {
        var storage = remember ? window.localStorage : window.sessionStorage;

        clearSession();
        storage.setItem(TOKEN_KEY, token);
        storage.setItem(
            USER_KEY,
            JSON.stringify({
                id: user.id,
                full_name: user.full_name,
                role: user.role
            })
        );
        storage.setItem(LOGIN_TIME_KEY, String(Date.now()));
    }

    function clearSession() {
        window.sessionStorage.removeItem(TOKEN_KEY);
        window.sessionStorage.removeItem(USER_KEY);
        window.sessionStorage.removeItem(LOGIN_TIME_KEY);
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        window.localStorage.removeItem(LOGIN_TIME_KEY);
    }

    function getLoginTime() {
        var value = window.sessionStorage.getItem(LOGIN_TIME_KEY);

        if (!value) {
            value = window.localStorage.getItem(LOGIN_TIME_KEY);
        }

        return parseInt(value, 10) || 0;
    }

    function isAuthenticated() {
        var token = getToken();
        var loginTime = getLoginTime();

        if (!token || !loginTime || Date.now() - loginTime > SESSION_LENGTH) {
            if (token) {
                clearSession();
            }

            return false;
        }

        return true;
    }

    // AUTH GUARD: protected pages call this before showing user data.
    function requireAuth() {
        if (!getToken()) {
            window.location.replace('login.html?signin=1');
            return false;
        }

        if (!isAuthenticated()) {
            window.location.replace('login.html?expired=1');
            return false;
        }

        return true;
    }

    function isAdmin() {
        var user = getUser();
        return user !== null && user.role === 'admin';
    }

    // ROLE-BASED GUARD: admin pages call this before loading admin data.
    function requireAdmin() {
        if (!requireAuth()) {
            return false;
        }

        if (!isAdmin()) {
            window.location.replace('index.html?forbidden=1');
            return false;
        }

        return true;
    }

    function redirectIfAuthenticated() {
        if (isAuthenticated()) {
            window.location.replace('index.html');
            return true;
        }

        return false;
    }

    function logout() {
        clearSession();
        window.location.href = 'login.html?loggedout=1';
    }

    window.CivicAuth = {
        getToken: getToken,
        getUser: getUser,
        saveSession: saveSession,
        clearSession: clearSession,
        isAuthenticated: isAuthenticated,
        isAdmin: isAdmin,
        requireAuth: requireAuth,
        requireAdmin: requireAdmin,
        redirectIfAuthenticated: redirectIfAuthenticated,
        logout: logout
    };
})(window);
