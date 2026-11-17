(function (window) {
    'use strict';

    var strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

    function setFieldError(fieldId, message) {
        var input = document.getElementById(fieldId);
        var error = document.getElementById(fieldId + '-error');

        if (!input) {
            return;
        }

        if (!message) {
            input.removeAttribute('aria-invalid');
            input.classList.remove('field-invalid');

            if (error) {
                error.textContent = '';
                error.hidden = true;
            }

            return;
        }

        input.setAttribute('aria-invalid', 'true');
        input.classList.add('field-invalid');

        if (error) {
            error.textContent = message;
            error.hidden = false;
        }
    }

    function clearFieldErrors(form) {
        var errors = form.querySelectorAll('.field-error');
        var inputs = form.querySelectorAll('[aria-invalid="true"]');
        var i;

        for (i = 0; i < errors.length; i++) {
            errors[i].textContent = '';
            errors[i].hidden = true;
        }

        for (i = 0; i < inputs.length; i++) {
            inputs[i].removeAttribute('aria-invalid');
            inputs[i].classList.remove('field-invalid');
        }
    }

    function setFormError(form, message, type) {
        var banner = form.querySelector('[data-form-error]');

        if (!banner) {
            return;
        }

        banner.textContent = message;
        banner.className = 'message message--' + (type || 'error');
        banner.hidden = false;
    }

    function clearFormError(form) {
        var banner = form.querySelector('[data-form-error]');

        if (!banner) {
            return;
        }

        banner.textContent = '';
        banner.className = 'message';
        banner.hidden = true;
    }

    function setLoading(button, loading, loadingText) {
        if (!button) {
            return;
        }

        if (loading) {
            button.setAttribute('data-original-text', button.textContent);
            button.setAttribute('data-loading', 'true');
            button.disabled = true;
            button.setAttribute('aria-busy', 'true');
            button.textContent = loadingText || 'Please wait...';
            return;
        }

        if (button.getAttribute('data-loading') !== 'true') {
            return;
        }

        button.setAttribute('data-loading', 'false');
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.textContent = button.getAttribute('data-original-text') || button.textContent;
    }

    function showMessage(elementId, message, type) {
        var element = document.getElementById(elementId);

        if (!element) {
            return;
        }

        element.textContent = message;
        element.className = 'message message--' + (type || 'info');
        element.hidden = false;
    }

    // The assignment requires a success toast only after signup.
    function showSignupToast() {
        var toast = document.getElementById('signup-toast');

        if (!toast) {
            return;
        }

        toast.hidden = false;
        window.setTimeout(function () {
            toast.hidden = true;
        }, 5000);
    }

    function bindPasswordToggles(root) {
        var buttons = root.querySelectorAll('[data-password-toggle]');
        var i;

        for (i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', function () {
                var button = this;
                var input = document.getElementById(button.getAttribute('data-password-toggle'));
                var showPassword;

                if (!input) {
                    return;
                }

                showPassword = input.type === 'password';
                input.type = showPassword ? 'text' : 'password';
                button.textContent = showPassword ? 'Hide' : 'Show';
                button.setAttribute('aria-pressed', showPassword ? 'true' : 'false');
                button.setAttribute('aria-label', showPassword ? 'Hide password' : 'Show password');
            });
        }
    }

    function getPasswordChecks(password) {
        return {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[\W_]/.test(password)
        };
    }

    function setRuleState(rules, name, met) {
        var rule = rules.querySelector('[data-rule="' + name + '"]');

        if (!rule) {
            return;
        }

        if (met) {
            rule.classList.add('is-met');
        } else {
            rule.classList.remove('is-met');
        }
    }

    function renderPasswordStrength(password, bar, label, rules, meter) {
        var checks = getPasswordChecks(password);
        var score = 0;
        var level = 0;
        var text = 'not started';

        if (checks.length) {
            score++;
        }
        if (checks.upper) {
            score++;
        }
        if (checks.lower) {
            score++;
        }
        if (checks.number) {
            score++;
        }
        if (checks.special) {
            score++;
        }

        if (password) {
            if (score <= 2) {
                level = 1;
                text = 'Weak';
            } else if (score === 3) {
                level = 2;
                text = 'Fair';
            } else if (score === 4) {
                level = 3;
                text = 'Good';
            } else {
                level = 4;
                text = 'Strong';
            }
        }

        if (bar) {
            bar.className = 'strength-meter__bar strength-meter__bar--' + level;
        }

        if (label) {
            label.textContent = 'Password strength: ' + text;
        }

        if (meter) {
            meter.setAttribute('aria-valuenow', String(level));
            meter.setAttribute('aria-valuetext', text);
        }

        if (rules) {
            setRuleState(rules, 'length', checks.length);
            setRuleState(rules, 'upper', checks.upper);
            setRuleState(rules, 'lower', checks.lower);
            setRuleState(rules, 'number', checks.number);
            setRuleState(rules, 'special', checks.special);
        }
    }

    window.CivicUI = {
        setFieldError: setFieldError,
        clearFieldErrors: clearFieldErrors,
        setFormError: setFormError,
        clearFormError: clearFormError,
        setLoading: setLoading,
        showMessage: showMessage,
        showSignupToast: showSignupToast,
        bindPasswordToggles: bindPasswordToggles,
        getPasswordChecks: getPasswordChecks,
        renderPasswordStrength: renderPasswordStrength
    };
})(window);
