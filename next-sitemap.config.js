/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://sportzpulse.com',
  generateRobotsTxt: true, // This automatically creates your robots.txt file
  generateIndexSitemap: false, // Set to true only if you have >50,000 URLs
  exclude: [
    '/server-sitemap.xml',
    '/admin',
    '/auth/*'
  ], // Exclude dynamic sitemaps from the static build if using them
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://sportzpulse.com/server-sitemap.xml', // Link to your dynamic news sitemap
    ],
  },
}