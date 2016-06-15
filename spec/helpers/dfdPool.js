var DfdPool = function () {
    
    this._deferreds = [];
    this._args = [];
    this._contexts = [];

     this.resolve = function ( dfd1, dfd2, dfdN ) {

            this._deferreds = Array.prototype.slice.call( arguments );
            this._args = [];
            this._contexts = [];

            this._command = 'resolve';

            return this;

        };

        this.withArgs = function ( arg1, arg2, argN ) {

            var i;
            
            this._args = Array.prototype.slice.call( arguments );

            for ( i = 0; i < this._args.length; i++ ) {
                if ( !$.isArray( this._args[i] ) ) this._args[i] = [this._args[i]];
            }

            return this;

        };

        this.andApply = function () {

            var deferreds = this._deferreds,
                command = this._command,
                deferred, arg, i;
            
            for ( i = 0; i < deferreds.length; i++ ) {

                arg = this._args[i];
                deferred = this._deferreds[i];
                
                if ( arg === undefined ) {
                    deferred[command]();
                } else {
                    deferred[command].apply( deferred, arg );
                }

            }

            // Returns a promise, created with $.when, which resolves or fails when all deferreds have
            // resolved or failed.
            return $.when.apply( $, deferreds );

        };

        this.then = function ( alwaysCb ) {
            this.andApply().always( alwaysCb );
        };

};