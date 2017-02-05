/*global $ */
$( function () {

    var module = QUnit.module,
        test = QUnit.test;

    module( 'Testing base functionality', function () {

        test( 'Resolved promises: Constructor and add() accept both promises and deferreds, collection resolves correctly, arguments are passed on', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b.promise() );

            promises.done( f.doneArgs.capture );
            promises
                .add( f.dfd.c, f.dfd.d.promise() )
                .add( f.dfd.e );

            (new DfdPool)
                .resolve( f.dfd.a, f.dfd.b, f.dfd.c, f.dfd.d, f.dfd.e ).withArgs( 'A', 'B', 'C', 'D', 'E' )
                .then( function () {

                    assert.deepEqual( f.doneArgs.toArray(), ['A', 'B', 'C', 'D', 'E'] );

                    f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a, f.dfd.b, f.dfd.c, f.dfd.d, f.dfd.e )
                        .sameDoneArgs( f.doneArgs.toArray() );

                } );

        } );

        test( 'Using when(), promises can be added after when() is set up', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b.promise() );

            $.when( promises ).done( f.doneArgs.capture );

            promises.add( f.dfd.c, f.dfd.d.promise() );

            after(

                (new DfdPool).resolve( f.dfd.a, f.dfd.b, f.dfd.c, f.dfd.d ).withArgs( 'A', 'B', 'C', 'D' ).andApply(),

                f.doneArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['A', 'B', 'C', 'D'] );

                f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a, f.dfd.b, f.dfd.c, f.dfd.d )
                    .sameDoneArgs( f.doneArgs.toArray() );

            } );

        } );

        test( 'Rejected promise: collection fails, passing on the arguments of the first rejected promise', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b, f.dfd.c, f.dfd.d, f.dfd.e );

            promises.done( f.doneArgs.capture ).fail( f.failArgs.capture );

            after(

                f.dfd.a.resolve( 'A resolved' ),
                f.dfd.b.reject( 'B rejected' ),
                f.dfd.c.reject( 'C rejected' ),           // argument will not be passed on, first failure (b) only
                f.dfd.d.resolve( 'D resolved' ),
                // NB: Deferred e remains unresolved - that should not prevent the
                // collection from failing.

                f.doneArgs.captured(),
                f.failArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), [] );
                assert.deepEqual( f.failArgs.toArray(), ['B rejected'] );

                // Comparison to $.when() behaviour fails in jQuery 3. This is a jQuery bug, see
                // https://github.com/jquery/jquery/issues/3177
                // Test is disabled until the jQuery issue is fixed.

                // f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a, f.dfd.b, f.dfd.c, f.dfd.d, f.dfd.e )
                //     .sameDoneArgs( f.doneArgs.toArray() )
                //     .sameFailArgs( f.failArgs.toArray() );

                f.testDone();

            } );

        } );

    } );


    /*
     ------------------------------------------------------
     */

    module( 'Testing resolve() argument handling', function () {

        test( 'one deferred resolves without arguments, positioned in between deferreds with resolve() args: passed on as undefined', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

            promises = new $.Promises( f.dfd.a, f.dfd.b, f.dfd.c );

            promises.done( f.doneArgs.capture );

            after(

                (new DfdPool).resolve( f.dfd.a, f.dfd.c ).withArgs( 'A', 'C' ).andApply(),
                f.dfd.b.resolve(),

                f.doneArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['A', undefined, 'C'] );

                f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a, f.dfd.b, f.dfd.c )
                    .sameDoneArgs( f.doneArgs.toArray() );

            } );

        } );

        test( 'multiple deferreds resolve without arguments: each passed on as undefined', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

            promises = new $.Promises( f.dfd.a, f.dfd.b, f.dfd.c );

            promises.done( f.doneArgs.capture );

            (new DfdPool).resolve( f.dfd.a, f.dfd.b, f.dfd.c )
                .then( function () {

                    assert.deepEqual( f.doneArgs.toArray(), [undefined, undefined, undefined] );

                    f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a, f.dfd.b, f.dfd.c )
                        .sameDoneArgs( f.doneArgs.toArray() );

                } );

        } );

        test( 'Adding only one deferred which resolves without arguments: nothing passed on', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a );

            promises.done( f.doneArgs.capture );

            after(

                f.dfd.a.resolve(),

                f.doneArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), [] );

                f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a )
                    .sameDoneArgs( f.doneArgs.toArray() );

            } );

        } );

        test( 'Using more than one argument per resolve(): arguments grouped in arrays', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b, f.dfd.c );

            promises.done( f.doneArgs.capture );

            after(

                f.dfd.a.resolve( 'A1', 'A2' ),
                f.dfd.b.resolve( 'B' ),
                f.dfd.c.resolve( 'C1', 'C2' ),

                f.doneArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), [['A1', 'A2'], 'B', ['C1', 'C2']] );

                f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a, f.dfd.b, f.dfd.c )
                    .sameDoneArgs( f.doneArgs.toArray() );

            } );

        } );

        test( "Adding the same deferred multiple times doesn't change outcome", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.a );

            promises.done( f.doneArgs.capture );

            after(

                f.dfd.a.resolve( 'A' ),

                f.doneArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['A'] );

                f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a )
                    .sameDoneArgs( f.doneArgs.toArray() );

            } );

        } );

        test( 'Using a Promises object in multiple $.when functions: arguments available to every $.when', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 5, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b, f.dfd.c ),

                when1doneArgs = new ArgStore(),
                when2doneArgs = new ArgStore(),
                when3doneArgs = new ArgStore();

            promises.done( f.doneArgs.capture );

            $.when( promises ).done( when1doneArgs.capture );
            $.when( promises ).done( when2doneArgs.capture );

            after(

                (new DfdPool).resolve( f.dfd.a, f.dfd.b, f.dfd.c ).withArgs( 'A', 'B', 'C' ).andApply(),
                $.when( promises ).done( when3doneArgs.capture ),  // created after resolution

                f.doneArgs.captured(),
                when1doneArgs.captured(),
                when2doneArgs.captured(),
                when3doneArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['A', 'B', 'C'] );
                assert.deepEqual( when1doneArgs.toArray(), ['A', 'B', 'C'] );
                assert.deepEqual( when2doneArgs.toArray(), ['A', 'B', 'C'] );
                assert.deepEqual( when3doneArgs.toArray(), ['A', 'B', 'C'] );

                f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a, f.dfd.b, f.dfd.c )
                    .sameDoneArgs( f.doneArgs.toArray() );

            } );

        } );

    } );


    /*
     ------------------------------------------------------
     */

    module( 'Testing object creation', function () {

        test( "'new' is optional", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 1 } ),

                promises = $.Promises( f.dfd.a, f.dfd.b ).add( f.dfd.c ),
                newPromises = new $.Promises( f.dfd.a, f.dfd.b ).add( f.dfd.c );

            assert.deepEqual( promises, newPromises );

        } );

        test( "Instances are isolated when created using 'new'", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 4, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b ),
                morePromises = new $.Promises( f.dfd.c, f.dfd.d ),

                moreDoneArgs = new ArgStore(),
                moreFailArgs = new ArgStore();

            promises.done( f.doneArgs.capture ).fail( f.failArgs.capture );
            morePromises.done( moreDoneArgs.capture ).fail( moreFailArgs.capture );

            after(

                (new DfdPool).resolve( f.dfd.a, f.dfd.b, f.dfd.c ).withArgs( 'resolved', 'resolved', 'resolved' ).andApply(),
                f.dfd.d.reject( 'rejected' ),

                f.doneArgs.captured(),
                f.failArgs.captured(),
                moreDoneArgs.captured(),
                moreFailArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['resolved', 'resolved'] );
                assert.deepEqual( moreDoneArgs.toArray(), [] );

                assert.deepEqual( f.failArgs.toArray(), [] );
                assert.deepEqual( moreFailArgs.toArray(), ['rejected'] );

                f.testDone();

            } );

        } );

        test( "Instances are isolated when created without using 'new'", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 4, asyncDoneCalls: 1 } ),

                promises = $.Promises( f.dfd.a, f.dfd.b ),
                morePromises = $.Promises( f.dfd.c, f.dfd.d ),

                moreDoneArgs = new ArgStore(),
                moreFailArgs = new ArgStore();

            promises.done( f.doneArgs.capture ).fail( f.failArgs.capture );
            morePromises.done( moreDoneArgs.capture ).fail( moreFailArgs.capture );

            after(

                (new DfdPool).resolve( f.dfd.a, f.dfd.b, f.dfd.c ).withArgs( 'resolved', 'resolved', 'resolved' ).andApply(),
                f.dfd.d.reject( 'rejected' )

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['resolved', 'resolved'] );
                assert.deepEqual( moreDoneArgs.toArray(), [] );

                assert.deepEqual( f.failArgs.toArray(), [] );
                assert.deepEqual( moreFailArgs.toArray(), ['rejected'] );

                f.testDone();

            } );

        } );

        test( 'Initialisation without arguments: initial state is unresolved', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises();

            afterAllPendingResolutionsAreDone().run( function () {

                assert.ok( !promises.isResolved(), 'initial state is not resolved' );
                assert.ok( !promises.isRejected(), 'initial state is not rejected' );

                f.testDone();

            } );

        } );

    } );


    /*
     ------------------------------------------------------
     */

    module( 'Testing methods revealing state', function () {

        test( "isResolved(): false until all promises are resolved", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 3, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            afterAllPendingResolutionsAreDone().run( function () {

                assert.ok( !promises.isResolved() );

                after(

                    f.dfd.a.resolve()

                ).run( function () {


                    assert.ok( !promises.isResolved() );

                    after(

                        f.dfd.b.resolve()

                    ).run( function () {

                        assert.ok( promises.isResolved() );

                        f.testDone();

                    } );

                } );

            } );

        } );

        test( "isRejected(): false until the first rejection of a promise", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            afterAllPendingResolutionsAreDone().run( function () {

                assert.ok( !promises.isRejected() );

                after(

                    f.dfd.a.reject()

                ).run( function () {

                    assert.ok( promises.isRejected() );

                    f.testDone();

                } );

            } );

        } );

        test( "isUnresolved(): true until all promises are resolved", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 3, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            afterAllPendingResolutionsAreDone().run( function () {

                assert.ok( promises.isUnresolved() );

                after(

                    f.dfd.a.resolve()

                ).run( function () {

                    assert.ok( promises.isUnresolved() );

                    after(

                        f.dfd.b.resolve()

                    ).run( function () {

                        assert.ok( !promises.isUnresolved() );
                        
                        f.testDone();

                    } );

                } );

           } );

        } );

        test( "isUnresolved(): true until the first rejection of a promise", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            afterAllPendingResolutionsAreDone().run( function () {

                assert.ok( promises.isUnresolved() );

                after(

                    f.dfd.a.reject()

                ).run( function () {

                    assert.ok( !promises.isUnresolved() );

                    f.testDone();
                    
                } );

            } );

        } );

    } );


    /*
     ------------------------------------------------------
     */

    module( 'Testing belated promises', function () {

        test( "Trying to add promises after the collection is resolved throws an exception", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            (new DfdPool).resolve( f.dfd.a, f.dfd.b ).withArgs( 'A', 'B' ).andApply();

            assert.throws( function () {

                promises.add( f.dfd.c );

            } );

        } );

        test( "Trying to add promises after the collection has failed throws an exception", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            f.dfd.a.reject();

            assert.throws( function () {

                promises.add( f.dfd.c );

            } );

        } );

        test( "With ignoreBelated(), promises are ignored when added after the collection is resolved", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            promises
                .ignoreBelated()
                .done( f.doneArgs.capture );

            (new DfdPool).resolve( f.dfd.a, f.dfd.b ).withArgs( 'A', 'B' ).andApply();
            promises.add( f.dfd.c );

            after(

                f.doneArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['A', 'B'], 'aggregate promise resolves as usual, ignoring later additions' );
                assert.ok( promises.isResolved(), 'additions after resolution do not have any effect on the collective promise' );

                f.testDone();

            } );

         } );

        test( "With ignoreBelated(), promises are ignored when added after the collection has failed", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            promises
                .ignoreBelated()
                .done( f.doneArgs.capture )
                .fail( f.failArgs.capture );

            f.dfd.a.reject( 'A' );
            promises.add( f.dfd.c );

            after(

                f.failArgs.captured()

            ).run( function () {

                assert.deepEqual( f.failArgs.toArray(), ['A'], 'aggregate promise fails as usual, ignoring later additions' );
                assert.ok( promises.isRejected(), 'additions after resolution do not have any effect on the collective promise' );

                f.testDone();

            } );

        } );

        test( "ignoreBelated() does not affect the aggregation of promises which are added in time", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            promises
                .ignoreBelated()
                .done( f.doneArgs.capture );

            promises.add( f.dfd.c );

            after(

                (new DfdPool).resolve( f.dfd.a, f.dfd.b, f.dfd.c ).withArgs( 'A', 'B', 'C' ).andApply(),

                f.doneArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['A', 'B', 'C'], 'aggregate promise resolves as usual' );
                assert.ok( promises.isResolved(), 'aggregate promise resolves as usual' );

                f.testDone();

            } );

        } );

    } );


    /*
     ------------------------------------------------------
     */

    module( 'Testing postponing', function () {

        test( 'postpone() delays resolution, allows to add more promises even if all others are already resolved', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 3, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            promises
                .done( f.doneArgs.capture )
                .postpone();

            (new DfdPool).resolve( f.dfd.a, f.dfd.b ).withArgs( 'A', 'B' )
                .then( function () {

                    assert.ok( !promises.isResolved(), 'postpone() blocks resolution of aggregate promise' );
                    promises.add( f.dfd.c );
                    f.dfd.c.resolve( 'C' );

                    afterAllPendingResolutionsAreDone().run( function () {

                        assert.ok( !promises.isResolved(), 'postpone() still blocks resolution of aggregate promise after adding a new one' );

                        promises.stopPostponing();

                        after(

                            f.doneArgs.captured()

                        ).run( function () {

                            assert.deepEqual( f.doneArgs.toArray(), ['A', 'B', 'C'] );

                            f.testDone();

                        } );

                    } );

                } );

        } );

        test( 'postpone() allows to add more promises even if all others are already resolved, and the added ones are resolved as well', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 3, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            promises
                .done( f.doneArgs.capture )
                .postpone();

            (new DfdPool).resolve( f.dfd.a, f.dfd.b ).withArgs( 'A', 'B' )
                .then( function () {

                    assert.ok( !promises.isResolved(), 'postpone() blocks resolution of aggregate promise' );

                    f.dfd.c.resolve( 'C' );
                    promises.add( f.dfd.c );

                    afterAllPendingResolutionsAreDone().run( function () {

                        assert.ok( !promises.isResolved(), 'postpone() still blocks resolution of aggregate promise after adding a resolved new one' );

                        promises.stopPostponing();

                        after(

                            f.doneArgs.captured()

                        ).run( function () {

                            assert.deepEqual( f.doneArgs.toArray(), ['A', 'B', 'C'] );

                            f.testDone();

                        } );

                    } );

                } );

         } );

        test( 'postpone() works as intended when it is called before any promises are added', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises();

            promises
                .done( f.doneArgs.capture )
                .postpone()
                .add( f.dfd.a );

            after(

                f.dfd.a.resolve( 'A' )

            ).run( function () {


                assert.ok( !promises.isResolved(), 'postpone() blocks resolution of aggregate promise' );

                promises.stopPostponing();

                after(

                    f.doneArgs.captured()

                ).run( function () {

                    assert.deepEqual( f.doneArgs.toArray(), ['A'] );

                    f.testDone();

                } );

            } );

        } );

        test( 'Multiple invocations of postpone() are removed correctly with a single stopPostponing()', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 3, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            promises
                .done( f.doneArgs.capture )
                .postpone()
                .postpone();

            (new DfdPool).resolve( f.dfd.a, f.dfd.b ).withArgs( 'A', 'B' ).then( function () {

                assert.ok( !promises.isResolved(), 'multiple postpone() invocations block resolution of aggregate promise just as a single invocation' );

                promises
                    .postpone()
                    .add( f.dfd.c );

                after(

                    f.dfd.c.resolve( 'C' )

                ).run( function () {

                    assert.ok( !promises.isResolved(), 'added postpone() invocations still block resolution of aggregate promise' );

                    promises.stopPostponing();

                    after(

                        f.doneArgs.captured()

                    ).run( function () {

                        assert.deepEqual( f.doneArgs.toArray(), ['A', 'B', 'C'] );

                        f.testDone();

                    } );

               } );

            } );

        } );

        test( "Invoking stopPostponing() without having called postpone() doesn't do anything", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 4, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            promises
                .done( f.doneArgs.capture )
                .stopPostponing();

            afterAllPendingResolutionsAreDone().run( function () {

                assert.ok( promises.isUnresolved(), 'stopPostponing() has no effect before any promise is resolved' );

                after(

                    (new DfdPool).resolve( f.dfd.a, f.dfd.b ).withArgs( 'A', 'B' ).andApply(),

                    f.doneArgs.captured()

                ).run( function () {

                    assert.deepEqual( f.doneArgs.toArray(), ['A', 'B'], 'aggregate promise resolves as usual' );
                    assert.ok( promises.isResolved(), 'aggregate promise resolves as usual' );

                    promises.stopPostponing();

                    afterAllPendingResolutionsAreDone().run( function () {

                        assert.ok( promises.isResolved(), 'additional invocations of stopPostponing after resolution do not have any effect' );

                        f.testDone();

                    } );

                } );

            } );

        } );

        test( "Invoking postpone() throws an exception if the collective promises are already resolved", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            promises.done( f.doneArgs.capture );

            (new DfdPool).resolve( f.dfd.a, f.dfd.b ).withArgs( 'A', 'B' ).andApply();

            assert.throws( function () {

                promises.postpone();

            } );

        } );

        test( "With ignoreBelated(), invoking postpone() is ignored if the collective promises are already resolved", function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 2, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );

            promises
                .ignoreBelated()
                .done( f.doneArgs.capture );

            (new DfdPool).resolve( f.dfd.a, f.dfd.b ).withArgs( 'A', 'B' ).andApply();

            promises.postpone();

            after(

                f.doneArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['A', 'B'], 'aggregate promise resolves as usual' );
                assert.ok( promises.isResolved(), 'invocations of postpone() after resolution do not have any effect on the collective promise' );

                f.testDone();

            } );

        } );

        test( 'Using a Promises object in multiple $.when functions, interspersed with postpone() and later additions: arguments available to every $.when', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 8, asyncDoneCalls: 1 } ),

                promises = new $.Promises( f.dfd.a );

            promises.done( f.doneArgs.capture );

            var when1doneArgs = new ArgStore(),
                when2doneArgs = new ArgStore(),
                when3doneArgs = new ArgStore(),
                when4doneArgs = new ArgStore(),
                when5doneArgs = new ArgStore(),
                when6doneArgs = new ArgStore();

            $.when( promises ).done( when1doneArgs.capture ); // created with first deferred, before postpone()

            promises.postpone();
            $.when( promises ).done( when2doneArgs.capture ); // created after postpone()

            promises.add( f.dfd.b );
            $.when( promises ).done( when3doneArgs.capture ); // created after adding another deferred

            promises.add( f.dfd.c );
            $.when( promises ).done( when4doneArgs.capture ); // created after adding yet another deferred

            (new DfdPool).resolve( f.dfd.a, f.dfd.b, f.dfd.c ).withArgs( 'A', 'B', 'C' ).andApply();
            $.when( promises ).done( when5doneArgs.capture ); // created after resolution of all passed-in deferreds

            promises.stopPostponing();
            $.when( promises ).done( when6doneArgs.capture ); // created after stopPostponing(), ie after resolution of aggregate Promises

            after(

                f.doneArgs.captured(),
                when1doneArgs.captured(),
                when2doneArgs.captured(),
                when3doneArgs.captured(),
                when4doneArgs.captured(),
                when5doneArgs.captured(),
                when6doneArgs.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['A', 'B', 'C'] );
                assert.deepEqual( when1doneArgs.toArray(), ['A', 'B', 'C'] );
                assert.deepEqual( when2doneArgs.toArray(), ['A', 'B', 'C'] );
                assert.deepEqual( when3doneArgs.toArray(), ['A', 'B', 'C'] );
                assert.deepEqual( when4doneArgs.toArray(), ['A', 'B', 'C'] );
                assert.deepEqual( when5doneArgs.toArray(), ['A', 'B', 'C'] );
                assert.deepEqual( when6doneArgs.toArray(), ['A', 'B', 'C'] );

                f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a, f.dfd.b, f.dfd.c ).sameDoneArgs( f.doneArgs.toArray() );

            } );

        } );

    } );


    /*
     ------------------------------------------------------
     */
    
    module( 'Testing the context passed to the callbacks', function () {
    
        // We do not test what context is passed to the callbacks if that context is
        // not specified explicitly with .resolveWith().
        //
        // In that case, what happens to the context is not specified anywhere, and
        // it must not be relied upon. Because of that, the context provided by
        // $.Promises is allowed to be entirely arbitrary, with zero need for tests.
    
        test( 'Adding only one deferred, resolved with resolveWith(): arguments and context are passed on', function ( assert ) {

            var f = new Fixture( assert, { expectedTests: 4, asyncDoneCalls: 2 } ),

                promises = new $.Promises( f.dfd.a );

            promises.done( f.doneArgs.capture, f.scope.capture );

            after(

                f.dfd.a.resolveWith( f.contextA, ['A'] ),

                f.doneArgs.captured(),
                f.scope.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['A'] );
                assert.deepEqual( f.scope.get(), f.contextA );

                f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a )
                    .sameDoneArgs( f.doneArgs.toArray() )
                    .sameDoneScope( f.scope.get() );

            } );

        } );
    
        test( 'Multiple deferreds resolved with resolveWith(): arguments are passed on, context is ignored, default context is the same as without $.Promise', function ( assert ) {
    
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
    
            assert.expect( 5 );

            var f = new Fixture( assert, { expectedTests: 5, asyncDoneCalls: 2 } ),

                promises = new $.Promises( f.dfd.a, f.dfd.b );
    
            promises.done( f.doneArgs.capture, f.scope.capture );

            after(

                f.dfd.a.resolveWith( f.contextA, ['A'] ),
                f.dfd.b.resolveWith( f.contextB, ['B'] ),
                
                f.doneArgs.captured(),
                f.scope.captured()

            ).run( function () {

                assert.deepEqual( f.doneArgs.toArray(), ['A', 'B'] );
                assert.notDeepEqual( f.scope.get(), f.contextA, 'resolveWith() context is ignored' );
                assert.notDeepEqual( f.scope.get(), f.contextB, 'resolveWith() context is ignored' );

                f.compareOutcomeToJQueryWhen.usingDeferreds( f.dfd.a, f.dfd.b )
                    .sameDoneArgs( f.doneArgs.toArray() )
                    .equalDoneScopeObject( f.scope.get() );

            } );

        } );
    
    } );
    
} );
