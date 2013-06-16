File-Tracker
============

Node.JS module that will find all files, whose name matches a supplied RegExp, in specified directories and return their contents.

It also watches the directories for changes.

Other modules do something similar. This one does not raise events when changes occur and instead waits to be asked for changes.

A rough idea of the API/events.

```javascript
	const Tracker = require('tracker');
	const tracker = new Tracker();
	
	tracker.on( "fileAdded", listener )
	.on( "changesSent", listener )
	.on( "fileDeleted", listener )
	.on( "fileEdited", listener )
	.on( "error", listener );	
	
	tracker.trackAndScan( [
		{ dir: "src", match: ".*\.js" },
		{ dir: "other-src", match: ".*\.js" },
		{ dir: "extra-src", match: ".*\.js" } 
	] ); // This triggers a scan and all files founds will raise a "fileAdded" event.
	
	... Some time later ...
	
	tracker.refresh(); //Call this to be notified of any changes since last "changesSent" event.
```

In other words, "don't call me, I'll call you."

When the tracker using code requires all the file changes it calls

```javascript	
	tracker.refresh();
```

A stream of events will then be raised specifying the changes until the "changesSent"
 