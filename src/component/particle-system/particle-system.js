// particle-system
var ParticleSystem = (function () {

    var tempMatrix = new Fire.Matrix23();

    /**
     * @class EmitterMode
     * @static
     */
    var EmitterMode = Fire.defineEnum({
        /**
         * @property Gravity
         * @type {number}
         */
        Gravity: -1,
        /**
         * @property Radius
         * @type {number}
         */
        Radius: -1
    });

    /**
     * @class PositionType
     * @static
     */
    var PositionType = Fire.defineEnum({
        /**
         * @property Free
         * @type {number}
         */
        Free: -1,
        /**
         * @property Relative
         * @type {number}
         */
        Relative: -1,
        /**
         * @property Grouped
         * @type {number}
         */
        Grouped: -1
    });

    /**
     * The Particle System renderer component.
     * @class ParticleSystem
     * @extends Renderer
     * @constructor
     */
    var ParticleSystem = Fire.Class({
        // 名字
        name: "Fire.ParticleSystem",
        // 继承
        extends: Renderer,
        // 构造函数
        constructor: function () {
            RenderContext.initRenderer(this);
        },
        // 属性
        properties: {
            //================= 主要属性 ================
            // 粒子图片
            _baseSprite: null,
            /**
             * The baseSprite of Particle System.
             * @property baseSprite
             * @type {Sprite}
             * @default null
             */
            baseSprite: {
                get: function () {
                    return this._baseSprite;
                },
                set: function (value) {
                    this._baseSprite = value;
                    Fire._Runtime.CocosParticleSystem.setMain(this);
                },
                type: Fire.Sprite
            },
            // 粒子总颗粒
            _totalParticles: 100,
            /**
             * Maximum particles of the system.
             * @property totalParticles
             * @type {number}
             * @default 100
             */
            totalParticles: {
                get: function () {
                    return this._totalParticles;
                },
                set: function (value) {
                    this._totalParticles = value;
                    Fire._Runtime.CocosParticleSystem.setMain(this);
                }
            },
            /*发射器生存时间，即它可以发射粒子的时间，注意这个时间和粒子生存时间不同。
             *单位秒，-1表示永远；粒子发射结束后可点击工具栏的播放按钮再次发射
             */
            _duration: -1,
            /**
             * How many seconds the emitter wil run. -1 means 'forever'.
             * @property duration
             * @type {number}
             * @default -1
             */
            duration: {
                get: function () {
                    return this._duration;
                },
                set: function (value) {
                    this._duration = value;
                    Fire._Runtime.CocosParticleSystem.setMain(this);
                }
            },
            // 每秒喷发的粒子数目
            _emissionRate: 10,
            /**
             * Emission rate of the particles.
             * @property emissionRate
             * @type {number}
             * @default 10
             */
            emissionRate:{
                get: function () {
                    return this._emissionRate;
                },
                set: function (value) {
                    this._emissionRate = value;
                    Fire._Runtime.CocosParticleSystem.setMain(this);
                }
            },
            //==========================================
            //================ 生命属性 =================
            // 粒子生命，即粒子的生存时间
            _life: 1,
            /**
             * Life of each particle setter.
             * @property life
             * @type {number}
             * @default 1
             */
            life: {
                get: function() {
                    return this._life;
                },
                set: function (value) {
                    this._life = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            // 粒子生命变化范围
            _lifeVar: 0,
            /**
             * Variation of life.
             * @property lifeVar
             * @type {number}
             * @default 0
             */
            lifeVar: {
                get: function() {
                    return this._lifeVar;
                },
                set: function (value) {
                    this._lifeVar = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            //==========================================
            //================ 大小属性 =================
            // 粒子的初始大小
            _startSize: 50,
            /**
             * Start size in pixels of each particle.
             * @property startSize
             * @type {number}
             * @default 50
             */
            startSize: {
                get: function() {
                    return this._startSize;
                },
                set: function (value) {
                    this._startSize = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            // 粒子初始大小的变化范围
            _startSizeVar: 0,
            /**
             * Variation of start size in pixels.
             * @property startSizeVar
             * @type {number}
             * @default 0
             */
            startSizeVar: {
                get: function() {
                    return this._startSizeVar;
                },
                set: function (value) {
                    this._startSizeVar = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            // 粒子结束时的大小，-1表示和初始大小一致
            _endSize: -1,
            /**
             * End size in pixels of each particle.
             * @property endSize
             * @type {number}
             * @default -1
             */
            endSize: {
                get: function() {
                    return this._endSize;
                },
                set: function (value) {
                    this._endSize = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            // 粒子结束大小的变化范围
            _endSizeVar: 0,
            /**
             * Variation of end size in pixels.
             * @property endSizeVar
             * @type {number}
             * @default 0
             */
            endSizeVar: {
                get: function() {
                    return this._endSizeVar;
                },
                set: function (value) {
                    this._endSizeVar = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            //==========================================
            //================ 角度属性 =================
            // 粒子角度
            _angle: 90,
            /**
             * Angle of each particle setter.
             * @property angle
             * @type {number}
             * @default 90
             */
            angle: {
                get: function() {
                    return this._angle;
                },
                set: function (value) {
                    this._angle = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            // 粒子角度变化范围
            _angleVar: 0,
            /**
             * Variation of angle of each particle setter.
             * @property angleVar
             * @type {number}
             * @default 0
             */
            angleVar: {
                get: function() {
                    return this._angleVar;
                },
                set: function (value) {
                    this._angleVar = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            //==========================================
            //================ 颜色属性 =================
            // 粒子初始颜色
            _startColor: new Fire.Color(0.5, 0.5, 0.5, 1),
            /**
             * Start color of each particle.
             * @property startColor
             * @type {color}
             * @default Fire.Color(0.5, 0.5, 0.5, 1)
             */
            startColor: {
                get: function() {
                    return this._startColor;
                },
                set: function (value) {
                    this._startColor = value;
                    Fire._Runtime.CocosParticleSystem.setColor(this);
                },
                type: Fire.Color
            },
            // 粒子初始颜色变化范围
            _startColorVar: new Fire.Color(0, 0, 0, 0),
            /**
             * Variation of the start color.
             * @property startColorVar
             * @type {color}
             * @default Fire.Color(0.5, 0.5, 0.5, 1)
             */
            startColorVar: {
                get: function() {
                    return this._startColorVar;
                },
                set: function (value) {
                    this._startColorVar = value;
                    Fire._Runtime.CocosParticleSystem.setColor(this);
                },
                type: Fire.Color
            },
            // 粒子结束颜色
            _endColor: new Fire.Color(0, 0, 0, 0.5),
            /**
             * Ending color of each particle.
             * @property endColor
             * @type {color}
             * @default Fire.Color(0, 0, 0, 0.5)
             */
            endColor: {
                get: function() {
                    return this._endColor;
                },
                set: function (value) {
                    this._endColor= value;
                    Fire._Runtime.CocosParticleSystem.setColor(this);
                },
                type: Fire.Color
            },
            // 粒子结束颜色变化范围
            _endColorVar: new Fire.Color(0, 0, 0, 0.5),
            /**
             * Variation of the end color.
             * @property endColorVar
             * @type {color}
             * @default Fire.Color(0, 0, 0, 0.5)
             */
            endColorVar: {
                get: function() {
                    return this._endColorVar;
                },
                set: function (value) {
                    this._endColorVar = value;
                    Fire._Runtime.CocosParticleSystem.setColor(this);
                },
                type: Fire.Color
            },
            //==========================================
            //================ 位置属性 =================
            _positionType: PositionType.Free,
            /**
             * Particles movement type: Free | Grouped.
             * @property startSpin
             * @type {Fire.ParticleSystem.PositionType}
             * @default Free
             */
            positionType: {
                get: function () {
                    return this._positionType;
                },
                set: function (value) {
                    this._positionType = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                },
                type: PositionType
            },
            _positionVar: new Fire.Vec2(0, 0),
            /**
             * Variation of source position.
             * @property startSpin
             * @type {Vec2}
             * @default Fire.Vec2(0, 0)
             */
            positionVar: {
                get: function () {
                    return this._positionVar;
                },
                set: function (value) {
                    this._positionVar = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                },
                type: Fire.Vec2
            },
            //==========================================
            //================ 自旋属性 =================
            // 粒子开始自旋角度
            _startSpin: 0,
            /**
             * Start angle of each particle.
             * @property startSpin
             * @type {number}
             * @default 0
             */
            startSpin: {
                get: function() {
                    return this._startSpin;
                },
                set: function (value) {
                    this._startSpin = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            // 粒子开始自旋角度变化范围
            _startSpinVar: 0,
            /**
             * Variation of start angle.
             * @property startSpinVar
             * @type {number}
             * @default 0
             */
            startSpinVar: {
                get: function() {
                    return this._startSpin;
                },
                set: function (value) {
                    this._startSpin = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            // 粒子结束自旋角度
            _endSpin: 0,
            /**
             * End angle of each particle.
             * @property endSpin
             * @type {number}
             * @default 0
             */
            endSpin: {
                get: function() {
                    return this._endSpin;
                },
                set: function (value) {
                    this._endSpin = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            // 粒子结束自旋角度变化范围
            _endSpinVar: 0,
            /**
             * Variation of end angle.
             * @property endSpinVar
             * @type {number}
             * @default 0
             */
            endSpinVar: {
                get: function() {
                    return this._endSpinVar;
                },
                set: function (value) {
                    this._endSpinVar = value;
                    Fire._Runtime.CocosParticleSystem.setOther(this);
                }
            },
            //==========================================
            // 喷发器模式, 有重力模式（GRAVITY）和半径模式（RADIUS，也叫放射模式）两种
            _emitterMode: EmitterMode.Gravity,
            /**
             * Emitter modes:
             * Gravity: uses gravity, speed, radial and tangential acceleration;
             * Radius: uses radius movement + rotation.
             * @property emitterMode
             * @type {Fire.ParticleSystem.EmitterMode}
             * @default EmitterMode.Gravity
             */
            emitterMode: {
                get: function () {
                    return this._emitterMode;
                },
                set: function (value) {
                    this._emitterMode = value;
                    Fire._Runtime.CocosParticleSystem.setMain(this);
                },
                type: EmitterMode
            },
            //========== 下列是重力模式具备的属性 ==========
            // 重力
            _gravity: new Fire.Vec2(0, 0),
            /**
             * Gravity of the emitter.
             * @property gravity
             * @type {Vec2}
             * @default Fire.Vec2(0, 0)
             */
            gravity: {
                get: function() {
                    return this._gravity;
                },
                set: function (value) {
                    this._duration = value;
                    Fire._Runtime.CocosParticleSystem.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            // 速度
            _speed: 180,
            /**
             * Speed of the emitter.
             * @property speed
             * @type {number}
             * @default 180
             */
            speed: {
                get: function () {
                    return this._speed;
                },
                set: function (value) {
                    this._speed = value;
                    Fire._Runtime.CocosParticleSystem.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            // 速度变化范围
            _speedVar: 50,
            /**
             * Variation of the speed.
             * @property speedVar
             * @type {number}
             * @default 50
             */
            speedVar: {
                get: function () {
                    return this._speedVar;
                },
                set: function (value) {
                    this._speedVar = value;
                    Fire._Runtime.CocosParticleSystem.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            // 粒子径向加速度，即平行于重力方向的加速度
            _radialAccel: 0,
            /**
             * Radial acceleration of each particle. Only available in 'Gravity' mode.
             * @property radialAccel
             * @type {number}
             * @default 0
             */
            radialAccel: {
                get: function () {
                    return this._radialAccel;
                },
                set: function (value) {
                    this._radialAccel = value;
                    Fire._Runtime.CocosParticleSystem.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            // 粒子径向加速度变化范围
            _radialAccelVar: 0,
            /**
             * Variation of the radial acceleration.
             * @property radialAccelVar
             * @type {number}
             * @default 0
             */
            radialAccelVar: {
                get: function () {
                    return this._radialAccelVar;
                },
                set: function (value) {
                    this._radialAccelVar = value;
                    Fire._Runtime.CocosParticleSystem.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            // 粒子切向加速度，即垂直于重力方向的加速度
            _tangentialAccel: 80,
            /**
             * Tangential acceleration of each particle. Only available in 'Gravity' mode.
             * @property tangentialAccel
             * @type {number}
             * @default 80
             */
            tangentialAccel: {
                get: function () {
                    return this._tangentialAccel;
                },
                set: function (value) {
                    this._tangentialAccel = value;
                    Fire._Runtime.CocosParticleSystem.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            // 粒子切向加速度变化范围
            _tangentialAccelVar: 0,
            /**
             * Variation of the tangential acceleration.
             * @property tangentialAccelVar
             * @type {number}
             * @default 0
             */
            tangentialAccelVar: {
                get: function () {
                    return this._tangentialAccelVar;
                },
                set: function (value) {
                    this._tangentialAccelVar = value;
                    Fire._Runtime.CocosParticleSystem.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            //==========================================
            //========== 下列是半径模式具备的属性 ==========
            // 初始半径
            _startRadius: 0,
            /**
             * Starting radius of the particles. Only available in 'Radius' mode.
             * @property startRadius
             * @type {number}
             * @default 0
             */
            startRadius: {
                get: function () {
                    return this._startRadius;
                },
                set: function (value) {
                    this._startRadius = value;
                    Fire._Runtime.CocosParticleSystem.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            // 初始半径变化范围
            _startRadiusVar: 0,
            /**
             * Variation of the starting radius.
             * @property startRadiusVar
             * @type {number}
             * @default 0
             */
            startRadiusVar: {
                get: function () {
                    return this._startRadiusVar;
                },
                set: function (value) {
                    this._startRadiusVar = value;
                    Fire._Runtime.CocosParticleSystem.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            // 粒子每秒围绕起始点的旋转角度
            _rotatePerSecond: 0,
            /**
             * Number of degress to rotate a particle around the source pos per second.
             * Only available in 'Radius' mode.
             * @property rotatePerSecond
             * @type {number}
             * @default 0
             */
            rotatePerSecond: {
                get: function () {
                    return this._rotatePerSecond;
                },
                set: function (value) {
                    this._rotatePerSecond = value;
                    Fire._Runtime.CocosParticleSystem.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            // 粒子每秒围绕起始点的旋转角度变化范围
            _rotatePerSecondVar: 0,
            /**
             * Variation of the degress to rotate a particle around the source pos per second.
             * @property rotatePerSecondVar
             * @type {number}
             * @default 0
             */
            rotatePerSecondVar: {
                get: function () {
                    return this._rotatePerSecondVar;
                },
                set: function (value) {
                    this._rotatePerSecondVar = value;
                    Fire._Runtime.CocosParticleSystem.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            // 结束半径
            _endRadius: 0,
            /**
             * Ending radius of the particles. Only available in 'Radius' mode.
             * @property endRadius
             * @type {number}
             * @default 0
             */
            endRadius: {
                get: function () {
                    return this._endRadius;
                },
                set: function (value) {
                    this._endRadius = value;
                    Fire._Runtime.CocosParticleSystem.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            /*
            * 结束半径变化范围，即结束半径值的范围在（endRadius - endRadiusVar）
            * 和 （endRadius + endRadiusVar ）之间，下面类似。
            * */
            _endRadiusVar: 0,
            /**
             * Variation of the ending radius.
             * @property endRadiusVar
             * @type {number}
             * @default 0
             */
            endRadiusVar: {
                get: function () {
                    return this._endRadiusVar;
                },
                set: function (value) {
                    this._endRadiusVar = value;
                    Fire._Runtime.CocosParticleSystem.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            //==========================================
            // 粒子结束时是否自动删除
            _isAutoRemoveOnFinish: false,
            /**
             * Indicate whether the node will be auto-removed when it has no particles left.
             * @property isAutoRemoveOnFinish
             * @type {boolean}
             * @default false
             */
            isAutoRemoveOnFinish: {
                get: function () {
                    return this._isAutoRemoveOnFinish;
                },
                set: function (value) {
                    this._isAutoRemoveOnFinish = value;
                    Fire._Runtime.CocosParticleSystem.setMain(this);
                }
            }
        },
        onLoad: function () {
            Fire._Runtime.CocosParticleSystem.initParticleSystem(this);
        },
        onEnable: function () {
            Engine._renderContext.show(this, true);
        },
        onDisable: function () {
            Engine._renderContext.show(this, false);
        },
        onDestroy: function () {
            Engine._renderContext.remove(this);
        },
        getWorldSize: function () {
            return Fire._Runtime.CocosParticleSystem.getParticleSystemSize(this);
        },
        onPreRender: function () {
            //this.getSelfMatrix(tempMatrix);
            //tempMatrix.prepend(this.transform._worldTransform);
            Engine._curRenderContext.updateTransform(this, this.transform._worldTransform);
        },
        getSelfMatrix: function (out) {
            var textSize = Fire._Runtime.CocosParticleSystem.getParticleSystemSize(this);
            var w = textSize.x;
            var h = textSize.y;

            var anchorOffsetX = 0;
            var anchorOffsetY = 0;

            out.a = 1;
            out.b = 0;
            out.c = 0;
            out.d = 1;
            out.tx = anchorOffsetX;
            out.ty = anchorOffsetY;
        }
    });

    ParticleSystem.EmitterMode = EmitterMode;
    ParticleSystem.PositionType = PositionType;

    //-- 增加 Particle System 到 组件菜单上
    Fire.addComponentMenu(ParticleSystem, 'ParticleSystem');
    Fire.executeInEditMode(ParticleSystem, true);

    return ParticleSystem;
})();

Fire.ParticleSystem = ParticleSystem;

