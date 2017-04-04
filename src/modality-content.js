Modality.Content = function (config) {

	var _dom = {
		invokingElement: config.invokingElement, // required
		targetContainer: config.targetContainer, // required
		sourceContent: null,
		sourceContentParentContainer: null,
		interstitial: null
	}

	// sets a minimum timeout so the processing for ajax doesn't look glitchy
	config.ajaxInjectDelay = config.ajaxInjectDelay || 300;

	var _contentAttributes = {};

	var _getContentAttributes = function () {

		_contentAttributes.contentReference = _dom.invokingElement.getAttribute('href') || _dom.invokingElement.getAttribute('modality-content');

		if (_contentAttributes.contentReference.charAt(0) != '#' && 
			_contentAttributes.contentReference.charAt(0) != '.' && 
			_contentAttributes.contentReference.charAt(0) != '[') {
			_contentAttributes.contentType = 'ajax';
		}

		else {
			_contentAttributes.contentType = 'dom';
		}

		if (_dom.invokingElement.hasAttribute('modality-content-copy') || _contentAttributes.contentType == 'ajax') {
			_contentAttributes.contentSourceAction = 'copy';
		}

		else {
			_contentAttributes.contentSourceAction = 'move';
		}
					
	};

	var _load = function () {

		_getContentAttributes();

		if (_contentAttributes.contentType == 'dom') {

			_dom.sourceContent = document.querySelector(_contentAttributes.contentReference);

			if (_contentAttributes.contentSourceAction == 'copy') {
				_dom.sourceContent = _dom.sourceContent.cloneNode(true);
				_dom.sourceContent.setAttribute('id', '');
			}

			else if (_contentAttributes.contentSourceAction == 'move') {
				_dom.sourceContentParentContainer = _dom.sourceContent.parentNode;
			}

			_dom.targetContainer.appendChild(_dom.sourceContent);

			_runCallback(config.postLoadCallback);

		} 

		else if (_contentAttributes.contentType == 'ajax') {			

			_dom.interstitial = document.createElement('div');
			_dom.interstitial.className = 'modality-interstitial';

			_dom.targetContainer.appendChild(_dom.interstitial);

			var request = new XMLHttpRequest();
			request.open('GET', _contentAttributes.contentReference, true);

			request.onload = function() {
				if (request.status >= 200 && request.status < 400) {
					var response = request.responseText;
					setTimeout(function() {
						_dom.interstitial.parentNode.removeChild(_dom.interstitial);
						_dom.targetContainer.innerHTML = response;
						_runCallback(config.postLoadCallback);
					}, config.ajaxInjectDelay);
				} else {
					_handleAjaxFailure();
				}
			};

			request.onerror = function() {
				_handleAjaxFailure();
			};

			request.send();

		}

		else {
			console.log('Invalid modality setup');
		}

	};

	var _handleAjaxFailure = function() {
		setTimeout(function() {
			_dom.interstitial.parentNode.removeChild(_dom.interstitial);
			_dom.targetContainer.innerHTML = '<h1>Well this is embarassing... The content didn\'t load</h1>';
			_runCallback(config.postLoadCallback);
		}, config.ajaxInjectDelay);
	}

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

	var _unload = function () {

		if (_contentAttributes.contentSourceAction == 'move') {
			_dom.sourceContentParentContainer.appendChild(_dom.sourceContent);
		}

		else {
			_dom.sourceContent.parentNode.removeChild(_dom.sourceContent);
		}

	};

	return {
		load: 	_load,
		unload: _unload
	}

};

