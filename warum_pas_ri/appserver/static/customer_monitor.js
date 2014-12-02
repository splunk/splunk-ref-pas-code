// Workaround the css! plugin's inability to understand '..' in
// require'd module names by defining a path that embeds the '..'
// so that css! doesn't see it.
require.config({
    paths: {
        "warum_pas_ri": "../app/warum_pas_ri"
    }
});

require([
    "splunkjs/ready!",
    "splunkjs/mvc/simplexml/ready!",
    "jquery",
    "warum_pas_ri/components/dendrogram/dendrogram"
], function(
    mvc,
    ignored,
    $,
    DendrogramView
) {
    new DendrogramView({
        "managerid": "dendrogram_search",
        "root_label": mvc.tokenSafe("$customer$"),
        "right": 600,
        "height": 600,
        "initial_open_lavel": 2,
        "node_outline_color": "#415e70",
        "node_close_color": "#b9d8eb",
        "el": $("#dendrogram")
    }).render();
});
