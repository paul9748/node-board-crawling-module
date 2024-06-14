export interface CommunityPost {
    title: string;
    link: string;
    author: string;
    views: string;
    upvotes: string;
    content: string;
    commentCount: string;
    timestamp: string;
    data: string[];
    data2: JSON;
}
export interface ProcessingOptions {
    title?: RegExp;
    link?: RegExp;
    author?: RegExp;
    views?: RegExp;
    upvotes?: RegExp;
    content?: RegExp;
    commentCount?: RegExp;
    timestamp?: RegExp;

}
export interface CrawlOptions {
    postListUrl: string;
    pageQueryParam: string;
    selectors: {
        title: string;
        postLink: string;
        startpage: number;
        author: string;
        views: string;
        upvotes: string;
        content: string;
        commentCount: string;
        timestamp: string;
    };
    options: ProcessingOptions;
    referenceTime: Date;
}