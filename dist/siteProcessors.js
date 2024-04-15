"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processForOtherSite = exports.processForRuliweb = void 0;
const node_html_parser_1 = require("node-html-parser");
function processForRuliweb(posts) {
    return posts.map(post => {
        post = {
            ...post,
            data: [post.title + " " + node_html_parser_1.default.parse(post.content).textContent.replace(/[\n\t]/g, " ").trim()]
        };
        const regex = /조회\s+(\d+)/;
        const match = post.views.match(regex);
        if (match) {
            const views = parseInt(match[1]);
            if (!isNaN(views)) {
                return {
                    ...post,
                    views: views.toString()
                };
            }
        }
        return {
            ...post,
            views: "0"
        };
    });
}
exports.processForRuliweb = processForRuliweb;
function processForOtherSite(posts) {
    return posts;
}
exports.processForOtherSite = processForOtherSite;
//# sourceMappingURL=siteProcessors.js.map