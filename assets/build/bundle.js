
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.21.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var store = /*#__PURE__*/Object.freeze({
        __proto__: null,
        derived: derived,
        readable: readable,
        writable: writable,
        get: get_store_value
    });

    function getCjsExportFromNamespace (n) {
    	return n && n['default'] || n;
    }

    var require$$0 = getCjsExportFromNamespace(store);

    const writable$1 = require$$0.writable;

    const router = writable$1({});

    function set(route) {
      router.set(route);
    }

    function remove() {
      router.set({});
    }

    const activeRoute = {
      subscribe: router.subscribe,
      set,
      remove
    };

    var store$1 = { activeRoute };
    var store_1 = store$1.activeRoute;

    const UrlParser = (urlString, namedUrl = "") => {
      const urlBase = new URL(urlString);

      /**
       * Wrapper for URL.host
       *
       **/
      function host() {
        return urlBase.host;
      }

      /**
       * Wrapper for URL.hostname
       *
       **/
      function hostname() {
        return urlBase.hostname;
      }

      /**
       * Returns an object with all the named params and their values
       *
       **/
      function namedParams() {
        const allPathName = pathNames();
        const allNamedParamsKeys = namedParamsWithIndex();

        return allNamedParamsKeys.reduce((values, paramKey) => {
          values[paramKey.value] = allPathName[paramKey.index];
          return values;
        }, {});
      }

      /**
       * Returns an array with all the named param keys
       *
       **/
      function namedParamsKeys() {
        const allNamedParamsKeys = namedParamsWithIndex();

        return allNamedParamsKeys.reduce((values, paramKey) => {
          values.push(paramKey.value);
          return values;
        }, []);
      }

      /**
       * Returns an array with all the named param values
       *
       **/
      function namedParamsValues() {
        const allPathName = pathNames();
        const allNamedParamsKeys = namedParamsWithIndex();

        return allNamedParamsKeys.reduce((values, paramKey) => {
          values.push(allPathName[paramKey.index]);
          return values;
        }, []);
      }

      /**
       * Returns an array with all named param ids and their position in the path
       * Private
       **/
      function namedParamsWithIndex() {
        const namedUrlParams = getPathNames(namedUrl);

        return namedUrlParams.reduce((validParams, param, index) => {
          if (param[0] === ":") {
            validParams.push({ value: param.slice(1), index });
          }
          return validParams;
        }, []);
      }

      /**
       * Wrapper for URL.port
       *
       **/
      function port() {
        return urlBase.port;
      }

      /**
       * Wrapper for URL.pathname
       *
       **/
      function pathname() {
        return urlBase.pathname;
      }

      /**
       * Wrapper for URL.protocol
       *
       **/
      function protocol() {
        return urlBase.protocol;
      }

      /**
       * Wrapper for URL.search
       *
       **/
      function search() {
        return urlBase.search;
      }

      /**
       * Returns an object with all query params and their values
       *
       **/
      function queryParams() {
        const params = {};
        urlBase.searchParams.forEach((value, key) => {
          params[key] = value;
        });

        return params;
      }

      /**
       * Returns an array with all the query param keys
       *
       **/
      function queryParamsKeys() {
        const params = [];
        urlBase.searchParams.forEach((_value, key) => {
          params.push(key);
        });

        return params;
      }

      /**
       * Returns an array with all the query param values
       *
       **/
      function queryParamsValues() {
        const params = [];
        urlBase.searchParams.forEach(value => {
          params.push(value);
        });

        return params;
      }

      /**
       * Returns an array with all the elements of a pathname
       *
       **/
      function pathNames() {
        return getPathNames(urlBase.pathname);
      }

      /**
       * Returns an array with all the parts of a pathname
       * Private method
       **/
      function getPathNames(pathName) {
        if (pathName === "/" || pathName.trim().length === 0) return [pathName];
        if (pathName.slice(-1) === "/") {
          pathName = pathName.slice(0, -1);
        }
        if (pathName[0] === "/") {
          pathName = pathName.slice(1);
        }

        return pathName.split("/");
      }

      return Object.freeze({
        host: host(),
        hostname: hostname(),
        namedParams: namedParams(),
        namedParamsKeys: namedParamsKeys(),
        namedParamsValues: namedParamsValues(),
        pathNames: pathNames(),
        port: port(),
        pathname: pathname(),
        protocol: protocol(),
        search: search(),
        queryParams: queryParams(),
        queryParamsKeys: queryParamsKeys(),
        queryParamsValues: queryParamsValues()
      });
    };

    var url_parser = { UrlParser };

    const UrlParser$1 = url_parser.UrlParser;

    var urlParamsParser = {
      UrlParser: UrlParser$1
    };

    /**
     * Returns true if object has any nested routes empty
     * @param routeObject
     **/
    function anyEmptyNestedRoutes(routeObject) {
      let result = false;
      if (Object.keys(routeObject).length === 0) {
        return true
      }

      if (routeObject.childRoute && Object.keys(routeObject.childRoute).length === 0) {
        result = true;
      } else if (routeObject.childRoute) {
        result = anyEmptyNestedRoutes(routeObject.childRoute);
      }

      return result
    }

    /**
     * Compare two routes ignoring named params
     * @param pathName string
     * @param routeName string
     **/

    function compareRoutes(pathName, routeName) {
      routeName = removeSlash(routeName);

      if (routeName.includes(':')) {
        return routeName.includes(pathName)
      } else {
        return routeName.startsWith(pathName)
      }
    }

    /**
     * Returns a boolean indicating if the name of path exists in the route based on the language parameter
     * @param pathName string
     * @param route object
     * @param language string
     **/

    function findLocalisedRoute(pathName, route, language) {
      let exists = false;

      if (language) {
        return { exists: route.lang && route.lang[language] && route.lang[language].includes(pathName), language }
      }

      exists = compareRoutes(pathName, route.name);

      if (!exists && route.lang && typeof route.lang === 'object') {
        for (const [key, value] of Object.entries(route.lang)) {
          if (compareRoutes(pathName, value)) {
            exists = true;
            language = key;
          }
        }
      }

      return { exists, language }
    }

    /**
     * Return all the consecutive named param (placeholders) of a pathname
     * @param pathname
     **/
    function getNamedParams(pathName = '') {
      if (pathName.trim().length === 0) return []
      const namedUrlParams = getPathNames(pathName);
      return namedUrlParams.reduce((validParams, param) => {
        if (param[0] === ':') {
          validParams.push(param.slice(1));
        }

        return validParams
      }, [])
    }

    /**
     * Split a pathname based on /
     * @param pathName
     * Private method
     **/
    function getPathNames(pathName) {
      if (pathName === '/' || pathName.trim().length === 0) return [pathName]

      pathName = removeSlash(pathName, 'both');

      return pathName.split('/')
    }

    /**
     * Return the first part of a pathname until the first named param is found
     * @param name
     **/
    function nameToPath(name = '') {
      let routeName;
      if (name === '/' || name.trim().length === 0) return name
      name = removeSlash(name, 'lead');
      routeName = name.split(':')[0];
      routeName = removeSlash(routeName, 'trail');

      return routeName.toLowerCase()
    }

    /**
     * Return the path name excluding query params
     * @param name
     **/
    function pathWithoutQueryParams(currentRoute) {
      const path = currentRoute.path.split('?');
      return path[0]
    }

    /**
     * Return the path name including query params
     * @param name
     **/
    function pathWithQueryParams(currentRoute) {
      let queryParams = [];
      if (currentRoute.queryParams) {
        for (let [key, value] of Object.entries(currentRoute.queryParams)) {
          queryParams.push(`${key}=${value}`);
        }
      }

      if (queryParams.length > 0) {
        return `${currentRoute.path}?${queryParams.join('&')}`
      } else {
        return currentRoute.path
      }
    }

    /**
     * Returns a string with trailing or leading slash character removed
     * @param pathName string
     * @param position string - lead, trail, both
     **/
    function removeExtraPaths(pathNames, basePathNames) {
      const names = basePathNames.split('/');
      if (names.length > 1) {
        names.forEach(function(name, index) {
          if (name.length > 0 && index > 0) {
            pathNames.shift();
          }
        });
      }

      return pathNames
    }

    /**
     * Returns a string with trailing or leading slash character removed
     * @param pathName string
     * @param position string - lead, trail, both
     **/

    function removeSlash(pathName, position = 'lead') {
      if (pathName.trim().length < 1) {
        return ''
      }

      if (position === 'trail' || position === 'both') {
        if (pathName.slice(-1) === '/') {
          pathName = pathName.slice(0, -1);
        }
      }

      if (position === 'lead' || position === 'both') {
        if (pathName[0] === '/') {
          pathName = pathName.slice(1);
        }
      }

      return pathName
    }

    /**
     * Returns the name of the route based on the language parameter
     * @param route object
     * @param language string
     **/

    function routeNameLocalised(route, language = null) {
      if (!language || !route.lang || !route.lang[language]) {
        return route.name
      } else {
        return route.lang[language]
      }
    }

    /**
     * Updates the base route path.
     * Route objects can have nested routes (childRoutes) or just a long name like "admin/employees/show/:id"
     *
     * @param basePath string
     * @param pathNames array
     * @param route object
     * @param language string
     **/

    function updateRoutePath(basePath, pathNames, route, language, convert = false) {
      if (basePath === '/' || basePath.trim().length === 0) return { result: basePath, language: null }

      let basePathResult = basePath;
      let routeName = route.name;
      let currentLanguage = language;

      if (convert) {
        currentLanguage = '';
      }

      routeName = removeSlash(routeName);
      basePathResult = removeSlash(basePathResult);

      if (!route.childRoute) {
        let localisedRoute = findLocalisedRoute(basePathResult, route, currentLanguage);

        if (localisedRoute.exists && convert) {
          basePathResult = routeNameLocalised(route, language);
        }

        let routeNames = routeName.split(':')[0];
        routeNames = removeSlash(routeNames, 'trail');
        routeNames = routeNames.split('/');
        routeNames.shift();
        routeNames.forEach(() => {
          const currentPathName = pathNames[0];
          localisedRoute = findLocalisedRoute(`${basePathResult}/${currentPathName}`, route, currentLanguage);

          if (currentPathName && localisedRoute.exists) {
            if (convert) {
              basePathResult = routeNameLocalised(route, language);
            } else {
              basePathResult = `${basePathResult}/${currentPathName}`;
            }
            pathNames.shift();
          } else {
            return { result: basePathResult, language: localisedRoute.language }
          }
        });
        return { result: basePathResult, language: localisedRoute.language }
      } else {
        return { result: basePath, language: currentLanguage }
      }
    }

    var utils = {
      anyEmptyNestedRoutes,
      compareRoutes,
      findLocalisedRoute,
      getNamedParams,
      getPathNames,
      nameToPath,
      pathWithQueryParams,
      pathWithoutQueryParams,
      removeExtraPaths,
      removeSlash,
      routeNameLocalised,
      updateRoutePath
    };

    const { UrlParser: UrlParser$2 } = urlParamsParser;

    const { pathWithQueryParams: pathWithQueryParams$1, removeSlash: removeSlash$1 } = utils;

    function RouterCurrent(trackPage) {
      const trackPageview = trackPage || false;
      let activeRoute = '';

      function setActive(newRoute) {
        activeRoute = newRoute.path;
        pushActiveRoute(newRoute);
      }

      function active() {
        return activeRoute
      }

      /**
       * Returns true if pathName is current active route
       * @param pathName String The path name to check against the current route.
       * @param includePath Boolean if true checks that pathName is included in current route. If false should match it.
       **/
      function isActive(queryPath, includePath = false) {
        if (queryPath[0] !== '/') {
          queryPath = '/' + queryPath;
        }

        // remove query params for comparison
        let pathName = UrlParser$2(`http://fake.com${queryPath}`).pathname;
        let activeRoutePath = UrlParser$2(`http://fake.com${activeRoute}`).pathname;

        pathName = removeSlash$1(pathName, 'trail');

        activeRoutePath = removeSlash$1(activeRoutePath, 'trail');

        if (includePath) {
          return activeRoutePath.includes(pathName)
        } else {
          return activeRoutePath === pathName
        }
      }

      function pushActiveRoute(newRoute) {
        if (typeof window !== 'undefined') {
          const pathAndSearch = pathWithQueryParams$1(newRoute);
          //if (window.history && window.history.state && window.history.state.page !== pathAndSearch) {
          window.history.pushState({ page: pathAndSearch }, '', pathAndSearch);
          if (trackPageview) {
            gaTracking(pathAndSearch);
          }
        }
      }

      function gaTracking(newPage) {
        if (typeof ga !== 'undefined') {
          ga('set', 'page', newPage);
          ga('send', 'pageview');
        }
      }

      return Object.freeze({ active, isActive, setActive })
    }

    var current = { RouterCurrent };

    function RouterGuard(onlyIf) {
      const guardInfo = onlyIf;

      function valid() {
        return guardInfo && guardInfo.guard && typeof guardInfo.guard === 'function'
      }

      function redirect() {
        return !guardInfo.guard()
      }

      function redirectPath() {
        let destinationUrl = '/';
        if (guardInfo.redirect && guardInfo.redirect.length > 0) {
          destinationUrl = guardInfo.redirect;
        }

        return destinationUrl
      }

      return Object.freeze({ valid, redirect, redirectPath })
    }

    var guard = { RouterGuard };

    const { RouterGuard: RouterGuard$1 } = guard;

    function RouterRedirect(route, currentPath) {
      const guard = RouterGuard$1(route.onlyIf);

      function path() {
        let redirectTo = currentPath;
        if (route.redirectTo && route.redirectTo.length > 0) {
          redirectTo = route.redirectTo;
        }

        if (guard.valid() && guard.redirect()) {
          redirectTo = guard.redirectPath();
        }

        return redirectTo
      }

      return Object.freeze({ path })
    }

    var redirect = { RouterRedirect };

    const { UrlParser: UrlParser$3 } = urlParamsParser;

    function RouterRoute({ routeInfo, path, routeNamedParams, urlParser, namedPath, language }) {
      function namedParams() {
        const parsedParams = UrlParser$3(`https://fake.com${urlParser.pathname}`, namedPath).namedParams;

        return { ...routeNamedParams, ...parsedParams }
      }

      function get() {
        return {
          name: path,
          component: routeInfo.component,
          layout: routeInfo.layout,
          queryParams: urlParser.queryParams,
          namedParams: namedParams(),
          path,
          language
        }
      }

      return Object.freeze({ get, namedParams })
    }

    var route = { RouterRoute };

    const { updateRoutePath: updateRoutePath$1, getNamedParams: getNamedParams$1, nameToPath: nameToPath$1, removeExtraPaths: removeExtraPaths$1, routeNameLocalised: routeNameLocalised$1 } = utils;

    function RouterPath({ basePath, basePathName, pathNames, convert, currentLanguage }) {
      let updatedPathRoute;
      let route;
      let routePathLanguage = currentLanguage;

      function updatedPath(currentRoute) {
        route = currentRoute;
        updatedPathRoute = updateRoutePath$1(basePathName, pathNames, route, routePathLanguage, convert);
        routePathLanguage = convert ? currentLanguage : updatedPathRoute.language;

        return updatedPathRoute
      }

      function localisedPathName() {
        return routeNameLocalised$1(route, routePathLanguage)
      }

      function localisedRouteWithoutNamedParams() {
        return nameToPath$1(localisedPathName())
      }

      function basePathNameWithoutNamedParams() {
        return nameToPath$1(updatedPathRoute.result)
      }

      function namedPath() {
        const localisedPath = localisedPathName();

        return basePath ? `${basePath}/${localisedPath}` : localisedPath
      }

      function routePath() {
        let routePathValue = `${basePath}/${basePathNameWithoutNamedParams()}`;
        if (routePathValue === '//') {
          routePathValue = '/';
        }

        if (routePathLanguage) {
          pathNames = removeExtraPaths$1(pathNames, localisedRouteWithoutNamedParams());
        }

        const namedParams = getNamedParams$1(localisedPathName());
        if (namedParams && namedParams.length > 0) {
          namedParams.forEach(function() {
            if (pathNames.length > 0) {
              routePathValue += `/${pathNames.shift()}`;
            }
          });
        }

        return routePathValue
      }

      function routeLanguage() {
        return routePathLanguage
      }

      function basePathSameAsLocalised() {
        return basePathNameWithoutNamedParams() === localisedRouteWithoutNamedParams()
      }

      return Object.freeze({
        basePathSameAsLocalised,
        updatedPath,
        basePathNameWithoutNamedParams,
        localisedPathName,
        localisedRouteWithoutNamedParams,
        namedPath,
        pathNames,
        routeLanguage,
        routePath
      })
    }

    var path = { RouterPath };

    const { UrlParser: UrlParser$4 } = urlParamsParser;

    const { RouterRedirect: RouterRedirect$1 } = redirect;
    const { RouterRoute: RouterRoute$1 } = route;
    const { RouterPath: RouterPath$1 } = path;
    const { anyEmptyNestedRoutes: anyEmptyNestedRoutes$1, pathWithoutQueryParams: pathWithoutQueryParams$1 } = utils;

    const NotFoundPage = '/404.html';

    function RouterFinder({ routes, currentUrl, routerOptions, convert }) {
      const defaultLanguage = routerOptions.defaultLanguage;
      const urlParser = UrlParser$4(currentUrl);
      let redirectTo = '';
      let routeNamedParams = {};

      function findActiveRoute() {
        let searchActiveRoute = searchActiveRoutes(routes, '', urlParser.pathNames, routerOptions.lang, convert);

        if (!searchActiveRoute || !Object.keys(searchActiveRoute).length || anyEmptyNestedRoutes$1(searchActiveRoute)) {
          if (typeof window !== 'undefined') {
            searchActiveRoute = routeNotFound(routerOptions.lang);
          }
        } else {
          searchActiveRoute.path = pathWithoutQueryParams$1(searchActiveRoute);
        }

        return searchActiveRoute
      }

      /**
       * Gets an array of routes and the browser pathname and return the active route
       * @param routes
       * @param basePath
       * @param pathNames
       **/
      function searchActiveRoutes(routes, basePath, pathNames, currentLanguage, convert) {
        let currentRoute = {};
        let basePathName = pathNames.shift().toLowerCase();
        const routerPath = RouterPath$1({ basePath, basePathName, pathNames, convert, currentLanguage });

        routes.forEach(function (route) {
          routerPath.updatedPath(route);
          if (routerPath.basePathSameAsLocalised()) {
            let routePath = routerPath.routePath();

            redirectTo = RouterRedirect$1(route, redirectTo).path();

            if (currentRoute.name !== routePath) {
              currentRoute = setCurrentRoute({
                route,
                routePath,
                routeLanguage: routerPath.routeLanguage(),
                urlParser,
                namedPath: routerPath.namedPath(),
              });
            }

            if (route.nestedRoutes && route.nestedRoutes.length > 0 && routerPath.pathNames.length > 0) {
              currentRoute.childRoute = searchActiveRoutes(
                route.nestedRoutes,
                routePath,
                routerPath.pathNames,
                routerPath.routeLanguage(),
                convert
              );
              currentRoute.path = currentRoute.childRoute.path;
              currentRoute.language = currentRoute.childRoute.language;
            } else if (nestedRoutesAndNoPath(route, routerPath.pathNames)) {
              const indexRoute = searchActiveRoutes(
                route.nestedRoutes,
                routePath,
                ['index'],
                routerPath.routeLanguage(),
                convert
              );
              if (indexRoute && Object.keys(indexRoute).length > 0) {
                currentRoute.childRoute = indexRoute;
                currentRoute.language = currentRoute.childRoute.language;
              }
            }
          }
        });

        if (redirectTo) {
          currentRoute.redirectTo = redirectTo;
        }

        return currentRoute
      }

      function nestedRoutesAndNoPath(route, pathNames) {
        return route.nestedRoutes && route.nestedRoutes.length > 0 && pathNames.length === 0
      }

      function setCurrentRoute({ route, routePath, routeLanguage, urlParser, namedPath }) {
        const routerRoute = RouterRoute$1({
          routeInfo: route,
          urlParser,
          path: routePath,
          routeNamedParams,
          namedPath,
          language: routeLanguage || defaultLanguage,
        });
        routeNamedParams = routerRoute.namedParams();

        return routerRoute.get()
      }

      function routeNotFound(customLanguage) {
        const custom404Page = routes.find((route) => route.name == '404');
        const language = customLanguage || defaultLanguage || '';
        if (custom404Page) {
          return { ...custom404Page, language, path: '404' }
        } else {
          return { name: '404', component: '', path: '404', redirectTo: NotFoundPage }
        }
      }

      return Object.freeze({ findActiveRoute })
    }

    var finder = { RouterFinder };

    const { activeRoute: activeRoute$1 } = store$1;
    const { RouterCurrent: RouterCurrent$1 } = current;
    const { RouterFinder: RouterFinder$1 } = finder;
    const { removeSlash: removeSlash$2 } = utils;

    const NotFoundPage$1 = '/404.html';

    let userDefinedRoutes = [];
    let routerOptions = {};
    let routerCurrent;

    /**
     * Object exposes one single property: activeRoute
     * @param routes  Array of routes
     * @param currentUrl current url
     * @param options configuration options
     **/
    function SpaRouter(routes, currentUrl, options = {}) {
      routerOptions = { ...options };
      if (typeof currentUrl === 'undefined' || currentUrl === '') {
        currentUrl = document.location.href;
      }

      routerCurrent = RouterCurrent$1(routerOptions.gaPageviews);

      currentUrl = removeSlash$2(currentUrl, 'trail');
      userDefinedRoutes = routes;

      function findActiveRoute() {
        let convert = false;

        if (routerOptions.langConvertTo) {
          routerOptions.lang = routerOptions.langConvertTo;
          convert = true;
        }

        return RouterFinder$1({ routes, currentUrl, routerOptions, convert }).findActiveRoute()
      }

      /**
       * Redirect current route to another
       * @param destinationUrl
       **/
      function navigateNow(destinationUrl) {
        if (typeof window !== 'undefined') {
          if (destinationUrl === NotFoundPage$1) {
            routerCurrent.setActive({ path: NotFoundPage$1 });
          } else {
            navigateTo(destinationUrl);
          }
        }

        return destinationUrl
      }

      function setActiveRoute() {
        const currentRoute = findActiveRoute();
        if (currentRoute.redirectTo) {
          return navigateNow(currentRoute.redirectTo)
        }

        routerCurrent.setActive(currentRoute);
        activeRoute$1.set(currentRoute);

        return currentRoute
      }

      return Object.freeze({
        setActiveRoute,
        findActiveRoute
      })
    }

    /**
     * Converts a route to its localised version
     * @param pathName
     **/
    function localisedRoute(pathName, language) {
      pathName = removeSlash$2(pathName, 'lead');
      routerOptions.langConvertTo = language;

      return SpaRouter(userDefinedRoutes, 'http://fake.com/' + pathName, routerOptions).findActiveRoute()
    }

    /**
     * Updates the current active route and updates the browser pathname
     * @param pathName String
     * @param language String
     **/
    function navigateTo(pathName, language = null) {
      pathName = removeSlash$2(pathName, 'lead');

      if (language) {
        routerOptions.langConvertTo = language;
      }

      return SpaRouter(userDefinedRoutes, 'http://fake.com/' + pathName, routerOptions).setActiveRoute()
    }

    /**
     * Returns true if pathName is current active route
     * @param pathName String The path name to check against the current route.
     * @param includePath Boolean if true checks that pathName is included in current route. If false should match it.
     **/
    function routeIsActive(queryPath, includePath = false) {
      return routerCurrent.isActive(queryPath, includePath)
    }

    if (typeof window !== 'undefined') {
      // Avoid full page reload on local routes
      window.addEventListener('click', event => {
        if (event.target.pathname && event.target.hostname === window.location.hostname && event.target.localName === 'a') {
          event.preventDefault();
          // event.stopPropagation()
          navigateTo(event.target.pathname + event.target.search);
        }
      });

      window.onpopstate = function(_event) {
        navigateTo(window.location.pathname + window.location.search);
      };
    }

    var spa_router = { SpaRouter, localisedRoute, navigateTo, routeIsActive };
    var spa_router_1 = spa_router.SpaRouter;
    var spa_router_2 = spa_router.localisedRoute;
    var spa_router_3 = spa_router.navigateTo;
    var spa_router_4 = spa_router.routeIsActive;

    /* node_modules/svelte-router-spa/src/components/route.svelte generated by Svelte v3.21.0 */

    // (10:34) 
    function create_if_block_2(ctx) {
    	let current;

    	const route = new Route({
    			props: {
    				currentRoute: /*currentRoute*/ ctx[0].childRoute,
    				params: /*params*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(route, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const route_changes = {};
    			if (dirty & /*currentRoute*/ 1) route_changes.currentRoute = /*currentRoute*/ ctx[0].childRoute;
    			if (dirty & /*params*/ 2) route_changes.params = /*params*/ ctx[1];
    			route.$set(route_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(10:34) ",
    		ctx
    	});

    	return block;
    }

    // (8:33) 
    function create_if_block_1(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*currentRoute*/ ctx[0].component;

    	function switch_props(ctx) {
    		return {
    			props: {
    				currentRoute: {
    					.../*currentRoute*/ ctx[0],
    					component: ""
    				},
    				params: /*params*/ ctx[1]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};

    			if (dirty & /*currentRoute*/ 1) switch_instance_changes.currentRoute = {
    				.../*currentRoute*/ ctx[0],
    				component: ""
    			};

    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*currentRoute*/ ctx[0].component)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(8:33) ",
    		ctx
    	});

    	return block;
    }

    // (6:0) {#if currentRoute.layout}
    function create_if_block(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*currentRoute*/ ctx[0].layout;

    	function switch_props(ctx) {
    		return {
    			props: {
    				currentRoute: { .../*currentRoute*/ ctx[0], layout: "" },
    				params: /*params*/ ctx[1]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const switch_instance_changes = {};
    			if (dirty & /*currentRoute*/ 1) switch_instance_changes.currentRoute = { .../*currentRoute*/ ctx[0], layout: "" };
    			if (dirty & /*params*/ 2) switch_instance_changes.params = /*params*/ ctx[1];

    			if (switch_value !== (switch_value = /*currentRoute*/ ctx[0].layout)) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(6:0) {#if currentRoute.layout}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentRoute*/ ctx[0].layout) return 0;
    		if (/*currentRoute*/ ctx[0].component) return 1;
    		if (/*currentRoute*/ ctx[0].childRoute) return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { currentRoute = {} } = $$props;
    	let { params = {} } = $$props;
    	const writable_props = ["currentRoute", "params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Route> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Route", $$slots, []);

    	$$self.$set = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({ currentRoute, params });

    	$$self.$inject_state = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentRoute, params];
    }

    class Route extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { currentRoute: 0, params: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Route",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get currentRoute() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRoute(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Route>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Route>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var route$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Route
    });

    /* node_modules/svelte-router-spa/src/components/router.svelte generated by Svelte v3.21.0 */

    function create_fragment$1(ctx) {
    	let current;

    	const route = new Route({
    			props: { currentRoute: /*$activeRoute*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(route.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(route, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const route_changes = {};
    			if (dirty & /*$activeRoute*/ 1) route_changes.currentRoute = /*$activeRoute*/ ctx[0];
    			route.$set(route_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(route.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(route.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(route, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $activeRoute;
    	validate_store(store_1, "activeRoute");
    	component_subscribe($$self, store_1, $$value => $$invalidate(0, $activeRoute = $$value));
    	let { routes = [] } = $$props;
    	let { options = {} } = $$props;

    	onMount(function () {
    		spa_router_1(routes, document.location.href, options).setActiveRoute();
    	});

    	const writable_props = ["routes", "options"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Router", $$slots, []);

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(1, routes = $$props.routes);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		SpaRouter: spa_router_1,
    		Route,
    		activeRoute: store_1,
    		routes,
    		options,
    		$activeRoute
    	});

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(1, routes = $$props.routes);
    		if ("options" in $$props) $$invalidate(2, options = $$props.options);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$activeRoute, routes, options];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { routes: 1, options: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get routes() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var router$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Router
    });

    /* node_modules/svelte-router-spa/src/components/navigate.svelte generated by Svelte v3.21.0 */
    const file = "node_modules/svelte-router-spa/src/components/navigate.svelte";

    function create_fragment$2(ctx) {
    	let a;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[6].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[5], null);

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (default_slot) default_slot.c();
    			attr_dev(a, "href", /*to*/ ctx[0]);
    			attr_dev(a, "title", /*title*/ ctx[1]);
    			attr_dev(a, "class", /*styles*/ ctx[2]);
    			toggle_class(a, "active", spa_router_4(/*to*/ ctx[0]));
    			add_location(a, file, 24, 0, 482);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, a, anchor);

    			if (default_slot) {
    				default_slot.m(a, null);
    			}

    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(a, "click", /*navigate*/ ctx[3], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 32) {
    					default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[5], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[5], dirty, null));
    				}
    			}

    			if (!current || dirty & /*to*/ 1) {
    				attr_dev(a, "href", /*to*/ ctx[0]);
    			}

    			if (!current || dirty & /*title*/ 2) {
    				attr_dev(a, "title", /*title*/ ctx[1]);
    			}

    			if (!current || dirty & /*styles*/ 4) {
    				attr_dev(a, "class", /*styles*/ ctx[2]);
    			}

    			if (dirty & /*styles, routeIsActive, to*/ 5) {
    				toggle_class(a, "active", spa_router_4(/*to*/ ctx[0]));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { to = "/" } = $$props;
    	let { title = "" } = $$props;
    	let { styles = "" } = $$props;
    	let { lang = null } = $$props;

    	onMount(function () {
    		if (lang) {
    			const route = spa_router_2(to, lang);

    			if (route) {
    				$$invalidate(0, to = route.path);
    			}
    		}
    	});

    	function navigate(event) {
    		event.preventDefault();
    		event.stopPropagation();
    		spa_router_3(to);
    	}

    	const writable_props = ["to", "title", "styles", "lang"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navigate> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Navigate", $$slots, ['default']);

    	$$self.$set = $$props => {
    		if ("to" in $$props) $$invalidate(0, to = $$props.to);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("styles" in $$props) $$invalidate(2, styles = $$props.styles);
    		if ("lang" in $$props) $$invalidate(4, lang = $$props.lang);
    		if ("$$scope" in $$props) $$invalidate(5, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		localisedRoute: spa_router_2,
    		navigateTo: spa_router_3,
    		routeIsActive: spa_router_4,
    		to,
    		title,
    		styles,
    		lang,
    		navigate
    	});

    	$$self.$inject_state = $$props => {
    		if ("to" in $$props) $$invalidate(0, to = $$props.to);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("styles" in $$props) $$invalidate(2, styles = $$props.styles);
    		if ("lang" in $$props) $$invalidate(4, lang = $$props.lang);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [to, title, styles, navigate, lang, $$scope, $$slots];
    }

    class Navigate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { to: 0, title: 1, styles: 2, lang: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigate",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get to() {
    		throw new Error("<Navigate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set to(value) {
    		throw new Error("<Navigate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Navigate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Navigate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get styles() {
    		throw new Error("<Navigate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set styles(value) {
    		throw new Error("<Navigate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get lang() {
    		throw new Error("<Navigate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set lang(value) {
    		throw new Error("<Navigate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var navigate = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Navigate
    });

    var Route$1 = getCjsExportFromNamespace(route$1);

    var Router$1 = getCjsExportFromNamespace(router$1);

    var Navigate$1 = getCjsExportFromNamespace(navigate);

    const { SpaRouter: SpaRouter$1, navigateTo: navigateTo$1, localisedRoute: localisedRoute$1, routeIsActive: routeIsActive$1 } = spa_router;




    var src = {
      SpaRouter: SpaRouter$1,
      localisedRoute: localisedRoute$1,
      navigateTo: navigateTo$1,
      routeIsActive: routeIsActive$1,
      Route: Route$1,
      Router: Router$1,
      Navigate: Navigate$1
    };
    var src_3 = src.navigateTo;
    var src_6 = src.Router;
    var src_7 = src.Navigate;

    /* src/pages/homepage/index.svelte generated by Svelte v3.21.0 */
    const file$1 = "src/pages/homepage/index.svelte";

    // (39:4) <Navigate to="/setup">
    function create_default_slot_1(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Start new game";
    			attr_dev(button, "class", "svelte-1k9r9ni");
    			add_location(button, file$1, 39, 6, 584);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(39:4) <Navigate to=\\\"/setup\\\">",
    		ctx
    	});

    	return block;
    }

    // (45:4) <Navigate to="/join">
    function create_default_slot(ctx) {
    	let button;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Join game";
    			attr_dev(button, "class", "svelte-1k9r9ni");
    			add_location(button, file$1, 45, 6, 707);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(45:4) <Navigate to=\\\"/join\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let a0;
    	let t4;
    	let a1;
    	let t6;
    	let a2;
    	let t8;
    	let a3;
    	let current;

    	const navigate0 = new src_7({
    			props: {
    				to: "/setup",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const navigate1 = new src_7({
    			props: {
    				to: "/join",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			create_component(navigate0.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			create_component(navigate1.$$.fragment);
    			t1 = space();
    			div2 = element("div");
    			t2 = text("Made by\n    ");
    			a0 = element("a");
    			a0.textContent = "Ben Slater";
    			t4 = text("\n    using\n    ");
    			a1 = element("a");
    			a1.textContent = "Svelte,";
    			t6 = space();
    			a2 = element("a");
    			a2.textContent = "Sails.js,";
    			t8 = text("\n    and\n    ");
    			a3 = element("a");
    			a3.textContent = "Paper CSS";
    			attr_dev(div0, "class", "button-container svelte-1k9r9ni");
    			add_location(div0, file$1, 37, 2, 520);
    			attr_dev(div1, "class", "button-container svelte-1k9r9ni");
    			add_location(div1, file$1, 43, 2, 644);
    			attr_dev(a0, "class", "text-secondary");
    			attr_dev(a0, "href", "http://benslater.tech");
    			add_location(a0, file$1, 51, 4, 798);
    			attr_dev(a1, "class", "text-secondary");
    			attr_dev(a1, "href", "https://svelte.dev/");
    			add_location(a1, file$1, 53, 4, 882);
    			attr_dev(a2, "class", "text-secondary");
    			attr_dev(a2, "href", "https://sailsjs.com/");
    			add_location(a2, file$1, 54, 4, 951);
    			attr_dev(a3, "class", "text-secondary");
    			attr_dev(a3, "href", "https://www.getpapercss.com");
    			add_location(a3, file$1, 56, 4, 1031);
    			attr_dev(div2, "class", "about svelte-1k9r9ni");
    			add_location(div2, file$1, 49, 2, 762);
    			attr_dev(div3, "class", "homepage svelte-1k9r9ni");
    			add_location(div3, file$1, 36, 0, 495);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			mount_component(navigate0, div0, null);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			mount_component(navigate1, div1, null);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div2, t2);
    			append_dev(div2, a0);
    			append_dev(div2, t4);
    			append_dev(div2, a1);
    			append_dev(div2, t6);
    			append_dev(div2, a2);
    			append_dev(div2, t8);
    			append_dev(div2, a3);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const navigate0_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				navigate0_changes.$$scope = { dirty, ctx };
    			}

    			navigate0.$set(navigate0_changes);
    			const navigate1_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				navigate1_changes.$$scope = { dirty, ctx };
    			}

    			navigate1.$set(navigate1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigate0.$$.fragment, local);
    			transition_in(navigate1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navigate0.$$.fragment, local);
    			transition_out(navigate1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(navigate0);
    			destroy_component(navigate1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { currentRoute } = $$props;
    	let { params } = $$props;
    	const writable_props = ["currentRoute", "params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Homepage> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Homepage", $$slots, []);

    	$$self.$set = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({ Navigate: src_7, currentRoute, params });

    	$$self.$inject_state = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentRoute, params];
    }

    class Homepage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { currentRoute: 0, params: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Homepage",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentRoute*/ ctx[0] === undefined && !("currentRoute" in props)) {
    			console.warn("<Homepage> was created without expected prop 'currentRoute'");
    		}

    		if (/*params*/ ctx[1] === undefined && !("params" in props)) {
    			console.warn("<Homepage> was created without expected prop 'params'");
    		}
    	}

    	get currentRoute() {
    		throw new Error("<Homepage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRoute(value) {
    		throw new Error("<Homepage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Homepage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Homepage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const ROLES = {
      PLAYER: "PLAYER",
      HOST: "HOST",
    };

    const game = writable({});
    const role = writable();
    const player = writable({ id: "", name: "" });

    let _csrf;

    var request = async (url, opts) => {
      if (!_csrf) {
        const { _csrf: csrf } = await (
          await fetch("http://localhost:1337/get-csrf")
        ).json();
        _csrf = csrf;
      }

      const fetchOpts = {
        ...opts,
        body: ["POST", "PUT", "DELETE"].includes(opts.method)
          ? JSON.stringify({ ...opts.body, _csrf })
          : undefined,
      };

      return await fetch(url, fetchOpts);
    };

    /* src/pages/setup/index.svelte generated by Svelte v3.21.0 */
    const file$2 = "src/pages/setup/index.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[13] = list;
    	child_ctx[14] = i;
    	return child_ctx;
    }

    // (101:10) {#if questionIndex > 0}
    function create_if_block$1(ctx) {
    	let hr;

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			attr_dev(hr, "class", "svelte-1h3hu58");
    			add_location(hr, file$2, 101, 12, 1794);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(101:10) {#if questionIndex > 0}",
    		ctx
    	});

    	return block;
    }

    // (100:8) {#each questions as question, questionIndex}
    function create_each_block_1(ctx) {
    	let t0;
    	let div3;
    	let h4;
    	let t1;
    	let t2_value = /*questionIndex*/ ctx[17] + 1 + "";
    	let t2;
    	let t3;
    	let t4;
    	let div0;
    	let label0;
    	let label0_for_value;
    	let t6;
    	let input0;
    	let input0_id_value;
    	let t7;
    	let div1;
    	let label1;
    	let label1_for_value;
    	let t9;
    	let input1;
    	let input1_id_value;
    	let t10;
    	let div2;
    	let button;
    	let t11_value = (/*isMobile*/ ctx[2] ? "Delete question" : "✘") + "";
    	let t11;
    	let dispose;
    	let if_block = /*questionIndex*/ ctx[17] > 0 && create_if_block$1(ctx);

    	function input0_input_handler() {
    		/*input0_input_handler*/ ctx[9].call(input0, /*questions*/ ctx[12], /*questionIndex*/ ctx[17]);
    	}

    	function input1_input_handler() {
    		/*input1_input_handler*/ ctx[10].call(input1, /*questions*/ ctx[12], /*questionIndex*/ ctx[17]);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div3 = element("div");
    			h4 = element("h4");
    			t1 = text("Q");
    			t2 = text(t2_value);
    			t3 = text(":");
    			t4 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Question:";
    			t6 = space();
    			input0 = element("input");
    			t7 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Answer:";
    			t9 = space();
    			input1 = element("input");
    			t10 = space();
    			div2 = element("div");
    			button = element("button");
    			t11 = text(t11_value);
    			attr_dev(h4, "class", "col sm-2 svelte-1h3hu58");
    			add_location(h4, file$2, 104, 12, 1857);
    			attr_dev(label0, "for", label0_for_value = `question-input-${/*questionIndex*/ ctx[17] + 1}`);
    			add_location(label0, file$2, 106, 14, 1965);
    			attr_dev(input0, "class", "input-block");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "id", input0_id_value = `question-input-${/*questionIndex*/ ctx[17] + 1}`);
    			add_location(input0, file$2, 109, 14, 2080);
    			attr_dev(div0, "class", "form-group col sm-4");
    			add_location(div0, file$2, 105, 12, 1917);
    			attr_dev(label1, "for", label1_for_value = `answer-input-${/*questionIndex*/ ctx[17] + 1}`);
    			add_location(label1, file$2, 116, 14, 2355);
    			attr_dev(input1, "class", "input-block");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "id", input1_id_value = `answer-input-${/*questionIndex*/ ctx[17] + 1}`);
    			add_location(input1, file$2, 117, 14, 2434);
    			attr_dev(div1, "class", "form-group col sm-4");
    			add_location(div1, file$2, 115, 12, 2307);
    			attr_dev(button, "class", "background-danger delete-question-button svelte-1h3hu58");
    			add_location(button, file$2, 124, 14, 2727);
    			attr_dev(div2, "class", "col sm-2 delete-question-button-container svelte-1h3hu58");
    			add_location(div2, file$2, 123, 12, 2657);
    			attr_dev(div3, "class", "row");
    			add_location(div3, file$2, 103, 10, 1827);
    		},
    		m: function mount(target, anchor, remount) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h4);
    			append_dev(h4, t1);
    			append_dev(h4, t2);
    			append_dev(h4, t3);
    			append_dev(div3, t4);
    			append_dev(div3, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t6);
    			append_dev(div0, input0);
    			set_input_value(input0, /*questions*/ ctx[12][/*questionIndex*/ ctx[17]].question);
    			append_dev(div3, t7);
    			append_dev(div3, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t9);
    			append_dev(div1, input1);
    			set_input_value(input1, /*questions*/ ctx[12][/*questionIndex*/ ctx[17]].answer);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			append_dev(button, t11);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", input0_input_handler),
    				listen_dev(input1, "input", input1_input_handler)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*rounds*/ 1 && input0.value !== /*questions*/ ctx[12][/*questionIndex*/ ctx[17]].question) {
    				set_input_value(input0, /*questions*/ ctx[12][/*questionIndex*/ ctx[17]].question);
    			}

    			if (dirty & /*rounds*/ 1 && input1.value !== /*questions*/ ctx[12][/*questionIndex*/ ctx[17]].answer) {
    				set_input_value(input1, /*questions*/ ctx[12][/*questionIndex*/ ctx[17]].answer);
    			}

    			if (dirty & /*isMobile*/ 4 && t11_value !== (t11_value = (/*isMobile*/ ctx[2] ? "Delete question" : "✘") + "")) set_data_dev(t11, t11_value);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div3);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(100:8) {#each questions as question, questionIndex}",
    		ctx
    	});

    	return block;
    }

    // (96:2) {#each rounds as questions, roundIndex}
    function create_each_block(ctx) {
    	let div2;
    	let div1;
    	let h3;
    	let t0;
    	let t1_value = /*roundIndex*/ ctx[14] + 1 + "";
    	let t1;
    	let t2;
    	let t3;
    	let hr;
    	let t4;
    	let div0;
    	let button;
    	let dispose;
    	let each_value_1 = /*questions*/ ctx[12];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[11](/*roundIndex*/ ctx[14], ...args);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			t0 = text("Round ");
    			t1 = text(t1_value);
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			hr = element("hr");
    			t4 = space();
    			div0 = element("div");
    			button = element("button");
    			button.textContent = "Add question";
    			attr_dev(h3, "class", "");
    			add_location(h3, file$2, 98, 8, 1654);
    			attr_dev(hr, "class", "add-question-separator svelte-1h3hu58");
    			add_location(hr, file$2, 130, 8, 2922);
    			attr_dev(button, "class", "add-question background-primary svelte-1h3hu58");
    			add_location(button, file$2, 132, 10, 3022);
    			attr_dev(div0, "class", "add-question-button-container svelte-1h3hu58");
    			add_location(div0, file$2, 131, 8, 2968);
    			attr_dev(div1, "class", "card-body");
    			add_location(div1, file$2, 97, 6, 1622);
    			attr_dev(div2, "class", "card svelte-1h3hu58");
    			add_location(div2, file$2, 96, 4, 1597);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t0);
    			append_dev(h3, t1);
    			append_dev(div1, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t3);
    			append_dev(div1, hr);
    			append_dev(div1, t4);
    			append_dev(div1, div0);
    			append_dev(div0, button);
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", click_handler, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*isMobile, rounds*/ 5) {
    				each_value_1 = /*questions*/ ctx[12];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t3);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(96:2) {#each rounds as questions, roundIndex}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div1;
    	let h2;
    	let t1;
    	let t2;
    	let div0;
    	let button0;
    	let t4;
    	let button1;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[8]);
    	let each_value = /*rounds*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Enter questions and answers";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Add round";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Create game";
    			add_location(h2, file$2, 94, 2, 1514);
    			attr_dev(button0, "class", "background-secondary svelte-1h3hu58");
    			add_location(button0, file$2, 142, 4, 3265);
    			attr_dev(button1, "class", "background-success svelte-1h3hu58");
    			add_location(button1, file$2, 143, 4, 3345);
    			attr_dev(div0, "class", "bottom-buttons svelte-1h3hu58");
    			add_location(div0, file$2, 141, 2, 3232);
    			add_location(div1, file$2, 93, 0, 1506);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(div1, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t4);
    			append_dev(div0, button1);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(window, "resize", /*onwindowresize*/ ctx[8]),
    				listen_dev(button0, "click", /*addRound*/ ctx[4], false, false, false),
    				listen_dev(button1, "click", /*createGame*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*addQuestion, rounds, isMobile*/ 13) {
    				each_value = /*rounds*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { currentRoute } = $$props;
    	let { params } = $$props;
    	let rounds = [[{}]];
    	let width = 0;

    	const addQuestion = roundIndex => {
    		$$invalidate(0, rounds[roundIndex] = [...rounds[roundIndex], {}], rounds);
    	};

    	const addRound = () => {
    		$$invalidate(0, rounds = [...rounds, [{}]]);
    	};

    	const createGame = async () => {
    		const res = await request("http://localhost:1337/game/create", { method: "POST", body: { rounds } });
    		const { gameId } = await res.json();
    		role.set(ROLES.HOST);
    		src_3(`/game/${gameId}`);
    	};

    	const writable_props = ["currentRoute", "params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Setup> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Setup", $$slots, []);

    	function onwindowresize() {
    		$$invalidate(1, width = window.innerWidth);
    	}

    	function input0_input_handler(questions, questionIndex) {
    		questions[questionIndex].question = this.value;
    		$$invalidate(0, rounds);
    	}

    	function input1_input_handler(questions, questionIndex) {
    		questions[questionIndex].answer = this.value;
    		$$invalidate(0, rounds);
    	}

    	const click_handler = roundIndex => addQuestion(roundIndex);

    	$$self.$set = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(6, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(7, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		navigateTo: src_3,
    		role,
    		ROLES,
    		request,
    		currentRoute,
    		params,
    		rounds,
    		width,
    		addQuestion,
    		addRound,
    		createGame,
    		isMobile
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(6, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(7, params = $$props.params);
    		if ("rounds" in $$props) $$invalidate(0, rounds = $$props.rounds);
    		if ("width" in $$props) $$invalidate(1, width = $$props.width);
    		if ("isMobile" in $$props) $$invalidate(2, isMobile = $$props.isMobile);
    	};

    	let isMobile;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*width*/ 2) {
    			 $$invalidate(2, isMobile = width < 768);
    		}
    	};

    	return [
    		rounds,
    		width,
    		isMobile,
    		addQuestion,
    		addRound,
    		createGame,
    		currentRoute,
    		params,
    		onwindowresize,
    		input0_input_handler,
    		input1_input_handler,
    		click_handler
    	];
    }

    class Setup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { currentRoute: 6, params: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Setup",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentRoute*/ ctx[6] === undefined && !("currentRoute" in props)) {
    			console.warn("<Setup> was created without expected prop 'currentRoute'");
    		}

    		if (/*params*/ ctx[7] === undefined && !("params" in props)) {
    			console.warn("<Setup> was created without expected prop 'params'");
    		}
    	}

    	get currentRoute() {
    		throw new Error("<Setup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRoute(value) {
    		throw new Error("<Setup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Setup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Setup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // Unique ID creation requires a high quality random # generator. In the browser we therefore
    // require the crypto API and do not support built-in fallback to lower quality random number
    // generators (like Math.random()).
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    var getRandomValues = typeof crypto != 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto != 'undefined' && typeof msCrypto.getRandomValues == 'function' && msCrypto.getRandomValues.bind(msCrypto);
    var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

    function rng() {
      if (!getRandomValues) {
        throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
      }

      return getRandomValues(rnds8);
    }

    /**
     * Convert array of 16 byte values to UUID string format of the form:
     * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
     */
    var byteToHex = [];

    for (var i = 0; i < 256; ++i) {
      byteToHex[i] = (i + 0x100).toString(16).substr(1);
    }

    function bytesToUuid(buf, offset) {
      var i = offset || 0;
      var bth = byteToHex; // join used to fix memory issue caused by concatenation: https://bugs.chromium.org/p/v8/issues/detail?id=3175#c4

      return [bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], '-', bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]], bth[buf[i++]]].join('');
    }

    function v4(options, buf, offset) {
      var i = buf && offset || 0;

      if (typeof options == 'string') {
        buf = options === 'binary' ? new Array(16) : null;
        options = null;
      }

      options = options || {};
      var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

      rnds[6] = rnds[6] & 0x0f | 0x40;
      rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

      if (buf) {
        for (var ii = 0; ii < 16; ++ii) {
          buf[i + ii] = rnds[ii];
        }
      }

      return buf || bytesToUuid(rnds);
    }

    /* src/pages/join/index.svelte generated by Svelte v3.21.0 */
    const file$3 = "src/pages/join/index.svelte";

    function create_fragment$5(ctx) {
    	let div4;
    	let h2;
    	let t1;
    	let div2;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let div3;
    	let button;
    	let t8;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Enter game ID:";
    			t1 = space();
    			div2 = element("div");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Game ID:";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Name:";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			div3 = element("div");
    			button = element("button");
    			t8 = text("Join game");
    			attr_dev(h2, "class", "svelte-2t2rph");
    			add_location(h2, file$3, 81, 2, 1532);
    			attr_dev(label0, "for", "gameId");
    			add_location(label0, file$3, 85, 6, 1615);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "placeholder", "Enter game ID...");
    			attr_dev(input0, "id", "gameId");
    			add_location(input0, file$3, 86, 6, 1658);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$3, 84, 4, 1584);
    			attr_dev(label1, "for", "name");
    			add_location(label1, file$3, 94, 6, 1863);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "placeholder", "Enter name...");
    			attr_dev(input1, "id", "name");
    			add_location(input1, file$3, 95, 6, 1901);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file$3, 93, 4, 1832);
    			attr_dev(div2, "class", "inputs svelte-2t2rph");
    			add_location(div2, file$3, 83, 2, 1559);
    			button.disabled = /*isJoinDisabled*/ ctx[2];
    			attr_dev(button, "class", "svelte-2t2rph");
    			toggle_class(button, "background-success", !/*isJoinDisabled*/ ctx[2]);
    			add_location(button, file$3, 104, 4, 2067);
    			attr_dev(div3, "class", "bottom-section svelte-2t2rph");
    			add_location(div3, file$3, 103, 2, 2034);
    			attr_dev(div4, "class", "join-page svelte-2t2rph");
    			add_location(div4, file$3, 80, 0, 1506);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h2);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*gameId*/ ctx[0]);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t6);
    			append_dev(div1, input1);
    			set_input_value(input1, /*name*/ ctx[1]);
    			append_dev(div4, t7);
    			append_dev(div4, div3);
    			append_dev(div3, button);
    			append_dev(button, t8);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    				listen_dev(
    					input0,
    					"input",
    					function () {
    						if (is_function(/*lowercaseInput*/ ctx[4](/*gameId*/ ctx[0]))) /*lowercaseInput*/ ctx[4](/*gameId*/ ctx[0]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    				listen_dev(button, "click", /*goToGame*/ ctx[3], false, false, false)
    			];
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*gameId*/ 1 && input0.value !== /*gameId*/ ctx[0]) {
    				set_input_value(input0, /*gameId*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 2 && input1.value !== /*name*/ ctx[1]) {
    				set_input_value(input1, /*name*/ ctx[1]);
    			}

    			if (dirty & /*isJoinDisabled*/ 4) {
    				prop_dev(button, "disabled", /*isJoinDisabled*/ ctx[2]);
    			}

    			if (dirty & /*isJoinDisabled*/ 4) {
    				toggle_class(button, "background-success", !/*isJoinDisabled*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { currentRoute } = $$props;
    	let { params } = $$props;
    	let gameId = "";
    	let name = "";

    	const goToGame = async () => {
    		role.set(ROLES.PLAYER);
    		const res = await request("http://localhost:1337/player/create", { method: "POST", body: { name, gameId } });
    		const { id } = await res.json();
    		player.set({ id, name });
    		src_3(`/game/${gameId}`);
    	};

    	// TODO: Recover into disconnected game
    	// TODO: Better player identity (e.g. FB/Google)
    	const lowercaseInput = input => {
    		$$invalidate(0, gameId = input.toLowerCase());
    	};

    	const writable_props = ["currentRoute", "params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Join> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Join", $$slots, []);

    	function input0_input_handler() {
    		gameId = this.value;
    		$$invalidate(0, gameId);
    	}

    	function input1_input_handler() {
    		name = this.value;
    		$$invalidate(1, name);
    	}

    	$$self.$set = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(5, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		navigateTo: src_3,
    		uuid4: v4,
    		role,
    		player,
    		ROLES,
    		request,
    		currentRoute,
    		params,
    		gameId,
    		name,
    		goToGame,
    		lowercaseInput,
    		isJoinDisabled
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(5, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(6, params = $$props.params);
    		if ("gameId" in $$props) $$invalidate(0, gameId = $$props.gameId);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    		if ("isJoinDisabled" in $$props) $$invalidate(2, isJoinDisabled = $$props.isJoinDisabled);
    	};

    	let isJoinDisabled;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*gameId, name*/ 3) {
    			 $$invalidate(2, isJoinDisabled = !gameId.match(/\w-\w/) || name === "");
    		}
    	};

    	return [
    		gameId,
    		name,
    		isJoinDisabled,
    		goToGame,
    		lowercaseInput,
    		currentRoute,
    		params,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Join extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { currentRoute: 5, params: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Join",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentRoute*/ ctx[5] === undefined && !("currentRoute" in props)) {
    			console.warn("<Join> was created without expected prop 'currentRoute'");
    		}

    		if (/*params*/ ctx[6] === undefined && !("params" in props)) {
    			console.warn("<Join> was created without expected prop 'params'");
    		}
    	}

    	get currentRoute() {
    		throw new Error("<Join>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRoute(value) {
    		throw new Error("<Join>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Join>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Join>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/game/components/player-list.svelte generated by Svelte v3.21.0 */

    const file$4 = "src/pages/game/components/player-list.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (13:2) {#each players as player}
    function create_each_block$1(ctx) {
    	let ul;
    	let li;
    	let t0_value = /*player*/ ctx[1].name + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = space();
    			add_location(li, file$4, 14, 6, 169);
    			add_location(ul, file$4, 13, 4, 158);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li);
    			append_dev(li, t0);
    			append_dev(ul, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*players*/ 1 && t0_value !== (t0_value = /*player*/ ctx[1].name + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(13:2) {#each players as player}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let each_value = /*players*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = "Players:";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h3, "class", "svelte-1gicyqp");
    			add_location(h3, file$4, 11, 2, 108);
    			add_location(div, file$4, 10, 0, 100);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*players*/ 1) {
    				each_value = /*players*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { players = [] } = $$props;
    	const writable_props = ["players"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Player_list> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Player_list", $$slots, []);

    	$$self.$set = $$props => {
    		if ("players" in $$props) $$invalidate(0, players = $$props.players);
    	};

    	$$self.$capture_state = () => ({ players });

    	$$self.$inject_state = $$props => {
    		if ("players" in $$props) $$invalidate(0, players = $$props.players);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [players];
    }

    class Player_list extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { players: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Player_list",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get players() {
    		throw new Error("<Player_list>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set players(value) {
    		throw new Error("<Player_list>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/game/components/player-scores.svelte generated by Svelte v3.21.0 */

    const file$5 = "src/pages/game/components/player-scores.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (11:2) {#each players as player}
    function create_each_block$2(ctx) {
    	let p;
    	let t0_value = /*player*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*player*/ ctx[1].answers.filter(func).length + "";
    	let t2;
    	let t3;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(t2_value);
    			t3 = space();
    			add_location(p, file$5, 11, 4, 125);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*players*/ 1 && t0_value !== (t0_value = /*player*/ ctx[1].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*players*/ 1 && t2_value !== (t2_value = /*player*/ ctx[1].answers.filter(func).length + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(11:2) {#each players as player}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div1;
    	let div0;
    	let t1;
    	let each_value = /*players*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "SCORES:";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(div0, file$5, 9, 2, 74);
    			add_location(div1, file$5, 8, 0, 66);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*players*/ 1) {
    				each_value = /*players*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = answer => answer.result === "CORRECT";

    function instance$7($$self, $$props, $$invalidate) {
    	let { players = [] } = $$props;
    	const writable_props = ["players"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Player_scores> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Player_scores", $$slots, []);

    	$$self.$set = $$props => {
    		if ("players" in $$props) $$invalidate(0, players = $$props.players);
    	};

    	$$self.$capture_state = () => ({ players });

    	$$self.$inject_state = $$props => {
    		if ("players" in $$props) $$invalidate(0, players = $$props.players);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [players];
    }

    class Player_scores extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { players: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Player_scores",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get players() {
    		throw new Error("<Player_scores>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set players(value) {
    		throw new Error("<Player_scores>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/game/components/player-answers.svelte generated by Svelte v3.21.0 */

    const file$6 = "src/pages/game/components/player-answers.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (23:2) {#each answers as answer}
    function create_each_block$3(ctx) {
    	let div2;
    	let div0;
    	let t0_value = /*answer*/ ctx[4].answer + "";
    	let t0;
    	let t1;
    	let div1;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let dispose;

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[2](/*answer*/ ctx[4], ...args);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[3](/*answer*/ ctx[4], ...args);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "✔";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "✘";
    			t5 = space();
    			attr_dev(div0, "class", "col col-6");
    			add_location(div0, file$6, 24, 6, 340);
    			attr_dev(button0, "class", "svelte-xqdrpl");
    			toggle_class(button0, "background-success", /*answer*/ ctx[4].result === "CORRECT");
    			add_location(button0, file$6, 27, 8, 469);
    			attr_dev(button1, "class", "svelte-xqdrpl");
    			toggle_class(button1, "background-danger", /*answer*/ ctx[4].result === "INCORRECT");
    			add_location(button1, file$6, 32, 8, 643);
    			attr_dev(div1, "class", "col col-6 row svelte-xqdrpl");
    			add_location(div1, file$6, 26, 6, 433);
    			attr_dev(div2, "class", "row svelte-xqdrpl");
    			add_location(div2, file$6, 23, 4, 316);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, t0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t3);
    			append_dev(div1, button1);
    			append_dev(div2, t5);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", click_handler, false, false, false),
    				listen_dev(button1, "click", click_handler_1, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*answers*/ 1 && t0_value !== (t0_value = /*answer*/ ctx[4].answer + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*answers*/ 1) {
    				toggle_class(button0, "background-success", /*answer*/ ctx[4].result === "CORRECT");
    			}

    			if (dirty & /*answers*/ 1) {
    				toggle_class(button1, "background-danger", /*answer*/ ctx[4].result === "INCORRECT");
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(23:2) {#each answers as answer}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let div;
    	let each_value = /*answers*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(div, file$6, 21, 0, 278);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*answers, onMarkAnswer*/ 3) {
    				each_value = /*answers*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { answers = [] } = $$props;
    	let { onMarkAnswer } = $$props;
    	const writable_props = ["answers", "onMarkAnswer"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Player_answers> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Player_answers", $$slots, []);
    	const click_handler = answer => onMarkAnswer(answer.id, "CORRECT");
    	const click_handler_1 = answer => onMarkAnswer(answer.id, "INCORRECT");

    	$$self.$set = $$props => {
    		if ("answers" in $$props) $$invalidate(0, answers = $$props.answers);
    		if ("onMarkAnswer" in $$props) $$invalidate(1, onMarkAnswer = $$props.onMarkAnswer);
    	};

    	$$self.$capture_state = () => ({ answers, onMarkAnswer });

    	$$self.$inject_state = $$props => {
    		if ("answers" in $$props) $$invalidate(0, answers = $$props.answers);
    		if ("onMarkAnswer" in $$props) $$invalidate(1, onMarkAnswer = $$props.onMarkAnswer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [answers, onMarkAnswer, click_handler, click_handler_1];
    }

    class Player_answers extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { answers: 0, onMarkAnswer: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Player_answers",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onMarkAnswer*/ ctx[1] === undefined && !("onMarkAnswer" in props)) {
    			console.warn("<Player_answers> was created without expected prop 'onMarkAnswer'");
    		}
    	}

    	get answers() {
    		throw new Error("<Player_answers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set answers(value) {
    		throw new Error("<Player_answers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onMarkAnswer() {
    		throw new Error("<Player_answers>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onMarkAnswer(value) {
    		throw new Error("<Player_answers>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/game/components/answer-input.svelte generated by Svelte v3.21.0 */

    const file$7 = "src/pages/game/components/answer-input.svelte";

    function create_fragment$9(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let label;
    	let t0;
    	let label_for_value;
    	let t1;
    	let input;
    	let input_id_value;
    	let input_disabled_value;
    	let t2;
    	let button;

    	let t3_value = (!/*enabled*/ ctx[0]
    	? "Waiting for next question..."
    	: "Submit") + "";

    	let t3;
    	let button_disabled_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			label = element("label");
    			t0 = text("Answer:");
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			button = element("button");
    			t3 = text(t3_value);
    			attr_dev(label, "for", label_for_value = `answer-input-${/*gameStateAnswer*/ ctx[1]}`);
    			add_location(label, file$7, 26, 8, 358);
    			attr_dev(input, "id", input_id_value = `answer-input-${/*gameStateAnswer*/ ctx[1]}`);
    			attr_dev(input, "class", "input-block");
    			attr_dev(input, "type", "text");
    			input.disabled = input_disabled_value = !/*enabled*/ ctx[0];
    			add_location(input, file$7, 27, 8, 429);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file$7, 25, 6, 325);
    			attr_dev(button, "class", "submit-button svelte-1fma4j5");
    			button.disabled = button_disabled_value = !/*enabled*/ ctx[0];
    			toggle_class(button, "background-success", /*enabled*/ ctx[0]);
    			add_location(button, file$7, 34, 6, 619);
    			attr_dev(div1, "class", "col col-fill");
    			add_location(div1, file$7, 24, 4, 292);
    			attr_dev(div2, "class", "row svelte-1fma4j5");
    			add_location(div2, file$7, 23, 2, 270);
    			attr_dev(div3, "class", "answer-input svelte-1fma4j5");
    			add_location(div3, file$7, 22, 0, 241);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, label);
    			append_dev(label, t0);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			set_input_value(input, /*answer*/ ctx[3]);
    			append_dev(div1, t2);
    			append_dev(div1, button);
    			append_dev(button, t3);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[4]),
    				listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*gameStateAnswer*/ 2 && label_for_value !== (label_for_value = `answer-input-${/*gameStateAnswer*/ ctx[1]}`)) {
    				attr_dev(label, "for", label_for_value);
    			}

    			if (dirty & /*gameStateAnswer*/ 2 && input_id_value !== (input_id_value = `answer-input-${/*gameStateAnswer*/ ctx[1]}`)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty & /*enabled*/ 1 && input_disabled_value !== (input_disabled_value = !/*enabled*/ ctx[0])) {
    				prop_dev(input, "disabled", input_disabled_value);
    			}

    			if (dirty & /*answer*/ 8 && input.value !== /*answer*/ ctx[3]) {
    				set_input_value(input, /*answer*/ ctx[3]);
    			}

    			if (dirty & /*enabled*/ 1 && t3_value !== (t3_value = (!/*enabled*/ ctx[0]
    			? "Waiting for next question..."
    			: "Submit") + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*enabled*/ 1 && button_disabled_value !== (button_disabled_value = !/*enabled*/ ctx[0])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			if (dirty & /*enabled*/ 1) {
    				toggle_class(button, "background-success", /*enabled*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { enabled } = $$props;
    	let { gameStateAnswer = 0 } = $$props;
    	let { onSubmit } = $$props;
    	let answer;
    	const writable_props = ["enabled", "gameStateAnswer", "onSubmit"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Answer_input> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Answer_input", $$slots, []);

    	function input_input_handler() {
    		answer = this.value;
    		$$invalidate(3, answer);
    	}

    	const click_handler = () => onSubmit(answer);

    	$$self.$set = $$props => {
    		if ("enabled" in $$props) $$invalidate(0, enabled = $$props.enabled);
    		if ("gameStateAnswer" in $$props) $$invalidate(1, gameStateAnswer = $$props.gameStateAnswer);
    		if ("onSubmit" in $$props) $$invalidate(2, onSubmit = $$props.onSubmit);
    	};

    	$$self.$capture_state = () => ({
    		enabled,
    		gameStateAnswer,
    		onSubmit,
    		answer
    	});

    	$$self.$inject_state = $$props => {
    		if ("enabled" in $$props) $$invalidate(0, enabled = $$props.enabled);
    		if ("gameStateAnswer" in $$props) $$invalidate(1, gameStateAnswer = $$props.gameStateAnswer);
    		if ("onSubmit" in $$props) $$invalidate(2, onSubmit = $$props.onSubmit);
    		if ("answer" in $$props) $$invalidate(3, answer = $$props.answer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [enabled, gameStateAnswer, onSubmit, answer, input_input_handler, click_handler];
    }

    class Answer_input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			enabled: 0,
    			gameStateAnswer: 1,
    			onSubmit: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Answer_input",
    			options,
    			id: create_fragment$9.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*enabled*/ ctx[0] === undefined && !("enabled" in props)) {
    			console.warn("<Answer_input> was created without expected prop 'enabled'");
    		}

    		if (/*onSubmit*/ ctx[2] === undefined && !("onSubmit" in props)) {
    			console.warn("<Answer_input> was created without expected prop 'onSubmit'");
    		}
    	}

    	get enabled() {
    		throw new Error("<Answer_input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set enabled(value) {
    		throw new Error("<Answer_input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get gameStateAnswer() {
    		throw new Error("<Answer_input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set gameStateAnswer(value) {
    		throw new Error("<Answer_input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onSubmit() {
    		throw new Error("<Answer_input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onSubmit(value) {
    		throw new Error("<Answer_input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/loading-dots/index.svelte generated by Svelte v3.21.0 */

    const file$8 = "src/components/loading-dots/index.svelte";

    function create_fragment$a(ctx) {
    	let div4;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			attr_dev(div0, "class", "svelte-3mluf4");
    			add_location(div0, file$8, 63, 2, 1038);
    			attr_dev(div1, "class", "svelte-3mluf4");
    			add_location(div1, file$8, 64, 2, 1048);
    			attr_dev(div2, "class", "svelte-3mluf4");
    			add_location(div2, file$8, 65, 2, 1058);
    			attr_dev(div3, "class", "svelte-3mluf4");
    			add_location(div3, file$8, 66, 2, 1068);
    			attr_dev(div4, "class", "dots svelte-3mluf4");
    			add_location(div4, file$8, 62, 0, 1017);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div1);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Loading_dots> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Loading_dots", $$slots, []);
    	return [];
    }

    class Loading_dots extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loading_dots",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    let _csrf$1;

    var socket = {
      post: async (url, body) => {
        if (!_csrf$1) {
          const { _csrf: csrf } = await (
            await fetch("http://localhost:1337/get-csrf")
          ).json();
          _csrf$1 = csrf;
        }

        return await io.socket.post(url, { ...body, _csrf: _csrf$1 });
      },
      get: async (url) => await io.socket.get(url),
      on: (url, callback) => io.socket.on(url, callback),
    };

    /* src/pages/game/index.svelte generated by Svelte v3.21.0 */

    const { console: console_1 } = globals;
    const file$9 = "src/pages/game/index.svelte";

    // (198:4) {:else}
    function create_else_block_1(ctx) {
    	let div;
    	let t;
    	let if_block_anchor;
    	let current;

    	const playerlist = new Player_list({
    			props: { players: /*players*/ ctx[6] },
    			$$inline: true
    		});

    	let if_block = /*$role*/ ctx[2] === ROLES.PLAYER && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(playerlist.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div, "class", "player-list svelte-1b5fwep");
    			add_location(div, file$9, 198, 6, 5149);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(playerlist, div, null);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const playerlist_changes = {};
    			if (dirty & /*players*/ 64) playerlist_changes.players = /*players*/ ctx[6];
    			playerlist.$set(playerlist_changes);

    			if (/*$role*/ ctx[2] === ROLES.PLAYER) {
    				if (if_block) {
    					if (dirty & /*$role*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(playerlist.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(playerlist.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(playerlist);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(198:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (173:4) {#if isGameStarted}
    function create_if_block_1$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_2$1, create_if_block_5];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (!/*isEndOfRound*/ ctx[5]) return 0;
    		if (/*$game*/ ctx[4] && /*$game*/ ctx[4].state && (/*$game*/ ctx[4].state.endOfRound || /*$game*/ ctx[4].state.gameOver) && /*players*/ ctx[6] && /*players*/ ctx[6].length) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(173:4) {#if isGameStarted}",
    		ctx
    	});

    	return block;
    }

    // (202:6) {#if $role === ROLES.PLAYER}
    function create_if_block_6(ctx) {
    	let div1;
    	let div0;
    	let t1;
    	let current;
    	const loadingdots = new Loading_dots({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			div0.textContent = "Waiting for host to start game";
    			t1 = space();
    			create_component(loadingdots.$$.fragment);
    			add_location(div0, file$9, 203, 10, 5303);
    			attr_dev(div1, "class", "bottom-section svelte-1b5fwep");
    			add_location(div1, file$9, 202, 8, 5264);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t1);
    			mount_component(loadingdots, div1, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loadingdots.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loadingdots.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(loadingdots);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(202:6) {#if $role === ROLES.PLAYER}",
    		ctx
    	});

    	return block;
    }

    // (193:118) 
    function create_if_block_5(ctx) {
    	let div;
    	let current;

    	const playerscores = new Player_scores({
    			props: { players: /*players*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(playerscores.$$.fragment);
    			attr_dev(div, "class", "player-scores svelte-1b5fwep");
    			add_location(div, file$9, 193, 8, 5039);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(playerscores, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const playerscores_changes = {};
    			if (dirty & /*players*/ 64) playerscores_changes.players = /*players*/ ctx[6];
    			playerscores.$set(playerscores_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(playerscores.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(playerscores.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(playerscores);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(193:118) ",
    		ctx
    	});

    	return block;
    }

    // (174:6) {#if !isEndOfRound}
    function create_if_block_2$1(ctx) {
    	let h4;
    	let t1;
    	let div;
    	let t2_value = /*currentQuestion*/ ctx[7].question + "";
    	let t2;
    	let t3;
    	let t4;
    	let current_block_type_index;
    	let if_block1;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*$role*/ ctx[2] === ROLES.HOST && create_if_block_4(ctx);
    	const if_block_creators = [create_if_block_3, create_else_block];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*$role*/ ctx[2] === ROLES.PLAYER) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "Question:";
    			t1 = space();
    			div = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block0) if_block0.c();
    			t4 = space();
    			if_block1.c();
    			if_block1_anchor = empty();
    			add_location(h4, file$9, 174, 8, 4252);
    			attr_dev(div, "class", "question-answer-text svelte-1b5fwep");
    			add_location(div, file$9, 175, 8, 4279);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t2);
    			insert_dev(target, t3, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*currentQuestion*/ 128) && t2_value !== (t2_value = /*currentQuestion*/ ctx[7].question + "")) set_data_dev(t2, t2_value);

    			if (/*$role*/ ctx[2] === ROLES.HOST) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(t4.parentNode, t4);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t4);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(174:6) {#if !isEndOfRound}",
    		ctx
    	});

    	return block;
    }

    // (177:8) {#if $role === ROLES.HOST}
    function create_if_block_4(ctx) {
    	let h4;
    	let t1;
    	let div;
    	let t2_value = /*currentQuestion*/ ctx[7].answer + "";
    	let t2;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			h4.textContent = "Answer:";
    			t1 = space();
    			div = element("div");
    			t2 = text(t2_value);
    			add_location(h4, file$9, 177, 10, 4391);
    			attr_dev(div, "class", "question-answer-text svelte-1b5fwep");
    			add_location(div, file$9, 178, 10, 4418);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*currentQuestion*/ 128 && t2_value !== (t2_value = /*currentQuestion*/ ctx[7].answer + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(177:8) {#if $role === ROLES.HOST}",
    		ctx
    	});

    	return block;
    }

    // (188:8) {:else}
    function create_else_block(ctx) {
    	let div;
    	let current;

    	const playeranswers = new Player_answers({
    			props: {
    				answers: /*playerAnswers*/ ctx[8],
    				onMarkAnswer: /*markAnswer*/ ctx[12]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(playeranswers.$$.fragment);
    			attr_dev(div, "class", "player-answers svelte-1b5fwep");
    			add_location(div, file$9, 188, 10, 4772);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(playeranswers, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const playeranswers_changes = {};
    			if (dirty & /*playerAnswers*/ 256) playeranswers_changes.answers = /*playerAnswers*/ ctx[8];
    			playeranswers.$set(playeranswers_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(playeranswers.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(playeranswers.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(playeranswers);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(188:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (181:8) {#if $role === ROLES.PLAYER}
    function create_if_block_3(ctx) {
    	let div;
    	let current;

    	const answerinput = new Answer_input({
    			props: {
    				enabled: !/*answerSubmitted*/ ctx[1],
    				gameStateAnswer: /*$game*/ ctx[4].state.answer,
    				onSubmit: /*submitAnswer*/ ctx[11]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(answerinput.$$.fragment);
    			attr_dev(div, "class", "answer-input svelte-1b5fwep");
    			add_location(div, file$9, 181, 10, 4544);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(answerinput, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const answerinput_changes = {};
    			if (dirty & /*answerSubmitted*/ 2) answerinput_changes.enabled = !/*answerSubmitted*/ ctx[1];
    			if (dirty & /*$game*/ 16) answerinput_changes.gameStateAnswer = /*$game*/ ctx[4].state.answer;
    			answerinput.$set(answerinput_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(answerinput.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(answerinput.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(answerinput);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(181:8) {#if $role === ROLES.PLAYER}",
    		ctx
    	});

    	return block;
    }

    // (210:2) {#if $role === ROLES.HOST && !($game && $game.state && $game.state.gameOver)}
    function create_if_block$2(ctx) {
    	let div;
    	let button;

    	let t_value = (/*$game*/ ctx[4] && /*$game*/ ctx[4].state && /*$game*/ ctx[4].state.started
    	? "Next Question"
    	: "Start Game") + "";

    	let t;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "start-next-button svelte-1b5fwep");
    			button.disabled = /*nextDisabled*/ ctx[9];
    			toggle_class(button, "background-success", !/*nextDisabled*/ ctx[9]);
    			add_location(button, file$9, 211, 6, 5536);
    			attr_dev(div, "class", "bottom-section svelte-1b5fwep");
    			add_location(div, file$9, 210, 4, 5501);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);
    			if (remount) dispose();
    			dispose = listen_dev(button, "click", /*nextQuestion*/ ctx[10], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$game*/ 16 && t_value !== (t_value = (/*$game*/ ctx[4] && /*$game*/ ctx[4].state && /*$game*/ ctx[4].state.started
    			? "Next Question"
    			: "Start Game") + "")) set_data_dev(t, t_value);

    			if (dirty & /*nextDisabled*/ 512) {
    				prop_dev(button, "disabled", /*nextDisabled*/ ctx[9]);
    			}

    			if (dirty & /*nextDisabled*/ 512) {
    				toggle_class(button, "background-success", !/*nextDisabled*/ ctx[9]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(210:2) {#if $role === ROLES.HOST && !($game && $game.state && $game.state.gameOver)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div1;
    	let h2;
    	let t0;
    	let t1;
    	let div0;
    	let current_block_type_index;
    	let if_block0;
    	let t2;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*isGameStarted*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*$role*/ ctx[2] === ROLES.HOST && !(/*$game*/ ctx[4] && /*$game*/ ctx[4].state && /*$game*/ ctx[4].state.gameOver) && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h2 = element("h2");
    			t0 = text(/*titleText*/ ctx[0]);
    			t1 = space();
    			div0 = element("div");
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(h2, "class", "title svelte-1b5fwep");
    			add_location(h2, file$9, 169, 2, 4046);
    			attr_dev(div0, "class", "main-section svelte-1b5fwep");
    			add_location(div0, file$9, 170, 2, 4083);
    			attr_dev(div1, "class", "game-page svelte-1b5fwep");
    			add_location(div1, file$9, 168, 0, 4020);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h2);
    			append_dev(h2, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			append_dev(div1, t2);
    			if (if_block1) if_block1.m(div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*titleText*/ 1) set_data_dev(t0, /*titleText*/ ctx[0]);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(div0, null);
    			}

    			if (/*$role*/ ctx[2] === ROLES.HOST && !(/*$game*/ ctx[4] && /*$game*/ ctx[4].state && /*$game*/ ctx[4].state.gameOver)) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $role;
    	let $game;
    	let $player;
    	validate_store(role, "role");
    	component_subscribe($$self, role, $$value => $$invalidate(2, $role = $$value));
    	validate_store(game, "game");
    	component_subscribe($$self, game, $$value => $$invalidate(4, $game = $$value));
    	validate_store(player, "player");
    	component_subscribe($$self, player, $$value => $$invalidate(21, $player = $$value));
    	let { currentRoute } = $$props;
    	let { params } = $$props;
    	let answer = "";

    	let titleText = $role === ROLES.HOST
    	? "Waiting for players to join..."
    	: "Waiting for game to start...";

    	// TODO: Base this off a response from the websocket
    	let answerSubmitted = false;

    	let currentRoundIndex = 0;
    	let currentQuestionIndex = 0;
    	const { namedParams: { id: gameId } } = currentRoute;

    	onMount(async () => {
    		socket.on("gameUpdate", data => {
    			game.set(data.game);
    			console.log($game);

    			// TODO: Move into template, just use $game.state to compute title.
    			if ($game.state.started) {
    				console.log($game);
    				$$invalidate(0, titleText = `Round ${roundIndex + 1}: Question ${questionIndex + 1}`);
    			}

    			if ($game.state.finished) {
    				$$invalidate(0, titleText = "Final scores:");
    			}

    			if ($game.state.endOfRound) {
    				$$invalidate(0, titleText = "End of round!");
    			}

    			if ($game.state.gameOver) {
    				$$invalidate(0, titleText = "Game over!");
    			}

    			if (currentRoundIndex !== roundIndex) {
    				currentRoundIndex = roundIndex;
    				$$invalidate(1, answerSubmitted = false);
    			}

    			if (currentQuestionIndex !== $game.state.question) {
    				currentQuestionIndex = $game.state.question;
    				$$invalidate(1, answerSubmitted = false);
    			}
    		});

    		socket.get(`localhost:1337/game/${gameId}/join`);
    	});

    	const nextQuestion = () => socket.post(`localhost:1337/game/${gameId}/next`);

    	const submitAnswer = answer => {
    		$$invalidate(1, answerSubmitted = true);

    		socket.post(`localhost:1337/game/${gameId}/answer`, {
    			playerId: $player.id,
    			questionId: $game.rounds[roundIndex].questions[questionIndex].id,
    			answer
    		});
    	};

    	const markAnswer = (answerId, result) => {
    		socket.post(`localhost:1337/game/${gameId}/answer/${answerId}/mark`, { result });
    	};

    	const writable_props = ["currentRoute", "params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Game> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Game", $$slots, []);

    	$$self.$set = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(13, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(14, params = $$props.params);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		PlayerList: Player_list,
    		PlayerScores: Player_scores,
    		PlayerAnswers: Player_answers,
    		AnswerInput: Answer_input,
    		LoadingDots: Loading_dots,
    		game,
    		role,
    		ROLES,
    		player,
    		socket,
    		currentRoute,
    		params,
    		answer,
    		titleText,
    		answerSubmitted,
    		currentRoundIndex,
    		currentQuestionIndex,
    		gameId,
    		nextQuestion,
    		submitAnswer,
    		markAnswer,
    		$role,
    		isGameStarted,
    		$game,
    		isGameOver,
    		isEndOfRound,
    		players,
    		roundIndex,
    		questionIndex,
    		currentRound,
    		currentQuestion,
    		playerAnswers,
    		nextDisabled,
    		$player
    	});

    	$$self.$inject_state = $$props => {
    		if ("currentRoute" in $$props) $$invalidate(13, currentRoute = $$props.currentRoute);
    		if ("params" in $$props) $$invalidate(14, params = $$props.params);
    		if ("answer" in $$props) answer = $$props.answer;
    		if ("titleText" in $$props) $$invalidate(0, titleText = $$props.titleText);
    		if ("answerSubmitted" in $$props) $$invalidate(1, answerSubmitted = $$props.answerSubmitted);
    		if ("currentRoundIndex" in $$props) currentRoundIndex = $$props.currentRoundIndex;
    		if ("currentQuestionIndex" in $$props) currentQuestionIndex = $$props.currentQuestionIndex;
    		if ("isGameStarted" in $$props) $$invalidate(3, isGameStarted = $$props.isGameStarted);
    		if ("isGameOver" in $$props) isGameOver = $$props.isGameOver;
    		if ("isEndOfRound" in $$props) $$invalidate(5, isEndOfRound = $$props.isEndOfRound);
    		if ("players" in $$props) $$invalidate(6, players = $$props.players);
    		if ("roundIndex" in $$props) $$invalidate(18, roundIndex = $$props.roundIndex);
    		if ("questionIndex" in $$props) $$invalidate(19, questionIndex = $$props.questionIndex);
    		if ("currentRound" in $$props) $$invalidate(20, currentRound = $$props.currentRound);
    		if ("currentQuestion" in $$props) $$invalidate(7, currentQuestion = $$props.currentQuestion);
    		if ("playerAnswers" in $$props) $$invalidate(8, playerAnswers = $$props.playerAnswers);
    		if ("nextDisabled" in $$props) $$invalidate(9, nextDisabled = $$props.nextDisabled);
    	};

    	let isGameStarted;
    	let isGameOver;
    	let isEndOfRound;
    	let players;
    	let roundIndex;
    	let questionIndex;
    	let currentRound;
    	let currentQuestion;
    	let playerAnswers;
    	let nextDisabled;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$game*/ 16) {
    			 $$invalidate(3, isGameStarted = $game && $game.state && $game.state.started);
    		}

    		if ($$self.$$.dirty & /*$game*/ 16) {
    			 isGameOver = $game && $game.state && $game.state.gameOver;
    		}

    		if ($$self.$$.dirty & /*$game*/ 16) {
    			 $$invalidate(5, isEndOfRound = $game && $game.state && $game.state.endOfRound);
    		}

    		if ($$self.$$.dirty & /*$game*/ 16) {
    			 $$invalidate(6, players = $game && $game.players || []);
    		}

    		if ($$self.$$.dirty & /*$game*/ 16) {
    			 $$invalidate(18, roundIndex = $game && $game.state ? $game.state.round : undefined);
    		}

    		if ($$self.$$.dirty & /*$game*/ 16) {
    			 $$invalidate(19, questionIndex = $game && $game.state ? $game.state.question : undefined);
    		}

    		if ($$self.$$.dirty & /*$game, roundIndex*/ 262160) {
    			 $$invalidate(20, currentRound = $game && $game.rounds && $game.rounds[roundIndex] || undefined);
    		}

    		if ($$self.$$.dirty & /*currentRound, questionIndex*/ 1572864) {
    			 $$invalidate(7, currentQuestion = currentRound && currentRound.questions[questionIndex] || undefined);
    		}

    		if ($$self.$$.dirty & /*currentQuestion*/ 128) {
    			 $$invalidate(8, playerAnswers = currentQuestion && currentQuestion.playerAnswers || []);
    		}

    		if ($$self.$$.dirty & /*players, isGameStarted, playerAnswers*/ 328) {
    			 $$invalidate(9, nextDisabled = !players.length || isGameStarted && playerAnswers.length < players.length);
    		}
    	};

    	return [
    		titleText,
    		answerSubmitted,
    		$role,
    		isGameStarted,
    		$game,
    		isEndOfRound,
    		players,
    		currentQuestion,
    		playerAnswers,
    		nextDisabled,
    		nextQuestion,
    		submitAnswer,
    		markAnswer,
    		currentRoute,
    		params
    	];
    }

    class Game extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { currentRoute: 13, params: 14 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Game",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*currentRoute*/ ctx[13] === undefined && !("currentRoute" in props)) {
    			console_1.warn("<Game> was created without expected prop 'currentRoute'");
    		}

    		if (/*params*/ ctx[14] === undefined && !("params" in props)) {
    			console_1.warn("<Game> was created without expected prop 'params'");
    		}
    	}

    	get currentRoute() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentRoute(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get params() {
    		throw new Error("<Game>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Game>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const routes = [
      {
        name: "/",
        component: Homepage,
      },
      {
        name: "/setup",
        component: Setup,
      },
      {
        name: "/join",
        component: Join,
      },
      {
        name: "/game/:id",
        component: Game,
      },
    ];

    /* src/App.svelte generated by Svelte v3.21.0 */
    const file$a = "src/App.svelte";

    function create_fragment$c(ctx) {
    	let main;
    	let current;
    	const router = new src_6({ props: { routes }, $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(router.$$.fragment);
    			attr_dev(main, "class", "svelte-rns02x");
    			add_location(main, file$a, 19, 0, 267);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(router, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(router.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(router.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(router);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Router: src_6, routes });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
