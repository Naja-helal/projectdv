// سكريبت لإصلاح جميع استخدامات API القديمة في المشروع
// نفذ هذا السكريبت من PowerShell

$rootPath = "c:\Users\naja2\Desktop\Tkamol2025\saud - Copy (4)\web\src"

# التعريفات: القديم -> الجديد
$replacements = @{
    # APIs Objects
    "categoryApi.getCategories" = "categoriesApi.getAll()"
    "categoryApi.createCategory" = "categoriesApi.create"
    "categoryApi.updateCategory" = "categoriesApi.update"
    "categoryApi.deleteCategory" = "categoriesApi.delete"
    
    "expenseApi.getExpenses\(\)" = "expensesApi.getAll()"
    "expenseApi.getExpenses" = "expensesApi.getAll"
    "expenseApi.createExpense" = "expensesApi.create"
    "expenseApi.updateExpense" = "expensesApi.update"
    "expenseApi.deleteExpense" = "expensesApi.delete"
    
    "projectApi.getProjects" = "projectsApi.getAll"
    "projectApi.createProject" = "projectsApi.create"
    "projectApi.updateProject" = "projectsApi.update"
    "projectApi.deleteProject" = "projectsApi.delete"
    
    "unitApi.getUnits" = "unitsApi.getAll"
    "unitApi.createUnit" = "unitsApi.create"
    "unitApi.updateUnit" = "unitsApi.update"
    "unitApi.deleteUnit" = "unitsApi.delete"
    
    "paymentMethodApi.getPaymentMethods" = "paymentMethodsApi.getAll"
    "paymentMethodApi.createPaymentMethod" = "paymentMethodsApi.create"
    "paymentMethodApi.updatePaymentMethod" = "paymentMethodsApi.update"
    "paymentMethodApi.deletePaymentMethod" = "paymentMethodsApi.delete"
    
    "projectItemApi.getProjectItems" = "projectItemsApi.getAll"
    "projectItemApi.createProjectItem" = "projectItemsApi.create"
    "projectItemApi.updateProjectItem" = "projectItemsApi.update"
    "projectItemApi.deleteProjectItem" = "projectItemsApi.delete"
    
    "clientApi.getClients" = "clientsApi.getAll"
    "clientApi.createClient" = "clientsApi.create"
    "clientApi.updateClient" = "clientsApi.update"
    "clientApi.deleteClient" = "clientsApi.delete"
    
    # Imports
    "from '@/lib/api'" = "from '@/lib/supabaseApi'"
    "import.*from '@/lib/api'" = "import { categoriesApi, expensesApi, projectsApi, unitsApi, paymentMethodsApi, projectItemsApi, clientsApi } from '@/lib/supabaseApi'"
}

Write-Host "🔍 جاري البحث عن ملفات TypeScript/TSX..." -ForegroundColor Cyan
$files = Get-ChildItem -Path $rootPath -Filter "*.tsx" -Recurse
Write-Host "📂 تم العثور على $($files.Count) ملف" -ForegroundColor Green

$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileChanged = $false
    
    foreach ($old in $replacements.Keys) {
        $new = $replacements[$old]
        if ($content -match $old) {
            $content = $content -replace $old, $new
            $fileChanged = $true
            Write-Host "  ✏️  $($file.Name): $old -> $new" -ForegroundColor Yellow
        }
    }
    
    if ($fileChanged) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        $totalReplacements++
        Write-Host "✅ تم تحديث: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n📊 ملخص التغييرات:" -ForegroundColor Cyan
Write-Host "  - ملفات تم تحديثها: $totalReplacements" -ForegroundColor Green
Write-Host "  - ملفات لم تتغير: $($files.Count - $totalReplacements)" -ForegroundColor Gray

if ($totalReplacements -gt 0) {
    Write-Host "`n✅ تم إصلاح جميع الاستدعاءات القديمة!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  لم يتم العثور على أي تغييرات" -ForegroundColor Yellow
}
