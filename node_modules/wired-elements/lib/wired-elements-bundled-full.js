var WiredElements = (function (exports) {
    'use strict';

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const directives = new WeakMap();
    const isDirective = (o) => {
        return typeof o === 'function' && directives.has(o);
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * True if the custom elements polyfill is in use.
     */
    const isCEPolyfill = window.customElements !== undefined &&
        window.customElements.polyfillWrapFlushCallback !==
            undefined;
    /**
     * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
     * `container`.
     */
    const removeNodes = (container, start, end = null) => {
        while (start !== end) {
            const n = start.nextSibling;
            container.removeChild(start);
            start = n;
        }
    };

    /**
     * @license
     * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * A sentinel value that signals that a value was handled by a directive and
     * should not be written to the DOM.
     */
    const noChange = {};
    /**
     * A sentinel value that signals a NodePart to fully clear its content.
     */
    const nothing = {};

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * An expression marker with embedded unique key to avoid collision with
     * possible text in templates.
     */
    const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
    /**
     * An expression marker used text-positions, multi-binding attributes, and
     * attributes with markup-like text values.
     */
    const nodeMarker = `<!--${marker}-->`;
    const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
    /**
     * Suffix appended to all bound attribute names.
     */
    const boundAttributeSuffix = '$lit$';
    /**
     * An updateable Template that tracks the location of dynamic parts.
     */
    class Template {
        constructor(result, element) {
            this.parts = [];
            this.element = element;
            const nodesToRemove = [];
            const stack = [];
            // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
            const walker = document.createTreeWalker(element.content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
            // Keeps track of the last index associated with a part. We try to delete
            // unnecessary nodes, but we never want to associate two different parts
            // to the same index. They must have a constant node between.
            let lastPartIndex = 0;
            let index = -1;
            let partIndex = 0;
            const { strings, values: { length } } = result;
            while (partIndex < length) {
                const node = walker.nextNode();
                if (node === null) {
                    // We've exhausted the content inside a nested template element.
                    // Because we still have parts (the outer for-loop), we know:
                    // - There is a template in the stack
                    // - The walker will find a nextNode outside the template
                    walker.currentNode = stack.pop();
                    continue;
                }
                index++;
                if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                    if (node.hasAttributes()) {
                        const attributes = node.attributes;
                        const { length } = attributes;
                        // Per
                        // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                        // attributes are not guaranteed to be returned in document order.
                        // In particular, Edge/IE can return them out of order, so we cannot
                        // assume a correspondence between part index and attribute index.
                        let count = 0;
                        for (let i = 0; i < length; i++) {
                            if (endsWith(attributes[i].name, boundAttributeSuffix)) {
                                count++;
                            }
                        }
                        while (count-- > 0) {
                            // Get the template literal section leading up to the first
                            // expression in this attribute
                            const stringForPart = strings[partIndex];
                            // Find the attribute name
                            const name = lastAttributeNameRegex.exec(stringForPart)[2];
                            // Find the corresponding attribute
                            // All bound attributes have had a suffix added in
                            // TemplateResult#getHTML to opt out of special attribute
                            // handling. To look up the attribute value we also need to add
                            // the suffix.
                            const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                            const attributeValue = node.getAttribute(attributeLookupName);
                            node.removeAttribute(attributeLookupName);
                            const statics = attributeValue.split(markerRegex);
                            this.parts.push({ type: 'attribute', index, name, strings: statics });
                            partIndex += statics.length - 1;
                        }
                    }
                    if (node.tagName === 'TEMPLATE') {
                        stack.push(node);
                        walker.currentNode = node.content;
                    }
                }
                else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                    const data = node.data;
                    if (data.indexOf(marker) >= 0) {
                        const parent = node.parentNode;
                        const strings = data.split(markerRegex);
                        const lastIndex = strings.length - 1;
                        // Generate a new text node for each literal section
                        // These nodes are also used as the markers for node parts
                        for (let i = 0; i < lastIndex; i++) {
                            let insert;
                            let s = strings[i];
                            if (s === '') {
                                insert = createMarker();
                            }
                            else {
                                const match = lastAttributeNameRegex.exec(s);
                                if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                                    s = s.slice(0, match.index) + match[1] +
                                        match[2].slice(0, -boundAttributeSuffix.length) + match[3];
                                }
                                insert = document.createTextNode(s);
                            }
                            parent.insertBefore(insert, node);
                            this.parts.push({ type: 'node', index: ++index });
                        }
                        // If there's no text, we must insert a comment to mark our place.
                        // Else, we can trust it will stick around after cloning.
                        if (strings[lastIndex] === '') {
                            parent.insertBefore(createMarker(), node);
                            nodesToRemove.push(node);
                        }
                        else {
                            node.data = strings[lastIndex];
                        }
                        // We have a part for each match found
                        partIndex += lastIndex;
                    }
                }
                else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                    if (node.data === marker) {
                        const parent = node.parentNode;
                        // Add a new marker node to be the startNode of the Part if any of
                        // the following are true:
                        //  * We don't have a previousSibling
                        //  * The previousSibling is already the start of a previous part
                        if (node.previousSibling === null || index === lastPartIndex) {
                            index++;
                            parent.insertBefore(createMarker(), node);
                        }
                        lastPartIndex = index;
                        this.parts.push({ type: 'node', index });
                        // If we don't have a nextSibling, keep this node so we have an end.
                        // Else, we can remove it to save future costs.
                        if (node.nextSibling === null) {
                            node.data = '';
                        }
                        else {
                            nodesToRemove.push(node);
                            index--;
                        }
                        partIndex++;
                    }
                    else {
                        let i = -1;
                        while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
                            // Comment node has a binding marker inside, make an inactive part
                            // The binding won't work, but subsequent bindings will
                            // TODO (justinfagnani): consider whether it's even worth it to
                            // make bindings in comments work
                            this.parts.push({ type: 'node', index: -1 });
                            partIndex++;
                        }
                    }
                }
            }
            // Remove text binding nodes after the walk to not disturb the TreeWalker
            for (const n of nodesToRemove) {
                n.parentNode.removeChild(n);
            }
        }
    }
    const endsWith = (str, suffix) => {
        const index = str.length - suffix.length;
        return index >= 0 && str.slice(index) === suffix;
    };
    const isTemplatePartActive = (part) => part.index !== -1;
    // Allows `document.createComment('')` to be renamed for a
    // small manual size-savings.
    const createMarker = () => document.createComment('');
    /**
     * This regex extracts the attribute name preceding an attribute-position
     * expression. It does this by matching the syntax allowed for attributes
     * against the string literal directly preceding the expression, assuming that
     * the expression is in an attribute-value position.
     *
     * See attributes in the HTML spec:
     * https://www.w3.org/TR/html5/syntax.html#elements-attributes
     *
     * " \x09\x0a\x0c\x0d" are HTML space characters:
     * https://www.w3.org/TR/html5/infrastructure.html#space-characters
     *
     * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
     * space character except " ".
     *
     * So an attribute is:
     *  * The name: any character except a control character, space character, ('),
     *    ("), ">", "=", or "/"
     *  * Followed by zero or more space characters
     *  * Followed by "="
     *  * Followed by zero or more space characters
     *  * Followed by:
     *    * Any character except space, ('), ("), "<", ">", "=", (`), or
     *    * (") then any non-("), or
     *    * (') then any non-(')
     */
    const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * An instance of a `Template` that can be attached to the DOM and updated
     * with new values.
     */
    class TemplateInstance {
        constructor(template, processor, options) {
            this.__parts = [];
            this.template = template;
            this.processor = processor;
            this.options = options;
        }
        update(values) {
            let i = 0;
            for (const part of this.__parts) {
                if (part !== undefined) {
                    part.setValue(values[i]);
                }
                i++;
            }
            for (const part of this.__parts) {
                if (part !== undefined) {
                    part.commit();
                }
            }
        }
        _clone() {
            // There are a number of steps in the lifecycle of a template instance's
            // DOM fragment:
            //  1. Clone - create the instance fragment
            //  2. Adopt - adopt into the main document
            //  3. Process - find part markers and create parts
            //  4. Upgrade - upgrade custom elements
            //  5. Update - set node, attribute, property, etc., values
            //  6. Connect - connect to the document. Optional and outside of this
            //     method.
            //
            // We have a few constraints on the ordering of these steps:
            //  * We need to upgrade before updating, so that property values will pass
            //    through any property setters.
            //  * We would like to process before upgrading so that we're sure that the
            //    cloned fragment is inert and not disturbed by self-modifying DOM.
            //  * We want custom elements to upgrade even in disconnected fragments.
            //
            // Given these constraints, with full custom elements support we would
            // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
            //
            // But Safari dooes not implement CustomElementRegistry#upgrade, so we
            // can not implement that order and still have upgrade-before-update and
            // upgrade disconnected fragments. So we instead sacrifice the
            // process-before-upgrade constraint, since in Custom Elements v1 elements
            // must not modify their light DOM in the constructor. We still have issues
            // when co-existing with CEv0 elements like Polymer 1, and with polyfills
            // that don't strictly adhere to the no-modification rule because shadow
            // DOM, which may be created in the constructor, is emulated by being placed
            // in the light DOM.
            //
            // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
            // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
            // in one step.
            //
            // The Custom Elements v1 polyfill supports upgrade(), so the order when
            // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
            // Connect.
            const fragment = isCEPolyfill ?
                this.template.element.content.cloneNode(true) :
                document.importNode(this.template.element.content, true);
            const stack = [];
            const parts = this.template.parts;
            // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
            const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
            let partIndex = 0;
            let nodeIndex = 0;
            let part;
            let node = walker.nextNode();
            // Loop through all the nodes and parts of a template
            while (partIndex < parts.length) {
                part = parts[partIndex];
                if (!isTemplatePartActive(part)) {
                    this.__parts.push(undefined);
                    partIndex++;
                    continue;
                }
                // Progress the tree walker until we find our next part's node.
                // Note that multiple parts may share the same node (attribute parts
                // on a single element), so this loop may not run at all.
                while (nodeIndex < part.index) {
                    nodeIndex++;
                    if (node.nodeName === 'TEMPLATE') {
                        stack.push(node);
                        walker.currentNode = node.content;
                    }
                    if ((node = walker.nextNode()) === null) {
                        // We've exhausted the content inside a nested template element.
                        // Because we still have parts (the outer for-loop), we know:
                        // - There is a template in the stack
                        // - The walker will find a nextNode outside the template
                        walker.currentNode = stack.pop();
                        node = walker.nextNode();
                    }
                }
                // We've arrived at our part's node.
                if (part.type === 'node') {
                    const part = this.processor.handleTextExpression(this.options);
                    part.insertAfterNode(node.previousSibling);
                    this.__parts.push(part);
                }
                else {
                    this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
                }
                partIndex++;
            }
            if (isCEPolyfill) {
                document.adoptNode(fragment);
                customElements.upgrade(fragment);
            }
            return fragment;
        }
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const commentMarker = ` ${marker} `;
    /**
     * The return type of `html`, which holds a Template and the values from
     * interpolated expressions.
     */
    class TemplateResult {
        constructor(strings, values, type, processor) {
            this.strings = strings;
            this.values = values;
            this.type = type;
            this.processor = processor;
        }
        /**
         * Returns a string of HTML used to create a `<template>` element.
         */
        getHTML() {
            const l = this.strings.length - 1;
            let html = '';
            let isCommentBinding = false;
            for (let i = 0; i < l; i++) {
                const s = this.strings[i];
                // For each binding we want to determine the kind of marker to insert
                // into the template source before it's parsed by the browser's HTML
                // parser. The marker type is based on whether the expression is in an
                // attribute, text, or comment poisition.
                //   * For node-position bindings we insert a comment with the marker
                //     sentinel as its text content, like <!--{{lit-guid}}-->.
                //   * For attribute bindings we insert just the marker sentinel for the
                //     first binding, so that we support unquoted attribute bindings.
                //     Subsequent bindings can use a comment marker because multi-binding
                //     attributes must be quoted.
                //   * For comment bindings we insert just the marker sentinel so we don't
                //     close the comment.
                //
                // The following code scans the template source, but is *not* an HTML
                // parser. We don't need to track the tree structure of the HTML, only
                // whether a binding is inside a comment, and if not, if it appears to be
                // the first binding in an attribute.
                const commentOpen = s.lastIndexOf('<!--');
                // We're in comment position if we have a comment open with no following
                // comment close. Because <-- can appear in an attribute value there can
                // be false positives.
                isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
                    s.indexOf('-->', commentOpen + 1) === -1;
                // Check to see if we have an attribute-like sequence preceeding the
                // expression. This can match "name=value" like structures in text,
                // comments, and attribute values, so there can be false-positives.
                const attributeMatch = lastAttributeNameRegex.exec(s);
                if (attributeMatch === null) {
                    // We're only in this branch if we don't have a attribute-like
                    // preceeding sequence. For comments, this guards against unusual
                    // attribute values like <div foo="<!--${'bar'}">. Cases like
                    // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
                    // below.
                    html += s + (isCommentBinding ? commentMarker : nodeMarker);
                }
                else {
                    // For attributes we use just a marker sentinel, and also append a
                    // $lit$ suffix to the name to opt-out of attribute-specific parsing
                    // that IE and Edge do for style and certain SVG attributes.
                    html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
                        attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] +
                        marker;
                }
            }
            html += this.strings[l];
            return html;
        }
        getTemplateElement() {
            const template = document.createElement('template');
            template.innerHTML = this.getHTML();
            return template;
        }
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const isPrimitive = (value) => {
        return (value === null ||
            !(typeof value === 'object' || typeof value === 'function'));
    };
    const isIterable = (value) => {
        return Array.isArray(value) ||
            // tslint:disable-next-line:no-any
            !!(value && value[Symbol.iterator]);
    };
    /**
     * Writes attribute values to the DOM for a group of AttributeParts bound to a
     * single attibute. The value is only set once even if there are multiple parts
     * for an attribute.
     */
    class AttributeCommitter {
        constructor(element, name, strings) {
            this.dirty = true;
            this.element = element;
            this.name = name;
            this.strings = strings;
            this.parts = [];
            for (let i = 0; i < strings.length - 1; i++) {
                this.parts[i] = this._createPart();
            }
        }
        /**
         * Creates a single part. Override this to create a differnt type of part.
         */
        _createPart() {
            return new AttributePart(this);
        }
        _getValue() {
            const strings = this.strings;
            const l = strings.length - 1;
            let text = '';
            for (let i = 0; i < l; i++) {
                text += strings[i];
                const part = this.parts[i];
                if (part !== undefined) {
                    const v = part.value;
                    if (isPrimitive(v) || !isIterable(v)) {
                        text += typeof v === 'string' ? v : String(v);
                    }
                    else {
                        for (const t of v) {
                            text += typeof t === 'string' ? t : String(t);
                        }
                    }
                }
            }
            text += strings[l];
            return text;
        }
        commit() {
            if (this.dirty) {
                this.dirty = false;
                this.element.setAttribute(this.name, this._getValue());
            }
        }
    }
    /**
     * A Part that controls all or part of an attribute value.
     */
    class AttributePart {
        constructor(committer) {
            this.value = undefined;
            this.committer = committer;
        }
        setValue(value) {
            if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
                this.value = value;
                // If the value is a not a directive, dirty the committer so that it'll
                // call setAttribute. If the value is a directive, it'll dirty the
                // committer if it calls setValue().
                if (!isDirective(value)) {
                    this.committer.dirty = true;
                }
            }
        }
        commit() {
            while (isDirective(this.value)) {
                const directive = this.value;
                this.value = noChange;
                directive(this);
            }
            if (this.value === noChange) {
                return;
            }
            this.committer.commit();
        }
    }
    /**
     * A Part that controls a location within a Node tree. Like a Range, NodePart
     * has start and end locations and can set and update the Nodes between those
     * locations.
     *
     * NodeParts support several value types: primitives, Nodes, TemplateResults,
     * as well as arrays and iterables of those types.
     */
    class NodePart {
        constructor(options) {
            this.value = undefined;
            this.__pendingValue = undefined;
            this.options = options;
        }
        /**
         * Appends this part into a container.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        appendInto(container) {
            this.startNode = container.appendChild(createMarker());
            this.endNode = container.appendChild(createMarker());
        }
        /**
         * Inserts this part after the `ref` node (between `ref` and `ref`'s next
         * sibling). Both `ref` and its next sibling must be static, unchanging nodes
         * such as those that appear in a literal section of a template.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        insertAfterNode(ref) {
            this.startNode = ref;
            this.endNode = ref.nextSibling;
        }
        /**
         * Appends this part into a parent part.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        appendIntoPart(part) {
            part.__insert(this.startNode = createMarker());
            part.__insert(this.endNode = createMarker());
        }
        /**
         * Inserts this part after the `ref` part.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        insertAfterPart(ref) {
            ref.__insert(this.startNode = createMarker());
            this.endNode = ref.endNode;
            ref.endNode = this.startNode;
        }
        setValue(value) {
            this.__pendingValue = value;
        }
        commit() {
            while (isDirective(this.__pendingValue)) {
                const directive = this.__pendingValue;
                this.__pendingValue = noChange;
                directive(this);
            }
            const value = this.__pendingValue;
            if (value === noChange) {
                return;
            }
            if (isPrimitive(value)) {
                if (value !== this.value) {
                    this.__commitText(value);
                }
            }
            else if (value instanceof TemplateResult) {
                this.__commitTemplateResult(value);
            }
            else if (value instanceof Node) {
                this.__commitNode(value);
            }
            else if (isIterable(value)) {
                this.__commitIterable(value);
            }
            else if (value === nothing) {
                this.value = nothing;
                this.clear();
            }
            else {
                // Fallback, will render the string representation
                this.__commitText(value);
            }
        }
        __insert(node) {
            this.endNode.parentNode.insertBefore(node, this.endNode);
        }
        __commitNode(value) {
            if (this.value === value) {
                return;
            }
            this.clear();
            this.__insert(value);
            this.value = value;
        }
        __commitText(value) {
            const node = this.startNode.nextSibling;
            value = value == null ? '' : value;
            // If `value` isn't already a string, we explicitly convert it here in case
            // it can't be implicitly converted - i.e. it's a symbol.
            const valueAsString = typeof value === 'string' ? value : String(value);
            if (node === this.endNode.previousSibling &&
                node.nodeType === 3 /* Node.TEXT_NODE */) {
                // If we only have a single text node between the markers, we can just
                // set its value, rather than replacing it.
                // TODO(justinfagnani): Can we just check if this.value is primitive?
                node.data = valueAsString;
            }
            else {
                this.__commitNode(document.createTextNode(valueAsString));
            }
            this.value = value;
        }
        __commitTemplateResult(value) {
            const template = this.options.templateFactory(value);
            if (this.value instanceof TemplateInstance &&
                this.value.template === template) {
                this.value.update(value.values);
            }
            else {
                // Make sure we propagate the template processor from the TemplateResult
                // so that we use its syntax extension, etc. The template factory comes
                // from the render function options so that it can control template
                // caching and preprocessing.
                const instance = new TemplateInstance(template, value.processor, this.options);
                const fragment = instance._clone();
                instance.update(value.values);
                this.__commitNode(fragment);
                this.value = instance;
            }
        }
        __commitIterable(value) {
            // For an Iterable, we create a new InstancePart per item, then set its
            // value to the item. This is a little bit of overhead for every item in
            // an Iterable, but it lets us recurse easily and efficiently update Arrays
            // of TemplateResults that will be commonly returned from expressions like:
            // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
            // If _value is an array, then the previous render was of an
            // iterable and _value will contain the NodeParts from the previous
            // render. If _value is not an array, clear this part and make a new
            // array for NodeParts.
            if (!Array.isArray(this.value)) {
                this.value = [];
                this.clear();
            }
            // Lets us keep track of how many items we stamped so we can clear leftover
            // items from a previous render
            const itemParts = this.value;
            let partIndex = 0;
            let itemPart;
            for (const item of value) {
                // Try to reuse an existing part
                itemPart = itemParts[partIndex];
                // If no existing part, create a new one
                if (itemPart === undefined) {
                    itemPart = new NodePart(this.options);
                    itemParts.push(itemPart);
                    if (partIndex === 0) {
                        itemPart.appendIntoPart(this);
                    }
                    else {
                        itemPart.insertAfterPart(itemParts[partIndex - 1]);
                    }
                }
                itemPart.setValue(item);
                itemPart.commit();
                partIndex++;
            }
            if (partIndex < itemParts.length) {
                // Truncate the parts array so _value reflects the current state
                itemParts.length = partIndex;
                this.clear(itemPart && itemPart.endNode);
            }
        }
        clear(startNode = this.startNode) {
            removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
        }
    }
    /**
     * Implements a boolean attribute, roughly as defined in the HTML
     * specification.
     *
     * If the value is truthy, then the attribute is present with a value of
     * ''. If the value is falsey, the attribute is removed.
     */
    class BooleanAttributePart {
        constructor(element, name, strings) {
            this.value = undefined;
            this.__pendingValue = undefined;
            if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
                throw new Error('Boolean attributes can only contain a single expression');
            }
            this.element = element;
            this.name = name;
            this.strings = strings;
        }
        setValue(value) {
            this.__pendingValue = value;
        }
        commit() {
            while (isDirective(this.__pendingValue)) {
                const directive = this.__pendingValue;
                this.__pendingValue = noChange;
                directive(this);
            }
            if (this.__pendingValue === noChange) {
                return;
            }
            const value = !!this.__pendingValue;
            if (this.value !== value) {
                if (value) {
                    this.element.setAttribute(this.name, '');
                }
                else {
                    this.element.removeAttribute(this.name);
                }
                this.value = value;
            }
            this.__pendingValue = noChange;
        }
    }
    /**
     * Sets attribute values for PropertyParts, so that the value is only set once
     * even if there are multiple parts for a property.
     *
     * If an expression controls the whole property value, then the value is simply
     * assigned to the property under control. If there are string literals or
     * multiple expressions, then the strings are expressions are interpolated into
     * a string first.
     */
    class PropertyCommitter extends AttributeCommitter {
        constructor(element, name, strings) {
            super(element, name, strings);
            this.single =
                (strings.length === 2 && strings[0] === '' && strings[1] === '');
        }
        _createPart() {
            return new PropertyPart(this);
        }
        _getValue() {
            if (this.single) {
                return this.parts[0].value;
            }
            return super._getValue();
        }
        commit() {
            if (this.dirty) {
                this.dirty = false;
                // tslint:disable-next-line:no-any
                this.element[this.name] = this._getValue();
            }
        }
    }
    class PropertyPart extends AttributePart {
    }
    // Detect event listener options support. If the `capture` property is read
    // from the options object, then options are supported. If not, then the thrid
    // argument to add/removeEventListener is interpreted as the boolean capture
    // value so we should only pass the `capture` property.
    let eventOptionsSupported = false;
    try {
        const options = {
            get capture() {
                eventOptionsSupported = true;
                return false;
            }
        };
        // tslint:disable-next-line:no-any
        window.addEventListener('test', options, options);
        // tslint:disable-next-line:no-any
        window.removeEventListener('test', options, options);
    }
    catch (_e) {
    }
    class EventPart {
        constructor(element, eventName, eventContext) {
            this.value = undefined;
            this.__pendingValue = undefined;
            this.element = element;
            this.eventName = eventName;
            this.eventContext = eventContext;
            this.__boundHandleEvent = (e) => this.handleEvent(e);
        }
        setValue(value) {
            this.__pendingValue = value;
        }
        commit() {
            while (isDirective(this.__pendingValue)) {
                const directive = this.__pendingValue;
                this.__pendingValue = noChange;
                directive(this);
            }
            if (this.__pendingValue === noChange) {
                return;
            }
            const newListener = this.__pendingValue;
            const oldListener = this.value;
            const shouldRemoveListener = newListener == null ||
                oldListener != null &&
                    (newListener.capture !== oldListener.capture ||
                        newListener.once !== oldListener.once ||
                        newListener.passive !== oldListener.passive);
            const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
            if (shouldRemoveListener) {
                this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
            }
            if (shouldAddListener) {
                this.__options = getOptions(newListener);
                this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
            }
            this.value = newListener;
            this.__pendingValue = noChange;
        }
        handleEvent(event) {
            if (typeof this.value === 'function') {
                this.value.call(this.eventContext || this.element, event);
            }
            else {
                this.value.handleEvent(event);
            }
        }
    }
    // We copy options because of the inconsistent behavior of browsers when reading
    // the third argument of add/removeEventListener. IE11 doesn't support options
    // at all. Chrome 41 only reads `capture` if the argument is an object.
    const getOptions = (o) => o &&
        (eventOptionsSupported ?
            { capture: o.capture, passive: o.passive, once: o.once } :
            o.capture);

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * Creates Parts when a template is instantiated.
     */
    class DefaultTemplateProcessor {
        /**
         * Create parts for an attribute-position binding, given the event, attribute
         * name, and string literals.
         *
         * @param element The element containing the binding
         * @param name  The attribute name
         * @param strings The string literals. There are always at least two strings,
         *   event for fully-controlled bindings with a single expression.
         */
        handleAttributeExpressions(element, name, strings, options) {
            const prefix = name[0];
            if (prefix === '.') {
                const committer = new PropertyCommitter(element, name.slice(1), strings);
                return committer.parts;
            }
            if (prefix === '@') {
                return [new EventPart(element, name.slice(1), options.eventContext)];
            }
            if (prefix === '?') {
                return [new BooleanAttributePart(element, name.slice(1), strings)];
            }
            const committer = new AttributeCommitter(element, name, strings);
            return committer.parts;
        }
        /**
         * Create parts for a text-position binding.
         * @param templateFactory
         */
        handleTextExpression(options) {
            return new NodePart(options);
        }
    }
    const defaultTemplateProcessor = new DefaultTemplateProcessor();

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * The default TemplateFactory which caches Templates keyed on
     * result.type and result.strings.
     */
    function templateFactory(result) {
        let templateCache = templateCaches.get(result.type);
        if (templateCache === undefined) {
            templateCache = {
                stringsArray: new WeakMap(),
                keyString: new Map()
            };
            templateCaches.set(result.type, templateCache);
        }
        let template = templateCache.stringsArray.get(result.strings);
        if (template !== undefined) {
            return template;
        }
        // If the TemplateStringsArray is new, generate a key from the strings
        // This key is shared between all templates with identical content
        const key = result.strings.join(marker);
        // Check if we already have a Template for this key
        template = templateCache.keyString.get(key);
        if (template === undefined) {
            // If we have not seen this key before, create a new Template
            template = new Template(result, result.getTemplateElement());
            // Cache the Template for this key
            templateCache.keyString.set(key, template);
        }
        // Cache all future queries for this TemplateStringsArray
        templateCache.stringsArray.set(result.strings, template);
        return template;
    }
    const templateCaches = new Map();

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const parts = new WeakMap();
    /**
     * Renders a template result or other value to a container.
     *
     * To update a container with new values, reevaluate the template literal and
     * call `render` with the new result.
     *
     * @param result Any value renderable by NodePart - typically a TemplateResult
     *     created by evaluating a template tag like `html` or `svg`.
     * @param container A DOM parent to render to. The entire contents are either
     *     replaced, or efficiently updated if the same result type was previous
     *     rendered there.
     * @param options RenderOptions for the entire render tree rendered to this
     *     container. Render options must *not* change between renders to the same
     *     container, as those changes will not effect previously rendered DOM.
     */
    const render = (result, container, options) => {
        let part = parts.get(container);
        if (part === undefined) {
            removeNodes(container, container.firstChild);
            parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
            part.appendInto(container);
        }
        part.setValue(result);
        part.commit();
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // IMPORTANT: do not change the property name or the assignment expression.
    // This line will be used in regexes to search for lit-html usage.
    // TODO(justinfagnani): inject version number at build time
    (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.1.2');
    /**
     * Interprets a template literal as an HTML template that can efficiently
     * render to and update a container.
     */
    const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const walkerNodeFilter = 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */;
    /**
     * Removes the list of nodes from a Template safely. In addition to removing
     * nodes from the Template, the Template part indices are updated to match
     * the mutated Template DOM.
     *
     * As the template is walked the removal state is tracked and
     * part indices are adjusted as needed.
     *
     * div
     *   div#1 (remove) <-- start removing (removing node is div#1)
     *     div
     *       div#2 (remove)  <-- continue removing (removing node is still div#1)
     *         div
     * div <-- stop removing since previous sibling is the removing node (div#1,
     * removed 4 nodes)
     */
    function removeNodesFromTemplate(template, nodesToRemove) {
        const { element: { content }, parts } = template;
        const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
        let partIndex = nextActiveIndexInTemplateParts(parts);
        let part = parts[partIndex];
        let nodeIndex = -1;
        let removeCount = 0;
        const nodesToRemoveInTemplate = [];
        let currentRemovingNode = null;
        while (walker.nextNode()) {
            nodeIndex++;
            const node = walker.currentNode;
            // End removal if stepped past the removing node
            if (node.previousSibling === currentRemovingNode) {
                currentRemovingNode = null;
            }
            // A node to remove was found in the template
            if (nodesToRemove.has(node)) {
                nodesToRemoveInTemplate.push(node);
                // Track node we're removing
                if (currentRemovingNode === null) {
                    currentRemovingNode = node;
                }
            }
            // When removing, increment count by which to adjust subsequent part indices
            if (currentRemovingNode !== null) {
                removeCount++;
            }
            while (part !== undefined && part.index === nodeIndex) {
                // If part is in a removed node deactivate it by setting index to -1 or
                // adjust the index as needed.
                part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
                // go to the next active part.
                partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                part = parts[partIndex];
            }
        }
        nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n));
    }
    const countNodes = (node) => {
        let count = (node.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */) ? 0 : 1;
        const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
        while (walker.nextNode()) {
            count++;
        }
        return count;
    };
    const nextActiveIndexInTemplateParts = (parts, startIndex = -1) => {
        for (let i = startIndex + 1; i < parts.length; i++) {
            const part = parts[i];
            if (isTemplatePartActive(part)) {
                return i;
            }
        }
        return -1;
    };
    /**
     * Inserts the given node into the Template, optionally before the given
     * refNode. In addition to inserting the node into the Template, the Template
     * part indices are updated to match the mutated Template DOM.
     */
    function insertNodeIntoTemplate(template, node, refNode = null) {
        const { element: { content }, parts } = template;
        // If there's no refNode, then put node at end of template.
        // No part indices need to be shifted in this case.
        if (refNode === null || refNode === undefined) {
            content.appendChild(node);
            return;
        }
        const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
        let partIndex = nextActiveIndexInTemplateParts(parts);
        let insertCount = 0;
        let walkerIndex = -1;
        while (walker.nextNode()) {
            walkerIndex++;
            const walkerNode = walker.currentNode;
            if (walkerNode === refNode) {
                insertCount = countNodes(node);
                refNode.parentNode.insertBefore(node, refNode);
            }
            while (partIndex !== -1 && parts[partIndex].index === walkerIndex) {
                // If we've inserted the node, simply adjust all subsequent parts
                if (insertCount > 0) {
                    while (partIndex !== -1) {
                        parts[partIndex].index += insertCount;
                        partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
                    }
                    return;
                }
                partIndex = nextActiveIndexInTemplateParts(parts, partIndex);
            }
        }
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // Get a key to lookup in `templateCaches`.
    const getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
    let compatibleShadyCSSVersion = true;
    if (typeof window.ShadyCSS === 'undefined') {
        compatibleShadyCSSVersion = false;
    }
    else if (typeof window.ShadyCSS.prepareTemplateDom === 'undefined') {
        console.warn(`Incompatible ShadyCSS version detected. ` +
            `Please update to at least @webcomponents/webcomponentsjs@2.0.2 and ` +
            `@webcomponents/shadycss@1.3.1.`);
        compatibleShadyCSSVersion = false;
    }
    /**
     * Template factory which scopes template DOM using ShadyCSS.
     * @param scopeName {string}
     */
    const shadyTemplateFactory = (scopeName) => (result) => {
        const cacheKey = getTemplateCacheKey(result.type, scopeName);
        let templateCache = templateCaches.get(cacheKey);
        if (templateCache === undefined) {
            templateCache = {
                stringsArray: new WeakMap(),
                keyString: new Map()
            };
            templateCaches.set(cacheKey, templateCache);
        }
        let template = templateCache.stringsArray.get(result.strings);
        if (template !== undefined) {
            return template;
        }
        const key = result.strings.join(marker);
        template = templateCache.keyString.get(key);
        if (template === undefined) {
            const element = result.getTemplateElement();
            if (compatibleShadyCSSVersion) {
                window.ShadyCSS.prepareTemplateDom(element, scopeName);
            }
            template = new Template(result, element);
            templateCache.keyString.set(key, template);
        }
        templateCache.stringsArray.set(result.strings, template);
        return template;
    };
    const TEMPLATE_TYPES = ['html', 'svg'];
    /**
     * Removes all style elements from Templates for the given scopeName.
     */
    const removeStylesFromLitTemplates = (scopeName) => {
        TEMPLATE_TYPES.forEach((type) => {
            const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
            if (templates !== undefined) {
                templates.keyString.forEach((template) => {
                    const { element: { content } } = template;
                    // IE 11 doesn't support the iterable param Set constructor
                    const styles = new Set();
                    Array.from(content.querySelectorAll('style')).forEach((s) => {
                        styles.add(s);
                    });
                    removeNodesFromTemplate(template, styles);
                });
            }
        });
    };
    const shadyRenderSet = new Set();
    /**
     * For the given scope name, ensures that ShadyCSS style scoping is performed.
     * This is done just once per scope name so the fragment and template cannot
     * be modified.
     * (1) extracts styles from the rendered fragment and hands them to ShadyCSS
     * to be scoped and appended to the document
     * (2) removes style elements from all lit-html Templates for this scope name.
     *
     * Note, <style> elements can only be placed into templates for the
     * initial rendering of the scope. If <style> elements are included in templates
     * dynamically rendered to the scope (after the first scope render), they will
     * not be scoped and the <style> will be left in the template and rendered
     * output.
     */
    const prepareTemplateStyles = (scopeName, renderedDOM, template) => {
        shadyRenderSet.add(scopeName);
        // If `renderedDOM` is stamped from a Template, then we need to edit that
        // Template's underlying template element. Otherwise, we create one here
        // to give to ShadyCSS, which still requires one while scoping.
        const templateElement = !!template ? template.element : document.createElement('template');
        // Move styles out of rendered DOM and store.
        const styles = renderedDOM.querySelectorAll('style');
        const { length } = styles;
        // If there are no styles, skip unnecessary work
        if (length === 0) {
            // Ensure prepareTemplateStyles is called to support adding
            // styles via `prepareAdoptedCssText` since that requires that
            // `prepareTemplateStyles` is called.
            //
            // ShadyCSS will only update styles containing @apply in the template
            // given to `prepareTemplateStyles`. If no lit Template was given,
            // ShadyCSS will not be able to update uses of @apply in any relevant
            // template. However, this is not a problem because we only create the
            // template for the purpose of supporting `prepareAdoptedCssText`,
            // which doesn't support @apply at all.
            window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
            return;
        }
        const condensedStyle = document.createElement('style');
        // Collect styles into a single style. This helps us make sure ShadyCSS
        // manipulations will not prevent us from being able to fix up template
        // part indices.
        // NOTE: collecting styles is inefficient for browsers but ShadyCSS
        // currently does this anyway. When it does not, this should be changed.
        for (let i = 0; i < length; i++) {
            const style = styles[i];
            style.parentNode.removeChild(style);
            condensedStyle.textContent += style.textContent;
        }
        // Remove styles from nested templates in this scope.
        removeStylesFromLitTemplates(scopeName);
        // And then put the condensed style into the "root" template passed in as
        // `template`.
        const content = templateElement.content;
        if (!!template) {
            insertNodeIntoTemplate(template, condensedStyle, content.firstChild);
        }
        else {
            content.insertBefore(condensedStyle, content.firstChild);
        }
        // Note, it's important that ShadyCSS gets the template that `lit-html`
        // will actually render so that it can update the style inside when
        // needed (e.g. @apply native Shadow DOM case).
        window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
        const style = content.querySelector('style');
        if (window.ShadyCSS.nativeShadow && style !== null) {
            // When in native Shadow DOM, ensure the style created by ShadyCSS is
            // included in initially rendered output (`renderedDOM`).
            renderedDOM.insertBefore(style.cloneNode(true), renderedDOM.firstChild);
        }
        else if (!!template) {
            // When no style is left in the template, parts will be broken as a
            // result. To fix this, we put back the style node ShadyCSS removed
            // and then tell lit to remove that node from the template.
            // There can be no style in the template in 2 cases (1) when Shady DOM
            // is in use, ShadyCSS removes all styles, (2) when native Shadow DOM
            // is in use ShadyCSS removes the style if it contains no content.
            // NOTE, ShadyCSS creates its own style so we can safely add/remove
            // `condensedStyle` here.
            content.insertBefore(condensedStyle, content.firstChild);
            const removes = new Set();
            removes.add(condensedStyle);
            removeNodesFromTemplate(template, removes);
        }
    };
    /**
     * Extension to the standard `render` method which supports rendering
     * to ShadowRoots when the ShadyDOM (https://github.com/webcomponents/shadydom)
     * and ShadyCSS (https://github.com/webcomponents/shadycss) polyfills are used
     * or when the webcomponentsjs
     * (https://github.com/webcomponents/webcomponentsjs) polyfill is used.
     *
     * Adds a `scopeName` option which is used to scope element DOM and stylesheets
     * when native ShadowDOM is unavailable. The `scopeName` will be added to
     * the class attribute of all rendered DOM. In addition, any style elements will
     * be automatically re-written with this `scopeName` selector and moved out
     * of the rendered DOM and into the document `<head>`.
     *
     * It is common to use this render method in conjunction with a custom element
     * which renders a shadowRoot. When this is done, typically the element's
     * `localName` should be used as the `scopeName`.
     *
     * In addition to DOM scoping, ShadyCSS also supports a basic shim for css
     * custom properties (needed only on older browsers like IE11) and a shim for
     * a deprecated feature called `@apply` that supports applying a set of css
     * custom properties to a given location.
     *
     * Usage considerations:
     *
     * * Part values in `<style>` elements are only applied the first time a given
     * `scopeName` renders. Subsequent changes to parts in style elements will have
     * no effect. Because of this, parts in style elements should only be used for
     * values that will never change, for example parts that set scope-wide theme
     * values or parts which render shared style elements.
     *
     * * Note, due to a limitation of the ShadyDOM polyfill, rendering in a
     * custom element's `constructor` is not supported. Instead rendering should
     * either done asynchronously, for example at microtask timing (for example
     * `Promise.resolve()`), or be deferred until the first time the element's
     * `connectedCallback` runs.
     *
     * Usage considerations when using shimmed custom properties or `@apply`:
     *
     * * Whenever any dynamic changes are made which affect
     * css custom properties, `ShadyCSS.styleElement(element)` must be called
     * to update the element. There are two cases when this is needed:
     * (1) the element is connected to a new parent, (2) a class is added to the
     * element that causes it to match different custom properties.
     * To address the first case when rendering a custom element, `styleElement`
     * should be called in the element's `connectedCallback`.
     *
     * * Shimmed custom properties may only be defined either for an entire
     * shadowRoot (for example, in a `:host` rule) or via a rule that directly
     * matches an element with a shadowRoot. In other words, instead of flowing from
     * parent to child as do native css custom properties, shimmed custom properties
     * flow only from shadowRoots to nested shadowRoots.
     *
     * * When using `@apply` mixing css shorthand property names with
     * non-shorthand names (for example `border` and `border-width`) is not
     * supported.
     */
    const render$1 = (result, container, options) => {
        if (!options || typeof options !== 'object' || !options.scopeName) {
            throw new Error('The `scopeName` option is required.');
        }
        const scopeName = options.scopeName;
        const hasRendered = parts.has(container);
        const needsScoping = compatibleShadyCSSVersion &&
            container.nodeType === 11 /* Node.DOCUMENT_FRAGMENT_NODE */ &&
            !!container.host;
        // Handle first render to a scope specially...
        const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName);
        // On first scope render, render into a fragment; this cannot be a single
        // fragment that is reused since nested renders can occur synchronously.
        const renderContainer = firstScopeRender ? document.createDocumentFragment() : container;
        render(result, renderContainer, Object.assign({ templateFactory: shadyTemplateFactory(scopeName) }, options));
        // When performing first scope render,
        // (1) We've rendered into a fragment so that there's a chance to
        // `prepareTemplateStyles` before sub-elements hit the DOM
        // (which might cause them to render based on a common pattern of
        // rendering in a custom element's `connectedCallback`);
        // (2) Scope the template with ShadyCSS one time only for this scope.
        // (3) Render the fragment into the container and make sure the
        // container knows its `part` is the one we just rendered. This ensures
        // DOM will be re-used on subsequent renders.
        if (firstScopeRender) {
            const part = parts.get(renderContainer);
            parts.delete(renderContainer);
            // ShadyCSS might have style sheets (e.g. from `prepareAdoptedCssText`)
            // that should apply to `renderContainer` even if the rendered value is
            // not a TemplateInstance. However, it will only insert scoped styles
            // into the document if `prepareTemplateStyles` has already been called
            // for the given scope name.
            const template = part.value instanceof TemplateInstance ?
                part.value.template :
                undefined;
            prepareTemplateStyles(scopeName, renderContainer, template);
            removeNodes(container, container.firstChild);
            container.appendChild(renderContainer);
            parts.set(container, part);
        }
        // After elements have hit the DOM, update styling if this is the
        // initial render to this container.
        // This is needed whenever dynamic changes are made so it would be
        // safest to do every render; however, this would regress performance
        // so we leave it up to the user to call `ShadyCSS.styleElement`
        // for dynamic changes.
        if (!hasRendered && needsScoping) {
            window.ShadyCSS.styleElement(container.host);
        }
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    var _a;
    /**
     * When using Closure Compiler, JSCompiler_renameProperty(property, object) is
     * replaced at compile time by the munged name for object[property]. We cannot
     * alias this function, so we have to use a small shim that has the same
     * behavior when not compiling.
     */
    window.JSCompiler_renameProperty =
        (prop, _obj) => prop;
    const defaultConverter = {
        toAttribute(value, type) {
            switch (type) {
                case Boolean:
                    return value ? '' : null;
                case Object:
                case Array:
                    // if the value is `null` or `undefined` pass this through
                    // to allow removing/no change behavior.
                    return value == null ? value : JSON.stringify(value);
            }
            return value;
        },
        fromAttribute(value, type) {
            switch (type) {
                case Boolean:
                    return value !== null;
                case Number:
                    return value === null ? null : Number(value);
                case Object:
                case Array:
                    return JSON.parse(value);
            }
            return value;
        }
    };
    /**
     * Change function that returns true if `value` is different from `oldValue`.
     * This method is used as the default for a property's `hasChanged` function.
     */
    const notEqual = (value, old) => {
        // This ensures (old==NaN, value==NaN) always returns false
        return old !== value && (old === old || value === value);
    };
    const defaultPropertyDeclaration = {
        attribute: true,
        type: String,
        converter: defaultConverter,
        reflect: false,
        hasChanged: notEqual
    };
    const microtaskPromise = Promise.resolve(true);
    const STATE_HAS_UPDATED = 1;
    const STATE_UPDATE_REQUESTED = 1 << 2;
    const STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3;
    const STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4;
    const STATE_HAS_CONNECTED = 1 << 5;
    /**
     * The Closure JS Compiler doesn't currently have good support for static
     * property semantics where "this" is dynamic (e.g.
     * https://github.com/google/closure-compiler/issues/3177 and others) so we use
     * this hack to bypass any rewriting by the compiler.
     */
    const finalized = 'finalized';
    /**
     * Base element class which manages element properties and attributes. When
     * properties change, the `update` method is asynchronously called. This method
     * should be supplied by subclassers to render updates as desired.
     */
    class UpdatingElement extends HTMLElement {
        constructor() {
            super();
            this._updateState = 0;
            this._instanceProperties = undefined;
            this._updatePromise = microtaskPromise;
            this._hasConnectedResolver = undefined;
            /**
             * Map with keys for any properties that have changed since the last
             * update cycle with previous values.
             */
            this._changedProperties = new Map();
            /**
             * Map with keys of properties that should be reflected when updated.
             */
            this._reflectingProperties = undefined;
            this.initialize();
        }
        /**
         * Returns a list of attributes corresponding to the registered properties.
         * @nocollapse
         */
        static get observedAttributes() {
            // note: piggy backing on this to ensure we're finalized.
            this.finalize();
            const attributes = [];
            // Use forEach so this works even if for/of loops are compiled to for loops
            // expecting arrays
            this._classProperties.forEach((v, p) => {
                const attr = this._attributeNameForProperty(p, v);
                if (attr !== undefined) {
                    this._attributeToPropertyMap.set(attr, p);
                    attributes.push(attr);
                }
            });
            return attributes;
        }
        /**
         * Ensures the private `_classProperties` property metadata is created.
         * In addition to `finalize` this is also called in `createProperty` to
         * ensure the `@property` decorator can add property metadata.
         */
        /** @nocollapse */
        static _ensureClassProperties() {
            // ensure private storage for property declarations.
            if (!this.hasOwnProperty(JSCompiler_renameProperty('_classProperties', this))) {
                this._classProperties = new Map();
                // NOTE: Workaround IE11 not supporting Map constructor argument.
                const superProperties = Object.getPrototypeOf(this)._classProperties;
                if (superProperties !== undefined) {
                    superProperties.forEach((v, k) => this._classProperties.set(k, v));
                }
            }
        }
        /**
         * Creates a property accessor on the element prototype if one does not exist.
         * The property setter calls the property's `hasChanged` property option
         * or uses a strict identity check to determine whether or not to request
         * an update.
         * @nocollapse
         */
        static createProperty(name, options = defaultPropertyDeclaration) {
            // Note, since this can be called by the `@property` decorator which
            // is called before `finalize`, we ensure storage exists for property
            // metadata.
            this._ensureClassProperties();
            this._classProperties.set(name, options);
            // Do not generate an accessor if the prototype already has one, since
            // it would be lost otherwise and that would never be the user's intention;
            // Instead, we expect users to call `requestUpdate` themselves from
            // user-defined accessors. Note that if the super has an accessor we will
            // still overwrite it
            if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
                return;
            }
            const key = typeof name === 'symbol' ? Symbol() : `__${name}`;
            Object.defineProperty(this.prototype, name, {
                // tslint:disable-next-line:no-any no symbol in index
                get() {
                    return this[key];
                },
                set(value) {
                    const oldValue = this[name];
                    this[key] = value;
                    this._requestUpdate(name, oldValue);
                },
                configurable: true,
                enumerable: true
            });
        }
        /**
         * Creates property accessors for registered properties and ensures
         * any superclasses are also finalized.
         * @nocollapse
         */
        static finalize() {
            // finalize any superclasses
            const superCtor = Object.getPrototypeOf(this);
            if (!superCtor.hasOwnProperty(finalized)) {
                superCtor.finalize();
            }
            this[finalized] = true;
            this._ensureClassProperties();
            // initialize Map populated in observedAttributes
            this._attributeToPropertyMap = new Map();
            // make any properties
            // Note, only process "own" properties since this element will inherit
            // any properties defined on the superClass, and finalization ensures
            // the entire prototype chain is finalized.
            if (this.hasOwnProperty(JSCompiler_renameProperty('properties', this))) {
                const props = this.properties;
                // support symbols in properties (IE11 does not support this)
                const propKeys = [
                    ...Object.getOwnPropertyNames(props),
                    ...(typeof Object.getOwnPropertySymbols === 'function') ?
                        Object.getOwnPropertySymbols(props) :
                        []
                ];
                // This for/of is ok because propKeys is an array
                for (const p of propKeys) {
                    // note, use of `any` is due to TypeSript lack of support for symbol in
                    // index types
                    // tslint:disable-next-line:no-any no symbol in index
                    this.createProperty(p, props[p]);
                }
            }
        }
        /**
         * Returns the property name for the given attribute `name`.
         * @nocollapse
         */
        static _attributeNameForProperty(name, options) {
            const attribute = options.attribute;
            return attribute === false ?
                undefined :
                (typeof attribute === 'string' ?
                    attribute :
                    (typeof name === 'string' ? name.toLowerCase() : undefined));
        }
        /**
         * Returns true if a property should request an update.
         * Called when a property value is set and uses the `hasChanged`
         * option for the property if present or a strict identity check.
         * @nocollapse
         */
        static _valueHasChanged(value, old, hasChanged = notEqual) {
            return hasChanged(value, old);
        }
        /**
         * Returns the property value for the given attribute value.
         * Called via the `attributeChangedCallback` and uses the property's
         * `converter` or `converter.fromAttribute` property option.
         * @nocollapse
         */
        static _propertyValueFromAttribute(value, options) {
            const type = options.type;
            const converter = options.converter || defaultConverter;
            const fromAttribute = (typeof converter === 'function' ? converter : converter.fromAttribute);
            return fromAttribute ? fromAttribute(value, type) : value;
        }
        /**
         * Returns the attribute value for the given property value. If this
         * returns undefined, the property will *not* be reflected to an attribute.
         * If this returns null, the attribute will be removed, otherwise the
         * attribute will be set to the value.
         * This uses the property's `reflect` and `type.toAttribute` property options.
         * @nocollapse
         */
        static _propertyValueToAttribute(value, options) {
            if (options.reflect === undefined) {
                return;
            }
            const type = options.type;
            const converter = options.converter;
            const toAttribute = converter && converter.toAttribute ||
                defaultConverter.toAttribute;
            return toAttribute(value, type);
        }
        /**
         * Performs element initialization. By default captures any pre-set values for
         * registered properties.
         */
        initialize() {
            this._saveInstanceProperties();
            // ensures first update will be caught by an early access of
            // `updateComplete`
            this._requestUpdate();
        }
        /**
         * Fixes any properties set on the instance before upgrade time.
         * Otherwise these would shadow the accessor and break these properties.
         * The properties are stored in a Map which is played back after the
         * constructor runs. Note, on very old versions of Safari (<=9) or Chrome
         * (<=41), properties created for native platform properties like (`id` or
         * `name`) may not have default values set in the element constructor. On
         * these browsers native properties appear on instances and therefore their
         * default value will overwrite any element default (e.g. if the element sets
         * this.id = 'id' in the constructor, the 'id' will become '' since this is
         * the native platform default).
         */
        _saveInstanceProperties() {
            // Use forEach so this works even if for/of loops are compiled to for loops
            // expecting arrays
            this.constructor
                ._classProperties.forEach((_v, p) => {
                if (this.hasOwnProperty(p)) {
                    const value = this[p];
                    delete this[p];
                    if (!this._instanceProperties) {
                        this._instanceProperties = new Map();
                    }
                    this._instanceProperties.set(p, value);
                }
            });
        }
        /**
         * Applies previously saved instance properties.
         */
        _applyInstanceProperties() {
            // Use forEach so this works even if for/of loops are compiled to for loops
            // expecting arrays
            // tslint:disable-next-line:no-any
            this._instanceProperties.forEach((v, p) => this[p] = v);
            this._instanceProperties = undefined;
        }
        connectedCallback() {
            this._updateState = this._updateState | STATE_HAS_CONNECTED;
            // Ensure first connection completes an update. Updates cannot complete
            // before connection and if one is pending connection the
            // `_hasConnectionResolver` will exist. If so, resolve it to complete the
            // update, otherwise requestUpdate.
            if (this._hasConnectedResolver) {
                this._hasConnectedResolver();
                this._hasConnectedResolver = undefined;
            }
        }
        /**
         * Allows for `super.disconnectedCallback()` in extensions while
         * reserving the possibility of making non-breaking feature additions
         * when disconnecting at some point in the future.
         */
        disconnectedCallback() {
        }
        /**
         * Synchronizes property values when attributes change.
         */
        attributeChangedCallback(name, old, value) {
            if (old !== value) {
                this._attributeToProperty(name, value);
            }
        }
        _propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
            const ctor = this.constructor;
            const attr = ctor._attributeNameForProperty(name, options);
            if (attr !== undefined) {
                const attrValue = ctor._propertyValueToAttribute(value, options);
                // an undefined value does not change the attribute.
                if (attrValue === undefined) {
                    return;
                }
                // Track if the property is being reflected to avoid
                // setting the property again via `attributeChangedCallback`. Note:
                // 1. this takes advantage of the fact that the callback is synchronous.
                // 2. will behave incorrectly if multiple attributes are in the reaction
                // stack at time of calling. However, since we process attributes
                // in `update` this should not be possible (or an extreme corner case
                // that we'd like to discover).
                // mark state reflecting
                this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE;
                if (attrValue == null) {
                    this.removeAttribute(attr);
                }
                else {
                    this.setAttribute(attr, attrValue);
                }
                // mark state not reflecting
                this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE;
            }
        }
        _attributeToProperty(name, value) {
            // Use tracking info to avoid deserializing attribute value if it was
            // just set from a property setter.
            if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
                return;
            }
            const ctor = this.constructor;
            const propName = ctor._attributeToPropertyMap.get(name);
            if (propName !== undefined) {
                const options = ctor._classProperties.get(propName) || defaultPropertyDeclaration;
                // mark state reflecting
                this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY;
                this[propName] =
                    // tslint:disable-next-line:no-any
                    ctor._propertyValueFromAttribute(value, options);
                // mark state not reflecting
                this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY;
            }
        }
        /**
         * This private version of `requestUpdate` does not access or return the
         * `updateComplete` promise. This promise can be overridden and is therefore
         * not free to access.
         */
        _requestUpdate(name, oldValue) {
            let shouldRequestUpdate = true;
            // If we have a property key, perform property update steps.
            if (name !== undefined) {
                const ctor = this.constructor;
                const options = ctor._classProperties.get(name) || defaultPropertyDeclaration;
                if (ctor._valueHasChanged(this[name], oldValue, options.hasChanged)) {
                    if (!this._changedProperties.has(name)) {
                        this._changedProperties.set(name, oldValue);
                    }
                    // Add to reflecting properties set.
                    // Note, it's important that every change has a chance to add the
                    // property to `_reflectingProperties`. This ensures setting
                    // attribute + property reflects correctly.
                    if (options.reflect === true &&
                        !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)) {
                        if (this._reflectingProperties === undefined) {
                            this._reflectingProperties = new Map();
                        }
                        this._reflectingProperties.set(name, options);
                    }
                }
                else {
                    // Abort the request if the property should not be considered changed.
                    shouldRequestUpdate = false;
                }
            }
            if (!this._hasRequestedUpdate && shouldRequestUpdate) {
                this._enqueueUpdate();
            }
        }
        /**
         * Requests an update which is processed asynchronously. This should
         * be called when an element should update based on some state not triggered
         * by setting a property. In this case, pass no arguments. It should also be
         * called when manually implementing a property setter. In this case, pass the
         * property `name` and `oldValue` to ensure that any configured property
         * options are honored. Returns the `updateComplete` Promise which is resolved
         * when the update completes.
         *
         * @param name {PropertyKey} (optional) name of requesting property
         * @param oldValue {any} (optional) old value of requesting property
         * @returns {Promise} A Promise that is resolved when the update completes.
         */
        requestUpdate(name, oldValue) {
            this._requestUpdate(name, oldValue);
            return this.updateComplete;
        }
        /**
         * Sets up the element to asynchronously update.
         */
        async _enqueueUpdate() {
            // Mark state updating...
            this._updateState = this._updateState | STATE_UPDATE_REQUESTED;
            let resolve;
            let reject;
            const previousUpdatePromise = this._updatePromise;
            this._updatePromise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            });
            try {
                // Ensure any previous update has resolved before updating.
                // This `await` also ensures that property changes are batched.
                await previousUpdatePromise;
            }
            catch (e) {
                // Ignore any previous errors. We only care that the previous cycle is
                // done. Any error should have been handled in the previous update.
            }
            // Make sure the element has connected before updating.
            if (!this._hasConnected) {
                await new Promise((res) => this._hasConnectedResolver = res);
            }
            try {
                const result = this.performUpdate();
                // If `performUpdate` returns a Promise, we await it. This is done to
                // enable coordinating updates with a scheduler. Note, the result is
                // checked to avoid delaying an additional microtask unless we need to.
                if (result != null) {
                    await result;
                }
            }
            catch (e) {
                reject(e);
            }
            resolve(!this._hasRequestedUpdate);
        }
        get _hasConnected() {
            return (this._updateState & STATE_HAS_CONNECTED);
        }
        get _hasRequestedUpdate() {
            return (this._updateState & STATE_UPDATE_REQUESTED);
        }
        get hasUpdated() {
            return (this._updateState & STATE_HAS_UPDATED);
        }
        /**
         * Performs an element update. Note, if an exception is thrown during the
         * update, `firstUpdated` and `updated` will not be called.
         *
         * You can override this method to change the timing of updates. If this
         * method is overridden, `super.performUpdate()` must be called.
         *
         * For instance, to schedule updates to occur just before the next frame:
         *
         * ```
         * protected async performUpdate(): Promise<unknown> {
         *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
         *   super.performUpdate();
         * }
         * ```
         */
        performUpdate() {
            // Mixin instance properties once, if they exist.
            if (this._instanceProperties) {
                this._applyInstanceProperties();
            }
            let shouldUpdate = false;
            const changedProperties = this._changedProperties;
            try {
                shouldUpdate = this.shouldUpdate(changedProperties);
                if (shouldUpdate) {
                    this.update(changedProperties);
                }
            }
            catch (e) {
                // Prevent `firstUpdated` and `updated` from running when there's an
                // update exception.
                shouldUpdate = false;
                throw e;
            }
            finally {
                // Ensure element can accept additional updates after an exception.
                this._markUpdated();
            }
            if (shouldUpdate) {
                if (!(this._updateState & STATE_HAS_UPDATED)) {
                    this._updateState = this._updateState | STATE_HAS_UPDATED;
                    this.firstUpdated(changedProperties);
                }
                this.updated(changedProperties);
            }
        }
        _markUpdated() {
            this._changedProperties = new Map();
            this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED;
        }
        /**
         * Returns a Promise that resolves when the element has completed updating.
         * The Promise value is a boolean that is `true` if the element completed the
         * update without triggering another update. The Promise result is `false` if
         * a property was set inside `updated()`. If the Promise is rejected, an
         * exception was thrown during the update.
         *
         * To await additional asynchronous work, override the `_getUpdateComplete`
         * method. For example, it is sometimes useful to await a rendered element
         * before fulfilling this Promise. To do this, first await
         * `super._getUpdateComplete()`, then any subsequent state.
         *
         * @returns {Promise} The Promise returns a boolean that indicates if the
         * update resolved without triggering another update.
         */
        get updateComplete() {
            return this._getUpdateComplete();
        }
        /**
         * Override point for the `updateComplete` promise.
         *
         * It is not safe to override the `updateComplete` getter directly due to a
         * limitation in TypeScript which means it is not possible to call a
         * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
         * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
         * This method should be overridden instead. For example:
         *
         *   class MyElement extends LitElement {
         *     async _getUpdateComplete() {
         *       await super._getUpdateComplete();
         *       await this._myChild.updateComplete;
         *     }
         *   }
         */
        _getUpdateComplete() {
            return this._updatePromise;
        }
        /**
         * Controls whether or not `update` should be called when the element requests
         * an update. By default, this method always returns `true`, but this can be
         * customized to control when to update.
         *
         * * @param _changedProperties Map of changed properties with old values
         */
        shouldUpdate(_changedProperties) {
            return true;
        }
        /**
         * Updates the element. This method reflects property values to attributes.
         * It can be overridden to render and keep updated element DOM.
         * Setting properties inside this method will *not* trigger
         * another update.
         *
         * * @param _changedProperties Map of changed properties with old values
         */
        update(_changedProperties) {
            if (this._reflectingProperties !== undefined &&
                this._reflectingProperties.size > 0) {
                // Use forEach so this works even if for/of loops are compiled to for
                // loops expecting arrays
                this._reflectingProperties.forEach((v, k) => this._propertyToAttribute(k, this[k], v));
                this._reflectingProperties = undefined;
            }
        }
        /**
         * Invoked whenever the element is updated. Implement to perform
         * post-updating tasks via DOM APIs, for example, focusing an element.
         *
         * Setting properties inside this method will trigger the element to update
         * again after this update cycle completes.
         *
         * * @param _changedProperties Map of changed properties with old values
         */
        updated(_changedProperties) {
        }
        /**
         * Invoked when the element is first updated. Implement to perform one time
         * work on the element after update.
         *
         * Setting properties inside this method will trigger the element to update
         * again after this update cycle completes.
         *
         * * @param _changedProperties Map of changed properties with old values
         */
        firstUpdated(_changedProperties) {
        }
    }
    _a = finalized;
    /**
     * Marks class as having finished creating properties.
     */
    UpdatingElement[_a] = true;

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const legacyCustomElement = (tagName, clazz) => {
        window.customElements.define(tagName, clazz);
        // Cast as any because TS doesn't recognize the return type as being a
        // subtype of the decorated class when clazz is typed as
        // `Constructor<HTMLElement>` for some reason.
        // `Constructor<HTMLElement>` is helpful to make sure the decorator is
        // applied to elements however.
        // tslint:disable-next-line:no-any
        return clazz;
    };
    const standardCustomElement = (tagName, descriptor) => {
        const { kind, elements } = descriptor;
        return {
            kind,
            elements,
            // This callback is called once the class is otherwise fully defined
            finisher(clazz) {
                window.customElements.define(tagName, clazz);
            }
        };
    };
    /**
     * Class decorator factory that defines the decorated class as a custom element.
     *
     * @param tagName the name of the custom element to define
     */
    const customElement = (tagName) => (classOrDescriptor) => (typeof classOrDescriptor === 'function') ?
        legacyCustomElement(tagName, classOrDescriptor) :
        standardCustomElement(tagName, classOrDescriptor);
    const standardProperty = (options, element) => {
        // When decorating an accessor, pass it through and add property metadata.
        // Note, the `hasOwnProperty` check in `createProperty` ensures we don't
        // stomp over the user's accessor.
        if (element.kind === 'method' && element.descriptor &&
            !('value' in element.descriptor)) {
            return Object.assign({}, element, { finisher(clazz) {
                    clazz.createProperty(element.key, options);
                } });
        }
        else {
            // createProperty() takes care of defining the property, but we still
            // must return some kind of descriptor, so return a descriptor for an
            // unused prototype field. The finisher calls createProperty().
            return {
                kind: 'field',
                key: Symbol(),
                placement: 'own',
                descriptor: {},
                // When @babel/plugin-proposal-decorators implements initializers,
                // do this instead of the initializer below. See:
                // https://github.com/babel/babel/issues/9260 extras: [
                //   {
                //     kind: 'initializer',
                //     placement: 'own',
                //     initializer: descriptor.initializer,
                //   }
                // ],
                initializer() {
                    if (typeof element.initializer === 'function') {
                        this[element.key] = element.initializer.call(this);
                    }
                },
                finisher(clazz) {
                    clazz.createProperty(element.key, options);
                }
            };
        }
    };
    const legacyProperty = (options, proto, name) => {
        proto.constructor
            .createProperty(name, options);
    };
    /**
     * A property decorator which creates a LitElement property which reflects a
     * corresponding attribute value. A `PropertyDeclaration` may optionally be
     * supplied to configure property features.
     *
     * @ExportDecoratedItems
     */
    function property(options) {
        // tslint:disable-next-line:no-any decorator
        return (protoOrDescriptor, name) => (name !== undefined) ?
            legacyProperty(options, protoOrDescriptor, name) :
            standardProperty(options, protoOrDescriptor);
    }
    /**
     * A property decorator that converts a class property into a getter that
     * executes a querySelector on the element's renderRoot.
     *
     * @ExportDecoratedItems
     */
    function query(selector) {
        return (protoOrDescriptor, 
        // tslint:disable-next-line:no-any decorator
        name) => {
            const descriptor = {
                get() {
                    return this.renderRoot.querySelector(selector);
                },
                enumerable: true,
                configurable: true,
            };
            return (name !== undefined) ?
                legacyQuery(descriptor, protoOrDescriptor, name) :
                standardQuery(descriptor, protoOrDescriptor);
        };
    }
    const legacyQuery = (descriptor, proto, name) => {
        Object.defineProperty(proto, name, descriptor);
    };
    const standardQuery = (descriptor, element) => ({
        kind: 'method',
        placement: 'prototype',
        key: element.key,
        descriptor,
    });

    /**
    @license
    Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
    This code may only be used under the BSD style license found at
    http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
    http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
    found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
    part of the polymer project is also subject to an additional IP rights grant
    found at http://polymer.github.io/PATENTS.txt
    */
    const supportsAdoptingStyleSheets = ('adoptedStyleSheets' in Document.prototype) &&
        ('replace' in CSSStyleSheet.prototype);
    const constructionToken = Symbol();
    class CSSResult {
        constructor(cssText, safeToken) {
            if (safeToken !== constructionToken) {
                throw new Error('CSSResult is not constructable. Use `unsafeCSS` or `css` instead.');
            }
            this.cssText = cssText;
        }
        // Note, this is a getter so that it's lazy. In practice, this means
        // stylesheets are not created until the first element instance is made.
        get styleSheet() {
            if (this._styleSheet === undefined) {
                // Note, if `adoptedStyleSheets` is supported then we assume CSSStyleSheet
                // is constructable.
                if (supportsAdoptingStyleSheets) {
                    this._styleSheet = new CSSStyleSheet();
                    this._styleSheet.replaceSync(this.cssText);
                }
                else {
                    this._styleSheet = null;
                }
            }
            return this._styleSheet;
        }
        toString() {
            return this.cssText;
        }
    }
    const textFromCSSResult = (value) => {
        if (value instanceof CSSResult) {
            return value.cssText;
        }
        else if (typeof value === 'number') {
            return value;
        }
        else {
            throw new Error(`Value passed to 'css' function must be a 'css' function result: ${value}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`);
        }
    };
    /**
     * Template tag which which can be used with LitElement's `style` property to
     * set element styles. For security reasons, only literal string values may be
     * used. To incorporate non-literal values `unsafeCSS` may be used inside a
     * template string part.
     */
    const css = (strings, ...values) => {
        const cssText = values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
        return new CSSResult(cssText, constructionToken);
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // IMPORTANT: do not change the property name or the assignment expression.
    // This line will be used in regexes to search for LitElement usage.
    // TODO(justinfagnani): inject version number at build time
    (window['litElementVersions'] || (window['litElementVersions'] = []))
        .push('2.2.1');
    /**
     * Minimal implementation of Array.prototype.flat
     * @param arr the array to flatten
     * @param result the accumlated result
     */
    function arrayFlat(styles, result = []) {
        for (let i = 0, length = styles.length; i < length; i++) {
            const value = styles[i];
            if (Array.isArray(value)) {
                arrayFlat(value, result);
            }
            else {
                result.push(value);
            }
        }
        return result;
    }
    /** Deeply flattens styles array. Uses native flat if available. */
    const flattenStyles = (styles) => styles.flat ? styles.flat(Infinity) : arrayFlat(styles);
    class LitElement extends UpdatingElement {
        /** @nocollapse */
        static finalize() {
            // The Closure JS Compiler does not always preserve the correct "this"
            // when calling static super methods (b/137460243), so explicitly bind.
            super.finalize.call(this);
            // Prepare styling that is stamped at first render time. Styling
            // is built from user provided `styles` or is inherited from the superclass.
            this._styles =
                this.hasOwnProperty(JSCompiler_renameProperty('styles', this)) ?
                    this._getUniqueStyles() :
                    this._styles || [];
        }
        /** @nocollapse */
        static _getUniqueStyles() {
            // Take care not to call `this.styles` multiple times since this generates
            // new CSSResults each time.
            // TODO(sorvell): Since we do not cache CSSResults by input, any
            // shared styles will generate new stylesheet objects, which is wasteful.
            // This should be addressed when a browser ships constructable
            // stylesheets.
            const userStyles = this.styles;
            const styles = [];
            if (Array.isArray(userStyles)) {
                const flatStyles = flattenStyles(userStyles);
                // As a performance optimization to avoid duplicated styling that can
                // occur especially when composing via subclassing, de-duplicate styles
                // preserving the last item in the list. The last item is kept to
                // try to preserve cascade order with the assumption that it's most
                // important that last added styles override previous styles.
                const styleSet = flatStyles.reduceRight((set, s) => {
                    set.add(s);
                    // on IE set.add does not return the set.
                    return set;
                }, new Set());
                // Array.from does not work on Set in IE
                styleSet.forEach((v) => styles.unshift(v));
            }
            else if (userStyles) {
                styles.push(userStyles);
            }
            return styles;
        }
        /**
         * Performs element initialization. By default this calls `createRenderRoot`
         * to create the element `renderRoot` node and captures any pre-set values for
         * registered properties.
         */
        initialize() {
            super.initialize();
            this.renderRoot =
                this.createRenderRoot();
            // Note, if renderRoot is not a shadowRoot, styles would/could apply to the
            // element's getRootNode(). While this could be done, we're choosing not to
            // support this now since it would require different logic around de-duping.
            if (window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot) {
                this.adoptStyles();
            }
        }
        /**
         * Returns the node into which the element should render and by default
         * creates and returns an open shadowRoot. Implement to customize where the
         * element's DOM is rendered. For example, to render into the element's
         * childNodes, return `this`.
         * @returns {Element|DocumentFragment} Returns a node into which to render.
         */
        createRenderRoot() {
            return this.attachShadow({ mode: 'open' });
        }
        /**
         * Applies styling to the element shadowRoot using the `static get styles`
         * property. Styling will apply using `shadowRoot.adoptedStyleSheets` where
         * available and will fallback otherwise. When Shadow DOM is polyfilled,
         * ShadyCSS scopes styles and adds them to the document. When Shadow DOM
         * is available but `adoptedStyleSheets` is not, styles are appended to the
         * end of the `shadowRoot` to [mimic spec
         * behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
         */
        adoptStyles() {
            const styles = this.constructor._styles;
            if (styles.length === 0) {
                return;
            }
            // There are three separate cases here based on Shadow DOM support.
            // (1) shadowRoot polyfilled: use ShadyCSS
            // (2) shadowRoot.adoptedStyleSheets available: use it.
            // (3) shadowRoot.adoptedStyleSheets polyfilled: append styles after
            // rendering
            if (window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow) {
                window.ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map((s) => s.cssText), this.localName);
            }
            else if (supportsAdoptingStyleSheets) {
                this.renderRoot.adoptedStyleSheets =
                    styles.map((s) => s.styleSheet);
            }
            else {
                // This must be done after rendering so the actual style insertion is done
                // in `update`.
                this._needsShimAdoptedStyleSheets = true;
            }
        }
        connectedCallback() {
            super.connectedCallback();
            // Note, first update/render handles styleElement so we only call this if
            // connected after first update.
            if (this.hasUpdated && window.ShadyCSS !== undefined) {
                window.ShadyCSS.styleElement(this);
            }
        }
        /**
         * Updates the element. This method reflects property values to attributes
         * and calls `render` to render DOM via lit-html. Setting properties inside
         * this method will *not* trigger another update.
         * * @param _changedProperties Map of changed properties with old values
         */
        update(changedProperties) {
            super.update(changedProperties);
            const templateResult = this.render();
            if (templateResult instanceof TemplateResult) {
                this.constructor
                    .render(templateResult, this.renderRoot, { scopeName: this.localName, eventContext: this });
            }
            // When native Shadow DOM is used but adoptedStyles are not supported,
            // insert styling after rendering to ensure adoptedStyles have highest
            // priority.
            if (this._needsShimAdoptedStyleSheets) {
                this._needsShimAdoptedStyleSheets = false;
                this.constructor._styles.forEach((s) => {
                    const style = document.createElement('style');
                    style.textContent = s.cssText;
                    this.renderRoot.appendChild(style);
                });
            }
        }
        /**
         * Invoked on each update to perform rendering tasks. This method must return
         * a lit-html TemplateResult. Setting properties inside this method will *not*
         * trigger the element to update.
         */
        render() {
        }
    }
    /**
     * Ensure this class is marked as `finalized` as an optimization ensuring
     * it will not needlessly try to `finalize`.
     *
     * Note this property name is a string to prevent breaking Closure JS Compiler
     * optimizations. See updating-element.ts for more information.
     */
    LitElement['finalized'] = true;
    /**
     * Render method used to render the lit-html TemplateResult to the element's
     * DOM.
     * @param {TemplateResult} Template to render.
     * @param {Element|DocumentFragment} Node into which to render.
     * @param {String} Element name.
     * @nocollapse
     */
    LitElement.render = render$1;

    var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    const BaseCSS = css `
:host {
  opacity: 0;
}
:host(.wired-rendered) {
  opacity: 1;
}
#overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}
svg {
  display: block;
}
path {
  stroke: currentColor;
  stroke-width: 0.7;
  fill: transparent;
}
.hidden {
  display: none !important;
}
`;
    class WiredBase extends LitElement {
        constructor() {
            super(...arguments);
            this.lastSize = [0, 0];
        }
        updated(_changed) {
            this.wiredRender();
        }
        wiredRender(force = false) {
            if (this.svg) {
                const size = this.canvasSize();
                if ((!force) && (size[0] === this.lastSize[0]) && (size[1] === this.lastSize[1])) {
                    return;
                }
                while (this.svg.hasChildNodes()) {
                    this.svg.removeChild(this.svg.lastChild);
                }
                this.svg.setAttribute('width', `${size[0]}`);
                this.svg.setAttribute('height', `${size[1]}`);
                this.draw(this.svg, size);
                this.lastSize = size;
                this.classList.add('wired-rendered');
            }
        }
    }
    __decorate([
        query('svg'),
        __metadata("design:type", SVGSVGElement)
    ], WiredBase.prototype, "svg", void 0);

    class Segment {
        constructor(p1, p2) {
            this.xi = Number.MAX_VALUE;
            this.yi = Number.MAX_VALUE;
            this.px1 = p1[0];
            this.py1 = p1[1];
            this.px2 = p2[0];
            this.py2 = p2[1];
            this.a = this.py2 - this.py1;
            this.b = this.px1 - this.px2;
            this.c = this.px2 * this.py1 - this.px1 * this.py2;
            this._undefined = ((this.a === 0) && (this.b === 0) && (this.c === 0));
        }
        isUndefined() {
            return this._undefined;
        }
        intersects(otherSegment) {
            if (this.isUndefined() || otherSegment.isUndefined()) {
                return false;
            }
            let grad1 = Number.MAX_VALUE;
            let grad2 = Number.MAX_VALUE;
            let int1 = 0, int2 = 0;
            const a = this.a, b = this.b, c = this.c;
            if (Math.abs(b) > 0.00001) {
                grad1 = -a / b;
                int1 = -c / b;
            }
            if (Math.abs(otherSegment.b) > 0.00001) {
                grad2 = -otherSegment.a / otherSegment.b;
                int2 = -otherSegment.c / otherSegment.b;
            }
            if (grad1 === Number.MAX_VALUE) {
                if (grad2 === Number.MAX_VALUE) {
                    if ((-c / a) !== (-otherSegment.c / otherSegment.a)) {
                        return false;
                    }
                    if ((this.py1 >= Math.min(otherSegment.py1, otherSegment.py2)) && (this.py1 <= Math.max(otherSegment.py1, otherSegment.py2))) {
                        this.xi = this.px1;
                        this.yi = this.py1;
                        return true;
                    }
                    if ((this.py2 >= Math.min(otherSegment.py1, otherSegment.py2)) && (this.py2 <= Math.max(otherSegment.py1, otherSegment.py2))) {
                        this.xi = this.px2;
                        this.yi = this.py2;
                        return true;
                    }
                    return false;
                }
                this.xi = this.px1;
                this.yi = (grad2 * this.xi + int2);
                if (((this.py1 - this.yi) * (this.yi - this.py2) < -0.00001) || ((otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001)) {
                    return false;
                }
                if (Math.abs(otherSegment.a) < 0.00001) {
                    if ((otherSegment.px1 - this.xi) * (this.xi - otherSegment.px2) < -0.00001) {
                        return false;
                    }
                    return true;
                }
                return true;
            }
            if (grad2 === Number.MAX_VALUE) {
                this.xi = otherSegment.px1;
                this.yi = grad1 * this.xi + int1;
                if (((otherSegment.py1 - this.yi) * (this.yi - otherSegment.py2) < -0.00001) || ((this.py1 - this.yi) * (this.yi - this.py2) < -0.00001)) {
                    return false;
                }
                if (Math.abs(a) < 0.00001) {
                    if ((this.px1 - this.xi) * (this.xi - this.px2) < -0.00001) {
                        return false;
                    }
                    return true;
                }
                return true;
            }
            if (grad1 === grad2) {
                if (int1 !== int2) {
                    return false;
                }
                if ((this.px1 >= Math.min(otherSegment.px1, otherSegment.px2)) && (this.px1 <= Math.max(otherSegment.py1, otherSegment.py2))) {
                    this.xi = this.px1;
                    this.yi = this.py1;
                    return true;
                }
                if ((this.px2 >= Math.min(otherSegment.px1, otherSegment.px2)) && (this.px2 <= Math.max(otherSegment.px1, otherSegment.px2))) {
                    this.xi = this.px2;
                    this.yi = this.py2;
                    return true;
                }
                return false;
            }
            this.xi = ((int2 - int1) / (grad1 - grad2));
            this.yi = (grad1 * this.xi + int1);
            if (((this.px1 - this.xi) * (this.xi - this.px2) < -0.00001) || ((otherSegment.px1 - this.xi) * (this.xi - otherSegment.px2) < -0.00001)) {
                return false;
            }
            return true;
        }
    }

    class HachureIterator {
        constructor(top, bottom, left, right, gap, sinAngle, cosAngle, tanAngle) {
            this.deltaX = 0;
            this.hGap = 0;
            this.top = top;
            this.bottom = bottom;
            this.left = left;
            this.right = right;
            this.gap = gap;
            this.sinAngle = sinAngle;
            this.tanAngle = tanAngle;
            if (Math.abs(sinAngle) < 0.0001) {
                this.pos = left + gap;
            }
            else if (Math.abs(sinAngle) > 0.9999) {
                this.pos = top + gap;
            }
            else {
                this.deltaX = (bottom - top) * Math.abs(tanAngle);
                this.pos = left - Math.abs(this.deltaX);
                this.hGap = Math.abs(gap / cosAngle);
                this.sLeft = new Segment([left, bottom], [left, top]);
                this.sRight = new Segment([right, bottom], [right, top]);
            }
        }
        nextLine() {
            if (Math.abs(this.sinAngle) < 0.0001) {
                if (this.pos < this.right) {
                    const line = [this.pos, this.top, this.pos, this.bottom];
                    this.pos += this.gap;
                    return line;
                }
            }
            else if (Math.abs(this.sinAngle) > 0.9999) {
                if (this.pos < this.bottom) {
                    const line = [this.left, this.pos, this.right, this.pos];
                    this.pos += this.gap;
                    return line;
                }
            }
            else {
                let xLower = this.pos - this.deltaX / 2;
                let xUpper = this.pos + this.deltaX / 2;
                let yLower = this.bottom;
                let yUpper = this.top;
                if (this.pos < (this.right + this.deltaX)) {
                    while (((xLower < this.left) && (xUpper < this.left)) || ((xLower > this.right) && (xUpper > this.right))) {
                        this.pos += this.hGap;
                        xLower = this.pos - this.deltaX / 2;
                        xUpper = this.pos + this.deltaX / 2;
                        if (this.pos > (this.right + this.deltaX)) {
                            return null;
                        }
                    }
                    const s = new Segment([xLower, yLower], [xUpper, yUpper]);
                    if (this.sLeft && s.intersects(this.sLeft)) {
                        xLower = s.xi;
                        yLower = s.yi;
                    }
                    if (this.sRight && s.intersects(this.sRight)) {
                        xUpper = s.xi;
                        yUpper = s.yi;
                    }
                    if (this.tanAngle > 0) {
                        xLower = this.right - (xLower - this.left);
                        xUpper = this.right - (xUpper - this.left);
                    }
                    const line = [xLower, yLower, xUpper, yUpper];
                    this.pos += this.hGap;
                    return line;
                }
            }
            return null;
        }
    }

    function getIntersectingLines(line, points) {
        const intersections = [];
        const s1 = new Segment([line[0], line[1]], [line[2], line[3]]);
        for (let i = 0; i < points.length; i++) {
            const s2 = new Segment(points[i], points[(i + 1) % points.length]);
            if (s1.intersects(s2)) {
                intersections.push([s1.xi, s1.yi]);
            }
        }
        return intersections;
    }
    function affine(x, y, cx, cy, sinAnglePrime, cosAnglePrime, R) {
        const A = -cx * cosAnglePrime - cy * sinAnglePrime + cx;
        const B = R * (cx * sinAnglePrime - cy * cosAnglePrime) + cy;
        const C = cosAnglePrime;
        const D = sinAnglePrime;
        const E = -R * sinAnglePrime;
        const F = R * cosAnglePrime;
        return [
            A + C * x + D * y,
            B + E * x + F * y
        ];
    }
    function hachureLinesForPolygon(points, o) {
        const ret = [];
        if (points && points.length) {
            let left = points[0][0];
            let right = points[0][0];
            let top = points[0][1];
            let bottom = points[0][1];
            for (let i = 1; i < points.length; i++) {
                left = Math.min(left, points[i][0]);
                right = Math.max(right, points[i][0]);
                top = Math.min(top, points[i][1]);
                bottom = Math.max(bottom, points[i][1]);
            }
            const angle = o.hachureAngle;
            let gap = o.hachureGap;
            if (gap < 0) {
                gap = o.strokeWidth * 4;
            }
            gap = Math.max(gap, 0.1);
            const radPerDeg = Math.PI / 180;
            const hachureAngle = (angle % 180) * radPerDeg;
            const cosAngle = Math.cos(hachureAngle);
            const sinAngle = Math.sin(hachureAngle);
            const tanAngle = Math.tan(hachureAngle);
            const it = new HachureIterator(top - 1, bottom + 1, left - 1, right + 1, gap, sinAngle, cosAngle, tanAngle);
            let rect;
            while ((rect = it.nextLine()) != null) {
                const lines = getIntersectingLines(rect, points);
                for (let i = 0; i < lines.length; i++) {
                    if (i < (lines.length - 1)) {
                        const p1 = lines[i];
                        const p2 = lines[i + 1];
                        ret.push([p1, p2]);
                    }
                }
            }
        }
        return ret;
    }
    function hachureLinesForEllipse(helper, cx, cy, width, height, o) {
        const ret = [];
        let rx = Math.abs(width / 2);
        let ry = Math.abs(height / 2);
        rx += helper.randOffset(rx * 0.05, o);
        ry += helper.randOffset(ry * 0.05, o);
        const angle = o.hachureAngle;
        let gap = o.hachureGap;
        if (gap <= 0) {
            gap = o.strokeWidth * 4;
        }
        let fweight = o.fillWeight;
        if (fweight < 0) {
            fweight = o.strokeWidth / 2;
        }
        const radPerDeg = Math.PI / 180;
        const hachureAngle = (angle % 180) * radPerDeg;
        const tanAngle = Math.tan(hachureAngle);
        const aspectRatio = ry / rx;
        const hyp = Math.sqrt(aspectRatio * tanAngle * aspectRatio * tanAngle + 1);
        const sinAnglePrime = aspectRatio * tanAngle / hyp;
        const cosAnglePrime = 1 / hyp;
        const gapPrime = gap / ((rx * ry / Math.sqrt((ry * cosAnglePrime) * (ry * cosAnglePrime) + (rx * sinAnglePrime) * (rx * sinAnglePrime))) / rx);
        let halfLen = Math.sqrt((rx * rx) - (cx - rx + gapPrime) * (cx - rx + gapPrime));
        for (let xPos = cx - rx + gapPrime; xPos < cx + rx; xPos += gapPrime) {
            halfLen = Math.sqrt((rx * rx) - (cx - xPos) * (cx - xPos));
            const p1 = affine(xPos, cy - halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
            const p2 = affine(xPos, cy + halfLen, cx, cy, sinAnglePrime, cosAnglePrime, aspectRatio);
            ret.push([p1, p2]);
        }
        return ret;
    }

    const __maxRandomnessOffset = 2;
    const __roughness = 1;
    const __bowing = 0.85;
    const __curveTightness = 0;
    const __curveStepCount = 9;
    class WiresPath {
        constructor() {
            this.p = '';
        }
        get value() {
            return this.p.trim();
        }
        moveTo(x, y) {
            this.p = `${this.p}M ${x} ${y} `;
        }
        bcurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
            this.p = `${this.p}C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x} ${y} `;
        }
    }
    function svgNode(tagName, attributes) {
        const n = document.createElementNS('http://www.w3.org/2000/svg', tagName);
        if (attributes) {
            for (const p in attributes) {
                n.setAttributeNS(null, p, attributes[p]);
            }
        }
        return n;
    }
    function _getOffset(min, max) {
        return __roughness * ((Math.random() * (max - min)) + min);
    }
    function _line(x1, y1, x2, y2, existingPath) {
        const lengthSq = Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
        let offset = __maxRandomnessOffset ;
        if ((offset * offset * 100) > lengthSq) {
            offset = Math.sqrt(lengthSq) / 10;
        }
        const halfOffset = offset / 2;
        const divergePoint = 0.2 + Math.random() * 0.2;
        let midDispX = __bowing * __maxRandomnessOffset * (y2 - y1) / 200;
        let midDispY = __bowing * __maxRandomnessOffset * (x1 - x2) / 200;
        midDispX = _getOffset(-midDispX, midDispX);
        midDispY = _getOffset(-midDispY, midDispY);
        const path = existingPath || new WiresPath();
        path.moveTo(x1 + _getOffset(-offset, offset), y1 + _getOffset(-offset, offset));
        path.bcurveTo(midDispX + x1 + (x2 - x1) * divergePoint + _getOffset(-offset, offset), midDispY + y1 + (y2 - y1) * divergePoint + _getOffset(-offset, offset), midDispX + x1 + 2 * (x2 - x1) * divergePoint + _getOffset(-offset, offset), midDispY + y1 + 2 * (y2 - y1) * divergePoint + _getOffset(-offset, offset), x2 + _getOffset(-offset, offset), y2 + _getOffset(-offset, offset));
        path.moveTo(x1 + _getOffset(-halfOffset, halfOffset), y1 + _getOffset(-halfOffset, halfOffset));
        path.bcurveTo(midDispX + x1 + (x2 - x1) * divergePoint + _getOffset(-halfOffset, halfOffset), midDispY + y1 + (y2 - y1) * divergePoint + _getOffset(-halfOffset, halfOffset), midDispX + x1 + 2 * (x2 - x1) * divergePoint + _getOffset(-halfOffset, halfOffset), midDispY + y1 + 2 * (y2 - y1) * divergePoint + _getOffset(-halfOffset, halfOffset), x2 + _getOffset(-halfOffset, halfOffset), y2 + _getOffset(-halfOffset, halfOffset));
        return path;
    }
    function _continuousLine(x1, y1, x2, y2, move = false, overwrite = false, path) {
        path = path || new WiresPath();
        const lengthSq = Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2);
        let offset = __maxRandomnessOffset ;
        if ((offset * offset * 100) > lengthSq) {
            offset = Math.sqrt(lengthSq) / 10;
        }
        const halfOffset = offset / 2;
        const divergePoint = 0.2 + Math.random() * 0.2;
        let midDispX = __bowing * __maxRandomnessOffset * (y2 - y1) / 200;
        let midDispY = __bowing * __maxRandomnessOffset * (x1 - x2) / 200;
        midDispX = _getOffset(-midDispX, midDispX);
        midDispY = _getOffset(-midDispY, midDispY);
        if (move) {
            path.moveTo(x1 + _getOffset(-offset, offset), y1 + _getOffset(-offset, offset));
        }
        if (!overwrite) {
            path.bcurveTo(midDispX + x1 + (x2 - x1) * divergePoint + _getOffset(-offset, offset), midDispY + y1 + (y2 - y1) * divergePoint + _getOffset(-offset, offset), midDispX + x1 + 2 * (x2 - x1) * divergePoint + _getOffset(-offset, offset), midDispY + y1 + 2 * (y2 - y1) * divergePoint + _getOffset(-offset, offset), x2 + _getOffset(-offset, offset), y2 + _getOffset(-offset, offset));
        }
        else {
            path.bcurveTo(midDispX + x1 + (x2 - x1) * divergePoint + _getOffset(-halfOffset, halfOffset), midDispY + y1 + (y2 - y1) * divergePoint + _getOffset(-halfOffset, halfOffset), midDispX + x1 + 2 * (x2 - x1) * divergePoint + _getOffset(-halfOffset, halfOffset), midDispY + y1 + 2 * (y2 - y1) * divergePoint + _getOffset(-halfOffset, halfOffset), x2 + _getOffset(-halfOffset, halfOffset), y2 + _getOffset(-halfOffset, halfOffset));
        }
        return path;
    }
    function _curve(vertArray, existingPath) {
        const vertArrayLength = vertArray.length;
        let path = existingPath || new WiresPath();
        if (vertArrayLength > 3) {
            const b = [];
            const s = 1 - __curveTightness;
            path.moveTo(vertArray[1][0], vertArray[1][1]);
            for (let i = 1; (i + 2) < vertArrayLength; i++) {
                const cachedVertArray = vertArray[i];
                b[0] = [cachedVertArray[0], cachedVertArray[1]];
                b[1] = [cachedVertArray[0] + (s * vertArray[i + 1][0] - s * vertArray[i - 1][0]) / 6, cachedVertArray[1] + (s * vertArray[i + 1][1] - s * vertArray[i - 1][1]) / 6];
                b[2] = [vertArray[i + 1][0] + (s * vertArray[i][0] - s * vertArray[i + 2][0]) / 6, vertArray[i + 1][1] + (s * vertArray[i][1] - s * vertArray[i + 2][1]) / 6];
                b[3] = [vertArray[i + 1][0], vertArray[i + 1][1]];
                path.bcurveTo(b[1][0], b[1][1], b[2][0], b[2][1], b[3][0], b[3][1]);
            }
        }
        else if (vertArrayLength === 3) {
            path.moveTo(vertArray[0][0], vertArray[0][1]);
            path.bcurveTo(vertArray[1][0], vertArray[1][1], vertArray[2][0], vertArray[2][1], vertArray[2][0], vertArray[2][1]);
        }
        else if (vertArrayLength === 2) {
            path = _line(vertArray[0][0], vertArray[0][1], vertArray[1][0], vertArray[1][1], path);
        }
        return path;
    }
    function _ellipse(ellipseInc, cx, cy, rx, ry, offset, overlap, existingPath) {
        const radOffset = _getOffset(-0.5, 0.5) - Math.PI / 2;
        const points = [];
        points.push([
            _getOffset(-offset, offset) + cx + 0.9 * rx * Math.cos(radOffset - ellipseInc),
            _getOffset(-offset, offset) + cy + 0.9 * ry * Math.sin(radOffset - ellipseInc)
        ]);
        for (let angle = radOffset; angle < (Math.PI * 2 + radOffset - 0.01); angle = angle + ellipseInc) {
            points.push([
                _getOffset(-offset, offset) + cx + rx * Math.cos(angle),
                _getOffset(-offset, offset) + cy + ry * Math.sin(angle)
            ]);
        }
        points.push([
            _getOffset(-offset, offset) + cx + rx * Math.cos(radOffset + Math.PI * 2 + overlap * 0.5),
            _getOffset(-offset, offset) + cy + ry * Math.sin(radOffset + Math.PI * 2 + overlap * 0.5)
        ]);
        points.push([
            _getOffset(-offset, offset) + cx + 0.98 * rx * Math.cos(radOffset + overlap),
            _getOffset(-offset, offset) + cy + 0.98 * ry * Math.sin(radOffset + overlap)
        ]);
        points.push([
            _getOffset(-offset, offset) + cx + 0.9 * rx * Math.cos(radOffset + overlap * 0.5),
            _getOffset(-offset, offset) + cy + 0.9 * ry * Math.sin(radOffset + overlap * 0.5)
        ]);
        return _curve(points, existingPath);
    }
    function line(parent, x1, y1, x2, y2) {
        const path = _line(x1, y1, x2, y2);
        const node = svgNode('path', { d: path.value });
        parent.appendChild(node);
        return node;
    }
    function rectangle(parent, x, y, width, height) {
        x = x + 2;
        y = y + 2;
        width = width - 4;
        height = height - 4;
        let path = _line(x, y, x + width, y);
        path = _line(x + width, y, x + width, y + height, path);
        path = _line(x + width, y + height, x, y + height, path);
        path = _line(x, y + height, x, y, path);
        const node = svgNode('path', { d: path.value });
        parent.appendChild(node);
        return node;
    }
    function polygon(parent, vertices) {
        let path;
        const vCount = vertices.length;
        if (vCount > 2) {
            for (let i = 0; i < 2; i++) {
                let move = true;
                for (let i = 1; i < vCount; i++) {
                    path = _continuousLine(vertices[i - 1][0], vertices[i - 1][1], vertices[i][0], vertices[i][1], move, i > 0, path);
                    move = false;
                }
                path = _continuousLine(vertices[vCount - 1][0], vertices[vCount - 1][1], vertices[0][0], vertices[0][1], move, i > 0, path);
            }
        }
        else if (vCount === 2) {
            path = _line(vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1]);
        }
        else {
            path = new WiresPath();
        }
        const node = svgNode('path', { d: path.value });
        parent.appendChild(node);
        return node;
    }
    function ellipse(parent, x, y, width, height) {
        width = Math.max(width > 10 ? width - 4 : width - 1, 1);
        height = Math.max(height > 10 ? height - 4 : height - 1, 1);
        const ellipseInc = (Math.PI * 2) / __curveStepCount;
        let rx = Math.abs(width / 2);
        let ry = Math.abs(height / 2);
        rx += _getOffset(-rx * 0.05, rx * 0.05);
        ry += _getOffset(-ry * 0.05, ry * 0.05);
        let path = _ellipse(ellipseInc, x, y, rx, ry, 1, ellipseInc * _getOffset(0.1, _getOffset(0.4, 1)));
        path = _ellipse(ellipseInc, x, y, rx, ry, 1.5, 0, path);
        const node = svgNode('path', { d: path.value });
        parent.appendChild(node);
        return node;
    }
    function renderHachureLines(lines) {
        const gNode = svgNode('g');
        let prevPoint = null;
        lines.forEach((l) => {
            line(gNode, l[0][0], l[0][1], l[1][0], l[1][1]);
            if (prevPoint) {
                line(gNode, prevPoint[0], prevPoint[1], l[0][0], l[0][1]);
            }
            prevPoint = l[1];
        });
        return gNode;
    }
    const options = {
        bowing: __bowing,
        curveStepCount: __curveStepCount,
        curveTightness: __curveTightness,
        dashGap: 0,
        dashOffset: 0,
        fill: '#000',
        fillStyle: 'hachure',
        fillWeight: 1,
        hachureAngle: -41,
        hachureGap: 5,
        maxRandomnessOffset: __maxRandomnessOffset,
        roughness: __roughness,
        simplification: 1,
        stroke: '#000',
        strokeWidth: 2,
        zigzagOffset: 0
    };
    function hachureFill(points) {
        const lines = hachureLinesForPolygon(points, options);
        return renderHachureLines(lines);
    }
    function hachureEllipseFill(cx, cy, width, height) {
        const helper = {
            randOffset(x, _o) {
                return _getOffset(-x, x);
            }
        };
        const lines = hachureLinesForEllipse(helper, cx, cy, width, height, options);
        return renderHachureLines(lines);
    }
    function fire(element, name, detail, bubbles = true, composed = true) {
        if (name) {
            const init = {
                bubbles: (typeof bubbles === 'boolean') ? bubbles : true,
                composed: (typeof composed === 'boolean') ? composed : true
            };
            if (detail) {
                init.detail = detail;
            }
            const CE = (window.SlickCustomEvent || CustomEvent);
            element.dispatchEvent(new CE(name, init));
        }
    }

    var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$1 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredButton = class WiredButton extends WiredBase {
        constructor() {
            super();
            this.elevation = 1;
            this.disabled = false;
            if (window.ResizeObserver) {
                this.resizeObserver = new window.ResizeObserver(() => {
                    if (this.svg) {
                        this.wiredRender(true);
                    }
                });
            }
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          font-size: 14px;
        }
        path {
          transition: transform 0.05s ease;
        }
        button {
          position: relative;
          user-select: none;
          border: none;
          background: none;
          font-family: inherit;
          font-size: inherit;
          cursor: pointer;
          letter-spacing: 1.25px;
          text-transform: uppercase;
          text-align: center;
          padding: 10px;
          color: inherit;
          outline: none;
        }
        button[disabled] {
          opacity: 0.6 !important;
          background: rgba(0, 0, 0, 0.07);
          cursor: default;
          pointer-events: none;
        }
        button:active path {
          transform: scale(0.97) translate(1.5%, 1.5%);
        }
        button:focus path {
          stroke-width: 1.5;
        }
        button::-moz-focus-inner {
          border: 0;
        }
      `
            ];
        }
        render() {
            return html `
    <button ?disabled="${this.disabled}">
      <slot @slotchange="${this.wiredRender}"></slot>
      <div id="overlay">
        <svg></svg>
      </div>
    </button>
    `;
        }
        focus() {
            if (this.button) {
                this.button.focus();
            }
            else {
                super.focus();
            }
        }
        canvasSize() {
            if (this.button) {
                const size = this.button.getBoundingClientRect();
                const elev = Math.min(Math.max(1, this.elevation), 5);
                const w = size.width + ((elev - 1) * 2);
                const h = size.height + ((elev - 1) * 2);
                return [w, h];
            }
            return this.lastSize;
        }
        draw(svg, size) {
            const elev = Math.min(Math.max(1, this.elevation), 5);
            const s = {
                width: size[0] - ((elev - 1) * 2),
                height: size[1] - ((elev - 1) * 2)
            };
            rectangle(svg, 0, 0, s.width, s.height);
            for (let i = 1; i < elev; i++) {
                (line(svg, (i * 2), s.height + (i * 2), s.width + (i * 2), s.height + (i * 2))).style.opacity = `${(75 - (i * 10)) / 100}`;
                (line(svg, s.width + (i * 2), s.height + (i * 2), s.width + (i * 2), i * 2)).style.opacity = `${(75 - (i * 10)) / 100}`;
                (line(svg, (i * 2), s.height + (i * 2), s.width + (i * 2), s.height + (i * 2))).style.opacity = `${(75 - (i * 10)) / 100}`;
                (line(svg, s.width + (i * 2), s.height + (i * 2), s.width + (i * 2), i * 2)).style.opacity = `${(75 - (i * 10)) / 100}`;
            }
        }
        updated() {
            super.updated();
            this.attachResizeListener();
        }
        disconnectedCallback() {
            this.detachResizeListener();
        }
        attachResizeListener() {
            if (this.button && this.resizeObserver && this.resizeObserver.observe) {
                this.resizeObserver.observe(this.button);
            }
        }
        detachResizeListener() {
            if (this.button && this.resizeObserver && this.resizeObserver.unobserve) {
                this.resizeObserver.unobserve(this.button);
            }
        }
    };
    __decorate$1([
        property({ type: Number }),
        __metadata$1("design:type", Object)
    ], exports.WiredButton.prototype, "elevation", void 0);
    __decorate$1([
        property({ type: Boolean, reflect: true }),
        __metadata$1("design:type", Object)
    ], exports.WiredButton.prototype, "disabled", void 0);
    __decorate$1([
        query('button'),
        __metadata$1("design:type", HTMLButtonElement)
    ], exports.WiredButton.prototype, "button", void 0);
    exports.WiredButton = __decorate$1([
        customElement('wired-button'),
        __metadata$1("design:paramtypes", [])
    ], exports.WiredButton);

    var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$2 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    // GLOBAL CONSTANTS
    const SECOND = 1000;
    const MINUTE = SECOND * 60;
    const HOUR = MINUTE * 60;
    const DAY = HOUR * 24;
    const TABLE_PADDING = 8; // pixels
    exports.WiredCalendar = class WiredCalendar extends LitElement {
        constructor() {
            super(...arguments);
            this.elevation = 3;
            this.disabled = false;
            this.initials = false; // days of week
            this.format = (d) => this.months_short[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
            // Initial calendar headers (will be replaced if different locale than `en` or `en-US`)
            this.weekdays_short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            this.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            // Fix month shorts for internal value comparations (not changed by locale)
            this.months_short = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            this.firstOfMonthDate = new Date(); // Only month and year relevant
            this.fDate = undefined; // Date obj for firstdate string
            this.lDate = undefined; // Date obj for lastdate string
            this.calendarRefSize = { width: 0, height: 0 };
            this.tblColWidth = 0;
            this.tblRowHeight = 0;
            this.tblHeadHeight = 0;
            this.monthYear = '';
            this.weeks = [[]];
        }
        connectedCallback() {
            super.connectedCallback();
            if (!this.resizeHandler) {
                this.resizeHandler = this.debounce(this.resized.bind(this), 200, false, this);
                window.addEventListener('resize', this.resizeHandler);
            }
            // Initial setup (now that `wired-calendar` element is ready in DOM)
            this.localizeCalendarHeaders();
            this.setInitialConditions();
            this.computeCalendar();
            this.refreshSelection();
            setTimeout(() => this.updated());
        }
        disconnectedCallback() {
            if (super.disconnectedCallback)
                super.disconnectedCallback();
            if (this.resizeHandler) {
                window.removeEventListener('resize', this.resizeHandler);
                delete this.resizeHandler;
            }
        }
        static get styles() {
            return css `
    :host {
      display: inline-block;
      font-family: inherit;
      position: relative;
      outline: none;
      opacity: 0;
    }

    :host(.wired-disabled) {
      opacity: 0.5 !important;
      cursor: default;
      pointer-events: none;
      background: rgba(0, 0, 0, 0.02);
    }

    :host(.wired-rendered) {
      opacity: 1;
    }

    :host(:focus) path {
      stroke-width: 1.5;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
    }

    svg {
      display: block;
    }

    .calendar path {
      stroke: var(--wired-calendar-color, black);
      stroke-width: 0.7;
      fill: transparent;
    }

    .selected path {
      stroke: var(--wired-calendar-selected-color, red);
      stroke-width: 2.5;
      fill: transparent;
      transition: transform 0.05s ease;
    }

    table {
      position: relative;
      background: var(--wired-calendar-bg, white);
      border-collapse: collapse;
      font-size: inherit;
      text-transform: capitalize;
      line-height: unset;
      cursor: default;
      overflow: hidden;
    }

    table:focus {
      outline: none !important;
    }

    td,
    th {
      border-radius: 4px;
      text-align: center;
    }

    td.disabled {
      color: var(--wired-calendar-disabled-color, lightgray);
      cursor: not-allowed;
    }

    td.dimmed {
      color: var(--wired-calendar-dimmed-color, gray);
    }

    td.selected {
      position: absolute;
    }

    td:not(.disabled):not(.selected):hover {
      background-color: #d0d0d0;
      cursor: pointer;
    }

    .pointer {
      cursor: pointer;
    }

    `;
        }
        render() {
            /*
            * Template to render a one month calendar
            *
            * The template consists of one `table` and one overlay `div`.
            * The `table` consiste of two header rows plus one row for each week of the month.
            * The underlaying data is an array of weeks. Each week consist of an array of days.
            * The days are objects with `CalendarCell` interface. Each one is rendered ...
            * ... according with the boolean conditions `disabled` and `selected`.
            * Particulary, a `selected` day is rendered with its own extra overlay ...
            * ... (and svg tag) to draw over it.
            */
            return html `
    <table style="width:${this.calendarRefSize.width}px;height:${this.calendarRefSize.height}px;border:${TABLE_PADDING}px solid transparent"
            @mousedown="${this.onItemClick}"
            @touchstart="${this.onItemClick}">
      ${ /* 1st header row with calendar title and prev/next controls */''}
      <tr class="top-header" style="height:${this.tblHeadHeight}px;">
        <th id="prevCal" class="pointer" @click="${this.onPrevClick}"><<</th>
        <th colSpan="5">${this.monthYear}</th>
        <th id="nextCal" class="pointer" @click="${this.onNextClick}">>></th>
      </tr>
      ${ /* 2nd header row with the seven weekdays names (short or initials) */''}
      <tr class="header" style="height:${this.tblHeadHeight}px;">
        ${this.weekdays_short
            .map((d) => html `<th style="width: ${this.tblColWidth};">${this.initials ? d[0] : d}</th>
            `)}
      </tr>
      ${ /* Loop thru weeks building one row `<tr>` for each week */''}
      ${this.weeks
            .map((weekDays) => html `<tr style="height:${this.tblRowHeight}px;">
              ${ /* Loop thru weeekdays in each week building one data cell `<td>` for each day */''}
              ${weekDays
            .map((d) => 
        // This blank space left on purpose for clarity
        html `${d.selected ?
            // Render "selected" cell
            html `
                            <td class="selected" value="${d.value}">
                            <div style="width: ${this.tblColWidth}px; line-height:${this.tblRowHeight}px;">${d.text}</div>
                            <div class="overlay">
                              <svg id="svgTD" class="selected"></svg>
                            </div></td>
                        ` :
            // Render "not selected" cell
            html `
                            <td .className="${d.disabled ? 'disabled' : (d.dimmed ? 'dimmed' : '')}"
                                value="${d.disabled ? '' : d.value}">${d.text}</td>
                        `}
                    `
        // This blank space left on purpose for clarity
        )}${ /* End `weekDays` map loop */''}
            </tr>`)}${ /* End `weeks` map loop */''}
    </table>
    <div class="overlay">
      <svg id="svg" class="calendar"></svg>
    </div>
    `;
        }
        firstUpdated() {
            this.setAttribute('role', 'dialog');
        }
        updated(changed) {
            if (changed && changed instanceof Map) {
                if (changed.has('disabled'))
                    this.refreshDisabledState();
                if (changed.has('selected'))
                    this.refreshSelection();
            }
            // Redraw calendar sketchy bounding box
            const svg = this.shadowRoot.getElementById('svg');
            while (svg.hasChildNodes()) {
                svg.removeChild(svg.lastChild);
            }
            const s = this.getCalendarSize();
            const elev = Math.min(Math.max(1, this.elevation), 5);
            const w = s.width + ((elev - 1) * 2);
            const h = s.height + ((elev - 1) * 2);
            svg.setAttribute('width', `${w}`);
            svg.setAttribute('height', `${h}`);
            rectangle(svg, 2, 2, s.width - 4, s.height - 4);
            for (let i = 1; i < elev; i++) {
                (line(svg, (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), s.height - 4 + (i * 2))).style.opacity = `${(85 - (i * 10)) / 100}`;
                (line(svg, s.width - 4 + (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), i * 2)).style.opacity = `${(85 - (i * 10)) / 100}`;
                (line(svg, (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), s.height - 4 + (i * 2))).style.opacity = `${(85 - (i * 10)) / 100}`;
                (line(svg, s.width - 4 + (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), i * 2)).style.opacity = `${(85 - (i * 10)) / 100}`;
            }
            // Redraw sketchy red circle `selected` cell
            const svgTD = this.shadowRoot.getElementById('svgTD');
            if (svgTD) {
                while (svgTD.hasChildNodes()) {
                    svgTD.removeChild(svgTD.lastChild);
                }
                const iw = Math.max(this.tblColWidth * 1.0, 20);
                const ih = Math.max(this.tblRowHeight * 0.9, 18);
                const c = ellipse(svgTD, this.tblColWidth / 2, this.tblRowHeight / 2, iw, ih);
                svgTD.appendChild(c);
            }
            this.classList.add('wired-rendered');
        }
        setSelectedDate(formatedDate) {
            // TODO: Validate `formatedDate`
            this.selected = formatedDate;
            if (this.selected) {
                const d = new Date(this.selected);
                this.firstOfMonthDate = new Date(d.getFullYear(), d.getMonth(), 1);
                this.computeCalendar();
                this.requestUpdate();
                this.fireSelected();
            }
        }
        /* private methods */
        /*
        * Change calendar headers according to locale parameter or browser locale
        * Notes:
        *   This only change the rendered text in the calendar
        *   All the internal parsing of string dates do not use locale
        */
        localizeCalendarHeaders() {
            // Find locale preference when parameter not set
            if (!this.locale) {
                // Guess from different browser possibilities
                const n = navigator;
                if (n.hasOwnProperty('systemLanguage'))
                    this.locale = n['systemLanguage'];
                else if (n.hasOwnProperty('browserLanguage'))
                    this.locale = n['browserLanguage'];
                else
                    this.locale = (navigator.languages || ['en'])[0];
            }
            // Replace localized calendar texts when not `en-US` or not `en`
            const l = (this.locale || '').toLowerCase();
            if (l !== 'en-us' && l !== 'en') {
                const d = new Date();
                // Compute weekday header texts (like "Sun", "Mon", "Tue", ...)
                const weekDayOffset = d.getUTCDay();
                const daySunday = new Date(d.getTime() - DAY * weekDayOffset);
                const weekdayDate = new Date(daySunday);
                for (let i = 0; i < 7; i++) {
                    weekdayDate.setDate(daySunday.getDate() + i);
                    this.weekdays_short[i] = weekdayDate.toLocaleString(this.locale, { weekday: 'short' });
                }
                // Compute month header texts (like "January", "February", ...)
                d.setDate(1); // Set to first of the month to avoid cases like "February 30"
                for (let m = 0; m < 12; m++) {
                    d.setMonth(m);
                    this.months[m] = d.toLocaleString(this.locale, { month: 'long' });
                    // Beware: month shorts are used in `en-US` internally. Do not change.
                    // this.months_short[m] = d.toLocaleString(this.locale, {month: 'short'});
                }
            }
        }
        setInitialConditions() {
            // Initialize calendar element size
            this.calendarRefSize = this.getCalendarSize();
            // Define an initial reference date either from a paramenter or new today date
            let d;
            // TODO: Validate `this.selected`
            if (this.selected) {
                // TODO: Validate `this.selected`
                d = new Date(this.selected);
                this.value = { date: new Date(this.selected), text: this.selected };
            }
            else {
                d = new Date();
            }
            // Define a reference date used to build one month calendar
            this.firstOfMonthDate = new Date(d.getFullYear(), d.getMonth(), 1);
            // Convert string paramenters (when present) to Date objects
            // TODO: Validate `this.firstdate`
            if (this.firstdate)
                this.fDate = new Date(this.firstdate);
            // TODO: Validate `this.lastdate`
            if (this.lastdate)
                this.lDate = new Date(this.lastdate);
        }
        refreshSelection() {
            // Loop thru all weeks and thru all day in each week
            this.weeks.forEach((week) => week.forEach((day) => {
                // Set calendar day `selected` according to user's `this.selected`
                day.selected = this.selected && (day.value === this.selected) || false;
            }));
            this.requestUpdate();
        }
        resized() {
            // Reinitialize calendar element size
            this.calendarRefSize = this.getCalendarSize();
            this.computeCalendar();
            this.refreshSelection();
        }
        getCalendarSize() {
            const limits = this.getBoundingClientRect();
            return {
                width: limits.width > 180 ? limits.width : 320,
                height: limits.height > 180 ? limits.height : 320
            };
        }
        computeCellsizes(size, rows) {
            const numerOfHeaderRows = 2;
            const headerRealStateProportion = 0.25; // 1 equals 100%
            const borderSpacing = 2; // See browser's table {border-spacing: 2px;}
            this.tblColWidth = (size.width / 7) - borderSpacing; // A week has 7 days
            this.tblHeadHeight =
                (size.height * headerRealStateProportion / numerOfHeaderRows) - borderSpacing;
            this.tblRowHeight =
                (size.height * (1 - headerRealStateProportion) / rows) - borderSpacing;
        }
        refreshDisabledState() {
            if (this.disabled) {
                this.classList.add('wired-disabled');
            }
            else {
                this.classList.remove('wired-disabled');
            }
            this.tabIndex = this.disabled ? -1 : +(this.getAttribute('tabindex') || 0);
        }
        onItemClick(event) {
            event.stopPropagation();
            const sel = event.target;
            // Attribute 'value' empty means: is a disabled date (should not be 'selected')
            if (sel && sel.hasAttribute('value') && sel.getAttribute('value') !== '') {
                this.selected = sel.getAttribute('value') || undefined;
                this.refreshSelection();
                this.fireSelected();
            }
        }
        fireSelected() {
            if (this.selected) {
                this.value = { date: new Date(this.selected), text: this.selected };
                fire(this, 'selected', { selected: this.selected });
            }
        }
        computeCalendar() {
            // Compute month and year for table header
            this.monthYear = this.months[this.firstOfMonthDate.getMonth()] + ' ' + this.firstOfMonthDate.getFullYear();
            // Compute all month dates (one per day, 7 days per week, all weeks of the month)
            const first_day_in_month = new Date(this.firstOfMonthDate.getFullYear(), this.firstOfMonthDate.getMonth(), 1);
            // Initialize offset (negative because calendar commonly starts few days before the first of the month)
            let dayInMonthOffset = 0 - first_day_in_month.getDay();
            const amountOfWeeks = Math.ceil((new Date(this.firstOfMonthDate.getFullYear(), this.firstOfMonthDate.getMonth() + 1, 0).getDate() - dayInMonthOffset) / 7);
            this.weeks = []; // Clear previous weeks
            for (let weekIndex = 0; weekIndex < amountOfWeeks; weekIndex++) {
                this.weeks[weekIndex] = [];
                for (let dayOfWeekIndex = 0; dayOfWeekIndex < 7; dayOfWeekIndex++) {
                    // Compute day date (using an incrementing offset)
                    const day = new Date(first_day_in_month.getTime() + DAY * dayInMonthOffset);
                    const formatedDate = this.format(day);
                    this.weeks[weekIndex][dayOfWeekIndex] = {
                        value: formatedDate,
                        text: day.getDate().toString(),
                        selected: formatedDate === this.selected,
                        dimmed: day.getMonth() !== first_day_in_month.getMonth(),
                        disabled: this.isDateOutOfRange(day)
                    };
                    // Increment offset (advance one day in calendar)
                    dayInMonthOffset++;
                }
            }
            // Compute row and column sizes
            this.computeCellsizes(this.calendarRefSize, amountOfWeeks);
        }
        onPrevClick() {
            // Is there a preious month limit due to `firstdate`?
            if (this.fDate === undefined ||
                new Date(this.fDate.getFullYear(), this.fDate.getMonth() - 1, 1).getMonth() !==
                    new Date(this.firstOfMonthDate.getFullYear(), this.firstOfMonthDate.getMonth() - 1, 1).getMonth()) {
                // No limit found, so update `firstOfMonthDate` to first of the previous month
                this.firstOfMonthDate = new Date(this.firstOfMonthDate.getFullYear(), this.firstOfMonthDate.getMonth() - 1, 1);
                this.computeCalendar();
                this.refreshSelection();
            }
        }
        onNextClick() {
            // Is there a next month limit due to `lastdate`?
            if (this.lDate === undefined ||
                new Date(this.lDate.getFullYear(), this.lDate.getMonth() + 1, 1).getMonth() !==
                    new Date(this.firstOfMonthDate.getFullYear(), this.firstOfMonthDate.getMonth() + 1, 1).getMonth()) {
                // No limit found, so update `firstOfMonthDate` to first of the next month
                this.firstOfMonthDate = new Date(this.firstOfMonthDate.getFullYear(), this.firstOfMonthDate.getMonth() + 1, 1);
                this.computeCalendar();
                this.refreshSelection();
            }
        }
        isDateOutOfRange(day) {
            if (this.fDate && this.lDate) {
                return day < this.fDate || this.lDate < day;
            }
            else if (this.fDate) {
                return day < this.fDate;
            }
            else if (this.lDate) {
                return this.lDate < day;
            }
            return false;
        }
        /* Util */
        debounce(func, wait, immediate, context) {
            let timeout = 0;
            return () => {
                const args = arguments;
                const later = () => {
                    timeout = 0;
                    if (!immediate) {
                        func.apply(context, args);
                    }
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = window.setTimeout(later, wait);
                if (callNow) {
                    func.apply(context, args);
                }
            };
        }
    };
    __decorate$2([
        property({ type: Number }),
        __metadata$2("design:type", Object)
    ], exports.WiredCalendar.prototype, "elevation", void 0);
    __decorate$2([
        property({ type: String }),
        __metadata$2("design:type", String)
    ], exports.WiredCalendar.prototype, "selected", void 0);
    __decorate$2([
        property({ type: String }),
        __metadata$2("design:type", String)
    ], exports.WiredCalendar.prototype, "firstdate", void 0);
    __decorate$2([
        property({ type: String }),
        __metadata$2("design:type", String)
    ], exports.WiredCalendar.prototype, "lastdate", void 0);
    __decorate$2([
        property({ type: String }),
        __metadata$2("design:type", String)
    ], exports.WiredCalendar.prototype, "locale", void 0);
    __decorate$2([
        property({ type: Boolean, reflect: true }),
        __metadata$2("design:type", Object)
    ], exports.WiredCalendar.prototype, "disabled", void 0);
    __decorate$2([
        property({ type: Boolean, reflect: true }),
        __metadata$2("design:type", Object)
    ], exports.WiredCalendar.prototype, "initials", void 0);
    __decorate$2([
        property({ type: Object }),
        __metadata$2("design:type", Object)
    ], exports.WiredCalendar.prototype, "value", void 0);
    __decorate$2([
        property({ type: Function }),
        __metadata$2("design:type", Function)
    ], exports.WiredCalendar.prototype, "format", void 0);
    exports.WiredCalendar = __decorate$2([
        customElement('wired-calendar')
    ], exports.WiredCalendar);

    var __decorate$3 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$3 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredCard = class WiredCard extends WiredBase {
        constructor() {
            super();
            this.elevation = 1;
            if (window.ResizeObserver) {
                this.resizeObserver = new window.ResizeObserver(() => {
                    if (this.svg) {
                        this.wiredRender();
                    }
                });
            }
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          position: relative;
          padding: 10px;
        }
        .cardFill path {
          stroke-width: 3.5;
          stroke: var(--wired-card-background-fill);
        }
        path {
          stroke: var(--wired-card-background-fill, currentColor);
        }
      `
            ];
        }
        render() {
            return html `
    <div id="overlay"><svg></svg></div>
    <div style="position: relative;">
      <slot @slotchange="${this.wiredRender}"></slot>
    </div>
    `;
        }
        updated(changed) {
            const force = changed.has('fill');
            this.wiredRender(force);
            this.attachResizeListener();
        }
        disconnectedCallback() {
            this.detachResizeListener();
        }
        attachResizeListener() {
            if (this.resizeObserver && this.resizeObserver.observe) {
                this.resizeObserver.observe(this);
            }
            else if (!this.windowResizeHandler) {
                this.windowResizeHandler = () => this.wiredRender();
                window.addEventListener('resize', this.windowResizeHandler, { passive: true });
            }
        }
        detachResizeListener() {
            if (this.resizeObserver && this.resizeObserver.unobserve) {
                this.resizeObserver.unobserve(this);
            }
            if (this.windowResizeHandler) {
                window.removeEventListener('resize', this.windowResizeHandler);
            }
        }
        canvasSize() {
            const s = this.getBoundingClientRect();
            const elev = Math.min(Math.max(1, this.elevation), 5);
            const w = s.width + ((elev - 1) * 2);
            const h = s.height + ((elev - 1) * 2);
            return [w, h];
        }
        draw(svg, size) {
            const elev = Math.min(Math.max(1, this.elevation), 5);
            const s = {
                width: size[0] - ((elev - 1) * 2),
                height: size[1] - ((elev - 1) * 2)
            };
            if (this.fill && this.fill.trim()) {
                const fillNode = hachureFill([
                    [2, 2],
                    [s.width - 4, 2],
                    [s.width - 2, s.height - 4],
                    [2, s.height - 4]
                ]);
                fillNode.classList.add('cardFill');
                svg.style.setProperty('--wired-card-background-fill', this.fill.trim());
                svg.appendChild(fillNode);
            }
            rectangle(svg, 2, 2, s.width - 4, s.height - 4);
            for (let i = 1; i < elev; i++) {
                (line(svg, (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), s.height - 4 + (i * 2))).style.opacity = `${(85 - (i * 10)) / 100}`;
                (line(svg, s.width - 4 + (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), i * 2)).style.opacity = `${(85 - (i * 10)) / 100}`;
                (line(svg, (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), s.height - 4 + (i * 2))).style.opacity = `${(85 - (i * 10)) / 100}`;
                (line(svg, s.width - 4 + (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), i * 2)).style.opacity = `${(85 - (i * 10)) / 100}`;
            }
        }
    };
    __decorate$3([
        property({ type: Number }),
        __metadata$3("design:type", Object)
    ], exports.WiredCard.prototype, "elevation", void 0);
    __decorate$3([
        property({ type: String }),
        __metadata$3("design:type", String)
    ], exports.WiredCard.prototype, "fill", void 0);
    exports.WiredCard = __decorate$3([
        customElement('wired-card'),
        __metadata$3("design:paramtypes", [])
    ], exports.WiredCard);

    var __decorate$4 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$4 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredCheckbox = class WiredCheckbox extends WiredBase {
        constructor() {
            super(...arguments);
            this.checked = false;
            this.disabled = false;
            this.focused = false;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
      :host {
        display: inline-block;
        font-family: inherit;
      }
      :host([disabled]) {
        opacity: 0.6 !important;
        cursor: default;
        pointer-events: none;
      }
      :host([disabled]) svg {
        background: rgba(0, 0, 0, 0.07);
      }

      #container {
        display: flex;
        flex-direction: row;
        position: relative;
        user-select: none;
        min-height: 24px;
        cursor: pointer;
      }
      span {
        margin-left: 1.5ex;
        line-height: 24px;
      }
      input {
        opacity: 0;
      }
      path {
        stroke: var(--wired-checkbox-icon-color, currentColor);
        stroke-width: var(--wired-checkbox-default-swidth, 0.7);
      }
      g path {
        stroke-width: 2.5;
      }
      #container.focused {
        --wired-checkbox-default-swidth: 1.5;
      }
      `
            ];
        }
        focus() {
            if (this.input) {
                this.input.focus();
            }
            else {
                super.focus();
            }
        }
        wiredRender(force = false) {
            super.wiredRender(force);
            this.refreshCheckVisibility();
        }
        render() {
            return html `
    <label id="container" class="${this.focused ? 'focused' : ''}">
      <input type="checkbox" .checked="${this.checked}" ?disabled="${this.disabled}" 
        @change="${this.onChange}"
        @focus="${() => this.focused = true}"
        @blur="${() => this.focused = false}">
      <span><slot></slot></span>
      <div id="overlay"><svg></svg></div>
    </label>
    `;
        }
        onChange() {
            this.checked = this.input.checked;
            this.refreshCheckVisibility();
            fire(this, 'change', { checked: this.checked });
        }
        canvasSize() {
            return [24, 24];
        }
        draw(svg, size) {
            rectangle(svg, 0, 0, size[0], size[1]);
            this.svgCheck = svgNode('g');
            svg.appendChild(this.svgCheck);
            line(this.svgCheck, size[0] * 0.3, size[1] * 0.4, size[0] * 0.5, size[1] * 0.7);
            line(this.svgCheck, size[0] * 0.5, size[1] * 0.7, size[0] + 5, -5);
        }
        refreshCheckVisibility() {
            if (this.svgCheck) {
                this.svgCheck.style.display = this.checked ? '' : 'none';
            }
        }
    };
    __decorate$4([
        property({ type: Boolean }),
        __metadata$4("design:type", Object)
    ], exports.WiredCheckbox.prototype, "checked", void 0);
    __decorate$4([
        property({ type: Boolean, reflect: true }),
        __metadata$4("design:type", Object)
    ], exports.WiredCheckbox.prototype, "disabled", void 0);
    __decorate$4([
        property(),
        __metadata$4("design:type", Object)
    ], exports.WiredCheckbox.prototype, "focused", void 0);
    __decorate$4([
        query('input'),
        __metadata$4("design:type", HTMLInputElement)
    ], exports.WiredCheckbox.prototype, "input", void 0);
    exports.WiredCheckbox = __decorate$4([
        customElement('wired-checkbox')
    ], exports.WiredCheckbox);

    var __decorate$5 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$5 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredCombo = class WiredCombo extends LitElement {
        constructor() {
            super(...arguments);
            this.disabled = false;
            this.cardShowing = false;
            this.itemNodes = [];
        }
        static get styles() {
            return css `
      :host {
        display: inline-block;
        font-family: inherit;
        position: relative;
        outline: none;
        opacity: 0;
      }
    
      :host(.wired-disabled) {
        opacity: 0.5 !important;
        cursor: default;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.02);
      }
      
      :host(.wired-rendered) {
        opacity: 1;
      }
  
      :host(:focus) path {
        stroke-width: 1.5;
      }
    
      #container {
        white-space: nowrap;
        position: relative;
      }
    
      .inline {
        display: inline-block;
        vertical-align: top
      }
    
      #textPanel {
        min-width: 90px;
        min-height: 18px;
        padding: 8px;
      }
    
      #dropPanel {
        width: 34px;
        cursor: pointer;
      }
    
      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }
    
      svg {
        display: block;
      }
    
      path {
        stroke: currentColor;
        stroke-width: 0.7;
        fill: transparent;
      }
    
      #card {
        display: block;
        position: absolute;
        background: var(--wired-combo-popup-bg, white);
        z-index: 1;
        box-shadow: 1px 5px 15px -6px rgba(0, 0, 0, 0.8);
        padding: 8px;
      }
  
      ::slotted(wired-item) {
        display: block;
      }
    `;
        }
        render() {
            return html `
    <div id="container" @click="${this.onCombo}">
      <div id="textPanel" class="inline">
        <span>${this.value && this.value.text}</span>
      </div>
      <div id="dropPanel" class="inline"></div>
      <div class="overlay">
        <svg></svg>
      </div>
    </div>
    <wired-card id="card" tabindex="-1" role="listbox" @mousedown="${this.onItemClick}" @touchstart="${this.onItemClick}" style="display: none;">
      <slot id="slot"></slot>
    </wired-card>
    `;
        }
        refreshDisabledState() {
            if (this.disabled) {
                this.classList.add('wired-disabled');
            }
            else {
                this.classList.remove('wired-disabled');
            }
            this.tabIndex = this.disabled ? -1 : +(this.getAttribute('tabindex') || 0);
        }
        firstUpdated() {
            this.setAttribute('role', 'combobox');
            this.setAttribute('aria-haspopup', 'listbox');
            this.refreshSelection();
            this.addEventListener('blur', () => {
                if (this.cardShowing) {
                    this.setCardShowing(false);
                }
            });
            this.addEventListener('keydown', (event) => {
                switch (event.keyCode) {
                    case 37:
                    case 38:
                        event.preventDefault();
                        this.selectPrevious();
                        break;
                    case 39:
                    case 40:
                        event.preventDefault();
                        this.selectNext();
                        break;
                    case 27:
                        event.preventDefault();
                        if (this.cardShowing) {
                            this.setCardShowing(false);
                        }
                        break;
                    case 13:
                        event.preventDefault();
                        this.setCardShowing(!this.cardShowing);
                        break;
                    case 32:
                        event.preventDefault();
                        if (!this.cardShowing) {
                            this.setCardShowing(true);
                        }
                        break;
                }
            });
        }
        updated(changed) {
            if (changed.has('disabled')) {
                this.refreshDisabledState();
            }
            const svg = this.svg;
            while (svg.hasChildNodes()) {
                svg.removeChild(svg.lastChild);
            }
            const s = this.shadowRoot.getElementById('container').getBoundingClientRect();
            svg.setAttribute('width', `${s.width}`);
            svg.setAttribute('height', `${s.height}`);
            const textBounds = this.shadowRoot.getElementById('textPanel').getBoundingClientRect();
            this.shadowRoot.getElementById('dropPanel').style.minHeight = textBounds.height + 'px';
            rectangle(svg, 0, 0, textBounds.width, textBounds.height);
            const dropx = textBounds.width - 4;
            rectangle(svg, dropx, 0, 34, textBounds.height);
            const dropOffset = Math.max(0, Math.abs((textBounds.height - 24) / 2));
            const poly = polygon(svg, [
                [dropx + 8, 5 + dropOffset],
                [dropx + 26, 5 + dropOffset],
                [dropx + 17, dropOffset + Math.min(textBounds.height, 18)]
            ]);
            poly.style.fill = 'currentColor';
            poly.style.pointerEvents = this.disabled ? 'none' : 'auto';
            poly.style.cursor = 'pointer';
            this.classList.add('wired-rendered');
            // aria
            this.setAttribute('aria-expanded', `${this.cardShowing}`);
            if (!this.itemNodes.length) {
                this.itemNodes = [];
                const nodes = this.shadowRoot.getElementById('slot').assignedNodes();
                if (nodes && nodes.length) {
                    for (let i = 0; i < nodes.length; i++) {
                        const element = nodes[i];
                        if (element.tagName === 'WIRED-ITEM') {
                            element.setAttribute('role', 'option');
                            this.itemNodes.push(element);
                        }
                    }
                }
            }
        }
        refreshSelection() {
            if (this.lastSelectedItem) {
                this.lastSelectedItem.selected = false;
                this.lastSelectedItem.removeAttribute('aria-selected');
            }
            const slot = this.shadowRoot.getElementById('slot');
            const nodes = slot.assignedNodes();
            if (nodes) {
                let selectedItem = null;
                for (let i = 0; i < nodes.length; i++) {
                    const element = nodes[i];
                    if (element.tagName === 'WIRED-ITEM') {
                        const value = element.value || element.getAttribute('value') || '';
                        if (this.selected && (value === this.selected)) {
                            selectedItem = element;
                            break;
                        }
                    }
                }
                this.lastSelectedItem = selectedItem || undefined;
                if (this.lastSelectedItem) {
                    this.lastSelectedItem.selected = true;
                    this.lastSelectedItem.setAttribute('aria-selected', 'true');
                }
                if (selectedItem) {
                    this.value = {
                        value: selectedItem.value || '',
                        text: selectedItem.textContent || ''
                    };
                }
                else {
                    this.value = undefined;
                }
            }
        }
        setCardShowing(showing) {
            if (this.card) {
                this.cardShowing = showing;
                this.card.style.display = showing ? '' : 'none';
                if (showing) {
                    setTimeout(() => {
                        // TODO: relayout card?
                        const nodes = this.shadowRoot.getElementById('slot').assignedNodes().filter((d) => {
                            return d.nodeType === Node.ELEMENT_NODE;
                        });
                        nodes.forEach((n) => {
                            const e = n;
                            if (e.requestUpdate) {
                                e.requestUpdate();
                            }
                        });
                    }, 10);
                }
                this.setAttribute('aria-expanded', `${this.cardShowing}`);
            }
        }
        onItemClick(event) {
            event.stopPropagation();
            this.selected = event.target.value;
            this.refreshSelection();
            this.fireSelected();
            setTimeout(() => {
                this.setCardShowing(false);
            });
        }
        fireSelected() {
            fire(this, 'selected', { selected: this.selected });
        }
        selectPrevious() {
            const list = this.itemNodes;
            if (list.length) {
                let index = -1;
                for (let i = 0; i < list.length; i++) {
                    if (list[i] === this.lastSelectedItem) {
                        index = i;
                        break;
                    }
                }
                if (index < 0) {
                    index = 0;
                }
                else if (index === 0) {
                    index = list.length - 1;
                }
                else {
                    index--;
                }
                this.selected = list[index].value || '';
                this.refreshSelection();
                this.fireSelected();
            }
        }
        selectNext() {
            const list = this.itemNodes;
            if (list.length) {
                let index = -1;
                for (let i = 0; i < list.length; i++) {
                    if (list[i] === this.lastSelectedItem) {
                        index = i;
                        break;
                    }
                }
                if (index < 0) {
                    index = 0;
                }
                else if (index >= (list.length - 1)) {
                    index = 0;
                }
                else {
                    index++;
                }
                this.selected = list[index].value || '';
                this.refreshSelection();
                this.fireSelected();
            }
        }
        onCombo(event) {
            event.stopPropagation();
            this.setCardShowing(!this.cardShowing);
        }
    };
    __decorate$5([
        property({ type: Object }),
        __metadata$5("design:type", Object)
    ], exports.WiredCombo.prototype, "value", void 0);
    __decorate$5([
        property({ type: String }),
        __metadata$5("design:type", String)
    ], exports.WiredCombo.prototype, "selected", void 0);
    __decorate$5([
        property({ type: Boolean, reflect: true }),
        __metadata$5("design:type", Object)
    ], exports.WiredCombo.prototype, "disabled", void 0);
    __decorate$5([
        query('svg'),
        __metadata$5("design:type", SVGSVGElement)
    ], exports.WiredCombo.prototype, "svg", void 0);
    __decorate$5([
        query('#card'),
        __metadata$5("design:type", HTMLDivElement)
    ], exports.WiredCombo.prototype, "card", void 0);
    exports.WiredCombo = __decorate$5([
        customElement('wired-combo')
    ], exports.WiredCombo);

    var __decorate$6 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$6 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredDialog = class WiredDialog extends LitElement {
        constructor() {
            super(...arguments);
            this.elevation = 5;
            this.open = false;
        }
        static get styles() {
            return css `
      #container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: var(--wired-dialog-z-index, 100);
      }
      #container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.4);
        opacity: 0;
        transition: opacity 0.5s ease;
      }
      #overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        opacity: 0;
        transform: translateY(150px);
        transition: transform 0.5s ease, opacity 0.5s ease;
      }
      .layout.vertical {
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
        -ms-flex-direction: column;
        -webkit-flex-direction: column;
        flex-direction: column;
      }
      .flex {
        -ms-flex: 1 1 0.000000001px;
        -webkit-flex: 1;
        flex: 1;
        -webkit-flex-basis: 0.000000001px;
        flex-basis: 0.000000001px;
      }
      wired-card {
        display: inline-block;
        background: white;
        text-align: left;
      }

      :host([open]) #container {
        pointer-events: auto;
      }
      :host([open]) #container::before {
        opacity: 1;
      }
      :host([open]) #overlay {
        opacity: 1;
        transform: none;
      }
    `;
        }
        render() {
            return html `
    <div id="container">
      <div id="overlay" class="vertical layout">
        <div class="flex"></div>
        <div style="text-align: center; padding: 5px;">
          <wired-card .elevation="${this.elevation}"><slot></slot></wired-card>
        </div>
        <div class="flex"></div>
      </div>
    </div>
    `;
        }
        updated() {
            if (this.card) {
                this.card.wiredRender(true);
            }
        }
    };
    __decorate$6([
        property({ type: Number }),
        __metadata$6("design:type", Object)
    ], exports.WiredDialog.prototype, "elevation", void 0);
    __decorate$6([
        property({ type: Boolean, reflect: true }),
        __metadata$6("design:type", Object)
    ], exports.WiredDialog.prototype, "open", void 0);
    __decorate$6([
        query('wired-card'),
        __metadata$6("design:type", exports.WiredCard)
    ], exports.WiredDialog.prototype, "card", void 0);
    exports.WiredDialog = __decorate$6([
        customElement('wired-dialog')
    ], exports.WiredDialog);

    var __decorate$7 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$7 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredDivider = class WiredDivider extends WiredBase {
        constructor() {
            super(...arguments);
            this.elevation = 1;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: block;
          position: relative;
        }
      `
            ];
        }
        render() {
            return html `<svg></svg>`;
        }
        canvasSize() {
            const size = this.getBoundingClientRect();
            const elev = Math.min(Math.max(1, this.elevation), 5);
            return [size.width, elev * 6];
        }
        draw(svg, size) {
            const elev = Math.min(Math.max(1, this.elevation), 5);
            for (let i = 0; i < elev; i++) {
                line(svg, 0, (i * 6) + 3, size[0], (i * 6) + 3);
            }
        }
    };
    __decorate$7([
        property({ type: Number }),
        __metadata$7("design:type", Object)
    ], exports.WiredDivider.prototype, "elevation", void 0);
    exports.WiredDivider = __decorate$7([
        customElement('wired-divider')
    ], exports.WiredDivider);

    var __decorate$8 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$8 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredFab = class WiredFab extends WiredBase {
        constructor() {
            super(...arguments);
            this.disabled = false;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          font-size: 14px;
          color: #fff;
        }
        button {
          position: relative;
          user-select: none;
          border: none;
          background: none;
          font-family: inherit;
          font-size: inherit;
          cursor: pointer;
          letter-spacing: 1.25px;
          text-transform: uppercase;
          text-align: center;
          padding: 16px;
          color: inherit;
          outline: none;
          border-radius: 50%;
        }
        button[disabled] {
          opacity: 0.6 !important;
          background: rgba(0, 0, 0, 0.07);
          cursor: default;
          pointer-events: none;
        }
        button::-moz-focus-inner {
          border: 0;
        }
        button ::slotted(*) {
          position: relative;
          font-size: var(--wired-icon-size, 24px);
          transition: transform 0.2s ease, opacity 0.2s ease;
          opacity: 0.85;
        }
        path {
          stroke: var(--wired-fab-bg-color, #018786);
          stroke-width: 3;
          fill: transparent;
        }

        button:focus ::slotted(*) {
          opacity: 1;
        }
        button:active ::slotted(*) {
          opacity: 1;
          transform: scale(1.15);
        }
      `
            ];
        }
        render() {
            return html `
    <button ?disabled="${this.disabled}">
      <div id="overlay">
        <svg></svg>
      </div>
      <slot @slotchange="${this.wiredRender}"></slot>
    </button>
    `;
        }
        canvasSize() {
            if (this.button) {
                const size = this.button.getBoundingClientRect();
                return [size.width, size.height];
            }
            return this.lastSize;
        }
        draw(svg, size) {
            const min = Math.min(size[0], size[1]);
            const g = hachureEllipseFill(min / 2, min / 2, min, min);
            svg.appendChild(g);
        }
    };
    __decorate$8([
        property({ type: Boolean, reflect: true }),
        __metadata$8("design:type", Object)
    ], exports.WiredFab.prototype, "disabled", void 0);
    __decorate$8([
        query('button'),
        __metadata$8("design:type", HTMLButtonElement)
    ], exports.WiredFab.prototype, "button", void 0);
    exports.WiredFab = __decorate$8([
        customElement('wired-fab')
    ], exports.WiredFab);

    var __decorate$9 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$9 = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredIconButton = class WiredIconButton extends WiredBase {
        constructor() {
            super(...arguments);
            this.disabled = false;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          font-size: 14px;
        }
        path {
          transition: transform 0.05s ease;
        }
        button {
          position: relative;
          user-select: none;
          border: none;
          background: none;
          font-family: inherit;
          font-size: inherit;
          cursor: pointer;
          letter-spacing: 1.25px;
          text-transform: uppercase;
          text-align: center;
          padding: 10px;
          color: inherit;
          outline: none;
          border-radius: 50%;
        }
        button[disabled] {
          opacity: 0.6 !important;
          background: rgba(0, 0, 0, 0.07);
          cursor: default;
          pointer-events: none;
        }
        button:active path {
          transform: scale(0.97) translate(1.5%, 1.5%);
        }
        button:focus path {
          stroke-width: 1.5;
        }
        button::-moz-focus-inner {
          border: 0;
        }
        button ::slotted(*) {
          position: relative;
          font-size: var(--wired-icon-size, 24px);
        }
      `
            ];
        }
        render() {
            return html `
    <button ?disabled="${this.disabled}">
      <slot @slotchange="${this.wiredRender}"></slot>
      <div id="overlay">
        <svg></svg>
      </div>
    </button>
    `;
        }
        canvasSize() {
            if (this.button) {
                const size = this.button.getBoundingClientRect();
                return [size.width, size.height];
            }
            return this.lastSize;
        }
        draw(svg, size) {
            const min = Math.min(size[0], size[1]);
            svg.setAttribute('width', `${min}`);
            svg.setAttribute('height', `${min}`);
            ellipse(svg, min / 2, min / 2, min, min);
        }
    };
    __decorate$9([
        property({ type: Boolean, reflect: true }),
        __metadata$9("design:type", Object)
    ], exports.WiredIconButton.prototype, "disabled", void 0);
    __decorate$9([
        query('button'),
        __metadata$9("design:type", HTMLButtonElement)
    ], exports.WiredIconButton.prototype, "button", void 0);
    exports.WiredIconButton = __decorate$9([
        customElement('wired-icon-button')
    ], exports.WiredIconButton);

    var __decorate$a = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$a = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    const EMPTY_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    exports.WiredImage = class WiredImage extends WiredBase {
        constructor() {
            super();
            this.elevation = 1;
            this.src = EMPTY_IMAGE;
            if (window.ResizeObserver) {
                this.resizeObserver = new window.ResizeObserver(() => {
                    if (this.svg) {
                        this.wiredRender();
                    }
                });
            }
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          position: relative;
          line-height: 1;
          padding: 3px;
        }
        img {
          display: block;
          box-sizing: border-box;
          max-width: 100%;
          max-height: 100%;
        }
        path {
          stroke-width: 1;
        }
      `
            ];
        }
        render() {
            return html `
    <img src="${this.src}">
    <div id="overlay"><svg></svg></div>
    `;
        }
        updated() {
            super.updated();
            this.attachResizeListener();
        }
        disconnectedCallback() {
            this.detachResizeListener();
        }
        attachResizeListener() {
            if (this.resizeObserver && this.resizeObserver.observe) {
                this.resizeObserver.observe(this);
            }
            else if (!this.windowResizeHandler) {
                this.windowResizeHandler = () => this.wiredRender();
                window.addEventListener('resize', this.windowResizeHandler, { passive: true });
            }
        }
        detachResizeListener() {
            if (this.resizeObserver && this.resizeObserver.unobserve) {
                this.resizeObserver.unobserve(this);
            }
            if (this.windowResizeHandler) {
                window.removeEventListener('resize', this.windowResizeHandler);
            }
        }
        canvasSize() {
            const s = this.getBoundingClientRect();
            const elev = Math.min(Math.max(1, this.elevation), 5);
            const w = s.width + ((elev - 1) * 2);
            const h = s.height + ((elev - 1) * 2);
            return [w, h];
        }
        draw(svg, size) {
            const elev = Math.min(Math.max(1, this.elevation), 5);
            const s = {
                width: size[0] - ((elev - 1) * 2),
                height: size[1] - ((elev - 1) * 2)
            };
            rectangle(svg, 2, 2, s.width - 4, s.height - 4);
            for (let i = 1; i < elev; i++) {
                (line(svg, (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), s.height - 4 + (i * 2))).style.opacity = `${(85 - (i * 10)) / 100}`;
                (line(svg, s.width - 4 + (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), i * 2)).style.opacity = `${(85 - (i * 10)) / 100}`;
                (line(svg, (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), s.height - 4 + (i * 2))).style.opacity = `${(85 - (i * 10)) / 100}`;
                (line(svg, s.width - 4 + (i * 2), s.height - 4 + (i * 2), s.width - 4 + (i * 2), i * 2)).style.opacity = `${(85 - (i * 10)) / 100}`;
            }
        }
    };
    __decorate$a([
        property({ type: Number }),
        __metadata$a("design:type", Object)
    ], exports.WiredImage.prototype, "elevation", void 0);
    __decorate$a([
        property({ type: String }),
        __metadata$a("design:type", String)
    ], exports.WiredImage.prototype, "src", void 0);
    exports.WiredImage = __decorate$a([
        customElement('wired-image'),
        __metadata$a("design:paramtypes", [])
    ], exports.WiredImage);

    var __decorate$b = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$b = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredInput = class WiredInput extends WiredBase {
        constructor() {
            super(...arguments);
            this.disabled = false;
            this.placeholder = '';
            this.type = 'text';
            this.autocomplete = '';
            this.autocapitalize = '';
            this.autocorrect = '';
            this.required = false;
            this.autofocus = false;
            this.readonly = false;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          position: relative;
          padding: 5px;
          font-family: sans-serif;
          width: 150px;
          outline: none;
        }
        :host([disabled]) {
          opacity: 0.6 !important;
          cursor: default;
          pointer-events: none;
        }
        :host([disabled]) svg {
          background: rgba(0, 0, 0, 0.07);
        }
        input {
          display: block;
          width: 100%;
          box-sizing: border-box;
          outline: none;
          border: none;
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          color: inherit;
          padding: 6px;
        }
      `
            ];
        }
        render() {
            return html `
    <input name="${this.name}" type="${this.type}" placeholder="${this.placeholder}" ?disabled="${this.disabled}"
      ?required="${this.required}" autocomplete="${this.autocomplete}" ?autofocus="${this.autofocus}" minlength="${this.minlength}"
      maxlength="${this.maxlength}" min="${this.min}" max="${this.max}" step="${this.step}" ?readonly="${this.readonly}"
      size="${this.size}" autocapitalize="${this.autocapitalize}" autocorrect="${this.autocorrect}" 
      @change="${this.refire}" @input="${this.refire}">
    <div id="overlay">
      <svg></svg>
    </div>
    `;
        }
        get input() {
            return this.textInput;
        }
        get value() {
            const input = this.input;
            return (input && input.value) || '';
        }
        set value(v) {
            if (this.shadowRoot) {
                const input = this.input;
                if (input) {
                    input.value = v;
                }
            }
            else {
                this.pendingValue = v;
            }
        }
        firstUpdated() {
            this.value = this.pendingValue || this.value || this.getAttribute('value') || '';
            delete this.pendingValue;
        }
        canvasSize() {
            const s = this.getBoundingClientRect();
            return [s.width, s.height];
        }
        draw(svg, size) {
            rectangle(svg, 2, 2, size[0] - 2, size[1] - 2);
        }
        refire(event) {
            event.stopPropagation();
            fire(this, event.type, { sourceEvent: event });
        }
    };
    __decorate$b([
        property({ type: Boolean, reflect: true }),
        __metadata$b("design:type", Object)
    ], exports.WiredInput.prototype, "disabled", void 0);
    __decorate$b([
        property({ type: String }),
        __metadata$b("design:type", Object)
    ], exports.WiredInput.prototype, "placeholder", void 0);
    __decorate$b([
        property({ type: String }),
        __metadata$b("design:type", String)
    ], exports.WiredInput.prototype, "name", void 0);
    __decorate$b([
        property({ type: String }),
        __metadata$b("design:type", String)
    ], exports.WiredInput.prototype, "min", void 0);
    __decorate$b([
        property({ type: String }),
        __metadata$b("design:type", String)
    ], exports.WiredInput.prototype, "max", void 0);
    __decorate$b([
        property({ type: String }),
        __metadata$b("design:type", String)
    ], exports.WiredInput.prototype, "step", void 0);
    __decorate$b([
        property({ type: String }),
        __metadata$b("design:type", Object)
    ], exports.WiredInput.prototype, "type", void 0);
    __decorate$b([
        property({ type: String }),
        __metadata$b("design:type", Object)
    ], exports.WiredInput.prototype, "autocomplete", void 0);
    __decorate$b([
        property({ type: String }),
        __metadata$b("design:type", Object)
    ], exports.WiredInput.prototype, "autocapitalize", void 0);
    __decorate$b([
        property({ type: String }),
        __metadata$b("design:type", Object)
    ], exports.WiredInput.prototype, "autocorrect", void 0);
    __decorate$b([
        property({ type: Boolean }),
        __metadata$b("design:type", Object)
    ], exports.WiredInput.prototype, "required", void 0);
    __decorate$b([
        property({ type: Boolean }),
        __metadata$b("design:type", Object)
    ], exports.WiredInput.prototype, "autofocus", void 0);
    __decorate$b([
        property({ type: Boolean }),
        __metadata$b("design:type", Object)
    ], exports.WiredInput.prototype, "readonly", void 0);
    __decorate$b([
        property({ type: Number }),
        __metadata$b("design:type", Number)
    ], exports.WiredInput.prototype, "minlength", void 0);
    __decorate$b([
        property({ type: Number }),
        __metadata$b("design:type", Number)
    ], exports.WiredInput.prototype, "maxlength", void 0);
    __decorate$b([
        property({ type: Number }),
        __metadata$b("design:type", Number)
    ], exports.WiredInput.prototype, "size", void 0);
    __decorate$b([
        query('input'),
        __metadata$b("design:type", HTMLInputElement)
    ], exports.WiredInput.prototype, "textInput", void 0);
    exports.WiredInput = __decorate$b([
        customElement('wired-input')
    ], exports.WiredInput);

    var __decorate$c = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$c = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredItem = class WiredItem extends WiredBase {
        constructor() {
            super(...arguments);
            this.value = '';
            this.name = '';
            this.selected = false;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
      :host {
        display: inline-block;
        font-size: 14px;
        text-align: left;
      }
      button {
        cursor: pointer;
        outline: none;
        overflow: hidden;
        color: inherit;
        user-select: none;
        position: relative;
        font-family: inherit;
        text-align: inherit;
        font-size: inherit;
        letter-spacing: 1.25px;
        padding: 1px 10px;
        min-height: 36px;
        text-transform: inherit;
        background: none;
        border: none;
        transition: background-color 0.3s ease, color 0.3s ease;
        width: 100%;
        box-sizing: border-box;
        white-space: nowrap;
      }
      button.selected {
        color: var(--wired-item-selected-color, #fff);
      }
      button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: currentColor;
        opacity: 0;
      }
      button span {
        display: inline-block;
        transition: transform 0.2s ease;
        position: relative;
      }
      button:active span {
        transform: scale(1.02);
      }
      #overlay {
        display: none;
      }
      button.selected #overlay {
        display: block;
      }
      svg path {
        stroke: var(--wired-item-selected-bg, #000);
        stroke-width: 2.75;
        fill: transparent;
        transition: transform 0.05s ease;
      }
      @media (hover: hover) {
        button:hover::before {
          opacity: 0.05;
        }
      }
      `
            ];
        }
        render() {
            return html `
    <button class="${this.selected ? 'selected' : ''}">
      <div id="overlay"><svg></svg></div>
      <span><slot></slot></span>
    </button>`;
        }
        canvasSize() {
            const s = this.getBoundingClientRect();
            return [s.width, s.height];
        }
        draw(svg, size) {
            const g = hachureFill([
                [0, 0],
                [size[0], 0],
                [size[0], size[1]],
                [0, size[1]]
            ]);
            svg.appendChild(g);
        }
    };
    __decorate$c([
        property(),
        __metadata$c("design:type", Object)
    ], exports.WiredItem.prototype, "value", void 0);
    __decorate$c([
        property(),
        __metadata$c("design:type", Object)
    ], exports.WiredItem.prototype, "name", void 0);
    __decorate$c([
        property({ type: Boolean }),
        __metadata$c("design:type", Object)
    ], exports.WiredItem.prototype, "selected", void 0);
    exports.WiredItem = __decorate$c([
        customElement('wired-item')
    ], exports.WiredItem);

    var __decorate$d = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$d = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredLink = class WiredLink extends WiredBase {
        constructor() {
            super(...arguments);
            this.elevation = 1;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          position: relative;
        }
        a, a:hover, a:visited {
          color: inherit;
          outline: none;
          display: inline-block;
          white-space: nowrap;
          text-decoration: none;
          border: none;
        }
        path {
          stroke: var(--wired-link-decoration-color, blue);
          stroke-opacity: 0.45;
        }
        a:focus path {
          stroke-opacity: 1;
        }
      `
            ];
        }
        render() {
            return html `
    <a href="${this.href}" target="${this.target || ''}">
      <slot></slot>
      <div id="overlay"><svg></svg></div>
    </a>
    `;
        }
        focus() {
            if (this.anchor) {
                this.anchor.focus();
            }
            else {
                super.focus();
            }
        }
        canvasSize() {
            if (this.anchor) {
                const size = this.anchor.getBoundingClientRect();
                const elev = Math.min(Math.max(1, this.elevation), 5);
                const w = size.width;
                const h = size.height + ((elev - 1) * 2);
                return [w, h];
            }
            return this.lastSize;
        }
        draw(svg, size) {
            const elev = Math.min(Math.max(1, this.elevation), 5);
            const s = {
                width: size[0],
                height: size[1] - ((elev - 1) * 2)
            };
            for (let i = 0; i < elev; i++) {
                line(svg, 0, s.height + (i * 2) - 2, s.width, s.height + (i * 2) - 2);
                line(svg, 0, s.height + (i * 2) - 2, s.width, s.height + (i * 2) - 2);
            }
        }
    };
    __decorate$d([
        property({ type: Number }),
        __metadata$d("design:type", Object)
    ], exports.WiredLink.prototype, "elevation", void 0);
    __decorate$d([
        property({ type: String }),
        __metadata$d("design:type", String)
    ], exports.WiredLink.prototype, "href", void 0);
    __decorate$d([
        property({ type: String }),
        __metadata$d("design:type", String)
    ], exports.WiredLink.prototype, "target", void 0);
    __decorate$d([
        query('a'),
        __metadata$d("design:type", HTMLAnchorElement)
    ], exports.WiredLink.prototype, "anchor", void 0);
    exports.WiredLink = __decorate$d([
        customElement('wired-link')
    ], exports.WiredLink);

    var __decorate$e = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$e = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredListbox = class WiredListbox extends WiredBase {
        constructor() {
            super(...arguments);
            this.horizontal = false;
            this.itemNodes = [];
            this.itemClickHandler = this.onItemClick.bind(this);
        }
        static get styles() {
            return [
                BaseCSS,
                css `
      :host {
        display: inline-block;
        font-family: inherit;
        position: relative;
        padding: 5px;
        outline: none;
      }
      :host(:focus) path {
        stroke-width: 1.5;
      }
      ::slotted(wired-item) {
        display: block;
      }
      :host(.wired-horizontal) ::slotted(wired-item) {
        display: inline-block;
      }
      `
            ];
        }
        render() {
            return html `
    <slot id="slot" @slotchange="${() => this.requestUpdate()}"></slot>
    <div id="overlay">
      <svg id="svg"></svg>
    </div>
    `;
        }
        firstUpdated() {
            this.setAttribute('role', 'listbox');
            this.tabIndex = +((this.getAttribute('tabindex') || 0));
            this.refreshSelection();
            this.addEventListener('click', this.itemClickHandler);
            this.addEventListener('keydown', (event) => {
                switch (event.keyCode) {
                    case 37:
                    case 38:
                        event.preventDefault();
                        this.selectPrevious();
                        break;
                    case 39:
                    case 40:
                        event.preventDefault();
                        this.selectNext();
                        break;
                }
            });
        }
        updated() {
            super.updated();
            if (this.horizontal) {
                this.classList.add('wired-horizontal');
            }
            else {
                this.classList.remove('wired-horizontal');
            }
            if (!this.itemNodes.length) {
                this.itemNodes = [];
                const nodes = this.shadowRoot.getElementById('slot').assignedNodes();
                if (nodes && nodes.length) {
                    for (let i = 0; i < nodes.length; i++) {
                        const element = nodes[i];
                        if (element.tagName === 'WIRED-ITEM') {
                            element.setAttribute('role', 'option');
                            this.itemNodes.push(element);
                        }
                    }
                }
            }
        }
        onItemClick(event) {
            event.stopPropagation();
            this.selected = event.target.value;
            this.refreshSelection();
            this.fireSelected();
        }
        refreshSelection() {
            if (this.lastSelectedItem) {
                this.lastSelectedItem.selected = false;
                this.lastSelectedItem.removeAttribute('aria-selected');
            }
            const slot = this.shadowRoot.getElementById('slot');
            const nodes = slot.assignedNodes();
            if (nodes) {
                let selectedItem = null;
                for (let i = 0; i < nodes.length; i++) {
                    const element = nodes[i];
                    if (element.tagName === 'WIRED-ITEM') {
                        const value = element.value || '';
                        if (this.selected && (value === this.selected)) {
                            selectedItem = element;
                            break;
                        }
                    }
                }
                this.lastSelectedItem = selectedItem || undefined;
                if (this.lastSelectedItem) {
                    this.lastSelectedItem.selected = true;
                    this.lastSelectedItem.setAttribute('aria-selected', 'true');
                }
                if (selectedItem) {
                    this.value = {
                        value: selectedItem.value || '',
                        text: selectedItem.textContent || ''
                    };
                }
                else {
                    this.value = undefined;
                }
            }
        }
        fireSelected() {
            fire(this, 'selected', { selected: this.selected });
        }
        selectPrevious() {
            const list = this.itemNodes;
            if (list.length) {
                let index = -1;
                for (let i = 0; i < list.length; i++) {
                    if (list[i] === this.lastSelectedItem) {
                        index = i;
                        break;
                    }
                }
                if (index < 0) {
                    index = 0;
                }
                else if (index === 0) {
                    index = list.length - 1;
                }
                else {
                    index--;
                }
                this.selected = list[index].value || '';
                this.refreshSelection();
                this.fireSelected();
            }
        }
        selectNext() {
            const list = this.itemNodes;
            if (list.length) {
                let index = -1;
                for (let i = 0; i < list.length; i++) {
                    if (list[i] === this.lastSelectedItem) {
                        index = i;
                        break;
                    }
                }
                if (index < 0) {
                    index = 0;
                }
                else if (index >= (list.length - 1)) {
                    index = 0;
                }
                else {
                    index++;
                }
                this.selected = list[index].value || '';
                this.refreshSelection();
                this.fireSelected();
            }
        }
        canvasSize() {
            const s = this.getBoundingClientRect();
            return [s.width, s.height];
        }
        draw(svg, size) {
            rectangle(svg, 0, 0, size[0], size[1]);
        }
    };
    __decorate$e([
        property({ type: Object }),
        __metadata$e("design:type", Object)
    ], exports.WiredListbox.prototype, "value", void 0);
    __decorate$e([
        property({ type: String }),
        __metadata$e("design:type", String)
    ], exports.WiredListbox.prototype, "selected", void 0);
    __decorate$e([
        property({ type: Boolean }),
        __metadata$e("design:type", Object)
    ], exports.WiredListbox.prototype, "horizontal", void 0);
    exports.WiredListbox = __decorate$e([
        customElement('wired-listbox')
    ], exports.WiredListbox);

    var __decorate$f = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$f = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredProgress = class WiredProgress extends WiredBase {
        constructor() {
            super(...arguments);
            this.value = 0;
            this.min = 0;
            this.max = 100;
            this.percentage = false;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
      :host {
        display: inline-block;
        position: relative;
        width: 400px;
        height: 42px;
        font-family: sans-serif;
      }
      .labelContainer {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .progressLabel {
        color: var(--wired-progress-label-color, #000);
        font-size: var(--wired-progress-font-size, 14px);
        background: var(--wired-progress-label-background, rgba(255,255,255,0.9));
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 1.25px;
      }
      .progbox path {
        stroke: var(--wired-progress-color, rgba(0, 0, 200, 0.8));
        stroke-width: 2.75;
        fill: none;
      }
      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
      }
      `
            ];
        }
        render() {
            return html `
    <div id="overlay" class="overlay">
      <svg></svg>
    </div>
    <div class="overlay labelContainer">
      <div class="progressLabel">${this.getProgressLabel()}</div>
    </div>
    `;
        }
        getProgressLabel() {
            if (this.percentage) {
                if (this.max === this.min) {
                    return '%';
                }
                else {
                    const pct = Math.floor(((this.value - this.min) / (this.max - this.min)) * 100);
                    return (pct + '%');
                }
            }
            else {
                return ('' + this.value);
            }
        }
        wiredRender(force = false) {
            super.wiredRender(force);
            this.refreshProgressFill();
        }
        canvasSize() {
            const s = this.getBoundingClientRect();
            return [s.width, s.height];
        }
        draw(svg, size) {
            rectangle(svg, 2, 2, size[0] - 2, size[1] - 2);
        }
        refreshProgressFill() {
            if (this.progBox) {
                if (this.progBox.parentElement) {
                    this.progBox.parentElement.removeChild(this.progBox);
                }
                this.progBox = undefined;
            }
            if (this.svg) {
                let pct = 0;
                const s = this.getBoundingClientRect();
                if (this.max > this.min) {
                    pct = (this.value - this.min) / (this.max - this.min);
                    const progWidth = s.width * Math.max(0, Math.min(pct, 100));
                    this.progBox = hachureFill([
                        [0, 0],
                        [progWidth, 0],
                        [progWidth, s.height],
                        [0, s.height]
                    ]);
                    this.svg.appendChild(this.progBox);
                    this.progBox.classList.add('progbox');
                }
            }
        }
    };
    __decorate$f([
        property({ type: Number }),
        __metadata$f("design:type", Object)
    ], exports.WiredProgress.prototype, "value", void 0);
    __decorate$f([
        property({ type: Number }),
        __metadata$f("design:type", Object)
    ], exports.WiredProgress.prototype, "min", void 0);
    __decorate$f([
        property({ type: Number }),
        __metadata$f("design:type", Object)
    ], exports.WiredProgress.prototype, "max", void 0);
    __decorate$f([
        property({ type: Boolean }),
        __metadata$f("design:type", Object)
    ], exports.WiredProgress.prototype, "percentage", void 0);
    exports.WiredProgress = __decorate$f([
        customElement('wired-progress')
    ], exports.WiredProgress);

    var __decorate$g = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$g = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredRadio = class WiredRadio extends WiredBase {
        constructor() {
            super(...arguments);
            this.checked = false;
            this.disabled = false;
            this.focused = false;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
      :host {
        display: inline-block;
        font-family: inherit;
      }
      :host([disabled]) {
        opacity: 0.6 !important;
        cursor: default;
        pointer-events: none;
      }
      :host([disabled]) svg {
        background: rgba(0, 0, 0, 0.07);
      }

      #container {
        display: flex;
        flex-direction: row;
        position: relative;
        user-select: none;
        min-height: 24px;
        cursor: pointer;
      }
      span {
        margin-left: 1.5ex;
        line-height: 24px;
      }
      input {
        opacity: 0;
      }
      path {
        stroke: var(--wired-radio-icon-color, currentColor);
        stroke-width: var(--wired-radio-default-swidth, 0.7);
      }
      g path {
        stroke-width: 0;
        fill: var(--wired-radio-icon-color, currentColor);
      }
      #container.focused {
        --wired-radio-default-swidth: 1.5;
      }
      `
            ];
        }
        focus() {
            if (this.input) {
                this.input.focus();
            }
            else {
                super.focus();
            }
        }
        wiredRender(force = false) {
            super.wiredRender(force);
            this.refreshCheckVisibility();
        }
        render() {
            return html `
    <label id="container" class="${this.focused ? 'focused' : ''}">
      <input type="checkbox" .checked="${this.checked}" ?disabled="${this.disabled}" 
        @change="${this.onChange}"
        @focus="${() => this.focused = true}"
        @blur="${() => this.focused = false}">
      <span><slot></slot></span>
      <div id="overlay"><svg></svg></div>
    </label>
    `;
        }
        onChange() {
            this.checked = this.input.checked;
            this.refreshCheckVisibility();
            fire(this, 'change', { checked: this.checked });
        }
        canvasSize() {
            return [24, 24];
        }
        draw(svg, size) {
            ellipse(svg, size[0] / 2, size[1] / 2, size[0], size[1]);
            this.svgCheck = svgNode('g');
            svg.appendChild(this.svgCheck);
            const iw = Math.max(size[0] * 0.6, 5);
            const ih = Math.max(size[1] * 0.6, 5);
            ellipse(this.svgCheck, size[0] / 2, size[1] / 2, iw, ih);
        }
        refreshCheckVisibility() {
            if (this.svgCheck) {
                this.svgCheck.style.display = this.checked ? '' : 'none';
            }
        }
    };
    __decorate$g([
        property({ type: Boolean }),
        __metadata$g("design:type", Object)
    ], exports.WiredRadio.prototype, "checked", void 0);
    __decorate$g([
        property({ type: Boolean, reflect: true }),
        __metadata$g("design:type", Object)
    ], exports.WiredRadio.prototype, "disabled", void 0);
    __decorate$g([
        property({ type: String }),
        __metadata$g("design:type", String)
    ], exports.WiredRadio.prototype, "name", void 0);
    __decorate$g([
        property(),
        __metadata$g("design:type", Object)
    ], exports.WiredRadio.prototype, "focused", void 0);
    __decorate$g([
        query('input'),
        __metadata$g("design:type", HTMLInputElement)
    ], exports.WiredRadio.prototype, "input", void 0);
    exports.WiredRadio = __decorate$g([
        customElement('wired-radio')
    ], exports.WiredRadio);

    var __decorate$h = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$h = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredRadioGroup = class WiredRadioGroup extends LitElement {
        constructor() {
            super(...arguments);
            this.radioNodes = [];
            this.checkListener = this.handleChecked.bind(this);
        }
        static get styles() {
            return css `
      :host {
        display: inline-block;
        font-family: inherit;
        outline: none;
      }
      :host ::slotted(*) {
        padding: var(--wired-radio-group-item-padding, 5px);
      }
    `;
        }
        render() {
            return html `<slot id="slot" @slotchange="${this.slotChange}"></slot>`;
        }
        connectedCallback() {
            super.connectedCallback();
            this.addEventListener('change', this.checkListener);
        }
        disconnectedCallback() {
            if (super.disconnectedCallback)
                super.disconnectedCallback();
            this.removeEventListener('change', this.checkListener);
        }
        handleChecked(event) {
            const checked = event.detail.checked;
            const item = event.target;
            const name = item.name || '';
            if (!checked) {
                item.checked = true;
            }
            else {
                this.selected = (checked && name) || '';
                this.fireSelected();
            }
        }
        slotChange() {
            this.requestUpdate();
        }
        firstUpdated() {
            this.setAttribute('role', 'radiogroup');
            this.tabIndex = +(this.getAttribute('tabindex') || 0);
            this.addEventListener('keydown', (event) => {
                switch (event.keyCode) {
                    case 37:
                    case 38:
                        event.preventDefault();
                        this.selectPrevious();
                        break;
                    case 39:
                    case 40:
                        event.preventDefault();
                        this.selectNext();
                        break;
                }
            });
        }
        updated() {
            const slot = this.shadowRoot.getElementById('slot');
            const nodes = slot.assignedNodes();
            this.radioNodes = [];
            if (nodes && nodes.length) {
                for (let i = 0; i < nodes.length; i++) {
                    const element = nodes[i];
                    if (element.tagName === 'WIRED-RADIO') {
                        this.radioNodes.push(element);
                        const name = element.name || '';
                        if (this.selected && (name === this.selected)) {
                            element.checked = true;
                        }
                        else {
                            element.checked = false;
                        }
                    }
                }
            }
        }
        selectPrevious() {
            const list = this.radioNodes;
            if (list.length) {
                let radio = null;
                let index = -1;
                if (this.selected) {
                    for (let i = 0; i < list.length; i++) {
                        const n = list[i];
                        if (n.name === this.selected) {
                            index = i;
                            break;
                        }
                    }
                    if (index < 0) {
                        radio = list[0];
                    }
                    else {
                        index--;
                        if (index < 0) {
                            index = list.length - 1;
                        }
                        radio = list[index];
                    }
                }
                else {
                    radio = list[0];
                }
                if (radio) {
                    radio.focus();
                    this.selected = radio.name;
                    this.fireSelected();
                }
            }
        }
        selectNext() {
            const list = this.radioNodes;
            if (list.length) {
                let radio = null;
                let index = -1;
                if (this.selected) {
                    for (let i = 0; i < list.length; i++) {
                        const n = list[i];
                        if (n.name === this.selected) {
                            index = i;
                            break;
                        }
                    }
                    if (index < 0) {
                        radio = list[0];
                    }
                    else {
                        index++;
                        if (index >= list.length) {
                            index = 0;
                        }
                        radio = list[index];
                    }
                }
                else {
                    radio = list[0];
                }
                if (radio) {
                    radio.focus();
                    this.selected = radio.name;
                    this.fireSelected();
                }
            }
        }
        fireSelected() {
            fire(this, 'selected', { selected: this.selected });
        }
    };
    __decorate$h([
        property({ type: String }),
        __metadata$h("design:type", String)
    ], exports.WiredRadioGroup.prototype, "selected", void 0);
    exports.WiredRadioGroup = __decorate$h([
        customElement('wired-radio-group')
    ], exports.WiredRadioGroup);

    var __decorate$i = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$i = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredSearchInput = class WiredSearchInput extends WiredBase {
        constructor() {
            super(...arguments);
            this.disabled = false;
            this.placeholder = '';
            this.autocomplete = '';
            this.autocorrect = '';
            this.autofocus = false;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          position: relative;
          padding: 10px 40px 10px 5px;
          font-family: sans-serif;
          width: 180px;
          outline: none;
        }
        :host([disabled]) {
          opacity: 0.6 !important;
          cursor: default;
          pointer-events: none;
        }
        :host([disabled]) svg {
          background: rgba(0, 0, 0, 0.07);
        }
        input {
          display: block;
          width: 100%;
          box-sizing: border-box;
          outline: none;
          border: none;
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          color: inherit;
          padding: 6px;
        }
        
        input[type=search]::-ms-clear {  display: none; width : 0; height: 0; }
        input[type=search]::-ms-reveal {  display: none; width : 0; height: 0; }
        input[type="search"]::-webkit-search-decoration,
        input[type="search"]::-webkit-search-cancel-button,
        input[type="search"]::-webkit-search-results-button,
        input[type="search"]::-webkit-search-results-decoration {
          display: none;
        }

        .thicker path {
          stroke-width: 1.5;
        }

        button {
          position: absolute;
          top: 0;
          right: 2px;
          width: 32px;
          height: 100%;
          box-sizing: border-box;
          background: none;
          border: none;
          cursor: pointer;
          outline: none;
          opacity: 0;
        }
      `
            ];
        }
        render() {
            return html `
    <input type="search" placeholder="${this.placeholder}" ?disabled="${this.disabled}"
      autocomplete="${this.autocomplete}" ?autofocus="${this.autofocus}" 
      autocapitalize="${this.autocapitalize}" autocorrect="${this.autocorrect}" 
      @change="${this.refire}" @input="${this.refire}">
    <div id="overlay">
      <svg></svg>
    </div>
    <button @click="${() => this.value = ''}"></button>
    `;
        }
        get input() {
            return this.textInput;
        }
        get value() {
            const input = this.input;
            return (input && input.value) || '';
        }
        set value(v) {
            if (this.shadowRoot) {
                const input = this.input;
                if (input) {
                    input.value = v;
                }
                this.refreshIconState();
            }
            else {
                this.pendingValue = v;
            }
        }
        wiredRender(force = false) {
            super.wiredRender(force);
            this.refreshIconState();
        }
        firstUpdated() {
            this.value = this.pendingValue || this.value || this.getAttribute('value') || '';
            delete this.pendingValue;
        }
        canvasSize() {
            const s = this.getBoundingClientRect();
            return [s.width, s.height];
        }
        draw(svg, size) {
            rectangle(svg, 2, 2, size[0] - 2, size[1] - 2);
            this.searchIcon = svgNode('g');
            this.searchIcon.classList.add('thicker');
            svg.appendChild(this.searchIcon);
            ellipse(this.searchIcon, size[0] - 30, (size[1] - 30) / 2 + 10, 20, 20);
            line(this.searchIcon, size[0] - 10, (size[1] - 30) / 2 + 30, size[0] - 25, (size[1] - 30) / 2 + 15);
            this.closeIcon = svgNode('g');
            this.closeIcon.classList.add('thicker');
            svg.appendChild(this.closeIcon);
            line(this.closeIcon, size[0] - 33, (size[1] - 30) / 2 + 2, size[0] - 7, (size[1] - 30) / 2 + 28);
            line(this.closeIcon, size[0] - 7, (size[1] - 30) / 2 + 2, size[0] - 33, (size[1] - 30) / 2 + 28);
        }
        refreshIconState() {
            if (this.searchIcon && this.closeIcon) {
                this.searchIcon.style.display = this.value.trim() ? 'none' : '';
                this.closeIcon.style.display = this.value.trim() ? '' : 'none';
            }
        }
        refire(event) {
            this.refreshIconState();
            event.stopPropagation();
            fire(this, event.type, { sourceEvent: event });
        }
    };
    __decorate$i([
        property({ type: Boolean, reflect: true }),
        __metadata$i("design:type", Object)
    ], exports.WiredSearchInput.prototype, "disabled", void 0);
    __decorate$i([
        property({ type: String }),
        __metadata$i("design:type", Object)
    ], exports.WiredSearchInput.prototype, "placeholder", void 0);
    __decorate$i([
        property({ type: String }),
        __metadata$i("design:type", Object)
    ], exports.WiredSearchInput.prototype, "autocomplete", void 0);
    __decorate$i([
        property({ type: String }),
        __metadata$i("design:type", Object)
    ], exports.WiredSearchInput.prototype, "autocorrect", void 0);
    __decorate$i([
        property({ type: Boolean }),
        __metadata$i("design:type", Object)
    ], exports.WiredSearchInput.prototype, "autofocus", void 0);
    __decorate$i([
        query('input'),
        __metadata$i("design:type", HTMLInputElement)
    ], exports.WiredSearchInput.prototype, "textInput", void 0);
    exports.WiredSearchInput = __decorate$i([
        customElement('wired-search-input')
    ], exports.WiredSearchInput);

    var __decorate$j = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$j = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredSlider = class WiredSlider extends WiredBase {
        constructor() {
            super(...arguments);
            this.min = 0;
            this.max = 100;
            this.step = 1;
            this.disabled = false;
            this.canvasWidth = 300;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
      :host {
        display: inline-block;
        position: relative;
        width: 300px;
        box-sizing: border-box;
      }
      :host([disabled]) {
        opacity: 0.45 !important;
        cursor: default;
        pointer-events: none;
        background: rgba(0, 0, 0, 0.07);
        border-radius: 5px;
      }
      input[type=range] {
        width: 100%;
        height: 40px;
        box-sizing: border-box;
        margin: 0;
        -webkit-appearance: none;
        background: transparent;
        outline: none;
        position: relative;
      }
      input[type=range]:focus {
        outline: none;
      }
      input[type=range]::-ms-track {
        width: 100%;
        cursor: pointer;
        background: transparent;
        border-color: transparent;
        color: transparent;
      }
      input[type=range]::-moz-focus-outer {
        outline: none;
        border: 0;
      }
      input[type=range]::-moz-range-thumb {
        border-radius: 50px;
        background: none;
        cursor: pointer;
        border: none;
        margin: 0;
        height: 20px;
        width: 20px;
        line-height: 1;
      }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        border-radius: 50px;
        background: none;
        cursor: pointer;
        border: none;
        height: 20px;
        width: 20px;
        margin: 0;
        line-height: 1;
      }
      .knob{
        fill: var(--wired-slider-knob-color, rgb(51, 103, 214));
        stroke: var(--wired-slider-knob-color, rgb(51, 103, 214));
      }
      .bar {
        stroke: var(--wired-slider-bar-color, rgb(0, 0, 0));
      }
      input:focus + div svg .knob {
        stroke: var(--wired-slider-knob-outline-color, #000);
        fill-opacity: 0.8;
      }
      `
            ];
        }
        get value() {
            if (this.input) {
                return +this.input.value;
            }
            return this.min;
        }
        set value(v) {
            if (this.input) {
                this.input.value = `${v}`;
            }
            else {
                this.pendingValue = v;
            }
            this.updateThumbPosition();
        }
        firstUpdated() {
            this.value = this.pendingValue || this.value || +(this.getAttribute('value') || this.min);
            delete this.pendingValue;
        }
        render() {
            return html `
    <div id="container">
      <input type="range" 
        min="${this.min}"
        max="${this.max}"
        step="${this.step}"
        ?disabled="${this.disabled}"
        @input="${this.onInput}">
      <div id="overlay">
        <svg></svg>
      </div>
    </div>
    `;
        }
        focus() {
            if (this.input) {
                this.input.focus();
            }
            else {
                super.focus();
            }
        }
        onInput(e) {
            e.stopPropagation();
            this.updateThumbPosition();
            if (this.input) {
                fire(this, 'change', { value: +this.input.value });
            }
        }
        wiredRender(force = false) {
            super.wiredRender(force);
            this.updateThumbPosition();
        }
        canvasSize() {
            const s = this.getBoundingClientRect();
            return [s.width, s.height];
        }
        draw(svg, size) {
            this.canvasWidth = size[0];
            const midY = Math.round(size[1] / 2);
            line(svg, 0, midY, size[0], midY).classList.add('bar');
            this.knob = ellipse(svg, 10, midY, 20, 20);
            this.knob.classList.add('knob');
        }
        updateThumbPosition() {
            if (this.input) {
                const value = +this.input.value;
                const delta = Math.max(this.step, this.max - this.min);
                const pct = (value - this.min) / delta;
                if (this.knob) {
                    this.knob.style.transform = `translateX(${pct * (this.canvasWidth - 20)}px)`;
                }
            }
        }
    };
    __decorate$j([
        property({ type: Number }),
        __metadata$j("design:type", Object)
    ], exports.WiredSlider.prototype, "min", void 0);
    __decorate$j([
        property({ type: Number }),
        __metadata$j("design:type", Object)
    ], exports.WiredSlider.prototype, "max", void 0);
    __decorate$j([
        property({ type: Number }),
        __metadata$j("design:type", Object)
    ], exports.WiredSlider.prototype, "step", void 0);
    __decorate$j([
        property({ type: Boolean, reflect: true }),
        __metadata$j("design:type", Object)
    ], exports.WiredSlider.prototype, "disabled", void 0);
    __decorate$j([
        query('input'),
        __metadata$j("design:type", HTMLInputElement)
    ], exports.WiredSlider.prototype, "input", void 0);
    exports.WiredSlider = __decorate$j([
        customElement('wired-slider')
    ], exports.WiredSlider);

    var __decorate$k = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$k = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredSpinner = class WiredSpinner extends WiredBase {
        constructor() {
            super(...arguments);
            this.spinning = false;
            this.duration = 1500;
            this.value = 0;
            this.timerstart = 0;
            this.frame = 0;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          position: relative;
        }
        path {
          stroke: currentColor;
          stroke-opacity: 0.65;
          stroke-width: 1.5;
          fill: none;
        }
        .knob {
          stroke-width: 2.8 !important;
          stroke-opacity: 1;
        }
      `
            ];
        }
        render() {
            return html `<svg></svg>`;
        }
        canvasSize() {
            return [76, 76];
        }
        draw(svg, size) {
            ellipse(svg, size[0] / 2, size[1] / 2, Math.floor(size[0] * 0.8), Math.floor(0.8 * size[1]));
            this.knob = hachureEllipseFill(0, 0, 20, 20);
            this.knob.classList.add('knob');
            svg.appendChild(this.knob);
            this.updateCursor();
        }
        updateCursor() {
            if (this.knob) {
                const position = [
                    Math.round(38 + 25 * Math.cos(this.value * Math.PI * 2)),
                    Math.round(38 + 25 * Math.sin(this.value * Math.PI * 2))
                ];
                this.knob.style.transform = `translate3d(${position[0]}px, ${position[1]}px, 0) rotateZ(${Math.round(this.value * 360 * 2)}deg)`;
            }
        }
        updated() {
            super.updated();
            if (this.spinning) {
                this.startSpinner();
            }
            else {
                this.stopSpinner();
            }
        }
        startSpinner() {
            this.stopSpinner();
            this.value = 0;
            this.timerstart = 0;
            this.nextTick();
        }
        stopSpinner() {
            if (this.frame) {
                window.cancelAnimationFrame(this.frame);
                this.frame = 0;
            }
        }
        nextTick() {
            this.frame = window.requestAnimationFrame((t) => this.tick(t));
        }
        tick(t) {
            if (this.spinning) {
                if (!this.timerstart) {
                    this.timerstart = t;
                }
                this.value = Math.min(1, (t - this.timerstart) / this.duration);
                this.updateCursor();
                if (this.value >= 1) {
                    this.value = 0;
                    this.timerstart = 0;
                }
                this.nextTick();
            }
            else {
                this.frame = 0;
            }
        }
    };
    __decorate$k([
        property({ type: Boolean }),
        __metadata$k("design:type", Object)
    ], exports.WiredSpinner.prototype, "spinning", void 0);
    __decorate$k([
        property({ type: Number }),
        __metadata$k("design:type", Object)
    ], exports.WiredSpinner.prototype, "duration", void 0);
    exports.WiredSpinner = __decorate$k([
        customElement('wired-spinner')
    ], exports.WiredSpinner);

    var __decorate$l = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$l = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredTab = class WiredTab extends WiredBase {
        constructor() {
            super();
            this.name = '';
            this.label = '';
            if (window.ResizeObserver) {
                this.resizeObserver = new window.ResizeObserver(() => {
                    if (this.svg) {
                        this.wiredRender();
                    }
                });
            }
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          position: relative;
          padding: 10px;
        }
      `
            ];
        }
        render() {
            return html `
    <div>
      <slot @slotchange="${this.wiredRender}"></slot>
    </div>
    <div id="overlay"><svg></svg></div>
    `;
        }
        updated() {
            super.updated();
            this.attachResizeListener();
        }
        disconnectedCallback() {
            this.detachResizeListener();
        }
        attachResizeListener() {
            if (this.resizeObserver && this.resizeObserver.observe) {
                this.resizeObserver.observe(this);
            }
            else if (!this.windowResizeHandler) {
                this.windowResizeHandler = () => this.wiredRender();
                window.addEventListener('resize', this.windowResizeHandler, { passive: true });
            }
        }
        detachResizeListener() {
            if (this.resizeObserver && this.resizeObserver.unobserve) {
                this.resizeObserver.unobserve(this);
            }
            if (this.windowResizeHandler) {
                window.removeEventListener('resize', this.windowResizeHandler);
            }
        }
        canvasSize() {
            const s = this.getBoundingClientRect();
            return [s.width, s.height];
        }
        draw(svg, s) {
            rectangle(svg, 2, 2, s[0] - 4, s[1] - 4);
        }
    };
    __decorate$l([
        property({ type: String }),
        __metadata$l("design:type", Object)
    ], exports.WiredTab.prototype, "name", void 0);
    __decorate$l([
        property({ type: String }),
        __metadata$l("design:type", Object)
    ], exports.WiredTab.prototype, "label", void 0);
    exports.WiredTab = __decorate$l([
        customElement('wired-tab'),
        __metadata$l("design:paramtypes", [])
    ], exports.WiredTab);

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const directives$1 = new WeakMap();
    /**
     * Brands a function as a directive factory function so that lit-html will call
     * the function during template rendering, rather than passing as a value.
     *
     * A _directive_ is a function that takes a Part as an argument. It has the
     * signature: `(part: Part) => void`.
     *
     * A directive _factory_ is a function that takes arguments for data and
     * configuration and returns a directive. Users of directive usually refer to
     * the directive factory as the directive. For example, "The repeat directive".
     *
     * Usually a template author will invoke a directive factory in their template
     * with relevant arguments, which will then return a directive function.
     *
     * Here's an example of using the `repeat()` directive factory that takes an
     * array and a function to render an item:
     *
     * ```js
     * html`<ul><${repeat(items, (item) => html`<li>${item}</li>`)}</ul>`
     * ```
     *
     * When `repeat` is invoked, it returns a directive function that closes over
     * `items` and the template function. When the outer template is rendered, the
     * return directive function is called with the Part for the expression.
     * `repeat` then performs it's custom logic to render multiple items.
     *
     * @param f The directive factory function. Must be a function that returns a
     * function of the signature `(part: Part) => void`. The returned function will
     * be called with the part object.
     *
     * @example
     *
     * import {directive, html} from 'lit-html';
     *
     * const immutable = directive((v) => (part) => {
     *   if (part.value !== v) {
     *     part.setValue(v)
     *   }
     * });
     */
    const directive = (f) => ((...args) => {
        const d = f(...args);
        directives$1.set(d, true);
        return d;
    });
    const isDirective$1 = (o) => {
        return typeof o === 'function' && directives$1.has(o);
    };

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * True if the custom elements polyfill is in use.
     */
    const isCEPolyfill$1 = window.customElements !== undefined &&
        window.customElements.polyfillWrapFlushCallback !==
            undefined;
    /**
     * Reparents nodes, starting from `start` (inclusive) to `end` (exclusive),
     * into another container (could be the same container), before `before`. If
     * `before` is null, it appends the nodes to the container.
     */
    const reparentNodes = (container, start, end = null, before = null) => {
        while (start !== end) {
            const n = start.nextSibling;
            container.insertBefore(start, before);
            start = n;
        }
    };
    /**
     * Removes nodes, starting from `start` (inclusive) to `end` (exclusive), from
     * `container`.
     */
    const removeNodes$1 = (container, start, end = null) => {
        while (start !== end) {
            const n = start.nextSibling;
            container.removeChild(start);
            start = n;
        }
    };

    /**
     * @license
     * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * A sentinel value that signals that a value was handled by a directive and
     * should not be written to the DOM.
     */
    const noChange$1 = {};
    /**
     * A sentinel value that signals a NodePart to fully clear its content.
     */
    const nothing$1 = {};

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * An expression marker with embedded unique key to avoid collision with
     * possible text in templates.
     */
    const marker$1 = `{{lit-${String(Math.random()).slice(2)}}}`;
    /**
     * An expression marker used text-positions, multi-binding attributes, and
     * attributes with markup-like text values.
     */
    const nodeMarker$1 = `<!--${marker$1}-->`;
    /**
     * Suffix appended to all bound attribute names.
     */
    const boundAttributeSuffix$1 = '$lit$';
    const isTemplatePartActive$1 = (part) => part.index !== -1;
    // Allows `document.createComment('')` to be renamed for a
    // small manual size-savings.
    const createMarker$1 = () => document.createComment('');
    /**
     * This regex extracts the attribute name preceding an attribute-position
     * expression. It does this by matching the syntax allowed for attributes
     * against the string literal directly preceding the expression, assuming that
     * the expression is in an attribute-value position.
     *
     * See attributes in the HTML spec:
     * https://www.w3.org/TR/html5/syntax.html#elements-attributes
     *
     * " \x09\x0a\x0c\x0d" are HTML space characters:
     * https://www.w3.org/TR/html5/infrastructure.html#space-characters
     *
     * "\0-\x1F\x7F-\x9F" are Unicode control characters, which includes every
     * space character except " ".
     *
     * So an attribute is:
     *  * The name: any character except a control character, space character, ('),
     *    ("), ">", "=", or "/"
     *  * Followed by zero or more space characters
     *  * Followed by "="
     *  * Followed by zero or more space characters
     *  * Followed by:
     *    * Any character except space, ('), ("), "<", ">", "=", (`), or
     *    * (") then any non-("), or
     *    * (') then any non-(')
     */
    const lastAttributeNameRegex$1 = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    /**
     * An instance of a `Template` that can be attached to the DOM and updated
     * with new values.
     */
    class TemplateInstance$1 {
        constructor(template, processor, options) {
            this.__parts = [];
            this.template = template;
            this.processor = processor;
            this.options = options;
        }
        update(values) {
            let i = 0;
            for (const part of this.__parts) {
                if (part !== undefined) {
                    part.setValue(values[i]);
                }
                i++;
            }
            for (const part of this.__parts) {
                if (part !== undefined) {
                    part.commit();
                }
            }
        }
        _clone() {
            // There are a number of steps in the lifecycle of a template instance's
            // DOM fragment:
            //  1. Clone - create the instance fragment
            //  2. Adopt - adopt into the main document
            //  3. Process - find part markers and create parts
            //  4. Upgrade - upgrade custom elements
            //  5. Update - set node, attribute, property, etc., values
            //  6. Connect - connect to the document. Optional and outside of this
            //     method.
            //
            // We have a few constraints on the ordering of these steps:
            //  * We need to upgrade before updating, so that property values will pass
            //    through any property setters.
            //  * We would like to process before upgrading so that we're sure that the
            //    cloned fragment is inert and not disturbed by self-modifying DOM.
            //  * We want custom elements to upgrade even in disconnected fragments.
            //
            // Given these constraints, with full custom elements support we would
            // prefer the order: Clone, Process, Adopt, Upgrade, Update, Connect
            //
            // But Safari dooes not implement CustomElementRegistry#upgrade, so we
            // can not implement that order and still have upgrade-before-update and
            // upgrade disconnected fragments. So we instead sacrifice the
            // process-before-upgrade constraint, since in Custom Elements v1 elements
            // must not modify their light DOM in the constructor. We still have issues
            // when co-existing with CEv0 elements like Polymer 1, and with polyfills
            // that don't strictly adhere to the no-modification rule because shadow
            // DOM, which may be created in the constructor, is emulated by being placed
            // in the light DOM.
            //
            // The resulting order is on native is: Clone, Adopt, Upgrade, Process,
            // Update, Connect. document.importNode() performs Clone, Adopt, and Upgrade
            // in one step.
            //
            // The Custom Elements v1 polyfill supports upgrade(), so the order when
            // polyfilled is the more ideal: Clone, Process, Adopt, Upgrade, Update,
            // Connect.
            const fragment = isCEPolyfill$1 ?
                this.template.element.content.cloneNode(true) :
                document.importNode(this.template.element.content, true);
            const stack = [];
            const parts = this.template.parts;
            // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be null
            const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
            let partIndex = 0;
            let nodeIndex = 0;
            let part;
            let node = walker.nextNode();
            // Loop through all the nodes and parts of a template
            while (partIndex < parts.length) {
                part = parts[partIndex];
                if (!isTemplatePartActive$1(part)) {
                    this.__parts.push(undefined);
                    partIndex++;
                    continue;
                }
                // Progress the tree walker until we find our next part's node.
                // Note that multiple parts may share the same node (attribute parts
                // on a single element), so this loop may not run at all.
                while (nodeIndex < part.index) {
                    nodeIndex++;
                    if (node.nodeName === 'TEMPLATE') {
                        stack.push(node);
                        walker.currentNode = node.content;
                    }
                    if ((node = walker.nextNode()) === null) {
                        // We've exhausted the content inside a nested template element.
                        // Because we still have parts (the outer for-loop), we know:
                        // - There is a template in the stack
                        // - The walker will find a nextNode outside the template
                        walker.currentNode = stack.pop();
                        node = walker.nextNode();
                    }
                }
                // We've arrived at our part's node.
                if (part.type === 'node') {
                    const part = this.processor.handleTextExpression(this.options);
                    part.insertAfterNode(node.previousSibling);
                    this.__parts.push(part);
                }
                else {
                    this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
                }
                partIndex++;
            }
            if (isCEPolyfill$1) {
                document.adoptNode(fragment);
                customElements.upgrade(fragment);
            }
            return fragment;
        }
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const commentMarker$1 = ` ${marker$1} `;
    /**
     * The return type of `html`, which holds a Template and the values from
     * interpolated expressions.
     */
    class TemplateResult$1 {
        constructor(strings, values, type, processor) {
            this.strings = strings;
            this.values = values;
            this.type = type;
            this.processor = processor;
        }
        /**
         * Returns a string of HTML used to create a `<template>` element.
         */
        getHTML() {
            const l = this.strings.length - 1;
            let html = '';
            let isCommentBinding = false;
            for (let i = 0; i < l; i++) {
                const s = this.strings[i];
                // For each binding we want to determine the kind of marker to insert
                // into the template source before it's parsed by the browser's HTML
                // parser. The marker type is based on whether the expression is in an
                // attribute, text, or comment poisition.
                //   * For node-position bindings we insert a comment with the marker
                //     sentinel as its text content, like <!--{{lit-guid}}-->.
                //   * For attribute bindings we insert just the marker sentinel for the
                //     first binding, so that we support unquoted attribute bindings.
                //     Subsequent bindings can use a comment marker because multi-binding
                //     attributes must be quoted.
                //   * For comment bindings we insert just the marker sentinel so we don't
                //     close the comment.
                //
                // The following code scans the template source, but is *not* an HTML
                // parser. We don't need to track the tree structure of the HTML, only
                // whether a binding is inside a comment, and if not, if it appears to be
                // the first binding in an attribute.
                const commentOpen = s.lastIndexOf('<!--');
                // We're in comment position if we have a comment open with no following
                // comment close. Because <-- can appear in an attribute value there can
                // be false positives.
                isCommentBinding = (commentOpen > -1 || isCommentBinding) &&
                    s.indexOf('-->', commentOpen + 1) === -1;
                // Check to see if we have an attribute-like sequence preceeding the
                // expression. This can match "name=value" like structures in text,
                // comments, and attribute values, so there can be false-positives.
                const attributeMatch = lastAttributeNameRegex$1.exec(s);
                if (attributeMatch === null) {
                    // We're only in this branch if we don't have a attribute-like
                    // preceeding sequence. For comments, this guards against unusual
                    // attribute values like <div foo="<!--${'bar'}">. Cases like
                    // <!-- foo=${'bar'}--> are handled correctly in the attribute branch
                    // below.
                    html += s + (isCommentBinding ? commentMarker$1 : nodeMarker$1);
                }
                else {
                    // For attributes we use just a marker sentinel, and also append a
                    // $lit$ suffix to the name to opt-out of attribute-specific parsing
                    // that IE and Edge do for style and certain SVG attributes.
                    html += s.substr(0, attributeMatch.index) + attributeMatch[1] +
                        attributeMatch[2] + boundAttributeSuffix$1 + attributeMatch[3] +
                        marker$1;
                }
            }
            html += this.strings[l];
            return html;
        }
        getTemplateElement() {
            const template = document.createElement('template');
            template.innerHTML = this.getHTML();
            return template;
        }
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    const isPrimitive$1 = (value) => {
        return (value === null ||
            !(typeof value === 'object' || typeof value === 'function'));
    };
    const isIterable$1 = (value) => {
        return Array.isArray(value) ||
            // tslint:disable-next-line:no-any
            !!(value && value[Symbol.iterator]);
    };
    /**
     * A Part that controls a location within a Node tree. Like a Range, NodePart
     * has start and end locations and can set and update the Nodes between those
     * locations.
     *
     * NodeParts support several value types: primitives, Nodes, TemplateResults,
     * as well as arrays and iterables of those types.
     */
    class NodePart$1 {
        constructor(options) {
            this.value = undefined;
            this.__pendingValue = undefined;
            this.options = options;
        }
        /**
         * Appends this part into a container.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        appendInto(container) {
            this.startNode = container.appendChild(createMarker$1());
            this.endNode = container.appendChild(createMarker$1());
        }
        /**
         * Inserts this part after the `ref` node (between `ref` and `ref`'s next
         * sibling). Both `ref` and its next sibling must be static, unchanging nodes
         * such as those that appear in a literal section of a template.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        insertAfterNode(ref) {
            this.startNode = ref;
            this.endNode = ref.nextSibling;
        }
        /**
         * Appends this part into a parent part.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        appendIntoPart(part) {
            part.__insert(this.startNode = createMarker$1());
            part.__insert(this.endNode = createMarker$1());
        }
        /**
         * Inserts this part after the `ref` part.
         *
         * This part must be empty, as its contents are not automatically moved.
         */
        insertAfterPart(ref) {
            ref.__insert(this.startNode = createMarker$1());
            this.endNode = ref.endNode;
            ref.endNode = this.startNode;
        }
        setValue(value) {
            this.__pendingValue = value;
        }
        commit() {
            while (isDirective$1(this.__pendingValue)) {
                const directive = this.__pendingValue;
                this.__pendingValue = noChange$1;
                directive(this);
            }
            const value = this.__pendingValue;
            if (value === noChange$1) {
                return;
            }
            if (isPrimitive$1(value)) {
                if (value !== this.value) {
                    this.__commitText(value);
                }
            }
            else if (value instanceof TemplateResult$1) {
                this.__commitTemplateResult(value);
            }
            else if (value instanceof Node) {
                this.__commitNode(value);
            }
            else if (isIterable$1(value)) {
                this.__commitIterable(value);
            }
            else if (value === nothing$1) {
                this.value = nothing$1;
                this.clear();
            }
            else {
                // Fallback, will render the string representation
                this.__commitText(value);
            }
        }
        __insert(node) {
            this.endNode.parentNode.insertBefore(node, this.endNode);
        }
        __commitNode(value) {
            if (this.value === value) {
                return;
            }
            this.clear();
            this.__insert(value);
            this.value = value;
        }
        __commitText(value) {
            const node = this.startNode.nextSibling;
            value = value == null ? '' : value;
            // If `value` isn't already a string, we explicitly convert it here in case
            // it can't be implicitly converted - i.e. it's a symbol.
            const valueAsString = typeof value === 'string' ? value : String(value);
            if (node === this.endNode.previousSibling &&
                node.nodeType === 3 /* Node.TEXT_NODE */) {
                // If we only have a single text node between the markers, we can just
                // set its value, rather than replacing it.
                // TODO(justinfagnani): Can we just check if this.value is primitive?
                node.data = valueAsString;
            }
            else {
                this.__commitNode(document.createTextNode(valueAsString));
            }
            this.value = value;
        }
        __commitTemplateResult(value) {
            const template = this.options.templateFactory(value);
            if (this.value instanceof TemplateInstance$1 &&
                this.value.template === template) {
                this.value.update(value.values);
            }
            else {
                // Make sure we propagate the template processor from the TemplateResult
                // so that we use its syntax extension, etc. The template factory comes
                // from the render function options so that it can control template
                // caching and preprocessing.
                const instance = new TemplateInstance$1(template, value.processor, this.options);
                const fragment = instance._clone();
                instance.update(value.values);
                this.__commitNode(fragment);
                this.value = instance;
            }
        }
        __commitIterable(value) {
            // For an Iterable, we create a new InstancePart per item, then set its
            // value to the item. This is a little bit of overhead for every item in
            // an Iterable, but it lets us recurse easily and efficiently update Arrays
            // of TemplateResults that will be commonly returned from expressions like:
            // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
            // If _value is an array, then the previous render was of an
            // iterable and _value will contain the NodeParts from the previous
            // render. If _value is not an array, clear this part and make a new
            // array for NodeParts.
            if (!Array.isArray(this.value)) {
                this.value = [];
                this.clear();
            }
            // Lets us keep track of how many items we stamped so we can clear leftover
            // items from a previous render
            const itemParts = this.value;
            let partIndex = 0;
            let itemPart;
            for (const item of value) {
                // Try to reuse an existing part
                itemPart = itemParts[partIndex];
                // If no existing part, create a new one
                if (itemPart === undefined) {
                    itemPart = new NodePart$1(this.options);
                    itemParts.push(itemPart);
                    if (partIndex === 0) {
                        itemPart.appendIntoPart(this);
                    }
                    else {
                        itemPart.insertAfterPart(itemParts[partIndex - 1]);
                    }
                }
                itemPart.setValue(item);
                itemPart.commit();
                partIndex++;
            }
            if (partIndex < itemParts.length) {
                // Truncate the parts array so _value reflects the current state
                itemParts.length = partIndex;
                this.clear(itemPart && itemPart.endNode);
            }
        }
        clear(startNode = this.startNode) {
            removeNodes$1(this.startNode.parentNode, startNode.nextSibling, this.endNode);
        }
    }
    // Detect event listener options support. If the `capture` property is read
    // from the options object, then options are supported. If not, then the thrid
    // argument to add/removeEventListener is interpreted as the boolean capture
    // value so we should only pass the `capture` property.
    let eventOptionsSupported$1 = false;
    try {
        const options = {
            get capture() {
                eventOptionsSupported$1 = true;
                return false;
            }
        };
        // tslint:disable-next-line:no-any
        window.addEventListener('test', options, options);
        // tslint:disable-next-line:no-any
        window.removeEventListener('test', options, options);
    }
    catch (_e) {
    }

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // IMPORTANT: do not change the property name or the assignment expression.
    // This line will be used in regexes to search for lit-html usage.
    // TODO(justinfagnani): inject version number at build time
    (window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.1.2');

    /**
     * @license
     * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
     * This code may only be used under the BSD style license found at
     * http://polymer.github.io/LICENSE.txt
     * The complete set of authors may be found at
     * http://polymer.github.io/AUTHORS.txt
     * The complete set of contributors may be found at
     * http://polymer.github.io/CONTRIBUTORS.txt
     * Code distributed by Google as part of the polymer project is also
     * subject to an additional IP rights grant found at
     * http://polymer.github.io/PATENTS.txt
     */
    // Helper functions for manipulating parts
    // TODO(kschaaf): Refactor into Part API?
    const createAndInsertPart = (containerPart, beforePart) => {
        const container = containerPart.startNode.parentNode;
        const beforeNode = beforePart === undefined ? containerPart.endNode :
            beforePart.startNode;
        const startNode = container.insertBefore(createMarker$1(), beforeNode);
        container.insertBefore(createMarker$1(), beforeNode);
        const newPart = new NodePart$1(containerPart.options);
        newPart.insertAfterNode(startNode);
        return newPart;
    };
    const updatePart = (part, value) => {
        part.setValue(value);
        part.commit();
        return part;
    };
    const insertPartBefore = (containerPart, part, ref) => {
        const container = containerPart.startNode.parentNode;
        const beforeNode = ref ? ref.startNode : containerPart.endNode;
        const endNode = part.endNode.nextSibling;
        if (endNode !== beforeNode) {
            reparentNodes(container, part.startNode, endNode, beforeNode);
        }
    };
    const removePart = (part) => {
        removeNodes$1(part.startNode.parentNode, part.startNode, part.endNode.nextSibling);
    };
    // Helper for generating a map of array item to its index over a subset
    // of an array (used to lazily generate `newKeyToIndexMap` and
    // `oldKeyToIndexMap`)
    const generateMap = (list, start, end) => {
        const map = new Map();
        for (let i = start; i <= end; i++) {
            map.set(list[i], i);
        }
        return map;
    };
    // Stores previous ordered list of parts and map of key to index
    const partListCache = new WeakMap();
    const keyListCache = new WeakMap();
    /**
     * A directive that repeats a series of values (usually `TemplateResults`)
     * generated from an iterable, and updates those items efficiently when the
     * iterable changes based on user-provided `keys` associated with each item.
     *
     * Note that if a `keyFn` is provided, strict key-to-DOM mapping is maintained,
     * meaning previous DOM for a given key is moved into the new position if
     * needed, and DOM will never be reused with values for different keys (new DOM
     * will always be created for new keys). This is generally the most efficient
     * way to use `repeat` since it performs minimum unnecessary work for insertions
     * amd removals.
     *
     * IMPORTANT: If providing a `keyFn`, keys *must* be unique for all items in a
     * given call to `repeat`. The behavior when two or more items have the same key
     * is undefined.
     *
     * If no `keyFn` is provided, this directive will perform similar to mapping
     * items to values, and DOM will be reused against potentially different items.
     */
    const repeat = directive((items, keyFnOrTemplate, template) => {
        let keyFn;
        if (template === undefined) {
            template = keyFnOrTemplate;
        }
        else if (keyFnOrTemplate !== undefined) {
            keyFn = keyFnOrTemplate;
        }
        return (containerPart) => {
            if (!(containerPart instanceof NodePart$1)) {
                throw new Error('repeat can only be used in text bindings');
            }
            // Old part & key lists are retrieved from the last update
            // (associated with the part for this instance of the directive)
            const oldParts = partListCache.get(containerPart) || [];
            const oldKeys = keyListCache.get(containerPart) || [];
            // New part list will be built up as we go (either reused from
            // old parts or created for new keys in this update). This is
            // saved in the above cache at the end of the update.
            const newParts = [];
            // New value list is eagerly generated from items along with a
            // parallel array indicating its key.
            const newValues = [];
            const newKeys = [];
            let index = 0;
            for (const item of items) {
                newKeys[index] = keyFn ? keyFn(item, index) : index;
                newValues[index] = template(item, index);
                index++;
            }
            // Maps from key to index for current and previous update; these
            // are generated lazily only when needed as a performance
            // optimization, since they are only required for multiple
            // non-contiguous changes in the list, which are less common.
            let newKeyToIndexMap;
            let oldKeyToIndexMap;
            // Head and tail pointers to old parts and new values
            let oldHead = 0;
            let oldTail = oldParts.length - 1;
            let newHead = 0;
            let newTail = newValues.length - 1;
            // Overview of O(n) reconciliation algorithm (general approach
            // based on ideas found in ivi, vue, snabbdom, etc.):
            //
            // * We start with the list of old parts and new values (and
            //   arrays of their respective keys), head/tail pointers into
            //   each, and we build up the new list of parts by updating
            //   (and when needed, moving) old parts or creating new ones.
            //   The initial scenario might look like this (for brevity of
            //   the diagrams, the numbers in the array reflect keys
            //   associated with the old parts or new values, although keys
            //   and parts/values are actually stored in parallel arrays
            //   indexed using the same head/tail pointers):
            //
            //      oldHead v                 v oldTail
            //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
            //   newParts: [ ,  ,  ,  ,  ,  ,  ]
            //   newKeys:  [0, 2, 1, 4, 3, 7, 6] <- reflects the user's new
            //                                      item order
            //      newHead ^                 ^ newTail
            //
            // * Iterate old & new lists from both sides, updating,
            //   swapping, or removing parts at the head/tail locations
            //   until neither head nor tail can move.
            //
            // * Example below: keys at head pointers match, so update old
            //   part 0 in-place (no need to move it) and record part 0 in
            //   the `newParts` list. The last thing we do is advance the
            //   `oldHead` and `newHead` pointers (will be reflected in the
            //   next diagram).
            //
            //      oldHead v                 v oldTail
            //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
            //   newParts: [0,  ,  ,  ,  ,  ,  ] <- heads matched: update 0
            //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldHead
            //                                      & newHead
            //      newHead ^                 ^ newTail
            //
            // * Example below: head pointers don't match, but tail
            //   pointers do, so update part 6 in place (no need to move
            //   it), and record part 6 in the `newParts` list. Last,
            //   advance the `oldTail` and `oldHead` pointers.
            //
            //         oldHead v              v oldTail
            //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
            //   newParts: [0,  ,  ,  ,  ,  , 6] <- tails matched: update 6
            //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldTail
            //                                      & newTail
            //         newHead ^              ^ newTail
            //
            // * If neither head nor tail match; next check if one of the
            //   old head/tail items was removed. We first need to generate
            //   the reverse map of new keys to index (`newKeyToIndexMap`),
            //   which is done once lazily as a performance optimization,
            //   since we only hit this case if multiple non-contiguous
            //   changes were made. Note that for contiguous removal
            //   anywhere in the list, the head and tails would advance
            //   from either end and pass each other before we get to this
            //   case and removals would be handled in the final while loop
            //   without needing to generate the map.
            //
            // * Example below: The key at `oldTail` was removed (no longer
            //   in the `newKeyToIndexMap`), so remove that part from the
            //   DOM and advance just the `oldTail` pointer.
            //
            //         oldHead v           v oldTail
            //   oldKeys:  [0, 1, 2, 3, 4, 5, 6]
            //   newParts: [0,  ,  ,  ,  ,  , 6] <- 5 not in new map: remove
            //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    5 and advance oldTail
            //         newHead ^           ^ newTail
            //
            // * Once head and tail cannot move, any mismatches are due to
            //   either new or moved items; if a new key is in the previous
            //   "old key to old index" map, move the old part to the new
            //   location, otherwise create and insert a new part. Note
            //   that when moving an old part we null its position in the
            //   oldParts array if it lies between the head and tail so we
            //   know to skip it when the pointers get there.
            //
            // * Example below: neither head nor tail match, and neither
            //   were removed; so find the `newHead` key in the
            //   `oldKeyToIndexMap`, and move that old part's DOM into the
            //   next head position (before `oldParts[oldHead]`). Last,
            //   null the part in the `oldPart` array since it was
            //   somewhere in the remaining oldParts still to be scanned
            //   (between the head and tail pointers) so that we know to
            //   skip that old part on future iterations.
            //
            //         oldHead v        v oldTail
            //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
            //   newParts: [0, 2,  ,  ,  ,  , 6] <- stuck: update & move 2
            //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    into place and advance
            //                                      newHead
            //         newHead ^           ^ newTail
            //
            // * Note that for moves/insertions like the one above, a part
            //   inserted at the head pointer is inserted before the
            //   current `oldParts[oldHead]`, and a part inserted at the
            //   tail pointer is inserted before `newParts[newTail+1]`. The
            //   seeming asymmetry lies in the fact that new parts are
            //   moved into place outside in, so to the right of the head
            //   pointer are old parts, and to the right of the tail
            //   pointer are new parts.
            //
            // * We always restart back from the top of the algorithm,
            //   allowing matching and simple updates in place to
            //   continue...
            //
            // * Example below: the head pointers once again match, so
            //   simply update part 1 and record it in the `newParts`
            //   array.  Last, advance both head pointers.
            //
            //         oldHead v        v oldTail
            //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
            //   newParts: [0, 2, 1,  ,  ,  , 6] <- heads matched: update 1
            //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance both oldHead
            //                                      & newHead
            //            newHead ^        ^ newTail
            //
            // * As mentioned above, items that were moved as a result of
            //   being stuck (the final else clause in the code below) are
            //   marked with null, so we always advance old pointers over
            //   these so we're comparing the next actual old value on
            //   either end.
            //
            // * Example below: `oldHead` is null (already placed in
            //   newParts), so advance `oldHead`.
            //
            //            oldHead v     v oldTail
            //   oldKeys:  [0, 1, -, 3, 4, 5, 6] <- old head already used:
            //   newParts: [0, 2, 1,  ,  ,  , 6]    advance oldHead
            //   newKeys:  [0, 2, 1, 4, 3, 7, 6]
            //               newHead ^     ^ newTail
            //
            // * Note it's not critical to mark old parts as null when they
            //   are moved from head to tail or tail to head, since they
            //   will be outside the pointer range and never visited again.
            //
            // * Example below: Here the old tail key matches the new head
            //   key, so the part at the `oldTail` position and move its
            //   DOM to the new head position (before `oldParts[oldHead]`).
            //   Last, advance `oldTail` and `newHead` pointers.
            //
            //               oldHead v  v oldTail
            //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
            //   newParts: [0, 2, 1, 4,  ,  , 6] <- old tail matches new
            //   newKeys:  [0, 2, 1, 4, 3, 7, 6]   head: update & move 4,
            //                                     advance oldTail & newHead
            //               newHead ^     ^ newTail
            //
            // * Example below: Old and new head keys match, so update the
            //   old head part in place, and advance the `oldHead` and
            //   `newHead` pointers.
            //
            //               oldHead v oldTail
            //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
            //   newParts: [0, 2, 1, 4, 3,   ,6] <- heads match: update 3
            //   newKeys:  [0, 2, 1, 4, 3, 7, 6]    and advance oldHead &
            //                                      newHead
            //                  newHead ^  ^ newTail
            //
            // * Once the new or old pointers move past each other then all
            //   we have left is additions (if old list exhausted) or
            //   removals (if new list exhausted). Those are handled in the
            //   final while loops at the end.
            //
            // * Example below: `oldHead` exceeded `oldTail`, so we're done
            //   with the main loop.  Create the remaining part and insert
            //   it at the new head position, and the update is complete.
            //
            //                   (oldHead > oldTail)
            //   oldKeys:  [0, 1, -, 3, 4, 5, 6]
            //   newParts: [0, 2, 1, 4, 3, 7 ,6] <- create and insert 7
            //   newKeys:  [0, 2, 1, 4, 3, 7, 6]
            //                     newHead ^ newTail
            //
            // * Note that the order of the if/else clauses is not
            //   important to the algorithm, as long as the null checks
            //   come first (to ensure we're always working on valid old
            //   parts) and that the final else clause comes last (since
            //   that's where the expensive moves occur). The order of
            //   remaining clauses is is just a simple guess at which cases
            //   will be most common.
            //
            // * TODO(kschaaf) Note, we could calculate the longest
            //   increasing subsequence (LIS) of old items in new position,
            //   and only move those not in the LIS set. However that costs
            //   O(nlogn) time and adds a bit more code, and only helps
            //   make rare types of mutations require fewer moves. The
            //   above handles removes, adds, reversal, swaps, and single
            //   moves of contiguous items in linear time, in the minimum
            //   number of moves. As the number of multiple moves where LIS
            //   might help approaches a random shuffle, the LIS
            //   optimization becomes less helpful, so it seems not worth
            //   the code at this point. Could reconsider if a compelling
            //   case arises.
            while (oldHead <= oldTail && newHead <= newTail) {
                if (oldParts[oldHead] === null) {
                    // `null` means old part at head has already been used
                    // below; skip
                    oldHead++;
                }
                else if (oldParts[oldTail] === null) {
                    // `null` means old part at tail has already been used
                    // below; skip
                    oldTail--;
                }
                else if (oldKeys[oldHead] === newKeys[newHead]) {
                    // Old head matches new head; update in place
                    newParts[newHead] =
                        updatePart(oldParts[oldHead], newValues[newHead]);
                    oldHead++;
                    newHead++;
                }
                else if (oldKeys[oldTail] === newKeys[newTail]) {
                    // Old tail matches new tail; update in place
                    newParts[newTail] =
                        updatePart(oldParts[oldTail], newValues[newTail]);
                    oldTail--;
                    newTail--;
                }
                else if (oldKeys[oldHead] === newKeys[newTail]) {
                    // Old head matches new tail; update and move to new tail
                    newParts[newTail] =
                        updatePart(oldParts[oldHead], newValues[newTail]);
                    insertPartBefore(containerPart, oldParts[oldHead], newParts[newTail + 1]);
                    oldHead++;
                    newTail--;
                }
                else if (oldKeys[oldTail] === newKeys[newHead]) {
                    // Old tail matches new head; update and move to new head
                    newParts[newHead] =
                        updatePart(oldParts[oldTail], newValues[newHead]);
                    insertPartBefore(containerPart, oldParts[oldTail], oldParts[oldHead]);
                    oldTail--;
                    newHead++;
                }
                else {
                    if (newKeyToIndexMap === undefined) {
                        // Lazily generate key-to-index maps, used for removals &
                        // moves below
                        newKeyToIndexMap = generateMap(newKeys, newHead, newTail);
                        oldKeyToIndexMap = generateMap(oldKeys, oldHead, oldTail);
                    }
                    if (!newKeyToIndexMap.has(oldKeys[oldHead])) {
                        // Old head is no longer in new list; remove
                        removePart(oldParts[oldHead]);
                        oldHead++;
                    }
                    else if (!newKeyToIndexMap.has(oldKeys[oldTail])) {
                        // Old tail is no longer in new list; remove
                        removePart(oldParts[oldTail]);
                        oldTail--;
                    }
                    else {
                        // Any mismatches at this point are due to additions or
                        // moves; see if we have an old part we can reuse and move
                        // into place
                        const oldIndex = oldKeyToIndexMap.get(newKeys[newHead]);
                        const oldPart = oldIndex !== undefined ? oldParts[oldIndex] : null;
                        if (oldPart === null) {
                            // No old part for this value; create a new one and
                            // insert it
                            const newPart = createAndInsertPart(containerPart, oldParts[oldHead]);
                            updatePart(newPart, newValues[newHead]);
                            newParts[newHead] = newPart;
                        }
                        else {
                            // Reuse old part
                            newParts[newHead] =
                                updatePart(oldPart, newValues[newHead]);
                            insertPartBefore(containerPart, oldPart, oldParts[oldHead]);
                            // This marks the old part as having been used, so that
                            // it will be skipped in the first two checks above
                            oldParts[oldIndex] = null;
                        }
                        newHead++;
                    }
                }
            }
            // Add parts for any remaining new values
            while (newHead <= newTail) {
                // For all remaining additions, we insert before last new
                // tail, since old pointers are no longer valid
                const newPart = createAndInsertPart(containerPart, newParts[newTail + 1]);
                updatePart(newPart, newValues[newHead]);
                newParts[newHead++] = newPart;
            }
            // Remove any remaining unused old parts
            while (oldHead <= oldTail) {
                const oldPart = oldParts[oldHead++];
                if (oldPart !== null) {
                    removePart(oldPart);
                }
            }
            // Save order of new parts for next round
            partListCache.set(containerPart, newParts);
            keyListCache.set(containerPart, newKeys);
        };
    });

    var __decorate$m = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$m = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredTabs = class WiredTabs extends LitElement {
        constructor() {
            super(...arguments);
            this.pages = [];
            this.pageMap = new Map();
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: block;
          opacity: 1;
        }
        ::slotted(.hidden) {
          display: none !important;
        }
    
        :host ::slotted(.hidden) {
          display: none !important;
        }
        #bar {
          display: -ms-flexbox;
          display: -webkit-flex;
          display: flex;
          -ms-flex-direction: row;
          -webkit-flex-direction: row;
          flex-direction: row;
        }
      `
            ];
        }
        render() {
            return html `
    <div id="bar">
      ${repeat(this.pages, (p) => p.name, (p) => html `
      <wired-item role="tab" .value="${p.name}" .selected="${p.name === this.selected}" ?aria-selected="${p.name === this.selected}"
        @click="${() => this.selected = p.name}">${p.label || p.name}</wired-item>
      `)}
    </div>
    <div>
      <slot @slotchange="${this.mapPages}"></slot>
    </div>
    `;
        }
        mapPages() {
            this.pages = [];
            this.pageMap.clear();
            if (this.slotElement) {
                const assigned = this.slotElement.assignedNodes();
                if (assigned && assigned.length) {
                    for (let i = 0; i < assigned.length; i++) {
                        const n = assigned[i];
                        if (n.nodeType === Node.ELEMENT_NODE && n.tagName.toLowerCase() === 'wired-tab') {
                            const e = n;
                            this.pages.push(e);
                            const name = e.getAttribute('name') || '';
                            if (name) {
                                name.trim().split(' ').forEach((nameSegment) => {
                                    if (nameSegment) {
                                        this.pageMap.set(nameSegment, e);
                                    }
                                });
                            }
                        }
                    }
                    if (!this.selected) {
                        if (this.pages.length) {
                            this.selected = this.pages[0].name;
                        }
                    }
                    this.requestUpdate();
                }
            }
        }
        firstUpdated() {
            this.mapPages();
            this.tabIndex = +((this.getAttribute('tabindex') || 0));
            this.addEventListener('keydown', (event) => {
                switch (event.keyCode) {
                    case 37:
                    case 38:
                        event.preventDefault();
                        this.selectPrevious();
                        break;
                    case 39:
                    case 40:
                        event.preventDefault();
                        this.selectNext();
                        break;
                }
            });
        }
        updated() {
            const newPage = this.getElement();
            for (let i = 0; i < this.pages.length; i++) {
                const p = this.pages[i];
                if (p === newPage) {
                    p.classList.remove('hidden');
                }
                else {
                    p.classList.add('hidden');
                }
            }
            this.current = newPage || undefined;
            if (this.current && this.current.wiredRender) {
                requestAnimationFrame(() => requestAnimationFrame(() => this.current.wiredRender()));
            }
        }
        getElement() {
            let e = undefined;
            if (this.selected) {
                e = this.pageMap.get(this.selected);
            }
            if (!e) {
                e = this.pages[0];
            }
            return e || null;
        }
        selectPrevious() {
            const list = this.pages;
            if (list.length) {
                let index = -1;
                for (let i = 0; i < list.length; i++) {
                    if (list[i] === this.current) {
                        index = i;
                        break;
                    }
                }
                if (index < 0) {
                    index = 0;
                }
                else if (index === 0) {
                    index = list.length - 1;
                }
                else {
                    index--;
                }
                this.selected = list[index].name || '';
            }
        }
        selectNext() {
            const list = this.pages;
            if (list.length) {
                let index = -1;
                for (let i = 0; i < list.length; i++) {
                    if (list[i] === this.current) {
                        index = i;
                        break;
                    }
                }
                if (index < 0) {
                    index = 0;
                }
                else if (index >= (list.length - 1)) {
                    index = 0;
                }
                else {
                    index++;
                }
                this.selected = list[index].name || '';
            }
        }
    };
    __decorate$m([
        property({ type: String }),
        __metadata$m("design:type", String)
    ], exports.WiredTabs.prototype, "selected", void 0);
    __decorate$m([
        query('slot'),
        __metadata$m("design:type", HTMLSlotElement)
    ], exports.WiredTabs.prototype, "slotElement", void 0);
    exports.WiredTabs = __decorate$m([
        customElement('wired-tabs')
    ], exports.WiredTabs);

    var __decorate$n = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$n = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredTextarea = class WiredTextarea extends WiredBase {
        constructor() {
            super(...arguments);
            this.disabled = false;
            this.rows = 2;
            this.maxrows = 0;
            this.autocomplete = '';
            this.autofocus = false;
            this.inputmode = '';
            this.placeholder = '';
            this.required = false;
            this.readonly = false;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          position: relative;
          font-family: sans-serif;
          width: 400px;
          outline: none;
          padding: 4px;
        }
        :host([disabled]) {
          opacity: 0.6 !important;
          cursor: default;
          pointer-events: none;
        }
        :host([disabled]) svg {
          background: rgba(0, 0, 0, 0.07);
        }
        textarea {
          position: relative;
          outline: none;
          border: none;
          resize: none;
          background: inherit;
          color: inherit;
          width: 100%;
          font-size: inherit;
          font-family: inherit;
          line-height: inherit;
          text-align: inherit;
          padding: 10px;
          box-sizing: border-box;
        }
      `
            ];
        }
        render() {
            return html `
    <textarea id="textarea" autocomplete="${this.autocomplete}" ?autofocus="${this.autofocus}" inputmode="${this.inputmode}"
      placeholder="${this.placeholder}" ?readonly="${this.readonly}" ?required="${this.required}" ?disabled="${this.disabled}"
      rows="${this.rows}" minlength="${this.minlength}" maxlength="${this.maxlength}"
      @change="${this.refire}" @input="${this.refire}"></textarea>
    <div id="overlay">
      <svg></svg>
    </div>
    `;
        }
        get textarea() {
            return this.textareaInput;
        }
        get value() {
            const input = this.textarea;
            return (input && input.value) || '';
        }
        set value(v) {
            if (this.shadowRoot) {
                const input = this.textarea;
                if (input) {
                    input.value = v;
                }
            }
            else {
                this.pendingValue = v;
            }
        }
        firstUpdated() {
            this.value = this.pendingValue || this.value || this.getAttribute('value') || '';
            delete this.pendingValue;
        }
        canvasSize() {
            const s = this.getBoundingClientRect();
            return [s.width, s.height];
        }
        draw(svg, size) {
            rectangle(svg, 4, 4, size[0] - 4, size[1] - 4);
        }
        refire(event) {
            event.stopPropagation();
            fire(this, event.type, { sourceEvent: event });
        }
    };
    __decorate$n([
        property({ type: Boolean, reflect: true }),
        __metadata$n("design:type", Object)
    ], exports.WiredTextarea.prototype, "disabled", void 0);
    __decorate$n([
        property({ type: Number }),
        __metadata$n("design:type", Object)
    ], exports.WiredTextarea.prototype, "rows", void 0);
    __decorate$n([
        property({ type: Number }),
        __metadata$n("design:type", Object)
    ], exports.WiredTextarea.prototype, "maxrows", void 0);
    __decorate$n([
        property({ type: String }),
        __metadata$n("design:type", Object)
    ], exports.WiredTextarea.prototype, "autocomplete", void 0);
    __decorate$n([
        property({ type: Boolean }),
        __metadata$n("design:type", Object)
    ], exports.WiredTextarea.prototype, "autofocus", void 0);
    __decorate$n([
        property({ type: String }),
        __metadata$n("design:type", Object)
    ], exports.WiredTextarea.prototype, "inputmode", void 0);
    __decorate$n([
        property({ type: String }),
        __metadata$n("design:type", Object)
    ], exports.WiredTextarea.prototype, "placeholder", void 0);
    __decorate$n([
        property({ type: Boolean }),
        __metadata$n("design:type", Object)
    ], exports.WiredTextarea.prototype, "required", void 0);
    __decorate$n([
        property({ type: Boolean }),
        __metadata$n("design:type", Object)
    ], exports.WiredTextarea.prototype, "readonly", void 0);
    __decorate$n([
        property({ type: Number }),
        __metadata$n("design:type", Number)
    ], exports.WiredTextarea.prototype, "minlength", void 0);
    __decorate$n([
        property({ type: Number }),
        __metadata$n("design:type", Number)
    ], exports.WiredTextarea.prototype, "maxlength", void 0);
    __decorate$n([
        query('textarea'),
        __metadata$n("design:type", HTMLTextAreaElement)
    ], exports.WiredTextarea.prototype, "textareaInput", void 0);
    exports.WiredTextarea = __decorate$n([
        customElement('wired-textarea')
    ], exports.WiredTextarea);

    var __decorate$o = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$o = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredToggle = class WiredToggle extends WiredBase {
        constructor() {
            super(...arguments);
            this.checked = false;
            this.disabled = false;
        }
        static get styles() {
            return [
                BaseCSS,
                css `
      :host {
        display: inline-block;
        cursor: pointer;
        position: relative;
        outline: none;
      }
      :host([disabled]) {
        opacity: 0.4 !important;
        cursor: default;
        pointer-events: none;
      }
      :host([disabled]) svg {
        background: rgba(0, 0, 0, 0.07);
      }
      input {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        cursor: pointer;
        opacity: 0;
      }
      .knob {
        transition: transform 0.3s ease;
      }
      .knob path {
        stroke-width: 0.7;
      }
      .knob.checked {
        transform: translateX(48px);
      }
      .knobfill path {
        stroke-width: 3 !important;
        fill: transparent;
      }
      .knob.unchecked .knobfill path {
        stroke: var(--wired-toggle-off-color, gray);
      }
      .knob.checked .knobfill path {
        stroke: var(--wired-toggle-on-color, rgb(63, 81, 181));
      }
      `
            ];
        }
        render() {
            return html `
    <div style="position: relative;">
      <svg></svg>
      <input type="checkbox" .checked="${this.checked}" ?disabled="${this.disabled}"  @change="${this.onChange}">
    </div>
    `;
        }
        focus() {
            if (this.input) {
                this.input.focus();
            }
            else {
                super.focus();
            }
        }
        wiredRender(force = false) {
            super.wiredRender(force);
            this.refreshKnob();
        }
        onChange() {
            this.checked = this.input.checked;
            this.refreshKnob();
            fire(this, 'change', { checked: this.checked });
        }
        canvasSize() {
            return [80, 34];
        }
        draw(svg, size) {
            rectangle(svg, 16, 8, size[0] - 32, 18);
            this.knob = svgNode('g');
            this.knob.classList.add('knob');
            svg.appendChild(this.knob);
            const knobFill = hachureEllipseFill(16, 16, 32, 32);
            knobFill.classList.add('knobfill');
            this.knob.appendChild(knobFill);
            ellipse(this.knob, 16, 16, 32, 32);
        }
        refreshKnob() {
            if (this.knob) {
                const cl = this.knob.classList;
                if (this.checked) {
                    cl.remove('unchecked');
                    cl.add('checked');
                }
                else {
                    cl.remove('checked');
                    cl.add('unchecked');
                }
            }
        }
    };
    __decorate$o([
        property({ type: Boolean }),
        __metadata$o("design:type", Object)
    ], exports.WiredToggle.prototype, "checked", void 0);
    __decorate$o([
        property({ type: Boolean, reflect: true }),
        __metadata$o("design:type", Object)
    ], exports.WiredToggle.prototype, "disabled", void 0);
    __decorate$o([
        query('input'),
        __metadata$o("design:type", HTMLInputElement)
    ], exports.WiredToggle.prototype, "input", void 0);
    exports.WiredToggle = __decorate$o([
        customElement('wired-toggle')
    ], exports.WiredToggle);

    var __decorate$p = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata$p = (undefined && undefined.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    exports.WiredVideo = class WiredVideo extends WiredBase {
        constructor() {
            super();
            this.src = '';
            this.autoplay = false;
            this.loop = false;
            this.muted = false;
            this.playsinline = false;
            this.playing = false;
            this.timeDisplay = '';
            if (window.ResizeObserver) {
                this.resizeObserver = new window.ResizeObserver(() => {
                    if (this.svg) {
                        this.wiredRender();
                    }
                });
            }
        }
        static get styles() {
            return [
                BaseCSS,
                css `
        :host {
          display: inline-block;
          position: relative;
          line-height: 1;
          padding: 3px 3px 68px;
          --wired-progress-color: var(--wired-video-highlight-color, rgb(51, 103, 214));
          --wired-slider-knob-color: var(--wired-video-highlight-color, rgb(51, 103, 214));
        }
        video {
          display: block;
          box-sizing: border-box;
          max-width: 100%;
          max-height: 100%;
        }
        path {
          stroke-width: 1;
        }
        #controls {
          position: absolute;
          pointer-events: auto;
          left: 0;
          bottom: 0;
          width: 100%;
          box-sizing: border-box;
          height: 70px;
        }
        .layout.horizontal {
          display: -ms-flexbox;
          display: -webkit-flex;
          display: flex;
          -ms-flex-direction: row;
          -webkit-flex-direction: row;
          flex-direction: row;
          -ms-flex-align: center;
          -webkit-align-items: center;
          align-items: center;
          padding: 5px 10px;
        }
        .flex {
          -ms-flex: 1 1 0.000000001px;
          -webkit-flex: 1;
          flex: 1;
          -webkit-flex-basis: 0.000000001px;
          flex-basis: 0.000000001px;
        }
        wired-progress {
          display: block;
          width: 100%;
          box-sizing: border-box;
          height: 20px;
          --wired-progress-label-color: transparent;
          --wired-progress-label-background: transparent;
        }
        wired-icon-button span {
          font-size: 16px;
          line-height: 16px;
          width: 16px;
          height: 16px;
          padding: 0px;
          font-family: sans-serif;
          display: inline-block;
        }
        #timeDisplay {
          padding: 0 20px 0 8px;
          font-size: 13px;
        }
        wired-slider {
          display: block;
          max-width: 200px;
          margin: 0 6px 0 auto;
        }
      `
            ];
        }
        render() {
            return html `
    <video 
      .autoplay="${this.autoplay}"
      .loop="${this.loop}"
      .muted="${this.muted}"
      .playsinline="${this.playsinline}"
      src="${this.src}"
      @play="${() => this.playing = true}"
      @pause="${() => this.playing = false}"
      @canplay="${this.canPlay}"
      @timeupdate="${this.updateTime}">
    </video>
    <div id="overlay">
      <svg></svg>
    </div>
    <div id="controls">
      <wired-progress></wired-progress>
      <div class="horizontal layout center">
        <wired-icon-button @click="${this.togglePause}">
          <span>${this.playing ? '||' : '▶'}</span>
        </wired-icon-button>
        <div id="timeDisplay">${this.timeDisplay}</div>
        <div class="flex">
          <wired-slider @change="${this.volumeChange}"></wired-slider>
        </div>
        <div style="width: 24px; height: 24px;">
          <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;"><g><path style="stroke: none; fill: currentColor;" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path></g></svg>
        </div>
      </div>
    </div>
    `;
        }
        updated() {
            super.updated();
            this.attachResizeListener();
        }
        disconnectedCallback() {
            this.detachResizeListener();
        }
        attachResizeListener() {
            if (this.resizeObserver && this.resizeObserver.observe) {
                this.resizeObserver.observe(this);
            }
            else if (!this.windowResizeHandler) {
                this.windowResizeHandler = () => this.wiredRender();
                window.addEventListener('resize', this.windowResizeHandler, { passive: true });
            }
        }
        detachResizeListener() {
            if (this.resizeObserver && this.resizeObserver.unobserve) {
                this.resizeObserver.unobserve(this);
            }
            if (this.windowResizeHandler) {
                window.removeEventListener('resize', this.windowResizeHandler);
            }
        }
        wiredRender() {
            super.wiredRender();
            if (this.progressBar) {
                this.progressBar.wiredRender(true);
            }
        }
        canvasSize() {
            const s = this.getBoundingClientRect();
            return [s.width, s.height];
        }
        draw(svg, size) {
            rectangle(svg, 2, 2, size[0] - 4, size[1] - 4);
        }
        updateTime() {
            if (this.video && this.progressBar) {
                this.progressBar.value = this.video.duration ? Math.round((this.video.currentTime / this.video.duration) * 100) : 0;
                this.timeDisplay = `${this.getTimeDisplay(this.video.currentTime)} / ${this.getTimeDisplay(this.video.duration)}`;
            }
        }
        getTimeDisplay(time) {
            const mins = Math.floor(time / 60);
            const secs = Math.round(time - (mins * 60));
            return `${mins}:${secs}`;
        }
        togglePause() {
            if (this.video) {
                if (this.playing) {
                    this.video.pause();
                }
                else {
                    this.video.play();
                }
            }
        }
        volumeChange() {
            if (this.video && this.slider) {
                this.video.volume = this.slider.value / 100;
            }
        }
        canPlay() {
            if (this.slider && this.video) {
                this.slider.value = this.video.volume * 100;
            }
        }
    };
    __decorate$p([
        property({ type: String }),
        __metadata$p("design:type", Object)
    ], exports.WiredVideo.prototype, "src", void 0);
    __decorate$p([
        property({ type: Boolean }),
        __metadata$p("design:type", Object)
    ], exports.WiredVideo.prototype, "autoplay", void 0);
    __decorate$p([
        property({ type: Boolean }),
        __metadata$p("design:type", Object)
    ], exports.WiredVideo.prototype, "loop", void 0);
    __decorate$p([
        property({ type: Boolean }),
        __metadata$p("design:type", Object)
    ], exports.WiredVideo.prototype, "muted", void 0);
    __decorate$p([
        property({ type: Boolean }),
        __metadata$p("design:type", Object)
    ], exports.WiredVideo.prototype, "playsinline", void 0);
    __decorate$p([
        property(),
        __metadata$p("design:type", Object)
    ], exports.WiredVideo.prototype, "playing", void 0);
    __decorate$p([
        property(),
        __metadata$p("design:type", Object)
    ], exports.WiredVideo.prototype, "timeDisplay", void 0);
    __decorate$p([
        query('wired-progress'),
        __metadata$p("design:type", exports.WiredProgress)
    ], exports.WiredVideo.prototype, "progressBar", void 0);
    __decorate$p([
        query('wired-slider'),
        __metadata$p("design:type", exports.WiredSlider)
    ], exports.WiredVideo.prototype, "slider", void 0);
    __decorate$p([
        query('video'),
        __metadata$p("design:type", HTMLVideoElement)
    ], exports.WiredVideo.prototype, "video", void 0);
    exports.WiredVideo = __decorate$p([
        customElement('wired-video'),
        __metadata$p("design:paramtypes", [])
    ], exports.WiredVideo);

    return exports;

}({}));
