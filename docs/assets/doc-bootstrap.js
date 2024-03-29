
function getBootStrapPath(){
	var scripts = document.getElementsByTagName('script');
	for(var i=0; i < scripts.length ; i++ ){
		var script = scripts[i];
		if( script.src && script.src.indexOf( 'doc-bootstrap.js') !== -1 ){
			return script.src.replace( 'doc-bootstrap.js', '' );
		}
	}
}
// Shows a top level menu for all test files if ( not running an automated test and not part of doc page )
if( !window.QUnit ){
	// find the current path: 
	var baseBootStrapUrl = getBootStrapPath();
	window.kDocPath = baseBootStrapUrl + './assets/';
	window.kDocPath = './assets/';
	// output any blocking scripts that need to be ready before dom ready: 
	document.write( '<script src="' + kDocPath + 'bootstrap-tab.js"></script>' );
	document.write( '<script src="' + kDocPath + 'bootstrap-dropdown.js"></script>' );
	document.write( '<script src="' + kDocPath + 'jquery.prettyKalturaConfig.js"></script>' );
	document.write( '<script src="' + kDocPath + 'kWidget.featureConfig.js"></script>' );
	// kwidget auth: 
	document.write( '<script src="' + kDocPath + 'kWidget.auth.js"></script>' );
	
	// inject all the twitter bootstrap css and js ( ok to be injected after page is rendering )
	$( 'head' ).append(
		$( '<link rel="shortcut icon" href="' + kDocPath + 'css/favicon.ico">' ),
		$( '<link href="' + kDocPath + 'bootstrap.min.css" rel="stylesheet">' ),
		$( '<link href="' + kDocPath + 'kdoc.css" rel="stylesheet">'),
		// bootstrap-modal
		$( '<script type="text/javascript" src="' + kDocPath + 'bootstrap-modal.js"></script>' ),
		// pretify: 
		$( '<script src="' + kDocPath + 'prettify.js"></script>' ),
		$( '<link href="' + kDocPath + 'prettify.css" rel="stylesheet">' ),
		// color picker:
		$( '<link rel="stylesheet" media="screen" type="text/css" href="' + kDocPath + 'colorpicker.css" />' ),
		$( '<script type="text/javascript" src="' + kDocPath + 'colorpicker.js"></script>' ),
		// dialog box: 
		$( '<script type="text/javascript" src="' + kDocPath + 'bootbox.min.js"></script>' )
	);
	// check if we should enable google analytics: 
	// TODO remove dependency on mw
	if( typeof mw != 'undefined' && mw.getConfig( 'Kaltura.PageGoogleAnalytics' ) ) {
		var _gaq = _gaq || [];
		_gaq.push(['_setAccount', mw.getConfig( 'Kaltura.PageGoogleAnalytics' )]);
		_gaq.push(['_trackPageview']);

		(function() {
			var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
			ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
			var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
		})();
	}
} else{
	// provide a stub for prettyKalturaConfig so that tests don't have javascript errors:
	$.fn.prettyKalturaConfig = function( pluginName, flashVars, flashvarCallback ){
		$(this).text( 'running qunit test');
	};
	// provide a stub for featureConfig for running tests ( just directly map to kWidget.embed )
	kWidget.featureConfig = function( embedOptions ){
		kWidget.embed( embedOptions );
	}
	// hide all prettyconfig: 
	$(function(){
		$('pre.prettyprint').hide();
	});
}
window.isKalturaDocsIframe = false;
// Detect if in an doc iframe:
try{
	if( document.URL.indexOf( 'noparent=') === -1 &&
		window.parent && window.parent['mw'] && window.parent.mw.getConfig('KalutraDocContext')){
		window.isKalturaDocsIframe = true;
		// call parent loaded if set: 
		if(  window.parent['handleLoadedIframe'] ){
			window.parent['handleLoadedIframe']();
		}
	} else {
		// if not in an iframe add some padding
		$('head').append(
			$('<style>body{padding:15px}</style>')
		);
	}
}catch(e){
	// maybe not in the right env.
}
// clock player render time
var kdocPlayerStartTime = new Date().getTime();
if( typeof kWidget != 'undefined' && kWidget.addReadyCallback ){
	var kdocTimePerPlayer = {};
	kWidget.addReadyCallback( function( pId ){
		if( ! $( '#' + pId ).length ){
			return ;
		}
		$( '#' + pId )[0].kBind("playerReady.pTimeReady", function(){
			if( kdocTimePerPlayer[ pId] ){
				return ;
			}
			alreadyRun = true;
			var readyTime = ( new Date().getTime() - kdocPlayerStartTime )/1000;
			var fileName = location.pathname.split('/').pop();
			// trigger the google track event if set:: 
			if( window['_gaq'] ){
				// send feature page load time event:
				_gaq.push(['_trackEvent', 'FeaturePage', 'PlayerLoadTimeMs', fileName, readyTime*1000]);
			}
			// note kUnbind seems to unbind all mediaReady
			//$( '#' + pId )[0].kUnbind(".pTimeReady");
			kdocTimePerPlayer[ pId ] = ( new Date().getTime() - kdocPlayerStartTime )/1000;
			// note kUnbind seems to unbind all mediaReady
			$( '#' + pId )[0].kUnbind(".pTimeReady");
			$('body').append( '<div class="kdocPlayerRenderTime" style="clear:both;"><span style="font-size:11px;">' + pId + ' ready in: <i>' + 
					kdocTimePerPlayer[ pId ] + '</i> seconds</span></div>');
			if( document.URL.indexOf( 'noparent=') === -1 && parent && parent.sycnIframeContentHeight ){
				parent.sycnIframeContentHeight();
			}
		});
	});
}
// the update player button: 
$(document).on('click',  '.kdocUpdatePlayer', function(){
	$('.kdocPlayerRenderTime').empty();
	kdocPlayerStartTime = new Date().getTime();
})

// Set kdocEmbedPlayer to html5 by default:
if( ! localStorage.kdocEmbedPlayer ){
	localStorage.kdocEmbedPlayer = 'html5';
}
// always disable playback-mode selector ( v2 ) 
// now only pages with disablePlaybackModeSelector set LeadWithHTML5 to false, and require forceMobileHTML5
if( !window['disablePlaybackModeSelector'] ){
	// don't set flag if any special properties are set: 
	if( localStorage.kdocEmbedPlayer == 'html5' && window['mw'] && 
			mw.getConfig( 'Kaltura.LeadWithHTML5') == null &&
			mw.getConfig( 'disableForceMobileHTML5') == null && 
			mw.getConfig( 'Kaltura.ForceFlashOnDesktop' ) !== true  
	){
		mw.setConfig('Kaltura.LeadWithHTML5', true);
	}
}
// support forceKDPFlashPlayer flag: 
if( document.URL.indexOf('forceKDPFlashPlayer') !== -1 ){
	mw.setConfig( 'Kaltura.LeadWithHTML5', false);
	mw.setConfig( 'EmbedPlayer.DisableVideoTagSupport', true );
}

// document ready events:
$(function(){
	// Do any configuration substitutions
	if( localStorage.kdoc_html5url ){
		$('pre.prettyprint').each(function(){
			$(this).html( $(this).html().replace('{{HTML5LibraryURL}}', localStorage.kdoc_html5url) )
		})
	}
	
	// make active all the pref links:
	$('.adjust-your-preferences').click(function(){
		// invoke the pref menu
		return false;
	})
	
	// make code pretty
	window.prettyPrint && prettyPrint();

});


