(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
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

        // ROLE-BASED GUARD: pages with data-require-admin are limited to admins.
        if ($('body').attr('data-require-admin') === 'true' && !Auth.isAdmin()) {
            window.location.replace('index.html?forbidden=1');
            return;
        }

        // ROLE-BASED GUARD: admins use the admin dashboard instead of the member dashboard.
        if ($('body').attr('data-user-dashboard') === 'true' && Auth.isAdmin()) {
            window.location.replace('admin-dashboard.html');
            return;
        }

        $('#app-shell').removeClass('hidden');

        name = user.full_name || 'there';
        $('[data-user-name]').text(name);
        $('[data-user-role]').text(user.role === 'admin' ? 'Administrator' : 'Member');
        $('[data-user-initials]').text(name.charAt(0).toUpperCase());

        // ROLE-BASED GUARD: admin-only elements start hidden and are shown here.
        if (user.role === 'admin') {
            $('[data-admin-only]').removeClass('hidden').removeAttr('hidden');
            $('[data-member-only]').addClass('hidden');
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

        if (page === 'event-detail.html') {
            $('[data-nav="events.html"]').addClass('bg-slate-800 text-white');
        }

        if (page === 'announcement-detail.html' || page === 'announcement-form.html') {
            $('[data-nav="announcements.html"]').addClass('bg-slate-800 text-white');
        }

        if (page === 'promo-detail.html' || page === 'promo-form.html') {
            $('[data-nav="promos.html"]').addClass('bg-slate-800 text-white');
        }

        $('[data-logout]').on('click', function () {
            Auth.logout();
        });

        loadNotificationCount();

        function loadNotificationCount() {
            API.get('/notifications')
                .done(function (response) {
                    var notifications = response.data || [];
                    var unread = 0;
                    var badge = $('[data-notification-count]');
                    var i;

                    for (i = 0; i < notifications.length; i++) {
                        if (notifications[i].read === false) {
                            unread++;
                        }
                    }

                    if (unread > 0) {
                        badge.text(unread).removeClass('hidden');
                    } else {
                        badge.text('').addClass('hidden');
                    }
                });
        }

        window.CivicApp = {
            refreshNotificationCount: loadNotificationCount
        };
    });
})(window, window.jQuery);
