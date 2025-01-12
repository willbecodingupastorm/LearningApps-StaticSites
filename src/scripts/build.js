const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const frontMatter = require('front-matter');

const CONTENT_DIR = path.join(__dirname, '../content');
const TEMPLATE_DIR = path.join(__dirname, '../templates');
const STATIC_DIR = path.join(__dirname, '../static');
const OUTPUT_DIR = path.join(__dirname, '../../public');

// Configure marked options
marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true
});

async function buildSite() {
    try {
        // Clean output directory
        await fs.emptyDir(OUTPUT_DIR);
        
        // Create necessary directories
        await fs.ensureDir(path.join(OUTPUT_DIR, 'css'));
        await fs.ensureDir(path.join(OUTPUT_DIR, 'js'));
        
        // Copy static files maintaining directory structure
        await fs.copy(
            path.join(STATIC_DIR, 'css'),
            path.join(OUTPUT_DIR, 'css')
        );
        
        // Read base template
        const baseTemplate = await fs.readFile(
            path.join(TEMPLATE_DIR, 'base.html'),
            'utf-8'
        );
        
        // Build pages
        const pagesDir = path.join(CONTENT_DIR, 'pages');
        const pages = await fs.readdir(pagesDir);
        
        for (const page of pages) {
            const content = await fs.readFile(
                path.join(pagesDir, page),
                'utf-8'
            );
            const { attributes, body } = frontMatter(content);
            const html = marked.parse(body);
            
            const finalHtml = baseTemplate
                .replace('{{title}}', attributes.title || 'Untitled')
                .replace('{{content}}', html);
            
            // Special handling for index.md - put it in the root
            const outputPath = page === 'index.md' 
                ? path.join(OUTPUT_DIR, 'index.html')
                : path.join(OUTPUT_DIR, page.replace('.md', '.html'));
                
            await fs.outputFile(outputPath, finalHtml);
        }
        
        console.log('Site built successfully!');
    } catch (error) {
        console.error('Error building site:', error);
        throw error;
    }
}

buildSite().catch(console.error);