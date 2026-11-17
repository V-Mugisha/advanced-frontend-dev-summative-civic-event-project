(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var form = $('#login-form');
        var formElement = form[0];
        var submitButton = document.getElementById('login-submit');
        var fieldIds = ['email', 'password'];
        var i;

        if (Auth.redirectIfAuthenticated()) {
            return;
        }

        UI.bindPasswordToggles(document);
        showPageMessage();

        function showPageMessage() {
            var search = window.location.search;

            if (search.indexOf('registered=1') !== -1) {
                UI.showSignupToast();
            } else if (search.indexOf('expired=1') !== -1) {
                UI.showMessage('page-message', 'Your session expired. Please sign in again.', 'warning');
            } else if (search.indexOf('loggedout=1') !== -1) {
                UI.showMessage('page-message', 'You have been signed out.', 'info');
            } else if (search.indexOf('signin=1') !== -1) {
                UI.showMessage('page-message', 'Please sign in to continue.', 'warning');
            }
        }

        function focusField(fieldId) {
            var field = document.getElementById(fieldId);

            if (field) {
                field.focus();
            }
        }

        function handleError(error) {
            var firstInvalid = null;
            var item;
            var i;

            if (error.status === 401) {
                UI.setFormError(formElement, 'Invalid email or password. Please try again.');
                focusField('email');
                return;
            }

            if (error.status === 400) {
                if (error.errors.length) {
                    for (i = 0; i < error.errors.length; i++) {
                        item = error.errors[i];

                        if (fieldIds.indexOf(item.field) !== -1) {
                            UI.setFieldError(item.field, item.message);

                            if (!firstInvalid) {
                                firstInvalid = item.field;
                            }
                        }
                    }
                }

                if (firstInvalid) {
                    focusField(firstInvalid);
                    return;
                }

                UI.setFormError(formElement, error.message);
                return;
            }

            UI.setFormError(
                formElement,
                error.message,
                error.status === 0 ? 'warning' : 'error'
            );
        }

        for (i = 0; i < fieldIds.length; i++) {
            (function (fieldId) {
                var field = document.getElementById(fieldId);

                if (!field) {
                    return;
                }

                field.addEventListener('input', function () {
                    UI.setFieldError(fieldId, '');
                    UI.clearFormError(formElement);
                });
            })(fieldIds[i]);
        }

        form.on('submit', function (event) {
            var email = document.getElementById('email').value.trim();
            var password = document.getElementById('password').value;
            var remember = document.getElementById('remember').checked;
            var firstInvalid = null;

            event.preventDefault();
            UI.clearFieldErrors(formElement);
            UI.clearFormError(formElement);

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                UI.setFieldError('email', 'Enter a valid email address.');
                firstInvalid = 'email';
            }

            if (!password) {
                UI.setFieldError('password', 'Enter your password.');

                if (!firstInvalid) {
                    firstInvalid = 'password';
                }
            }

            if (firstInvalid) {
                focusField(firstInvalid);
                return;
            }

            UI.setLoading(submitButton, true, 'Signing in...');

            API.post('/auth/login', {
                email: email,
                password: password
            }, true)
                .done(function (response) {
                    var data = response.data || {};

                    if (!data.token || !data.user) {
                        UI.setLoading(submitButton, false);
                        UI.setFormError(formElement, 'The server returned an incomplete login response. Please try again.');
                        return;
                    }

                    Auth.saveSession(data.user, data.token, remember);
                    window.location.href = 'index.html?welcome=1';
                })
                .fail(function (xhr) {
                    UI.setLoading(submitButton, false);
                    handleError(API.error(xhr));
                });
        });
    });
})(window, window.jQuery);
