(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var user = Auth.getUser() || {};
        var announcements = [];

        if (!Auth.isAuthenticated()) {
            return;
        }

        if (window.location.search.indexOf('created=1') !== -1) {
            UI.showToast('Announcement created successfully.');
        } else if (window.location.search.indexOf('updated=1') !== -1) {
            UI.showMessage('announcements-message', 'Announcement updated successfully.', 'success');
        } else if (window.location.search.indexOf('deleted=1') !== -1) {
            UI.showMessage('announcements-message', 'Announcement deleted successfully.', 'success');
        }

        loadAnnouncements();

        function loadAnnouncements() {
            $('#announcements-loading').removeClass('hidden');
            $('#announcements-empty').addClass('hidden');
            $('#announcements-list').empty();

            API.get('/announcements?page=1&limit=100')
                .done(function (response) {
                    announcements = response.data || [];
                    $('#announcements-loading').addClass('hidden');
                    renderAnnouncements();
                })
                .fail(function (xhr) {
                    $('#announcements-loading').addClass('hidden');
                    UI.showMessage('announcements-message', API.error(xhr).message, 'error');
                });
        }

        function visibleAnnouncements() {
            var result = [];
            var i;
            var announcement;

            for (i = 0; i < announcements.length; i++) {
                announcement = announcements[i];

                if (announcement.published === true || user.role === 'admin') {
                    result.push(announcement);
                }
            }

            return result;
        }

        function renderAnnouncements() {
            var list = $('#announcements-list');
            var visible = visibleAnnouncements();
            var i;

            list.empty();

            if (!visible.length) {
                $('#announcements-empty').removeClass('hidden');
                return;
            }

            $('#announcements-empty').addClass('hidden');

            for (i = 0; i < visible.length; i++) {
                list.append(renderCard(visible[i]));
            }
        }

        function renderCard(announcement) {
            var card = $('<article>').addClass('rounded-lg border border-slate-700 bg-slate-900 p-5');
            var title = $('<a>')
                .attr('href', 'announcement-detail.html?id=' + encodeURIComponent(announcement.id))
                .addClass('text-lg font-semibold text-white hover:text-cyan-300')
                .text(announcement.title || 'Untitled announcement');
            var meta = $('<p>').addClass('mt-1 text-xs text-slate-500').text(formatDate(announcement.created_at));
            var duration = $('<span>').addClass('text-xs text-slate-400').text('Duration: loading...');
            var audio = $('<audio>')
                .attr('controls', 'controls')
                .attr('preload', 'metadata')
                .addClass('mt-3 w-full');
            var actions;

            audio.on('loadedmetadata', function () {
                duration.text('Duration: ' + formatDuration(this.duration));
            });

            audio.on('error', function () {
                duration.text('Duration: unavailable');
            });

            audio.attr('src', announcement.audio_url || '');

            card.append(title);
            card.append(meta);
            card.append(duration);
            card.append(audio);

            if (user.role === 'admin') {
                actions = $('<div>').addClass('mt-4 flex flex-wrap items-center gap-2');
                actions.append(
                    $('<span>')
                        .addClass(announcement.published ? 'text-xs text-emerald-300' : 'text-xs text-rose-300')
                        .text(announcement.published ? 'Published' : 'Unpublished')
                );
                actions.append(
                    $('<a>')
                        .attr('href', 'announcement-form.html?id=' + encodeURIComponent(announcement.id))
                        .addClass('rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800')
                        .text('Edit')
                );

                actions.append(makePublishButton(announcement));
                actions.append(makeDeleteButton(announcement));
                card.append(actions);
            }

            return card;
        }

        function makePublishButton(announcement) {
            var button = $('<button>')
                .attr('type', 'button')
                .addClass('rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60')
                .text(announcement.published ? 'Unpublish' : 'Publish');

            button.on('click', function () {
                var action = announcement.published ? 'unpublish' : 'publish';

                UI.setLoading(button[0], true, announcement.published ? 'Unpublishing...' : 'Publishing...');

                API.patch('/announcements/' + encodeURIComponent(announcement.id) + '/' + action)
                    .done(function () {
                        UI.setLoading(button[0], false);
                        UI.showMessage('announcements-message', 'Announcement ' + (action === 'publish' ? 'published.' : 'unpublished.'), 'success');
                        loadAnnouncements();
                    })
                    .fail(function (xhr) {
                        UI.setLoading(button[0], false);
                        UI.showMessage('announcements-message', API.error(xhr).message, 'error');
                    });
            });

            return button;
        }

        function makeDeleteButton(announcement) {
            var button = $('<button>')
                .attr('type', 'button')
                .addClass('rounded-md border border-rose-700 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-950 disabled:opacity-60')
                .text('Delete');

            button.on('click', function () {
                if (!window.confirm('Delete this announcement?')) {
                    return;
                }

                UI.setLoading(button[0], true, 'Deleting...');

                API.del('/announcements/' + encodeURIComponent(announcement.id))
                    .done(function () {
                        window.location.href = 'announcements.html?deleted=1';
                    })
                    .fail(function (xhr) {
                        UI.setLoading(button[0], false);
                        UI.showMessage('announcements-message', API.error(xhr).message, 'error');
                    });
            });

            return button;
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
    });
})(window, window.jQuery);
