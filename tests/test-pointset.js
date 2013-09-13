
module("DataSet");

test("Creating new DataSet", function() {
	for ( var name in GC.DATA_SETS ) {
		var DS = new DataSet( name, "male" );
		//console.dir(DS)
		ok(DS.name == name);
	}
});

module("PointSet");

test("Creating new PointSet", function() {
	
	var data = [
		{ x: 1, y: 2, data : { a:1, b:2 } },
		{ x: 4, y: 7, data : { a:3, b:4 } },
		{ x: 3, y: 9, data : { a:6, b:5 } }
	];
	
	var Rs = new PointSet( data );
	
	ok(Rs._length == 3, "Rs has the proper length");
	ok(Rs._data.length == 3, "Rs._data has the proper length");
	ok(Rs._originalData.length == 3, "Rs._originalData has the proper length");
	deepEqual(Rs._data, data, "Rs._data has the same structure as the data argument");
	deepEqual(Rs._originalData, data, "Rs._originalData has the same structure as the data argument");
	
	Rs = data = null;
});

test("Testing PointSet.limitX()", function() {
	
	var data = [
		{ x: 1, y: 2, data : { a:1, b:2 } },
		{ x: 4, y: 7, data : { a:3, b:4 } },
		{ x: 3, y: 9, data : { a:6, b:5 } }
	];
	
	var Rs = new PointSet( data );
	
	Rs.limitX(2, 3);
	
	ok(Rs._length === 1, "The length has been limited");
	deepEqual(Rs._data[0], data[2], "The proper item remains inside");
	
	Rs = data = null;
});

test("Testing PointSet.limitXouter()", function() {
	
	var data = [
		{ x: 1, y: 2, data : { a:1, b:2 } },
		{ x: 4, y: 7, data : { a:3, b:4 } },
		{ x: 3, y: 9, data : { a:6, b:5 } }
	];
	
	var Rs = new PointSet( data );
	
	Rs.limitXouter(2, 2);
	
	ok(Rs._length == 2, "The length has been limited");
	deepEqual(Rs._data[0], data[0], "The proper item remains inside");
	deepEqual(Rs._data[1], data[2], "The proper item remains inside");
	
	Rs.limitXouter(4, 5);
	
	ok(Rs._length == 2, "The length has been limited");
	deepEqual(Rs._data[0], data[2], "The proper item remains inside");
	deepEqual(Rs._data[1], data[1], "The proper item remains inside");
	
	Rs.limitXouter(0, 1);
	
	ok(Rs._length == 2, "The length has been limited");
	deepEqual(Rs._data[0], data[0], "The proper item remains inside");
	deepEqual(Rs._data[1], data[2], "The proper item remains inside");
	
	Rs = data = null;
});

test("Testing PointSet.limitYouter()", function() {
	
	var data = [
		{ x: 1, y: 2, data : { a:1, b:2 } },
		{ x: 4, y: 7, data : { a:3, b:4 } },
		{ x: 3, y: 9, data : { a:6, b:5 } }
	];
	
	var Rs = new PointSet( data );
	
	Rs.limitYouter(2, 2);
	
	ok(Rs._length == 2, "The length has been limited");
	deepEqual(Rs._data[0], data[0], "The proper item remains inside");
	deepEqual(Rs._data[1], data[1], "The proper item remains inside");
	
	Rs.limitYouter(4, 5);
	
	ok(Rs._length == 2, "The length has been limited");
	deepEqual(Rs._data[0], data[0], "The proper item remains inside");
	deepEqual(Rs._data[1], data[1], "The proper item remains inside");
	
	Rs.limitYouter(7, 8);
	
	ok(Rs._length == 3, "The length has been limited");
	deepEqual(Rs._data[0], data[0], "The proper item remains inside");
	deepEqual(Rs._data[1], data[1], "The proper item remains inside");
	deepEqual(Rs._data[2], data[2], "The proper item remains inside");
	
	Rs = data = null;
});

test("Testing PointSet.limitY()", function() {
	
	var data = [
		{ x: 1, y: 2, data : { a:1, b:2 } },
		{ x: 4, y: 7, data : { a:3, b:4 } },
		{ x: 3, y: 9, data : { a:6, b:5 } }
	];
	
	var Rs = new PointSet( data );
	
	Rs.limitY(2, 3);
	
	ok(Rs._length === 1, "The length has been limited");
	deepEqual(Rs._data[0], data[0], "The proper item remains inside");
	
	Rs = data = null;
});

test("Testing PointSet.limit()", function() {
	
	var data = [
		{ x: 1, y: 2, data : { a:1, b:2 } },
		{ x: 4, y: 7, data : { a:3, b:4 } },
		{ x: 3, y: 9, data : { a:6, b:5 } }
	];
	
	var Rs = new PointSet( data );
	
	Rs.limit(2, 4, 5, 8);
	
	ok(Rs._length === 1, "The length has been limited");
	deepEqual(Rs._data[0], data[1], "The proper item remains inside");
	
	Rs = data = null;
});

test("Testing PointSet.reset()", function() {
	
	var data = [
		{ x: 1, y: 2, data : { a:1, b:2 } },
		{ x: 4, y: 7, data : { a:3, b:4 } },
		{ x: 3, y: 9, data : { a:6, b:5 } }
	];
	
	var Rs = new PointSet( data );
	Rs.limit(2, 4, 5, 8);
	Rs.reset();
	ok(Rs._length === 3, "The length has been reset");
	deepEqual(Rs._data, data, "The data has been reset");
	
	Rs = data = null;
});

test("Testing PointSet.forEach()", function() {
	var data = [
		{ x: 1, y: 2, data : { a:1, b:2 } },
		{ x: 4, y: 7, data : { a:3, b:4 } },
		{ x: 3, y: 9, data : { a:6, b:5 } }
	];
	
	var Rs = new PointSet( data ), i = 0;
	
	Rs.forEach(function( entry, index, dataset ) {
		ok(index === i++, "index does increment");
		deepEqual( entry, data[ index ], "Passes the correct item" );
		deepEqual( dataset, data, "Passes the entire data" );
		strictEqual( this, Rs, "Scoped to the PointSet instance" );
	});
	
	Rs = data = null;
});