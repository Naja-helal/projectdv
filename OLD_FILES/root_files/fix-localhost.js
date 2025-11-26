const fs = require('fs');
const path = require('path');

// قائمة الملفات التي تحتاج تحديث
const filesToUpdate = [
  'web/src/pages/Mosques.tsx',
  'web/src/pages/DynamicFields.tsx',
  'web/src/components/DynamicFieldsRenderer.tsx'
];

filesToUpdate.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // إضافة import إذا لم يكن موجود
    if (!content.includes("import { getApiUrl }") && !content.includes("from '@/lib/api'")) {
      const importMatch = content.match(/^(import.*?from.*?['"];?)/gm);
      if (importMatch && importMatch.length > 0) {
        const lastImport = importMatch[importMatch.length - 1];
        content = content.replace(lastImport, lastImport + "\nimport { getApiUrl } from '@/lib/api';");
      }
    }
    
    // استبدال جميع localhost:5175
    content = content.replace(/http:\/\/localhost:5175/g, "' + getApiUrl('");
    content = content.replace(/getApiUrl\('\//g, "getApiUrl('/");
    content = content.replace(/'\s*\+\s*getApiUrl\('/g, "getApiUrl('");
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  } else {
    console.log(`File not found: ${filePath}`);
  }
});

console.log('All files updated!');