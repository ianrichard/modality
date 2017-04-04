/*  
	http://modality.me
	Component modality-popover.js
	Instantiable UI popover
	Created by ianrichard.com 2013-15
	MIT license
*/
Modality.Popover = function (config) {

	var _$invokingElement = $(config.invokingElement);

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

	var _$popoverScopeContainer,
		_$popover,
		_$popoverContainer,
		_$popoverContent,
		_$popoverCaret,
		_$popoverSourceContentParent;

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

		_popoverAttributes.width 					= _$invokingElement.attr('modality-width');

		_popoverAttributes.height 					= _$invokingElement.attr('modality-height');

		_popoverAttributes.minimumHeight 			= _$invokingElement.attr('modality-minimum-height');

		_popoverAttributes.fadeInDuration 			= _$invokingElement.attr('modality-fade-in-duration');

		_popoverAttributes.fadeOutDuration 			= _$invokingElement.attr('modality-fade-out-duration');

		_popoverAttributes.closeOutside				= _$invokingElement.attr('modality-close-outside');

		_popoverAttributes.popoverPosition			= _$invokingElement.attr('modality-position');

		_popoverAttributes.preLoadCallback 			= _$invokingElement.attr('modality-pre-load-callback');

		_popoverAttributes.postCloseCallback 		= _$invokingElement.attr('modality-post-close-callback');

		_popoverAttributes.offsetFromInvokingLink 	= _$invokingElement.attr('modality-link-offset') || String(Math.round(15 - _$invokingElement.outerHeight() * .25));

		// let's scrubbadubb dubb the values
		for (attribute in _popoverAttributes) {

			var attributeValue = _popoverAttributes[attribute];

			if (typeof attributeValue != 'function') {

				// if it's empty, set it to undefined for the proper extend object merging
				if (!attributeValue || $.trim(attributeValue) === '') {
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

		_popoverAttributes = $.extend({}, _defaultPopoverAttributes, _popoverAttributes);
					
	};

	var _getInvokingElementAttributes = function () {

		var scrollTop = 0;

		// if it's a root-level link and is able to scroll within the main document
		if (_$popoverScopeContainer.has(_$invokingElement)) {
			scrollTop = $(window).scrollTop();
		}		

		_invokingElementAttributes.top 				= _$invokingElement.offset().top - scrollTop;
		_invokingElementAttributes.bottom 			= _invokingElementAttributes.top + _$invokingElement.outerHeight();

		_invokingElementAttributes.left 			= _$invokingElement.offset().left;
		_invokingElementAttributes.right 			= _invokingElementAttributes.left + _$invokingElement.outerWidth();

		_invokingElementAttributes.width 			= _$invokingElement.outerWidth();
		_invokingElementAttributes.height 			= _$invokingElement.outerHeight();

		_invokingElementAttributes.horizontalCenter = _invokingElementAttributes.left + _invokingElementAttributes.width / 2;
		_invokingElementAttributes.verticalCenter 	= _invokingElementAttributes.top + _invokingElementAttributes.height / 2;

	};	

	var _getPopoverScopeContainer = function () {
		
		// reset from previous load
		_$popoverScopeContainer = null;

		_$popoverScopeContainer = $('body > *');
		
	};	

	var _injectPopoverTemplate = function () {
		
		_$popover = $('<div class="modality-popover"><div class="modality-popover-obscure" modality-obscure onclick=""></div><div class="modality-popover-container" modality-popover-container><div class="modality-popover-caret" modality-popover-caret></div><div class="modality-popover-content" modality-popover-content tabindex="0"></div></div></div>');

		if (_popoverAttributes.closeOutside) {
			_$popover.find('[modality-obscure]').attr('modality-close','');
		}

		_$popoverScopeContainer.parent().append(_$popover);

	};

	var _setScopedSelectors = function () {
		_$popoverContainer 	= _$popover.find('[modality-popover-container]');
		_$popoverContent 	= _$popover.find('[modality-popover-content]');
		_$popoverCaret		= _$popover.find('[modality-popover-caret]');
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

		var isVerticalPopover 	= $.inArray(_popoverAttributes.popoverPosition, ['vertical', 'top', 'bottom']) > -1;

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
			invokingElement: _$invokingElement[0],
			targetContainer: _$popoverContent[0],
			postLoadCallback: function () {
				_contentIsLoaded = true;
				_resize();
			},
			ajaxInjectDelay: _popoverAttributes.fadeInDuration
		});

		_PopoverContent.load();
	};

	var _broadcastPreLoadEvent = function () {
		$(_getContentElement()).trigger('Modality.PreLoad');
	};	

	var _broadcastPostLoadEvent = function () {
		$(_getContentElement()).trigger('Modality.PostLoad');
	};	

	var _setHiddenDefaultPopoverDisplayProperties = function () { 		
		_$popoverContent.css('height', _popoverAttributes.height);
		_$popover.show();
	};


	var _positionPopoverContent = function () {

		var $popoverContentInner = _$popoverContent.find('> *');

		var scrollTop = $popoverContentInner.scrollTop();

		$popoverContentInner.height('auto');

		var width, maxWidth, maxHeight, top, left;

		if (_bestRegionForThePopover.regionName == 'top') {

			width 		= _popoverAttributes.width;
			maxWidth  	= _bestRegionForThePopover.width;
			maxHeight 	=  _bestRegionForThePopover.height - _popoverAttributes.offsetFromInvokingLink;
			top 		= _bestRegionForThePopover.bottom  - _$popoverContent.outerHeight() - _popoverAttributes.offsetFromInvokingLink;

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
			left 		= _bestRegionForThePopover.right  - _$popoverContent.outerWidth() - _popoverAttributes.offsetFromInvokingLink;

		} 

		else if (_bestRegionForThePopover.regionName == 'right') {

			width 		= _popoverAttributes.width 		  - _popoverAttributes.offsetFromInvokingLink;
			maxWidth 	= _bestRegionForThePopover.width  - _popoverAttributes.offsetFromInvokingLink;
			maxHeight 	= _bestRegionForThePopover.height;
			left 		= _bestRegionForThePopover.left   + _popoverAttributes.offsetFromInvokingLink;

		}

		_$popoverContent.css('width', 	   width);
		_$popoverContent.css('max-width',  maxWidth);
		_$popoverContent.css('max-height', maxHeight);

		if (left) {
			_$popoverContainer.css('left', left);
			_setHorizontalPopoverY();
		} 
		else {
			_$popoverContainer.css('top',  top);
			_setVerticalPopoverX();			
		}

		$popoverContentInner.height(_$popoverContent.height());

		// check for out of bounds
		// this can happen on the parent resizing the document smaller cropping the bottom

		var popoverHeight = _$popoverContent.height();

		var popoverY 	  = Number(_$popoverContainer.css('top').split('px')[0]);

		var popoverBottom = popoverY + popoverHeight;

		// -1 is for minor measuring differences
		if (popoverBottom - 1 > _paddedDocumentRegion.bottom) {
			
			_$popoverContent.css('max-height', _paddedDocumentRegion.height);
			
			popoverHeight = _$popoverContainer.height();
			popoverBottom = popoverY + popoverHeight;

			var targetPopoverY = _paddedDocumentRegion.bottom - popoverHeight;
			_$popoverContainer.css('top', targetPopoverY);
			_showCaret = false;
		} 

		else {
			_showCaret = true;
		}

		$popoverContentInner.height('auto');
		$popoverContentInner.scrollTop(scrollTop);

	};

	var _setVerticalPopoverX = function () {

		var popoverContentWidth  = _$popoverContent.outerWidth();
		var popoverContentOffset = popoverContentWidth / 2;

		var popoverX =  _invokingElementAttributes.horizontalCenter - popoverContentOffset;

		if (popoverX < _bestRegionForThePopover.left) {
			popoverX = _bestRegionForThePopover.left;
		} 

		else if (popoverX + popoverContentWidth > _bestRegionForThePopover.right) {
			popoverX = _bestRegionForThePopover.right - popoverContentWidth;
		}

		_$popoverContainer.css('left', popoverX);

	};

	var _setHorizontalPopoverY = function () {

		var popoverContentHeight  = _$popoverContent.outerHeight();
		var popoverContentOffset  = popoverContentHeight / 2;

		var popoverY =  _invokingElementAttributes.verticalCenter - popoverContentOffset;

		if (popoverY < _bestRegionForThePopover.top) {
			popoverY = _bestRegionForThePopover.top;
		} 

		else if (popoverY + popoverContentHeight > _bestRegionForThePopover.bottom) {
			popoverY = _bestRegionForThePopover.bottom - popoverContentHeight;
		}

		_$popoverContainer.css('top', popoverY);

	};	

	var _setCaretPosition = function () {

		if (!_showCaret) {
			_$popoverCaret.attr('class', '');
			return;
		}

		// reset from prior positioning
		_$popoverCaret.attr('class', 'modality-popover-caret modality-popover-caret-' + _bestRegionForThePopover.regionName);
		_$popoverCaret.css('top', '');
		_$popoverCaret.css('left', '');

		if (_bestRegionForThePopover.regionName == 'top' || _bestRegionForThePopover.regionName == 'bottom') {

			var targetCaretX = _invokingElementAttributes.horizontalCenter - _$popoverContainer.position().left;

			_$popoverCaret.css('left', targetCaretX);

		} 

		else if (_bestRegionForThePopover.regionName == 'left' || _bestRegionForThePopover.regionName == 'right') {

			var targetCaretY = _invokingElementAttributes.verticalCenter - _$popoverContainer.position().top;

			_$popoverCaret.css('top', targetCaretY);

		}

	};

	var _showPopover = function () {

		_$popoverContent.css('height', _popoverAttributes.height);

		setTimeout(function () {
			_clearTransitioningFlag();
			_broadcastPostLoadEvent();			
		}, _popoverAttributes.fadeInDuration);

		_$popover.addClass('modality-popover-active');

		_$popoverContent.focus();

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
		_popoverSnapshot.contentHeight 	= _$popoverContent.height();
	};

	var _documentSizeOrPopoverContentHeightHasChanged = function() {

		if (_documentWidth 				!= _popoverSnapshot.documentWidth 
		||  _documentHeight 			!= _popoverSnapshot.documentHeight
		||  _$popoverContent.height()	!= _popoverSnapshot.contentHeight) {
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

		_$invokingElement.focus();

		// anything that has a component-close attribute in the popover
		// gets that attribute removed so someone doesn't double click close
		// this is especially useful for multiple layers and clicking quickly
		// out of them
		_$popover.find('[component-close]').removeAttr('component-close');

		_$popover.removeClass('modality-popover-active');
		_$popover.addClass('modality-popover-closing');
		
		setTimeout(function () {
			_$popover.hide();
			_popoverIsTransitioning = false;
			_PopoverContent.unload();
			_$popover.remove();
			_runCallback(_popoverAttributes.postCloseCallback);
		}, _popoverAttributes.fadeOutDuration);

	};

	var _getDocumentSize = function  () {

		_documentWidth   = $(window).width();
		_documentHeight  = $(window).height();

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

		if (_$popover != undefined) {
			return _$popover.is(':visible');
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

			observer.observe(_$popoverContent.find('> *')[0], {
				subtree:    true,
				attributes: true
			});	
		} 
		// For browsers that don't support mutation observers	
		else {
			_$popoverContent.bind('click', function (e) {
				_resize();
			});

			_$popoverContent.keyup(function(e) {

				// when switching between focusable elements
				if (_lastFocusedInnerElement !== e.target) {
					_resize();
				}

				_lastFocusedInnerElement = e.target;

				//enter
				if (e.keyCode == 13) {
					_resize();
				}
			});
		}

	};	

	var _getContentElement = function () {
		return _$popover.find('[modality-popover-content] > *')[0];
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
