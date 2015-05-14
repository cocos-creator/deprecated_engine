// jshint ignore: start

largeModule('Entity', TestEnv);

test('basic test', function () {
    var entity = new Entity();
    ok(entity.name, 'entity has default name');
    strictEqual(new Entity('myEntity').name, 'myEntity', 'can specify entity name');

    strictEqual(entity.active, true, 'entity is active');
    strictEqual(entity.activeInHierarchy, true, 'entity is activeInHierarchy');

    entity.active = false;

    strictEqual(entity.active, false, 'entity is deactive');
    strictEqual(entity.activeInHierarchy, false, 'entity is deactiveInHierarchy');

    entity._destroyImmediate();
    strictEqual(entity.isValid, false, 'entity can be destoryed');
});

test('test hierarchy', function () {
    var parent = new Fire.Entity();
    var child1 = new Fire.Entity();
    var child2 = new Fire.Entity();

    strictEqual(parent.parent, null, 'entity\'s default parent is null');
    strictEqual(parent.childCount, 0, 'entity\'s default child count is 0');

    child1.parent = parent;
    strictEqual(child1.parent, parent, 'can get/set parent');
    strictEqual(parent.childCount, 1, 'child count increased to 1');
    strictEqual(parent.getChild(0), child1, 'can get child1');

    child2.parent = parent;
    strictEqual(parent.childCount, 2, 'child count increased to 2');
    strictEqual(parent.getChild(1), child2, 'can get child2');

    child1.destroy();

    FO._deferredDestroy();

    strictEqual(parent.childCount, 1, 'child count should return to 1');
    strictEqual(parent.getChild(0), child2, 'only child2 left');

    // TODO: what if parent.parent = child2 ?
});

test('activeInHierarchy', function () {
    var parent = new Entity();
    var child = new Entity();
    child.parent = parent;

    strictEqual(parent.activeInHierarchy, true, 'parent activeInHierarchy');
    strictEqual(child.activeInHierarchy, true, 'child activeInHierarchy');

    child.active = false;

    strictEqual(parent.activeInHierarchy, true, 'parent unchanged');
    strictEqual(child.activeInHierarchy, false, 'child deactiveInHierarchy');

    parent.active = false;

    strictEqual(parent.activeInHierarchy, false, 'parent deactiveInHierarchy');
    strictEqual(child.activeInHierarchy, false, 'child still deactiveInHierarchy');

    child.active = true;

    strictEqual(parent.activeInHierarchy, false, 'parent unchanged');
    strictEqual(child.activeInHierarchy, false, 'child deactiveInHierarchy because parent deactived');

    parent.active = true;

    strictEqual(parent.activeInHierarchy, true, 'parent become activeInHierarchy');
    strictEqual(child.activeInHierarchy, true, 'child become activeInHierarchy because parent actived');
});

test('component', function () {
    // 这里主要测试entity，不是测试component

    // my component
    var MyComponentBase = Fire.extend('MyComponentBase', CallbackTester);
    Fire.executeInEditMode(MyComponentBase);
    var MyComponent = Fire.extend('MyComponent', MyComponentBase, function () {
        this.expect(CallbackTester.OnLoad, 'call onLoad while attaching to entity');
        this.expect(CallbackTester.OnEnable, 'then call onEnable if entity active', true);
    });

    var obj = new Entity();
    var comp = obj.addComponent(MyComponent); // onEnable

    comp.expect(CallbackTester.start, 'call start after onEnable');
    Engine.step();
    comp.notExpect(CallbackTester.start, 'start should called only once');
    Engine.step();

    strictEqual(comp.entity, obj, 'can get entity from component');

    comp.expect(CallbackTester.OnDisable);
    obj.active = false; // onDisable

    comp.expect(CallbackTester.OnEnable);
    obj.active = true;  // onEnable

    strictEqual(obj.getComponent(Fire.Transform), obj.transform, 'getComponent: can get transform');
    strictEqual(obj.getComponent(Fire.JS.getClassName(Fire.Transform)), obj.transform, 'getComponent: can get transform by name');
    strictEqual(obj.getComponent(MyComponent), comp, 'getComponent: can get my component');
    strictEqual(obj.getComponent(MyComponentBase), comp, 'getComponent: can get component by base type');
    strictEqual(obj.getComponent(Fire.JS.getClassName(MyComponentBase)), comp, 'getComponent: can get component by base name');

    comp.expect(CallbackTester.OnDisable, 'should called onDisable when destory');

    comp.destroy();     // onDisable

    comp.notExpect(CallbackTester.OnDisable, 'onDisable should called only once');
    comp.destroy();

    strictEqual(obj.getComponent(MyComponent), comp, 'can still get component in this frame');

    comp.expect(CallbackTester.OnDestroy);
    FO._deferredDestroy();    // onDestroy

    strictEqual(obj.getComponent(MyComponent), null, 'can not get component after this frame');

    comp.stopTest();

    Fire.JS.unregisterClass(MyComponent, MyComponentBase);
});

test('component in hierarchy', function () {
    // 这里主要测试entity，不是测试component
    var parent = new Entity();
    var child = new Entity();
    child.parent = parent;
    parent.active = false;

    var MyComponent = Fire.extend('', CallbackTester, function () {
        this.notExpect(CallbackTester.OnLoad, 'should not call onLoad while entity inactive');
    });
    Fire.executeInEditMode(MyComponent);

    var comp = child.addComponent(MyComponent);

    comp.expect(CallbackTester.OnLoad, 'should call onLoad while entity activated');
    comp.expect(CallbackTester.OnEnable, 'should enable when parent become active', true);
    parent.active = true;   // onEnable

    comp.expect(CallbackTester.OnDisable, 'should disable when parent become deactive');
    parent.active = false;   // onDisable

    comp.expect(CallbackTester.OnEnable, 'should enable when entity detached from its parent');
    child.parent = null;

    comp.expect(CallbackTester.OnDisable, 'should disable when add to inactive parent');
    parent.active = false;
    child.parent = parent;

    comp.stopTest();
});

test('destroy', function () {
    var parent = new Entity();
    var child = new Entity();

    // add child component
    var ChildComp = Fire.extend('', CallbackTester, function () {
        this.expect([CallbackTester.OnLoad, CallbackTester.OnEnable]);
    });
    Fire.executeInEditMode(ChildComp);
    var childComp = child.addComponent(ChildComp);

    // expect ondisable
    childComp.expect(CallbackTester.OnDisable, 'should disable while destroy parent');
    childComp.notExpect(CallbackTester.OnDestroy, 'can not destroyed before the end of this frame');

    child.parent = parent;
    // call destroy
    parent.destroy();

    childComp.notExpect(CallbackTester.OnDisable, 'child comp should only disabled once');
    childComp.notExpect(CallbackTester.OnEnable, 'child component should not re-enable when parent destroying');
    childComp.expect(CallbackTester.OnDestroy, 'should destroyed at the end of frame');

    // try add component after destroy

    var ChildComp_new = Fire.extend('', CallbackTester, function () {
        this.expect(CallbackTester.OnLoad, 'new child component should onLoad even if added after destroy');
        this.expect(CallbackTester.OnEnable, 'new child component should enable even if added after destroy', true);
        this.expect(CallbackTester.OnDisable, 'new component\'s onDisable should be called before its onDestroy', true);
        this.expect(CallbackTester.OnDestroy, 'new component should also destroyed at the end of frame', true);
    });
    var childComp_new = child.addComponent(ChildComp_new);

    var NewParentComp = Fire.extend('', CallbackTester, function () {
        this.expect([CallbackTester.OnLoad,
                     CallbackTester.OnEnable,
                     CallbackTester.OnDisable,
                     CallbackTester.OnDestroy]);
    });
    var newParentComp = parent.addComponent(NewParentComp);

    // try add child after destroy

    var NewChildEntityComp = Fire.extend('', CallbackTester, function () {
        this.expect([CallbackTester.OnLoad,
                     CallbackTester.OnEnable,
                     CallbackTester.OnDisable,
                     CallbackTester.OnDestroy]);
    });
    var newChildEntity = new Entity();
    newChildEntity.parent = parent;
    var newChildEntityComp = newChildEntity.addComponent(NewChildEntityComp);

    // do destory

    FO._deferredDestroy();

    strictEqual(childComp_new.isValid, false, 'entity will finally destroyed with its component which added after calling destroy');
    strictEqual(childComp.isValid, false, 'entity will destroyed with its child components');
    strictEqual(child.isValid, false, 'entity will destroyed with its children');
    strictEqual(newChildEntity.isValid, false, 'entity will destroyed with its new children');

    childComp.stopTest();
    childComp_new.stopTest();
    newParentComp.stopTest();
    newChildEntityComp.stopTest();
});

test('isChildOf', function () {
    var ent1 = new Fire.Entity();
    var ent2 = new Fire.Entity();
    var ent3 = new Fire.Entity();

    ent2.parent = ent1;
    ent3.parent = ent2;

    strictEqual(ent1.isChildOf(ent2), false, 'not a child of its children');
    strictEqual(ent1.isChildOf(ent1), true, 'is child of itself');
    strictEqual(ent2.isChildOf(ent1), true, 'is child of its parent');
    strictEqual(ent3.isChildOf(ent1), true, 'is child of its ancestor');
});


test('find entity child', function () {
    var ent_a = new Fire.Entity("a");
    var ent_b = new Fire.Entity("b");
    var ent_1 = new Fire.Entity("1");
    var ent_2 = new Fire.Entity("2");
    var ent_3 = new Fire.Entity("3");

    ent_2.parent = ent_1;
    ent_1.parent = ent_a;
    ent_3.parent = ent_b;

    var ent_noName1 = new Fire.Entity('');
    var ent_noName2 = new Fire.Entity('');
    ent_noName1.parent = ent_a;
    ent_noName2.parent = ent_noName1;

    ok(ent_a.find('a/1/2') === null, 'no found');
    ok(ent_a.find('1/2') === ent_2, 'should found');
    ok(ent_3.find('../../a/1/2') === ent_2, 'should found');
    ok(ent_a.find('../b/3') === ent_3, 'should found');

    ok(ent_a.find('') === ent_noName1, 'should found');
    ok(ent_a.find('../a//') === ent_noName2, 'should found');

    ok(ent_a.find('../../../../../../../a') === null, 'should not found and wont throw error');
});

// jshint ignore: end
