(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var allEvents = [];
        var filteredEvents = [];
        var currentPage = 1;
        var pageSize = 6;
        var searchFromUrl;

        if (!Auth.isAuthenticated()) {
            return;
        }

        if (window.location.search.indexOf('deleted=1') !== -1) {
            UI.showMessage('page-message', 'Event deleted successfully.', 'success');
        }

        searchFromUrl = getQuery('search');

        if (searchFromUrl) {
            $('#global-search').val(searchFromUrl);
            $('#search-filter').val(searchFromUrl);
        }

        loadEvents();

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

        function loadEvents() {
            $('#events-loading').removeClass('hidden');
            $('#events-list').empty();
            $('#events-empty').addClass('hidden');
            $('#pagination').addClass('hidden');
            $('#events-count').text('Loading...');

            API.get('/events')
                .done(function (response) {
                    allEvents = response.data || [];
                    fillLocations();
                    applyFilters();
                })
                .fail(function (xhr) {
                    $('#events-loading').addClass('hidden');
                    $('#events-count').text('0 events');
                    UI.showMessage('events-message', API.error(xhr).message, 'error');
                });
        }

        function fillLocations() {
            var locations = {};
            var locationFilter = $('#location-filter');
            var selected = locationFilter.val();
            var i;
            var event;
            var location;
            var option;

            locationFilter.empty();
            locationFilter.append($('<option>').val('').text('All locations'));

            for (i = 0; i < allEvents.length; i++) {
                event = allEvents[i];
                location = event.location || '';

                if (location && !locations[location]) {
                    locations[location] = true;
                    option = $('<option>').val(location).text(location);
                    locationFilter.append(option);
                }
            }

            if (selected) {
                locationFilter.val(selected);
            }
        }

        function getVisibleEvents() {
            var user = Auth.getUser() || {};
            var result = [];
            var i;
            var event;

            for (i = 0; i < allEvents.length; i++) {
                event = allEvents[i];

                if (event.published === true || user.role === 'admin') {
                    result.push(event);
                }
            }

            return result;
        }

        function applyFilters() {
            var search = $('#search-filter').val().toLowerCase().trim();
            var location = $('#location-filter').val();
            var dateFilter = $('#date-filter').val();
            var events = getVisibleEvents();
            var i;
            var event;
            var text;
            var eventTime;

            filteredEvents = [];
            currentPage = 1;

            for (i = 0; i < events.length; i++) {
                event = events[i];
                text = (event.title || '') + ' ' + (event.description || '') + ' ' + (event.location || '');
                eventTime = event.starts_at ? new Date(event.starts_at).getTime() : 0;

                if (search && text.toLowerCase().indexOf(search) === -1) {
                    continue;
                }

                if (location && (event.location || '') !== location) {
                    continue;
                }

                if (dateFilter === 'upcoming' && eventTime < Date.now()) {
                    continue;
                }

                if (dateFilter === 'past' && eventTime >= Date.now()) {
                    continue;
                }

                filteredEvents.push(event);
            }

            renderPage();
        }

        function renderPage() {
            var totalPages = Math.ceil(filteredEvents.length / pageSize);
            var start;
            var end;
            var pageEvents;
            var i;

            $('#events-loading').addClass('hidden');

            if (!totalPages) {
                totalPages = 0;
            }

            if (currentPage > totalPages) {
                currentPage = totalPages || 1;
            }

            start = (currentPage - 1) * pageSize;
            end = start + pageSize;
            pageEvents = filteredEvents.slice(start, end);

            $('#events-list').empty();
            $('#events-count').text(
                filteredEvents.length + (filteredEvents.length === 1 ? ' event' : ' events')
            );

            if (!filteredEvents.length) {
                $('#events-empty').removeClass('hidden');
                $('#pagination').addClass('hidden');
                return;
            }

            $('#events-empty').addClass('hidden');

            for (i = 0; i < pageEvents.length; i++) {
                $('#events-list').append(renderCard(pageEvents[i]));
            }

            if (totalPages > 1) {
                $('#pagination').removeClass('hidden');
                $('#page-info').text('Page ' + currentPage + ' of ' + totalPages);
                $('#prev-page').prop('disabled', currentPage === 1);
                $('#next-page').prop('disabled', currentPage === totalPages);
            } else {
                $('#pagination').addClass('hidden');
            }
        }

        function renderCard(event) {
            var imageUrl = event.metadata && event.metadata.image_url ? event.metadata.image_url : '';
            var card = $('<article>').addClass('overflow-hidden rounded-lg border border-slate-700 bg-slate-900');
            var body = $('<div>').addClass('p-4');

            if (imageUrl) {
                card.append(
                    $('<img>')
                        .attr('src', imageUrl)
                        .attr('alt', event.title || 'Event image')
                        .attr('loading', 'lazy')
                        .addClass('h-40 w-full object-cover')
                );
            } else {
                card.append(
                    $('<div>')
                        .addClass('flex h-40 items-center justify-center bg-slate-800 text-sm text-slate-500')
                        .text('No image')
                );
            }

            body.append($('<h2>').addClass('text-lg font-semibold text-white').text(event.title || 'Untitled event'));
            body.append($('<p>').addClass('mt-1 text-xs text-cyan-300').text(formatDate(event.starts_at)));
            body.append($('<p>').addClass('mt-1 text-sm text-slate-400').text(event.location || 'Location not specified'));
            body.append($('<p>').addClass('mt-3 text-sm text-slate-400').text(shortText(event.description, 110)));
            body.append(
                $('<a>')
                    .attr('href', 'event-detail.html?id=' + encodeURIComponent(event.id))
                    .addClass('mt-4 inline-block rounded-md bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300')
                    .text('View event')
            );

            card.append(body);
            return card;
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

        $('#search-filter').on('input', applyFilters);
        $('#location-filter, #date-filter').on('change', applyFilters);

        $('#clear-filters').on('click', function () {
            $('#search-filter').val('');
            $('#location-filter').val('');
            $('#date-filter').val('all');
            applyFilters();
        });

        $('#prev-page').on('click', function () {
            if (currentPage > 1) {
                currentPage = currentPage - 1;
                renderPage();
                window.scrollTo(0, 0);
            }
        });

        $('#next-page').on('click', function () {
            if (currentPage * pageSize < filteredEvents.length) {
                currentPage = currentPage + 1;
                renderPage();
                window.scrollTo(0, 0);
            }
        });
    });
})(window, window.jQuery);
