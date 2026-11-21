(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var form = $('#profile-form');
        var formElement = form[0];
        var submitButton = document.getElementById('profile-submit');
        var loading = $('#profile-loading');

        if (!Auth.isAuthenticated()) {
            return;
        }

        loadProfile();

        $('#full_name, #email').on('input', function () {
            UI.setFieldError(this.id, '');
            UI.clearFormError(formElement);
        });

        function loadProfile() {
            API.get('/users/profile/me')
                .done(function (response) {
                    renderProfile(response.data || {});
                    loading.addClass('hidden');
                    $('#profile-content').removeClass('hidden');
                })
                .fail(function (xhr) {
                    loading.addClass('hidden');
                    UI.showMessage('profile-message', API.error(xhr).message, 'error');
                });
        }

        function renderProfile(user) {
            $('#full_name').val(user.full_name || '');
            $('#email').val(user.email || '');
            $('#profile-role').text(user.role === 'admin' ? 'Administrator' : 'Member');
            $('#profile-status').text(user.is_active ? 'Active' : 'Inactive');
        }

        form.on('submit', function (event) {
            var fullName = $('#full_name').val().trim();
            var email = $('#email').val().trim();
            var firstInvalid = null;

            event.preventDefault();
            UI.clearFieldErrors(formElement);
            UI.clearFormError(formElement);

            if (!fullName) {
                UI.setFieldError('full_name', 'Enter your full name.');
                firstInvalid = 'full_name';
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                UI.setFieldError('email', 'Enter a valid email address.');

                if (!firstInvalid) {
                    firstInvalid = 'email';
                }
            }

            if (firstInvalid) {
                document.getElementById(firstInvalid).focus();
                return;
            }

            UI.setLoading(submitButton, true, 'Saving...');

            // Only full_name and email are editable. Never send role or is_active.
            API.patch('/users/profile/me', {
                full_name: fullName,
                email: email
            })
                .done(function (response) {
                    var user = response.data || {};

                    UI.setLoading(submitButton, false);
                    Auth.updateStoredUser(user);
                    $('[data-user-name]').text(user.full_name || fullName);
                    renderProfile(user);
                    UI.showMessage('profile-message', 'Profile updated successfully.', 'success');
                })
                .fail(function (xhr) {
                    var error = API.error(xhr);
                    var i;
                    var item;

                    UI.setLoading(submitButton, false);

                    if (error.status === 409) {
                        UI.setFieldError('email', 'That email address is already in use.');
                        document.getElementById('email').focus();
                        return;
                    }

                    if (error.errors.length) {
                        for (i = 0; i < error.errors.length; i++) {
                            item = error.errors[i];

                            if (item.field === 'full_name' || item.field === 'email') {
                                UI.setFieldError(item.field, item.message);
                            }
                        }
                    }

                    UI.setFormError(formElement, error.message);
                });
        });
    });
})(window, window.jQuery);
