# setup-shopify-remix-full.ps1
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

Write-Host "Starting full Shopify Remix setup..."

# --- Helper function to create file with directories ---
function Create-File($Path, $Content) {
    $dir = Split-Path $Path
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $Content | Out-File -FilePath $Path -Encoding utf8 -Force
    Write-Host "Created/Updated $Path"
}

# --- 1. AGENT_SPEC.md ---
$agentSpec = @"
# AGENT_SPEC.md — Shopify Remix App Guardrails

- Scaffolded with Shopify Remix App template.
- Stack: @shopify/shopify-app-remix v3, Remix 2, App Bridge, Polaris, Prisma session storage.
"@
Create-File "$PWD\AGENT_SPEC.md" $agentSpec

# --- 2. Components ---
$clientOnly = @"
import { useEffect, useState } from 'react';

export default function ClientOnly({ children }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted ? children : null;
}
"@
Create-File "$PWD\app\components\ClientOnly.jsx" $clientOnly

$safeIcon = @"
export default function SafeIcon() {
    return <span>✅</span>;
}
"@
Create-File "$PWD\app\components\SafeIcon.jsx" $safeIcon

# --- 3. Routes ---
$appProducts = @"
export default function AppProducts() {
    return <div>Products Page</div>;
}
"@
Create-File "$PWD\app\routes\app.products.jsx" $appProducts

# --- 4. ESLint ---
$eslint = @"
module.exports = {
  root: true,
  extends: ['@remix-run/eslint-config'],
  parserOptions: { sourceType: 'module' },
  rules: {}
};
"@
Create-File "$PWD\.eslintrc.cjs" $eslint

# --- 5. PostCSS ---
$postcss = @"
module.exports = {
    plugins: {
        autoprefixer: {},
    },
};
"@
Create-File "$PWD\postcss.config.js" $postcss

# --- 6. Vite Config ---
$vite = @"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    css: {
        postcss: './postcss.config.js'
    }
});
"@
Create-File "$PWD\vite.config.js" $vite

# --- 7. Update package.json ---
$packageJsonPath = "$PWD\package.json"
$packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

# Update scripts
$packageJson.scripts.build = "remix vite:build"
$packageJson.scripts.dev = "shopify app dev"
$packageJson.scripts.verify = "npm run lint && npm run build"
$packageJson.scripts.lint = "eslint ."

# Update engines
$packageJson.engines = @{ node = ">=18.17 <23" }

# Update overrides
$packageJson.overrides = @{
    "@remix-run/*" = "^2.15.0"
    "@shopify/app-bridge-react" = "^4.1.6"
    "@shopify/shopify-app-remix" = "^3.7.0"
}

# Save updated package.json
$packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $packageJsonPath -Encoding utf8 -Force
Write-Host "✅ package.json updated successfully."

Write-Host "✅ Full Shopify Remix setup complete!"
Write-Host "Run 'npm install' then 'npm run verify'"
