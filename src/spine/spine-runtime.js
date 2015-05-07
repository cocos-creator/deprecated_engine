(function () {
    var SpineRuntime = {};
    Fire._Runtime.Spine = SpineRuntime;

    function createSkeleton (target, skeletonData) {
        var node = new sp.Skeleton();
        if (skeletonData) {
            node.setSkeletonData(skeletonData, null);
        }
        node.setLocalZOrder(-1);
        node.setDebugSolots(target.debugSlots);
        node.setDebugBones(target.debugBones);
        node.setTimeScale(target.timeScale);
        return node;
    }

    SpineRuntime.createSkeleton = function (target) {
        var rc = Engine._renderContext;
        var skeletonData = target.skeletonData && target.skeletonData.getSkeletonData();
        //var atlas = rc.skeletonData.atlasAsset.getAtlas();
        var node;
        rc.game.setEnvironment();
        node = createSkeleton(target, skeletonData);
        target._renderObj = node;
        target.entity._ccNode.addChild(node);

        // @ifdef EDITOR
        if (rc.sceneView) {
            rc.sceneView.game.setEnvironment();
            node = createSkeleton(target, skeletonData);
            target._renderObjInScene = node;
            target.entity._ccNodeInScene.addChild(node);
        }
        // @endif
    };

    SpineRuntime.updateSkeletonData = function (target) {
        Engine._renderContext.remove(target);
        this.createSkeleton(Engine._renderContext, target);
    };

    SpineRuntime.updateSkeletonDebug = function (target) {
        var node = target._renderObj;
        Engine._renderContext.game.setEnvironment();
        node.setDebugSolots(target.debugSlots);
        node.setDebugBones(target.debugBones);
        // @ifdef EDITOR
        node = target._renderObjInScene;
        if (node) {
            Engine._renderContext.sceneView.game.setEnvironment();
            node.setDebugSolots(target.debugSlots);
            node.setDebugBones(target.debugBones);
        }
        // @endif
    };

    SpineRuntime.updateSkeletonTimeScale = function (target) {
        var node = target._renderObj;
        Engine._renderContext.game.setEnvironment();
        node.setTimeScale(target.timeScale);
        // @ifdef EDITOR
        node = target._renderObjInScene;
        if (node) {
            Engine._renderContext.sceneView.game.setEnvironment();
            node.setTimeScale(target.timeScale);
        }
        // @endif
    };

    // create proxy set methods
    var MethodNames = ['setBonesToSetupPose', 'setSlotsToSetupPose', 'setSkin', 'setAttachment'];
    MethodNames.forEach(function (methodName) {
        SpineRuntime[methodName] = function (target, p1, p2) {
            var node = target._renderObj;
            var method = node[methodName];
            Engine._renderContext.game.setEnvironment();
            method.call(node, p1, p2);
            // @ifdef EDITOR
            node = target._renderObjInScene;
            if (node) {
                Engine._renderContext.sceneView.game.setEnvironment();
                method.call(node);
            }
            // @endif
        };
    });

    // create proxy get methods
    MethodNames = ['findBone', 'findSlot', 'getAttachment'];
    MethodNames.forEach(function (methodName) {
        SpineRuntime[methodName] = function (target, p1, p2) {
            var node = target._renderObj;
            var method = node[methodName];
            return method.call(node, p1, p2);
        };
    });

    SpineRuntime.getWorldSize = function (target) {
        var rect = target._renderObj.getBoundingBox();
        return rect.size;
    };
})();
