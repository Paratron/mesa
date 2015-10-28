/**
 * modo-mdo-InputTextPlus
 * ======================
 * Extends the default modo InputBox to support floating labels.
 */
(function (){
	'use strict';

	var modoCore;

	//commonJS and AMD modularization - try to reach the core.
	if(typeof modo !== 'undefined'){
		modoCore = modo;
	} else {
		if(typeof require === 'function'){
			modoCore = require('modo');
		}
	}

	function cn(index, prefixed){
		if(prefixed !== undefined){
			return modoCore.InputTextPlus.classNames[index];
		}
		return modoCore.cssPrefix + modoCore.InputTextPlus.classNames[index];
	}

	modoCore.defineElement('InputTextPlus', ['inputtextplus', 'floatlabel', 'errorlabel', 'changed'], function (params){
		params = params || {};

		modoCore.Element.call(this, params);

		this.addClass(cn(0, false));

		this.el.append('<span class="' + cn(1) + '">' + params.placeholder + '</span>');

		this._inputEl = new modoCore.InputText(params);

		this._checkFunction = params.check;
		this.liveCheck = !!params.liveCheck;
		this.autosave = !!params.autosave;
		this.autosaveTimeout = params.autosaveTimeout || 500;
		this._saveFunction = params.save;
		this.default = params.default || params.value || '';

		if(params.saveButton){
			this._saveButton = new modo.Button({
				label: params.saveButton
			});

			this._saveButton.el.attr('tabindex', '-1');

			this._saveButton.on('click', function (){
				that.save();
			});
		}

		this._errorLabel = new modoCore.Label({
			className: cn(2, false),
			showEffect: {
				effect: 'slideDown',
				effectArgs: ['fast']
			},
			hideEffect: {
				effect: 'slideUp',
				effectArgs: ['fast']
			}
		});

		this.el.append(this._inputEl.el, this._errorLabel.el);

		if(params.saveButton){
			this.el.append(this._saveButton.el);
		}

		var labelVisible = !!params.value;

		if(labelVisible){
			this.addClass(modoCore.InputText.classNames[4]);
		}

		var that = this;

		this.valid = true;

		this._setLabel = function (inValue){
			if(inValue === undefined){
				inValue = that._inputEl.get();
			}

			if(inValue){
				if(labelVisible){
					return;
				}
				labelVisible = true;
				that.addClass(modoCore.InputText.classNames[4]);
				that.trigger('filled');
				return;
			}

			labelVisible = false;
			that.removeClass(modoCore.InputText.classNames[4]);
			that.trigger('empty');
		};

		this.setError = function (inMessage){
			this._errorLabel.set(inMessage || '');

			/*if(inMessage){
				this._errorLabel.show();
			} else {
				this._errorLabel.hide();
			}*/
		};

		this._inputEl.on('keydown', function (e){
			setTimeout(function (){
				that._setLabel();
				if(that.liveCheck){
					that.check();
				}
			}, 1);
			//that.trigger('keydown', e);
		});

		this._inputEl.on('all', function (event, e){
			that.trigger(event, e);
		});

		var asTimeout;

		this._inputEl.on('change', function (){
			that._setLabel();
			that.trigger('change');

			if(this.get() !== that.default){
				that.el.addClass(cn(3));
			} else {
				that.el.removeClass(cn(3));
			}

			if(that.autosave){
				clearTimeout(asTimeout);

				asTimeout = setTimeout(function (){
					that.save();
				}, that.autosaveTimeout);
			}
		});
	})
		.inheritPrototype('InputText')
		.extendPrototype({
			/**
			 * Calls the check function that has been provided in the constructor parameters (params.check), or set by
			 * overwriting the this._checkFunction
			 * The function will be auto-promised. Return something to fullfill it, throw an error to make it fail.
			 */
			check: function (options){
				options = options || {};
				var that = this;

				if(typeof this._checkFunction === 'function'){
					try {
						return Q.when(this._checkFunction.call(this, this.get()))
							.then(function (){
								if(!options.nonVisual){
									that.normal();
								}
							})
							.catch(function (e){
								if(!options.nonVisual){
									that.error(e);
								}
								return Q.reject(e);
							});
					}
					catch(e){
						if(!options.nonVisual){
							that.error(e);
						}
						return Q.reject(e);
					}
				}

				return Q.resolve();
			},
			/**
			 * Will call the save function, provided in the constructor parameters (params.save), or set by
			 * overwriting this._saveFunction
			 * The function will be auto-promised. Return something to fullfill it, throw an error to make it fail.
			 */
			save: function (){
				var that = this;

				this.check().then(function (){
					if(typeof that._saveFunction === 'function'){
						that.active();
						var r = Q.when(that._saveFunction.call(that, that.get()))
							.then(function (){
								that.success();
								that.default = that.get();
								that.el.removeClass(cn(3));
								return Q.resolve();
							})
							.fail(function (e){
								that.error(e ? e.message : '');
								return Q.reject(e);
							}).done();

						return r;
					}
					return Q.resolve();
				});
			},
			set: function (value, options){
				this._setLabel(value);
				this._inputEl.set(value, options);

				options = options || {};

				if(!!options.check){
					this.check();
				}

				if(options.default){
					this.default = value;
					this.el.removeClass(cn(3));
				} else {
					if(value === this.default){
						this.el.removeClass(cn(3));
					} else {
						this.el.addClass(cn(3));
					}
				}

				return this;
			},
			get: function (){
				return this._inputEl.get();
			},
			active: function (unset){
				if(unset === false){
					this.removeClass('tme-active', false);
					return this;
				}
				this.addClass('tme-active', false);
				this.setError();
				return this;
			},
			success: function (){
				this.removeClass('tme-active', false);
				this.addClassTemporary('tme-success', 2000, false);
				this.setError();
				return this;
			},
			error: function (message, permanent){
				this.removeClass('tme-active', false);
				this.setError(message);
				if(permanent){
					this.addClass('tme-error', false);
				} else {
					this.addClassTemporary('tme-error', 2000, false);
				}
				return this;
			},
			normal: function (){
				this.removeClass('tme-active tme-error tme-success', false);
				this.setError();
				return this;
			},
			/**
			 * Will take the keyboard focus from the elements DOM object.
			 */
			blur: function (){
				this._inputEl.blur();
				this.trigger('blur');
				return this;
			},

			/**
			 * Will set the keyboard focus to the elements DOM object.
			 */
			focus: function (timeout){
				if(!timeout){
					this._inputEl.focus();
					this.trigger('focus');
				} else {
					var that = this;
					setTimeout(function(){
						that._inputEl.focus();
						that.trigger('focus');
					}, timeout);
				}
				return this;
			},
			select: function (start, length){
				this._inputEl.select(start, length);
				return this;
			},
			disable: function (){
				this._inputEl.disable();
			},
			enable: function (){
				this._inputEl.enable();
			}
		});

	if(typeof exports !== 'undefined'){
		//commonJS modularization
		exports = modoCore.InputTextPlus;
	} else {
		if(typeof define === 'function'){
			//AMD modularization
			define('InputTextPlus', [], function (){
				return modoCore.InputTextPlus;
			});
		}
	}
})();