var Renderer = (function () {

    var tmpMat23 = new Matrix23();
    var tmpVec2_0 = new Vec2();
    var tmpVec2_1 = new Vec2();
    var tmpVec2_2 = new Vec2();
    var tmpVec2_3 = new Vec2();

    /**
     * The base for all renderer
     * @class Renderer
     * @extends HashObject
     * @constructor
     */
    var Renderer = Fire.Class({
        name: "Fire.Renderer",
        extends: Component,
        constructor: function () {
            RenderContext.initRenderer(this);
        },
        properties:{

        },

        /**
         * Returns a "world" axis aligned bounding box(AABB) of the renderer.
         *
         * @method getWorldBounds
         * @param {Rect} [out] - optional, the receiving rect
         * @return {Rect} - the rect represented in world position
         */
        getWorldBounds: function (out) {
            var worldMatrix = this.entity.transform.getLocalToWorldMatrix();
            this._doGetOrientedBounds(worldMatrix, tmpVec2_0, tmpVec2_1, tmpVec2_2, tmpVec2_3);
            out = out || new Rect();
            Math.calculateMaxRect(out, tmpVec2_0, tmpVec2_1, tmpVec2_2, tmpVec2_3);
            return out;
        },

        /**
         * Returns a "world" oriented bounding box(OBB) of the renderer.
         *
         * @method getWorldOrientedBounds
         * @param {Vec2} [out_bl] - optional, the vector to receive the world position of bottom left
         * @param {Vec2} [out_tl] - optional, the vector to receive the world position of top left
         * @param {Vec2} [out_tr] - optional, the vector to receive the world position of top right
         * @param {Vec2} [out_br] - optional, the vector to receive the world position of bottom right
         * @return {Vec2} - the array contains vectors represented in world position,
         *                    in the sequence of BottomLeft, TopLeft, TopRight, BottomRight
         */
        getWorldOrientedBounds: function (out_bl, out_tl, out_tr, out_br){
            out_bl = out_bl || new Vec2(0, 0);
            out_tl = out_tl || new Vec2(0, 0);
            out_tr = out_tr || new Vec2(0, 0);
            out_br = out_br || new Vec2(0, 0);
            var worldMatrix = this.entity.transform.getLocalToWorldMatrix();
            this._doGetOrientedBounds(worldMatrix, out_bl, out_tl, out_tr, out_br);
            return [out_bl, out_tl, out_tr, out_br];
        },

        /**
         * !#zh 返回表示 renderer 的 width/height/pivot/skew/shear 等变换的 matrix，
         * 这些变换不影响子物体，getLocalToWorldMatrix 返回的变换会影响子物体。
         *
         * @method getSelfMatrix
         * @param {Matrix23} out - the receiving matrix
         */
        getSelfMatrix: function (out) { },

        /**
         * @method getWorldSize
         * @return {Vec2}
         */
        getWorldSize: function () {
            return new Vec2(0, 0);
        },

        /**
         * @method onPreRender
         */
        onPreRender: function () {
            Engine._curRenderContext.updateTransform(this, this.transform._worldTransform);
        },

        _doGetOrientedBounds: function (mat, bl, tl, tr, br) {
            var size = this.getWorldSize();
            var width = size.x;
            var height = size.y;

            this.getSelfMatrix(tmpMat23);
            mat = tmpMat23.prepend(mat);

            // transform rect(0, 0, width, height) by matrix
            var tx = mat.tx;
            var ty = mat.ty;
            var xa = mat.a * width;
            var xb = mat.b * width;
            var yc = mat.c * -height;
            var yd = mat.d * -height;

            tl.x = tx;
            tl.y = ty;
            tr.x = xa + tx;
            tr.y = xb + ty;
            bl.x = yc + tx;
            bl.y = yd + ty;
            br.x = xa + yc + tx;
            br.y = xb + yd + ty;
        },

        onEnable: function () {
            Engine._renderContext.show(this, true);
        },

        onDisable: function () {
            Engine._renderContext.show(this, false);
        },

        onDestroy: function () {
            Engine._renderContext.remove(this);
        }

        ///**
        // * Returns a "local" axis aligned bounding box(AABB) of the renderer.
        // * The returned box is relative only to its parent.
        // *
        // * @function Fire.Renderer#getLocalBounds
        // * @param {Rect} [out] - optional, the receiving rect
        // * @return {Rect}
        // */
        //Renderer.prototype.getLocalBounds = function (out) {
        //    Fire.warn('interface not yet implemented');
        //    return new Fire.Rect();
        //};
    });

    Fire.executeInEditMode(Renderer)

    return Renderer;
})();

Fire.Renderer = Renderer;
