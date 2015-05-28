// cocos-particle-system
(function () {
    var ParticleRuntime = {};
    Fire._Runtime.CocosParticleSystem = ParticleRuntime;

    ParticleRuntime.reset = function (target) {
        var node = target._renderObj;
        Engine._renderContext.game.setEnvironment();
        node.resetSystem();
        // @ifdef EDITOR
        node = target._renderObjInScene;
        if (node) {
            Engine._renderContext.sceneView.game.setEnvironment();
            node.resetSystem();
        }
        if (!Engine.isPlaying) {
            // fix not cleared immediate
            Fire._Runtime.animateInNextTick();
        }
        // @endif
    };

    ParticleRuntime.stop = function (target) {
        var node = target._renderObj;
        Engine._renderContext.game.setEnvironment();
        node.stopSystem();
        // @ifdef EDITOR
        node = target._renderObjInScene;
        if (node) {
            Engine._renderContext.sceneView.game.setEnvironment();
            node.stopSystem();
        }
        // @endif
    };

    ParticleRuntime.emptyTexture = null;

    var MethodNames = {
        setColor: "updateColor",
        setOther: "updateOther",
        setGravityMode: "updateRadiusMode",
        setRadiusMode: "updateGravityMode",
        setMain: "updateMain"
    };

    for (var key in MethodNames) {
        (function (key) {
            ParticleRuntime[key] = function (target) {
                var node = target._renderObj;
                var method = MethodNames[key];
                Engine._renderContext.game.setEnvironment();
                ParticleRuntime[method].call(ParticleRuntime, target, node);
                // @ifdef EDITOR
                node = target._renderObjInScene;
                if (node) {
                    Engine._renderContext.sceneView.game.setEnvironment();
                    ParticleRuntime[method].call(ParticleRuntime, target, node);
                }
                // @endif
            };
        })(key);
    }

    // 设置图片
    ParticleRuntime.getTexture = function (sprite) {
        if (! sprite) {
            return null;
        }
        return Engine._renderContext.createCCTexture2D(sprite);
    };

    // 颜色属性
    ParticleRuntime.updateColor = function (target, emitter) {
        // 粒子初始颜色
        emitter.setStartColor(target.startColor.toCCColor());
        // 粒子初始颜色变化范围
        emitter.setStartColorVar(target.startColorVar.toCCColor());
        // 粒子结束颜色
        emitter.setEndColor(target.endColor.toCCColor());
        // 粒子结束颜色变化范围
        emitter.setEndColorVar(target.endColorVar.toCCColor());
    };
    // 其他属性
    ParticleRuntime.updateOther = function (target, emitter) {
        // 粒子的生存时间
        emitter.setLife(target.life);
        // 粒子生命变化范围
        emitter.setLifeVar(target.lifeVar);
        // 粒子的初始大小
        emitter.setStartSize(target.startSize);
        // 粒子初始大小的变化范围
        emitter.setStartSizeVar(target.startSizeVar);
        // 粒子结束时的大小，-1表示和初始大小一致
        emitter.setEndSize(target.endSize);
        // 粒子结束大小的变化范围
        emitter.setEndSizeVar(target.endSizeVar);
        // 粒子角度
        emitter.setAngle(target.angle);
        // 粒子角度变化范围
        emitter.setAngleVar(target.angleVar);
        // 粒子开始自旋角度
        emitter.setStartSpin(target.startSpin);
        // 粒子开始自旋角度变化范围
        emitter.setStartSpinVar(target.startSpinVar);
        // 粒子结束自旋角度
        emitter.setEndSpin(target.endSpin);
        // 粒子结束自旋角度变化范围
        emitter.setEndSpinVar(target.endSpinVar);
        // 粒子位置类型
        emitter.setPositionType(target.positionType);
        // 发射器位置的变化范围（横向和纵向）
        emitter.setPosVar(cc.p(target.positionVar.x, target.positionVar.y));
    };
    // 更新半径模式属性
    ParticleRuntime.updateRadiusMode = function (target, emitter) {
        // 初始半径
        emitter.setStartRadius(target.startRadius);
        // 初始半径变化范围
        emitter.setStartRadiusVar(target.startRadiusVar);
        // 粒子每秒围绕起始点的旋转角度
        emitter.setRotatePerSecond(target.rotatePerSecond);
        // 粒子每秒围绕起始点的旋转角度变化范围
        emitter.setRotatePerSecondVar(target.rotatePerSecondVar);
        // 结束半径
        emitter.setEndRadius(target.endRadius);
        // 结束半径变化范围
        emitter.setEndRadiusVar(target.endRadiusVar);
    };
    // 更新重力模式属性
    ParticleRuntime.updateGravityMode = function (target, emitter) {
        // 重力
        emitter.setGravity(new cc.Point(target.gravity.x, target.gravity.y));
        // 速度
        emitter.setSpeed(target.speed);
        // 速度变化范围
        emitter.setSpeedVar(target.speedVar);
        // 粒子径向加速度，即平行于重力方向的加速度
        emitter.setRadialAccel(target.radialAccel);
        // 粒子径向加速度变化范围
        emitter.setRadialAccelVar(target.radialAccelVar);
        // 粒子切向加速度，即垂直于重力方向的加速度
        emitter.setTangentialAccel(target.tangentialAccel);
        // 粒子切向加速度变化范围
        emitter.setTangentialAccelVar(target.tangentialAccelVar);
    };
    // 更新主要属性
    ParticleRuntime.updateMain = function (target, emitter) {
        // 总粒子
        emitter.setTotalParticles(target.totalParticles);
        // 纹理
        emitter.texture = this.getTexture(target.baseSprite);
        // 每秒喷发的粒子数目
        emitter.setEmissionRate(target.emissionRate);
        // 发射器模式
        emitter.setEmitterMode(target.emitterMode);
        // 粒子结束时是否自动删除
        emitter.setAutoRemoveOnFinish(target.isAutoRemoveOnFinish);
    };

    // 更新存活时间
    ParticleRuntime.updateDuration = function (target) {
        var node = target._renderObj;
        Engine._renderContext.game.setEnvironment();
        node.setDuration(target.duration);
        //  @ifdef EDITOR
        if (! Fire.Engine.isPlaying) {
            node.resetSystem();
        }
        node = target._renderObjInScene;
        if (node) {
            Engine._renderContext.sceneView.game.setEnvironment();
            node.setDuration(target.duration);
            if (! Fire.Engine.isPlaying) {
                node.resetSystem();
            }
        }
        // @endif
    };

    // 设置属性
    ParticleRuntime.setParticleSystem = function (target, emitter) {
        // 纹理
        emitter.setTexture(this.getTexture(target.baseSprite));
        // 发射器生存时间
        emitter.setDuration(target.duration);
        // 每秒喷发的粒子数目
        emitter.setEmissionRate(target.emissionRate);
        // 粒子的生存时间
        emitter.setLife(target.life);
        // 粒子生命变化范围
        emitter.setLifeVar(target.lifeVar);
        // 粒子的初始大小
        emitter.setStartSize(target.startSize);
        // 粒子初始大小的变化范围
        emitter.setStartSizeVar(target.startSizeVar);
        // 粒子结束时的大小，-1表示和初始大小一致
        emitter.setEndSize(target.endSize);
        // 粒子结束大小的变化范围
        emitter.setEndSizeVar(target.endSizeVar);
        // 粒子角度
        emitter.setAngle(target.angle);
        // 粒子角度变化范围
        emitter.setAngleVar(target.angleVar);
        // 粒子初始颜色
        emitter.setStartColor(target.startColor.toCCColor());
        // 粒子初始颜色变化范围
        emitter.setStartColorVar(target.startColorVar.toCCColor());
        // 粒子结束颜色
        emitter.setEndColor(target.endColor.toCCColor());
        // 粒子结束颜色变化范围
        emitter.setEndColorVar(target.endColorVar.toCCColor());
        // 粒子位置类型
        emitter.setPositionType(target.positionType);
        // 发射器位置的变化范围（横向和纵向）
        emitter.setPosVar(cc.p(target.positionVar.x, target.positionVar.y));
        // 粒子开始自旋角度
        emitter.setStartSpin(target.startSpin);
        // 粒子开始自旋角度变化范围
        emitter.setStartSpinVar(target.startSpinVar);
        // 粒子结束自旋角度
        emitter.setEndSpin(target.endSpin);
        // 粒子结束自旋角度变化范围
        emitter.setEndSpinVar(target.endSpinVar);
        // 发射器模式
        emitter.setEmitterMode(target.emitterMode);
        if (target.emitterMode === Fire.ParticleSystem.EmitterMode.Gravity) {
            // 重力
            emitter.setGravity(new cc.Point(target.gravity.x, target.gravity.y));
            // 速度
            emitter.setSpeed(target.speed);
            // 速度变化范围
            emitter.setSpeedVar(target.speedVar);
            // 粒子径向加速度，即平行于重力方向的加速度
            emitter.setRadialAccel(target.radialAccel);
            // 粒子径向加速度变化范围
            emitter.setRadialAccelVar(target.radialAccelVar);
            // 粒子切向加速度，即垂直于重力方向的加速度
            emitter.setTangentialAccel(target.tangentialAccel);
            // 粒子切向加速度变化范围
            emitter.setTangentialAccelVar(target.tangentialAccelVar);
        }
        else {
            // 初始半径
            emitter.setStartRadius(target.startRadius);
            // 初始半径变化范围
            emitter.setStartRadiusVar(target.startRadiusVar);
            // 粒子每秒围绕起始点的旋转角度
            emitter.setRotatePerSecond(target.rotatePerSecond);
            // 粒子每秒围绕起始点的旋转角度变化范围
            emitter.setRotatePerSecondVar(target.rotatePerSecondVar);
            // 结束半径
            emitter.setEndRadius(target.endRadius);
            // 结束半径变化范围
            emitter.setEndRadiusVar(target.endRadiusVar);
        }
        // 粒子结束时是否自动删除
        emitter.setAutoRemoveOnFinish(target.isAutoRemoveOnFinish);
    };

    // 判断粒子是否播放完成
    ParticleRuntime.getParticleCount = function (target) {
        var inGame = !(target.entity._objFlags & HideInGame);
        if (inGame && target._renderObj) {
            return target._renderObj.getParticleCount();
        }
        // @ifdef EDITOR
        else if (target._renderObjInScene) {
            return target._renderObjInScene.getParticleCount();
        }
    },

    // 初始化
    ParticleRuntime.initParticleSystem = function (target) {
        var rc = Engine._renderContext;
        rc.game.setEnvironment();
        var emitter = new cc.ParticleSystem(target.totalParticles);
        this.setParticleSystem(target, emitter);
        target._renderObj = emitter;
        target.entity._ccNode.addChild(emitter);
        // @ifdef EDITOR
        if (rc.sceneView) {
            rc.sceneView.game.setEnvironment();
            emitter = new cc.ParticleSystem(target.totalParticles);
            this.setParticleSystem(target, emitter);
            target._renderObjInScene = emitter;
            target.entity._ccNodeInScene.addChild(emitter);
        }
        // @endif
    };
    ParticleRuntime.getParticleSystemSize = function (target) {
        var inGame = !(target.entity._objFlags & HideInGame);
        var size = null;
        if (inGame && target._renderObj) {
            size = target._renderObj.getContentSize();
        }
        // @ifdef EDITOR
        else if (target._renderObjInScene) {
            size = target._renderObjInScene.getContentSize();
        }
        // @endif
        return size ? new Vec2(size.width, size.height) : Vec2.zero;
    };

})();