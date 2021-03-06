var _ = require('lodash')

var _o = require('@carbon-io/carbon-core').bond._o(module)
var oo = require('@carbon-io/carbon-core').atom.oo(module)

var InsertConfig = require('../collections/InsertConfig')

var STRINGS = {}

/***************************************************************************************************
 * @class MongoDBInsertConfig
 */
var MongoDBInsertConfig = oo({
  /*****************************************************************************
   * _type
   */
  _type: InsertConfig,
  _ctorName: 'MongoDBInsertConfig',

  /*****************************************************************************
   * @constructs MongoDBInsertConfig
   * @description The MongoDB insert operation config
   * @memberof carbond.mongodb
   * @extends carbond.collections.InsertConfig
   * @mixes carbond.mongodb.MongoDBCollectionOperationConfig
   */
  _C: function() {

    /***************************************************************************
     * @property {object.<string, *>} driverOptions
     * @description Options to be passed to the mongodb driver (XXX: link to leafnode docs)
     * @default {}
     */
    this.driverOptions = {}
  }
})

Object.defineProperty(MongoDBInsertConfig, '_STRINGS', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: STRINGS
})

module.exports = MongoDBInsertConfig
