var assert = require('assert')

var o  = require('atom').o(module)
var testtube = require('test-tube')

var limiterSelectors = require('../../lib/security/LimiterSelector')

module.exports = o({
  _type: testtube.Test,
  name: 'ReqPropertyLimiterSelectorTests',
  description: 'ReqPropertyLimiterSelector tests',
  tests: [
    o({
      _type: testtube.Test,
      name: 'TestPropertyPathValidation',
      description: 'Test property path validation',
      doTest: function() {
        var s = undefined
        var vals = [null, undefined, '', {foo: 'bar'}, function () {var foo = 'bar'}]
        vals.forEach(function (val) {
          assert.throws(function () {
            s = o({_type: limiterSelectors.ReqPropertyLimiterSelector, propertyPath: val})
          }, TypeError)
        })
        assert.doesNotThrow(function() {
          s = o({_type: limiterSelectors.ReqPropertyLimiterSelector, propertyPath: 'foo.bar.baz'})
        })
        assert.deepEqual(s.propertyPath, ['foo', 'bar', 'baz'])
      }
    }),
    o({
      _type: testtube.Test,
      name: 'TestTransformValidation',
      description: 'Test transform validation',
      doTest: function() {
        var s = undefined
        var vals = [null, {foo: 'bar'}]
        vals.forEach(function (val) {
          assert.throws(function () {
            s = o({
              _type: limiterSelectors.ReqPropertyLimiterSelector,
              propertyPath: 'foo',
              transform: val
            })
          }, TypeError)
        })
        var transform = function(val) { return val + 'bar'}
        assert.doesNotThrow(function() {
          s = o({
            _type: limiterSelectors.ReqPropertyLimiterSelector,
            propertyPath: 'foo',
            transform: transform
          })
        })
        assert.equal(s.transform, transform)
      }
    }),
    o({
      _type: testtube.Test,
      name: 'TestKeyFn',
      description: 'Test key function',
      doTest: function() {
        var req = {
          foo: {
            bar: {
              baz: 1
            }
          },
          bar: {
            baz: {
              foo: 2
            }
          },
          baz: {
            foo: {
              bar: 3
            }
          }
        }
        var s = o({
          _type: limiterSelectors.ReqPropertyLimiterSelector,
          propertyPath: 'foo.bar.baz'
        })
        assert.equal(s.key(req), 1)
        s = o({
          _type: limiterSelectors.ReqPropertyLimiterSelector,
          propertyPath: 'bar.baz.foo'
        })
        assert.equal(s.key(req), 2)
        s = o({
          _type: limiterSelectors.ReqPropertyLimiterSelector,
          propertyPath: 'baz.foo.bar'
        })
        assert.equal(s.key(req), 3)
      }
    }),
    o({
      _type: testtube.Test,
      name: 'TestTransform',
      description: 'Test transform',
      doTest: function() {
        var s = o({
          _type: limiterSelectors.ReqPropertyLimiterSelector,
          propertyPath: 'foo.bar',
          transform: function(val) {
            return val.split('').reverse().join('')
          }
        })
        assert.equal(s.key({foo: {bar: 'abcd'}}), 'dcba')
      }
    }),
  ]
})
