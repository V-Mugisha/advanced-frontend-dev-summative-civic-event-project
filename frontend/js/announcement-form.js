(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var announcementId = getQuery('id');
        var form = $('#announcement-form');
        var formElement = form[0];
        var submitButton = document.getElementById('announcement-submit');
        var audioInput = document.getElementById('audio');
        var heading = document.getElementById('form-heading');
        var loading = $('#form-loading');

        // ROLE-BASED GUARD: only admins can create or edit announcements.
        if (!Auth.requireAdmin()) {
            return;
        }

        if (announcementId) {
            heading.textContent = 'Edit announcement';
            submitButton.textContent = 'Save changes';
            document.title = 'Edit announcement | CivicEvents+';
            $('#audio-field').addClass('hidden');
            $('#current-audio-field').removeClass('hidden');
            loadAnnouncement();
        } else {
            heading.textContent = 'Create announcement';
            submitButton.textContent = 'Create announcement';
            document.title = 'Create announcement | CivicEvents+';
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

        function loadAnnouncement() {
            loading.removeClass('hidden');

            API.get('/announcements/' + encodeURIComponent(announcementId))
                .done(function (response) {
                    var announcement = response.data || {};

                    $('#title').val(announcement.title || '');
                    $('#published').prop('checked', announcement.published === true);
                    $('#current-audio').attr('src', announcement.audio_url || '');
                    loading.addClass('hidden');
                })
                .fail(function (xhr) {
                    loading.addClass('hidden');
                    UI.showMessage('announcement-form-message', API.error(xhr).message, 'error');
                });
        }

        function isValidAudio(file) {
            var allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg'];
            var name = file.name.toLowerCase();
            var i;

            for (i = 0; i < allowedExtensions.length; i++) {
                if (name.lastIndexOf(allowedExtensions[i]) === name.length - allowedExtensions[i].length) {
                    return file.size <= 5 * 1024 * 1024;
                }
            }

            return false;
        }

        form.on('submit', function (event) {
            var title = $('#title').val().trim();
            var published = $('#published').is(':checked');
            var audioFile = audioInput.files[0];
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
                invalid('title', 'Enter an announcement title.');
            }

            if (!announcementId) {
                if (!audioFile) {
                    invalid('audio', 'Choose an audio file.');
                } else if (!isValidAudio(audioFile)) {
                    invalid('audio', 'Choose an MP3, WAV, M4A, or OGG file up to 5 MB.');
                }
            }

            if (firstInvalid) {
                document.getElementById(firstInvalid).focus();
                return;
            }

            formData = new FormData();
            formData.append('title', title);
            formData.append('published', published ? 'true' : 'false');

            if (!announcementId && audioFile) {
                formData.append('audio', audioFile);
            }

            UI.setLoading(submitButton, true, announcementId ? 'Saving...' : 'Creating...');

            if (announcementId) {
                request = API.putForm('/announcements/' + encodeURIComponent(announcementId), formData);
            } else {
                request = API.postForm('/announcements', formData);
            }

            request
                .done(function () {
                    window.location.href = announcementId ? 'announcements.html?updated=1' : 'announcements.html?created=1';
                })
                .fail(function (xhr) {
                    var error = API.error(xhr);
                    var i;
                    var item;

                    UI.setLoading(submitButton, false);

                    if (error.errors.length) {
                        for (i = 0; i < error.errors.length; i++) {
                            item = error.errors[i];

                            if (item.field === 'title' || item.field === 'published') {
                                UI.setFieldError(item.field, item.message);
                            }
                        }
                    }

                    UI.setFormError(formElement, error.message);
                });
        });
    });
})(window, window.jQuery);
