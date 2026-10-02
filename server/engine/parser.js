/**
 * ARCHGUARD AI — Static Code Parser & IR Extractor
 * 
 * Performs AST & regex pattern extraction to build a normalized 
 * Intermediate Representation (IR) of code elements and dependency links.
 */

import fs from 'fs';
import path from 'path';

export function parseRepository(repoPath) {
  const files = getAllFiles(repoPath);
  const elements = [];
  const dependencies = [];
  const techStack = {
    languages: {},
    frameworks: new Set(),
    infrastructure: new Set(),
    totalFiles: files.length,
    totalLines: 0
  };

  files.forEach((filePath) => {
    const relativePath = path.relative(repoPath, filePath).replace(/\\/g, '/');
    const ext = path.extname(filePath).toLowerCase();

    // Skip node_modules, git, dist
    if (relativePath.includes('node_modules') || relativePath.includes('.git') || relativePath.includes('dist')) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    techStack.totalLines += lines;

    // Detect language
    if (['.ts', '.tsx'].includes(ext)) techStack.languages['TypeScript'] = (techStack.languages['TypeScript'] || 0) + 1;
    else if (['.js', '.jsx'].includes(ext)) techStack.languages['JavaScript'] = (techStack.languages['JavaScript'] || 0) + 1;
    else if (ext === '.py') techStack.languages['Python'] = (techStack.languages['Python'] || 0) + 1;
    else if (ext === '.java') techStack.languages['Java'] = (techStack.languages['Java'] || 0) + 1;

    // Infer Layer & Module
    const layer = inferLayer(relativePath);
    const moduleName = path.basename(filePath, ext);

    const element = {
      id: relativePath,
      name: moduleName,
      path: relativePath,
      layer: layer,
      extension: ext,
      lineCount: lines,
      type: inferElementType(relativePath, content)
    };
    elements.push(element);

    // Extract Imports & Dependencies
    const fileImports = extractImports(content, relativePath, repoPath);
    fileImports.forEach((imp) => {
      dependencies.push({
        source: relativePath,
        target: imp.targetPath,
        rawImport: imp.rawImport,
        lineNumber: imp.lineNumber,
        type: 'IMPORT'
      });
    });

    // Framework detection rules
    if (content.includes('express')) techStack.frameworks.add('ExpressJS');
    if (content.includes('react')) techStack.frameworks.add('React');
    if (content.includes('executeQuery') || content.includes('SELECT')) techStack.infrastructure.add('PostgreSQL Database');
  });

  return {
    elements,
    dependencies,
    techStack: {
      languages: normalizePercentages(techStack.languages, techStack.totalFiles),
      frameworks: Array.from(techStack.frameworks),
      infrastructure: Array.from(techStack.infrastructure),
      totalFiles: techStack.totalFiles,
      totalLines: techStack.totalLines
    }
  };
}

function inferLayer(relPath) {
  const lower = relPath.toLowerCase();
  if (lower.includes('/presentation/') || lower.includes('/controllers/') || lower.includes('/components/') || lower.includes('/ui/')) {
    return 'presentation';
  }
  if (lower.includes('/application/') || lower.includes('/services/app') || lower.includes('/usecases/')) {
    return 'application';
  }
  if (lower.includes('/domain/') || lower.includes('/entities/') || lower.includes('/models/')) {
    return 'domain';
  }
  if (lower.includes('/infrastructure/') || lower.includes('/database/') || lower.includes('/db/') || lower.includes('/config/')) {
    return 'infrastructure';
  }
  return 'general';
}

function inferElementType(relPath, content) {
  if (content.includes('class ')) return 'Class';
  if (content.includes('function ') || content.includes('=>')) return 'Function';
  if (content.includes('interface ')) return 'Interface';
  return 'Module';
}

function extractImports(content, currentRelPath, repoPath) {
  const imports = [];
  const lines = content.split('\n');
  const importRegex = /import\s+.*?from\s+['"](.*?)['"]/g;

  lines.forEach((line, index) => {
    let match;
    while ((match = importRegex.exec(line)) !== null) {
      const rawPath = match[1];
      if (rawPath.startsWith('.')) {
        const resolvedAbs = path.resolve(path.dirname(path.join(repoPath, currentRelPath)), rawPath);
        let resolvedRel = path.relative(repoPath, resolvedAbs).replace(/\\/g, '/');
        
        // Append extension if missing
        if (!resolvedRel.endsWith('.ts') && !resolvedRel.endsWith('.js')) {
          if (fs.existsSync(path.join(repoPath, resolvedRel + '.ts'))) resolvedRel += '.ts';
          else if (fs.existsSync(path.join(repoPath, resolvedRel + '.js'))) resolvedRel += '.js';
        }

        imports.push({
          targetPath: resolvedRel,
          rawImport: rawPath,
          lineNumber: index + 1
        });
      }
    }
  });

  return imports;
}

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function normalizePercentages(languagesObj, total) {
  const result = {};
  for (const [lang, count] of Object.entries(languagesObj)) {
    result[lang] = Math.round((count / total) * 100) + '%';
  }
  return result;
}
