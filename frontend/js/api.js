(function (window, $) {
    'use strict';

    if (!$) {
        throw new Error('jQuery is required for the API helper.');
    }

    function apiUrl(path) {
        var base = window.CivicConfig.apiBaseUrl.replace(/\/$/, '');
        return base + '/' + path.replace(/^\//, '');
    }

    function error(xhr) {
        var body = xhr.responseJSON || {};
        var status = xhr.status || 0;
        var message = body.message;

        if (!message) {
            if (status === 0) {
                message = 'Cannot reach the server. Make sure the backend is running and try again.';
            } else if (status === 401) {
                message = 'Your session expired. Please sign in again.';
            } else if (status === 403) {
                message = 'You do not have permission to perform this action.';
            } else if (status === 404) {
                message = 'The requested resource was not found.';
            } else if (status === 409) {
                message = 'That action conflicts with an existing record.';
            } else if (status >= 500) {
                message = 'The server ran into a problem. Please try again.';
            } else {
                message = 'The request failed. Please check your details and try again.';
            }
        }

        return {
            status: status,
            message: message,
            errors: body.errors || []
        };
    }

    function handleUnauthorized() {
        if (window.CivicAuth) {
            window.CivicAuth.clearSession();
        }

        if (window.location.pathname.indexOf('login.html') === -1) {
            window.location.replace('login.html?expired=1');
        }
    }

    function request(path, method, data, isPublic) {
        var settings = {
            url: apiUrl(path),
            type: method,
            dataType: 'json'
        };
        var token = window.CivicAuth ? window.CivicAuth.getToken() : null;

        if (!isPublic && token) {
            settings.headers = {
                Authorization: 'Bearer ' + token
            };
        }

        if (data !== undefined) {
            settings.contentType = 'application/json';
            settings.data = JSON.stringify(data);
        }

        return $.ajax(settings).fail(function (xhr) {
            if (xhr.status === 401 && !isPublic) {
                handleUnauthorized();
            }
        });
    }

    window.CivicAPI = {
        request: request,
        error: error,
        get: function (path, isPublic) {
            return request(path, 'GET', undefined, isPublic);
        },
        post: function (path, data, isPublic) {
            return request(path, 'POST', data, isPublic);
        },
        put: function (path, data, isPublic) {
            return request(path, 'PUT', data, isPublic);
        },
        patch: function (path, data, isPublic) {
            return request(path, 'PATCH', data, isPublic);
        },
        del: function (path, isPublic) {
            return request(path, 'DELETE', undefined, isPublic);
        }
    };
})(window, window.jQuery);
