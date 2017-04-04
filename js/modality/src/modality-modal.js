/*  
	http://modality.me
	Component modality-modal.js
	Instantiable UI modal
	Created by ianrichard.com 2013-15
	MIT license
*/
Modality.Modal = function (config) {

	var _$invokingElement 	= $(config.invokingElement);

	var _defaultModalAttributes = {
		width: 			 '90%',
		height: 		 'auto',
		maxWidth: 		 800,
		fadeInDuration:  300,
		fadeOutDuration: 300,
		closeOutside:	 true,
		scaleSelector: 	 undefined
	};

	var _modalAttributes = {};

	var _$scaleContainer, 
		_$invokingElement,
		_$modalScopeContainer,
		_$modal, 
		_$modalContent;

	var _modalIsTransitioning = false;

	var _documentWidth,
		_documentHeight;	

	var _documentPadding = .03;

	var _paddedDocumentRegion;

	var _rootLevelComponent = false;

	if (config.componentIndex == 1) {
		_rootLevelComponent = true;
	}
	
	var _ModalContent;

	var _lastFocusedInnerElement;

	var _modalSnapshot = {};

	var _loadModal = function () {

		_checkAndSetTransitioningFlag();

		_getModalAttributes();

		_runCallback(_modalAttributes.preLoadCallback);

		_getModalScopeContainer();

		_injectModalTemplate();

		_setScopedSelectors();

		_getDocumentSize();

		_getPaddedDocumentRegion();
		
		_loadModalContent();

		_broadcastPreLoadEvent();

		_setDefaultModalDisplayProperties();

		_positionModalContent();

		_showModal();

		_setGenericEventListeners();

		_setModalSnapshot();

	};

	var _checkAndSetTransitioningFlag = function () {
		if (_modalIsTransitioning) {
			return;
		}

		_modalIsTransitioning = true;
	};	

	var _getModalAttributes = function () {
		
		_modalAttributes = {};
		
		_modalAttributes.width 				= _$invokingElement.attr('modality-width');

		_modalAttributes.height 			= _$invokingElement.attr('modality-height');

		_modalAttributes.maxWidth 			= _$invokingElement.attr('modality-max-width');												

		_modalAttributes.fadeInDuration 	= _$invokingElement.attr('modality-fade-in-duration');

		_modalAttributes.fadeOutDuration 	= _$invokingElement.attr('modality-fade-out-duration');

		_modalAttributes.closeOutside		= _$invokingElement.attr('modality-close-outside');

		_modalAttributes.preLoadCallback 	= _$invokingElement.attr('modality-pre-load-callback');

		_modalAttributes.postCloseCallback 	= _$invokingElement.attr('modality-post-close-callback');

		_modalAttributes.scaleSelector 		= _$invokingElement.attr('modality-background-scale');

		// let's scrubbadubb dubb the values
		for (attribute in _modalAttributes) {

			var attributeValue = _modalAttributes[attribute];

			if (typeof attributeValue != 'function') {
				// if it's empty, set it to undefined for the proper extend object merging

				if (!attributeValue || $.trim(attributeValue) === '') {
					attributeValue = undefined;
				}
				
				// or if it's a number, type cast it
				// width and height have acceptable px or % inputs
				else if (attribute != 'width' && attribute != 'height' && attributeValue.match(/\d+/g)) {
					attributeValue = Number(attributeValue);
				}

			}

			_modalAttributes[attribute] = attributeValue;

		};		

		if (_modalAttributes.closeOutside == 'false') {
			_modalAttributes.closeOutside = false;
		}

		_modalAttributes = $.extend({}, _defaultModalAttributes, _modalAttributes);
					
	};		

	var _getModalScopeContainer = function () {
		
		// reset from previous load
		_$modalScopeContainer = null;
		_$modalScopeContainer = $('body > *');
		
	};

	var _injectModalTemplate = function () {

		_$modal = $('<div class="modality-modal"><div class="modality-modal-obscure" modality-obscure onclick=""></div><div class="modality-modal-container"><div class="modality-modal-content" modality-modal-content tabindex="0"></div></div></div>');

		if (_modalAttributes.closeOutside) {
			_$modal.find('[modality-obscure]').attr('modality-close','');
		}

		_$modalScopeContainer.parent().append(_$modal);


	};		

	var _setScopedSelectors = function () {

		_$scaleContainer	= $(_modalAttributes.scaleSelector);

		_$modalContent 		= _$modal.find('[modality-modal-content]');

	};	

	var _loadModalContent = function () {

		_ModalContent = new Modality.Content({
			invokingElement: _$invokingElement[0],
			targetContainer: _$modalContent[0]
		});

		_ModalContent.load();
	};

	var _broadcastPreLoadEvent = function () {
		$(_getContentElement()).trigger('Modality.PreLoad');
	};

	var _broadcastPostLoadEvent = function () {
		$(_getContentElement()).trigger('Modality.PostLoad');
	};		

	var _setDefaultModalDisplayProperties = function () {
						
		//_$modalContent.css('opacity', 0);

		_$modal.show();

	};

	var _positionModalContent = function () {

		$modalContentInner = _$modalContent.find('> *');
		
		var scrollTop = $modalContentInner.scrollTop();

		var maxWidth = _modalAttributes.maxWidth;

		if (maxWidth > _paddedDocumentRegion.width) {
			maxWidth = _paddedDocumentRegion.width;
		}

		$modalContentInner.height('auto');
		_$modalContent.css('width', 		_modalAttributes.width);
		_$modalContent.css('height', 		_modalAttributes.height);
		_$modalContent.css('max-width', 	 maxWidth);
		_$modalContent.css('max-height', 	_paddedDocumentRegion.height);

		_$modalContent.css('margin-left', -(_$modalContent.outerWidth()  / 2));
		_$modalContent.css('margin-top',  -(_$modalContent.outerHeight() / 2));
		//$modalContentInner.height(_$modalContent.height());

		$modalContentInner.scrollTop(scrollTop);

	};	

	var _showModal = function () {

		setTimeout(function() {
			_modalIsTransitioning = false;
			if (_rootLevelComponent) {
				_$scaleContainer.addClass('modality-modal-background-blur');
			}
			_broadcastPostLoadEvent();
		}, _modalAttributes.fadeInDuration)

		_$modal.addClass('modality-modal-active');
		_$modalContent.focus();

	};
	
	var _closeModal = function () {

		if (_modalIsTransitioning) {
			return;
		}

		_modalIsTransitioning = true;

		_$invokingElement.focus();		

		_$modal.find('[component-close]').removeAttr('component-close');
		
		if (_rootLevelComponent) {
			_$scaleContainer.removeClass('modality-modal-background-blur');
		}
		
		_$modal.removeClass('modality-modal-active');

		setTimeout(function () {
			_$modal.hide();
			_modalIsTransitioning = false;
			_ModalContent.unload();
			_$modal.remove();
			_runCallback(_modalAttributes.postCloseCallback);
		}, _modalAttributes.fadeOutDuration);

	};

	var _getDocumentSize = function  () {

		_documentWidth = $(window).width();
		_documentHeight = $(window).height();

	};

	var _getPaddedDocumentRegion = function () {

		_paddedDocumentRegion 			= {};

		_paddedDocumentRegion.top 		= _documentHeight * _documentPadding;
		_paddedDocumentRegion.bottom 	= _documentHeight - _paddedDocumentRegion.top;

		_paddedDocumentRegion.left 		= _documentWidth  * _documentPadding;
		_paddedDocumentRegion.right 	= _documentWidth  - _paddedDocumentRegion.left;

		_paddedDocumentRegion.width 	= _documentWidth  - 2 * _paddedDocumentRegion.left;
		_paddedDocumentRegion.height 	= _documentHeight - 2 * _paddedDocumentRegion.top;

	};	

	var _runCallback = function (callback) {

		if (callback) {
			if (typeof callback == 'function') {
				callback();
			} else {
				eval(callback);
			}
		}

	};	

	var _modalIsShowing = function () {
		if (_$modal != undefined) {
			return _$modal.is(':visible');
		} else {
			return false;
		}
	};

	var _closeOutside = function () {
		return _modalAttributes.closeOutside;
	};

	var _isTransitioning = function () {
		return _modalIsTransitioning;
	};

	var _resize = function () {
		// if the last document width was the same
		// and the last document height was the same
		// and the content is the same		
		_getDocumentSize();

		if (_documentSizeOrModalContentHasChanged()) {
			_getPaddedDocumentRegion();
			_positionModalContent();
			_setModalSnapshot();
		}

	};

	// there are some generic events calling resize
	// we want to make sure something has actually changed
	// generic events such as click can cause the scroll to be reset
	// because things are being re-measured
	var _setModalSnapshot = function () {
		_modalSnapshot.documentWidth 	= _documentWidth;
		_modalSnapshot.documentHeight 	= _documentHeight;
		_modalSnapshot.contentHeight 	= _$modalContent.height();
	};

	var _documentSizeOrModalContentHasChanged = function() {
		if (_documentWidth 			!= _modalSnapshot.documentWidth 
		||  _documentHeight 		!= _modalSnapshot.documentHeight
		||  _$modalContent.height() != _modalSnapshot.contentHeight) {
			_setModalSnapshot();
			return true;
		} else {
			return false;
		}
	};

	var _setGenericEventListeners = function () {

		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || null;

		if (MutationObserver) {

			var observer = new MutationObserver(function(mutations, observer) {
				if (_modalIsShowing) {
					_resize();				
				}
			});

			observer.observe(_$modalContent.find('> *')[0], {
				subtree: true,
				attributes: true
			});	
		}

		// for browsers that don't support mutation observers
		else {
			_$modalContent.bind('click', function (e) {
				_resize();
			});

			_$modalContent.keyup(function(e) {

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
		return _$modal.find('[modality-modal-content] > *')[0];
	};			
		
	return {
		componentName: 		'Modal',
		load: 				_loadModal,
		close: 				_closeModal,
		closeOutside: 		_closeOutside,
		isTransitioning: 	_isTransitioning,
		resize: 			_resize,
		getContentElement: 	_getContentElement
	}
	
};
