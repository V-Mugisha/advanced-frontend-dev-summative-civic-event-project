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
            var body = $('#growth-table-body');
            var max = 0;
            var total = 0;
            var i;
            var value;
            var percent;
            var row;
            var barWrap;
            var bar;

            body.empty();
            $('#growth-table-wrap').addClass('hidden');
            $('#growth-empty').addClass('hidden');

            if (!growth.length) {
                $('#growth-total').text(0);
                $('#growth-empty').removeClass('hidden');
                return;
            }

            for (i = 0; i < growth.length; i++) {
                value = Number(growth[i].new_users) || 0;
                total = total + value;

                if (value > max) {
                    max = value;
                }
            }

            $('#growth-total').text(total);
            $('#growth-table-wrap').removeClass('hidden');

            for (i = 0; i < growth.length; i++) {
                value = Number(growth[i].new_users) || 0;
                percent = max > 0 ? Math.round((value / max) * 100) : 0;

                row = $('<tr>');
                row.append($('<td>').addClass('py-2 pr-4 text-slate-300').text(growth[i].month || 'Unknown'));
                row.append($('<td>').addClass('py-2 pr-4 font-medium text-white').text(value));

                barWrap = $('<div>').addClass('h-2 w-32 rounded bg-slate-800');
                bar = $('<div>')
                    .addClass('h-2 rounded bg-cyan-400')
                    .css('width', percent + '%')
                    .attr('title', value + ' new users');
                barWrap.append(bar);
                row.append($('<td>').addClass('py-2').append(barWrap));

                body.append(row);
            }
        }
    });
})(window, window.jQuery);
