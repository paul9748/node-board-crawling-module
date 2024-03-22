# Community Post Crawler

This project is a TypeScript module that crawls community posts from various websites. It uses Axios for fetching web pages and Cheerio for parsing HTML content.

## Features

- Crawl community posts from different websites
- Extract post details such as title, author, views, upvotes, content, comment count, and timestamp
- Customize selectors for different website structures
- Set a reference time to stop crawling older posts
- Process post data with site-specific functions

## Currently Supported Sites

- Ruliweb (`processForRuliweb`)

**Note: Additional site processing functions are currently being developed.**

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/community-post-crawler.git
```

2. Navigate to the project directory:

```bash
cd community-post-crawler
```

3. Install dependencies:

```bash
npm install
```

## Usage

1. Import the required functions from the module:

```typescript
import { crawlCommunityPosts } from "./crawler";
import { processForRuliweb } from "./siteProcessors";
```

2. Call the `crawlCommunityPosts` function with the appropriate options:

```typescript
crawlCommunityPosts({
  postListUrl: "https://bbs.ruliweb.com/best/humor_only/",
  pageQueryParam: "page",
  selectors: {
    title: ".subject_inner_text",
    postLink: ".title_wrapper",
    author: ".user_view,.nick",
    views: ".user_view ,.user_info",
    upvotes: ".user_view,.like",
    content: '[itemprop="articleBody"]',
    commentCount: ".reply_count",
    timestamp: ".regdate",
  },
  referenceTime: new Date("2024-03-22T04:39:00Z"),
})
  .then((posts) => {
    console.log(processForRuliweb(posts));
  })
  .catch((error) => {
    console.error("Error occurred during crawling:", error);
  });
```

3. Process the crawled posts using site-specific functions from `siteProcessors.ts`.

## Contributing

Contributions are welcome! If you find any issues or want to add new features, please submit a pull request or open an issue on the GitHub repository.

## License

This project is licensed under the [MIT License](LICENSE).
