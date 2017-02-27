'use strict';

/**
 * Module dependencies.
 */
var _url = require('url');
var EventEmitter = require('events').EventEmitter;
var util = require('util');
var _qs = require('querystring');
var _isEqual = require('lodash.isequal');
var objectRegExp = /^\[object (\S+)\]$/;
var toString = Object.prototype.toString;

/**
 * Module exports.
 */

module.exports = Query;

/**
 * `Query` constructor.
 */
function Query() {
    this._store = {};
    this._count = 0;
    EventEmitter.call(this)
}

/**
 * Inherit from EventEmitter.
 */

util.inherits(Query, EventEmitter);

Query.prototype.register = function (fn) {
    var self = this;
    if (typeof fn !== 'function') {
        throw new TypeError('queryOnce.register() requires function but got a ' + gettype(fn));
    }
    return function (req, res, next) {
        var url = _url.parse(req.originalUrl);
        var pathname = url.pathname;
        if (!self._store[pathname]) {
            self._store[pathname] = {
                querys: [],
                checks: [],//querys
                check: true//no query
            };
        }
        var querys = self._store[pathname].querys;
        var checks = self._store[pathname].checks;
        if (url.query) {
            var query = _qs.parse(url.query);
            for (var i = 0; i < querys.length; i++) {
                if (querys[i] !== null && _isEqual(querys[i], query)) {
                    break;
                }
            }
            if (i === querys.length) {
                self._count++;
                querys.push(query);
                checks.push(true);
            }
            self.once(pathname + '?' + 'i=' + i, fn.bind(res));
            req.queryOnceIndex = i;
        } else {
            self.once(pathname + '?' + 'i=' + '-1', fn.bind(res));
            req.queryOnceIndex = -1;
        }
        next();
    };
};

Query.prototype.isComplete = function (req) {
    if (typeof req !== "object" || typeof req.queryOnceIndex === 'undefined') {
        throw new TypeError('queryOnce.complete() requires req object');
    }
    var index = req.queryOnceIndex;
    var url = _url.parse(req.originalUrl);
    var _path = this._store[url.pathname];
    if (index === -1) {
        if (_path.check) {
            _path.check = false;
            return true;
        }
    } else {
        if (_path.checks[index]) {
            _path.checks[index] = false;
            return true;
        }
    }
    return false;
};

Query.prototype.success = function (req, data) {
    var index = req.queryOnceIndex;
    var url = _url.parse(req.originalUrl);
    var pathname = url.pathname;
    var _path = this._store[pathname];
    if (index === -1) {
        this.emit(pathname + '?' + 'i=' + '-1', data);
        _path.check = true;
    } else {
        this.emit(pathname + '?' + 'i=' + index, data);
        _path.checks[index] = null;
        _path.querys[index] = null;
        if (--this._count === 0) {
            _path.checks = [];
            _path.querys = [];
        }
    }
};

// get type for error message
function gettype(obj) {
    var type = typeof obj;

    if (type !== 'object') {
        return type;
    }

    return toString.call(obj)
        .replace(objectRegExp, '$1');
}





