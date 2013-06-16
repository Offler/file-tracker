"use strict";

const Tracker = require('./lib/Tracker');
const tracker = new Tracker();

function listener() {
	console.info('Called');
}

tracker.on( "fileAdded", listener )
.on( "changesSent", listener )
.on( "fileDeleted", listener )
.on( "fileEdited", listener )
.on( "error", listener );	

tracker.trackAndScan( [
	{ dir: "../code-finder/src", match: ".*\.js" },
	{ dir: "../code-finder/other-src", match: ".*\.js" },
	{ dir: "../code-finder/extra-src", match: ".*\.js" } 
] ); // This triggers a scan and all files founds will raise a "fileAdded" event.


//tracker.refresh();
