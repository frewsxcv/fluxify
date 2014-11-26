'use strict';

var XDispatcher = function(){
	this._callbacks = {};
	this._isDispatching = false;

	if( typeof Promise != 'undefined' ){
		this._Promise = Promise;
	}
};

XDispatcher.prototype = {
	register: function( id, callback ){
		var ID = id;

		// If the callback is the first parameter
		if( typeof id == 'function' ){
			ID = 'ID_' + ( Object.keys( this._callbacks ).length + 1 );
			callback = id;
		}

		this._callbacks[ID] = callback;
		return ID;
	},

	registerStore: function( id, xStore ){
		this._callbacks[id] = xStore.callback;
		Object.defineProperty(xStore, '_dispatcher', {
			value: this
		});
	},

	unregister: function( id ) {
		delete this._callbacks[id];
	},

	waitFor: function( ids ) {
		var promises = [],
			i = 0
		;

		if( !Array.isArray( ids ) )
			ids = [ ids ];

		for(; i<ids.length; i++ ){
			if( this._promises[ ids[i] ] )
				promises.push( this._promises[ ids[i] ] );
		}

		//console.log( this._promises );

		if( !promises.length )
			return this._Promise.resolve();

		return this._Promise.all( promises );
	},

	dispatch: function() {
		var me = this,
			promises = [],
			dispatchArguments = arguments,
			id, promise
		;

		if( this._isDispatching )
			throw( 'Cannot dispatch in the middle of a dispatch.' );

		this._promises = [];

		// A closure is needed for the callback id
		Object.keys( this._callbacks ).forEach( function( id ){

			// All the promises must be set in me._promises before trying to resolved
			// in order to make waitFor work ok
			me._promises[ id ] = me._Promise.resolve().then( function(){
				return me._callbacks[ id ].apply( me, dispatchArguments );
			});

			promises.push( me._promises[ id ] );
		});

		var promise = this._Promise.all( promises )
			.then(
				function(){
					me._isDispatching = false;
				},
				function(){
					me._isDispatching = false;
				}
			)
		;

		promise.dispatch = promise.doAction = function() {
			return me.dispatch.apply( me, arguments );
		};

		return promise;
	},

	isDispatching: function() {
		return this._isDispatching;
	}

};

module.exports = XDispatcher;