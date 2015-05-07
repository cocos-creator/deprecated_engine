var Scene = (function () {

    var Scene = Fire.Class({
        name: "Fire.Scene",
        extends: Asset,

        properties: {
            /**
             * root entities
             * @property entities
             * @type {Entity[]}
             */
            entities: [],

            /**
             * the active camera
             * @property camera
             * @type {Camera}
             */
            camera: null
        }
    });

    ////////////////////////////////////////////////////////////////////
    // traversal operations
    ////////////////////////////////////////////////////////////////////

    var visitOperationTmpl = "if(c._enabled && c._FUNC_) c._FUNC_();";
// @ifdef EDITOR
        visitOperationTmpl =
           "if (c._enabled && c._FUNC_ && " +
           "   (Fire.Engine.isPlaying || Fire.attr(c,'executeInEditMode')) ) {" +
           "    execInTryCatch(c);" +
           "}";
// @endif

    // 当引入DestroyImmediate后，entity和component可能会在遍历过程中变少，需要复制一个新的数组，或者做一些标记
    var visitFunctionTmpl = "\
(function(e){\
	var i, len=e._components.length;\
	for(i=0;i<len;++i){\
		var c=e._components[i];\
		" + visitOperationTmpl + "\
	}\
	var cs=e._children;\
	for(i=0,len=cs.length;i<len;++i){\
		var sub=cs[i];\
		if(sub._active) _FUNC_Recursively(sub);\
	}\
})";

// @ifdef EDITOR
    function execInTryCatch (c) {
        try {
            c._FUNC_();
        }
        catch (e) {
            Fire._throw(e);
        }
    }
    visitFunctionTmpl = "(function () {" +
                            execInTryCatch +
                            "return " + visitFunctionTmpl +
                        "})()";
// @endif

    // jshint evil: true
    var updateRecursively = eval(visitFunctionTmpl.replace(/_FUNC_/g, 'update'));
    var lateUpdateRecursively = eval(visitFunctionTmpl.replace(/_FUNC_/g, 'lateUpdate'));
    var onPreRenderRecursively = eval(visitFunctionTmpl.replace(/_FUNC_/g, 'onPreRender'));
    // jshint evil: false

    Scene.prototype.update = function () {
        // call update
        var entities = this.entities;
        var i = 0, len = entities.length;
        // invoke onStart
        // TODO: 使用一个数组将需要调用的 onStart 存起来，避免递归遍历
        for (; i < len; ++i) {
            Component._invokeStarts(entities[i]);
        }
        // invoke update
        for (i = 0, len = entities.length; i < len; ++i) {
            if (entities[i]._active) {
                updateRecursively(entities[i]);
            }
        }
        // invoke lateUpdate
        for (i = 0, len = entities.length; i < len; ++i) {
            if (entities[i]._active) {
                lateUpdateRecursively(entities[i]);
            }
        }
    };

    /**
     * The default scene rendering operation invoked by runtime.
     * @param {_Runtime.RenderContext} renderContext
     */
    Scene.prototype.render = function (renderContext) {
        Engine._curRenderContext = renderContext;

        // updateTransform
        this.updateTransform(renderContext.camera || this.camera);

        renderContext.onPreRender();

        // call onPreRender
        var entities = this.entities;
        for (var i = 0, len = entities.length; i < len; ++i) {
            if (entities[i]._active) {
                onPreRenderRecursively(entities[i]);
            }
        }

        // render
        renderContext.render();

        Engine._curRenderContext = null;
    };

    ////////////////////////////////////////////////////////////////////
    // other functions
    ////////////////////////////////////////////////////////////////////

    Scene.prototype.updateTransform = function (camera) {
        var entities = this.entities;
        var i, len;
        if (camera) {
            // transform by camera
            var mat = new Matrix23();
            var camPos = new Vec2();
            camera._calculateTransform(mat, camPos);
            var offsetX = -camPos.x;
            var offsetY = -camPos.y;
            for (i = 0, len = entities.length; i < len; ++i) {
                var pos = entities[i].transform._position;
                var x = pos.x;
                var y = pos.y;
                pos.x += offsetX;
                pos.y += offsetY;
                entities[i].transform._updateTransform(mat);
                pos.x = x;
                pos.y = y;
            }
        }
        else {
            // transform
            for (i = 0, len = entities.length; i < len; ++i) {
                entities[i].transform._updateRootTransform();
            }
        }
    };

    Scene.prototype.appendRoot = function (_entity) {
        this.entities.push(_entity);
    };

    Scene.prototype.removeRoot = function (_entity) {
        // TODO: performence test
        var entities = this.entities;
        if (entities.length > 0 && entities[entities.length - 1] === _entity) {
            entities.pop();
            return;
        }
        var index = entities.indexOf(_entity);
        if (index !== -1) {
            entities.splice(index, 1);
        }
        else {
            Fire.error('entity ' + _entity + ' not contains in roots of hierarchy, ' +
                       'is may caused if entity not destroyed immediate before current scene changed');
        }
    };

    Scene.prototype.findEntity = function (path) {
        var nameList = path.split('/');
        var match = null;

        // visit root entities
        var name = nameList[1];     // skip first '/'
        var entities = this.entities;
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].isValid && entities[i]._name === name) {
                match = entities[i];
                break;
            }
        }
        if (!match) {
            return null;
        }

        // parse path
        var n = 2;                  // skip first '/' and roots
        for (n; n < nameList.length; n++) {
            name = nameList[n];
            // visit sub entities
            var children = match._children;
            match = null;
            for (var t = 0, len = children.length; t < len; ++t) {
                var subEntity = children[t];
                if (subEntity.name === name) {
                    match = subEntity;
                    break;
                }
            }
            if (!match) {
                return null;
            }
        }

        return match;
    };

    Scene.prototype.activate = function () {
        // active entities, invoke onLoad and onEnable
        var entities = this.entities;
        var i = 0, len = entities.length;
        for (; i < len; ++i) {
            var entity = entities[i];
            if (entity._active) {
                entity._onActivatedInHierarchy(true);
            }
        }
        if (Engine.isPlaying) {
            // invoke onStart
            for (i = 0, len = entities.length; i < len; ++i) {
                Component._invokeStarts(entities[i]);
            }
        }
    };

    Scene.prototype.destroy = function () {
        var entities = this.entities;
        for (var i = 0, len = entities.length; i < len; ++i) {
            var entity = entities[i];
            if (entity.isValid) {
                if (entity._objFlags & DontDestroy) {
                    Engine._dontDestroyEntities.push(entity);
                }
                else {
                    entity.destroy();
                }
            }
        }
        Asset.prototype.destroy.call(this);
    };

    return Scene;
})();

Fire._Scene = Scene;
