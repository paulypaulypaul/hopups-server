var util = require("util");

/**
 * Create a new instance of logger.
 * @param owner
 * @param writer
 * @constructor
 */
var Logger = function (owner, writer) {
    if (!writer) {
        writer = function () {
            console.log.apply(console, arguments);
        };
    }
    this._setOwner(owner);
    this._setWriter(writer);
};

Logger.prototype = {
    /**
     * Get the owner.
     * @returns {*}
     * @private
     */
    _getOwner: function () {
        return this._owner;
    },
    /**
     * Set the owner.
     * @param owner
     * @private
     */
    _setOwner: function (owner) {
        this._owner = owner;
    },
    /**
     * Get the writer.
     * @returns {Function}
     * @private
     */
    _getWriter: function () {
        return this._writer;
    },
    /**
     * Set the writer.
     * @param {Function} writer
     * @private
     */
    _setWriter: function (writer) {
        this._writer = writer;
    },
    /**
     * Get the log level.
     * @returns {String}
     * @private
     */
    _getLevel: function () {
        var level = process.env.LOG_LEVEL || "DEBUG";
        var parsed = parseInt(level);
        if (isNaN(parsed)) {
            return this._ensureLogCode(level);
        }
        return parsed;
    },
    /**
     * Write a message to the log.
     * @param {...*} data
     */
    trace: function () {
        Array.prototype.unshift.call(arguments, Logger.Level.TRACE);
        this._write.apply(this, arguments);
    },
    /**
     * Write a message to the log.
     * @param {...*} data
     */
    debug: function () {
        Array.prototype.unshift.call(arguments, Logger.Level.DEBUG);
        this._write.apply(this, arguments);
    },
    /**
     * Write a message to the log.
     * @param {...*} data
     */
    info: function () {
        Array.prototype.unshift.call(arguments, Logger.Level.INFO);
        this._write.apply(this, arguments);
    },
    /**
     * Write a message to the log.
     * @param {...*} data
     */
    warn: function () {
        Array.prototype.unshift.call(arguments, Logger.Level.WARN);
        this._write.apply(this, arguments);
    },
    /**
     * Write a message to the log.
     * @param {...*} data
     */
    error: function () {
        Array.prototype.unshift.call(arguments, Logger.Level.ERROR);
        this._write.apply(this, arguments);
    },
    /**
     * Write a message to the log.
     * @param {...*} data
     */
    fatal: function () {
        Array.prototype.unshift.call(arguments, Logger.Level.FATAL);
        this._write.apply(this, arguments);
    },
    /**
     * Write a message to the log.
     * @param {...*} data
     */
    _write: function () {
        var level = Array.prototype.shift.call(arguments);
        if (!this._isLevelEnabled(level)) {
            return;
        }
        var owner = this._getOwner();
        var writer = this._getWriter();
        var prefix = [
            new Date().toLocaleTimeString(),
            ":",
            "-=[" + util.format(owner) + "]=-",
            ":",
            this._ensureLogName(level),
            ":"
        ];
        Array.prototype.unshift.call(arguments, prefix.join(" "));
        writer.apply(owner, arguments);
    },
    /**
     * Get the log level code.
     * @param {Number|String} level
     * @returns {Number}
     * @private
     */
    _ensureLogCode: function (level) {
        if (typeof level == "string") {
            return this._getLogLevel(level);
        }
        return level;
    },
    /**
     * Get the log level name.
     * @param {Number|String} level
     * @returns {String}
     * @private
     */
    _ensureLogName: function (level) {
        if (typeof level == "number") {
            return this._getLogLevel(level);
        }
        return level;
    },
    /**
     * Convert level name to code/code to name.
     * @param {Number|String} level
     * @private
     */
    _getLogLevel: function (level) {
        var result;
        if (typeof level === "string") {
            result = Logger.Level[level];
        }
        else if (typeof level === "number") {
            for (var key in Logger.Level) {
                var value = Logger.Level[key];
                if (value !== level) {
                    continue;
                }
                result = key;
                break;
            }
        }
        if (!result) {
            throw level + " is not a key or value of Logger.Level.";
        }
        return result;
    },
    /**
     * Determine whether the specified log level is enabled.
     * @param {Number|String} level
     * @private
     */
    _isLevelEnabled: function (level) {
        var filter = this._getLevel();
        return this._ensureLogCode(level) >= this._ensureLogCode(filter);
    }
};

Logger.Level = {
    NONE: 0,
    TRACE: 1,
    DEBUG: 2,
    INFO: 3,
    WARN: 4,
    ERROR: 5,
    FATAL: 6
};

module.exports = Logger;

/**
 * Create a new logger.
 * @param owner
 * @returns {Logger}
 */
module.exports.create = function (owner) {
    return new Logger(owner);
};
