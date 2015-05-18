var Runtime = {
    init: function () {
        //
    },
    render: function (renderContext) {
        Engine._scene.render(renderContext || Engine._renderContext);
    },
    animate: function () {
    },
    // @ifdef EDITOR
    tickInEditMode: null
    // @endif
};

JS.getset(Runtime, 'RenderContext',
    function () {
        return RenderContext;
    },
    function (value) {
        RenderContext = value;
    }
);

Fire._Runtime = Runtime;
