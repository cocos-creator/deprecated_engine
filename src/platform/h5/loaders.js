// @ifdef EDITOR
var FireUrl = Fire.isNode ? require('fire-url') : null;
// @endif

function ImageLoader(url, callback, onProgress) {
// @ifdef EDITOR
    if (FireUrl) {
        url = FireUrl.addRandomQuery(url);
    }
// @endif

    var image = document.createElement('img');
    image.crossOrigin = 'Anonymous';

    var onload = function () {
        if (callback) {
            callback(null, this);
        }
        image.removeEventListener('load', onload);
        image.removeEventListener('error', onerror);
        image.removeEventListener('progress', onProgress);
    };
    var onerror = function (msg, line, url) {
        if (callback) {
            var error = 'Failed to load image: ' + msg + ' Url: ' + url;
            callback(error, null);
        }
        image.removeEventListener('load', onload);
        image.removeEventListener('error', onerror);
        image.removeEventListener('progress', onProgress);
    };

    image.addEventListener('load', onload);
    image.addEventListener('error', onerror);
    if (onProgress) {
        image.addEventListener('progress', onProgress);
    }
    image.src = url;
    return image;
}

/**
 * @method _LoadFromXHR
 * @param {string} [responseType="text"] - the XMLHttpRequestResponseType
 */
function _LoadFromXHR(url, callback, onProgress, responseType) {
    var xhr = new XMLHttpRequest();
    //xhr.withCredentials = true;   // INVALID_STATE_ERR: DOM Exception 11 in phantomjs
    var total = -1;
    xhr.onreadystatechange = function () {
        if (xhr.readyState === xhr.DONE) {
            if (callback) {
                if (xhr.status === 200 || xhr.status === 0) {
                    callback(null, xhr);
                }
                else {
                    callback('LoadFromXHR: Could not load "' + url + '", status: ' + xhr.status, null);
                }
            }
            xhr.onreadystatechange = null;
            //xhr.onload = null;
            if (addedProgressListener) {
                xhr.removeEventListener('progress', addedProgressListener);
            }
        }
        else {
            if (onProgress && xhr.readyState === xhr.LOADING && !('onprogress' in xhr)) {
                if (total === -1) {
                    total = xhr.getResponseHeader('Content-Length');
                }
                onProgress(xhr.responseText.length, total);
            }
            if (onProgress && xhr.readyState === xhr.HEADERS_RECEIVED) {
                total = xhr.getResponseHeader('Content-Length');
            }
        }
    };
    //xhr.onload = function () {
    //    if (callback) {
    //        if (xhr.status === 200 || xhr.status === 0) {
    //            callback(xhr);
    //        }
    //        else {
    //            callback(null, 'LoadFromXHR: Could not load "' + url + '", status: ' + xhr.status);
    //        }
    //    }
    //    xhr.onreadystatechange = null;
    //    xhr.onload = null;
    //    if (addedProgressListener) {
    //        xhr.removeEventListener('progress', addedProgressListener);
    //    }
    //};
    xhr.open('GET', url, true);
    if (responseType) {
        xhr.responseType = responseType;
    }
    var addedProgressListener;
    if (onProgress && 'onprogress' in xhr) {
        addedProgressListener = function (event) {
            if (event.lengthComputable) {
                onProgress(event.loaded, event.total);
            }
        };
        xhr.addEventListener('progress', onprogress);
    }
    xhr.send();
}

function TextLoader(url, callback, onProgress) {
    var cb = callback && function(error, xhr) {
        if (xhr && xhr.responseText) {
            callback(null, xhr.responseText);
        }
        else {
            callback('TextLoader: "' + url +
                '" seems to be unreachable or the file is empty. InnerMessage: ' + error, null);
        }
    };
    _LoadFromXHR(url, cb, onProgress);
}

/**
 * @method _JsonLoader
 * @param {string} url
 * @param {function} callback
 * @param {string} callback.param error - null or the error info
 * @param {object} callback.param data - the loaded json object or null
 * @async
 * @private
 */
function JsonLoader(url, callback, onProgress) {
    var cb = callback && function(error, xhr) {
        if (xhr && xhr.responseText) {
            var json;
            try {
                json = JSON.parse(xhr.responseText);
            }
            catch (e) {
                callback(e, null);
                return;
            }
            callback(null, json);
        }
        else {
            callback('JsonLoader: "' + url +
                '" seems to be unreachable or the file is empty. InnerMessage: ' + error, null);
        }
    };
    _LoadFromXHR(url, cb, onProgress);
}

Fire._JsonLoader = JsonLoader;
