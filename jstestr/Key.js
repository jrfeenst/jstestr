
define([
    "./browser",
    "./Queue",
    "./Dom",
    "./Event"
], function (browser, Queue, Dom, Event) {

    var global = this;

    Queue.prototype._controlRegExp = /\[[a-zA-Z]+\]/g;

    Queue.prototype.hooks.beforeType = function beforeType() {};

    Queue.prototype.type = function type(string, element, handler, options) {
        this.then(function _typeTask() {
            options = options || {};

            var keyDelay = options.keyDelay || 5;

            this._normalizeElement(element, function (element) {

                this.hooks.beforeType.call(this, string, element, options);

                var keyPressHandler = function (character) {
                    return function _keyPressHandler() {
                        this._typeChar(character, element, options);
                    };
                };

                var strings = string.split(this._controlRegExp);
                var controls = string.match(this._controlRegExp);

                var numControls = controls ? controls.length : 0;
                var i, j;
                for (i = 0; i < strings.length; i++) {
                    var subString = strings[i];
                    var stringLen = subString.length;

                    for (j = 0; j < stringLen; j++) {
                        this.delay(keyDelay, keyPressHandler.call(this, subString.charAt(j)));
                    }

                    if (i < numControls) {
                        this.delay(keyDelay, keyPressHandler.call(this, controls[i]));
                    }

                }

                this.then(this._wrapHandler(handler, element));
                this.next();

            }, options);
        });
    };


    Queue.prototype._typeChar = function _typeChar(character, element, options) {
        this._keyDown(character, element, options);
        if (this._isPrintingCharacter(character)) {
            if (this.browser.needsSyntheticKeypress) {
                this._keyPress(character, element, options);
            }

            // todo: find better way to detect the first keypress in an input element not working on ie
            if ((this.browser.needsSyntheticTextInput ||
                    (this.browser.msie && element.type !== "textarea" && element.value === "")) &&
                    this._isTextInputElement(element)) {

                this._textInput(character, element, options);
            }
        }

        if (this._isTextInputElement(element)) {
            if (this.browser.needsSyntheticTextValueChange && this._isPrintingCharacter(character)) {
                element.value += character;
            }
            if (!this._isPrintingCharacter(character)) {
                if (this.browser.needsSyntheticBackspace && character === "[backspace]") {
                    element.value = element.value.substring(0, element.value.length - 1);
                    this._input(element, options);
                } else {
                    // todo: handle other special characters and maybe refactor this into a plugable thing
                }
            } else {
                if (this.browser.needsSyntheticInputEvent) {
                    this._input(element, options);
                }
            }
        }
        this._keyUp(character, element, options);
    };


    Queue.prototype.defaultActions.keydown = function keyDownDefaultActions() {};
    Queue.prototype._keyDown = function _keyDown(character, element, options) {
        var event = this._createKeyEvent("keydown", character, element, options);
        this._dispatchEvent(event, element, options);
    };

    Queue.prototype.defaultActions.keypress = function keyPressDefaultAction() {};
    Queue.prototype._keyPress = function _keyPress(character, element, options) {
        var event = this._createKeyEvent("keypress", character, element, options);
        this._dispatchEvent(event, element, options);
    };

    Queue.prototype.defaultActions.textInput = function textInputDefaultActions() {};
    Queue.prototype.defaultActions.textinput = function textinputDefaultActions() {}; // ie uses all lowercase event name
    Queue.prototype._textInput = function _textInput(character, element, options) {
        var event = this._createTextEvent(this._textInputEventType, character, element, options);
        this._dispatchEvent(event, element, options);
    };

    Queue.prototype.defaultActions.keyup = function keyUpDefaultActions() {};
    Queue.prototype._keyUp = function _keyUp(character, element, options) {
        var event = this._createKeyEvent("keyup", character, element, options);
        this._dispatchEvent(event, element, options);
    };


    Queue.prototype.eventDefaults.input = {
        canBubble: true,
        cancelable: false
    };
    Queue.prototype.defaultActions.input = function inputDefaultActions() {};
    Queue.prototype._input = function _input(element, options) {
        var event = this._createEvent("input", element, options);
        this._dispatchEvent(event, element, options);
    };

    Queue.prototype.eventDefaults.key = {
        canBubble: true,
        cancelable: true,
        view: global,
        ctrlKey: false,
        altKey: false,
        shiftKey: false,
        metaKey: false
    };

    Queue.prototype._createKeyEvent = function _createKeyEvent(type, character, element, options) {
        var defaults = this.eventDefaults[type] || this.eventDefaults.key;

        var canBubble = "canBubble" in options ? options.canBubble : defaults.canBubble;
        var cancellable = "cancelable" in options ? options.cancelable : defaults.cancelable;

        var keyCode = "keyCode" in options ? options.keyCode : this._lookupKeyCode(type, character);
        var charCode = "charCode" in options ? options.charCode : this._lookupCharCode(type, character);
        var keyIdentifier = "keyIdentifier" in options ? options.keyIdentifier : this._lookupKeyIdentifier(type, character);
        var keyLocation = "keyLocation" in options ? options.keyLocation : this._lookupKeyLocation(type, character);
        var view = "view" in options ? options.view : defaults.view;

        var ctrlKey = "ctrlKey" in options ? options.ctrlKey : defaults.ctrlKey;
        var altKey = "altKey" in options ? options.altKey : defaults.altKey;
        var shiftKey = "shiftKey" in options ? options.shiftKey : defaults.shiftKey;
        var metaKey = "metaKey" in options ? options.metaKey : defaults.metaKey;

        var modifiers = [];
        if (ctrlKey) {
            modifiers.push("Control");
        }
        if (altKey) {
            modifiers.push("Alt");
        }
        if (shiftKey) {
            modifiers.push("Shift");
        }
        if (metaKey) {
            modifiers.push("Meta");
        }
        if (ctrlKey && altKey) {
            modifiers.push("AltGraph");
        }

        var event;
        if (this.browser.supportsKeyEvents) {
            event = element.ownerDocument.createEvent("KeyEvent");
            event.initKeyEvent(type, canBubble, cancellable, view, ctrlKey, altKey, shiftKey,
                metaKey, keyCode, charCode);

        } else if (this.browser.supportsKeyboardEvents) {
            event = element.ownerDocument.createEvent("KeyboardEvent");
            event.initKeyboardEvent(type, canBubble, cancellable, view, keyCode, keyLocation,
                modifiers.join(" "), 1, "");

        } else {
            event = this._createEvent(type, element, options, defaults);
            event.view = view;
            event.modifiers = modifiers.join(" ");
            event.ctrlKey = ctrlKey;
            event.altKey = altKey;
            event.shiftKey = shiftKey;
            event.metaKey = metaKey;
        }

        event.keyCode = keyCode;
        event.charCode = charCode;
        event.keyIdentifier = keyIdentifier;
        event.keyLocation = keyLocation;

        return event;
    };


    Queue.prototype._textDefaults = {
        canBubble: true,
        cancelable: true,
        view: global
    };

    Queue.prototype._createTextEvent = function _createTextEvent(type, data, element, options) {
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


    Queue.prototype._keyMap = {
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

    Queue.prototype._lookupKeyIdentifier = function _lookupKeyIdentifier(eventType, character) {
        if (character in this._keyMap && "identifier" in this._keyMap[character]) {
            return this._keyMap[character].identifier;
        } else {
            var code = this._lookupKeyCode(eventType, character).toString(16);
            code = (new Array(5 - code.length)).join("0") + code;
            return "U+" + code;
        }
    };

    Queue.prototype._lookupKeyLocation = function _lookupKeyLocation(eventType, character) {
        return 0;
    };

    Queue.prototype._lookupKeyCode = function _lookupKeyCode(eventType, character) {
        if (character in this._keyMap && "keyCode" in this._keyMap[character]) {
            return this._keyMap[character].keyCode;
        } else {
            if (eventType === "keydown") {
                character = character.toUpperCase();
            }
            return character.charCodeAt(0);
        }
    };

    Queue.prototype._lookupCharCode = function _lookupCharCode(eventType, character) {
        if (eventType === "keydown") {
            return 0;
        }
        if (character.length === 1) {
            return character.charCodeAt(0);
        } else {
            return this._keyMap[character].charCode || 0;
        }
    };


    Queue.prototype._isPrintingCharacter = function _isPrintingCharacter(character) {
        return character.length === 1;
    };

    Queue.prototype._isTextInputElement = function _isTextInputElement(element) {
        var tag = element.tagName.toLowerCase();
        var type = element.type;
        if (type && type.toLowerCase) {
            type = type.toLowerCase();
        }
        return tag === "textarea" || (tag === "input" && (type === "text" || type === "password"));
    };

    browser.addTest(function (node) {
        var ev;

        // feature test for key events
        Queue.prototype.browser.supportsKeyEvents = false;
        try {
            if (global.KeyEvent !== undefined) {
                ev = global.document.createEvent("KeyEvent");
                if ("initKeyEvent" in ev) {
                    Queue.prototype.browser.supportsKeyEvents = true;
                }
            }
        } catch (e) {
        }

        // feature test for keyboard events
        Queue.prototype.browser.supportsKeyboardEvents = false;
        try {
            if (global.KeyboardEvent !== undefined) {
                ev = global.document.createEvent("KeyboardEvent");
                if ("initKeyboardEvent" in ev) {
                    // try to init the event, if the keyCode is not set properly, then this
                    // is considered a broken feature and we will use the fallback
                    ev.initKeyboardEvent("keydown", true, true, 0, 40, 0, "", 1, "");
                    Queue.prototype.browser.supportsKeyboardEvents = ev.keyCode === 40;
                }
            }
        } catch (e) {
        }

        // feature test for text events
        Queue.prototype.browser.supportsTextEvents = false;
        try {
            if (global.TextEvent !== undefined) {
                ev = global.document.createEvent("TextEvent");
                if ("initTextEvent" in ev) {
                    Queue.prototype.browser.supportsTextEvents = true;
                }
            }
        } catch (e) {
        }

        // use a textarea to test what events are automatically fired and what needs to be
        // synthetically dispatched
        var textarea = global.document.createElement("input");
        textarea.setAttribute("type", "text");
        node.appendChild(textarea);
        textarea.value = ""; // just in case form completion kicks in
        textarea.focus();

        var q = new Queue();

        Queue.prototype._textInputEventType = Queue.prototype.browser.msie ? "textinput" : "textInput";

        Queue.prototype.browser.needsSyntheticKeypress = true;
        var pressListener = Event.on("keypress", textarea, function () {
            Queue.prototype.browser.needsSyntheticKeypress = false;
        });

        Queue.prototype.browser.needsSyntheticTextInput = true;
        var textInputListener = Event.on(Queue.prototype._textInputEventType, textarea, function () {
            Queue.prototype.browser.needsSyntheticTextInput = false;
        });

        var pressEvent, textInputEvent;
        var downEvent = q._createKeyEvent("keydown", "a", textarea, {});
        textarea.dispatchEvent(downEvent);
        var upEvent = q._createKeyEvent("keyup", "a", textarea, {});
        textarea.dispatchEvent(upEvent);

        pressListener.remove();

        textarea.value = "a";
        textarea.value = "b";

        downEvent = q._createKeyEvent("keydown", "b", textarea, {});
        textarea.dispatchEvent(downEvent);
        if (q.browser.needsSyntheticKeypress) {
            pressEvent = q._createKeyEvent("keypress", "b", textarea, {});
            textarea.dispatchEvent(pressEvent);
        }
        upEvent = q._createKeyEvent("keyup", "b", textarea, {});
        textarea.dispatchEvent(upEvent);

        textInputListener.remove();

        textarea.value = "";

        Queue.prototype.browser.needsSyntheticInputEvent = true;
        var inputListener = Event.on("input", textarea, function () {
            Queue.prototype.browser.needsSyntheticInputEvent = false;
        });

        downEvent = q._createKeyEvent("keydown", "b", textarea, {});
        textarea.dispatchEvent(downEvent);
        if (q.browser.needsSyntheticKeypress) {
            pressEvent = q._createKeyEvent("keypress", "b", textarea, {});
            textarea.dispatchEvent(pressEvent);
        }
        if (q.browser.needsSyntheticTextInput) {
            textInputEvent = q._createTextEvent(Queue.prototype._textInputEventType, "b", textarea, {});
            textarea.dispatchEvent(textInputEvent);
        }
        upEvent = q._createKeyEvent("keyup", "b", textarea, {});
        textarea.dispatchEvent(upEvent);

        Queue.prototype.browser.needsSyntheticTextValueChange = textarea.value !== "b";

        if (Queue.prototype.browser.needsSyntheticTextValueChange) {
            // force the value to change to try to fire the input listener
            textarea.value = "b";
        }
        inputListener.remove();


        textarea.value = "az";

        downEvent = q._createKeyEvent("keydown", "[backspace]", textarea, {});
        textarea.dispatchEvent(downEvent);
        if (q.browser.needsSyntheticKeypress) {
            pressEvent = q._createKeyEvent("keypress", "[backspace]", textarea, {});
            textarea.dispatchEvent(pressEvent);
        }
        if (q.browser.needsSyntheticTextInput) {
            textInputEvent = q._createTextEvent(Queue.prototype._textInputEventType, "[backspace]", textarea, {});
            textarea.dispatchEvent(textInputEvent);
        }
        upEvent = q._createKeyEvent("keyup", "[backspace]", textarea, {});
        textarea.dispatchEvent(upEvent);
        Queue.prototype.browser.needsSyntheticBackspace = textarea.value !== "a";


        /*
            keypressSubmits : false,
            keyCharacters : false,
            backspaceWorks : false,
            keysOnNotFocused : false,
            textareaCarriage : false,
            keypressOnAnchorClicks : false
         */
    });

    return Queue;
});