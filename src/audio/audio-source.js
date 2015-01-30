﻿
var AudioSource = (function () {
    var AudioSource = Fire.define("Fire.AudioSource", Component, function () {
        Fire.AudioContext.initSource(this);
        this._play = null;
        this._pause = null;
    });

    //-- 增加 Audio Sources 到 组件菜单上
    Fire.addComponentMenu(AudioSource, 'AudioSource');

    AudioSource.prop('_clip', null, Fire.HideInInspector);
    AudioSource.getset('clip',
        function () {
            return this._clip;
        },
        function (value) {
            if (this._clip !== value) {
                this._clip = value;
                Fire.AudioContext.updateAudioClip(this);
            }
        },
        Fire.ObjectType(Fire.AudioClip)
    );

    AudioSource.prop('_loop', false, Fire.HideInInspector);
    AudioSource.getset('loop',
       function () {
           return this._loop;
       },
       function (value) {
           if (this._loop !== value) {
               this._loop = value;
               Fire.AudioContext.updateLoop(this);
           }
       }
    );

    AudioSource.prop('_mute', false, Fire.HideInInspector);
    AudioSource.getset('mute',
       function () {
           return this._mute;
       },
       function (value) {
           if (this._mute !== value) {
               this._mute = value;
               Fire.AudioContext.updateMute(this);
           }
       }
    );

    AudioSource.prop('_volume', 1, Fire.HideInInspector);
    AudioSource.getset('volume',
       function () {
           return this._volume;
       },
       function (value) {
           if (this._volume !== value) {
               this._volume = Math.clamp(value);
               Fire.AudioContext.updateVolume(this);
           }
       },
       Fire.Range(0,1)
    );

    AudioSource.prop('playOnAwake', true, Fire.HideInInspector);

    AudioSource.prototype.pause = function () {
        Fire.AudioContext.pause(this);
        this._pause = true;
    };

    AudioSource.prototype.play = function () {
        Fire.AudioContext.play(this);
        this._play = true;
        this._pause = false;
    };

    AudioSource.prototype.stop = function () {
        Fire.AudioContext.stop(this);
        this._play = false;
        this._pause = false;
    };

    AudioSource.prototype.onLoad = function () {
        if (!Fire.Engine.isPlaying) {
            this.stop();
        }
    };

    AudioSource.prototype.onStart = function () {
        //if (this.playOnAwake) {
        //    console.log("onStart");
        //    this.play();
        //}
    };

    AudioSource.prototype.onEnable = function () {
        if (this.playOnAwake && Fire.Engine.isPlaying) {
            this.play();
        }
    };

    AudioSource.prototype.onDisable = function () {
        this.stop();
    };

    return AudioSource;
})();

Fire.AudioSource = AudioSource;