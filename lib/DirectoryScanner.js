"use strict";

const fs = require("fs");
const path = require("path");
const log4js = require("log4js");
const EventEmitter = require("events").EventEmitter;

function DirectoryScanner( tracker, readdir ) {
	this.tracker = tracker;
	this.readdir = readdir;
	this.logger = log4js.getLogger( "Tracker - DirectoryScanner" );
	
	this.pendingFileStats = new Map();
	this.pendingFileReads = new Map();
	this.pendingDirectoryReads = new Map();
}

DirectoryScanner.prototype = Object.create( EventEmitter.prototype );

DirectoryScanner.prototype.scanDirectory = function scanDirectory( dir, match ) {
	this.logger.info( "Scanning directory [%s], with matcher [%s].", dir, match );
	
	this.match = match;
	this.directory = dir;
	
	this.readDirectory( dir );
};

DirectoryScanner.prototype.readDirectory = function readDirectory( dir ) {
	this.pendingDirectoryReads.set( dir, true );
	
	this.logger.debug( "Reading directory [%s].", dir );
	
	fs.readdir( dir, this.dirRead.bind( this, dir ) );
	fs.watch( dir, this.watchedFilesEvent.bind( this, dir ) );
};

DirectoryScanner.prototype.readFile = function readFile( fileName ) {
	this.pendingFileReads.set( fileName, true );
	
	this.logger.debug( "Reading file [%s].", fileName );
	
	fs.readFile( fileName, "utf-8", this.fileRead.bind( this, fileName ) );
};

DirectoryScanner.prototype.statFile = function statFile( dir, fileName ) {
	const filePath = dir + path.sep + fileName;
	this.pendingFileStats.set( filePath, true );
	
	this.logger.debug( "Stating file [%s]:[%s].", dir, fileName );
	
	fs.stat( filePath, this.fileStated.bind( this, filePath ) );
};

DirectoryScanner.prototype.dirRead = function dirRead( dir, error, files ) {
	if( error ) {
		this.logger.error( "Directory read failed [%s], [%j].", error.path, error );
	} else {
		this.logger.debug( "Directory read [%s].", dir );
		
		files.forEach( this.statFile.bind( this, dir ) );
	}
	
	this.pendingDirectoryReads['delete']( dir );
	this.emitScannerResolved();
};

DirectoryScanner.prototype.fileRead = function fileRead( fileName, error, data ) {
	if( error ) {
		this.logger.error( "File read failed [%s], [%j].", error.path, error );
	} else {
		this.logger.debug( "Source file read [%s].", fileName );
		
		this.tracker.emit( "fileAdded", fileName, data );
	}
	
	this.pendingFileReads['delete']( fileName );
	this.emitScannerResolved();
};

DirectoryScanner.prototype.fileStated = function fileStat( fileName, error, stats ) {
	if( error ) {
		this.logger.error( "File stat failed [%s], [%j].", error.path, error );
	} else {
		this.logger.debug( "File stat [%s].", fileName );
		
		if( stats.isFile() ) {
			if( fileName.match( this.match ) ) {
				this.readFile( fileName );
			}
		} else if( stats.isDirectory() ) {
			this.readDirectory( fileName );
		} else {
			this.logger.debug( "Stat on [%s] is not file or directory, [%j]", fileName, stats );
		}
	}
	
	this.pendingFileStats['delete']( fileName );
	this.emitScannerResolved();
};


DirectoryScanner.prototype.emitScannerResolved = function emitScannerResolved() {
	if( this.pendingFileReads.size === 0 && this.pendingDirectoryReads.size === 0 && this.pendingFileStats.size === 0 ) {
		this.emit( "scannerResolved", this.directory );
	}
};

DirectoryScanner.prototype.watchedFilesEvent = function watchedFilesEvent( dir, event, filename ) {
	//TODO: The Scanner can Emit two events "scannerPending" "scannerResolved".
	//TODO: File/directory changes to scan. 
	this.logger.info( "Watch event: dir [%s], event [%j], filename [%s].", dir, event, filename );
	
	this.emit( "scannerPending", this.directory, this );
};

module.exports = DirectoryScanner;
