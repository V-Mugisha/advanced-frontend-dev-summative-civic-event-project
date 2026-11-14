(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var UI = window.CivicUI;
        var user;
        var name;

        // AUTH GUARD: this page is only available to signed-in users.
        if (!Auth.requireAuth()) {
            return;
        }

        user = Auth.getUser();

        if (!user || !user.id) {
            Auth.clearSession();
            window.location.replace('login.html?signin=1');
            return;
        }

        $('#app-shell').removeClass('hidden');
        name = user.full_name || 'there';

        if (window.location.search.indexOf('welcome=1') !== -1) {
            UI.showMessage('page-message', 'Signed in successfully.', 'success');
        }

        $('[data-user-name]').text(name);
        $('[data-user-role]').text(user.role === 'admin' ? 'Administrator' : 'Member');
        $('[data-user-initials]').text(name.charAt(0).toUpperCase());
        $('#api-base').text(window.CivicConfig.apiBaseUrl);

        // ROLE-BASED GUARD: admin-only UI is shown only when role is admin.
        if (user.role === 'admin') {
            $('#admin-note').removeAttr('hidden');
        }

        $('[data-logout]').on('click', function () {
            Auth.logout();
        });
    });
})(window, window.jQuery);
