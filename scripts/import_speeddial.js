const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_FILE = 'debug_items_DEL/speed-dial-2-export-2026-01-05.json';
const TARGET_FILE = 'data/bookmarks.json';
const BACKUP_FILE = 'data/bookmarks.backup.json';

// Resolve paths
const sourcePath = path.resolve(__dirname, '..', SOURCE_FILE);
const targetPath = path.resolve(__dirname, '..', TARGET_FILE);
const backupPath = path.resolve(__dirname, '..', BACKUP_FILE);

console.log(`Reading from: ${sourcePath}`);

try {
    const rawData = fs.readFileSync(sourcePath, 'utf8');
    const speedDialData = JSON.parse(rawData);
    
    // Process groups to categories
    const categories = speedDialData.groups.map(group => {
        return {
            id: `cat-${group.id}-${Date.now()}`, // Unique ID
            originalId: group.id, // For mapping
            name: group.title,
            bookmarks: []
        };
    });

    // Map for quick lookup
    const categoryMap = {};
    categories.forEach(cat => {
        categoryMap[cat.originalId] = cat;
    });

    // Process dials to bookmarks
    if (speedDialData.dials) {
        speedDialData.dials.forEach(dial => {
            const category = categoryMap[dial.idgroup];
            if (category) {
                category.bookmarks.push({
                    id: `bm-${dial.id}-${Date.now()}`,
                    title: dial.title,
                    url: dial.url,
                    icon: dial.thumbnail || null
                });
            } else {
                console.warn(`Warning: Bookmark "${dial.title}" (ID: ${dial.id}) belongs to unknown group ${dial.idgroup}`);
            }
        });
    }

    // Clean up categories (remove originalId and sort bookmarks if needed)
    const finalData = categories.map(cat => {
        delete cat.originalId;
        // Optional: Sort by something? Speed Dial keeps position in 'position' field
        return cat;
    });

    console.log(`Converted ${speedDialData.dials.length} bookmarks into ${categories.length} categories.`);

    // Backup existing file if it exists
    if (fs.existsSync(targetPath)) {
        console.log(`Backing up existing data to ${backupPath}`);
        fs.copyFileSync(targetPath, backupPath);
    }

    // Write new data
    fs.writeFileSync(targetPath, JSON.stringify(finalData, null, 2));
    console.log(`Successfully imported data to ${targetPath}`);

} catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
}
