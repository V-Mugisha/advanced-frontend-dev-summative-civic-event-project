(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var currentUser = Auth.getUser() || {};
        var allUsers = [];
        var filteredUsers = [];
        var currentPage = 1;
        var pageSize = 10;

        // ROLE-BASED GUARD: only admins can manage users.
        if (!Auth.requireAdmin()) {
            return;
        }

        loadUsers();

        $('#user-search').on('input', function () {
            currentPage = 1;
            applyFilter();
        });

        $('#prev-user-page').on('click', function () {
            if (currentPage > 1) {
                currentPage = currentPage - 1;
                renderPage();
            }
        });

        $('#next-user-page').on('click', function () {
            if (currentPage * pageSize < filteredUsers.length) {
                currentPage = currentPage + 1;
                renderPage();
            }
        });

        function loadUsers() {
            $('#users-loading').removeClass('hidden');
            $('#users-empty').addClass('hidden');
            $('#users-table-wrap').addClass('hidden');
            $('#users-pagination').addClass('hidden');

            API.get('/users?page=1&limit=100')
                .done(function (response) {
                    allUsers = response.data || [];
                    $('#users-loading').addClass('hidden');
                    applyFilter();
                })
                .fail(function (xhr) {
                    $('#users-loading').addClass('hidden');
                    UI.showMessage('users-message', API.error(xhr).message, 'error');
                });
        }

        function applyFilter() {
            var query = $('#user-search').val().toLowerCase().trim();
            var i;
            var user;
            var text;

            filteredUsers = [];

            for (i = 0; i < allUsers.length; i++) {
                user = allUsers[i];
                text = (user.full_name || '') + ' ' + (user.email || '');

                if (!query || text.toLowerCase().indexOf(query) !== -1) {
                    filteredUsers.push(user);
                }
            }

            renderPage();
        }

        function renderPage() {
            var totalPages = Math.ceil(filteredUsers.length / pageSize);
            var start;
            var end;
            var pageUsers;
            var body = $('#users-body');
            var i;

            if (currentPage > totalPages) {
                currentPage = totalPages || 1;
            }

            start = (currentPage - 1) * pageSize;
            end = start + pageSize;
            pageUsers = filteredUsers.slice(start, end);

            body.empty();

            if (!filteredUsers.length) {
                $('#users-empty').removeClass('hidden');
                $('#users-table-wrap').addClass('hidden');
                $('#users-pagination').addClass('hidden');
                return;
            }

            $('#users-empty').addClass('hidden');
            $('#users-table-wrap').removeClass('hidden');

            for (i = 0; i < pageUsers.length; i++) {
                body.append(renderUserRow(pageUsers[i]));
            }

            $('#users-count').text(filteredUsers.length + (filteredUsers.length === 1 ? ' user' : ' users'));

            if (totalPages > 1) {
                $('#users-pagination').removeClass('hidden');
                $('#user-page-info').text('Page ' + currentPage + ' of ' + totalPages);
                $('#prev-user-page').prop('disabled', currentPage === 1);
                $('#next-user-page').prop('disabled', currentPage === totalPages);
            } else {
                $('#users-pagination').addClass('hidden');
            }
        }

        function renderUserRow(user) {
            var row = $('<tr>').addClass('border-t border-slate-800');
            var status = $('<span>')
                .addClass(user.is_active ? 'text-emerald-300' : 'text-rose-300')
                .text(user.is_active ? 'Active' : 'Inactive');
            var actionCell = $('<td>').addClass('px-4 py-3');
            var button;

            row.append($('<td>').addClass('px-4 py-3 text-slate-200').text(user.full_name || 'Unnamed user'));
            row.append($('<td>').addClass('px-4 py-3 text-slate-400').text(user.email || 'No email'));
            row.append($('<td>').addClass('px-4 py-3 text-slate-300').text(user.role === 'admin' ? 'Administrator' : 'Member'));
            row.append($('<td>').addClass('px-4 py-3').append(status));

            if (user.id === currentUser.id) {
                actionCell.append($('<span>').addClass('text-xs text-slate-500').text('Current account'));
            } else {
                button = $('<button>')
                    .attr('type', 'button')
                    .addClass('rounded-md border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:opacity-60')
                    .text(user.is_active ? 'Disable' : 'Enable');

                bindStatusButton(user, button);
                actionCell.append(button);
            }

            row.append(actionCell);
            return row;
        }

        function bindStatusButton(user, button) {
            button.on('click', function () {
                var enable = !user.is_active;

                if (!enable && !window.confirm('Disable this account?')) {
                    return;
                }

                UI.setLoading(button[0], true, enable ? 'Enabling...' : 'Disabling...');

                API.patch('/users/' + encodeURIComponent(user.id) + '/' + (enable ? 'enable' : 'disable'))
                    .done(function (response) {
                        var data = response.data || {};

                        UI.setLoading(button[0], false);
                        user.is_active = typeof data.is_active === 'boolean' ? data.is_active : enable;
                        UI.showMessage('users-message', 'Account ' + (enable ? 'enabled' : 'disabled') + '.', 'success');
                        applyFilter();
                    })
                    .fail(function (xhr) {
                        UI.setLoading(button[0], false);
                        UI.showMessage('users-message', API.error(xhr).message, 'error');
                    });
            });
        }
    });
})(window, window.jQuery);
