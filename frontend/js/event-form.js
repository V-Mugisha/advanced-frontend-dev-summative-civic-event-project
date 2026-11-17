(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var eventId = getQuery('id');
        var form = $('#event-form');
        var formElement = form[0];
        var submitButton = document.getElementById('event-submit');
        var imageInput = document.getElementById('image');
        var preview = document.getElementById('image-preview');
        var currentImage = document.getElementById('current-image');
        var heading = document.getElementById('form-heading');
        var loading = $('#form-loading');

        // ROLE-BASED GUARD: only admins can create or edit events.
        if (!Auth.requireAdmin()) {
            return;
        }

        if (eventId) {
            heading.textContent = 'Edit event';
            submitButton.textContent = 'Save changes';
            document.title = 'Edit event | CivicEvents+';
            loadEvent();
        } else {
            heading.textContent = 'Create event';
            submitButton.textContent = 'Create event';
            document.title = 'Create event | CivicEvents+';
        }

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
            loading.removeClass('hidden');

            API.get('/events/' + encodeURIComponent(eventId))
                .done(function (response) {
                    renderEvent(response.data || {});
                    loading.addClass('hidden');
                })
                .fail(function (xhr) {
                    loading.addClass('hidden');
                    UI.showMessage('event-form-message', API.error(xhr).message, 'error');
                });
        }

        function renderEvent(event) {
            var imageUrl = event.metadata && event.metadata.image_url ? event.metadata.image_url : '';

            $('#title').val(event.title || '');
            $('#location').val(event.location || '');
            $('#starts_at').val(toDateTimeLocal(event.starts_at));
            $('#ends_at').val(toDateTimeLocal(event.ends_at));
            $('#description').val(event.description || '');

            if (imageUrl) {
                currentImage.src = imageUrl;
                currentImage.alt = event.title || 'Current event image';
                currentImage.classList.remove('hidden');
            }
        }

        function pad(value) {
            return value < 10 ? '0' + value : String(value);
        }

        function toDateTimeLocal(value) {
            var date;

            if (!value) {
                return '';
            }

            date = new Date(value);

            if (isNaN(date.getTime())) {
                return '';
            }

            return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
                'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
        }

        function toIso(value) {
            var date;

            if (!value) {
                return '';
            }

            date = new Date(value);

            if (isNaN(date.getTime())) {
                return '';
            }

            return date.toISOString();
        }

        function isValidImage(file) {
            var allowed = ['image/jpeg', 'image/png', 'image/gif'];

            if (allowed.indexOf(file.type) === -1) {
                return false;
            }

            return file.size <= 2 * 1024 * 1024;
        }

        imageInput.addEventListener('change', function () {
            var file = imageInput.files[0];
            var reader;

            UI.setFieldError('image', '');
            preview.classList.add('hidden');
            preview.removeAttribute('src');

            if (!file) {
                return;
            }

            if (!isValidImage(file)) {
                UI.setFieldError('image', 'Choose a JPG, PNG, or GIF image up to 2 MB.');
                imageInput.value = '';
                return;
            }

            reader = new FileReader();
            reader.onload = function (event) {
                preview.src = event.target.result;
                preview.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        });

        form.on('submit', function (event) {
            var title = $('#title').val().trim();
            var location = $('#location').val().trim();
            var startsAt = $('#starts_at').val();
            var endsAt = $('#ends_at').val();
            var description = $('#description').val().trim();
            var imageFile = imageInput.files[0];
            var firstInvalid = null;
            var formData;
            var request;

            event.preventDefault();
            UI.clearFieldErrors(formElement);
            UI.clearFormError(formElement);

            function invalid(fieldId, message) {
                UI.setFieldError(fieldId, message);

                if (!firstInvalid) {
                    firstInvalid = fieldId;
                }
            }

            if (!title) {
                invalid('title', 'Enter an event title.');
            }

            if (!location) {
                invalid('location', 'Enter an event location.');
            }

            if (!startsAt) {
                invalid('starts_at', 'Choose a start date and time.');
            }

            if (!endsAt) {
                invalid('ends_at', 'Choose an end date and time.');
            } else if (startsAt && new Date(endsAt) <= new Date(startsAt)) {
                invalid('ends_at', 'The end time must be after the start time.');
            }

            if (imageFile && !isValidImage(imageFile)) {
                invalid('image', 'Choose a JPG, PNG, or GIF image up to 2 MB.');
            }

            if (firstInvalid) {
                document.getElementById(firstInvalid).focus();
                return;
            }

            formData = new FormData();
            formData.append('title', title);
            formData.append('location', location);
            formData.append('starts_at', toIso(startsAt));
            formData.append('ends_at', toIso(endsAt));
            formData.append('description', description);

            if (imageFile) {
                formData.append('image', imageFile);
            }

            UI.setLoading(submitButton, true, eventId ? 'Saving...' : 'Creating...');

            if (eventId) {
                request = API.putForm('/events/' + encodeURIComponent(eventId), formData);
            } else {
                request = API.postForm('/events', formData);
            }

            request
                .done(function (response) {
                    var data = response.data || {};
                    var savedId = data.id || eventId;

                    window.location.href = 'event-detail.html?id=' + encodeURIComponent(savedId) + '&saved=1';
                })
                .fail(function (xhr) {
                    var error = API.error(xhr);
                    var i;
                    var item;

                    UI.setLoading(submitButton, false);

                    if (error.errors.length) {
                        for (i = 0; i < error.errors.length; i++) {
                            item = error.errors[i];

                            if (item.field === 'title' || item.field === 'location' ||
                                item.field === 'starts_at' || item.field === 'ends_at') {
                                UI.setFieldError(item.field, item.message);
                            }
                        }
                    }

                    UI.setFormError(formElement, error.message);
                });
        });
    });
})(window, window.jQuery);
