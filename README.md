[![Build Status](https://secure.travis-ci.org/hiddentao/abide.png?branch=master)](http://travis-ci.org/hiddentao/abide)

Base class with pub-sub and observers for JS object properties using ECMA5 getters/setters

This provides a flexible base class and extension mechanism for building JS objects which can have properties which
listen for changes on other properties. Inspired by [Ember.JS observers](http://emberjs.com/guides/object-model/observers/)
it aims to be smaller in scope and functionality and thus more lightweight.

## Example

```js

var MyClass = Abide.extend({
  firstName: 'John',
  lastName: 'Smith',

  fullName: (function() {
    return this.firstName + ' ' + this.lastName;
  }).computed('firstName', 'lastName'),

  showWelcomeMessage: (function() {
    console.log('Welcome ' + this.fullName);
  }).observes('fullName')
});


var m = new MyClass();

m.showWelcomeMessage();
// console.log 'John Smith'

m.firstName = 'Mark';
// showWelcomeMessage() automatically gets triggered
// console.log 'Mark Smith'
```

## Installation

Node:

    $ npm install abide

Bower:

    $ bower install abide

Browser:

    <script type="text/javascript" src="https://rawgithub.com/hiddentao/abide/master/abide.min.js"></script>

## API

### Abide.extend(mixins...)

Create a new class by extending the base class with the given mixins.

    var EmailClient = Abide.extend(EventEmitterMixin, {
      server: 'gmail.com',
      port: 993
    });


    var ImapClient = EmailClient.extend({
      ssl: true
    });

**Params:**

  * `mixins...` - one more mixins and class definitions


### Function.prototype.computed(dependencies...)

Specify an object property which gets computed whenever a given dependency gets updated.

    var EmailClient = Abide.extend(EventEmitterMixin, {
      username: 'john',
      server: 'gmail.com',

      email: (function(){
        return this.username + '@' + this.server;
      }).computed('username', 'server')
    });

    var client = new EmailClient();
    client.username = 'mark';   // will auto-trigger a re-calculation of 'email' property

**Params:**

  * `dependencies...` - names of properties which, when modified, should auto-trigger a recalculation of this property.


### Function.prototype.observes(dependencies...)


Specify an object method which gets called whenever a given dependency gets updated.

    var EmailClient = Abide.extend(EventEmitterMixin, {
      username: 'john',
      server: 'gmail.com',

      logEmailAddress: (function(){
        console.log(this.username + '@' + this.server);
      }).observes('username', 'server')
    });

    var client = new EmailClient();
    client.username = 'mark';   // will auto-trigger a call to 'logEmailAddress()'

**Params:**

  * `dependencies...` - names of properties which, when modified, should auto-trigger a call to this method.


### .notifyPropertyUpdated(name)

Notify all dependents of a property that it has been updated.

    var EmailClient = Abide.extend(EventEmitterMixin, {
      username: 'john',
      server: 'gmail.com',

      logEmailAddress: (function(){
        console.log(this.username + '@' + this.server);
      }).observes('username', 'server')
    });

    var client = new EmailClient();
    client.notifyPropertyUpdated('username');   // will auto-trigger a call to 'logEmailAddress()'

**Params:**

  * `name` - name of properties whose dependents should be notified.



## Optimizations

* For a given property which is depended upon by other properties and methods, its dependents only get notified if its
value is changes from what it was previously. Thus, if a computed property's newly computed value is still the same as the current
value then no further notifications are triggered.

## Roadmap

Some nice-to-haves for the future:
* Ability to listen to changes within objects and arrays
* Ability to listen for changes to sub-properties, i.e. properties of objects which are properties
* Ability to listen to changes to properties on any object within the global namespace

## Contributions

Pull requests with comprehensive tests are welcome as long as they fit well with the goals of the library.

## License

See [LICENSE.md](https://github.com/hiddentao/abide/blob/master/LICENSE.md)