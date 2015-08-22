// amd.js

require( [

    'jquery',
    'jquery.promises'

], function ( $ ) {

    // Check that $.Promises is available
    var $message = $( '<div class="alert-box large-text-center">' );

    if ( !!$.Promises ) {
        $message.addClass( "success" ).text( "$.Promises is available, as expected." );
    } else {
        $message.addClass( "alert" ).text( "Something went wrong: $.Promises is not available!" );
    }

    $( "#content" ).append( $message );

} );
