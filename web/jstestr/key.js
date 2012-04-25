
define([
    "./queue",
    "./event"
], function (queue) {

    var global = window;
    
    queue.prototype._controlRegExp = /\[[a-zA-Z]+\]/g;
    
    queue.prototype.hooks.beforeType = function beforeType() {};
    
    queue.prototype.type = function type(string, element, handler, options) {
        this.then(function _typeTask(testr) {
            options = options || {};
            
            var keyDelay = options.keyDelay || 5;
            
            testr._normalizeElement(element, function (element) {
                
                testr.hooks.beforeType.call(testr, string, element, options);
                
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
    
    
    queue.prototype._typeChar = function _typeChar(character, element, options) {
        this._keyDown(character, element, options);
        if (this._isPrintingCharacter(character) && this.browser.needsSyntheticTextInput) {
            this._keyPress(character, element, options);
            if (this._isTextInputElement(element)) {
                this._textInput(character, element, options);
            }
        }
        this._keyUp(character, element, options);
    };
    
    
    queue.prototype.defaultActions.keydown = function keyDownDefaultActions() {};
    queue.prototype._keyDown = function _keyDown(character, element, options) {
        var event = this._createKeyEvent("keydown", character, element, options);
        this._dispatchEvent(event, element, options);
    };
    
    queue.prototype.defaultActions.keypress = function keyPressDefaultAction(event) {
        event.target.value += String.fromCharCode(event.charCode);
    };
    queue.prototype._keyPress = function _keyPress(character, element, options) {
        var event = this._createKeyEvent("keypress", character, element, options);
        this._dispatchEvent(event, element, options);
    };
    
    queue.prototype.defaultActions.textInput = function textInputDefaultActions() {};
    queue.prototype._textInput = function _textInput(character, element, options) {
        var event = this._createTextEvent("textInput", character, element, options);
        this._dispatchEvent(event, element, options);
    };
    
    queue.prototype.defaultActions.keyup = function keyUpDefaultActions() {};
    queue.prototype._keyUp = function _keyUp(character, element, options) {
        var event = this._createKeyEvent("keyup", character, element, options);
        this._dispatchEvent(event, element, options);
    };
    
    
    queue.prototype.eventDefaults.key = {
        canBubble: true,
        cancelable: true,
        view: global,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false
    };
    
    queue.prototype._createKeyEvent = function _createKeyEvent(type, character, element, options) {
        var defaults = this.eventDefaults[type] || this.eventDefaults.key;
        
        var keyCode = this._lookupKeyCode(type, character);
        var charCode = this._lookupCharCode(type, character);
        var keyIdentifier = this._lookupKeyIdentifier(type, character);
        var keyLocation = this._lookupKeyLocation(type, character);
        
        var event;
        if (this.browser.supportsKeyEvents) {
            event = element.ownerDocument.createEvent("KeyEvent");
            var method = "initKeyEvent" in event ? "initKeyEvent" : "initKeyboardEvent";
            event.initKeyEvent(
                type,
                "canBubble" in options ? options.canBubble : defaults.canBubble,
                "cancelable" in options ? options.cancelable : defaults.cancelable,
                "view" in options ? options.view : defaults.view,
                "ctrlKey" in options ? options.ctrlKey : defaults.ctrlKey,
                "altKey" in options ? options.altKey : defaults.altKey,
                "shiftKey" in options ? options.shiftKey : defaults.shiftKey,
                "metaKey" in options ? options.metaKey : defaults.metaKey,
                "keyCode" in options ? options.keyCode : keyCode,
                "charCode" in options ? options.charCode : charCode
                );
                
        } else if (this.browser.supportsKeyboardEvents) {
            var modifiers = [];
            if (options.ctrlKey) {
                modifiers.push("Control");
            }
            if (options.altKey) {
                modifiers.push("Alt");
            }
            if (options.shiftKey) {
                modifiers.push("Shift");
            }
            if (options.metaKey) {
                modifiers.push("Meta");
            }
            if (options.ctrlKey && options.altKey) {
                modifiers.push("AltGraph");
            }
            
            event = element.ownerDocument.createEvent("KeyboardEvent");
            event.initKeyboardEvent(
                type,
                "canBubble" in options ? options.canBubble : defaults.canBubble,
                "cancelable" in options ? options.cancelable : defaults.cancelable,
                "view" in options ? options.view : defaults.view,
                "keyCode" in options ? options.keyCode : keyCode,
                "keyLocation" in options ? options.keyLocation : keyLocation,
                modifiers.join(" "),
                1,
                ""
                );
                
        } else {
            event = this._createEvent(type, element, options, defaults);
            
            event.view = "view" in options ? options.view : defaults.view;
            event.keyCode = "keyCode" in options ? options.keyCode : keyCode;
            event.charCode = "charCode" in options ? options.charCode : charCode;
        }
        
        event.keyIdentifier = "keyIdentifier" in options ? options.keyIdentifier : keyIdentifier;
        event.keyLocation = "keyLocation" in options ? options.keyLocation : keyLocation;
        
        return event;
    };


    queue.prototype._textDefaults = {
        canBubble: true,
        cancelable: true,
        view: global
    };

    queue.prototype._createTextEvent = function _createTextEvent(type, data, element, options) {
        var defaults = this.eventDefaults[type] || this.eventDefaults.key;
        
        var event;
        if (this.browser.supportsTextEvents) {
            event = element.ownerDocument.createEvent("TextEvent");
            event.initTextEvent(
                type,
                "canBubble" in options ? options.canBubble : defaults.canBubble,
                "cancelable" in options ? options.cancelable : defaults.cancelable,
                "view" in options ? options.view : defaults.view,
                data,
                "", // input method
                "" // locale
                );

        } else {
            event = this._createEvent(type, element, options, defaults);

            event.view = options.view || defaults.view;
            event.data = data;
        }
        return event;
    };
    
    
    queue.prototype._keyMap = {
        "[backspace]": {keyCode: 8},
        "[escape]": {keyCode: 27},
        "\n": {identifier: "Enter"},
        "[left]": {identifier: "Left", keyCode: 37},
        "[up]": {identifier: "Up", keyCode: 38},
        "[right]": {identifier: "Right", keyCode: 39},
        "[down]": {identifier: "Down", keyCode: 40},
        "[pageup]": {identifier: "PageUp", keyCode: 38},
        "[pagedown]": {identifier: "PageDown", keyCode: 40}
    },
    
    queue.prototype._lookupKeyIdentifier = function _lookupKeyIdentifier(character) {
        if (character in this._keyMap && "identifier" in this._keyMap[character]) {
            return this._keyMap[character].identifier;
        } else if (character in this._keyMap && "keyCode" in this._keyMap[character]) {
            return "U+" + "";
        } else {
            return "U+" + character.charCodeAt(0);
        }
    };
    
    queue.prototype._lookupKeyLocation = function _lookupKeyLocation(character) {
        return 0;
    };
    
    queue.prototype._lookupKeyCode = function _lookupKeyCode(eventType, character) {
        if (eventType === "keydown") {
            character = character.toUpperCase();
        }
        if (character in this._keyMap && "keyCode" in this._keyMap[character]) {
            return this._keyMap[character].keyCode;
        } else {
            return character.charCodeAt(0);
        }
    };
    
    queue.prototype._lookupCharCode = function _lookupCharCode(eventType, character) {
        if (eventType === "keydown") {
            return 0;
        }
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
    
    (function () {
        var event;
        
        // feature test for key events
        try {
            event = document.createEvent("KeyEvent");
            if ("initKeyEvent" in event) {
                queue.prototype.browser.supportsKeyEvents = true;
            }
        } catch (e) {
            queue.prototype.browser.supportsKeyEvents = false;
        }
        
        // feature test for keyboard events
        try {
            event = document.createEvent("KeyboardEvent");
            if ("initKeyboardEvent" in event) {
                queue.prototype.browser.supportsKeyboardEvents = true;
            }
        } catch (e) {
            queue.prototype.browser.supportsKeyboardEvents = false;
        }

        // feature test for text events
        try {
            event = document.createEvent("TextEvent");
            if ("initTextEvent" in event) {
                queue.prototype.browser.supportsTextEvents = true;
            }
        } catch (e) {
            queue.prototype.browser.supportsTextEvents = false;
        }
        
        queue.prototype.browser.needsSyntheticTextInput = true;
        
        /*
            keypressSubmits : false,
            keyCharacters : false,
            backspaceWorks : false,
            keysOnNotFocused : false,
            textareaCarriage : false,
            keypressOnAnchorClicks : false
         */
    }());
    
    return queue;
});