;( function ( root, factory ) {
    if ( typeof exports === 'object' ) {

        module.exports = factory( require( 'jquery' ) );

    } else if ( typeof define === 'function' && define.amd ) {

        define( ['jquery'], factory );

    }
}( this, function ( jQuery ) {
    "option strict";

    // @include jquery.promises.js
    return jQuery.Promises;

} ));

