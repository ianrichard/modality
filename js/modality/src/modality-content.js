/*  
	http://modality.me
	Utility modality-content.js
	Gets content from the DOM or Ajax
	Created by ianrichard.com 2013-15
	MIT license
*/
Modality.Content = function (config) {

	var _$invokingElement = $(config.invokingElement); // required
	var _$targetContainer = $(config.targetContainer); // required
	var _$sourceContent,   _$sourceContentParentContainer;

	// sets a minimum timeout so the processing for ajax doesn't look glitchy
	config.ajaxInjectDelay = config.ajaxInjectDelay || 300;

	var _contentAttributes = {};

	var _getContentAttributes = function () {

		_contentAttributes.contentReference = _$invokingElement.attr('href');

		if (_contentAttributes.contentReference.charAt(0) != '#' && 
			_contentAttributes.contentReference.charAt(0) != '.' && 
			_contentAttributes.contentReference.charAt(0) != '[') {
			_contentAttributes.contentType = 'ajax';
		}

		else {
			_contentAttributes.contentType = 'dom';
		}

		if ($(this).is('[modality-content-copy]') || _contentAttributes.contentType == 'ajax') {
			_contentAttributes.contentSourceAction = 'copy';
		}

		else {
			_contentAttributes.contentSourceAction = 'move';
		}
					
	};

	var _load = function () {

		_getContentAttributes();

		if (_contentAttributes.contentType == 'dom') {

			_$sourceContent = $(_contentAttributes.contentReference);

			if (_contentAttributes.contentSourceAction == 'copy') {

				_$sourceContent = _$sourceContent.clone();

				_$sourceContent.attr('id', null);

			}

			else if (_contentAttributes.contentSourceAction == 'move') {				

				_$sourceContentParentContainer = _$sourceContent.parent();

				_$sourceContent = _$sourceContent.detach();

			}

			_$targetContainer.append(_$sourceContent);

			_runCallback(config.postLoadCallback);

		} 

		else if (_contentAttributes.contentType == 'ajax') {			

			var $interstitial = $('<div class="modality-interstitial" />');

			_$targetContainer.append($interstitial);
			
			$.ajax(_contentAttributes.contentReference)
			 .done(function (data) {
			 	setTimeout(function() {
				 	$interstitial.remove();
					_$sourceContent = $(data);				
					_$targetContainer.append(_$sourceContent);
					_runCallback(config.postLoadCallback);	
			 	}, config.ajaxInjectDelay);

			 })
			 .fail(function () {
			 	setTimeout(function() {
				 	$interstitial.remove();
				 	_$sourceContent = $('<h1>Well this is embarassing... The content didn\'t load</h1>');
				 	_$targetContainer.append(_$sourceContent);
				 	_runCallback(config.postLoadCallback);
			 	}, config.ajaxInjectDelay);
			 });

		} 

		else {
			console.log('Invalid modality setup');
		}

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

	var _unload = function () {

		if (_contentAttributes.contentSourceAction == 'move') {

			_$sourceContent = _$sourceContent.detach();

			_$sourceContentParentContainer.append(_$sourceContent);

		} 

		else {			
			_$sourceContent.remove();
			_$sourceContent.unbind();
		}

	};

	return {
		load: 	_load,
		unload: _unload
	}

};

