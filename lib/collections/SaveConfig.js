var _ = require('lodash')

var oo = require('@carbon-io/carbon-core').atom.oo(module)

var STRINGS = {
  parameters: {
    objects: {
      description: 'Object(s) to save'
    }
  }
}

/******************************************************************************
 * @class SaveConfig
 */
var SaveConfig = oo({

  /**********************************************************************
   * _type
   */
  _type: './CollectionOperationConfig',
  _ctorName: 'SaveConfig',

  /**********************************************************************
   * @constructs SaveConfig
   * @description The save operation config
   * @memberof carbond.collections
   * @extends carbond.collections.CollectionOperationConfig
   */
  _C: function() {
    // NOTE: there is no "supportsUpsert" here because replacing the collection
    //       will always be an "update"

    /***************************************************************************
     * @property {Object} [schema]
     * @description The schema used to validate the request body. If this is undefined, the
     *              collection level schema (adapted for arrays) will be used.
     */
    this.schema = undefined

    /***************************************************************************
     * @property {boolean} [returnsSavedObjects=true]
     * @description Whether or not the HTTP layer returns the objects saved in the response
     */
    this.returnsSavedObjects = true

    // XXX: no need for maxBulkSave since no Location header

    /***************************************************************************
     * @property {object.<string, carbond.OperationParameter>} parameters
     * @description Add "save" specific parameters
     * @property {carbond.OperationParameter} parameters.objects
     * @description The objects parameter definition
     * @extends carbond.collections.CollectionOperationConfig.parameters
     */
    this.parameters = _.assignIn(this.parameters, {
      objects: {
        description: STRINGS.parameters.objects.description,
        location: 'body',
        required: true,
        schema: undefined
      }
    })
  }
})

Object.defineProperty(SaveConfig, '_STRINGS', {
  configurable: false,
  enumerable: false,
  writable: false,
  value: STRINGS
})

module.exports = SaveConfig
