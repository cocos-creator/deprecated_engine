//var AnimationManager = (function () {
    function AnimationManager () {
        // animating objects
        this.animators = [];
    }
    JS.mixin(AnimationManager.prototype, {

        // for manager

        update: function () {
            var deltaTime = Time.deltaTime;
            var animators = this.animators;
            for (var i = 0, len = animators.length; i < len; i++) {
                var animator = animators[i];
                if (animator._isUpdating) {
                    animator.update(deltaTime);
                    // if removed
                    if (! animator._isPlaying) {
                        i--;
                        len--;
                    }
                }
            }
            // TODO: trigger events
        },
        destruct: function () {},

        // for animator

        /**
         * @param {Animator} animator
         */
        addAnimator: function (animator) {
            this.animators.push(animator);
        },
        /**
         * @param {Animator} animator
         */
        removeAnimator: function (animator) {
            var index = this.animators.indexOf(animator);
            if (index >= 0) {
                this.animators.splice(index, 1);
            }
            else {
                Fire.error('animator already removed');
            }
        },
        // internal
        _: function () {}
    });

//    return AnimationManager;
//})();
