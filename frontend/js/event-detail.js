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
        var feedbackForm = $('#feedback-form');
        var feedbackSubmit = document.getElementById('feedback-submit');
        var ownFeedback = null;
        var registrationStatus = 'unknown';

        if (!Auth.isAuthenticated()) {
            return;
        }

        if (!eventId) {
            $('#detail-loading').addClass('hidden');
            UI.showMessage('detail-message', 'The event id is missing from the page address.', 'error');
            return;
        }

        if (window.location.search.indexOf('saved=1') !== -1) {
            UI.showMessage('page-message', 'Event saved successfully.', 'success');
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

                    // ROLE-BASED GUARD: admins organize events and do not register or submit feedback.
                    if (user.role === 'admin') {
                        $('#registration-section').addClass('hidden');
                        $('#own-feedback-section').addClass('hidden');
                        loadAttendees();
                        loadAdminFeedback();
                    } else {
                        $('#registration-section').removeClass('hidden');
                        loadRegistration();
                    }
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
            $('#edit-event').attr('href', 'event-form.html?id=' + encodeURIComponent(eventId));

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
                        registrationStatus = 'registered';
                        $('#registration-help').text('You are registered for this event. You can submit feedback below.');
                        cancelButton.removeClass('hidden');
                    } else if (registration && registration.status === 'cancelled') {
                        registrationStatus = 'cancelled';
                        $('#registration-help').text('Your registration was cancelled. The API does not allow registering again for the same event, so feedback is unavailable.');
                    } else {
                        registrationStatus = 'none';
                        $('#registration-help').text('Registration is open for this event. You can submit feedback after registering.');
                        registerButton.removeClass('hidden');
                    }

                    updateFeedbackAccess();
                })
                .fail(function (xhr) {
                    registrationStatus = 'unknown';
                    updateFeedbackAccess();
                    UI.showMessage('registration-message', API.error(xhr).message, 'error');
                });
        }

        function updateFeedbackAccess() {
            // ROLE-BASED GUARD: admins do not submit feedback, and normal users must be registered.
            if (user.role === 'admin') {
                $('#own-feedback-section').addClass('hidden');
                return;
            }

            if (registrationStatus === 'registered') {
                $('#own-feedback-section').removeClass('hidden');
                loadOwnFeedback();
            } else {
                ownFeedback = null;
                $('#own-feedback-section').addClass('hidden');
            }
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

        function loadOwnFeedback() {
            // ROLE-BASED GUARD: only registered normal users submit event feedback.
            if (user.role === 'admin' || registrationStatus !== 'registered') {
                return;
            }

            API.get('/event-feedback/my-feedback')
                .done(function (response) {
                    var feedbacks = response.data || [];
                    var i;

                    ownFeedback = null;

                    for (i = 0; i < feedbacks.length; i++) {
                        if (feedbacks[i].event_id === eventId) {
                            ownFeedback = feedbacks[i];
                            break;
                        }
                    }

                    if (ownFeedback) {
                        $('#feedback-rating').val(String(ownFeedback.rating || 5));
                        $('#feedback-comment').val(ownFeedback.comment || '');
                        $('#feedback-status').text('You rated this event ' + ownFeedback.rating + ' out of 5. You can update your feedback.');
                        $('#feedback-submit').text('Update feedback');
                    } else {
                        $('#feedback-rating').val('5');
                        $('#feedback-comment').val('');
                        $('#feedback-status').text('You have not submitted feedback for this event.');
                        $('#feedback-submit').text('Submit feedback');
                    }

                    feedbackForm.removeClass('hidden');
                })
                .fail(function (xhr) {
                    UI.showMessage('feedback-message', API.error(xhr).message, 'error');
                });
        }

        function submitFeedback(event) {
            var rating = parseInt($('#feedback-rating').val(), 10);
            var comment = $('#feedback-comment').val().trim();
            var request;

            event.preventDefault();

            // ROLE-BASED GUARD: only registered normal users submit event feedback.
            if (user.role === 'admin') {
                return;
            }

            if (registrationStatus !== 'registered') {
                UI.showMessage('registration-message', 'You must be registered for this event to submit feedback.', 'warning');
                return;
            }

            if (!rating || rating < 1 || rating > 5) {
                UI.showMessage('feedback-message', 'Choose a rating between 1 and 5.', 'error');
                return;
            }

            UI.setLoading(feedbackSubmit, true, ownFeedback ? 'Updating...' : 'Submitting...');

            if (ownFeedback) {
                request = API.put('/event-feedback/' + encodeURIComponent(ownFeedback.id), {
                    rating: rating,
                    comment: comment
                });
            } else {
                request = API.post('/event-feedback', {
                    event_id: eventId,
                    rating: rating,
                    comment: comment
                });
            }

            request
                .done(function () {
                    UI.setLoading(feedbackSubmit, false);
                    UI.showMessage('feedback-message', ownFeedback ? 'Feedback updated.' : 'Feedback submitted.', 'success');
                    loadOwnFeedback();
                })
                .fail(function (xhr) {
                    UI.setLoading(feedbackSubmit, false);

                    if (xhr.status === 409) {
                        UI.showMessage('feedback-message', 'You already submitted feedback for this event. Your existing feedback has been loaded.', 'warning');
                        loadOwnFeedback();
                    } else {
                        UI.showMessage('feedback-message', API.error(xhr).message, 'error');
                    }
                });
        }

        // ROLE-BASED GUARD: all-event feedback and the average are admin-only.
        function loadAdminFeedback() {
            if (user.role !== 'admin') {
                return;
            }

            API.get('/event-feedback/event/' + encodeURIComponent(eventId))
                .done(function (response) {
                    var feedbacks = response.data || [];
                    var list = $('#feedback-list');
                    var total = 0;
                    var item;
                    var i;

                    list.empty();

                    if (!feedbacks.length) {
                        $('#feedback-average').text('No ratings yet.');
                        list.append($('<li>').addClass('text-slate-400').text('No feedback yet.'));
                        return;
                    }

                    for (i = 0; i < feedbacks.length; i++) {
                        total = total + (Number(feedbacks[i].rating) || 0);
                        item = $('<li>').addClass('rounded-md border border-slate-700 bg-slate-900 px-3 py-2');
                        item.append(
                            $('<p>')
                                .addClass('font-medium text-slate-200')
                                .text((feedbacks[i].full_name || 'Unknown user') + ' rated ' + feedbacks[i].rating + ' out of 5')
                        );

                        if (feedbacks[i].comment) {
                            item.append($('<p>').addClass('mt-1 text-slate-400').text(feedbacks[i].comment));
                        }

                        item.append($('<p>').addClass('mt-1 text-xs text-slate-500').text(formatDate(feedbacks[i].created_at)));
                        list.append(item);
                    }

                    $('#feedback-average').text('Average rating: ' + (total / feedbacks.length).toFixed(1) + ' out of 5');
                })
                .fail(function (xhr) {
                    UI.showMessage('admin-feedback-message', API.error(xhr).message, 'error');
                });
        }

        function deleteEvent() {
            var button = document.getElementById('delete-event');

            if (!window.confirm('Delete this event? This cannot be undone.')) {
                return;
            }

            UI.setLoading(button, true, 'Deleting...');

            API.del('/events/' + encodeURIComponent(eventId))
                .done(function () {
                    window.location.href = 'events.html?deleted=1';
                })
                .fail(function (xhr) {
                    var message = API.error(xhr).message;

                    UI.setLoading(button, false);

                    if (xhr.status >= 500) {
                        message = 'The event could not be deleted. It may still have registrations.';
                    }

                    UI.showMessage('detail-message', message, 'error');
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
        feedbackForm.on('submit', submitFeedback);
        $('#delete-event').on('click', deleteEvent);
    });
})(window, window.jQuery);
