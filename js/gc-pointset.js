/* global $, GC */
/**
 * Class PointSet - wraps an array of objects and adds some useful methods to
 * work with that array. An instance would be relatively the same as line of
 * points where each point has "x" and "y" properties and whatever else in "data"
 * property.
 * @constructor
 * @param {Array} data The data array to use. The array must contain zero or
 *                     more objects having the dimensionX and dimensionY
 *                     properties as they are defined in the next arguments.
 * @param {String} dimensionX The name of the property of the points (data items)
 *                            that should be used to determine their X position.
 *                            Defaults to "x".
 * @param {String} dimensionY The name of the property of the points (data items)
 *                            that should be used to determine their Y position.
 *                            Defaults to "y".
 */
function PointSet( data, dimensionX, dimensionY )
{
    /**
     * The name of the X dimension property
     * @type String
     */
    this.dimensionX = dimensionX || "x";

    /**
     * The name of the Y dimension property
     * @type String
     */
    this.dimensionY = dimensionY || "y";

    /**
     * The data array
     * @type Array
     */
    this._data = $.extend(true, [], data);

    /**
     * The original data array without any filters applied to it.
     * @type Array
     */
    this._originalData = $.extend(true, [], this._data);

    /**
     * The data length. This property exists only to improve the performance.
     * Counting the items is slow and that's why that count is stored internally
     * here (and updated when needed) and this property MUST be considered
     * READ ONLY!
     * @type Number
     */
    this._length = this._data.length;

    /**
     * Stores (caches) the metadata for the min/max values in both dimensions.
     * READ ONLY!
     * @type Object
     */
    this._bounds = null;
}

PointSet.prototype = {

    /**
     * Iterates over the data items using the fastest method available.
     * @param {Function} callback The callback function that will be invoked
     *                            with the following arguments:
     *                            0 - the data item
     *                            1 - the index of the item
     *                            2 - the data array
     *                            Inside the callback "this" will point to the
     *                            PointSet instance.
     * @returns {PointSet} Returns this instance.
     * @type Function
     */
    forEach : function( callback ) {
        this._data.forEach( callback, this );
        return this;
    },

    /**
     * Resets the data to it's initial state and updates this._length
     * @returns {PointSet} Returns this instance.
     */
    reset : function() {
        this._data = $.extend(true, [], this._originalData);
        this._length = this._data.length;
        this._bounds = null;
        return this;
    },

    /**
     * Limits the data and leaves only entries within the provided boundaries.
     * @param {Number} minX The minimal this.dimensionX value.
     * @param {Number} maxX The maximal this.dimensionX value.
     * @param {Number} minY The minimal this.dimensionY value.
     * @param {Number} maxY The maximal this.dimensionY value.
     * @returns {PointSet} Returns this instance.
     */
    limit : function( minX, maxX, minY, maxY ) {
        var out = [];

        minX = GC.Util.floatVal( minX, Number.MIN_VALUE);
        maxX = GC.Util.floatVal( maxX, Number.MAX_VALUE);
        minY = GC.Util.floatVal( minY, Number.MIN_VALUE);
        maxY = GC.Util.floatVal( maxY, Number.MAX_VALUE);

        this.forEach(function( entry/*, idx, data*/ ) {
            if (entry[this.dimensionX] >= minX &&
                entry[this.dimensionX] <= maxX &&
                entry[this.dimensionY] >= minY &&
                entry[this.dimensionY] <= maxY) {
                this._length = out.push( entry );
            }
        });

        this._data = out;
        this._bounds = null;
        return this;
    },

    /**
     * Limits the data and leaves only entries within the provided boundaries.
     * @param {Number} min The minimal this.dimensionX value.
     * @param {Number} max The maximal this.dimensionX value.
     * @returns {PointSet} Returns this instance.
     */
    limitX : function( min, max ) {
        return this.limit( min, max );
    },

    /**
     * Limits the data and leaves only entries within the provided boundaries.
     * @param {Number} min The minimal this.dimensionY value.
     * @param {Number} max The maximal this.dimensionY value.
     * @returns {PointSet} Returns this instance.
     */
    limitY : function( min, max ) {
        return this.limit( null, null, min, max );
    },

    compact : function() {
        var i = 1, l = this._data.length, prev, entry;
        while ( i < l ) {
            prev  = this._data[i - 1];
            entry = this._data[i];
            if ( entry[this.dimensionX] === prev[this.dimensionX] &&
                 entry[this.dimensionY] === prev[this.dimensionY] ) {
                $.extend(true, this._data[i - 1], this._data[i]);
                this._data.splice(i, 1);
                l--;
            } else {
                i++;
            }
        }
        this._length = l;
        return this;
    },

    limitDensity : function(maxDensity) {
        var l = this._data.length;
        if (l > maxDensity) {
            var i    = 0, i2,
                step = Math.ceil(l / maxDensity),
                tmp  = [];

            this._length = 0;
            for ( i = 0; i < l + step; i += step ) {
                i2 = Math.min(i, l - 1);
                tmp[this._length++] = this._data[i2];
            }
            this._data = tmp;
        }
        return this;
    },

    /**
     * Clips the data using the virtual rectangle made of the given min/max
     * values.
     * @param {Number} minX
     * @param {Number} maxX
     * @param {Number} minY
     * @param {Number} maxY
     * @returns {PointSet} Returns this instance.
     */
    clip : function( minX, maxX, minY, maxY ) {

        if ( this._length < 1 ) {
            return this;
        }

        minX = GC.Util.floatVal( minX, Number.MIN_VALUE);
        maxX = GC.Util.floatVal( maxX, Number.MAX_VALUE);
        minY = GC.Util.floatVal( minY, Number.MIN_VALUE);
        maxY = GC.Util.floatVal( maxY, Number.MAX_VALUE);

        if ( this._length < 2 ) {
            var entry = this._data[0];
            if ( entry[this.dimensionX] > maxX ||
                 entry[this.dimensionX] < minX ||
                 entry[this.dimensionY] > maxY ||
                 entry[this.dimensionY] < minY ) {
                this._data = [];
                this._length = 0;
            }
            return this;
        }

        var out = [],
            x   = this.dimensionX,
            y   = this.dimensionY;

        this.forEach(function( _entry, index, data ) {
            if (index > 0) {
                var prev = data[index - 1],
                    line = GC.Util.clipLine(
                        prev[x],
                        prev[y],
                        _entry[x],
                        _entry[y],
                        minX, maxX, minY, maxY
                    ), tmp;

                if (line) {
                    tmp = $.extend(true, {}, data[index - 1]);
                    tmp[x] = line[0];
                    tmp[y] = line[1];
                    tmp.virtual = line[0] !== data[index - 1][x] || line[1] !== data[index - 1][y];
                    this._length = out.push(tmp);

                    tmp = $.extend(true, {}, _entry);
                    tmp[x] = line[2];
                    tmp[y] = line[3];
                    tmp.virtual = line[2] !== _entry[x] || line[3] !== _entry[y];
                    this._length = out.push(tmp);
                }
            }
        });

        this._data = out;
        this._bounds = null;
        return this;
    },

    /**
     * Limits the data and leaves only entries within the provided boundaries,
     * plus one entry more for each direction that has the closest dimension
     * value to the boundary.
     * @param {Number} min The minimal this.dimensionX value.
     * @param {Number} max The maximal this.dimensionX value.
     * @returns {PointSet} Returns this instance.
     */
    limitXouter : function( min, max ) {
        this._data = limitOuter( this._originalData, this.dimensionX, min, max );
        this._length = this._data.length;
        this._bounds = null;
        return this;
    },

    /**
     * Limits the data and leaves only entries within the provided boundaries,
     * plus one entry more for each direction that has the closest dimension
     * value to the boundary.
     * @param {Number} min The minimal this.dimensionY value.
     * @param {Number} max The maximal this.dimensionY value.
     * @returns {PointSet} Returns this instance.
     */
    limitYouter : function( min, max ) {
        this._data = limitOuter( this._originalData, this.dimensionY, min, max );
        this._length = this._data.length;
        this._bounds = null;
        return this;
    },

    /**
     * Calculates the min-max values for both dimensions and caches the result
     * in the "this._bounds" property.
     * @returns {Object}
     */
    getBounds : function() {
        if ( !this._bounds ) {

            var minX = null,
                maxX = null,
                minY = null,
                maxY = null;

            this.forEach(function( entry/*, index, data*/ ) {
                if ( minX === null || entry[this.dimensionX] < minX ) {
                    minX = entry[this.dimensionX];
                }
                if ( minY === null || entry[this.dimensionY] < minY ) {
                    minY = entry[this.dimensionY];
                }
                if ( maxX === null || entry[this.dimensionX] > maxX ) {
                    maxX = entry[this.dimensionX];
                }
                if ( maxY === null || entry[this.dimensionY] > maxY ) {
                    maxY = entry[this.dimensionY];
                }
            });

            this._bounds = {};
            this._bounds[this.dimensionX] = { min : minX, max: maxX };
            this._bounds[this.dimensionY] = { min : minY, max: maxY };
        }
        return this._bounds;
    },

    /**
     * Apply Simple moving average algorithm to the items "n" times.
     * @param n
     */
    smooth : function(n) {
        var newY = null, newX = null, i;

        function doSmooth( entry, index, data ) {
            if ( index > 0 && index < this._length - 1 ) {
                newY = (data[index-1][this.dimensionY] +
                        data[index  ][this.dimensionY] * 3 +
                        data[index+1][this.dimensionY]) / 5;
                newX = (data[index-1][this.dimensionX] +
                        data[index  ][this.dimensionX] +
                        data[index+1][this.dimensionX]) / 3;
                entry.virtual = newY !== entry[this.dimensionY] ||
                                newX !== entry[this.dimensionX];
                entry[this.dimensionY] = newY;
                entry[this.dimensionX] = newX;
            }
        }

        n = GC.Util.floatVal(n, 1);
        if (n <= 0) {
            return;
        }
        for (i = 0; i < n; i++) {
            this.forEach(doSmooth);
        }
        return this;
    }
};
