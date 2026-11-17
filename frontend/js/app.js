(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var user;
        var name;
        var page;

        // AUTH GUARD: every page that loads app.js requires a valid session.
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
        $('[data-user-name]').text(name);
        $('[data-user-role]').text(user.role === 'admin' ? 'Administrator' : 'Member');
        $('[data-user-initials]').text(name.charAt(0).toUpperCase());

        // ROLE-BASED GUARD: admin-only elements start hidden and are shown here.
        if (user.role === 'admin') {
            $('[data-admin-only]').removeClass('hidden');
        }

        page = window.location.pathname.split('/').pop();

        if (!page) {
            page = 'index.html';
        }

        $('[data-nav]').each(function () {
            if ($(this).attr('href') === page) {
                $(this).addClass('bg-slate-800 text-white');
            }
        });

        if (page.indexOf('event') === 0) {
            $('[data-nav="events.html"]').addClass('bg-slate-800 text-white');
        }

        $('[data-logout]').on('click', function () {
            Auth.logout();
        });
    });
})(window, window.jQuery);
