/*! basespy | https://github.com/hiddentao/basespy | BSD license */
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
})('BaseSpy', function () {
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
   * Add property dependencies to given dependency graph.
   *
   * @param dependencyGraph {object} the dependency graph
   * @param target {string} the property which will get updated.
   * @param sources {Array} names of properties upon which the target property depends.
   */
  var _addDependencies = function(dependencyGraph, target, sources) {
    _forEach(sources, function(source) {
      if (!dependencyGraph[source]) {
        dependencyGraph[source] = {};
      }

      dependencyGraph[source][target] = target;
    });
  };


  // keep track of dependencies which have already been notified
  var notifiedDependents = null;


  /**
   * Notify dependents of given property that it has been updated.
   *
   * The 'this' variable points to the object instance whose property got updated.
   *
   * @param dependencyGraph {object} the dependency graph.
   * @param source {string} the name of the property which got updated.
   * @private
   */
  var _notifyDependents = function(dependencyGraph, source) {
    var objInstance = this;

    // this function will get called later on in the call chain as dependents in turn notify their own dependents of changes.
    // so we'll use a variable to keep track of the first call made to this function so that we can clean up afterwards (see bottom).
    var thisIsTheRootCall = false;
    if (!notifiedDependents) {
      notifiedDependents = {};
      thisIsTheRootCall = true;
    }

    // mark that this current property has been notified
    notifiedDependents[source] = true;

    // for each of this property's dependents
    var dependents = dependencyGraph[source];
    _forEach(dependents || {}, function(dependent) {
      // only update dependent if not already done so
      if (!notifiedDependents[dependent]) {
        // re-calculate it
        switch (objInstance.__prop[dependent].type) {
          case 'function':
            objInstance[dependent].call(objInstance);
            break;
          case 'computed':
            objInstance.__prop[dependent].dirty = true; // mark value as dirty
            var a = objInstance[dependent];
            break;
        }
      }
    });

    // if this was the original notify call then clean out the record of which dependents have been notified in order to
    // be ready for the next call to this method.
    if (thisIsTheRootCall) {
      notifiedDependents = null;
    }
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
        BaseClass.call(this);
      };
      newClass.inheritsFrom(BaseClass);

      // where property meta info and cached values get stored
      newClass.prototype.__prop = {};
      // where dependencies between properties gets stored
      newClass.__dependencies = {};

      // inherit the base class's definition
      newClass.__classDefinition = BaseClass.__classDefinition || {};

      // for each passed-in argument, treat it as a mixin/class we want to extend the base class with in order to create
      // this new child class.
      _forEach(_toArray(arguments), function(mixin) {
        _forEach(mixin, function(value, key) {
          newClass.__classDefinition[key] = value;
        });
      });

      // process the final definition of this new child class
      _forEach(newClass.__classDefinition, function(propDef, propName) {
        // what type of property is this?
        switch (typeof propDef) {
          // is it a function?
          case 'function':
            // is it a function call which observes other properties?
            if (propDef.__observes) {
              // save the dependency info
              _addDependencies(newClass.__dependencies, propName, propDef.__observes);
              // save  meta info
              newClass.prototype.__prop[propName] = {
                type: 'function'
              };
              // create the method on the class prototype
              newClass.prototype[propName] = propDef;
            }
            // is it actually a computed property?
            else if (propDef.__computed) {
              // save the dependency info
              _addDependencies(newClass.__dependencies, propName, propDef.__computed);
              // save meta info
              newClass.prototype.__prop[propName] = {
                type: 'computed'
              };
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
                      _notifyDependents.call(this, newClass.__dependencies, propName);
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
            newClass.prototype.__prop[propName] = {
              type: 'value',
              value: propDef
            };

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
                  _notifyDependents.call(this, newClass.__dependencies, propName);
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
    this._init();
  };

  /**
   * Where object construction takes place.
   * Subclasses should treat this method as the constructor and override it if necessary.
   * @private
   */
  Base.prototype._init = function() {};

  /**
   * Extend this Base class to create a new child class.
   * @type {object} a new child class.
   */
  Base.extend = _createExtendMethod(Base);



  return Base;
});