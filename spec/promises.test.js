$( function() {

    var promises,
        doneArgs,
        failArgs,
        scope,
        contextA,
        contextB,
        a, b, c, d, e, f;

    var ArgStore = function () {

        var args = [];

        this.capture = function () {
            args = Array.prototype.slice.call( arguments );
        };

        this.toArray = function () {
            return args;
        };

    };

    var ScopeStore = function () {

        var scope = null;

        this.capture = function () {
            scope = this;
        };

        this.get = function () {
            return scope;
        };

    };

    var testing = {

        getPropertiesArray: function ( obj ) {

            var arr = [],
                name;

            for ( name in  obj ) arr.push( name );
            return arr.sort();

        },

        equalsDeferred: function ( obj ) {

            deepEqual( testing.getPropertiesArray( obj ), testing.getPropertiesArray( $.Deferred() ) );
            return this;

        },

        compareToWhen: (function () {

            var $when,
                expectedDoneArgs,
                expectedFailArgs,
                expectedDoneScope,
                expectedFailScope;


            /**
             * @public
             */
            var reset = function () {

                $when = null;
                expectedDoneArgs  = new ArgStore();
                expectedFailArgs  = new ArgStore();
                expectedDoneScope = new ScopeStore();
                expectedFailScope = new ScopeStore();

            };

            /**
             * @public
             */
            var usingDeferreds = function ( dfd1, dfd2, dfdN ) {

                reset();

                $when = $.when.apply( this, arguments )
                    .done( expectedDoneArgs.capture, expectedDoneScope.capture )
                    .fail( expectedFailArgs.capture, expectedFailScope.capture );

                return this;
            };

            /**
             * @public
             */
            var sameDoneArgs = function ( argumentsArray, message ) {

                deepEqual( argumentsArray, expectedDoneArgs.toArray(), message );
                return this;

            };

            /**
             * @public
             */
            var sameFailArgs = function ( argumentsArray, message ) {

                deepEqual( argumentsArray, expectedFailArgs.toArray(), message );
                return this;

            };

            /**
             * @public
             */
            var sameDoneScope = function ( scope, message ) {

                deepEqual( scope, expectedDoneScope.get(), message );
                return this;

            };

            /**
             * @public
             */
            var sameFailScope = function ( scope, message ) {

                deepEqual( scope, expectedFailScope.get(), message );
                return this;

            };

            /**
             * @public
             * @memberOf testing.compareToWhen
             */
            var equalDoneScopeObject = function ( scope, message ) {

                deepEqual( testing.getPropertiesArray( scope ), testing.getPropertiesArray( expectedDoneScope.get() ), message );
                return this;

            };


            var init = function () {
                reset();
            };

            init();


            return {
                usingDeferreds: usingDeferreds,
                sameDoneArgs: sameDoneArgs,
                sameFailArgs: sameFailArgs,
                sameDoneScope: sameDoneScope,
                sameFailScope: sameFailScope,
                equalDoneScopeObject: equalDoneScopeObject,
                reset: reset
            };

        })()

    };

    var pool = {

        deferreds: (function () {

            var deferreds = [],
                args = [],
                contexts = [],
                command,
                i;

            var resolve = function ( dfd1, dfd2, dfdN ) {

                deferreds = Array.prototype.slice.call( arguments );
                args = [];
                contexts = [];

                command = 'resolve';

                return this;

            };

            var withArgs = function ( arg1, arg2, argN ) {

                args = Array.prototype.slice.call( arguments );

                for ( i = 0; i < args.length; i++ ) {
                    if ( ! $.isArray( args[i] ) ) args[i] = [ args[i] ];
                }

                return this;

            };

            var andApply = function () {

                for ( i = 0; i < deferreds.length; i++ ) {

                    if ( args[i] === undefined ) {
                        deferreds[i][command]();
                    } else {
                        deferreds[i][command].apply( deferreds[i], args[i] );
                    }

                }

                return this;

            };

            return {
                resolve: resolve,
                withArgs: withArgs,
                andApply: andApply
            };

        })()

    };

    var setUp = function () {

        testing.compareToWhen.reset();

        promises = new $.Promises();

        a = $.Deferred();
        b = $.Deferred();
        c = $.Deferred();
        d = $.Deferred();
        e = $.Deferred();
        f = $.Deferred();

        doneArgs = new ArgStore();
        failArgs = new ArgStore();
        scope    = new ScopeStore();

        contextA = { name: 'contextA' };
        contextB = { name: 'contextB' };

    };


    module( 'Testing base functionality', { setup: setUp } );

    test( 'Resolved promises: Constructor and add() accept both promises and deferreds, collection resolves correctly, arguments are passed on', function () {

        promises = new $.Promises( a, b.promise() );

        promises.done( doneArgs.capture );
        promises.add( c, d.promise() )
            .add( e );

        pool.deferreds.resolve( a, b, c, d, e ).withArgs( 'A', 'B', 'C', 'D', 'E' ).andApply();
        deepEqual( doneArgs.toArray(), [ 'A', 'B', 'C', 'D', 'E' ] );

        testing.compareToWhen.usingDeferreds( a, b, c, d, e ).sameDoneArgs( doneArgs.toArray() );

    } );

    test( 'Using when(), promises can be added after when() is set up', function () {

        promises = new $.Promises( a, b.promise() );

        $.when( promises ).done( doneArgs.capture );
        promises.add( c, d.promise() );

        pool.deferreds.resolve( a, b, c, d ).withArgs( 'A', 'B', 'C', 'D' ).andApply();
        deepEqual( doneArgs.toArray(), [ 'A', 'B', 'C', 'D' ] );

        testing.compareToWhen.usingDeferreds( a, b, c, d ).sameDoneArgs( doneArgs.toArray() );

    } );

    test( 'Rejected promise: collection fails, passing on the arguments of the first rejected promise' , function () {

        promises = new $.Promises( a, b, c, d, e );

        promises.done( doneArgs.capture ).fail( failArgs.capture );
        a.resolve( 'A resolved' );
        b.reject( 'B rejected' );
        c.reject( 'C rejected' );           // argument will not be passed on, first failure (b) only
        d.resolve( 'D resolved' );
        // NB: Deferred e remains unresolved - that should not prevent the
        // collection from failing.

        deepEqual( doneArgs.toArray(), [] );
        deepEqual( failArgs.toArray(), [ 'B rejected' ] );

        testing.compareToWhen.usingDeferreds( a, b, c, d, e ).sameDoneArgs( doneArgs.toArray() ).sameFailArgs( failArgs.toArray() );

    } );


    /*
     ------------------------------------------------------
     */

    module( 'Testing resolve() argument handling', { setup: setUp } );

    test( 'one deferred resolves without arguments, positioned in between deferreds with resolve() args: passed on as undefined', function () {

        promises = new $.Promises( a, b, c );

        promises.done( doneArgs.capture );
        pool.deferreds.resolve( a, c ).withArgs( 'A', 'C' ).andApply();
        b.resolve();

        deepEqual( doneArgs.toArray(), [ 'A', undefined, 'C' ] );

        testing.compareToWhen.usingDeferreds( a, b, c ).sameDoneArgs( doneArgs.toArray() );

    } );

    test( 'multiple deferreds resolve without arguments: each passed on as undefined', function () {

        promises = new $.Promises( a, b, c );

        promises.done( doneArgs.capture );
        pool.deferreds.resolve( a, b, c ).andApply();

        deepEqual( doneArgs.toArray(), [ undefined, undefined, undefined ] );

        testing.compareToWhen.usingDeferreds( a, b, c ).sameDoneArgs( doneArgs.toArray() );

    } );

    test( 'Adding only one deferred which resolves without arguments: nothing passed on', function () {

        promises = new $.Promises( a );

        promises.done( doneArgs.capture );
        a.resolve();

        deepEqual( doneArgs.toArray(), [] );

        testing.compareToWhen.usingDeferreds( a ).sameDoneArgs( doneArgs.toArray() );

    } );

    test( 'Using more than one argument per resolve(): arguments grouped in arrays' , function () {

        promises = new $.Promises( a, b, c );

        promises.done( doneArgs.capture );
        a.resolve( 'A1', 'A2' );
        b.resolve( 'B' );
        c.resolve( 'C1', 'C2' );

        deepEqual( doneArgs.toArray(), [ [ 'A1', 'A2' ], 'B', [ 'C1', 'C2' ] ] );

        testing.compareToWhen.usingDeferreds( a, b, c ).sameDoneArgs( doneArgs.toArray() );

    } );

    test( "Adding the same deferred multiple times doesn't change outcome", function () {

        promises = new $.Promises( a, a );

        promises.done( doneArgs.capture );
        a.resolve( 'A' );

        deepEqual( doneArgs.toArray(), [ 'A' ] );

        testing.compareToWhen.usingDeferreds( a ).sameDoneArgs( doneArgs.toArray() );

    } );

    test( 'Using a Promises object in multiple $.when functions: arguments available to every $.when', function () {

        promises = new $.Promises( a, b, c );

        promises.done( doneArgs.capture );

        var when1doneArgs = new ArgStore();
        var when2doneArgs = new ArgStore();
        var when3doneArgs = new ArgStore();
        $.when( promises ).done( when1doneArgs.capture );
        $.when( promises ).done( when2doneArgs.capture );

        pool.deferreds.resolve( a, b, c ).withArgs( 'A', 'B', 'C' ).andApply();

        $.when( promises ).done( when3doneArgs.capture ); // created after resolution

        deepEqual( doneArgs.toArray(), [ 'A', 'B', 'C' ] );
        deepEqual( when1doneArgs.toArray(), [ 'A', 'B', 'C' ] );
        deepEqual( when2doneArgs.toArray(), [ 'A', 'B', 'C' ] );
        deepEqual( when3doneArgs.toArray(), [ 'A', 'B', 'C' ] );

        testing.compareToWhen.usingDeferreds( a, b, c ).sameDoneArgs( doneArgs.toArray() );

    } );


    /*
     ------------------------------------------------------
     */

    module( 'Testing object creation', { setup: setUp } );

    test( "'new' is optional", function () {

        promises        =     $.Promises( a, b ).add( c );
        var newPromises = new $.Promises( a, b ).add( c );

        deepEqual( promises, newPromises );

    } );

    test( "Instances are isolated when created using 'new'", function () {

        promises         = new $.Promises( a, b );
        var morePromises = new $.Promises( c, d );

        var moreDoneArgs = new ArgStore(),
            moreFailArgs = new ArgStore();

        promises.done( doneArgs.capture ).fail( failArgs.capture );
        morePromises.done( moreDoneArgs.capture ).fail( moreFailArgs.capture );

        pool.deferreds.resolve( a, b, c ).withArgs( 'resolved', 'resolved', 'resolved' ).andApply();
        d.reject( 'rejected' );

        deepEqual( doneArgs.toArray(), [ 'resolved', 'resolved' ] );
        deepEqual( moreDoneArgs.toArray(), [] );

        deepEqual( failArgs.toArray(), [] );
        deepEqual( moreFailArgs.toArray(), [ 'rejected' ] );

    } );

    test( "Instances are isolated when created without using 'new'", function () {

        promises         = $.Promises( a, b );
        var morePromises = $.Promises( c, d );

        var moreDoneArgs = new ArgStore(),
            moreFailArgs = new ArgStore();

        promises.done( doneArgs.capture ).fail( failArgs.capture );
        morePromises.done( moreDoneArgs.capture ).fail( moreFailArgs.capture );

        pool.deferreds.resolve( a, b, c ).withArgs( 'resolved', 'resolved', 'resolved' ).andApply();
        d.reject( 'rejected' );

        deepEqual( doneArgs.toArray(), [ 'resolved', 'resolved' ] );
        deepEqual( moreDoneArgs.toArray(), [] );

        deepEqual( failArgs.toArray(), [] );
        deepEqual( moreFailArgs.toArray(), [ 'rejected' ] );

    } );

    test( 'Initialisation without arguments: initial state is unresolved', function () {

        promises = new $.Promises();

        ok( ! promises.isResolved(), 'initial state is not resolved' );
        ok( ! promises.isRejected(), 'initial state is not rejected' );

    } );


    /*
     ------------------------------------------------------
     */

    module( 'Testing methods revealing state', { setup: setUp }  )

    test( "isResolved(): false until all promises are resolved", function () {

        promises = new $.Promises( a, b );
        ok ( ! promises.isResolved() );

        a.resolve();
        ok ( ! promises.isResolved() );

        b.resolve();
        ok ( promises.isResolved() );

    } );

    test( "isRejected(): false until the first rejection of a promise", function () {

        promises = new $.Promises( a, b );
        ok ( ! promises.isRejected() );

        a.reject();
        ok ( promises.isRejected() );

    } );

    test( "isUnresolved(): true until all promises are resolved", function () {

        promises = new $.Promises( a, b );
        ok ( promises.isUnresolved() );

        a.resolve();
        ok ( promises.isUnresolved() );

        b.resolve();
        ok ( ! promises.isUnresolved() );

    } );

    test( "isUnresolved(): true until the first rejection of a promise", function () {

        promises = new $.Promises( a, b );
        ok ( promises.isUnresolved() );

        a.reject();
        ok ( ! promises.isUnresolved() );

    } );


    /*
     ------------------------------------------------------
     */

    module( 'Testing belated promises', { setup: setUp }  )

    test( "Trying to add promises after the collection is resolved throws an exception", function () {

        throws( function () {

            promises = new $.Promises( a, b );
            pool.deferreds.resolve( a, b ).withArgs( 'A', 'B' ).andApply();

            promises.add( c );

        } );

    } );

    test( "Trying to add promises after the collection has failed throws an exception", function () {

        throws( function () {

            promises = new $.Promises( a, b );
            a.reject();

            promises.add( c );

        } );

    } );

    test( "With ignoreBelated(), promises are ignored when added after the collection is resolved", function () {

        promises = new $.Promises( a, b );
        promises.ignoreBelated()
            .done( doneArgs.capture );
        pool.deferreds.resolve( a, b ).withArgs( 'A', 'B' ).andApply();

        promises.add( c );

        deepEqual( doneArgs.toArray(), [ 'A', 'B' ], 'aggregate promise resolves as usual, ignoring later additions' );
        ok( promises.isResolved(), 'additions after resolution do not have any effect on the collective promise' );

    } );

    test( "With ignoreBelated(), promises are ignored when added after the collection has failed", function () {

        promises = new $.Promises( a, b );
        promises.ignoreBelated()
            .done( doneArgs.capture )
            .fail( failArgs.capture );
        a.reject( 'A' );

        promises.add( c );

        deepEqual( failArgs.toArray(), [ 'A' ], 'aggregate promise fails as usual, ignoring later additions' );
        ok( promises.isRejected(), 'additions after resolution do not have any effect on the collective promise' );

    } );

    test( "ignoreBelated() does not affect the aggregation of promises which are added in time", function () {

        promises = new $.Promises( a, b );
        promises.ignoreBelated()
            .done( doneArgs.capture );

        promises.add( c );
        pool.deferreds.resolve( a, b, c ).withArgs( 'A', 'B', 'C' ).andApply();

        deepEqual( doneArgs.toArray(), [ 'A', 'B', 'C' ], 'aggregate promise resolves as usual' );
        ok( promises.isResolved(), 'aggregate promise resolves as usual' );

    } );


    /*
     ------------------------------------------------------
     */

    module( 'Testing postponing', { setup: setUp }  );

    test( 'postpone() delays resolution, allows to add more promises even if all others are already resolved', function () {

        promises = new $.Promises( a, b );
        promises.done( doneArgs.capture )
            .postpone();

        pool.deferreds.resolve( a, b ).withArgs( 'A', 'B' ).andApply();
        ok( ! promises.isResolved(), 'postpone() blocks resolution of aggregate promise' );

        promises.add( c );
        c.resolve( 'C' );
        ok( ! promises.isResolved(), 'postpone() still blocks resolution of aggregate promise after adding a new one' );

        promises.stopPostponing();
        deepEqual( doneArgs.toArray(), [ 'A', 'B', 'C' ] );

    } );

    test( 'postpone() allows to add more promises even if all others are already resolved, and the added ones are resolved as well', function () {

        promises = new $.Promises( a, b );
        promises.done( doneArgs.capture )
            .postpone();

        pool.deferreds.resolve( a, b ).withArgs( 'A', 'B' ).andApply();
        ok( ! promises.isResolved(), 'postpone() blocks resolution of aggregate promise' );

        c.resolve( 'C' );
        promises.add( c );
        ok( ! promises.isResolved(), 'postpone() still blocks resolution of aggregate promise after adding a resolved new one' );

        promises.stopPostponing();
        deepEqual( doneArgs.toArray(), [ 'A', 'B', 'C' ] );

    } );

    test( 'postpone() works as intended when it is called before any promises are added', function () {

        promises = new $.Promises();
        promises.done( doneArgs.capture )
            .postpone()
            .add( a );

        a.resolve( 'A' );
        ok( ! promises.isResolved(), 'postpone() blocks resolution of aggregate promise' );

        promises.stopPostponing();
        deepEqual( doneArgs.toArray(), [ 'A' ] );

    } );

    test( 'Multiple invokations of postpone() are removed correctly with a single stopPostponing()', function () {

        promises = new $.Promises( a, b );
        promises.done( doneArgs.capture )
            .postpone()
            .postpone();

        pool.deferreds.resolve( a, b ).withArgs( 'A', 'B' ).andApply();
        ok( ! promises.isResolved(), 'multiple postpone() invokations block resolution of aggregate promise just as a single invokation' );

        promises.postpone()
            .add( c );
        c.resolve( 'C' );
        ok( ! promises.isResolved(), 'added postpone() invokations still block resolution of aggregate promise' );

        promises.stopPostponing();
        deepEqual( doneArgs.toArray(), [ 'A', 'B', 'C' ] );

    } );

    test( "Invoking stopPostponing() without having called postpone() doesn't do anything", function () {

        promises = new $.Promises( a, b );
        promises.done( doneArgs.capture )
            .stopPostponing();

        ok( promises.isUnresolved(), 'stopPostponing() has no effect before any promise is resolved' );

        pool.deferreds.resolve( a, b ).withArgs( 'A', 'B' ).andApply();
        deepEqual( doneArgs.toArray(), [ 'A', 'B' ], 'aggregate promise resolves as usual' );
        ok( promises.isResolved(), 'aggregate promise resolves as usual' );

        promises.stopPostponing();
        ok( promises.isResolved(), 'additional invokations of stopPostponing after resolution do not have any effect' );

    } );

    test( "Invoking postpone() throws an exception if the collective promises are already resolved", function () {

        throws( function () {

            promises = new $.Promises( a, b );
            promises.done( doneArgs.capture );
            pool.deferreds.resolve( a, b ).withArgs( 'A', 'B' ).andApply();

            promises.postpone();

        } );

    } );

    test( "With ignoreBelated(), invoking postpone() is ignored if the collective promises are already resolved", function () {

        promises = new $.Promises( a, b );
        promises.ignoreBelated()
            .done( doneArgs.capture );
        pool.deferreds.resolve( a, b ).withArgs( 'A', 'B' ).andApply();

        promises.postpone();

        deepEqual( doneArgs.toArray(), [ 'A', 'B' ], 'aggregate promise resolves as usual' );
        ok( promises.isResolved(), 'invokations of postpone() after resolution do not have any effect on the collective promise' );

    } );

    test( 'Using a Promises object in multiple $.when functions, interspersed with postpone() and later additions: arguments available to every $.when', function () {

        promises = new $.Promises( a );
        promises.done( doneArgs.capture )

        var when1doneArgs = new ArgStore(),
            when2doneArgs = new ArgStore(),
            when3doneArgs = new ArgStore(),
            when4doneArgs = new ArgStore(),
            when5doneArgs = new ArgStore(),
            when6doneArgs = new ArgStore();

        $.when( promises ).done( when1doneArgs.capture ); // created with first deferred, before postpone()

        promises.postpone();
        $.when( promises ).done( when2doneArgs.capture ); // created after postpone()

        promises.add( b );
        $.when( promises ).done( when3doneArgs.capture ); // created after adding another deferred

        promises.add( c );
        $.when( promises ).done( when4doneArgs.capture ); // created after adding yet another deferred

        pool.deferreds.resolve( a, b, c ).withArgs( 'A', 'B', 'C' ).andApply();
        $.when( promises ).done( when5doneArgs.capture ); // created after resolution of all passed-in deferreds

        promises.stopPostponing();
        $.when( promises ).done( when6doneArgs.capture ); // created after stopPostponing(), ie after resolution of aggregate Promises

        deepEqual( doneArgs.toArray(), [ 'A', 'B', 'C' ] );
        deepEqual( when1doneArgs.toArray(), [ 'A', 'B', 'C' ] );
        deepEqual( when2doneArgs.toArray(), [ 'A', 'B', 'C' ] );
        deepEqual( when3doneArgs.toArray(), [ 'A', 'B', 'C' ] );
        deepEqual( when4doneArgs.toArray(), [ 'A', 'B', 'C' ] );
        deepEqual( when5doneArgs.toArray(), [ 'A', 'B', 'C' ] );
        deepEqual( when6doneArgs.toArray(), [ 'A', 'B', 'C' ] );

        testing.compareToWhen.usingDeferreds( a, b, c ).sameDoneArgs( doneArgs.toArray() );

    } );


    /*
     ------------------------------------------------------
     */

    module( 'Testing the context passed to the callbacks', { setup: setUp } );

    // We do not test what context is passed to the callbacks if that context is
    // not specified explicitly with .resolveWith().
    //
    // In that case, what happens to the context is not specified anywhere, and
    // it must not be relied upon. Because of that, the context provided by
    // $.Promises is allowed to be entirely arbitrary, with zero need for tests.

    test( 'Adding only one deferred, resolved with resolveWith(): arguments and context are passed on', function () {

        promises = new $.Promises( a );

        promises.done( doneArgs.capture, scope.capture );
        a.resolveWith( contextA, [ 'A' ] );

        deepEqual( doneArgs.toArray(), [ 'A' ] );
        deepEqual( scope.get(), contextA );

        testing.compareToWhen.usingDeferreds( a )
            .sameDoneArgs( doneArgs.toArray() )
            .sameDoneScope( scope.get() );

    } );

    test( 'Multiple deferreds resolved with resolveWith(): arguments are passed on, context is ignored, default context is the same as without $.Promise', function () {

        // Note: It is not entirely clear what _should_ be passed as context in
        // this case. In jQuery < 1.8, $.when seems to fall back to its default
        // behaviour, passing the Deferred. But that changes in later versions.
        //
        // In fact it shouldn't matter what is passed because whatever it is, it
        // is in conflict with the (inconsistent) intentions expressed by
        // resolveWith().
        //
        // For now, we just test if there is logic to the madness: $.Promises
        // should pass the same context as a regular setup with deferreds -
        // whatever that context may be.
        //
        // Even that limited assertion could be viewed as arbitrary. If this
        // test becomes a problem in future versions of jQuery, it should simply
        // be removed.

        promises = new $.Promises( a, b );

        promises.done( doneArgs.capture, scope.capture );

        a.resolveWith( contextA, [ 'A' ] );
        b.resolveWith( contextB, [ 'B' ] );

        deepEqual( doneArgs.toArray(), [ 'A', 'B' ] );
        notDeepEqual( scope.get(), contextA, 'resolveWith() context is ignored' );
        notDeepEqual( scope.get(), contextB, 'resolveWith() context is ignored' );

        testing.compareToWhen.usingDeferreds( a, b )
            .sameDoneArgs( doneArgs.toArray() )
            .equalDoneScopeObject( scope.get() );

    } );

} );
