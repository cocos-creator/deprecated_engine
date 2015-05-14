// jshint ignore: start

largeModule('Component', TestEnv);

asyncTest('invoke', function () {
    var cb = new Callback().setDisabledMessage('method should not invokes in this frame');
    var cb2 = new Callback().disable('method should not being called after destroyed');

    var MyComp = Fire.Class({
        extends: Component,
        onLoad: function () {
            this.invoke('myCallback', 0.001);
        },
        myCallback: cb,
        callback2: cb2
    });
    Fire.executeInEditMode(MyComp);

    var ent = new Entity();
    var comp = ent.addComponent(MyComp);

    cb.enable();
    setTimeout(function () {
        cb.once('method should being invoked');

        comp.invoke('callback2', 0);
        comp.destroy();
        FO._deferredDestroy();

        setTimeout(function () {
            start();
        }, 1);
    }, 0.001 * 1000);
});

asyncTest('cancel invoke', 0, function () {
    var cb1 = new Callback().disable('method 1 should not invoked if canceled');

    var MyComp = Fire.Class({
        extends: Component,
        myCallback1: cb1,
    });
    Fire.executeInEditMode(MyComp);
    var ent = new Entity();
    var comp = ent.addComponent(MyComp);

    comp.invoke('myCallback1', 0.001);
    comp.invoke('myCallback1', 0.001);

    comp.cancelInvoke('myCallback1');

    setTimeout(start, 0.001 * 1000);
});

asyncTest('repeat', function () {
    var cb = new Callback(function () {
        if (cb.calledCount > 1) {
            ok(true, 'method should being invoked repeatedly');
            cb.disable();
            comp.cancelInvoke('myCallback');
            clearTimeout(stopId);
            start();
        }
    }).enable();

    var MyComp = Fire.Class({
        extends: Component,
        myCallback: cb,
    });
    Fire.executeInEditMode(MyComp);

    var ent = new Entity();
    var comp = ent.addComponent(MyComp);

    comp.repeat('myCallback', 0);

    var stopId = setTimeout(function () {
        ok(false, 'Timeout: method should being invoked repeatedly');
        start();
    }, 100);
});

// jshint ignore: end
