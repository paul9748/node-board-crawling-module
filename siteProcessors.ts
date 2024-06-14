import { CommunityPost, ProcessingOptions } from './types';
import parser from 'node-html-parser'
function cleanTextContent(content: string): string {
    return parser.parse(content).textContent.replace(/[\n\t]/g, " ").trim();
}

export function processCommunityPosts(posts: CommunityPost[], options: ProcessingOptions): CommunityPost[] {
    return posts.map(post => {
        const cleanedContent = cleanTextContent(post.content);
        const data = [post.title + " " + cleanedContent];

        const processedPost: CommunityPost = { ...post, data };
        return processedPost;
    });
}
