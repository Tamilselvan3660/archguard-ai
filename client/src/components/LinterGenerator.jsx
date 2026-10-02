import React, { useState } from 'react';

export default function LinterGenerator({ onShowToast }) {
  const [activeTab, setActiveTab] = useState('eslint'); // 'eslint', 'archunit', 'python', 'github'

  const eslintConfig = `// .eslintrc.js — Enforce Layer Architecture in Developer IDEs
module.exports = {
  plugins: ['boundaries'],
  settings: {
    'boundaries/elements': [
      { type: 'presentation', pattern: 'src/presentation/**' },
      { type: 'application', pattern: 'src/application/**' },
      { type: 'domain', pattern: 'src/domain/**' },
      { type: 'infrastructure', pattern: 'src/infrastructure/**' },
    ]
  },
  rules: {
    'boundaries/element-types': [
      2,
      {
        default: 'disallow',
        rules: [
          // RULE-001: Presentation can only access Application or Domain (NEVER Infrastructure)
          {
            from: 'presentation',
            allow: ['application', 'domain']
          },
          // RULE-002: Domain must NEVER import Infrastructure (DIP Invariant)
          {
            from: 'domain',
            allow: ['domain']
          },
          // Infrastructure implements Domain interfaces
          {
            from: 'infrastructure',
            allow: ['domain']
          }
        ]
      }
    ]
  }
};`;

  const archunitConfig = `package com.acme.ecommerce.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

@AnalyzeClasses(packages = "com.acme.ecommerce", importOptions = ImportOption.DoNotIncludeTests.class)
public class ArchitectureGovernanceTest {

    // RULE-001: Presentation must not access Infrastructure
    @ArchTest
    public static final ArchRule no_presentation_to_infrastructure =
        noClasses().that().resideInAPackage("..presentation..")
            .should().dependOnClassesThat().resideInAPackage("..infrastructure..")
            .because("Violates ARCHGUARD RULE-001: Layer Isolation Breach");

    // RULE-002: Domain must not access Infrastructure
    @ArchTest
    public static final ArchRule no_domain_to_infrastructure =
        noClasses().that().resideInAPackage("..domain..")
            .should().dependOnClassesThat().resideInAPackage("..infrastructure..")
            .because("Violates ARCHGUARD RULE-002: Clean Architecture Domain Invariant");

    // RULE-003: Slices must be free of cyclic dependencies
    @ArchTest
    public static final ArchRule domain_slices_must_be_free_of_cycles =
        com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices()
            .matching("com.acme.ecommerce.domain.(*)..")
            .should().beFreeOfCycles()
            .because("Violates ARCHGUARD RULE-003: Acyclic Dependency Principle");
}`;

  const pythonImportLinter = `# .importlinter (Python Clean Architecture Contract)
[importlinter]
root_package = ecommerce

[importlinter:contract:1]
name = Presentation cannot access Infrastructure (RULE-001)
type = forbidden
source_modules =
    ecommerce.presentation
forbidden_modules =
    ecommerce.infrastructure

[importlinter:contract:2]
name = Pure Domain Isolation (RULE-002)
type = forbidden
source_modules =
    ecommerce.domain
forbidden_modules =
    ecommerce.infrastructure
    ecommerce.presentation

[importlinter:contract:3]
name = Layered Architecture Hierarchy
type = layers
layers =
    ecommerce.presentation
    ecommerce.application
    ecommerce.domain
    ecommerce.infrastructure`;

  const githubActions = `# .github/workflows/archguard-governance.yml
name: ARCHGUARD AI Architecture Gatekeeper

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main ]

jobs:
  architecture-check:
    name: Architecture Drift & Invariant Gate
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js & Dependencies
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - run: npm ci

      - name: Run ArchGuard AST Drift Engine
        run: |
          npx archguard-ai scan --fail-on-drift CRITICAL,HIGH --format github-annotations

      - name: PR Architecture Guard Review Comment
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🛡️ **ARCHGUARD AI BLOCKED THIS PR**: 1 or more critical architectural layer violations were detected. Inspect local run with \`npx archguard-ai scan\`.'
            })`;

  const getCurrentSnippet = () => {
    if (activeTab === 'eslint') return { title: 'ESLint Boundaries (TypeScript / JavaScript)', filename: '.eslintrc.js', code: eslintConfig };
    if (activeTab === 'archunit') return { title: 'ArchUnit Test Suite (Java / Kotlin)', filename: 'ArchitectureGovernanceTest.java', code: archunitConfig };
    if (activeTab === 'python') return { title: 'Import-Linter Contract (Python)', filename: '.importlinter', code: pythonImportLinter };
    return { title: 'GitHub Actions Automated CI/CD Workflow', filename: 'archguard-governance.yml', code: githubActions };
  };

  const current = getCurrentSnippet();

  const handleCopy = () => {
    navigator.clipboard?.writeText(current.code);
    if (onShowToast) onShowToast(`Copied ${current.filename} to clipboard!`);
  };

  const handleDownload = () => {
    const blob = new Blob([current.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = current.filename;
    a.click();
    if (onShowToast) onShowToast(`Downloaded ${current.filename}!`);
  };

  return (
    <div className="content-body">
      <div className="page-header">
        <div>
          <h1 className="page-title">Developer Toolchain & CI Linter Code Generator</h1>
          <div className="page-subtitle">
            Export ready-to-run architecture linter configurations and automated CI/CD workflows for developer IDEs.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn-secondary" onClick={handleCopy}>
            📋 Copy Code
          </button>
          <button className="btn-primary" onClick={handleDownload}>
            📥 Download {current.filename}
          </button>
        </div>
      </div>

      <div className="card">
        {/* Navigation Tabs */}
        <div className="linter-nav-tabs">
          <button 
            className={`linter-tab-btn ${activeTab === 'eslint' ? 'active' : ''}`}
            onClick={() => setActiveTab('eslint')}
          >
            TypeScript / ESLint
          </button>
          <button 
            className={`linter-tab-btn ${activeTab === 'archunit' ? 'active' : ''}`}
            onClick={() => setActiveTab('archunit')}
          >
            Java / ArchUnit
          </button>
          <button 
            className={`linter-tab-btn ${activeTab === 'python' ? 'active' : ''}`}
            onClick={() => setActiveTab('python')}
          >
            Python / Import-Linter
          </button>
          <button 
            className={`linter-tab-btn ${activeTab === 'github' ? 'active' : ''}`}
            onClick={() => setActiveTab('github')}
          >
            GitHub Actions CI/CD
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{current.title}</h3>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Configuration Target: {current.filename}
            </div>
          </div>

          <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '4px' }}>
            READY FOR PRODUCTION
          </span>
        </div>

        <pre className="code-box" style={{ maxHeight: '520px', color: 'var(--accent-cyan)' }}>
          {current.code}
        </pre>
      </div>
    </div>
  );
}
