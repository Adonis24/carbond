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
var getObjectId = pong.util.getObjectId
var config = require('../Config')
var MongoDBCollectionHttpTest = require('./MongoDBCollectionHttpTest')

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
        _type: MongoDBCollectionHttpTest,
        name: 'DefaultConfigFindTests',
        service: o({
          _type: pong.Service,
          dbUri: config.MONGODB_URI + '/find',
          endpoints: {
            find: o({
              _type: pong.MongoDBCollection,
              enabled: {find: true},
              collectionName: 'find'
            })
          }
        }),
        fixture: {
          find: [
            {_id: getObjectId(0), foo: 'bar', bar: 9},
            {_id: getObjectId(1), bar: 'baz', bar: 3},
            {_id: getObjectId(2), baz: 'yaz', bar: 5}
          ]
        },
        tests: [
          {
            name: 'HeadTest',
            description: 'Test HEAD method',
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'HEAD',
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
            name: 'FindTest',
            description: 'Test find',
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepEqual(body, this.parent.fixture.find)
              }
            }
          },
          {
            name: 'FindIdQueryTest',
            description: 'Test find with id query',
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  _id: [getObjectId(0).toString(), getObjectId(1).toString()]
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepEqual(body, this.parent.fixture.find.slice(0, 2))
              }
            }
          },
          {
            name: 'FindPageSkipAndLimitParametersEnabledByDefaultTest',
            description: 'Test find',
            setup: function() {
              this.parent.populateDb({
                find: _.map(
                  _.range(this.parent.service.endpoints.find.findConfig.pageSize * 2),
                  function() { return {foo: 'bar'} }
                )
              })
            },
            teardown: function() {
              this.parent.populateDb()
            },
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  skip: 1,
                  limit: 1,
                  page: 1
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert.equal(
                  headers.link,
                  '<http://localhost:8888/find?page=0&skip=1&limit=1>; rel="prev", ' +
                  '<http://localhost:8888/find?page=2&skip=1&limit=1>; rel="next"')
              },
              body: function(body, context) {
                assert.deepEqual(body, [
                  {_id: getObjectId(51), foo: 'bar'}
                ])
              }
            }
          },
          {
            name: 'FindQueryTest',
            description: 'Test find with query',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                query: {
                  bar: {$gt: 5}
                },
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepEqual(body, this.parent.fixture.find.slice(0, 1))
              }
            }

          },
          {
            name: 'FindQueryAndIdQueryTest',
            description: 'Test find with query and id query parameters',
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  _id: [getObjectId(0).toString(), getObjectId(1).toString()],
                  query: {bar: {$lt: 10}}
                }
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepEqual(body, this.parent.fixture.find.slice(0, 2))
              }
            }
          },
          {
            name: 'FindSortTest',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                sort: {bar: 1},
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepEqual(body, _.sortBy(this.parent.fixture.find, function(object) {
                  return object.bar
                }))
              }
            }
          },
          {
            name: 'FindProjectionTest',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                projection: {foo: 1},
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepEqual(
                  body,
                  _.map(this.parent.fixture.find, _.partialRight(_.pick, ['_id', 'foo'])))
              }
            }
          },
        ]
      }),
      o({
        _type: MongoDBCollectionHttpTest,
        name: 'PaginationFindTests',
        service: o({
          _type: pong.Service,
          dbUri: config.MONGODB_URI + '/find',
          endpoints: {
            find: o({
              _type: pong.MongoDBCollection,
              enabled: {find: true},
              collectionName: 'find',
              findConfig: {
                pageSize: 4,
                maxPageSize: 8
              }
            })
          }
        }),
        fixture: {
          find: function() {
            return _.map(_.range(20), function(i) {
              return {_id: getObjectId(i), foo: 'bar', bar: i}
            })
          }
        },
        tests: [
          {
            name: 'FindBasicPagingTest',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                page: 2
              }
            },
            resSpec: {
              statusCode: 200,
              body: function(body) {
                assert.deepEqual(body, _.map(_.range(8, 12), function(i) {
                  return {_id: getObjectId(i), foo: 'bar', bar: i}
                }))
              }
            }
          },
          {
            name: 'FindPageAndLimitTest',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                page: 2,
                limit: 8
              }
            },
            resSpec: {
              statusCode: 200,
              body: function(body) {
                assert.deepEqual(body, _.map(_.range(8, 16), function(i) {
                  return {_id: getObjectId(i), foo: 'bar', bar: i}
                }))
              }
            }
          },
          {
            name: 'FindPageSizeTest',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                page: 2,
                pageSize: 2
              }
            },
            resSpec: {
              statusCode: 200,
              body: function(body) {
                assert.deepEqual(body, _.map(_.range(4, 6), function(i) {
                  return {_id: getObjectId(i), foo: 'bar', bar: i}
                }))
              }
            }
          },
          {
            name: 'FindPageSizeMaxPageSizeEnforcedOnPageSizeTest',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                page: 1,
                pageSize: 10
              }
            },
            resSpec: {
              statusCode: 200,
              body: function(body) {
                assert.deepEqual(body, _.map(_.range(8, 16), function(i) {
                  return {_id: getObjectId(i), foo: 'bar', bar: i}
                }))
              }
            }
          },
          {
            name: 'FindPageSizeMaxPageSizeEnforcedOnLimitTest',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                page: 1,
                limit: 10
              }
            },
            resSpec: {
              statusCode: 200,
              body: function(body) {
                assert.deepEqual(body, _.map(_.range(4, 12), function(i) {
                  return {_id: getObjectId(i), foo: 'bar', bar: i}
                }))
              }
            }
          },
          {
            name: 'FindPageAndSkipTest',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                page: 2,
                skip: 10
              }
            },
            resSpec: {
              statusCode: 200,
              body: function(body) {
                assert.deepEqual(body, _.map(_.range(18, 20), function(i) {
                  return {_id: getObjectId(i), foo: 'bar', bar: i}
                }))
              }
            }
          },
        ]
      }),
      o({
        _type: MongoDBCollectionHttpTest,
        name: 'NoIdQueryConfigFindTests',
        service: o({
          _type: pong.Service,
          dbUri: config.MONGODB_URI + '/find',
          endpoints: {
            find: o({
              _type: pong.MongoDBCollection,
              enabled: {find: true},
              collectionName: 'find',
              findConfig: {
                supportsIdQuery: false
              }
            })
          }
        }),
        fixture: {
          find: [
            {_id: getObjectId(0), foo: 'bar'},
            {_id: getObjectId(1), bar: 'baz'},
            {_id: getObjectId(2), baz: 'yaz'}
          ]
        },
        tests: [
          {
            name: 'idQueryIgnoredTest',
            description: 'Test that the id query parameter is ignored',
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {_id: getObjectId(0)}
              }
            },
            resSpec: {
              statusCode: 200,
              body: function(body, context) {
                assert.deepEqual(body, this.parent.fixture.find)
              }
            }
          }
        ]
      }),
      o({
        _type: MongoDBCollectionHttpTest,
        name: 'PageOverridesSkipAndLimitDisabledConfigFindTests',
        service: o({
          _type: pong.Service,
          dbUri: config.MONGODB_URI + '/find',
          endpoints: {
            find: o({
              _type: pong.MongoDBCollection,
              enabled: {find: true},
              collectionName: 'find',
              findConfig: {
                supportsSkipAndLimit: false
              }
            })
          }
        }),
        fixture: {
          find: [
            {_id: getObjectId(0), foo: 'bar'},
            {_id: getObjectId(1), bar: 'baz'},
            {_id: getObjectId(2), baz: 'yaz'}
          ]
        },
        tests: [
          {
            name: 'skipAndLimitTest',
            description: 'Test that skip and limit parameters are honored',
            reqSpec: function(context) {
              return {
                url: '/find',
                method: 'GET',
                parameters: {
                  skip: 1,
                  limit: 1
                },
              }
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert.equal(headers.link, '<http://localhost:8888/find?page=1&skip=1&limit=1>; rel="next"')
              },
              body: function(body, context) {
                assert.deepEqual(body, this.parent.fixture.find.slice(1,2))
              }
            }
          },
        ]
      }),
      o({
        _type: MongoDBCollectionHttpTest,
        name: 'PageDisabledSkipAndLimitStillEnabledConfigFindTests',
        service: o({
          _type: pong.Service,
          dbUri: config.MONGODB_URI + '/find',
          endpoints: {
            find: o({
              _type: pong.MongoDBCollection,
              enabled: {find: true},
              collectionName: 'find',
              findConfig: {
                supportsPagination: false
              }
            })
          }
        }),
        fixture: {
          find: [
            {_id: getObjectId(0), foo: 'bar'},
            {_id: getObjectId(1), bar: 'baz'},
            {_id: getObjectId(2), baz: 'yaz'}
          ]
        },
        tests: [
          {
            name: 'skipAndLimitTest',
            description: 'Test that skip and limit parameters are honored',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                skip: 1,
                limit: 1
              },
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepEqual(body, this.parent.fixture.find.slice(1, 2))
              }
            }
          },
          {
            name: 'pageNotHonoredTest',
            description: 'Test that page parameter is not honored',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                page: 1,
                skip: 1,
                limit: 1
              },
            },
            resSpec: {
              statusCode: 200,
              headers: function(headers) {
                assert(_.isNil(headers.link))
              },
              body: function(body, context) {
                assert.deepEqual(body, this.parent.fixture.find.slice(1, 2))
              }
            }
          }
        ]
      }),
      o({
        _type: MongoDBCollectionHttpTest,
        name: 'QuerySchemaConfigFindTests',
        service: o({
          _type: pong.Service,
          dbUri: config.MONGODB_URI + '/find',
          endpoints: {
            find: o({
              _type: pong.MongoDBCollection,
              enabled: {find: true},
              collectionName: 'find',
              querySchema: {
                type: 'object',
                properties: {
                  foo: {
                    type: 'string'
                  }
                },
                required: ['foo'],
                additionalProperties: false
              }
            }),
            find1: o({
              _type: pong.MongoDBCollection,
              enabled: {find: true},
              collectionName: 'find',
              findConfig: {
                '$parameters.query.schema': {
                  type: 'object',
                  properties: {
                    foo: {
                      type: 'string'
                    }
                  },
                  required: ['foo'],
                  additionalProperties: false
                }
              }
            }),
            find2: o({
              _type: pong.MongoDBCollection,
              enabled: {find: true},
              collectionName: 'find',
              querySchema: {
                type: 'object',
                properties: {
                  foo: {
                    type: 'string'
                  }
                },
                required: ['foo'],
                additionalProperties: false
              },
              findConfig: {
                '$parameters.query.schema': {
                  type: 'object',
                  properties: {
                    bar: {
                      type: 'string'
                    }
                  },
                  required: ['bar'],
                  additionalProperties: false
                }
              }
            })
          }
        }),
        fixture: {
          find: [
            {_id: getObjectId(0), foo: 'bar'},
            {_id: getObjectId(1), bar: 'baz'},
            {_id: getObjectId(2), baz: 'yaz'}
          ]
        },
        tests: [
          o({
            _type: testtube.Test,
            name: 'CollectionQuerySchemaOverrideTest',
            doTest: function() {
              assert.deepEqual(this.parent.service.endpoints.find2.get.parameters.query.schema, {
                type: 'object',
                properties: {
                  foo: {
                    type: 'string'
                  }
                },
                required: ['foo'],
                additionalProperties: false
              })
            }
          }),
          {
            name: 'CollectionQuerySchemaFailTest',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                query: {bar: 'baz'}
              },
            },
            resSpec: {
              statusCode: 400
            }
          },
          {
            name: 'CollectionQuerySchemaSuccessTest',
            reqSpec: {
              url: '/find',
              method: 'GET',
              parameters: {
                query: {foo: 'bar'}
              },
            },
            resSpec: {
              statusCode: 200,
              body: [{_id: getObjectId(0), foo: 'bar'}]
            }
          },
          {
            name: 'ConfigQuerySchemaFailTest',
            setup: function(context) {
              this.history = context.httpHistory
            },
            reqSpec: function() {
              return _.assign(this.history.getReqSpec('CollectionQuerySchemaFailTest'),
                              {url: '/find1'})
            },
            resSpec: {
              $property: {
                get: function() { return this.history.getResSpec('CollectionQuerySchemaFailTest') }
              }
            }
          },
          {
            name: 'ConfigQuerySchemaSuccessTest',
            setup: function(context) {
              this.history = context.httpHistory
            },
            reqSpec: function() {
              return _.assign(this.history.getReqSpec('CollectionQuerySchemaSuccessTest'),
                              {url: '/find1'})
            },
            resSpec: {
              $property: {
                get: function() { return this.history.getResSpec('CollectionQuerySchemaSuccessTest') }
              }
            }
          },
          {
            name: 'CollectionQuerySchemaOverrideConfigQuerySchemaFailTest',
            setup: function(context) {
              this.history = context.httpHistory
            },
            reqSpec: function() {
              return _.assign(this.history.getReqSpec('CollectionQuerySchemaFailTest'),
                              {url: '/find2'})
            },
            resSpec: {
              $property: {
                get: function() { return this.history.getResSpec('CollectionQuerySchemaFailTest') }
              }
            }
          },
          {
            name: 'CollectionQuerySchemaOverrideConfigQuerySchemaSuccessTest',
            setup: function(context) {
              this.history = context.httpHistory
            },
            reqSpec: function() {
              return _.assign(this.history.getReqSpec('CollectionQuerySchemaSuccessTest'),
                              {url: '/find2'})
            },
            resSpec: {
              $property: {
                get: function() { return this.history.getResSpec('CollectionQuerySchemaSuccessTest') }
              }
            }
          }
        ]
      })
    ]
  })
})
