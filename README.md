Base class with pub-sub and observers for JS object properties using ECMA5 getters/setters

This provides a flexible base class and extension mechanism for building JS objects which can have properties which
listen for changes on other properties. Inspired by [Ember.JS observers](http://emberjs.com/guides/object-model/observers/)
it aims to be smaller in scope and functionality and thus more lightweight.

## Example

TODO...

## Installation

Node:

    $ npm install abide

Bower:

    $ bower install abide

Browser:

    <script type="text/javascript" src="https://rawgithub.com/hiddentao/abide/master/abide.min.js"></script>

## History

Inspired by [Ember.JS](http://emberjs.com/), I wanted something smaller in scope in functionality
A lighter-weight and less complex version of Ember.JS

## Roadmap

Some nice-to-haves for the future
* Ability to listen to changes within objects and arrays
* Ability to listen for changes to sub-properties, i.e. properties of objects which are properties
* Ability to listen to changes to properties on any object within the global namespace

## Contributions

Pull requests with comprehensive tests are welcome as long as they fit well with the goals of the library.

## License

See [LICENSE.md](https://github.com/hiddentao/abide/blob/master/LICENSE.md)