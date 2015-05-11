/**
 * show error stacks in unit tests
 * @method _throw
 * @param {Error} error
 * @private
 */
Fire._throw = function (error) {
    Fire.error(error.stack || error);
};
