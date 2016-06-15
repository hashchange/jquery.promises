var after = (function () {

    var After = function ( promises ) {

        this._promises = Array.prototype.slice.call( promises );

        this.run = function ( alwaysCb ) {
            $.when.apply( $, this._promises ).always( alwaysCb );
        };

        return this;

    };

    return function () {

        return new After( arguments );

    };


})(),
    
    afterAllPendingResolutionsAreDone = function () {

        var arbitraryDeferredAtEndOfAsyncResolutionQueue = $.Deferred();

        return after( 
            arbitraryDeferredAtEndOfAsyncResolutionQueue.resolve() 
        );
        
    };
