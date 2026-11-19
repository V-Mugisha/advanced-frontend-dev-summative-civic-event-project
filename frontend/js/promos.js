(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var user = Auth.getUser() || {};
        var allPromos = [];
        var visiblePromos = [];
        var currentPage = 1;
        var pageSize = 6;

        if (!Auth.isAuthenticated()) {
            return;
        }

        if (window.location.search.indexOf('created=1') !== -1) {
            UI.showMessage('promos-message', 'Promo created successfully.', 'success');
        } else if (window.location.search.indexOf('updated=1') !== -1) {
            UI.showMessage('promos-message', 'Promo updated successfully.', 'success');
        } else if (window.location.search.indexOf('deleted=1') !== -1) {
            UI.showMessage('promos-message', 'Promo deleted successfully.', 'success');
        }

        loadPromos();

        $('#prev-promo-page').on('click', function () {
            if (currentPage > 1) {
                currentPage = currentPage - 1;
                renderPage();
            }
        });

        $('#next-promo-page').on('click', function () {
            if (currentPage * pageSize < visiblePromos.length) {
                currentPage = currentPage + 1;
                renderPage();
            }
        });

        function loadPromos() {
            $('#promos-loading').removeClass('hidden');
            $('#promos-empty').addClass('hidden');
            $('#promos-list').empty();
            $('#promos-pagination').addClass('hidden');

            API.get('/promos?page=1&limit=100')
                .done(function (response) {
                    allPromos = response.data || [];
                    $('#promos-loading').addClass('hidden');
                    filterPromos();
                })
                .fail(function (xhr) {
                    $('#promos-loading').addClass('hidden');
                    UI.showMessage('promos-message', API.error(xhr).message, 'error');
                });
        }

        function filterPromos() {
            var i;
            var promo;

            visiblePromos = [];
            currentPage = 1;

            for (i = 0; i < allPromos.length; i++) {
                promo = allPromos[i];

                if (promo.published === true || user.role === 'admin') {
                    visiblePromos.push(promo);
                }
            }

            renderPage();
        }

        function renderPage() {
            var totalPages = Math.ceil(visiblePromos.length / pageSize);
            var start;
            var end;
            var pagePromos;
            var list = $('#promos-list');
            var i;

            if (currentPage > totalPages) {
                currentPage = totalPages || 1;
            }

            start = (currentPage - 1) * pageSize;
            end = start + pageSize;
            pagePromos = visiblePromos.slice(start, end);

            list.empty();

            if (!visiblePromos.length) {
                $('#promos-empty').removeClass('hidden');
                $('#promos-pagination').addClass('hidden');
                return;
            }

            $('#promos-empty').addClass('hidden');

            for (i = 0; i < pagePromos.length; i++) {
                list.append(renderCard(pagePromos[i]));
            }

            if (totalPages > 1) {
                $('#promos-pagination').removeClass('hidden');
                $('#promos-count').text(visiblePromos.length + (visiblePromos.length === 1 ? ' promo' : ' promos'));
                $('#promo-page-info').text('Page ' + currentPage + ' of ' + totalPages);
                $('#prev-promo-page').prop('disabled', currentPage === 1);
                $('#next-promo-page').prop('disabled', currentPage === totalPages);
            } else {
                $('#promos-pagination').addClass('hidden');
            }
        }

        function renderCard(promo) {
            var card = $('<article>').addClass('overflow-hidden rounded-lg border border-slate-700 bg-slate-900');
            var video = $('<video>')
                .attr('preload', 'metadata')
                .attr('muted', 'muted')
                .attr('playsinline', 'playsinline')
                .addClass('h-40 w-full bg-slate-950 object-cover');
            var body = $('<div>').addClass('p-4');
            var actions;

            video.attr('src', promo.video_url || '');
            card.append(video);

            body.append(
                $('<a>')
                    .attr('href', 'promo-detail.html?id=' + encodeURIComponent(promo.id))
                    .addClass('text-lg font-semibold text-white hover:text-cyan-300')
                    .text(promo.title || 'Untitled promo')
            );
            body.append($('<p>').addClass('mt-1 text-xs text-slate-500').text(formatDate(promo.created_at)));
            body.append($('<p>').addClass('mt-3 text-sm text-slate-400').text(shortText(promo.description, 130)));

            if (user.role === 'admin') {
                actions = $('<div>').addClass('mt-4 flex flex-wrap items-center gap-2');
                actions.append(
                    $('<span>')
                        .addClass(promo.published ? 'text-xs text-emerald-300' : 'text-xs text-rose-300')
                        .text(promo.published ? 'Published' : 'Unpublished')
                );
                actions.append(
                    $('<a>')
                        .attr('href', 'promo-form.html?id=' + encodeURIComponent(promo.id))
                        .addClass('rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800')
                        .text('Edit')
                );
                actions.append(makePublishButton(promo));
                actions.append(makeDeleteButton(promo));
                body.append(actions);
            }

            body.append(
                $('<a>')
                    .attr('href', 'promo-detail.html?id=' + encodeURIComponent(promo.id))
                    .addClass('mt-4 inline-block rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300')
                    .text('Watch promo')
            );

            card.append(body);
            return card;
        }

        function makePublishButton(promo) {
            var button = $('<button>')
                .attr('type', 'button')
                .addClass('rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-60')
                .text(promo.published ? 'Unpublish' : 'Publish');

            button.on('click', function () {
                var action = promo.published ? 'unpublish' : 'publish';

                UI.setLoading(button[0], true, promo.published ? 'Unpublishing...' : 'Publishing...');

                API.patch('/promos/' + encodeURIComponent(promo.id) + '/' + action)
                    .done(function () {
                        UI.setLoading(button[0], false);
                        UI.showMessage('promos-message', 'Promo ' + (action === 'publish' ? 'published.' : 'unpublished.'), 'success');
                        loadPromos();
                    })
                    .fail(function (xhr) {
                        UI.setLoading(button[0], false);
                        UI.showMessage('promos-message', API.error(xhr).message, 'error');
                    });
            });

            return button;
        }

        function makeDeleteButton(promo) {
            var button = $('<button>')
                .attr('type', 'button')
                .addClass('rounded-md border border-rose-700 px-3 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-950 disabled:opacity-60')
                .text('Delete');

            button.on('click', function () {
                if (!window.confirm('Delete this promo?')) {
                    return;
                }

                UI.setLoading(button[0], true, 'Deleting...');

                API.del('/promos/' + encodeURIComponent(promo.id))
                    .done(function () {
                        window.location.href = 'promos.html?deleted=1';
                    })
                    .fail(function (xhr) {
                        UI.setLoading(button[0], false);
                        UI.showMessage('promos-message', API.error(xhr).message, 'error');
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

        function shortText(value, limit) {
            if (!value) {
                return 'No description provided.';
            }

            if (value.length <= limit) {
                return value;
            }

            return value.substring(0, limit) + '...';
        }
    });
})(window, window.jQuery);
