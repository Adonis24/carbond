var _ = require('lodash')

var oo = require('@carbon-io/carbon-core').atom.oo(module)

/******************************************************************************
 * @class CollectionOperationResult
 */
module.exports = oo({
  _ctorName: 'CollectionOperationResult',
  _C: function() {
    this.val = undefined
    this.created = false
  }
})
