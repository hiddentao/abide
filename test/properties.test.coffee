###
  Test property notifications and dependencies
###
BaseSpy = require('../abide.min')


test = require('./utils').createTest(module)


test['_init() - constructor'] = ->
  spy = @mocker.spy()

  MyClass = BaseSpy.extend
    _init: spy

  new MyClass()

  spy.should.have.been.calledOnce


test['normal instance properties'] = ->
  MyClass = BaseSpy.extend
    color: 'red'

  m = new MyClass()

  @expect(m.color).to.eql('red')

  m.color = 'blue'
  @expect(m.color).to.eql('blue')


test['normal instance methods'] = ->
  spy = @mocker.spy()

  MyClass = BaseSpy.extend
    log: spy

  m = new MyClass()

  m.log('test')

  spy.should.have.been.calledOnce
  spy.should.have.been.calledWithExactly('test')


test['computed properties'] =
  'cannot be set directly': ->
    MyClass = BaseSpy.extend
      name: (->
        "test"
      ).computed()

    m = new MyClass()

    @expect(-> m.name = 'blah').throws 'Cannot set computed property: name'


  'basic dependency': ->
    MyClass = BaseSpy.extend
      greeting: 'Hello'
      name: 'John'

      welcomeMessage: (->
        "#{this.greeting} #{this.name}"
      ).computed 'name'   # NOTE: we're not observing 'greeting'

    m = new MyClass()

    @expect(m.welcomeMessage).to.eql 'Hello John'

    m.name = 'Terry'
    @expect(m.welcomeMessage).to.eql 'Hello Terry'

    m.greeting = 'Bye'
    @expect(m.welcomeMessage).to.eql 'Hello Terry'


  'chained dependency': ->
    MyClass = BaseSpy.extend
      lastName: 'Smith'

      welcomeMessage: (->
        "Hi #{this.fullName}"
      ).computed 'fullName'

      fullName: (->
        "Mark #{this.lastName}"
      ).computed 'lastName'

    m = new MyClass()
    @expect(m.welcomeMessage).to.eql 'Hi Mark Smith'

    m.lastName = 'Cowey'
    @expect(m.welcomeMessage).to.eql 'Hi Mark Cowey'


  'caches the calculated value': ->
    count = 0

    MyClass = BaseSpy.extend
      lastName: 'Smith'

      welcomeMessage: (->
        "#{this.fullName} has #{count++} dog(s)"
      ).computed 'fullName'

      fullName: (->
        "Mark"
      ).computed 'lastName'

    m = new MyClass()
    @expect(m.welcomeMessage).to.eql 'Mark has 1 dog(s)'

    m.lastName = 'Hall'
    @expect(m.welcomeMessage).to.eql 'Mark has 1 dog(s)'



  'circular dependency detected': ->
    # NOTE: in practice, you wouldn't write code which had circular dependencies, so we ensure that handle this gracefully
    count = 1

    MyClass = BaseSpy.extend
      fullName: (->
        "#{this.firstName} #{this.lastName}"
      ).computed 'firstName', 'lastName'

      firstName: (->
        "Mark" + (count++)
      ).computed 'lastName'

      lastName: (->
        "#{this.firstName}b"
      ).computed 'firstName'

    m = new MyClass()
    @expect(m.fullName).to.eql 'Mark1 Mark1b'


#test['observer methods']

