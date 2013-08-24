/*! abide | https://github.com/hiddentao/abide | BSD license */
(function (name, definition){
  'use strict';

  if ('function' === typeof define){ // AMD
    define(definition);
  } else if ('undefined' !== typeof module && module.exports) { // Node.js
    module.exports = definition();
  } else { // Browser
    var global = window || this,
      old = global[name],
      theModule = definition();

    theModule.noConflict = function () {
      global[name] = old;
      return theModule;
    };
    global[name] = theModule;
  }
})('Abide', function () {
  'use strict';

  /**
   * Convert a function arguments array into a normal array.
   *
   * @param args {Array} a function arguments array.
   */
  var _toArray = function(args) {
    return Array.prototype.slice.call(args);
  };


  /**
   * Enumerate object/array key-value pairs.
   *
   * @param object {object} an object.
   * @param func {function} function with signature (value, key) which gets called for each own property of the object.
   */
  var _forEach = function(object, func) {
    for (var key in object) {
      if (object.hasOwnProperty(key)) {
        func.call(null, object[key], key);
      }
    }
  };


  /**
   * Add key-value pairs from one or more objects to another one.
   *
   * @param dst {object} the destination object to modify.
   * @param src {object} the source object. Use additional parameters to pass in additional source objects.
   *
   * @return {object} the modified destination object.
   * @private
   */
  var _extend = function(dst, src) {
    // for each passed-in argument, treat it as a mixin/class we want to extend the base class with in order to create
    // this new child class.
    _forEach(_toArray(arguments).slice(1), function(mixin) {
      _forEach(mixin, function(value, key) {
        dst[key] = value;
      });
    });

    return dst;
  };


  /**
   * Prototype inheritance
   * @param parentClassOrObject
   * @return this
   * @see http://phrogz.net/JS/classes/OOPinJS2.html
   */
  Function.prototype.inheritsFrom = function( parentClassOrObject ){
    this.prototype = Object.create(parentClassOrObject.prototype);
    return this;
  };



  /**
   * Trigger this function when the given properties change.
   * @return this
   */
  Function.prototype.observes = function() {
    this.__observes = _toArray(arguments);
    return this;
  };


  /**
   * Re-compute this computed property when the given properties change.
   * @return this.
   */
  Function.prototype.computed = function() {
    this.__computed = _toArray(arguments);
    return this;
  };


  /**
   * Create and return a .extend() method for the given class.
   *
   * @param BaseClass {object} the class object to which we will attach the returned method.
   */
  var _createExtendMethod = function(BaseClass) {
    // the extend() method implementation
    return function() {
      // create a child class.
      var newClass = function() {
        BaseClass.apply(this, _toArray(arguments));
      };
      newClass.inheritsFrom(BaseClass);

      // where property meta info and cached values get stored
      newClass.prototype.__prop = {};
      // where property dependencies get stored
      newClass.prototype.__deps = {};

      // inherit the base class's definition
      newClass.__classDefinition = BaseClass.__classDefinition || {};

      // for each passed-in argument, treat it as a mixin/class we want to extend the base class with in order to create
      // this new child class.
      _extend.apply(null, [newClass.__classDefinition].concat(_toArray(arguments)));


      /**
       * Add dependents to be notified when property gets updated.
       *
       * @param name {string} the property which will get updated.
       * @param sources {Array} names of properties upon which the target property depends.
       * @private
       */
      var _addPropertyDependencies = function(name, sources) {
        var proto = newClass.prototype;

        _forEach(sources, function(source) {
          if (!proto.__deps[source]) {
            proto.__deps[source] = {};
          }

          proto.__deps[source][name] = name;
        });
      };


      /**
       * Notify dependents of given property that it has been updated.
       *
       * Call this directly to notify dependents even if an update hasn't taken place.
       *
       * @param name {string} the name of the property which got updated.
       * @private
       */
      newClass.prototype.notifyPropertyUpdated = function(name) {
        var self = this;

        // this function will get called later on in the call chain as dependents in turn notify their own dependents of changes.
        // so we'll use a variable to keep track of the first call made to this function so that we can clean up afterwards (see bottom).
        var thisIsTheRootCall = false;
        if (!self.__notifiedDependents) {
          self.__notifiedDependents = {};
          thisIsTheRootCall = true;
        }

        // mark that this current property has been notified
        self.__notifiedDependents[name] = true;

        // for each of this property's dependents
        _forEach(self.__deps[name] || {}, function(dependent) {
          // only update dependent if not already done so
          if (!self.__notifiedDependents[dependent]) {
            // re-calculate it
            switch (self.__prop[dependent].type) {
              case 'function':
                self[dependent].call(self);
                break;
              case 'computed':
                self.__prop[dependent].dirty = true; // mark value as dirty
                var a = self[dependent];
                break;
            }
          }
        });

        // if this was the original notify call then clean out the record of which dependents have been notified in order to
        // be ready for the next call to this method.
        if (thisIsTheRootCall) {
          delete self.__notifiedDependents;
        }
      };


      // process the final definition of this new child class
      _forEach(newClass.__classDefinition, function(propDef, propName) {
        // what type of property is this?
        switch (typeof propDef) {
          // is it a function?
          case 'function':
            // is it a function call which observes other properties?
            if (propDef.__observes) {
              // save  meta info
              newClass.prototype.__prop[propName] = {
                type: 'function'
              };
              // dependencies
              _addPropertyDependencies(propName, propDef.__observes);
              // create the method on the class prototype
              newClass.prototype[propName] = function() {
                // this method might internally make use of computed properties which it also observes. In that case, when
                // those properties get fetched for the first time they will auto-trigger a call to this method. Since
                // we are already calling this method we don't want to call it a second time. So let's keep track of that
                // fact here.
                var thisIsTheRootCall = false;
                if (!this.__notifiedDependents) {
                  this.__notifiedDependents = {};
                  this.__notifiedDependents[propName] = propName;
                  thisIsTheRootCall = true;
                }

                // call the actual method implementation
                propDef.apply(this, _toArray(arguments));

                if (thisIsTheRootCall) {
                  delete this.__notifiedDependents;
                }
              };
            }
            // is it actually a computed property?
            else if (propDef.__computed) {
              // save  meta info
              newClass.prototype.__prop[propName] = {
                type: 'computed'
              };
              // dependencies
              _addPropertyDependencies(propName, propDef.__computed);
              // define the actual Object property on the class prototype
              Object.defineProperty(newClass.prototype, propName, {
                get: function() {
                  // value needs re-calculating?  if value not yet set or if marked as dirty
                  if (!this.__prop[propName].hasOwnProperty('value') || this.__prop[propName].dirty) {
                    // reset dirty flag
                    delete this.__prop[propName].dirty;
                    // calculate new value
                    var newVal = propDef.call(this);
                    // if new value is different to old one
                    if (newVal !== this.__prop[propName].value) {
                      // save it (need to do this first in case dependents ask for this value)
                      this.__prop[propName].value = newVal;
                      // inform dependents
                      this.notifyPropertyUpdated(propName);
                    }
                  }
                  // return current value
                  return this.__prop[propName].value;
                },
                set: function() {
                  throw new Error('Cannot set computed property: ' + propName);
                }
              });
            }
            // is it just a normal method?
            else {
              delete newClass.prototype.__prop[propName]; // delete from base class
              newClass.prototype[propName] = propDef;
            }
            break;
          // is it just a normal value?
          default:
            // save  meta info
            newClass.prototype.__prop[propName] = {
              type: 'value',
              value: propDef
            };
            // define the actual property
            Object.defineProperty(newClass.prototype, propName, {
              get: function() {
                return this.__prop[propName].value;
              },
              set: function(val) {
                // if new value is different
                if (val !== this.__prop[propName].value) {
                  // save it (do this first in case dependents ask for this value)
                  this.__prop[propName].value = val;
                  // inform dependents
                  this.notifyPropertyUpdated(propName);
                }
              }
            });
        }
      });


      newClass.extend = _createExtendMethod(newClass);
      return newClass;
    }
  };

  /**
   * Our base class.
   * @constructor
   */
  var Base = function() {
    this._construct.apply(this, _toArray(arguments));
  };

  /**
   * Where object construction takes place.
   * Subclasses should treat this method as the constructor and override it if necessary.
   * @private
   */
  Base.prototype._construct = function() {};

  /**
   * Extend this Base class to create a new child class.
   * @type {object} a new child class.
   */
  Base.extend = _createExtendMethod(Base);



  return Base;
});