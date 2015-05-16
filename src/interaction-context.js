/**
 * The InteractionContext contains all the entities which can be interact with.
 * @private
 */
var InteractionContext = (function () {

    var aabbMap = {};   // all axis aligned bounding boxes in current frame, indexed by id
    var obbMap = {};    // all oriented bounding boxes in current frame, indexed by id

    function InteractionContext () {
        this.entities = [];   // array of interactable entities in this context, sorted from back to front
    }

    InteractionContext.prototype._clear = function () {
        this.entities.length = 0;
    };

    /**
     * Pick the top most entity, using their oriented bounding boxes.
     * @param {Vec2} worldPosition
     * @return {Entity}
     */
    InteractionContext.prototype.pick = function (worldPosition) {
        for (var i = this.entities.length - 1; i >= 0; --i) {
            var entity = this.entities[i];
            if (entity.isValid) {
                // aabb test
                var aabb = aabbMap[entity.id];
                if (aabb.contains(worldPosition)) {
                    // obb test
                    var obb = obbMap[entity.id];
                    var polygon = new Fire.Polygon(obb);
                    if (polygon.contains(worldPosition)) {
                        var chackHit = entity.hitTest(worldPosition.x, worldPosition.y);
                        if (chackHit) {
                            return entity;
                        }
                    }
                }
            }
        }
        return null;
    };

    InteractionContext.prototype._updateRecursilvey = function (entity) {
        var renderer = entity.getComponent(Fire.Renderer);
        if (renderer && renderer._enabled) {
            this.entities.push(entity);
            var id = entity.id;
            if ( !obbMap[id] ) {
                var obb = renderer.getWorldOrientedBounds();
                var aabb = Math.calculateMaxRect(new Rect(), obb[0], obb[1], obb[2], obb[3]);
                obbMap[id] = obb;
                aabbMap[id] = aabb;
            }
        }

        for ( var i = 0, len = entity._children.length; i < len; ++i ) {
            var child = entity._children[i];
            if (child._active) {
                this._updateRecursilvey(child);
            }
        }
    };

    InteractionContext.prototype.update = function (entities) {
        // 目前还没有专门处理physics的模块，暂时hack一下
        var newFrame = !Engine.isPlaying || this === Engine._interactionContext;
        if (newFrame) {
            aabbMap = {};
            obbMap = {};
        }

        // clear intersection data
        this._clear();

        // recursively process each entity
        for (var i = 0, len = entities.length; i < len; ++i) {
            var entity = entities[i];
            if (entity._active) {
                this._updateRecursilvey(entity);
            }
        }
    };

    // entity 必须是 entities 里面的
    InteractionContext.prototype.getAABB = function (entity) {
        return aabbMap[entity.id];
    };

    // entity 必须是 entities 里面的
    InteractionContext.prototype.getOBB = function (entity) {
        return obbMap[entity.id];
    };

    return InteractionContext;
})();

Fire._InteractionContext = InteractionContext;
