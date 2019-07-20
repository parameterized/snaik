
function orDefault(x, d) {
    if (typeof(x) === 'undefined' || x === null) {
        return d;
    } else {
        return x;
    }
}