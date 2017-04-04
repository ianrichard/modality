/*  
	http://modality.me
	Manager modality.js
	Manages popover and modal components
	Created by ianrichard.com 2013-15
	MIT license
*/
var Modality = (function () {

	var _isTouch 					= 'ontouchstart' in document.documentElement;
	var _Components 				= new Array();
	var _$modalityScopeContainer 	= $('body');

	var _addEventListeners = function () {

		$(document).delegate('[modality-modal], [modality-popover]', 'click', function (e) {
			e.preventDefault();
			_createModalityInstance($(this));
		});
				
		$(document).delegate('[modality-close]', 'click', function () {
			_closeHighestComponent();
		});

		$(document).delegate('[modality-submit]', 'click', function () {
			_broadcastSubmitFromHighestComponent();
		});

		// prevent background scrolling on mobile
		$(document).delegate('[modality-obscure], [modality-popover-caret], [modality-no-scroll]', 'touchmove', function (e) {
			e.preventDefault();
		});

		$(document).keydown(function(e) {

			var numberOf_Components = _Components.length;

			if (numberOf_Components > 0) {

				var index = numberOf_Components - 1;

				var component = {
					Instance: 	_Components[index],
					index: 		index
				};

				var keyCode = e.keyCode;

				// escape
				if (keyCode == 27) {
						
					// make sure it's okay for an easy dismissal
					if (component.Instance.closeOutside()) {
						_closeComponent(component);
					}

				} 
				
				// control / command + enter
				//else if ((keyCode == 10 || keyCode == 13) && (e.metaKey || e.ctrlKey)) {

				// changing to just enter key
				else if (keyCode == 13) {

					// but only do so if the element doesn't have a prevent enter submit attribute
					if ($(_getHighestComponent().Instance.getContentElement()).attr('modality-prevent-enter-submit') != 'true') {
						_broadcastSubmitFromHighestComponent();
					}

				}
			}


		});

		$(window).resize(function () {

			for (var i in _Components) {
				_Components[i].resize();
			}

		});
		
	};

	var _createModalityInstance = function ($target) {

		_hidePageOverflow();

		var $invokingElement = $target;

		var componentType;

		if ($target.is('[modality-modal]')) {
			componentType = 'modal';
		}

		else {
			componentType = 'popover';
		}

		var ComponentInstance;

		var componentIndex = _Components.length + 1;

		if (componentType == 'modal') {

			// the modal uses the componentIndex as a way to determine
			// if it's the root-level modal for the option of 
			// scaling the background
			ComponentInstance = new Modality.Modal({
				invokingElement: $invokingElement[0], 
				componentIndex: componentIndex
			});

		} 
		else if (componentType == 'popover') {

			ComponentInstance = new Modality.Popover({
				invokingElement: $invokingElement[0]
			});

		}

		if (ComponentInstance) {

			ComponentInstance.load();
			_Components.push(ComponentInstance);
			_$modalityScopeContainer.addClass('inactive');

		}
	};

	var _getHighestComponent = function () {

		var ComponentInstance;
		var instanceIndex;

		instanceIndex 		= _Components.length - 1;
		ComponentInstance 	= _Components[instanceIndex];

		if (ComponentInstance) {
			return {
				Instance: 	ComponentInstance,
				index: 		instanceIndex
			}			
		} else {
			return false;
		}

	};	

	var _closeHighestComponent = function () {

		var highestComponent = _getHighestComponent();

		_closeComponent(highestComponent);		

	};

	// abstracted way of closing and destroying either a modal or a popover
	var _closeComponent = function (component) {

		if (component && !component.Instance.isTransitioning()) {			

			component.Instance.close();

			$(component.Instance.getContentElement()).trigger('Modality.Close');

			_destroyComponentInstance(component.index);			

			_showPageOverflow();

		}

		if (_Components.length == 0) {
			_$modalityScopeContainer.removeClass('inactive');
		}		

	};

	var _broadcastSubmitFromHighestComponent = function () {

		$(_getHighestComponent().Instance.getContentElement()).trigger('Modality.Submit');	

	};	

	var _closeEverything = function () {

		if (_Components.length > 0) {			
			_closeHighestComponent();
			_closeEverything();
		}

	};

	// pop it out of the _Components instances array
	var _destroyComponentInstance = function (index) {
		_Components.splice(index, 1);
	};	

	var _hidePageOverflow = function() {
		$('html').addClass('modality-html-hidden')
		if (_htmlIsOverflowing() && _isWindows()) {
			var paddingRight = '16px';
			if (_isIE()) {
				paddingRight = '17px';
			}
			$('html').css('padding-right', paddingRight);
		}
		if (_isTouch()) {
			$('html').css('position', 'fixed');
		}
	};

	var _showPageOverflow = function() {
		$('html').removeClass('modality-html-hidden')
		if (_isWindows()) {
			$('html').css('padding-right', '');
		}
		if (_isTouch()) {
			$('html').css('position', '');
		}		
	};

	var _htmlIsOverflowing = function() {
		var html = $('html')[0];
		return html.scrollHeight > html.clientHeight || html.scrollWidth > html.clientWidth;
	};

	var _isWindows = function() {
		return navigator.appVersion.indexOf('Win') != -1
	};

	var _isIE = function() {

		var ua = window.navigator.userAgent;

		var msie = ua.indexOf('MSIE ');
		if (msie > 0) {
			// IE 10 or older => return version number
			return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
		}

		var trident = ua.indexOf('Trident/');
		if (trident > 0) {
			// IE 11 => return version number
			var rv = ua.indexOf('rv:');
			return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
		}

		var edge = ua.indexOf('Edge/');
		if (edge > 0) {
		   // IE 12 => return version number
		   return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
		}

		// other browser
		return false;
	};

	var _isTouch = function() {
		return 'ontouchstart' in document.documentElement
	};

	var _init = function () {

		_addEventListeners();
	
	}();

	return {
		getHighestComponent: 	_getHighestComponent,
		closeHighestComponent:  _closeHighestComponent,
		closeEverything: 		_closeEverything
	}
	
})();