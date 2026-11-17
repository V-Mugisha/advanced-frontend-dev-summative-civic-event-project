(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;

        // ROLE-BASED GUARD: only admins can load dashboard statistics.
        if (!Auth.requireAdmin()) {
            return;
        }

        if (window.location.search.indexOf('welcome=1') !== -1) {
            UI.showMessage('admin-dashboard-message', 'Signed in successfully.', 'success');
        }

        loadDashboard();

        function loadDashboard() {
            API.get('/dashboard/admin')
                .done(function (response) {
                    var data = response.data || {};
                    var users = data.users || {};
                    var events = data.events || {};
                    var registrations = data.registrations || {};
                    var feedbacks = data.feedbacks || {};
                    var promos = data.promos || {};
                    var announcements = data.announcements || {};
                    var notifications = data.notifications || {};

                    $('#stat-total-users').text(users.total_users || 0);
                    $('#stat-active-users').text(users.active_users || 0);
                    $('#stat-inactive-users').text(users.inactive_users || 0);
                    $('#stat-total-events').text(events.total_events || 0);
                    $('#stat-upcoming-events').text(events.upcoming_events || 0);
                    $('#stat-past-events').text(events.past_events || 0);
                    $('#stat-registrations').text(registrations.total_registrations || 0);
                    $('#stat-feedback').text(feedbacks.total_feedback || 0);
                    $('#stat-promos').text(promos.total_promos || 0);
                    $('#stat-announcements').text(announcements.total_announcements || 0);
                    $('#stat-notifications').text(notifications.total_notifications || 0);

                    renderGrowth(data.user_growth || []);
                    $('#admin-dashboard-loading').addClass('hidden');
                    $('#admin-dashboard-content').removeClass('hidden');
                })
                .fail(function (xhr) {
                    $('#admin-dashboard-loading').addClass('hidden');
                    UI.showMessage('admin-dashboard-message', API.error(xhr).message, 'error');
                });
        }

        function renderGrowth(growth) {
            var chart = $('#growth-chart');
            var max = 0;
            var i;
            var value;
            var height;
            var column;
            var bar;
            var label;

            chart.empty();

            if (!growth.length) {
                $('#growth-empty').removeClass('hidden');
                return;
            }

            $('#growth-empty').addClass('hidden');

            for (i = 0; i < growth.length; i++) {
                value = Number(growth[i].new_users) || 0;

                if (value > max) {
                    max = value;
                }
            }

            for (i = 0; i < growth.length; i++) {
                value = Number(growth[i].new_users) || 0;
                height = max > 0 ? Math.round((value / max) * 140) : 0;

                column = $('<div>').addClass('flex flex-1 flex-col items-center justify-end gap-1');
                bar = $('<div>')
                    .addClass('w-full rounded-t bg-cyan-400')
                    .css('height', height + 'px')
                    .attr('title', (growth[i].month || '') + ': ' + value + ' new users');
                label = $('<span>').addClass('text-xs text-slate-500').text(growth[i].month || '');

                column.append($('<span>').addClass('text-xs text-slate-400').text(value));
                column.append(bar);
                column.append(label);
                chart.append(column);
            }
        }
    });
})(window, window.jQuery);
