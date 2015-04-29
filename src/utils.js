function callInNextTick (callback, p1, p2) {
    if (callback) {
        setTimeout(function () {
            callback(p1, p2);
        }, 1);
    }
}

