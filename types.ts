export interface CommunityPost {
    title: string;
    link: string;
    author: string;
    views: string;
    upvotes: string;
    content: string;
    commentCount: string;
    timestamp: string;
    data: string;
}

export interface CrawlOptions {
    postListUrl: string;
    pageQueryParam: string;
    selectors: {
        title: string;
        postLink: string;
        author: string;
        views: string;
        upvotes: string;
        content: string;
        commentCount: string;
        timestamp: string;
    };
    referenceTime: Date;
}