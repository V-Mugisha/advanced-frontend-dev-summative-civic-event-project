(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var user = Auth.getUser() || {};
        var eventId = getQuery('id');
        var registerButton = $('#register-button');
        var cancelButton = $('#cancel-button');

        if (!Auth.isAuthenticated()) {
            return;
        }

        if (!eventId) {
            $('#detail-loading').addClass('hidden');
            UI.showMessage('detail-message', 'The event id is missing from the page address.', 'error');
            return;
        }

        loadEvent();

        function getQuery(name) {
            var parts = window.location.search.replace('?', '').split('&');
            var i;
            var pair;

            for (i = 0; i < parts.length; i++) {
                pair = parts[i].split('=');

                if (decodeURIComponent(pair[0]) === name) {
                    return decodeURIComponent((pair[1] || '').replace(/\+/g, ' '));
                }
            }

            return '';
        }

        function loadEvent() {
            API.get('/events/' + encodeURIComponent(eventId))
                .done(function (response) {
                    renderEvent(response.data || {});
                    loadRegistration();
                })
                .fail(function (xhr) {
                    $('#detail-loading').addClass('hidden');
                    UI.showMessage('detail-message', API.error(xhr).message, 'error');
                });
        }

        function renderEvent(event) {
            var imageUrl = event.metadata && event.metadata.image_url ? event.metadata.image_url : '';
            var location = event.location || '';
            var dates = 'Starts ' + formatDate(event.starts_at);

            if (event.ends_at) {
                dates = dates + ' | Ends ' + formatDate(event.ends_at);
            }

            $('#detail-loading').addClass('hidden');
            $('#event-detail').removeClass('hidden');
            $('#event-title').text(event.title || 'Untitled event');
            $('#event-dates').text(dates);
            $('#event-location').text(location || 'Location not specified');
            $('#event-description').text(event.description || 'No description provided.');

            if (imageUrl) {
                $('#event-image').attr('src', imageUrl).attr('alt', event.title || 'Event image').removeClass('hidden');
            } else {
                $('#event-image-placeholder').removeClass('hidden').addClass('flex');
            }

            if (location) {
                $('#event-map')
                    .attr('href', 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(location))
                    .removeClass('hidden');
            }

            if (user.role === 'admin') {
                loadAttendees();
            }
        }

        function formatDate(value) {
            var date;

            if (!value) {
                return 'Date not set';
            }

            date = new Date(value);

            if (isNaN(date.getTime())) {
                return 'Date not set';
            }

            return date.toLocaleString();
        }

        function loadRegistration() {
            API.get('/event-registrations/my-registrations')
                .done(function (response) {
                    var registrations = response.data || [];
                    var registration = null;
                    var i;

                    for (i = 0; i < registrations.length; i++) {
                        if (registrations[i].event_id === eventId) {
                            registration = registrations[i];
                            break;
                        }
                    }

                    registerButton.addClass('hidden');
                    cancelButton.addClass('hidden');

                    if (registration && registration.status === 'registered') {
                        $('#registration-help').text('You are registered for this event.');
                        cancelButton.removeClass('hidden');
                    } else if (registration && registration.status === 'cancelled') {
                        $('#registration-help').text('Your registration was cancelled. The API does not allow registering again for the same event.');
                    } else {
                        $('#registration-help').text('Registration is open for this event.');
                        registerButton.removeClass('hidden');
                    }
                })
                .fail(function (xhr) {
                    UI.showMessage('registration-message', API.error(xhr).message, 'error');
                });
        }

        function registerForEvent() {
            UI.setLoading(registerButton[0], true, 'Registering...');

            API.post('/event-registrations/register', { event_id: eventId })
                .done(function () {
                    UI.setLoading(registerButton[0], false);
                    UI.showMessage('registration-message', 'You are registered for this event.', 'success');
                    loadRegistration();
                })
                .fail(function (xhr) {
                    UI.setLoading(registerButton[0], false);
                    UI.showMessage('registration-message', API.error(xhr).message, 'error');
                    loadRegistration();
                });
        }

        function cancelRegistration() {
            UI.setLoading(cancelButton[0], true, 'Cancelling...');

            API.post('/event-registrations/cancel', { event_id: eventId })
                .done(function () {
                    UI.setLoading(cancelButton[0], false);
                    UI.showMessage('registration-message', 'Your registration was cancelled.', 'success');
                    loadRegistration();
                })
                .fail(function (xhr) {
                    UI.setLoading(cancelButton[0], false);
                    UI.showMessage('registration-message', API.error(xhr).message, 'error');
                    loadRegistration();
                });
        }

        function loadAttendees() {
            // ROLE-BASED GUARD: attendee data is only requested for admins.
            if (user.role !== 'admin') {
                return;
            }

            API.get('/event-registrations/event/' + encodeURIComponent(eventId) + '/attendees')
                .done(function (response) {
                    var attendees = response.data || [];
                    var list = $('#attendees-list');
                    var i;

                    list.empty();

                    if (!attendees.length) {
                        list.append($('<li>').addClass('text-slate-400').text('No attendees yet.'));
                        return;
                    }

                    for (i = 0; i < attendees.length; i++) {
                        list.append(
                            $('<li>')
                                .addClass('rounded-md border border-slate-700 bg-slate-900 px-3 py-2')
                                .text((attendees[i].full_name || 'Unnamed attendee') + ' (' + (attendees[i].email || 'no email') + ')')
                        );
                    }
                })
                .fail(function (xhr) {
                    UI.showMessage('attendees-message', API.error(xhr).message, 'error');
                });
        }

        registerButton.on('click', registerForEvent);
        cancelButton.on('click', cancelRegistration);
    });
})(window, window.jQuery);
