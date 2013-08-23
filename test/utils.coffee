###
  Test utils
###

path = require('path')

sinon = exports.sinon = require('sinon')

sinonChai = require("sinon-chai")
chai = require("chai")
chai.use(sinonChai)

assert = exports.assert = chai.assert
expect = exports.expect = chai.expect
should = exports.should = chai.should()


exports.createTest = (testFileModuleObj) ->
  if not testFileModuleObj
    throw new Error 'Please pass in the module object'

  test =
    beforeEach: ->
      @mocker = sinon.sandbox.create()
      @assert = assert
      @expect = expect
      @should = should
    afterEach: ->
      @mocker.restore()

  testFileModuleObj.exports[path.basename(testFileModuleObj.filename)] = test

  test
