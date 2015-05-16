// particle-system
var ParticleSystem = (function () {

    var ParticleRuntime = Fire._Runtime.CocosParticleSystem;

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
     * !#en The Particle System component.
     * !#zh 粒子系统组件
     * @class ParticleSystem
     * @extends Renderer
     * @constructor
     */
    var ParticleSystem = Fire.Class({
        // 名字
        name: "Fire.ParticleSystem",
        // 继承
        extends: Renderer,
        // 属性
        properties: {
            //================= 主要属性 ================
            _baseSprite: null,
            /**
             * !#en The baseSprite of Particle System.
             * !#zh 粒子图片
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
                    ParticleRuntime.setMain(this);
                },
                type: Fire.Sprite
            },
            _totalParticles: 100,
            /**
             * !#en Maximum particles of the system.
             * !#zh 粒子总颗粒
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
                    ParticleRuntime.setMain(this);
                },
                type: Fire.Integer
            },
            _duration: -1,
            /**
             * !#en How many seconds the emitter wil run. -1 means 'forever'.
             * !#zh 发射器生存时间，即它可以发射粒子的时间，注意这个时间和粒子生存时间不同。单位秒，-1表示永远；粒子发射结束后可点击工具栏的播放按钮再次发射
             * @property duration
             * @type {number}
             * @default -1
             */
            duration: {
                get: function () {
                    return this._duration;
                },
                set: function (value) {
                    if (value === 0 && this._duration === value){
                        return;
                    }
                    this._duration = value;
                    ParticleRuntime.updateDuration(this);
                }
            },
            _emissionRate: 10,
            /**
             * !#en Emission rate of the particles.
             * !#zh 每秒喷发的粒子数目
             * @property emissionRate
             * @type {number}
             * @default 10
             */
            emissionRate: {
                get: function () {
                    return this._emissionRate;
                },
                set: function (value) {
                    this._emissionRate = value;
                    ParticleRuntime.setMain(this);
                },
                type: Fire.Integer
            },
            //==========================================
            //================ 生命属性 =================
            _life: 1,
            /**
             * !#en Life of each particle setter.
             * !#zh 粒子生命，即粒子的生存时间
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
                    ParticleRuntime.setOther(this);
                }
            },
            _lifeVar: 0,
            /**
             * !#en Variation of life.
             * !#zh 粒子生命变化范围
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
                    ParticleRuntime.setOther(this);
                }
            },
            //==========================================
            //================ 大小属性 =================
            _startSize: 50,
            /**
             * !#en Start size in pixels of each particle.
             * !#zh 粒子的初始大小
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
                    ParticleRuntime.setOther(this);
                }
            },
            _startSizeVar: 0,
            /**
             * !#en Variation of start size in pixels.
             * !#zh 粒子初始大小的变化范围
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
                    ParticleRuntime.setOther(this);
                }
            },
            _endSize: -1,
            /**
             * !#en End size in pixels of each particle.
             * !#zh 粒子结束时的大小，-1表示和初始大小一致
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
                    ParticleRuntime.setOther(this);
                }
            },
            _endSizeVar: 0,
            /**
             * !#en Variation of end size in pixels.
             * !#zh 粒子结束大小的变化范围
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
                    ParticleRuntime.setOther(this);
                }
            },
            //==========================================
            //================ 角度属性 =================
            _angle: 90,
            /**
             * !#en Angle of each particle setter.
             * !#zh 粒子角度
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
                    ParticleRuntime.setOther(this);
                }
            },
            _angleVar: 20,
            /**
             * !#en Variation of angle of each particle setter.
             * !#zh 粒子角度变化范围
             * @property angleVar
             * @type {number}
             * @default 20
             */
            angleVar: {
                get: function() {
                    return this._angleVar;
                },
                set: function (value) {
                    this._angleVar = value;
                    ParticleRuntime.setOther(this);
                }
            },
            //==========================================
            //================ 颜色属性 =================
            _startColor: new Fire.Color(1, 1, 1, 1),
            /**
             * !#en Start color of each particle.
             * !#zh 粒子初始颜色
             * @property startColor
             * @type {color}
             */
            startColor: {
                get: function() {
                    return this._startColor;
                },
                set: function (value) {
                    this._startColor = value;
                    ParticleRuntime.setColor(this);
                },
                type: Fire.Color
            },
            _startColorVar: new Fire.Color(0, 0, 0, 0),
            /**
             * !#en Variation of the start color.
             * !#zh 粒子初始颜色变化范围
             * @property startColorVar
             * @type {color}
             * @default new Fire.Color(0, 0, 0, 0)
             */
            startColorVar: {
                get: function() {
                    return this._startColorVar;
                },
                set: function (value) {
                    this._startColorVar = value;
                    ParticleRuntime.setColor(this);
                },
                type: Fire.Color
            },
            _endColor: new Fire.Color(1, 1, 1, 0),
            /**
             * !#en Ending color of each particle.
             * !#zh 粒子结束颜色
             * @property endColor
             * @type {color}
             */
            endColor: {
                get: function() {
                    return this._endColor;
                },
                set: function (value) {
                    this._endColor = value;
                    ParticleRuntime.setColor(this);
                },
                type: Fire.Color
            },
            _endColorVar: new Fire.Color(0, 0, 0, 0),
            /**
             * !#en Variation of the end color.
             * !#zh 粒子结束颜色变化范围
             * @property endColorVar
             * @type {color}
             * @default new Fire.Color(0, 0, 0, 0)
             */
            endColorVar: {
                get: function() {
                    return this._endColorVar;
                },
                set: function (value) {
                    this._endColorVar = value;
                    ParticleRuntime.setColor(this);
                },
                type: Fire.Color
            },
            //==========================================
            //================ 位置属性 =================
            _positionType: PositionType.Free,
            /**
             * !#en Particles movement type: Free | Grouped.
             * !#zh 位置类型
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
                    ParticleRuntime.setOther(this);
                },
                type: PositionType
            },
            _positionVar: new Fire.Vec2(0, 0),
            /**
             * !#en Variation of source position.
             * !#zh 位置波动值
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
                    ParticleRuntime.setOther(this);
                },
                type: Fire.Vec2
            },
            //==========================================
            //================ 自旋属性 =================
            _startSpin: 0,
            /**
             * !#en Start angle of each particle.
             * !#zh 粒子开始自旋角度
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
                    ParticleRuntime.setOther(this);
                }
            },
            _startSpinVar: 0,
            /**
             * !#en Variation of start angle.
             * !#zh 粒子开始自旋角度变化范围
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
                    ParticleRuntime.setOther(this);
                }
            },
            _endSpin: 0,
            /**
             * !#en End angle of each particle.
             * !#zh 粒子结束自旋角度
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
                    ParticleRuntime.setOther(this);
                }
            },
            _endSpinVar: 0,
            /**
             * !#en Variation of end angle.
             * !#zh 粒子结束自旋角度变化范围
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
                    ParticleRuntime.setOther(this);
                }
            },
            //==========================================
            _emitterMode: EmitterMode.Gravity,
            /**
             * !#en Emitter modes:
             * Gravity: uses gravity, speed, radial and tangential acceleration;
             * Radius: uses radius movement + rotation.
             * !#zh 喷发器模式, 有重力模式（GRAVITY）和半径模式（RADIUS，也叫放射模式）两种
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
                    ParticleRuntime.setMain(this);
                },
                type: EmitterMode
            },
            //========== 下列是重力模式具备的属性 ==========
            _gravity: new Fire.Vec2(0, 0),
            /**
             * !#en Gravity of the emitter.
             * !#zh 重力
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
                    ParticleRuntime.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                },
                type: Fire.Integer
            },
            _speed: 180,
            /**
             * !#en Speed of the emitter.
             * !#zh 速度
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
                    ParticleRuntime.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            _speedVar: 50,
            /**
             * !#en Variation of the speed.
             * !#zh 速度变化范围
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
                    ParticleRuntime.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            _radialAccel: 0,
            /**
             * !#en Radial acceleration of each particle. Only available in 'Gravity' mode.
             * !#zh 粒子径向加速度，即平行于重力方向的加速度
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
                    ParticleRuntime.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            _radialAccelVar: 0,
            /**
             * !#en Variation of the radial acceleration.
             * !#zh 粒子径向加速度变化范围
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
                    ParticleRuntime.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            _tangentialAccel: 80,
            /**
             * !#en Tangential acceleration of each particle. Only available in 'Gravity' mode.
             * !#zh 粒子切向加速度，即垂直于重力方向的加速度
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
                    ParticleRuntime.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            _tangentialAccelVar: 0,
            /**
             * !#en Variation of the tangential acceleration.
             * !#zh 粒子切向加速度变化范围
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
                    ParticleRuntime.setGravityMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Gravity;
                    }
                }
            },
            //==========================================
            //========== 下列是半径模式具备的属性 ==========
            _startRadius: 0,
            /**
             * !#en Starting radius of the particles. Only available in 'Radius' mode.
             * !#zh 初始半径
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
                    ParticleRuntime.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            _startRadiusVar: 0,
            /**
             * !#en Variation of the starting radius.
             * !#zh 初始半径变化范围
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
                    ParticleRuntime.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            _rotatePerSecond: 0,
            /**
             * !#en Number of degress to rotate a particle around the source pos per second.
             * Only available in 'Radius' mode.
             * !#zh 粒子每秒围绕起始点的旋转角度
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
                    ParticleRuntime.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            _rotatePerSecondVar: 0,
            /**
             * !#en Variation of the degress to rotate a particle around the source pos per second.
             * !#zh 粒子每秒围绕起始点的旋转角度变化范围
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
                    ParticleRuntime.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            _endRadius: 0,
            /**
             * !#en Ending radius of the particles. Only available in 'Radius' mode.
             * !#zh 结束半径
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
                    ParticleRuntime.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            _endRadiusVar: 0,
            /**
             * !#en Variation of the ending radius.
             * !#zh 结束半径变化范围，即结束半径值的范围在（endRadius - endRadiusVar）
             * 和 （endRadius + endRadiusVar ）之间。
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
                    ParticleRuntime.setRadiusMode(this);
                },
                watch: {
                    _emitterMode: function (obj, propEL) {
                        propEL.disabled = obj._emitterMode !== EmitterMode.Radius;
                    }
                }
            },
            //==========================================
            _isAutoRemoveOnFinish: false,
            /**
             * !#en Indicate whether the node will be auto-removed when it has no particles left.
             * !#zh 粒子结束时是否自动删除
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
                    ParticleRuntime.setMain(this);
                }
            }
        },

        /**
         * !#en reset the particle system
         * !#zh 重置粒子系统
         * @method reset
         */
        reset: function () {
            ParticleRuntime.reset(this);
        },

        /**
         * !#en stop the particle system
         * !#zh 停止粒子系统
         * @method stop
         */
        stop: function () {
            ParticleRuntime.stop(this);
        },

        onLoad: function () {
            ParticleRuntime.initParticleSystem(this);
            // @ifdef EDITOR
            if (!Engine.isPlaying) {
                this.stop();
            }
            // @endif
        },
        getWorldSize: function () {
            return ParticleRuntime.getParticleSystemSize(this);
        },
        getSelfMatrix: function (out) {
            var textSize = ParticleRuntime.getParticleSystemSize(this);
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
        },
        // @ifdef EDITOR
        onFocusInEditMode: function () {
            this.reset();
        },
        onLostFocusInEditMode: function () {
            this.reset();
            this.stop();
        }
        // @endif
    });

    ParticleSystem.EmitterMode = EmitterMode;
    ParticleSystem.PositionType = PositionType;

    //-- 增加 Particle System 到 组件菜单上
    Fire.addComponentMenu(ParticleSystem, 'Particle System');
    Fire.executeInEditMode(ParticleSystem, true);

    return ParticleSystem;
})();

Fire.ParticleSystem = ParticleSystem;
