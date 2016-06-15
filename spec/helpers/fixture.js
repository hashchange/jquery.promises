var ArgStore = function () {

        this._args = [];
        this._dfdCaptured = $.Deferred();

        this.capture = (function ( _this ) {
            return function () {
                _this._args = Array.prototype.slice.call( arguments );
                _this._dfdCaptured.resolve();
            };
        })( this );

        this.toArray = function () {
            return this._args;
        };

        this.captured = function () {
            return this._dfdCaptured.promise();
        };

    },

    ScopeStore = function () {

        this._scope = null;
        this._dfdCaptured = $.Deferred();

        this.capture = (function ( _this ) {
            return function () {
                _this._scope = this;
                _this._dfdCaptured.resolve();
            };
        })( this );

        this.get = function () {
            return this._scope;
        };

        this.captured = function () {
            return this._dfdCaptured.promise();
        };

    },

    Fixture = (function () {

        var CompareOutcomeToJQueryWhen = function ( config ) {

                var assert = config.assert,
                    assertDoneCb = config.assertDoneCb,

                    getPropertiesArray = function ( obj ) {

                        var arr = [],
                            name;

                        for ( name in  obj ) arr.push( name );
                        return arr.sort();

                    };


                this._ensureWhen = function () {

                    // Make sure that $when is properly initialized. Ie, verify that it is a promise object.
                    if ( !( this._$when && this._$when.then ) ) throw new Error( "Can't use the $.when() promise in `compareOutcomeToJQueryWhen` yet. So far, $.when() has not been called because it has not been defined fully - call `usingDeferreds` first" );

                };

                this._resetCapture = function () {

                    this._$when = null;
                    this._expectedDoneArgs = new ArgStore();
                    this._expectedFailArgs = new ArgStore();
                    this._expectedDoneScope = new ScopeStore();
                    this._expectedFailScope = new ScopeStore();

                };

                this._assertAsync = function ( assertCb ) {

                    var execAssert = (function () {
                        return assertCb;
                    })();

                    this._ensureWhen();
                    this._$when.always( execAssert );
                    if ( assertDoneCb ) this._$when.always( assertDoneCb );

                };

                this._init = function () {
                    this._resetCapture();
                };

                this.usingDeferreds = function ( dfd1, dfd2, dfdN ) {

                    this._resetCapture();

                    this._$when = $.when.apply( $, arguments )
                        .done( this._expectedDoneArgs.capture, this._expectedDoneScope.capture )
                        .fail( this._expectedFailArgs.capture, this._expectedFailScope.capture );

                    return this;

                };

                this.sameDoneArgs = function ( argumentsArray, message ) {

                    var _this = this;

                    this._assertAsync( function () {
                        assert.deepEqual( argumentsArray, _this._expectedDoneArgs.toArray(), message );
                    } );

                    return this;

                };

                this.sameFailArgs = function ( argumentsArray, message ) {

                    var _this = this;

                    this._assertAsync( function () {
                        assert.deepEqual( argumentsArray, _this._expectedFailArgs.toArray(), message );
                    } );

                    return this;

                };

                this.sameDoneScope = function ( scope, message ) {

                    var _this = this;

                    this._assertAsync( function () {
                        assert.deepEqual( scope, _this._expectedDoneScope.get(), message );
                    } );

                    return this;

                };

                this.sameFailScope = function ( scope, message ) {

                    var _this = this;

                    this._assertAsync( function () {
                        assert.deepEqual( scope, _this._expectedFailScope.get(), message );
                    } );

                    return this;

                };
            
                this.equalDoneScopeObject = function ( scope, message ) {

                    var _this = this;

                    this._assertAsync( function () {
                        assert.deepEqual( getPropertiesArray( scope ), getPropertiesArray( _this._expectedDoneScope.get() ), message );
                    } );

                    return this;

                };

                this._init();

            },

            Fixture = function ( assert, config ) {

                assert.expect( config.expectedTests );

                this.assert = assert;
                this.testDone = config.asyncDoneCalls ? assert.async( config.asyncDoneCalls ) : undefined;

                this.dfd = {
                    a: $.Deferred(),
                    b: $.Deferred(),
                    c: $.Deferred(),
                    d: $.Deferred(),
                    e: $.Deferred(),
                    f: $.Deferred()
                };

                this.doneArgs = new ArgStore();
                this.failArgs = new ArgStore();
                this.scope = new ScopeStore();

                this.contextA = { name: 'contextA' };
                this.contextB = { name: 'contextB' };

                this.compareOutcomeToJQueryWhen = new CompareOutcomeToJQueryWhen( {
                    assert: assert,
                    assertDoneCb: this.testDone
                } )

            };

        return Fixture;

    })();
