###
  Test property notifications and dependencies
###
Abide = require('../abide.min')


test = require('./utils').createTest(module)


test['_construct() - constructor'] = ->
  spy = @mocker.spy()

  MyClass = Abide.extend
    _construct: spy

  new MyClass(1, 2, 3)

  spy.should.have.been.calledOnce
  spy.should.have.been.calledWithExactly(1, 2, 3)


test['normal instance properties'] = ->
  MyClass = Abide.extend
    color: 'red'

  m = new MyClass()
  @expect(m.color).to.eql('red')

  m.color = 'blue'
  @expect(m.color).to.eql('blue')


test['normal instance methods'] = ->
  spy = @mocker.spy()

  MyClass = Abide.extend
    log: spy

  m = new MyClass()

  m.log('test')

  spy.should.have.been.calledOnce
  spy.should.have.been.calledWithExactly('test')


test['computed properties'] =
  'cannot be set directly': ->
    MyClass = Abide.extend
      name: (->
        "test"
      ).computed()

    m = new MyClass()

    @expect(-> m.name = 'blah').throws 'Cannot set computed property: name'


  'basic dependency': ->
    MyClass = Abide.extend
      greeting: 'Hello'
      name: 'John'

      welcomeMessage: (->
        "#{@greeting} #{@name}"
      ).computed 'name'   # NOTE: we're not observing 'greeting'

    m = new MyClass()

    @expect(m.welcomeMessage).to.eql 'Hello John'

    m.name = 'Terry'
    @expect(m.welcomeMessage).to.eql 'Hello Terry'

    m.greeting = 'Bye'
    @expect(m.welcomeMessage).to.eql 'Hello Terry'


  'chained dependency': ->
    MyClass = Abide.extend
      lastName: 'Smith'

      welcomeMessage: (->
        "Hi #{@fullName}"
      ).computed 'fullName'

      fullName: (->
        "Mark #{@lastName}"
      ).computed 'lastName'

    m = new MyClass()
    @expect(m.welcomeMessage).to.eql 'Hi Mark Smith'

    m.lastName = 'Cowey'
    @expect(m.welcomeMessage).to.eql 'Hi Mark Cowey'


  'caches the calculated value': ->
    count = 0

    MyClass = Abide.extend
      lastName: 'Smith'

      welcomeMessage: (->
        "#{@fullName} has #{count++} dog(s)"
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

    MyClass = Abide.extend
      fullName: (->
        "#{@firstName} #{@lastName}"
      ).computed 'firstName', 'lastName'

      firstName: (->
        "Mark" + (count++)
      ).computed 'lastName'

      lastName: (->
        "#{@firstName}b"
      ).computed 'firstName'

    m = new MyClass()
    @expect(m.fullName).to.eql 'Mark1 Mark1b'


test['observer methods'] =

  'basic dependency': ->
    spy = @mocker.spy()

    MyClass = Abide.extend
      name: 'John'

      log: (->
        spy(@name)
      ).observes 'name'   # NOTE: we're not observing 'greeting'

    m = new MyClass()

    m.log()
    spy.should.have.been.calledOnce
    spy.should.have.been.calledWithExactly 'John'

    m.name = 'Terry'
    spy.should.have.been.calledTwice
    spy.should.have.been.calledWithExactly 'Terry'

    m.name = 'Terry'
    spy.should.have.been.calledTwice


  'chained dependency': ->
    spy = @mocker.spy()

    MyClass = Abide.extend
      name: 'John'

      log: (->
        spy(@fullName)
      ).observes 'fullName'

      fullName: (->
        "#{@name} Smith"
      ).computed 'name'

    m = new MyClass()

    m.log()
    spy.should.have.been.calledOnce  # even though fullName will trigger log, we're already calling log() so it shouldn't get called again
    spy.should.have.been.calledWithExactly 'John Smith'

    m.name = 'Mark'
    spy.should.have.been.calledTwice
    spy.should.have.been.calledWithExactly 'Mark Smith'



test['manual update notifier'] = ->
  spy = @mocker.spy()

  MyClass = Abide.extend
    name: 'John'

    log: (->
      spy(@name)
    ).observes 'name'   # NOTE: we're not observing 'greeting'

  m = new MyClass()

  m.log()
  spy.should.have.been.calledOnce
  spy.should.have.been.calledWithExactly 'John'

  m.notifyPropertyUpdated('name')
  spy.should.have.been.calledTwice
  spy.should.have.been.calledWithExactly 'John'



test['multiple classes'] = ->
  spy1 = @mocker.spy()
  spy2 = @mocker.spy()

  Class1 = Abide.extend
    name: ''

    log: (->
      spy1(@fullName)
    ).observes 'fullName'

    fullName: (->
      "#{@name} Smith"
    ).computed 'name'


  Class2 = Abide.extend
    name: ''

    log: (->
      spy2(@fullName)
    ).observes 'fullName'

    fullName: (->
      "#{@name} Cowey"
    ).computed 'name'

  obj1 = new Class1
  obj2 = new Class2

  obj1.name = 'Mark'
  obj2.name = 'John'

  spy1.should.have.been.calledOnce
  spy1.should.have.been.calledWithExactly 'Mark Smith'

  spy2.should.have.been.calledOnce
  spy2.should.have.been.calledWithExactly 'John Cowey'



test['class hierarchy'] = ->
  spy1 = @mocker.spy()
  spy2 = @mocker.spy()
  spy3 = @mocker.spy()

  Grandfather = Abide.extend
    name: 'Mark'

    log: (->
      spy1(@fullName)
    ).observes 'fullName'

    fullName: (->
      "#{@name} Smith"
    ).computed 'name'


  Father = Grandfather.extend
    name: 'John'

    log: (->
      spy2(@fullName)
    ).observes 'fullName'

    fullName: (->
      "#{@name} Smith"
    ).computed()


  Son = Father.extend
    name: 'John'

    log: (->
      spy3(@fullName)
    ).observes()

    fullName: (->
      "#{@name} Smith"
    ).computed 'name'


  f = new Father
  f.name = 'Bob'
  spy2.should.have.been.notCalled
  @expect(f.fullName).to.eql 'Bob Smith'
  spy2.should.have.been.calledOnce
  spy2.should.have.been.calledWithExactly 'Bob Smith'

  s = new Son
  s.name = 'Gavin'
  spy3.should.have.been.notCalled
  @expect(s.fullName).to.eql 'Gavin Smith'
  spy3.should.have.been.notCalled



test['mixins'] = ->
  EventEmitter =
    _event: '',
    emit: (event) ->
      @_event = event

  spy = @mocker.spy()

  MyClass = Abide.extend EventEmitter,
    log: (->
      spy(@_event)
    ).observes '_event'

  m = new MyClass

  spy.should.have.been.notCalled
  m.emit 'test'
  spy.should.have.been.calledOnce
  spy.should.have.been.calledWithExactly('test')

