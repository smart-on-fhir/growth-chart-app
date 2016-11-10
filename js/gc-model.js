/*global GC, console, jQuery, setTimeout*/
/*jslint eqeq: true, nomen: true, plusplus: true, forin: true, newcap: true, devel: true*/

/**
 * The GC.Model class and a collection of classes. The model stores its data in
 * JS object (no mather the deepnes) and has rich observing support...
 * @file gc-model.js
 * @author Vladimir Ignatov <vlad.ignatov@gmail.com>
 */
(function($) {

    "use strict";

    // Dummy localStorage
    var localStorage = window.localStorage || {
        removeItem : function(name) {
            if (name !== "removeItem" && this.hasOwnProperty(name)) {
                delete this[name];
            }
        }
    };

    // Just in case :)
    if (!window.localStorage) {
        window.localStorage = {};
    }

    /**
     * Collects and returns (as an array) all the methods of the given object
     * "obj", optionally filtered by the filter function "filterFn".
     */
    function methods(obj, filterFn) {
        var x   = null,
            out = [],
            i   = 0;
        for (x in obj) {
            if (typeof obj[x] == "function" &&
                (!filterFn || filterFn(obj[x], x, obj))) {
                out[i++] = obj[x];
            }
        }
        return out;
    }

    /**
     * Uses the "methods" function above to collect and return (as an array)
     * all the methods of the given object
     * "obj", starting with the given string "startsWith".
     */
    function methodsStartingWith(obj, startsWith) {
        return methods(obj, function(fn, name/*, obj*/) {
            return name.indexOf(startsWith) === 0;
        });
    }

    /**
     * A module that provides two methods - __init() and __uninit() . These
     * methods will in turn search for other methods of the instance starting
     * with "_init__" or "_uninit__" and call all of them. That is an useful
     * base pattern for complex classes where a lot of things might need to be
     * done to initialize or destroy an instance.
     * @param {Object} exports The object to extend
     */
    function GCObject(exports) {

        exports.__init = function() {
            methodsStartingWith(this, "_init__").forEach(function(fn) {
                fn.call(this);
            }, this);
        };

        exports.__uninit = function() {
            methodsStartingWith(this, "_uninit__").forEach(function(fn) {
                fn.call(this);
            }, this);
        };

        return exports;
    }

    /**
     * Class Event - creates custom events for the application. The
     * implementation is relatively standard. The important part - any
     * information that the event might carry should be stored at the "data"
     * property. The event.type property must be considered private.
     */
    function Event(type, data) {

        var _isPropagationStopped = false,
            _isDefaultPrevented = false;

        this.type = type;

        this.data = $.extend({}, data);

        this.stopPropagation = function() {
            _isPropagationStopped = true;
        };

        this.isPropagationStopped = function() {
            return _isPropagationStopped;
        };

        this.preventDefault = function() {
            _isDefaultPrevented = true;
        };

        this.isDefaultPrevented = function() {
            return _isDefaultPrevented;
        };
    }

    /**
     * An Observer module for some objects in the application.
     * @param {Object} exports The object to extend
     * @requires GCObject
     */
    function Observable(exports) {

        var _listeners = {};

        exports._uninit__Observable = function() {
            this.unbind();
            _listeners = null;
        };

        exports.bind = function(eType, handler) {
            if (Object.prototype.toString.call(eType) != "[object Array]") {
                eType = $.trim(eType).split(/\s+/);
            }
            var l = eType.length, i, x;
            for ( i = 0; i < l; i++ ) {
                x = eType[i];
                if (!_listeners.hasOwnProperty(x)) {
                    _listeners[x] = [];
                }
                _listeners[x].push(handler);
            }
            return this;
        };

        exports.unbind = function(eType, handler) {

            if (eType === undefined) {
                _listeners = {};
            }
            else {
                var i, x, fn;
                if (eType == "*") {
                    for (x in _listeners) {
                        if (_listeners.hasOwnProperty(x)) {
                            this.unbind(x, handler);
                        }
                    }
                }
                else {
                    if (_listeners[eType]) {
                        if (!handler) {
                            delete _listeners[eType];
                        }
                        else {
                            for (i = _listeners[eType].length - 1; i >= 0; i--) {
                                fn = _listeners[eType][i];
                                if (handler === fn) {
                                    _listeners[eType].splice(i, 1);
                                }
                            }
                        }
                    }
                }
            }
            return this;
        };

        exports.trigger = function(eType, data) {

            // This one is special and can only be triggered internaly
            if (eType == "*") {
                return true;
            }

            var evt = new Event(eType, data), handlers, type, i, l;
            for (type in _listeners) {
                handlers = _listeners[type];
                l = handlers.length;
                for (i = 0; i < l; i++) {
                    if (eType == type || type == "*") {
                        handlers[i].call(exports, evt);
                        if (evt.isPropagationStopped()) {
                            break;
                        }
                    }
                }
            }
            return !evt.isDefaultPrevented();
        };

        return exports;
    }

    /**
     * Module ObjectAccessors - very powerful utility, even if it adds just one
     * method to the target object.
     * @param {Object} exports The object to extend
     * @param {Object} props The object that should act as dataSource
     * @requires Observable, GCObject
     */
    function ObjectAccessors(exports, props) {

        /**
         * Provides dynamic access to the data in @props. Examples
         *
         * obj.prop("name"); -> returns props[name] (or undefined)
         * obj.prop("name.name2");-> returns props[name][name2] (or undefined)
         * obj.prop("name", "value"); -> sets props[name] to "value"
         * obj.prop("name", undefined); -> deletes props[name]
         * ... and many other options - see the code for details ...
         *
         * Also, some event are fired on the @exports object. They are:
         * "noSuchProperty"
         * "beforeDelete" (cancelable)
         * "delete"
         * "beforeCreate" (cancelable)
         * "create"
         * "create:{name}"
         * "set"
         * "set:{name}"
         *
         * Also, custom accessors, defined as "_unset__{name}", "_set__{name}"
         * or "_get__{name}" will be called if they exist...
         */
        exports.prop = function(path, value) {
            var cur = props,
                reg = new RegExp("\\[['\"]?([^\\]]+)['\"]?\\]", "g"),
                segments = path.replace(reg, ".$1").split("."),
                l = segments.length,
                curPath = [],
                oldValue,
                newValue,
                camelName,
                eventData,
                name,
                isNew,
                i, s;

            for ( i = 0; i < l; i++ ) {
                curPath[i] = name = segments[i];
                if ( i == l - 1 ) { // last

                    camelName = name.charAt(0).toUpperCase() + name.substr(1);
                    oldValue  = cur[name];
                    eventData = {
                        name  : name,
                        value : oldValue,
                        path  : path,
                        json  : props
                    };

                    // GET -----------------------------------------------------
                    if ( arguments.length < 2 ) {

                        // Try the getter first
                        s = "_get__" + camelName;
                        if (this.hasOwnProperty(s) && typeof this[s] == "function") {
                            return this[s]();
                        }

                        if (!cur.hasOwnProperty(name)) {
                            this.trigger("noSuchProperty", eventData);
                        }

                        return cur[name];
                    }

                    // DELETE --------------------------------------------------
                    if (value === undefined) {
                        if (cur[name] !== undefined) {
                            if (this.trigger("beforeDelete", eventData)) {

                                // Try  custom method for deletion
                                s = "_unset__" + camelName;
                                if (this.hasOwnProperty(s) && typeof this[s] == "function") {
                                    this[s]();
                                }
                                else {
                                    delete cur[name];

                                }

                                this.trigger("delete", eventData);

                                return true;
                            }
                        }
                        return false;
                    }

                    // SET (or CREATE) -----------------------------------------
                    if (oldValue !== value) {

                        // Check if CREATE is allowed
                        if (!cur.hasOwnProperty(name)) {
                            isNew = true;
                            if (!this.trigger("beforeCreate", {
                                name  : name,
                                value : value,
                                path  : path
                            })) {
                                return false;
                            }
                        }

                        // Try setter function
                        s = "_set__" + camelName;
                        if (this.hasOwnProperty(s) && typeof this[s] == "function") {
                            cur[name] = this[s](value);
                        }
                        else {
                            cur[name] = value;
                        }

                        newValue = this.prop(path);

                        if (newValue !== oldValue) {
                            eventData = {
                                name     : name,
                                newValue : newValue,
                                oldVlue  : oldValue,
                                path     : path,
                                json     : props
                            };
                            this.trigger(
                                isNew ?
                                    "create:" + name :
                                    "set:" + name,
                                eventData
                            );
                            this.trigger(
                                isNew ?
                                    "create" :
                                    "set",
                                eventData
                            );
                        }

                        return true;
                    }

                    return false;
                }

                if (!cur.hasOwnProperty(name)) {

                    // Called to read, but an intermediate path segment was not
                    // found - return undefined
                    if ( arguments.length === 1 ) {
                        this.trigger("noSuchProperty", { name : curPath.join(".") });
                        return undefined;
                    }

                    // Called to write, but an intermediate path segment was not
                    // found - create it and continue
                    cur[name] = isNaN(parseFloat(name)) ||
                        String(parseFloat(name)) !== String(name) ? {} : [];
                }

                cur = cur[name];
            }
        };

        return exports;
    }

    /**
     * The Model class.
     * @param {Object} data The object that contains the runtime data
     * @param {Object} readOnlyData (optional) If provided, the contents of this
     * object will always be applied "on top" of the "data" object, making them
     * act as read-only template...
     * @param {Object} proxy (optional) The proxy object that should handle the
     * CRUD tasks to sync this model with something else... This is optional
     * here (as constructor param.), but must be set before the first save or
     * sync call.
     */
    function Model( data, readOnlyData, proxy ) {
        var model = this;

        this.proxy = proxy;
        this._data = data;
        this._readOnlyData = readOnlyData;
        this.autoCommit = true;

        //proxy.setModel(this);

        GCObject(this);
        Observable(this);
        ObjectAccessors(this, data);

        /**
         * If the changes are currently being written - schedule one more "save"
         * to be esecuted later.
         */
        function save() {
            var dfd = $.Deferred();
            model.proxy.write(data).done(function(value) {
                $.extend(true, data, value, readOnlyData);
                dfd.resolve(data);
            }).fail(function(/*e*/) {
                dfd.reject();
            });
            return dfd.promise();
        }

        function sync() {
            var dfd = $.Deferred();
            model.proxy.read().done(function(serverData) {

                // Update the stored data because the config file is newer
                if (!serverData || !serverData.fileRevision || serverData.fileRevision < data.fileRevision) {
                    data.fileRevision = data.fileRevision || 1;
                    save().done(function(_data) {
                        dfd.resolve(_data);
                    });
                }

                // Use the stored data because the config file is NOT newer
                else {
                    dfd.resolve($.extend(true, data, serverData, readOnlyData));
                }
            });
            return dfd;
        }

        model.bind("set", function(/*e*/) {
            if ( model.autoCommit ) {
                save();
            }
        });

        this.save = save;
        this.sync = sync;
    }

    /**
     * Class LocalStorageProxy - simple proxy for working with the localStorage
     * @param {String} name The name of the localStorage key to use for the data
     */
    function LocalStorageProxy(name) {
        return {
            read : function() {
                return $.when($.parseJSON(localStorage[name] || "{}"));
            },
            write : function(value) {
                localStorage[name] = JSON.stringify(value);
                return this.read();
            },
            unset : function() {
                localStorage.removeItem(name);
                return this.read();
            }
        };
    }

    /**
     * Class SmartSettingsProxy - uses the SMART preferences API to store the
     * data.
     */
    function SmartSettingsProxy() {
        return {
            read  : GC.getPreferences,
            write : function(dataToWrite) {
                return GC.setPreferences(JSON.stringify(dataToWrite));
            },
            unset : GC.deletePreferences
        };
    }

    /**
     * Class SmartScratchpadProxy - uses the SMART scratchpad API to store the
     * data.
     */
    function SmartScratchpadProxy() {
        return {
            read  : GC.getScratchpad,
            write : function(dataToWrite) {
                return GC.setScratchpad(JSON.stringify(dataToWrite));
            },
            unset : GC.deleteScratchpad
        };
    }

    /**
     * Class DummyProxy - uses the memory to store the data (i.e. the data will
     * be lost after page refresh).
     */
    function DummyProxy() {
        var data = {};
        return {
            read : function() {
                return $.when(data);
            },
            write : function(value) {
                data = value;
                return this.read();
            },
            unset : function() {
                data = {};
                return this.read();
            }
        };
    }

    // Augment GC wit the used stuff only
    GC.Model                = Model;
    GC.SmartSettingsProxy   = SmartSettingsProxy;
    GC.SmartScratchpadProxy = SmartScratchpadProxy;
    GC.LocalStorageProxy    = LocalStorageProxy;
    GC.DummyProxy           = DummyProxy;

}(jQuery));
