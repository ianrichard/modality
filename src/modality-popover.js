Modality.Popover = function (config) {

	var _dom = {
		invokingElement: config.invokingElement,
		popoverScopeContainer: null,
		popover: null,
		popoverContainer: null,
		popoverContentInner: null,
		popoverCaret: null
	};

	var _defaultPopoverAttributes = {
		width: 			 300,
		height: 		 'auto',
		minimumHeight: 	 100,
		fadeInDuration:  300,
		fadeOutDuration: 300,
		closeOutside:	 true,
		popoverPosition: 'vertical',

		// makes sure the caret doesn't leave the container
		// especially with the rounded corner
		minimumCaretContainerOffset: 15

	};


	// how much padding you want from the popover to the edge of the document in %
	var _documentLeftRightPadding = .00;
	var _documentTopBottomPadding = .00;

	// lock and unlock to prevent double tapping nonsense
	var _popoverIsTransitioning = false;

	var _popoverAttributes 				= {};
	var _invokingElementAttributes 		= {};
	var _paddedDocumentRegion 			= {};
	var _regionsAroundTheInvokingLink 	= {};
	var _bestRegionForThePopover 		= {};

	// will set these values on demand because the document can be resized / rotated
	var _documentWidth,
		_documentHeight;

	var _showCaret = true;
	var _contentIsLoaded = false;

	var _PopoverContent;

	var _lastFocusedInnerElement;

	var _popoverSnapshot = {};	
	
	var _loadPopover = function () {
		_checkAndSetTransitioningFlag();
		_getPopoverAttributes();
		_runCallback(_popoverAttributes.preLoadCallback);
		_getPopoverScopeContainer();
		_getInvokingElementAttributes();
		_injectPopoverTemplate();
		_setScopedSelectors();
		_getDocumentSize();
		_getPaddedDocumentRegion();
		_getRegionsAroundTheInvokingLink();
		_getBestRegionForThePopover();
		_loadPopoverContent();
		_broadcastPreLoadEvent();
		_setHiddenDefaultPopoverDisplayProperties();
		_positionPopoverContent();
		_setCaretPosition();
		_showPopover();
		_setGenericEventListeners();
	};

	var _checkAndSetTransitioningFlag = function () {

		if (_popoverIsTransitioning) {
			return;
		} else {
			_popoverIsTransitioning = true;
		}

	};	

	var _clearTransitioningFlag = function () {
		_popoverIsTransitioning = false;
	};	

	var _getPopoverAttributes = function () {
		
		_popoverAttributes = {};
		_popoverAttributes.width 					= _dom.invokingElement.getAttribute('modality-width');
		_popoverAttributes.height 					= _dom.invokingElement.getAttribute('modality-height');
		_popoverAttributes.minimumHeight 			= _dom.invokingElement.getAttribute('modality-minimum-height');
		_popoverAttributes.fadeInDuration 			= _dom.invokingElement.getAttribute('modality-fade-in-duration');
		_popoverAttributes.fadeOutDuration 			= _dom.invokingElement.getAttribute('modality-fade-out-duration');
		_popoverAttributes.closeOutside				= _dom.invokingElement.getAttribute('modality-close-outside');
		_popoverAttributes.popoverPosition			= _dom.invokingElement.getAttribute('modality-position');
		_popoverAttributes.preLoadCallback 			= _dom.invokingElement.getAttribute('modality-pre-load-callback');
		_popoverAttributes.postCloseCallback 		= _dom.invokingElement.getAttribute('modality-post-close-callback');
		_popoverAttributes.offsetFromInvokingLink 	= _dom.invokingElement.getAttribute('modality-link-offset') || String(Math.round(15 - _dom.invokingElement.offsetHeight * .25));

		// let's scrubbadubb dubb the values
		for (attribute in _popoverAttributes) {

			var attributeValue = _popoverAttributes[attribute];

			if (typeof attributeValue != 'function') {

				// if it's empty, set it to undefined for the proper extend object merging
				if (!attributeValue || !attributeValue.replace(/\s/g, '').length) {
					attributeValue = undefined;
				} 
				// type cast numbers
				else if (attributeValue.match(/\d+/g)) {
					attributeValue = Number(attributeValue);
				}
			}

			_popoverAttributes[attribute] = attributeValue;

		};

		if (_popoverAttributes.closeOutside == 'false') {
			_popoverAttributes.closeOutside = false;
		}

		_popoverAttributes = _extend(_defaultPopoverAttributes, _popoverAttributes);

	};

	var _getInvokingElementAttributes = function () {

		var scrollTop = 0;

		if (_dom.popoverScopeContainer.contains(_dom.invokingElement)) {
			scrollTop = document.body.scrollTop;
		}

		_invokingElementAttributes.top 				= _dom.invokingElement.getBoundingClientRect().top;
		_invokingElementAttributes.bottom 			= _invokingElementAttributes.top + _dom.invokingElement.offsetHeight;

		_invokingElementAttributes.left 			= _dom.invokingElement.getBoundingClientRect().left;
		_invokingElementAttributes.right 			= _invokingElementAttributes.left + _dom.invokingElement.offsetWidth;

		_invokingElementAttributes.width 			= _dom.invokingElement.offsetWidth;
		_invokingElementAttributes.height 			= _dom.invokingElement.offsetHeight;

		_invokingElementAttributes.horizontalCenter = _invokingElementAttributes.left + _invokingElementAttributes.width / 2;
		_invokingElementAttributes.verticalCenter 	= _invokingElementAttributes.top + _invokingElementAttributes.height / 2;

	};	

	var _getPopoverScopeContainer = function () {
		
		// reset from previous load
		_dom.popoverScopeContainer = null;
		_dom.popoverScopeContainer = document.querySelector('body > *');

	};

	var _injectPopoverTemplate = function () {

		_dom.popover = document.createElement('div');
		_dom.popover.className = 'modality-popover';

		_dom.popover.innerHTML = '<div class="modality-popover-obscure" modality-obscure onclick=""></div><div class="modality-popover-container" modality-popover-container><div class="modality-popover-caret" modality-popover-caret></div><div class="modality-popover-content" modality-popover-content tabindex="0"></div></div>';

		if (_popoverAttributes.closeOutside) {
			_dom.popover.querySelector('[modality-obscure]').setAttribute('modality-close','');
		}

		_dom.popoverScopeContainer.parentNode.appendChild(_dom.popover);

	};

	var _setScopedSelectors = function () {
		_dom.popoverContainer = _dom.popover.querySelector('[modality-popover-container]');
		_dom.popoverContent 	= _dom.popover.querySelector('[modality-popover-content]');
		_dom.popoverCaret		= _dom.popover.querySelector('[modality-popover-caret]');
	};

	var _getPaddedDocumentRegion = function () {

		_paddedDocumentRegion 			= {};

		_paddedDocumentRegion.top 		= _documentHeight * _documentTopBottomPadding;
		_paddedDocumentRegion.bottom 	= _documentHeight - _paddedDocumentRegion.top;

		_paddedDocumentRegion.left 		= _documentWidth * _documentLeftRightPadding;
		_paddedDocumentRegion.right 	= _documentWidth - _paddedDocumentRegion.left;

		_paddedDocumentRegion.width 	= _documentWidth - 2 * _paddedDocumentRegion.left;
		_paddedDocumentRegion.height 	= _documentHeight - 2 * _paddedDocumentRegion.top;

	};	

	var _getRegionsAroundTheInvokingLink = function () {

		var top = {};

		top.top 		= _paddedDocumentRegion.top;
		top.bottom 		= _invokingElementAttributes.top;
		top.left 		= _paddedDocumentRegion.left;
		top.right 		= _paddedDocumentRegion.right;
		top.width 		= top.right - top.left;
		top.height 		= top.bottom - top.top;
		top.regionName 	= 'top';

		var bottom = {};

		bottom.top 		= _invokingElementAttributes.bottom;
		bottom.bottom 	= _paddedDocumentRegion.bottom;
		bottom.left 	= _paddedDocumentRegion.left;
		bottom.right 	= _paddedDocumentRegion.right;
		bottom.width 	= bottom.right - bottom.left;
		bottom.height 	= bottom.bottom - bottom.top;
		bottom.regionName = 'bottom';

		var left = {};

		left.top 		= _paddedDocumentRegion.top;
		left.bottom 	= _paddedDocumentRegion.bottom;
		left.left 		= _paddedDocumentRegion.left;
		left.right 		= _invokingElementAttributes.left;
		left.width 		= left.right - left.left;
		left.height 	= left.bottom - left.top;
		left.regionName = 'left';

		var right = {};

		right.top 		= _paddedDocumentRegion.top;
		right.bottom 	= _paddedDocumentRegion.bottom;
		right.left 		= _invokingElementAttributes.right;
		right.right 	= _paddedDocumentRegion.right;
		right.width 	= right.right - right.left;
		right.height 	= right.bottom - right.top;
		right.regionName= 'right';

		_regionsAroundTheInvokingLink.top 	 = top;
		_regionsAroundTheInvokingLink.bottom = bottom;
		_regionsAroundTheInvokingLink.left 	 = left;
		_regionsAroundTheInvokingLink.right  = right;

	};	

	var _getBestRegionForThePopover = function () {

		var effectiveHeight = _popoverAttributes.minimumHeight + _popoverAttributes.offsetFromInvokingLink;
		var effectiveWidth 	= _popoverAttributes.width + _popoverAttributes.offsetFromInvokingLink;

		var largerRegion = {};

		var checkTopBottom = function () {
			if (_regionsAroundTheInvokingLink.top.height >= _regionsAroundTheInvokingLink.bottom.height) {
				largerRegion = _regionsAroundTheInvokingLink.top;
			} 
			else {
				largerRegion = _regionsAroundTheInvokingLink.bottom;
			}
		};

		var checkLeftRight = function () {
			if (_regionsAroundTheInvokingLink.left.width >= _regionsAroundTheInvokingLink.right.width) {
				largerRegion = _regionsAroundTheInvokingLink.left;
			} 
			else {
				largerRegion = _regionsAroundTheInvokingLink.right;
			}
		};

		var checkToHideCaret = function () {
			
			var hideCaret = false;

			if (_bestRegionForThePopover.regionName == 'top' || 
				_bestRegionForThePopover.regionName == 'bottom') {
				if (_invokingElementAttributes.horizontalCenter < minimumLeftOffset) {
					hideCaret = true;
				} 
				else if (_invokingElementAttributes.horizontalCenter > maximumRightOffset) {
					hideCaret = true;
				}			
			} else {
				if (_invokingElementAttributes.verticalCenter > minimumBottomOffset) {
					hideCaret = true;
				} 
				else if (_invokingElementAttributes.verticalCenter < maximumTopOffset) {
					hideCaret = true;
				}
			}

			_showCaret = !hideCaret;

		}		

		var blockLeftRight = false;
		var blockTopBottom = false;

		var minimumBottomOffset = _paddedDocumentRegion.bottom 	- _popoverAttributes.minimumCaretContainerOffset;
		var maximumTopOffset 	= _paddedDocumentRegion.top  	+ _popoverAttributes.minimumCaretContainerOffset;
		var minimumLeftOffset 	= _paddedDocumentRegion.left 	+ _popoverAttributes.minimumCaretContainerOffset;
		var maximumRightOffset 	= _paddedDocumentRegion.right 	- _popoverAttributes.minimumCaretContainerOffset;

		if (_invokingElementAttributes.verticalCenter > minimumBottomOffset) {
			blockLeftRight = true;
		} 
		else if (_invokingElementAttributes.verticalCenter < maximumTopOffset) {
			blockLeftRight = true;
		}

		if (_invokingElementAttributes.horizontalCenter < minimumLeftOffset) {
			blockTopBottom = true;
		} 
		else if (_invokingElementAttributes.horizontalCenter > maximumRightOffset) {
			blockTopBottom = true;
		}

		var isVerticalPopover = 'vertical top bottom'.indexOf(_popoverAttributes.popoverPosition) > -1;

		if (isVerticalPopover && blockTopBottom) {
			isVerticalPopover = false;
		} 

		else if (!isVerticalPopover && blockLeftRight) {
			isVerticalPopover = true;
		}

		if (isVerticalPopover) {

			// they specified top, so see if it fits
			if (_popoverAttributes.popoverPosition == 'top') {

				if (effectiveHeight <= _regionsAroundTheInvokingLink.top.height) {
					_bestRegionForThePopover = _regionsAroundTheInvokingLink.top;
					checkToHideCaret();
					return;
				}
				
			} 
			// they specified bottom, so see if it fits
			else if (_popoverAttributes.popoverPosition == 'bottom') {

				if (effectiveHeight <= _regionsAroundTheInvokingLink.bottom.height) {
					_bestRegionForThePopover = _regionsAroundTheInvokingLink.bottom;
					checkToHideCaret();
					return;
				}		
			}

			// either the generic use case, or if one of the previous conditions failed...			
			checkTopBottom();

			if (effectiveHeight <= largerRegion.height) {
				_bestRegionForThePopover = largerRegion;			
			} else {

				checkLeftRight();

				_bestRegionForThePopover = largerRegion;
			}

		} else {

			// they specified left, so see if it fits
			if (_popoverAttributes.popoverPosition == 'left') {

				if (effectiveWidth <= _regionsAroundTheInvokingLink.left.width) {
					_bestRegionForThePopover = _regionsAroundTheInvokingLink.left;
					checkToHideCaret();
					return;
				}
				
			} 
			// they specified right, so see if it fits
			else if (_popoverAttributes.popoverPosition == 'right') {
				if (effectiveWidth <= _regionsAroundTheInvokingLink.right.width) {
					_bestRegionForThePopover = _regionsAroundTheInvokingLink.right;
					checkToHideCaret();
					return;
				}		
			}

			// either the generic use case, or if one of the previous conditions failed...
			checkLeftRight();

			if (effectiveWidth <= largerRegion.width) {
				_bestRegionForThePopover = largerRegion;
			} 
			else {
				checkTopBottom();
				_bestRegionForThePopover = largerRegion;
			}
			
		}

		checkToHideCaret();

	};

	var _loadPopoverContent = function () {
		_PopoverContent = new Modality.Content({
			invokingElement: _dom.invokingElement,
			targetContainer: _dom.popoverContent,
			postLoadCallback: function () {
				_contentIsLoaded = true;
				_resize();
			},
			ajaxInjectDelay: _popoverAttributes.fadeInDuration
		});

		_PopoverContent.load();
	};

	var _broadcastPreLoadEvent = function () {
		var event = new CustomEvent('Modality.PreLoad', {bubbles: true, cancelable: true});
		_getContentElement().dispatchEvent(event);
	};

	var _broadcastPostLoadEvent = function () {
		var event = new CustomEvent('Modality.PostLoad', {bubbles: true, cancelable: true});
		_getContentElement().dispatchEvent(event);
	};

	var _setHiddenDefaultPopoverDisplayProperties = function () {
		_dom.popoverContent.style.height = _popoverAttributes.height + 'px';
		_dom.popover.style.css = '';
	};


	var _positionPopoverContent = function () {

		_dom.popoverContentInner = _dom.popoverContent.firstChild;

		if (!_dom.popoverContentInner) { return; }

		_dom.popoverContentInner.style.height = 'auto';

		var scrollTop = _dom.popoverContentInner.scrollTop;

		var width, maxWidth, maxHeight, top, left;

		if (_bestRegionForThePopover.regionName == 'top') {

			width 		= _popoverAttributes.width;
			maxWidth  	= _bestRegionForThePopover.width;
			maxHeight 	=  _bestRegionForThePopover.height - _popoverAttributes.offsetFromInvokingLink;
			top 		= _bestRegionForThePopover.bottom  - _dom.popoverContent.offsetHeight - _popoverAttributes.offsetFromInvokingLink;

		} 

		else if (_bestRegionForThePopover.regionName == 'bottom') {

			width 		= _popoverAttributes.width;
			maxWidth 	= _bestRegionForThePopover.width;
			maxHeight 	= _bestRegionForThePopover.height - _popoverAttributes.offsetFromInvokingLink;
			top 		= _bestRegionForThePopover.top    + _popoverAttributes.offsetFromInvokingLink;
		
		} 

		else if (_bestRegionForThePopover.regionName == 'left') {

			width 		= _popoverAttributes.width 		  - _popoverAttributes.offsetFromInvokingLink;
			maxWidth 	= _bestRegionForThePopover.width  - _popoverAttributes.offsetFromInvokingLink;
			maxHeight 	= _bestRegionForThePopover.height;
			left 		= _bestRegionForThePopover.right  - _dom.popoverContent.offsetWidth - _popoverAttributes.offsetFromInvokingLink;

		} 

		else if (_bestRegionForThePopover.regionName == 'right') {

			width 		= _popoverAttributes.width 		  - _popoverAttributes.offsetFromInvokingLink;
			maxWidth 	= _bestRegionForThePopover.width  - _popoverAttributes.offsetFromInvokingLink;
			maxHeight 	= _bestRegionForThePopover.height;
			left 		= _bestRegionForThePopover.left   + _popoverAttributes.offsetFromInvokingLink;

		}

		_dom.popoverContent.style.width = width + 'px';
		_dom.popoverContent.style.maxWidth = maxWidth + 'px';
		_dom.popoverContent.style.maxHeight = maxHeight + 'px';

		if (left) {
			_dom.popoverContainer.style.left = left + 'px';
			_setHorizontalPopoverY();
		}
		else {
			_dom.popoverContainer.style.top = top + 'px';
			_setVerticalPopoverX();			
		}

		_dom.popoverContentInner.style.height = _dom.popoverContent.offsetHeight + 'px';

		// check for out of bounds
		// this can happen on the parent resizing the document smaller cropping the bottom

		var popoverHeight = _dom.popoverContent.offsetHeight;

		var popoverY = Number(_dom.popoverContainer.style.top.split('px')[0]);

		var popoverBottom = popoverY + popoverHeight;

		// -1 is for minor measuring differences
		if (popoverBottom - 1 > _paddedDocumentRegion.bottom) {

			_dom.popoverContent.style.maxHeight = _getPaddedDocumentRegion.height + 'px';

			popoverHeight = _dom.popoverContainer.offsetHeight;
			popoverBottom = popoverY + popoverHeight;

			var targetPopoverY = _paddedDocumentRegion.bottom - popoverHeight + 'px';
			_dom.popoverContainer.style.top = targetPopoverY;
			_showCaret = false;
		} 

		else {
			_showCaret = true;
		}

		_dom.popoverContentInner.style.height = 'auto';
		_dom.popoverContentInner.scrollTop = scrollTop;

	};

	var _setVerticalPopoverX = function () {

		var popoverContentWidth  = _dom.popoverContent.offsetWidth;
		var popoverContentOffset = popoverContentWidth / 2;

		var popoverX =  _invokingElementAttributes.horizontalCenter - popoverContentOffset;

		if (popoverX < _bestRegionForThePopover.left) {
			popoverX = _bestRegionForThePopover.left;
		} 

		else if (popoverX + popoverContentWidth > _bestRegionForThePopover.right) {
			popoverX = _bestRegionForThePopover.right - popoverContentWidth;
		}

		popoverX = popoverX + 'px';

		_dom.popoverContainer.style.left = popoverX;
	};

	var _setHorizontalPopoverY = function () {

		var popoverContentHeight = _dom.popoverContent.offsetHeight;
		var popoverContentOffset  = popoverContentHeight / 2;

		var popoverY =  _invokingElementAttributes.verticalCenter - popoverContentOffset;

		if (popoverY < _bestRegionForThePopover.top) {
			popoverY = _bestRegionForThePopover.top;
		} 

		else if (popoverY + popoverContentHeight > _bestRegionForThePopover.bottom) {
			popoverY = _bestRegionForThePopover.bottom - popoverContentHeight;
		}

		_dom.popoverContainer.style.top = popoverY + 'px';

	};	

	var _setCaretPosition = function () {

		if (!_showCaret) {
			_dom.popoverCaret.setAttribute('class', '');
			return;
		}

		// reset from prior positioning
		_dom.popoverCaret.setAttribute('class', 'modality-popover-caret modality-popover-caret-' + _bestRegionForThePopover.regionName);
		_dom.popoverCaret.style.top = '';
		_dom.popoverCaret.style.left = '';

		if (_bestRegionForThePopover.regionName == 'top' || _bestRegionForThePopover.regionName == 'bottom') {

			var targetCaretX = _invokingElementAttributes.horizontalCenter - _dom.popoverContainer.offsetLeft;
			_dom.popoverCaret.style.left = targetCaretX + 'px';

		} 

		else if (_bestRegionForThePopover.regionName == 'left' || _bestRegionForThePopover.regionName == 'right') {

			var targetCaretY = _invokingElementAttributes.verticalCenter - _dom.popoverContainer.offsetTop;
			_dom.popoverCaret.style.top = targetCaretY + 'px';

		}

	};

	var _showPopover = function () {

		_dom.popoverContent.style.height = _popoverAttributes.height + 'px';

		setTimeout(function () {
			_clearTransitioningFlag();
			_broadcastPostLoadEvent();
		}, _popoverAttributes.fadeInDuration);

		_dom.popover.classList.add('modality-popover-active');
		_dom.popoverContent.focus();

	};	


	var _resize = function () {	

		if (!_contentIsLoaded) {
			return;
		}

		_getDocumentSize();

		if (_documentSizeOrPopoverContentHeightHasChanged()) {

			_getInvokingElementAttributes();

			_getPaddedDocumentRegion();

			_getRegionsAroundTheInvokingLink();

			_getBestRegionForThePopover();			

			_positionPopoverContent();

			_setCaretPosition();

			_setPopoverSnapshot();

		}
	};

	// there are some generic events calling resize
	// we want to make sure something has actually changed
	// generic events such as click can cause the scroll to be reset
	// because things are being re-measured
	var _setPopoverSnapshot = function () {
		_popoverSnapshot.documentWidth 	= _documentWidth;
		_popoverSnapshot.documentHeight = _documentHeight;
		_popoverSnapshot.contentHeight 	= _dom.popoverContent.offsetHeight;
	};

	var _documentSizeOrPopoverContentHeightHasChanged = function() {

		if (_documentWidth 				!= _popoverSnapshot.documentWidth 
		||  _documentHeight 			!= _popoverSnapshot.documentHeight
		||  _dom.popoverContent.offsetHeight != _popoverSnapshot.contentHeight) {
			return true;
		} 
		else {
			return false;
		}
	};		

	var _closePopover = function () {

		if (_popoverIsTransitioning || !_popoverIsShowing) {
			return;
		}

		_popoverIsTransitioning = true;

		_dom.invokingElement.focus();

		_dom.popover.classList.remove('modality-popover-active');
		_dom.popover.classList.add('modality-popover-closing');

		setTimeout(function () {
			_dom.popover.style.display = 'none';
			_popoverIsTransitioning = false;
			_PopoverContent.unload();
			_dom.popover.parentNode.removeChild(_dom.popover);
			_runCallback(_popoverAttributes.postCloseCallback);
		}, _popoverAttributes.fadeOutDuration);

	};

	var _getDocumentSize = function  () {

		_documentWidth   = window.innerWidth;
		_documentHeight  = window.innerHeight;

	};	

	var _runCallback = function (callback) {

		if (callback) {
			if (typeof callback == 'function') {
				callback();
			} 
			else {
				eval(callback);
			}
		}

	};		

	var _popoverIsShowing = function () {

		if (_dom.popover != undefined) {
			return _dom.popover.style.display !== 'none'
		} else {
			return false;
		}

	};

	var _closeOutside = function () {
		return _popoverAttributes.closeOutside;
	};

	var _isTransitioning = function () {
		return _popoverIsTransitioning;
	};

	var _setGenericEventListeners = function () {

		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || null;

		if (MutationObserver) {
			var observer = new MutationObserver(function(mutations, observer) {
				if (_popoverIsShowing) {
					_resize();
				}
			});

			observer.observe(_dom.popoverContent.firstChild, {
				subtree:    true,
				attributes: true
			});	
		}

	};	

	var _getContentElement = function () {
		return _dom.popover.querySelector('[modality-popover-content] > *');
	};

	// TODO - migrate utility functions...

	var _extend = function(defaultObject, customObject) {
		var returnObject = defaultObject;
		for (var key in customObject) {
			if (customObject[key]) {
				returnObject[key] = customObject[key];
			}
		}
		return returnObject;
	};

	return {
		componentName: 		'Popover',
		load: 				_loadPopover,
		close: 				_closePopover,
		closeOutside: 		_closeOutside,
		isTransitioning: 	_isTransitioning,
		resize: 			_resize,
		getContentElement: 	_getContentElement
	}

};
