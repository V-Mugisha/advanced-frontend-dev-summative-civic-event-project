(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;

        if (!Auth.isAuthenticated() || Auth.isAdmin()) {
            return;
        }

        if (window.location.search.indexOf('welcome=1') !== -1) {
            UI.showMessage('page-message', 'Signed in successfully.', 'success');
        } else if (window.location.search.indexOf('forbidden=1') !== -1) {
            UI.showMessage('page-message', 'You do not have permission to open that page.', 'error');
        }

        $('#api-base').text(window.CivicConfig.apiBaseUrl);

        API.get('/dashboard/me')
            .done(function (response) {
                var data = response.data || {};
                var registrations = data.registrations || {};
                var feedbacks = data.feedbacks || {};
                var notifications = data.notifications || {};

                $('#stat-registered').text(registrations.total_registered_events || 0);
                $('#stat-feedback').text(feedbacks.total_feedbacks || 0);
                $('#stat-unread').text(notifications.unread_notifications || 0);
            })
            .fail(function (xhr) {
                UI.showMessage('dashboard-message', API.error(xhr).message, 'error');
            });
    });
})(window, window.jQuery);
