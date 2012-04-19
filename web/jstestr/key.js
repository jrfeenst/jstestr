
define([
    "./queue"
], function (queue) {

    var global = window;
    
    queue.prototype._controlRegExp = /\[[a-zA-Z]+\]/g;
    queue.prototype._beforeType = function _beforeType() {};
    
    queue.prototype.type = function type(string, element, handler, options) {
        this.then(function _typeTask(testr) {
            options = options || {};
            
            var keyDelay = options.keyDelay || 5;
            
            testr._normalizeElement(element, function (element) {
                
                testr._beforeType(string, element, options);
                
                var keyPressHandler = function (character) {
                    return function _keyPressHandler() {
                        testr._typeChar(character, element, options);
                    };
                };

                var strings = string.split(testr._controlRegExp);
                var controls = string.match(testr._controlRegExp);

                var numControls = controls ? controls.length : 0;

                for (var i = 0; i < strings.length; i++) {
                    var subString = strings[i];
                    var stringLen = subString.length;
                    
                    for (var j = 0; j < stringLen; j++) {
                        testr.delay(keyDelay, keyPressHandler(subString.charAt(j)));
                    }

                    if (i < numControls) {
                        testr.delay(keyDelay, keyPressHandler(controls[i]));
                    }

                }
                
                testr.then(testr._wrapHandler(handler));
                testr.start();
                
            }, options);
        });
    };
    
    
    queue.prototype._needsSyntheticTextInput = true;
    queue.prototype._typeChar = function _typeChar(character, element, options) {
        this._keyDown(character, element, options);
        if (this._isPrintingCharacter(character) && this._needsSyntheticTextInput) {
            this._keyPress(character, element, options);
            if (this._isTextInputElement(element)) {
                this._textInput(character, element, options);
            }
        }
        this._keyUp(character, element, options);
    };
    
    queue.prototype._keyDownDefaultAction = function () {};
    queue.prototype._keyDown = function _keyDown(character, element, options) {
        var event = this._createKeyEvent("keydown", character, element, options);
        this._dispatchEvent(event, element, this._keyDownDefaultAction, options);
    };
    
    queue.prototype._keyPressDefaultAction = function _keyPressDefaultAction(event) {
        event.target.value += String.fromCharCode(event.charCode);
    };
    queue.prototype._keyPress = function _keyPress(character, element, options) {
        var event = this._createKeyEvent("keypress", character, element, options);
        this._dispatchEvent(event, element, this._keyPressDefaultAction, options);
    };
    
    queue.prototype._textInput = function _textInput(character, element, options) {
        var event = this._createTextEvent("textInput", character, element, options);
        this._dispatchEvent(event, element, null, options);
    };
    
    queue.prototype._keyUp = function _keyUp(character, element, options) {
        var event = this._createKeyEvent("keyup", character, element, options);
        this._dispatchEvent(event, element, null, options);
    };
    
    
    queue.prototype._keyDefaults = {
        canBubble: true,
        cancelable: true,
        view: global,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false
    };
    
    queue.prototype._supportsKeyEvents = true;
    queue.prototype._createKeyEvent = function _createKeyEvent(type, character, element, options) {
        var keyCode = this._lookupKeyCode(character);
        var charCode = this._lookupCharCode(character);

        var event;
        try {
            if (this._supportsKeyEvents) {
                event = element.ownerDocument.createEvent("KeyEvent");
                var method = "initKeyEvent" in event ? "initKeyEvent" : "initKeyboardEvent";
                event[method](
                    type,
                    "canBubble" in options ? options.canBubble : this._keyDefaults.canBubble,
                    "cancelable" in options ? options.cancelable : this._keyDefaults.cancelable,
                    "view" in options ? options.view : this._keyDefaults.view,
                    "ctrlKey" in options ? options.ctrlKey : this._keyDefaults.ctrlKey,
                    "altKey" in options ? options.altKey : this._keyDefaults.altKey,
                    "shiftKey" in options ? options.shiftKey : this._keyDefaults.shiftKey,
                    "metaKey" in options ? options.metaKey : this._keyDefaults.metaKey,
                    "keyCode" in options ? options.keyCode : keyCode,
                    "charCode" in options ? options.charCode : charCode
                );
            }

        } catch (e) {
            this._supportsKeyEvents = false;
        }
        
        if (!this._supportsKeyEvent) {
            event = this._createEvent(type, element, options, this._keyDefaults);
            
            var keyIdentifier = this._lookupKeyIdentifier(character);
            var keyLocation = this._lookupKeyLocation(character);
            
            event.view = "view" in options ? options.view : this._keyDefaults.view;
            event.keyIdentifier = "keyIdentifier" in options ? options.keyIdentifier : keyIdentifier;
            event.keyLocation = "keyLocation" in options ? options.keyLocation : keyLocation;
            event.keyCode = "keyCode" in options ? options.keyCode : keyCode;
            event.charCode = "charCode" in options ? options.charCode : charCode;
        }
        
        return event;
    };


    queue.prototype._textDefaults = {
        canBubble: true,
        cancelable: true,
        view: global
    };

    queue.prototype._supportsTextEvents = true;
    
    queue.prototype._createTextEvent = function _createTextEvent(type, data, element, options) {
        var event;
        try {
            if (this._supportsTextEvents) {
                event = element.ownerDocument.createEvent("TextEvent");
                if ("initTextEvent" in event) {
                    event.initTextEvent(
                        type,
                        "canBubble" in options ? options.canBubble : this._keyDefaults.canBubble,
                        "cancelable" in options ? options.cancelable : this._keyDefaults.cancelable,
                        "view" in options ? options.view : this._keyDefaults.view,
                        data,
                        "", // input method
                        "" // locale
                        );
                } else {
                    this._supportsTextEvents = false;
                }
            }
        } catch (e) {
            this._supportsTextEvents = false;
        }
        
        if (!this._supportsTextEvents) {
            event = this._createEvent(type, element, options, this._keyDefaults);

            event.view = options.view || this._keyDefaults.view;
            event.data = data;
        }
        return event;
    };
    
    
    queue.prototype._keyMap = {
        "[escape]": {identifier: "U+001B", keyCode: 27},
        "[enter]": {identifier: "Enter", keyCode: 13},
        "[tab]": {identifier: "U+0009", keyCode: 9},
        "[up]": {identifier: "Up", keyCode: 38},
        "[down]": {identifier: "Down", keyCode: 40}
    },
    
    queue.prototype._lookupKeyIdentifier = function _lookupKeyIdentifier(character) {
        if (this._keyMap.hasOwnProperty(character)) {
            return this._keyMap[character].identifier || "";
        }
        return "";
    };
    
    queue.prototype._lookupKeyLocation = function _lookupKeyLocation(character) {
        return 0;
    };
    
    queue.prototype._lookupKeyCode = function _lookupKeyCode(character) {
        if (this._keyMap.hasOwnProperty(character)) {
            return this._keyMap[character].keyCode || 0;
        }
        return 0;
    };
    
    queue.prototype._lookupCharCode = function _lookupCharCode(character) {
        if (character.length === 1) {
            return character.charCodeAt(0);
        } else {
            return this._keyMap[character].charCode || 0;
        }
    };
    
    
    queue.prototype._isPrintingCharacter = function _isPrintingCharacter(character) {
        return character.length === 1;
    };
    
    queue.prototype._isTextInputElement = function _isTextInputElement(element) {
        var tag = element.tagName.toLowerCase();
        var type = element.type;
        if (type && type.toLowerCase) {
            type = type.toLowerCase();
        }
        return tag === "textarea" || (tag === "input" && (type === "text" || type === "password"));
    };
    

});