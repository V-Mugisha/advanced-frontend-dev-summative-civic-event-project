(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var registrations = [];

        // ROLE-BASED GUARD: admins do not register for events.
        if (!Auth.isAuthenticated() || Auth.isAdmin()) {
            return;
        }

        loadRegistrations();

        function loadRegistrations() {
            $('#registrations-loading').removeClass('hidden');
            $('#registrations-empty').addClass('hidden');
            $('#registrations-list').empty();

            API.get('/event-registrations/my-registrations')
                .done(function (response) {
                    var rows = response.data || [];
                    var i;

                    registrations = [];

                    for (i = 0; i < rows.length; i++) {
                        if (rows[i].status === 'registered') {
                            registrations.push(rows[i]);
                        }
                    }

                    $('#registrations-loading').addClass('hidden');
                    renderRegistrations();
                })
                .fail(function (xhr) {
                    $('#registrations-loading').addClass('hidden');
                    UI.showMessage('registrations-message', API.error(xhr).message, 'error');
                });
        }

        function renderRegistrations() {
            var list = $('#registrations-list');
            var i;

            list.empty();

            if (!registrations.length) {
                $('#registrations-empty').removeClass('hidden');
                return;
            }

            $('#registrations-empty').addClass('hidden');

            for (i = 0; i < registrations.length; i++) {
                list.append(renderRegistration(registrations[i]));
            }
        }

        function renderRegistration(registration) {
            var card = $('<article>').addClass('rounded-lg border border-slate-700 bg-slate-900 p-5');
            var cancelButton = $('<button>')
                .attr('type', 'button')
                .addClass('mt-4 rounded-md border border-rose-700 px-3 py-2 text-sm font-medium text-rose-200 hover:bg-rose-950 focus:outline-none focus:ring-2 focus:ring-rose-400 disabled:opacity-60')
                .text('Cancel registration');

            card.append(
                $('<a>')
                    .attr('href', 'event-detail.html?id=' + encodeURIComponent(registration.event_id))
                    .addClass('text-lg font-semibold text-white hover:text-cyan-300')
                    .text(registration.title || 'Untitled event')
            );
            card.append($('<p>').addClass('mt-2 text-sm text-slate-300').text(formatDates(registration)));
            card.append($('<p>').addClass('mt-1 text-sm text-slate-400').text(registration.location || 'Location not specified'));

            cancelButton.on('click', function () {
                cancelRegistration(registration, cancelButton);
            });

            card.append(cancelButton);
            return card;
        }

        function cancelRegistration(registration, button) {
            if (!window.confirm('Cancel your registration for this event?')) {
                return;
            }

            UI.setLoading(button[0], true, 'Cancelling...');

            API.post('/event-registrations/cancel', { event_id: registration.event_id })
                .done(function () {
                    UI.setLoading(button[0], false);
                    UI.showMessage('registrations-message', 'Registration cancelled.', 'success');
                    loadRegistrations();
                })
                .fail(function (xhr) {
                    UI.setLoading(button[0], false);
                    UI.showMessage('registrations-message', API.error(xhr).message, 'error');
                });
        }

        function formatDates(registration) {
            var starts = registration.starts_at ? new Date(registration.starts_at).toLocaleString() : 'Date not set';
            var ends = registration.ends_at ? new Date(registration.ends_at).toLocaleString() : '';

            if (ends) {
                return starts + ' to ' + ends;
            }

            return starts;
        }
    });
})(window, window.jQuery);
