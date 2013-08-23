###
  Test new Function.prototype methods
###
require('../abide.min')


test = require('./utils').createTest(module)


test['inheritsFrom'] = ->
  parent = -> @
  child = -> @

  child.inheritsFrom(parent)

  @expect(child.prototype).to.be.instanceOf(parent)


test['observes'] = ->
  fn = (-> true).observes('blah')
  @expect(fn.__observes).to.eql ['blah']


test['computed'] = ->
  fn = (-> true).computed('blah')
  @expect(fn.__computed).to.eql ['blah']

