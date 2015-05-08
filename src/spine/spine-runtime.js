(function () {
    var SpineRuntime = {};
    Fire._Runtime.Spine = SpineRuntime;

    // skeletonData 必须不为空，否则 cocos update 时会报错
    function createSkeleton (target, skeletonData) {
        var node = new sp.Skeleton();
        node.setAnchorPoint(0, 0);
        node.setLocalZOrder(-1);
        node.setSkeletonData(skeletonData, null);
        if (target.initialSkinName) {
            try {
                node.setSkin(target.initialSkinName);
            }
            catch (e) {
                Fire.error(e);
            }
        }
        node.setTimeScale(target.timeScale);
        return node;
    }

    SpineRuntime.createSkeleton = function (target) {
        var skeletonData = target.skeletonData && target.skeletonData.getSkeletonData();
        if (!skeletonData) {
            return;
        }
        var rc = Engine._renderContext;
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
            node.setDebugSolots(target.debugSlots);
            node.setDebugBones(target.debugBones);
            target._renderObjInScene = node;
            target.entity._ccNodeInScene.addChild(node);
        }
        // @endif
    };

    SpineRuntime.updateSkeletonData = function (target) {
        Engine._renderContext.remove(target);
        this.createSkeleton(target);
    };

    SpineRuntime.updateSkeletonDebug = function (target) {
        // @ifdef EDITOR
        var node = target._renderObjInScene;
        if (node) {
            Engine._renderContext.sceneView.game.setEnvironment();
            node.setDebugSolots(target.debugSlots);
            node.setDebugBones(target.debugBones);
        }
        // @endif
    };

    SpineRuntime.updateSkeletonTimeScale = function (target) {
        var node = target._renderObj;
        if (!node) {
            return;
        }
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
            if (!node) {
                return;
            }
            var method = node[methodName];
            Engine._renderContext.game.setEnvironment();
            method.call(node, p1, p2);
            // @ifdef EDITOR
            node = target._renderObjInScene;
            if (node) {
                Engine._renderContext.sceneView.game.setEnvironment();
                method.call(node, p1, p2);
            }
            // @endif
        };
    });

    // create proxy get methods
    MethodNames = ['findBone', 'findSlot', 'getAttachment'];
    MethodNames.forEach(function (methodName) {
        SpineRuntime[methodName] = function (target, p1, p2) {
            var node = target._renderObj;
            if (!node) {
                return;
            }
            var method = node[methodName];
            return method.call(node, p1, p2);
        };
    });

    SpineRuntime.getWorldSize = function (target) {
        var node = target._renderObj;
        if (!node) {
            return Fire.Vec2.zero;
        }
        var rect = node.getBoundingBox();
        return new Fire.Vec2(rect.width, rect.height);
    };
})();
