"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processCommunityPosts = void 0;
const node_html_parser_1 = require("node-html-parser");
function cleanTextContent(content) {
    return node_html_parser_1.default.parse(content).textContent.replace(/[\n\t]/g, " ").trim();
}
function processCommunityPosts(posts, options) {
    return posts.map(post => {
        const cleanedContent = cleanTextContent(post.content);
        const data = [post.title + " " + cleanedContent];
        const processedPost = { ...post, data };
        return processedPost;
    });
}
exports.processCommunityPosts = processCommunityPosts;
//# sourceMappingURL=siteProcessors.js.map