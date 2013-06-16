"use strict";

const fs = require("fs");
const path = require("path");
const log4js = require("log4js");
const EventEmitter = require("events").EventEmitter;
const DirectoryScanner = require("./DirectoryScanner");

function Tracker() {
	this.logger = log4js.getLogger( "Tracker" );
	this.pendingChangeScanners = Object.create( null );
}

Tracker.prototype = Object.create( EventEmitter.prototype );

Tracker.prototype.trackAndScan = function trackAndScan( directoryConfig ) {
	directoryConfig.forEach( createScanner.bind( this ) );
};

Tracker.prototype.refresh = function refresh() {
	this.logger.info( "Refresh requested." );
	
	for( var directory in this.pendingChangeScanners ) {
		const directoryScanner = this.pendingChangeScanners[ directory ];
		
		directoryScanner.sendPendingEvents();
	}
	
	emitChangesSent.bind( this )();
};

function createScanner( config ) {
	const dir = config.dir;
	const match = config.match;
	const directoryScanner = new DirectoryScanner( this );
	
	directoryScanner.scanDirectory( dir, match );
	
	directoryScanner.on( "scannerResolved", scannerResolved.bind(this) )
					.on( "scannerPending", scannerPending.bind(this) );
	
	this.pendingChangeScanners[ dir ] = directoryScanner;
}

function emitChangesSent() {
	var pendingScanners = Object.keys( this.pendingChangeScanners );
	
	if( pendingScanners.length === 0 ) {
		this.emit( "changesSent" );
		this.logger.info( "Changes sent." );
	}
}

function scannerResolved( directory ) {
	this.logger.info( "Scanner resolved, [%s]", directory );
	delete this.pendingChangeScanners[ directory ];
	
	emitChangesSent.bind( this )();
}

function scannerPending( directory, directoryScanner ) {
	this.pendingChangeScanners[ directory ] = directoryScanner;
}

module.exports = Tracker;
