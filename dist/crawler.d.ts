import { CommunityPost, CrawlOptions } from './types';
export declare function crawlCommunityPosts(options: CrawlOptions, matcher: RegExp): Promise<CommunityPost[]>;
