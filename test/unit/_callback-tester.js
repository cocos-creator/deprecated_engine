// jshint ignore: start

var CallbackTester = Fire.extend('', Fire.Component, function () {
    this._expects = [];
    this._messages = [];
    this._unexpect = {};
    this._stopped = false;
});

CallbackTester.OnLoad = 'onLoad';
CallbackTester.start = 'start';
CallbackTester.OnEnable = 'onEnable';
CallbackTester.OnDisable = 'onDisable';
CallbackTester.OnDestroy = 'onDestroy';

/**
 * @param {string} expect
 * @param {string} [message]
 * @param {boolean} [append=false]
 */
CallbackTester.prototype.expect = function (expect, message, append) {
    if (Array.isArray(expect) && expect.length > 0) {
        this.expect(expect[0]);
        for (var i = 1; i < expect.length; ++i) {
            this.expect(expect[i], null, true);
        }
        return this;
    }

    var error = !append && this._expects.length > 0;
    if (error) {
        strictEqual(this._expects[0].expect, null, 'expecting a new callback but the last ' + this._expects[0].expect + ' have not being called');
        this._expects.length = 0;
    }
    else {
        delete this._unexpect[expect];
    }
    this._expects.push({
        expect: expect,
        message: message
    });
    return this;
};

/**
 * @param {string} notExpect
 * @param {string} [message]
 */
CallbackTester.prototype.notExpect = function (notExpect, message) {
    if (this._expects.length > 0 && this._expects[0].expect === notExpect) {
        ok(false, 'The callback not expected is still expected, the last callback not called yet ?');
        return;
    }
    this._unexpect[notExpect] = message;
    return this;
};

/**
 * stop reporting errors
 */
CallbackTester.prototype.stopTest = function () {
    if (this._expects && this._expects.length > 0) {
        var last = this._expects.splice(0, 1)[0];
        var expect = last.expect;
        var message = last.message;
        ok(false, 'The last expected ' + expect + ' not called yet: ' + message);
    }
    this._stopped = true;
    this._expects = null;
    this._messages = null;
    this._unexpect = null;
};

CallbackTester.prototype._assert = function (actual) {
    if (this._stopped) {
        return;
    }
    if (this._expects.length > 0) {
        var current = this._expects.splice(0, 1)[0];
        var expect = current.expect;
        var message = current.message;
    }
    if (expect !== actual) {
        var error = this._unexpect[actual];
        if (!error) {
            if (expect) {
                error = '' + expect + ' not called, actual: ' + actual;
            }
            else {
                error = 'not expect any callback but ' + actual + ' called';
            }
        }
    }
    strictEqual(actual, expect, error || message || '' + expect + ' called');
    this._unexpect = {};
    //Fire.log('CallbackTester: ' + actual);
};

CallbackTester.prototype.onLoad = function () {
    this._assert(CallbackTester.OnLoad);
};

CallbackTester.prototype.start = function () {
    this._assert(CallbackTester.start);
};

CallbackTester.prototype.onEnable = function () {
    this._assert(CallbackTester.OnEnable);
};

CallbackTester.prototype.onDisable = function () {
    this._assert(CallbackTester.OnDisable);
};

CallbackTester.prototype.onDestroy = function () {
    this._assert(CallbackTester.OnDestroy);
};

// jshint ignore: end
