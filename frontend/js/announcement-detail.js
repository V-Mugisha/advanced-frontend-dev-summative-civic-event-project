(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var user = Auth.getUser() || {};
        var announcementId = getQuery('id');
        var currentAnnouncement = null;
        var publishButton = document.getElementById('publish-announcement');
        var deleteButton = document.getElementById('delete-announcement');

        if (!Auth.isAuthenticated()) {
            return;
        }

        if (!announcementId) {
            $('#detail-loading').addClass('hidden');
            UI.showMessage('detail-message', 'The announcement id is missing from the page address.', 'error');
            return;
        }

        loadAnnouncement();

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
            API.get('/announcements/' + encodeURIComponent(announcementId))
                .done(function (response) {
                    currentAnnouncement = response.data || {};
                    renderAnnouncement();
                })
                .fail(function (xhr) {
                    $('#detail-loading').addClass('hidden');
                    UI.showMessage('detail-message', API.error(xhr).message, 'error');
                });
        }

        function renderAnnouncement() {
            // ROLE-BASED GUARD: normal users cannot open unpublished announcements directly.
            if (currentAnnouncement.published !== true && user.role !== 'admin') {
                $('#detail-loading').addClass('hidden');
                UI.showMessage('detail-message', 'This announcement is not available.', 'warning');
                return;
            }

            var audio = $('#announcement-audio');

            $('#detail-loading').addClass('hidden');
            $('#announcement-detail').removeClass('hidden');
            $('#announcement-title').text(currentAnnouncement.title || 'Untitled announcement');
            $('#announcement-date').text(formatDate(currentAnnouncement.created_at));
            $('#audio-link').attr('href', currentAnnouncement.audio_url || '#');
            $('#edit-announcement').attr('href', 'announcement-form.html?id=' + encodeURIComponent(announcementId));

            audio.off('loadedmetadata');
            audio.off('error');
            audio.on('loadedmetadata', function () {
                $('#announcement-duration').text('Duration: ' + formatDuration(this.duration));
            });
            audio.on('error', function () {
                $('#announcement-duration').text('Duration: unavailable');
            });
            audio.attr('src', currentAnnouncement.audio_url || '');

            if (user.role === 'admin') {
                $('#announcement-status')
                    .text(currentAnnouncement.published ? 'Published' : 'Unpublished')
                    .toggleClass('text-emerald-300', currentAnnouncement.published === true)
                    .toggleClass('text-rose-300', currentAnnouncement.published !== true);
                $(publishButton).text(currentAnnouncement.published ? 'Unpublish' : 'Publish');
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

        function formatDuration(seconds) {
            var total;
            var minutes;
            var remaining;

            if (!seconds || isNaN(seconds)) {
                return 'unavailable';
            }

            total = Math.round(seconds);
            minutes = Math.floor(total / 60);
            remaining = total % 60;

            return minutes + ':' + (remaining < 10 ? '0' + remaining : remaining);
        }

        function togglePublished() {
            var action = currentAnnouncement.published ? 'unpublish' : 'publish';

            UI.setLoading(publishButton, true, action === 'publish' ? 'Publishing...' : 'Unpublishing...');

            API.patch('/announcements/' + encodeURIComponent(announcementId) + '/' + action)
                .done(function () {
                    UI.setLoading(publishButton, false);
                    UI.showMessage('detail-message', 'Announcement ' + (action === 'publish' ? 'published.' : 'unpublished.'), 'success');
                    loadAnnouncement();
                })
                .fail(function (xhr) {
                    UI.setLoading(publishButton, false);
                    UI.showMessage('detail-message', API.error(xhr).message, 'error');
                });
        }

        function deleteAnnouncement() {
            if (!window.confirm('Delete this announcement?')) {
                return;
            }

            UI.setLoading(deleteButton, true, 'Deleting...');

            API.del('/announcements/' + encodeURIComponent(announcementId))
                .done(function () {
                    window.location.href = 'announcements.html?deleted=1';
                })
                .fail(function (xhr) {
                    UI.setLoading(deleteButton, false);
                    UI.showMessage('detail-message', API.error(xhr).message, 'error');
                });
        }

        $(publishButton).on('click', togglePublished);
        $(deleteButton).on('click', deleteAnnouncement);
    });
})(window, window.jQuery);
