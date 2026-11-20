(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var user = Auth.getUser() || {};

        if (!Auth.isAuthenticated()) {
            return;
        }

        loadNotifications();

        function loadNotifications() {
            $('#notifications-loading').removeClass('hidden');
            $('#notifications-empty').addClass('hidden');
            $('#notifications-list').empty();

            API.get('/notifications')
                .done(function (response) {
                    var notifications = response.data || [];
                    var i;

                    $('#notifications-loading').addClass('hidden');

                    if (!notifications.length) {
                        $('#notifications-empty').removeClass('hidden');
                        return;
                    }

                    for (i = 0; i < notifications.length; i++) {
                        $('#notifications-list').append(renderNotification(notifications[i]));
                    }
                })
                .fail(function (xhr) {
                    $('#notifications-loading').addClass('hidden');
                    UI.showMessage('notifications-message', API.error(xhr).message, 'error');
                });
        }

        function renderNotification(notification) {
            var card = $('<article>').addClass('rounded-lg border border-slate-700 bg-slate-900 p-5');
            var header = $('<div>').addClass('flex flex-wrap items-start justify-between gap-3');
            var titleBlock = $('<div>');
            var meta = $('<div>').addClass('flex flex-wrap items-center gap-2');
            var related = relatedInfo(notification.metadata || {});

            titleBlock.append($('<h2>').addClass('text-lg font-semibold text-white').text(notification.title || 'Notification'));
            meta.append(
                $('<span>')
                    .addClass('rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-300')
                    .text(notification.type || 'system')
            );
            meta.append($('<span>').addClass('text-xs text-slate-500').text(formatDate(notification.created_at)));

            if (notification.read === false) {
                meta.append($('<span>').addClass('rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white').text('Unread'));
            }

            titleBlock.append(meta);
            header.append(titleBlock);

            if (user.role === 'admin') {
                header.append(makeDeleteButton(notification));
            }

            card.append(header);
            card.append($('<p>').addClass('mt-3 whitespace-pre-line text-sm leading-6 text-slate-300').text(notification.message || ''));

            if (related) {
                card.append(
                    $('<a>')
                        .attr('href', related.href)
                        .addClass('mt-3 inline-block text-sm font-medium text-cyan-300 hover:underline')
                        .text(related.label)
                );
            }

            return card;
        }

        function relatedInfo(metadata) {
            if (metadata.event_id) {
                return {
                    href: 'event-detail.html?id=' + encodeURIComponent(metadata.event_id),
                    label: 'View event'
                };
            }

            if (metadata.announcement_id) {
                return {
                    href: 'announcement-detail.html?id=' + encodeURIComponent(metadata.announcement_id),
                    label: 'View announcement'
                };
            }

            if (metadata.promo_id) {
                return {
                    href: 'promo-detail.html?id=' + encodeURIComponent(metadata.promo_id),
                    label: 'View promo'
                };
            }

            return null;
        }

        function makeDeleteButton(notification) {
            var button = $('<button>')
                .attr('type', 'button')
                .attr('data-notification-delete', notification.id)
                .addClass('rounded-md border border-rose-700 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-950 disabled:opacity-60')
                .text('Delete');

            button.on('click', function () {
                if (!window.confirm('Delete this notification?')) {
                    return;
                }

                UI.setLoading(button[0], true, 'Deleting...');

                API.del('/notifications/' + encodeURIComponent(notification.id))
                    .done(function () {
                        UI.setLoading(button[0], false);
                        UI.showMessage('notifications-message', 'Notification deleted.', 'success');
                        loadNotifications();

                        if (window.CivicApp) {
                            window.CivicApp.refreshNotificationCount();
                        }
                    })
                    .fail(function (xhr) {
                        UI.setLoading(button[0], false);
                        UI.showMessage('notifications-message', API.error(xhr).message, 'error');
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
    });
})(window, window.jQuery);
