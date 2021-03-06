var assert = require('assert')
var url = require('url')

var _ = require('lodash')
var sinon = require('sinon')

var __ = require('@carbon-io/carbon-core').fibers.__(module)
var ejson = require('@carbon-io/carbon-core').ejson
var o = require('@carbon-io/carbon-core').atom.o(module)
var _o = require('@carbon-io/carbon-core').bond._o(module)
var testtube = require('@carbon-io/carbon-core').testtube

var carbond = require('../..')
var pong = require('../fixtures/pong')

/**************************************************************************
 * find tests
 */
__(function() {
  module.exports = o.main({

    /**********************************************************************
     * _type
     */
    _type: testtube.Test,

    /**********************************************************************
     * name
     */
    name: 'FindTests',

    /**********************************************************************
     * tests
     */
    tests: [
      o({
        _type: carbond.test.ServiceTest,
        name: 'DefaultConfigFindTests',
        service: o({
          _type: pong.Service,
          endpoints: {
            find: o({
              _type: pong.Collection,
              idGenerator: pong.util.collectionIdGenerator,
              enabled: {find: true}
            })
          }
        }),
        setup: function(context) {
          carbond.test.ServiceTest.prototype.setup.apply(this, arguments)
          context.global.idParameterName = this.service.endpoints.find.idParameterName
        },
        teardown: function(context) {
          delete context.global.idParameterName
          carbond.test.ServiceTest.prototype.teardown.apply(this, arguments)
        },
        tests: [
          {
            name: 'HeadTest',
            description: 'Test HEAD method',
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'HEAD',
                headers: {
                  'x-pong': ejson.stringify({
                    find: [
                      {[context.global.idParameterName]: '0', foo: 'bar'},
                      {[context.global.idParameterName]: '1', bar: 'baz'},
                      {[context.global.idParameterName]: '2', baz: 'yaz'}
                    ]
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: undefined
            }
          },
          {
            name: 'FindReturnObjectValidationErrorTest',
            description: 'Test validation on find return value',
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                headers: {
                  'x-pong': ejson.stringify({
                    find: {[context.global.idParameterName]: '0', foo: 'bar'}
                  })
                }
              }
            },
            resSpec: {
              statusCode: 500
            }
          },
          {
            name: 'FindTest',
            description: 'Test find',
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                headers: {
                  'x-pong': ejson.stringify({
                    find: [
                      {[context.global.idParameterName]: '0', foo: 'bar'},
                      {[context.global.idParameterName]: '1', bar: 'baz'},
                      {[context.global.idParameterName]: '2', baz: 'yaz'}
                    ]
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepStrictEqual(body, [
                  {[context.global.idParameterName]: '0', foo: 'bar'},
                  {[context.global.idParameterName]: '1', bar: 'baz'},
                  {[context.global.idParameterName]: '2', baz: 'yaz'}
                ])
              }
            }
          },
          {
            name: 'FindIdQueryTest',
            description: 'Test find with id query',
            setup: function() {
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              try {
                assert(this.findSpy.called)
                assert.deepEqual(
                  this.findSpy.firstCall.args[0][context.global.idParameterName],
                  ['0', '1', '2'])
              } finally {
                this.findSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  [context.global.idParameterName]: ['0', '1', '2']
                },
                headers: {
                  'x-pong': ejson.stringify({
                    find: [
                      {[context.global.idParameterName]: '0', foo: 'bar'},
                      {[context.global.idParameterName]: '1', bar: 'baz'},
                      {[context.global.idParameterName]: '2', baz: 'yaz'}
                    ]
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepStrictEqual(body, [
                  {[context.global.idParameterName]: '0', foo: 'bar'},
                  {[context.global.idParameterName]: '1', bar: 'baz'},
                  {[context.global.idParameterName]: '2', baz: 'yaz'}
                ])
              }
            }
          },
          {
            name: 'FindPageSkipAndLimitParametersIgnoredTest',
            description: 'Test find',
            setup: function() {
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function() {
              try {
                assert.equal(
                  _.intersection(
                    ['skip', 'limit', 'page'],
                    _.keys(this.findSpy.firstCall.args[0])).length, 0)
              } finally {
                this.findSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  skip: 6,
                  limit: 6,
                  page: 6
                },
                headers: {
                  'x-pong': ejson.stringify({
                    find: [{[context.global.idParameterName]: '0', foo: 'bar'}]
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepStrictEqual(body, [{[context.global.idParameterName]: '0', foo: 'bar'}])
              }
            }
          },
        ]
      }),
      o({
        _type: carbond.test.ServiceTest,
        name: 'NoIdQueryConfigFindTests',
        service: o({
          _type: pong.Service,
          endpoints: {
            find: o({
              _type: pong.Collection,
              idGenerator: pong.util.collectionIdGenerator,
              enabled: {find: true},
              findConfig: {
                supportsIdQuery: false
              }
            })
          }
        }),
        setup: function(context) {
          carbond.test.ServiceTest.prototype.setup.apply(this, arguments)
          context.global.idParameterName = this.service.endpoints.find.idParameterName
        },
        teardown: function(context) {
          delete context.global.idParameterName
          carbond.test.ServiceTest.prototype.teardown.apply(this, arguments)
        },
        tests: [
          {
            name: 'IdQueryIgnoredTest',
            description: 'Test that the id query parameter is ignored',
            setup: function() {
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              try {
                assert(!(context.global.idParameterName in this.findSpy.firstCall.args[0]))
              } finally {
                this.findSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  [context.global.idParameterName]: 0
                },
                headers: {
                  'x-pong': ejson.stringify({
                    find: []
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepStrictEqual(body, [])
              }
            }
          }
        ]
      }),
      o({
        _type: carbond.test.ServiceTest,
        name: 'SkipAndLimitConfigFindTests',
        service: o({
          _type: pong.Service,
          endpoints: {
            find: o({
              _type: pong.Collection,
              idGenerator: pong.util.collectionIdGenerator,
              enabled: {find: true},
              findConfig: {
                supportsSkipAndLimit: true
              }
            })
          }
        }),
        tests: [
          {
            name: 'SkipAndLimitTest',
            description: 'Test that skip and limit parameters are honored',
            setup: function() {
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              try {
                assert.equal(
                  _.intersection(
                    ['skip', 'limit'],
                    _.keys(this.findSpy.firstCall.args[0])).length, 2)
              } finally {
                this.findSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  skip: 1,
                  limit: 1
                },
                headers: {
                  'x-pong': ejson.stringify({
                    find: []
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepStrictEqual(body, [])
              }
            }
          },
          {
            name: 'PageNotHonoredTest',
            description: 'Test that page parameter is not honored',
            setup: function() {
              this.preFindOperationSpy = sinon.spy(this.parent.service.endpoints.find, 'preFindOperation')
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              try {
                assert(!('page' in this.preFindOperationSpy.firstCall.args[1].parameters))
                assert.equal(
                  _.intersection(
                    ['page', 'skip', 'limit'],
                    _.keys(this.findSpy.firstCall.args[0])).length, 2)
                assert.equal(this.findSpy.firstCall.args[0].skip, 6)
                assert.equal(this.findSpy.firstCall.args[0].limit, 6)
              } finally {
                this.findSpy.restore()
                this.preFindOperationSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  page: 6,
                  skip: 6,
                  limit: 6,
                },
                headers: {
                  'x-pong': ejson.stringify({
                    find: []
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepStrictEqual(body, [])
              }
            }
          }
        ]
      }),
      o({
        _type: carbond.test.ServiceTest,
        name: 'PageConfigFindTests',
        service: o({
          _type: pong.Service,
          endpoints: {
            find: o({
              _type: pong.Collection,
              idGenerator: pong.util.collectionIdGenerator,
              enabled: {find: true},
              findConfig: {
                supportsPagination: true,
                pageSize: 2,
                maxPageSize: 10
              }
            })
          }
        }),
        setup: function(context) {
          carbond.test.ServiceTest.prototype.setup.apply(this, arguments)
          context.global.idParameterName = this.service.endpoints.find.idParameterName
        },
        teardown: function(context) {
          delete context.global.idParameterName
          carbond.test.ServiceTest.prototype.teardown.apply(this, arguments)
        },
        tests: [
          {
            name: 'BasicPaginationTest',
            description: 'Test basic pagination',
            setup: function() {
              this.preFindOperationSpy = sinon.spy(this.parent.service.endpoints.find, 'preFindOperation')
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              try {
                assert.equal(this.preFindOperationSpy.firstCall.args[1].parameters.page, 3)
                // NOTE: this is expected to be 2 since page is removed from the context and
                //       passed in terms of skip and limit instead
                assert.equal(
                  _.intersection(
                    ['page', 'skip', 'limit'],
                    _.keys(this.findSpy.firstCall.args[0])).length, 2)
                assert.equal(this.findSpy.firstCall.args[0].skip, 6)
                assert.equal(this.findSpy.firstCall.args[0].limit, 2)
              } finally {
                this.findSpy.restore()
                this.preFindOperationSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  page: 3
                },
                headers: {
                  'x-pong': ejson.stringify({
                    find: [
                      {[context.global.idParameterName]: '6', foo: 'bar'},
                      {[context.global.idParameterName]: '7', bar: 'baz'}
                    ]
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert.equal(
                  headers.link,
                  '<http://localhost:8888/find?page=2>; rel="prev", <http://localhost:8888/find?page=4>; rel="next"')
              },
              body: function(body, context) {
                assert.deepStrictEqual(body, [
                  {[context.global.idParameterName]: '6', foo: 'bar'},
                  {[context.global.idParameterName]: '7', bar: 'baz'}
                ])
              }
            }
          },
          {
            name: 'NoPrevLinkPaginationTest',
            description: 'Test absence of prev link on first page',
            setup: function() {
              this.preFindOperationSpy = sinon.spy(this.parent.service.endpoints.find, 'preFindOperation')
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              try {
                assert.equal(this.preFindOperationSpy.firstCall.args[1].parameters.page, 0)
                assert.equal(
                  _.intersection(
                    ['page', 'skip', 'limit'],
                    _.keys(this.findSpy.firstCall.args[0])).length, 2)
              } finally {
                this.findSpy.restore()
                this.preFindOperationSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                headers: {
                  'x-pong': ejson.stringify({
                    find: [
                      {[context.global.idParameterName]: '0', foo: 'bar'},
                      {[context.global.idParameterName]: '1', bar: 'baz'}
                    ]
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert.equal(
                  headers.link,
                  '<http://localhost:8888/find?page=1>; rel="next"')
              },
              body: function(body, context) {
                assert.deepStrictEqual(body, [
                  {[context.global.idParameterName]: '0', foo: 'bar'},
                  {[context.global.idParameterName]: '1', bar: 'baz'}
                ])
              }
            }
          },
          {
            name: 'NoNextLinkPaginationTest',
            description: 'Test absence of next link on last page',
            setup: function() {
              this.preFindOperationSpy = sinon.spy(this.parent.service.endpoints.find, 'preFindOperation')
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              try {
                assert.equal(this.preFindOperationSpy.firstCall.args[1].parameters.page, 2)
                assert.equal(
                  _.intersection(
                    ['page', 'skip', 'limit'],
                    _.keys(this.findSpy.firstCall.args[0])).length, 2)
              } finally {
                this.findSpy.restore()
                this.preFindOperationSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  page: 2
                },
                headers: {
                  'x-pong': ejson.stringify({
                    find: [
                      {[context.global.idParameterName]: '4', foo: 'bar'}
                    ]
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert.equal(
                  headers.link,
                  '<http://localhost:8888/find?page=1>; rel="prev"')
              },
              body: function(body, context) {
                assert.deepStrictEqual(body, [
                  {[context.global.idParameterName]: '4', foo: 'bar'},
                ])
              }
            }
          },
          {
            name: 'NoNextOrPrevLinkPaginationTest',
            description: 'Test absence of next and prev link on first and last page',
            setup: function() {
              this.preFindOperationSpy = sinon.spy(this.parent.service.endpoints.find, 'preFindOperation')
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              try {
                assert.equal(this.preFindOperationSpy.firstCall.args[1].parameters.page, 0)
                assert.equal(
                  _.intersection(
                    ['page', 'skip', 'limit'],
                    _.keys(this.findSpy.firstCall.args[0])).length, 2)
              } finally {
                this.findSpy.restore()
                this.preFindOperationSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                headers: {
                  'x-pong': ejson.stringify({
                    find: [
                      {[context.global.idParameterName]: '0', foo: 'bar'}
                    ]
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepStrictEqual(body, [
                  {[context.global.idParameterName]: '0', foo: 'bar'},
                ])
              }
            }
          },
          {
            name: 'MaxPageSizeTest',
            description: 'Test maxPageSize is enforced',
            setup: function() {
              this.preFindOperationSpy = sinon.spy(this.parent.service.endpoints.find, 'preFindOperation')
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              try {
                assert.equal(
                  this.preFindOperationSpy.firstCall.args[1].parameters.limit,
                  this.parent.service.endpoints.find.findConfig.maxPageSize + 1)
                assert.equal(
                  this.findSpy.firstCall.args[0].limit,
                  this.parent.service.endpoints.find.findConfig.maxPageSize)
              } finally {
                this.findSpy.restore()
                this.preFindOperationSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  limit: this.parent.service.endpoints.find.findConfig.maxPageSize + 1
                },
                headers: {
                  'x-pong': ejson.stringify({
                    find: _.map(_.range(this.parent.service.endpoints.find.findConfig.maxPageSize), function(n) {
                      return {[context.global.idParameterName]: n.toString(), foo: 'bar'}
                    })
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200
            }
          },
          {
            name: 'LimitEnforcedTest',
            description: 'Test limit is enforced',
            setup: function() {
              this.preFindOperationSpy = sinon.spy(this.parent.service.endpoints.find, 'preFindOperation')
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              try {
                assert.equal(
                  this.preFindOperationSpy.firstCall.args[1].parameters.limit,
                  this.parent.service.endpoints.find.findConfig.maxPageSize + 1)
                assert.equal(
                  this.findSpy.firstCall.args[0].limit,
                  this.parent.service.endpoints.find.findConfig.maxPageSize)
              } finally {
                this.findSpy.restore()
                this.preFindOperationSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  limit: this.parent.service.endpoints.find.findConfig.maxPageSize + 1
                },
                headers: {
                  'x-pong': ejson.stringify({
                    find: _.map(_.range(this.parent.service.endpoints.find.findConfig.maxPageSize) + 1, function(n) {
                      return {[context.global.idParameterName]: n.toString(), foo: 'bar'}
                    })
                  })
                }
              }
            },
            resSpec: {
              statusCode: 500
            }
          },
          {
            name: 'pageSizeTest',
            description: 'Test pageSize is enforced',
            setup: function() {
              this.preFindOperationSpy = sinon.spy(this.parent.service.endpoints.find, 'preFindOperation')
              this.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              try {
                assert.equal(
                  this.preFindOperationSpy.firstCall.args[1].parameters.pageSize, 5)
                assert.equal(
                  this.findSpy.firstCall.args[0].limit, 5)
              } finally {
                this.findSpy.restore()
                this.preFindOperationSpy.restore()
              }
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  pageSize: 5
                },
                headers: {
                  'x-pong': ejson.stringify({
                    find: _.map(_.range(5), function(n) {
                      return {[context.global.idParameterName]: n.toString(), foo: 'bar'}
                    })
                  })
                }
              }
            },
            resSpec: {
              statusCode: 200
            }
          },
        ]
      }),
      o({
        _type: carbond.test.ServiceTest,
        name: 'CustomConfigParameterTests',
        service: o({
          _type: pong.Service,
          endpoints: {
            find: o({
              _type: pong.Collection,
              idGenerator: pong.util.collectionIdGenerator,
              enabled: {find: true},
              findConfig: {
                parameters: {
                  $merge: {
                    foo: {
                      location: 'header',
                      schema: {
                        type: 'number',
                        minimum: 0,
                        multipleOf: 2
                      }
                    }
                  }
                }
              }
            })
          }
        }),
        setup: function(context) {
          carbond.test.ServiceTest.prototype.setup.apply(this, arguments)
          context.global.idParameterName = this.service.endpoints.find.idParameterName
        },
        teardown: function(context) {
          delete context.global.idParameterName
          carbond.test.ServiceTest.prototype.teardown.apply(this, arguments)
        },
        tests: [
          o({
            _type: testtube.Test,
            name: 'FindConfigCustomParameterInitializationTest',
            doTest: function(context) {
              let findOperation = this.parent.service.endpoints.find.get
              assert.deepEqual(findOperation.parameters, {
                foo: {
                  name: 'foo',
                  location: 'header',
                  description: undefined,
                  schema: {type: 'number', minimum: 0, multipleOf: 2},
                  required: false,
                  default: undefined
                },
                [context.global.idParameterName]: {
                  name: context.global.idParameterName,
                  location: 'query',
                  description: carbond.collections.FindConfig._STRINGS.parameters.idParameterDefinition.description,
                  schema: {
                    oneOf: [
                      {type: 'string'},
                      {type: 'array', items: {type: 'string'}}
                    ]
                  },
                  required: false,
                  default: undefined
                }
              })
            }
          }),
          {
            name: 'FindConfigCustomParameterPassedViaOptionsFailTest',
            setup: function(context) {
              context.local.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              assert.equal(context.local.findSpy.called, false)
              context.local.findSpy.restore()
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                headers: {
                  'x-pong': ejson.stringify({
                    find: [{[context.global.idParameterName]: '0', foo: 'bar'}]
                  }),
                  foo: 3
                }
              }
            },
            resSpec: {
              statusCode: 400
            }
          },
          {
            name: 'FindConfigCustomParameterPassedViaOptionsSuccessTest',
            setup: function(context) {
              context.local.findSpy = sinon.spy(this.parent.service.endpoints.find, 'find')
            },
            teardown: function(context) {
              assert.equal(context.local.findSpy.firstCall.args[0].foo, 4)
              context.local.findSpy.restore()
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                headers: {
                  'x-pong': ejson.stringify({
                    find: [{[context.global.idParameterName]: '0', foo: 'bar'}]
                  }),
                  foo: 4
                }
              }
            },
            resSpec: {
              statusCode: 200
            }
          }
        ]
      }),
      o({
        _type: carbond.test.ServiceTest,
        name: 'HookAndHandlerContextTests',
        service: o({
          _type: carbond.Service,
          endpoints: {
            find: o({
              _type: carbond.collections.Collection,
              enabled: {find: true},
              preFindOperation: function(config, req, res, context) {
                context.preFindOperation = 1
                return carbond.collections.Collection.prototype.preFindOperation.apply(this, arguments)
              },
              preFind: function(options, context) {
                context.preFind = 1
                return carbond.collections.Collection.prototype.preFind.apply(this, arguments)
              },
              find: function(options, context) {
                context.find = 1
                return [{[this.idParameterName]: '0'}]
              },
              postFind: function(result, options, context) {
                context.postFind = 1
                return carbond.collections.Collection.prototype.postFind.apply(this, arguments)
              },
              postFindOperation: function(result, config, req, res, context) {
                context.postFindOperation = 1
                res.set('context', ejson.stringify(context))
                return carbond.collections.Collection.prototype.postFindOperation.apply(this, arguments)
              }
            })
          }
        }),
        tests: [
          {
            reqSpec: {
              url: '/find',
              method: 'GET'
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert.deepEqual(ejson.parse(headers.context), {
                  preFindOperation: 1,
                  preFind: 1,
                  find: 1,
                  postFind: 1,
                  postFindOperation: 1
                })
              }
            }
          }
        ]
      })
    ]
  })
})


