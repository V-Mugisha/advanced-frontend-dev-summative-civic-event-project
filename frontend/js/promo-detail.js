(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var user = Auth.getUser() || {};
        var promoId = getQuery('id');
        var currentPromo = null;
        var captionUrl = null;
        var publishButton = document.getElementById('publish-promo');
        var deleteButton = document.getElementById('delete-promo');

        if (!Auth.isAuthenticated()) {
            return;
        }

        if (!promoId) {
            $('#detail-loading').addClass('hidden');
            UI.showMessage('detail-message', 'The promo id is missing from the page address.', 'error');
            return;
        }

        loadPromo();

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
            API.get('/promos/' + encodeURIComponent(promoId))
                .done(function (response) {
                    currentPromo = response.data || {};
                    renderPromo();
                })
                .fail(function (xhr) {
                    $('#detail-loading').addClass('hidden');
                    UI.showMessage('detail-message', API.error(xhr).message, 'error');
                });
        }

        function renderPromo() {
            // ROLE-BASED GUARD: normal users cannot open unpublished promos directly.
            if (currentPromo.published !== true && user.role !== 'admin') {
                $('#detail-loading').addClass('hidden');
                UI.showMessage('detail-message', 'This promo is not available.', 'warning');
                return;
            }

            $('#detail-loading').addClass('hidden');
            $('#promo-detail').removeClass('hidden');
            $('#promo-title').text(currentPromo.title || 'Untitled promo');
            $('#promo-date').text(formatDate(currentPromo.created_at));
            $('#promo-description').text(currentPromo.description || 'No description provided.');
            $('#promo-transcript').text(currentPromo.caption_text || 'No captions provided.');
            $('#video-link').attr('href', currentPromo.video_url || '#');
            $('#edit-promo').attr('href', 'promo-form.html?id=' + encodeURIComponent(promoId));

            setVideoAndCaptions(currentPromo);

            if (user.role === 'admin') {
                $('#promo-status')
                    .text(currentPromo.published ? 'Published' : 'Unpublished')
                    .toggleClass('text-emerald-300', currentPromo.published === true)
                    .toggleClass('text-rose-300', currentPromo.published !== true);
                $(publishButton).text(currentPromo.published ? 'Unpublish' : 'Publish');
            }
        }

        function setVideoAndCaptions(promo) {
            var video = document.getElementById('promo-video');
            var track = document.getElementById('promo-track');
            var text = promo.caption_text || '';
            var videoUrl = promo.video_url || '';
            var lowerUrl = videoUrl.toLowerCase();
            var unsupportedFormat = lowerUrl.indexOf('.avi') !== -1 ||
                lowerUrl.indexOf('.mkv') !== -1 ||
                lowerUrl.indexOf('.mov') !== -1;
            var vtt;

            if (captionUrl) {
                window.URL.revokeObjectURL(captionUrl);
                captionUrl = null;
            }

            if (text) {
                vtt = 'WEBVTT\n\n00:00:00.000 --> 99:59:59.000\n' + text.replace(/\r/g, '');
                captionUrl = window.URL.createObjectURL(new window.Blob([vtt], { type: 'text/vtt' }));
                track.src = captionUrl;
            } else {
                track.removeAttribute('src');
            }

            video.oncanplay = function () {
                hideVideoWarning();
            };

            video.onerror = function () {
                if (unsupportedFormat) {
                    showVideoWarning('This video uses AVI, MKV, or MOV. Browsers often cannot play these formats. Ask an administrator to upload an MP4 version.');
                } else {
                    showVideoWarning('This video could not be played. It may use an unsupported format or codec. Ask an administrator to upload an MP4 file with H.264 video and AAC audio.');
                }
            };

            if (!videoUrl) {
                showVideoWarning('No video file is available for this promo.');
            } else if (unsupportedFormat) {
                showVideoWarning('This video uses AVI, MKV, or MOV. Browsers often cannot play these formats. Ask an administrator to upload an MP4 version.');
            } else {
                hideVideoWarning();
            }

            video.src = videoUrl;
            video.load();
        }

        function showVideoWarning(message) {
            $('#video-warning').text(message).removeClass('hidden');
        }

        function hideVideoWarning() {
            $('#video-warning').text('').addClass('hidden');
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

        function togglePublished() {
            var action = currentPromo.published ? 'unpublish' : 'publish';

            UI.setLoading(publishButton, true, action === 'publish' ? 'Publishing...' : 'Unpublishing...');

            API.patch('/promos/' + encodeURIComponent(promoId) + '/' + action)
                .done(function () {
                    UI.setLoading(publishButton, false);
                    UI.showMessage('detail-message', 'Promo ' + (action === 'publish' ? 'published.' : 'unpublished.'), 'success');
                    loadPromo();
                })
                .fail(function (xhr) {
                    UI.setLoading(publishButton, false);
                    UI.showMessage('detail-message', API.error(xhr).message, 'error');
                });
        }

        function deletePromo() {
            if (!window.confirm('Delete this promo?')) {
                return;
            }

            UI.setLoading(deleteButton, true, 'Deleting...');

            API.del('/promos/' + encodeURIComponent(promoId))
                .done(function () {
                    window.location.href = 'promos.html?deleted=1';
                })
                .fail(function (xhr) {
                    UI.setLoading(deleteButton, false);
                    UI.showMessage('detail-message', API.error(xhr).message, 'error');
                });
        }

        $(publishButton).on('click', togglePublished);
        $(deleteButton).on('click', deletePromo);
    });
})(window, window.jQuery);
