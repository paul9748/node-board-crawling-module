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

        Object.entries(options).forEach(([key, value]) => {
            if (key !== 'timestamp' && value && processedPost[key] && typeof processedPost[key] === 'string') {
                const matchedPart = processedPost[key].match(value);
                processedPost[key] = matchedPart ? matchedPart[1] : '';
            }
        });

        return processedPost;
    });
}
