(function () {
    var SpineRuntime = {};
    Fire._Runtime.Spine = SpineRuntime;

    var AnimEvents = [];
    /**
     * @module Fire.Spine
     * @class Skeleton
     */
    /*
     * @event animation-start
     * @param event
     */
    // TODO 等挪到 builtin 后，把 0 改成 sp.ANIMATION_EVENT_TYPE.START
    AnimEvents[0] = 'animation-start';
    /*
     * @event animation-end
     * @param event
     */
    AnimEvents[/*sp.ANIMATION_EVENT_TYPE.END*/1] = 'animation-end';
    /*
     * @event animation-complete
     * @param event
     */
    AnimEvents[/*sp.ANIMATION_EVENT_TYPE.COMPLETE*/2] = 'animation-complete';
    /*
     * @event animation-event
     * @param event
     */
    AnimEvents[/*sp.ANIMATION_EVENT_TYPE.EVENT*/3] = 'animation-event';

    function animationCallback (ccObj, trackIndex, type, event, loopCount) {
        var eventType = AnimEvents[type];
        var detail = {
            trackIndex: trackIndex
        };
        if (type === sp.ANIMATION_EVENT_TYPE.COMPLETE) {
            detail.loopCount = loopCount;
        }
        else if (type === sp.ANIMATION_EVENT_TYPE.EVENT) {
            detail.event = event;
        }
        //Fire.log("[animationCallback] eventType: %s, time: '%s'", eventType, Fire.Time.time);
        this.entity.emit(eventType, detail);
    }

    // skeletonData 必须不为空，否则 cocos update 时会报错
    function createSkeleton (target, skeletonData, parentNode, isGame) {
        var node;
        var useAnim = target instanceof Skeleton;
        if (useAnim) {
            node = new sp.SkeletonAnimation(skeletonData, null);
            node.setTimeScale(target.timeScale);
            if (isGame) {
                node.setAnimationListener(target, animationCallback);
            }
        }
        else {
            node = new sp.Skeleton(skeletonData, null);
        }

        node.setAnchorPoint(0, 0);
        node.setLocalZOrder(-1);
        if (target.initialSkinName) {
            try {
                node.setSkin(target.initialSkinName);
            }
            catch (e) {
                Fire.error(e);
            }
        }
        if (!isGame) {
            node.setDebugSolots(target.debugSlots);
            node.setDebugBones(target.debugBones);
        }

        parentNode.addChild(node);

        //cc.game.director._runningScene._renderCmd._curLevel = 0;
        //cc.game.director._runningScene.visit();
        //cc.renderer.resetFlag();
        //cc.renderer.rendering(cc.game._renderContext);
        //node._renderCmd._updateChild();

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
        node = createSkeleton(target, skeletonData, target.entity._ccNode, true);
        target._renderObj = node;

        // @ifdef EDITOR
        if (rc.sceneView) {
            rc.sceneView.game.setEnvironment();
            node = createSkeleton(target, skeletonData, target.entity._ccNodeInScene, false);
            target._renderObjInScene = node;
        }

        // fix skeleton not updated immediate
        if (!Engine.isPlaying) {
            Fire._Runtime.animateAfterRender();
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
    var MethodNames = ['setToSetupPose', 'setBonesToSetupPose', 'setSlotsToSetupPose', 'setSkin', 'setAttachment',
                       'setMix', 'setAnimation', 'addAnimation', 'clearTracks', 'clearTrack'];
    MethodNames.forEach(function (methodName) {
        SpineRuntime[methodName] = function (target, p1, p2, p3, p4) {
            var node = target._renderObj;
            if (!node) {
                return;
            }
            var method = node[methodName];
            Engine._renderContext.game.setEnvironment();
            method.call(node, p1, p2, p3, p4);
            // @ifdef EDITOR
            node = target._renderObjInScene;
            if (node) {
                Engine._renderContext.sceneView.game.setEnvironment();
                method.call(node, p1, p2, p3, p4);
            }
            // @endif
        };
    });

    // create proxy get methods
    MethodNames = ['findBone', 'findSlot', 'getAttachment',
                   'getCurrent', ];
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

    SpineRuntime.getLocalBounds = function (target) {
        var node = target._renderObj;
        if (!node) {
            return new Fire.Rect();
        }
        var minX = cc.FLT_MAX, minY = cc.FLT_MAX, maxX = cc.FLT_MIN, maxY = cc.FLT_MIN;
        var vertices = [];
        vertices.length = 8;
        var slots = node._skeleton.slots, VERTEX = sp.VERTEX_INDEX;
        for (var i = 0, slotCount = slots.length; i < slotCount; ++i) {
            var slot = slots[i];
            var attachment = slot.attachment;
            if ( !attachment || attachment.type !== sp.ATTACHMENT_TYPE.REGION ) {
                continue;
            }
            sp._regionAttachment_computeWorldVertices(attachment, slot.skeleton.x, slot.skeleton.y, slot.bone, vertices);
            minX = Math.min(minX, vertices[VERTEX.X1], vertices[VERTEX.X4], vertices[VERTEX.X2], vertices[VERTEX.X3]);
            minY = Math.min(minY, vertices[VERTEX.Y1], vertices[VERTEX.Y4], vertices[VERTEX.Y2], vertices[VERTEX.Y3]);
            maxX = Math.max(maxX, vertices[VERTEX.X1], vertices[VERTEX.X4], vertices[VERTEX.X2], vertices[VERTEX.X3]);
            maxY = Math.max(maxY, vertices[VERTEX.Y1], vertices[VERTEX.Y4], vertices[VERTEX.Y2], vertices[VERTEX.Y3]);
        }
        return new Fire.Rect(minX, minY, maxX - minX, maxY - minY);
    };

    SpineRuntime.sampleAnimation = function (target) {
        var node = target._renderObj;
        if (node) {
            node.update(0);
        }
        node = target._renderObjInScene;
        if (node) {
            node.update(0);
        }
    };

    SpineRuntime.update = function () {
        // @ifdef EDITOR
        Engine._renderContext.game.setEnvironment();
        // @endif
        var dt = Time.deltaTime;
        this._renderObj.update(dt);
        // @ifdef EDITOR
        if (this._renderObjInScene) {
            Engine._renderContext.sceneView.game.setEnvironment();
            this._renderObjInScene.update(dt);
        }
        // @endif
    };
})();
