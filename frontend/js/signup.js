(function (window, $) {
    'use strict';

    $(function () {
        var Auth = window.CivicAuth;
        var API = window.CivicAPI;
        var UI = window.CivicUI;
        var form = $('#signup-form');
        var formElement = form[0];
        var passwordInput = document.getElementById('password');
        var submitButton = document.getElementById('signup-submit');
        var bar = document.getElementById('password-strength-bar');
        var label = document.getElementById('password-strength-label');
        var rules = document.getElementById('password-rules');
        var meter = document.getElementById('password-strength');
        var fieldIds = ['full_name', 'email', 'password', 'confirm_password'];
        var i;

        if (Auth.redirectIfAuthenticated()) {
            return;
        }

        UI.bindPasswordToggles(document);

        function updateStrength() {
            UI.renderPasswordStrength(passwordInput.value, bar, label, rules, meter);
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

            if (error.status === 409) {
                UI.setFieldError('email', error.message);
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

                if (/password/i.test(error.message)) {
                    UI.setFieldError('password', error.message);
                    focusField('password');
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

        passwordInput.addEventListener('input', function () {
            UI.setFieldError('password', '');
            updateStrength();
        });

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
            var fullName = document.getElementById('full_name').value.trim();
            var email = document.getElementById('email').value.trim();
            var password = passwordInput.value;
            var confirmation = document.getElementById('confirm_password').value;
            var checks = UI.getPasswordChecks(password);
            var firstInvalid = null;

            event.preventDefault();
            UI.clearFieldErrors(formElement);
            UI.clearFormError(formElement);

            function invalid(fieldId, message) {
                UI.setFieldError(fieldId, message);

                if (!firstInvalid) {
                    firstInvalid = fieldId;
                }
            }

            if (!fullName) {
                invalid('full_name', 'Enter your full name.');
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                invalid('email', 'Enter a valid email address.');
            }

            if (!checks.length || !checks.upper || !checks.lower || !checks.number || !checks.special) {
                invalid('password', 'Use at least 8 characters with uppercase, lowercase, a number, and a special character.');
            }

            if (!confirmation) {
                invalid('confirm_password', 'Confirm your password.');
            } else if (confirmation !== password) {
                invalid('confirm_password', 'Passwords do not match.');
            }

            if (firstInvalid) {
                focusField(firstInvalid);
                return;
            }

            UI.setLoading(submitButton, true, 'Creating account...');

            API.post('/auth/signup', {
                full_name: fullName,
                email: email,
                password: password
            }, true)
                .done(function () {
                    window.location.href = 'login.html?registered=1';
                })
                .fail(function (xhr) {
                    UI.setLoading(submitButton, false);
                    handleError(API.error(xhr));
                });
        });

        updateStrength();
    });
})(window, window.jQuery);
