Modality.Modal = function (config) {

	var _defaultModalAttributes = {
		height: 		 'auto',
		maxWidth: 		 800,
		fadeInDuration:  300,
		fadeOutDuration: 300,
		closeOutside:	 true,
		scaleSelector: 	 undefined
	};

	var _dom = {
		scaleContainer: null,
		invokingElement: config.invokingElement,
		modalScopeContainer: null,
		modal: null,
		modalContent: null
	}

	var _modalAttributes = {};

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
		_modalAttributes.height 			= _dom.invokingElement.getAttribute('modality-height');
		_modalAttributes.maxWidth 			= _dom.invokingElement.getAttribute('modality-max-width');
		_modalAttributes.fadeInDuration 	= _dom.invokingElement.getAttribute('modality-fade-in-duration');
		_modalAttributes.fadeOutDuration 	= _dom.invokingElement.getAttribute('modality-fade-out-duration');
		_modalAttributes.closeOutside		= _dom.invokingElement.getAttribute('modality-close-outside');
		_modalAttributes.preLoadCallback 	= _dom.invokingElement.getAttribute('modality-pre-load-callback');
		_modalAttributes.postCloseCallback 	= _dom.invokingElement.getAttribute('modality-post-close-callback');
		_modalAttributes.scaleSelector 		= _dom.invokingElement.getAttribute('modality-background-scale');

		// let's scrubbadubb dubb the values
		for (attribute in _modalAttributes) {

			var attributeValue = _modalAttributes[attribute];

			if (typeof attributeValue != 'function') {
				// if it's empty, set it to undefined for the proper extend object merging
				if (!attributeValue || !attributeValue.replace(/\s/g, '').length) {
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

		_modalAttributes = _extend(_defaultModalAttributes, _modalAttributes);

	};		

	var _getModalScopeContainer = function () {

		// reset from previous load
		_dom.modalScopeContainer = null;
		_dom.modalScopeContainer = document.querySelector('body > *');
		
	};

	var _injectModalTemplate = function () {

		_dom.modal = document.createElement('div');
		_dom.modal.className = 'modality-modal';

		_dom.modal.innerHTML = '<div class="modality-modal-obscure" modality-obscure onclick=""></div><div class="modality-modal-container"><div class="modality-modal-content" modality-modal-content tabindex="0"></div></div>';

		if (_modalAttributes.closeOutside) {
			_dom.modal.querySelector('[modality-obscure]').setAttribute('modality-close','');
		}

		_dom.modalScopeContainer.parentNode.appendChild(_dom.modal);

	};		

	var _setScopedSelectors = function () {
		_dom.scaleContainer	= document.querySelector(_modalAttributes.scaleSelector);
		_dom.modalContent = _dom.modal.querySelector('[modality-modal-content]');
	};

	var _loadModalContent = function () {

		_ModalContent = new Modality.Content({
			invokingElement: _dom.invokingElement,
			targetContainer: _dom.modalContent
		});

		_ModalContent.load();
	};

	var _broadcastPreLoadEvent = function () {
		var event = new CustomEvent('Modality.PreLoad', {bubbles: true, cancelable: true});
		_getContentElement().dispatchEvent(event);
	};

	var _broadcastPostLoadEvent = function () {
		var event = new CustomEvent('Modality.PostLoad', {bubbles: true, cancelable: true});
		_getContentElement().dispatchEvent(event);
	};		

	var _setDefaultModalDisplayProperties = function () {

		_dom.modal.style.display = '';

	};

	var _positionModalContent = function () {

		_dom.modalContentInner = _dom.modalContent.firstChild;

		if (!_dom.modalContentInner) { return; }

		var scrollTop = _dom.modalContentInner.scrollTop;

		var maxWidth = _modalAttributes.maxWidth;

		if (maxWidth > _paddedDocumentRegion.width) {
			maxWidth = _paddedDocumentRegion.width;
		}

		_dom.modalContentInner.style.height = 'auto';
		_dom.modalContent.style.height = _modalAttributes.height + 'px';
		_dom.modalContent.style.width = maxWidth + 'px';
		_dom.modalContent.style.maxWidth = maxWidth + 'px';
		_dom.modalContent.style.maxHeight = _paddedDocumentRegion.height + 'px';
		_dom.modalContent.style.marginLeft = -(_dom.modalContent.offsetWidth / 2) + 'px';
		_dom.modalContent.style.marginTop = -(_dom.modalContent.offsetHeight / 2) + 'px';

		_dom.modalContentInner.scrollTop = scrollTop;

	};	

	var _showModal = function () {

		setTimeout(function() {
			_modalIsTransitioning = false;
			if (_rootLevelComponent && _dom.scaleContainer) {
				_dom.scaleContainer.classList.add('modality-modal-background-blur');
			}
			_broadcastPostLoadEvent();
		}, _modalAttributes.fadeInDuration)

		_dom.modal.classList.add('modality-modal-active');
		_dom.modalContent.focus();

	};

	var _closeModal = function () {

		if (_modalIsTransitioning) {
			return;
		}

		_modalIsTransitioning = true;
		_dom.invokingElement.focus();

		if (_rootLevelComponent && _dom.scaleContainer) {
			_dom.scaleContainer.classList.remove('modality-modal-background-blur');
		}

		_dom.modal.classList.remove('modality-modal-active');

		setTimeout(function () {
			_dom.modal.style.display = 'none';
			_modalIsTransitioning = false;
			_ModalContent.unload();
			_dom.modal.parentNode.removeChild(_dom.modal);
			_runCallback(_modalAttributes.postCloseCallback);
		}, _modalAttributes.fadeOutDuration);

	};

	var _getDocumentSize = function  () {

		_documentWidth   = window.innerWidth;
		_documentHeight  = window.innerHeight;

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
		if (_dom.modal != undefined) {
			return _dom.modal.style.display !== 'none'
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
		_modalSnapshot.contentHeight 	= _dom.modalContent.offsetHeight;
	};

	var _documentSizeOrModalContentHasChanged = function() {
		if (_documentWidth 			!= _modalSnapshot.documentWidth 
		||  _documentHeight 		!= _modalSnapshot.documentHeight
		||  _dom.modalContent.offsetHeight != _modalSnapshot.contentHeight) {
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

			observer.observe(_dom.modalContent.firstChild, {
				subtree: true,
				attributes: true
			});
		}

	};

	var _getContentElement = function () {
		return _dom.modal.querySelector('[modality-modal-content] > *');
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
		componentName: 		'Modal',
		load: 				_loadModal,
		close: 				_closeModal,
		closeOutside: 		_closeOutside,
		isTransitioning: 	_isTransitioning,
		resize: 			_resize,
		getContentElement: 	_getContentElement
	}
	
};
