(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var promoId = getQuery('id');
        var form = $('#promo-form');
        var formElement = form[0];
        var submitButton = document.getElementById('promo-submit');
        var videoInput = document.getElementById('video');
        var heading = document.getElementById('form-heading');
        var loading = $('#form-loading');

        // ROLE-BASED GUARD: only admins can create or edit promos.
        if (!Auth.requireAdmin()) {
            return;
        }

        if (promoId) {
            heading.textContent = 'Edit promo';
            submitButton.textContent = 'Save changes';
            document.title = 'Edit promo | CivicEvents+';
            $('#current-video-field').removeClass('hidden');
            $('#video-help').text('MP4 only, up to 8 MB. Use H.264 video and AAC audio. Leave empty to keep the current video.');
            loadPromo();
        } else {
            heading.textContent = 'Create promo';
            submitButton.textContent = 'Create promo';
            document.title = 'Create promo | CivicEvents+';
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

        function loadPromo() {
            loading.removeClass('hidden');

            API.get('/promos/' + encodeURIComponent(promoId))
                .done(function (response) {
                    var promo = response.data || {};

                    $('#title').val(promo.title || '');
                    $('#description').val(promo.description || '');
                    $('#caption_text').val(promo.caption_text || '');
                    $('#current-video').attr('src', promo.video_url || '');
                    loading.addClass('hidden');
                })
                .fail(function (xhr) {
                    loading.addClass('hidden');
                    UI.showMessage('promo-form-message', API.error(xhr).message, 'error');
                });
        }

        function isValidVideo(file) {
            var name = file.name.toLowerCase();

            // The backend multer limit is 8 MB, so the frontend matches that limit.
            return name.lastIndexOf('.mp4') === name.length - 4 && file.size <= 8 * 1024 * 1024;
        }

        videoInput.addEventListener('change', function () {
            var file = videoInput.files[0];

            UI.setFieldError('video', '');

            if (file && !isValidVideo(file)) {
                UI.setFieldError('video', 'Choose an MP4 file up to 8 MB.');
                videoInput.value = '';
            }
        });

        form.on('submit', function (event) {
            var title = $('#title').val().trim();
            var description = $('#description').val().trim();
            var captionText = $('#caption_text').val().trim();
            var videoFile = videoInput.files[0];
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
                invalid('title', 'Enter a promo title.');
            }

            if (!description) {
                invalid('description', 'Enter a promo description.');
            }

            if (!captionText) {
                invalid('caption_text', 'Enter the caption text.');
            }

            if (!promoId && !videoFile) {
                invalid('video', 'Choose an MP4 video file.');
            } else if (videoFile && !isValidVideo(videoFile)) {
                invalid('video', 'Choose an MP4 file up to 8 MB.');
            }

            if (firstInvalid) {
                document.getElementById(firstInvalid).focus();
                return;
            }

            formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('caption_text', captionText);

            if (videoFile) {
                formData.append('video', videoFile);
            }

            UI.setLoading(submitButton, true, promoId ? 'Saving...' : 'Creating...');

            if (promoId) {
                request = API.putForm('/promos/' + encodeURIComponent(promoId), formData);
            } else {
                request = API.postForm('/promos', formData);
            }

            request
                .done(function () {
                    window.location.href = promoId ? 'promos.html?updated=1' : 'promos.html?created=1';
                })
                .fail(function (xhr) {
                    var error = API.error(xhr);
                    var i;
                    var item;

                    UI.setLoading(submitButton, false);

                    if (error.errors.length) {
                        for (i = 0; i < error.errors.length; i++) {
                            item = error.errors[i];

                            if (item.field === 'title' || item.field === 'description' || item.field === 'caption_text') {
                                UI.setFieldError(item.field, item.message);
                            }
                        }
                    }

                    UI.setFormError(formElement, error.message);
                });
        });
    });
})(window, window.jQuery);
